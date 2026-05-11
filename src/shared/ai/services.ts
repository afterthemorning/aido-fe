/**
 * 核心 AI 服务层
 *
 * 架构：Provider Adapter 模式
 * - 每个 Provider 拥有独立的请求体构建、响应解析、认证逻辑
 * - 支持多轮对话（conversation_id + parent_id）
 * - 支持流式和非流式调用
 */

import { AIProvider, type AIConnectionConfig, type ChatMessage, type AICompletionRequest, type AICompletionResponse, type AIProcessorConfig, type AIProcessResult, type AIProcessError } from './types';
import { DEFAULT_AI_CONFIG, getProfile } from './constants';

// ──────────────────────────────────────────
// Provider Adapter 接口
// ──────────────────────────────────────────

interface ProviderAdapter {
  /** 构建请求头（各 Provider 认证独立） */
  buildHeaders(config: AIConnectionConfig): Record<string, string>;
  /** 构建请求体（各 Provider 参数映射独立） */
  buildRequestBody(config: AIConnectionConfig, messages: ChatMessage[]): Record<string, unknown>;
  /** 解析非流式响应 */
  parseResponse(data: Record<string, unknown>): AICompletionResponse;
  /** 解析流式数据块 */
  parseStreamChunk(chunk: string): string;
}

// ──────────────────────────────────────────
// OpenAI 兼容 Adapter
// ──────────────────────────────────────────

const openaiAdapter: ProviderAdapter = {
  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      ...config.headers,
    };
  },

  buildRequestBody(config, messages) {
    const profile = getProfile(AIProvider.OpenAI);
    const body: Record<string, unknown> = {
      model: config.model_name || profile.defaults.model,
      messages: [
        ...(config.system_prompt ? [{ role: 'system' as const, content: config.system_prompt }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: config.temperature ?? profile.defaults.temperature,
      max_tokens: config.max_tokens ?? profile.defaults.maxTokens,
    };
    if (config.custom_params) {
      Object.entries(config.custom_params).forEach(([k, v]) => { body[k] = v; });
    }
    return body;
  },

  parseResponse(data) {
    const choice = (data.choices as Array<Record<string, unknown>>)?.[0];
    const msg = choice?.message as Record<string, string> | undefined;
    return {
      content: msg?.content || '',
      model: (data.model as string) || '',
      conversationId: undefined,
      messageId: undefined,
      usage: data.usage
        ? {
            prompt_tokens: (data.usage as Record<string, number>).prompt_tokens || 0,
            completion_tokens: (data.usage as Record<string, number>).completion_tokens || 0,
            total_tokens: (data.usage as Record<string, number>).total_tokens || 0,
          }
        : undefined,
    };
  },

  parseStreamChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('data: ')) return '';
    const data = trimmed.slice(6);
    if (data === '[DONE]') return '';
    try {
      const parsed = JSON.parse(data);
      return parsed.choices?.[0]?.delta?.content || '';
    } catch {
      return '';
    }
  },
};

// ──────────────────────────────────────────
// Vertex AI Adapter
// ──────────────────────────────────────────

const vertexAiAdapter: ProviderAdapter = {
  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      ...config.headers,
    };
  },

  buildRequestBody(config, messages) {
    const profile = getProfile(AIProvider.VertexAI);
    const systemMessages = config.system_prompt
      ? [{ role: 'user' as const, parts: [{ text: config.system_prompt }] }]
      : [];
    return {
      model: config.model_name || profile.defaults.model,
      system_instruction: config.system_prompt ? { parts: [{ text: config.system_prompt }] } : undefined,
      contents: [
        ...systemMessages,
        ...messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }],
        })),
      ],
      generationConfig: {
        temperature: config.temperature ?? profile.defaults.temperature,
        maxOutputTokens: config.max_tokens ?? profile.defaults.maxTokens,
        ...config.custom_params,
      },
    };
  },

  parseResponse(data) {
    const candidate = (data.candidates as Array<Record<string, unknown>>)?.[0];
    const content = candidate?.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<Record<string, unknown>> | undefined;
    return {
      content: parts?.map((p) => p.text).filter(Boolean).join('') || '',
      model: (data.model as string) || '',
      usage: data.usageMetadata
        ? {
            prompt_tokens: (data.usageMetadata as Record<string, number>).promptTokenCount || 0,
            completion_tokens: (data.usageMetadata as Record<string, number>).candidatesTokenCount || 0,
            total_tokens: (data.usageMetadata as Record<string, number>).totalTokenCount || 0,
          }
        : undefined,
    };
  },

  parseStreamChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('data: ')) return '';
    const data = trimmed.slice(6);
    try {
      const parsed = JSON.parse(data);
      const parts = parsed.candidates?.[0]?.content?.parts;
      return parts?.map((p: Record<string, unknown>) => p.text).filter(Boolean).join('') || '';
    } catch {
      return '';
    }
  },
};

// ──────────────────────────────────────────
// Enterprise AI Adapter（企业平台独立配置）
// ──────────────────────────────────────────

const enterpriseAdapter: ProviderAdapter = {
  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      'X-Deployment-Id': (config.providerExtra?.deployment_id as string) || '',
      'X-Tenant-Id': (config.providerExtra?.tenant_id as string) || '',
      ...config.headers,
    };
  },

  buildRequestBody(config, messages) {
    const profile = getProfile(AIProvider.Enterprise);
    return {
      model: config.model_name || profile.defaults.model,
      deployment_id: config.providerExtra?.deployment_id || '',
      tenant_id: config.providerExtra?.tenant_id || '',
      // GenAI 服务配置
      genai_engine_api: config.providerExtra?.genai_engine_api as string || '',
      genai_context_id: config.providerExtra?.genai_context_id as string || '',
      genai_config_id: config.providerExtra?.genai_config_id as string || '',
      system_prompt: config.system_prompt || '',
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: config.temperature ?? profile.defaults.temperature,
      max_tokens: config.max_tokens ?? profile.defaults.maxTokens,
      top_p: config.custom_params?.top_p ? Number(config.custom_params.top_p) : undefined,
    };
  },

  parseResponse(data) {
    const choice = (data.choices as Array<Record<string, unknown>> | undefined)?.[0];
    const msgContent = choice?.message ? (choice.message as Record<string, string>).content : undefined;
    return {
      content: (data.content as string) || msgContent || '',
      model: (data.model as string) || '',
      conversationId: data.conversation_id as string | undefined,
      messageId: data.message_id as string | undefined,
      usage: data.usage as AICompletionResponse['usage'],
    };
  },

  parseStreamChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('data: ')) return '';
    const data = trimmed.slice(6);
    if (data === '[DONE]') return '';
    try {
      const parsed = JSON.parse(data);
      return parsed.content || parsed.choices?.[0]?.delta?.content || '';
    } catch {
      return '';
    }
  },
};

// ──────────────────────────────────────────
// Peer AI Platform Adapter
// ──────────────────────────────────────────

const peerAdapter: ProviderAdapter = {
  buildHeaders(config) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`,
      'X-Platform-Id': (config.providerExtra?.platform_id as string) || '',
      ...config.headers,
    };
  },

  buildRequestBody(config, messages) {
    const profile = getProfile(AIProvider.Peer);
    return {
      model: config.model_name || profile.defaults.model,
      platform_id: config.providerExtra?.platform_id || '',
      messages: [
        ...(config.system_prompt ? [{ role: 'system', content: config.system_prompt }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: config.temperature ?? profile.defaults.temperature,
      max_tokens: config.max_tokens ?? profile.defaults.maxTokens,
    };
  },

  parseResponse(data) {
    const choice = (data.choices as Array<Record<string, unknown>>)?.[0];
    return {
      content: (choice?.message as Record<string, string> | undefined)?.content || (data.content as string) || '',
      model: (data.model as string) || '',
      conversationId: data.conversation_id as string | undefined,
      messageId: data.message_id as string | undefined,
      usage: data.usage as AICompletionResponse['usage'],
    };
  },

  parseStreamChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('data: ')) return '';
    const data = trimmed.slice(6);
    if (data === '[DONE]') return '';
    try {
      const parsed = JSON.parse(data);
      return parsed.choices?.[0]?.delta?.content || parsed.content || '';
    } catch {
      return '';
    }
  },
};

// ──────────────────────────────────────────
// Adapter 路由
// ──────────────────────────────────────────

function getAdapter(provider: AIProvider): ProviderAdapter {
  switch (provider) {
    case AIProvider.OpenAI: return openaiAdapter;
    case AIProvider.VertexAI: return vertexAiAdapter;
    case AIProvider.Enterprise: return enterpriseAdapter;
    case AIProvider.Peer: return peerAdapter;
  }
}

// ──────────────────────────────────────────
// 流式响应解析
// ──────────────────────────────────────────

async function* parseStream(response: Response, adapter: ProviderAdapter): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const text = adapter.parseStreamChunk(line);
        if (text) yield text;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ──────────────────────────────────────────
// 对外 API
// ──────────────────────────────────────────

/**
 * 调用 AI 完成接口（非流式）
 * 支持所有 Provider，自动路由到对应 Adapter
 */
export async function callAICompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
  const { config, messages, conversation } = request;
  const profile = getProfile(config.provider);
  const adapter = getAdapter(config.provider);
  const url = config.url || profile.defaultApiUrl;
  if (!url) throw new Error(`[${profile.displayName}] API URL not configured`);

  const mergedConfig: AIConnectionConfig = { ...DEFAULT_AI_CONFIG, ...config };

  const body = adapter.buildRequestBody(mergedConfig, messages);
  if (conversation?.conversationId) {
    body.conversation_id = conversation.conversationId;
  }
  if (conversation?.parentId) {
    body.parent_id = conversation.parentId;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: adapter.buildHeaders(mergedConfig),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(mergedConfig.timeout || profile.defaults.timeout),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`[${profile.displayName}] API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return adapter.parseResponse(data);
}

/**
 * 调用 AI 完成接口（流式）
 */
export async function* callAICompletionStream(request: AICompletionRequest): AsyncGenerator<string> {
  const { config, messages, conversation } = request;
  const profile = getProfile(config.provider);
  const adapter = getAdapter(config.provider);
  const url = config.url || profile.defaultApiUrl;
  if (!url) throw new Error(`[${profile.displayName}] API URL not configured`);

  const mergedConfig: AIConnectionConfig = { ...DEFAULT_AI_CONFIG, ...config };

  const body = adapter.buildRequestBody(mergedConfig, messages);
  if (conversation?.conversationId) {
    body.conversation_id = conversation.conversationId;
  }
  if (conversation?.parentId) {
    body.parent_id = conversation.parentId;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { ...adapter.buildHeaders(mergedConfig), Accept: 'text/event-stream' },
    body: JSON.stringify({ ...body, stream: true }),
    signal: AbortSignal.timeout(mergedConfig.timeout || profile.defaults.timeout),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`[${profile.displayName}] API error (${response.status}): ${errText}`);
  }

  yield* parseStream(response, adapter);
}

/**
 * 发送聊天消息（对话场景）
 * 支持流式输出，自动管理多轮对话状态
 */
export async function sendChatMessage(
  config: AIConnectionConfig,
  messages: ChatMessage[],
  onStream?: (chunk: string) => void,
  conversation?: { conversationId?: string; parentId?: string | null },
): Promise<AICompletionResponse> {
  if (onStream) {
    let fullContent = '';
    const stream = callAICompletionStream({ config, messages, stream: true, conversation });
    for await (const chunk of stream) {
      fullContent += chunk;
      onStream(chunk);
    }
    return { content: fullContent, model: config.model_name || '' };
  }
  return callAICompletion({ config, messages, conversation });
}

/**
 * 处理业务数据（Processor 场景）
 */
export async function processWithAI(
  processorConfig: AIProcessorConfig,
  inputData: Record<string, unknown>,
): Promise<AIProcessResult> {
  const { connection, processing_template, error_generation } = processorConfig;

  const systemPrompt = processing_template
    ? processing_template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(inputData[key] ?? `{{${key}}}`))
    : `You are a data processor. Analyze the following data and provide insights.
If you find any issues, generate structured error information.

Input data:
${JSON.stringify(inputData, null, 2)}

Please respond in JSON:
{
  "analysis": "...",
  "errors": [{ "severity": "info|warning|critical", "category": "...", "title": "...", "description": "...", "suggestion": "..." }]
}`;

  const messages: ChatMessage[] = [{ role: 'user', content: systemPrompt }];
  const response = await callAICompletion({ config: connection, messages });
  const result = parseAIProcessResponse(response.content, error_generation?.enabled !== false);
  result.raw_response = response.content;
  return result;
}

function parseAIProcessResponse(raw: string, parseErrors: boolean): AIProcessResult {
  const output: Record<string, unknown> = { raw };
  const errors: AIProcessError[] = [];
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.analysis) output.analysis = parsed.analysis;
      if (parseErrors && Array.isArray(parsed.errors)) {
        for (const e of parsed.errors) {
          if (e.title && e.description) {
            errors.push({
              severity: e.severity || 'warning',
              category: e.category || 'analysis',
              title: e.title,
              description: e.description,
              suggestion: e.suggestion,
            });
          }
        }
      }
      Object.entries(parsed).forEach(([k, v]) => {
        if (k !== 'analysis' && k !== 'errors') output[k] = v;
      });
    }
  } catch {
    output.analysis = raw;
  }
  return { output, errors };
}

/**
 * 测试 AI 连接
 */
export async function testAIConnection(config: AIConnectionConfig): Promise<{ success: boolean; message: string; latency?: number }> {
  const start = Date.now();
  try {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Reply with exactly: OK' }];
    await callAICompletion({ config, messages });
    return { success: true, message: 'Connection successful', latency: Date.now() - start };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * 创建 AI Context
 */
export async function createContext(
  _providerConnections: import('./types').ProviderConfig[],
  _configs: import('./types').AIConfig[],
): Promise<import('./types').AIContext> {
  return { id: `ctx-${Date.now()}`, name: 'Local AI Context', provider_connections: _providerConnections, configs: _configs };
}

/**
 * 创建 AI Config
 */
export function createConfig(cfg: {
  provider: AIProvider;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}): import('./types').AIConfig {
  return {
    id: `cfg-${Date.now()}`,
    name: cfg.model,
    type: 'chat',
    llm: { provider: cfg.provider, model: cfg.model, args: { temperature: cfg.temperature ?? 0.7, max_tokens: cfg.max_tokens ?? 4096 } },
    system_prompt: cfg.system_prompt,
  };
}

/**
 * 将 AIConfig 转为 AIConnectionConfig
 */
export function configToConnection(
  aiConfig: import('./types').AIConfig,
  providerConfig?: import('./types').ProviderConfig,
): AIConnectionConfig {
  return {
    provider: aiConfig.llm.provider,
    model_name: aiConfig.llm.model,
    system_prompt: aiConfig.system_prompt,
    temperature: (aiConfig.llm.args?.temperature as number) ?? 0.7,
    max_tokens: (aiConfig.llm.args?.max_tokens as number) ?? 4096,
    url: providerConfig?.api_url,
    api_key: providerConfig?.api_key,
  };
}
