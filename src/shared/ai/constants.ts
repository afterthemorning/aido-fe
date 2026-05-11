import { AIProvider, type ProviderProfile, type AIConnectionConfig } from './types';

/** 默认 AI 连接配置 */
export const DEFAULT_AI_CONFIG: Partial<AIConnectionConfig> = {
  provider: AIProvider.Enterprise,
  temperature: 0.7,
  max_tokens: 4096,
  timeout: 60000,
  model_name: 'enterprise-llm-v1',
};

/**
 * 各 Provider 独立配置档案
 * 隔离：模型列表、默认参数、Token限制、温度范围、认证方式各不相同
 */
export const PROVIDER_PROFILES: Record<AIProvider, ProviderProfile> = {
  [AIProvider.OpenAI]: {
    type: AIProvider.OpenAI,
    displayName: 'OpenAI Compatible',
    description: 'OpenAI / DeepSeek / 通义千问等兼容接口',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 65536 },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', contextWindow: 65536 },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385 },
      { id: 'qwen-turbo', name: 'Qwen Turbo', contextWindow: 32768 },
      { id: 'qwen-plus', name: 'Qwen Plus', contextWindow: 131072 },
    ],
    defaults: { model: 'deepseek-chat', temperature: 0.7, maxTokens: 4096, timeout: 60000 },
    extraParams: [
      { key: 'top_p', label: 'Top P', type: 'number', defaultValue: 0.9, description: '采样阈值' },
      { key: 'frequency_penalty', label: 'Frequency Penalty', type: 'number', defaultValue: 0, description: '频率惩罚' },
    ],
    authMethods: [{ type: 'api_key', label: 'API Key' }],
    defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
    supportsStreaming: true,
    supportsMultimodal: false,
    temperatureRange: [0, 2],
    maxTokensLimit: 32768,
  },
  [AIProvider.VertexAI]: {
    type: AIProvider.VertexAI,
    displayName: 'Google Vertex AI',
    description: 'Google Cloud Vertex AI 托管模型',
    models: [
      { id: 'chat-gemini-1.5-pro-002', name: 'Gemini 1.5 Pro', contextWindow: 1048576 },
      { id: 'chat-gemini-1.5-flash-002', name: 'Gemini 1.5 Flash', contextWindow: 1048576 },
      { id: 'chat-gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', contextWindow: 1048576 },
      { id: 'chat-gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576 },
    ],
    defaults: { model: 'chat-gemini-1.5-pro-002', temperature: 0.7, maxTokens: 8192, timeout: 120000 },
    extraParams: [
      { key: 'location', label: 'Region', type: 'string', defaultValue: 'us-central1', description: '模型部署区域' },
      { key: 'top_p', label: 'Top P', type: 'number', defaultValue: 0.9, description: '采样阈值' },
      { key: 'top_k', label: 'Top K', type: 'number', defaultValue: 40, description: '候选数量' },
    ],
    authMethods: [
      { type: 'bearer_token', label: 'GCP Bearer Token' },
      { type: 'api_key', label: 'API Key' },
    ],
    defaultApiUrl: 'http://localhost:8099/api/v1/chat',
    supportsStreaming: true,
    supportsMultimodal: true,
    temperatureRange: [0, 1],
    maxTokensLimit: 8192,
  },
  [AIProvider.Enterprise]: {
    type: AIProvider.Enterprise,
    displayName: 'Enterprise AI',
    description: '企业自有 AI 平台（默认激活）',
    models: [
      { id: 'enterprise-llm-v1', name: 'Enterprise LLM v1', contextWindow: 32768 },
      { id: 'enterprise-llm-v2', name: 'Enterprise LLM v2 (Latest)', contextWindow: 65536 },
    ],
    defaults: { model: 'enterprise-llm-v1', temperature: 0.3, maxTokens: 2048, timeout: 30000 },
    extraParams: [
      { key: 'deployment_id', label: 'Deployment ID', type: 'string', defaultValue: '', description: '企业部署标识' },
      { key: 'tenant_id', label: 'Tenant ID', type: 'string', defaultValue: '', description: '租户 ID' },
      { key: 'genai_engine_api', label: 'GenAI Engine API', type: 'string', defaultValue: 'https://api.loreal.net/global/it4it/btdp-genaiengine/v1', description: 'GenAI API 网关地址' },
      { key: 'genai_context_id', label: 'GenAI Context ID', type: 'string', defaultValue: '', description: 'GenAI 上下文 ID（必填）' },
      { key: 'genai_config_id', label: 'GenAI Config ID', type: 'string', defaultValue: 'default', description: 'GenAI 配置 ID' },
    ],
    authMethods: [
      { type: 'api_key', label: 'API Key' },
      { type: 'oauth', label: 'OAuth 2.0' },
    ],
    defaultApiUrl: 'http://localhost:8099/api/v1/chat',
    supportsStreaming: true,
    supportsMultimodal: false,
    temperatureRange: [0, 1],
    maxTokensLimit: 8192,
  },
  [AIProvider.Peer]: {
    type: AIProvider.Peer,
    displayName: 'Peer AI Platform',
    description: '平级第三方 AI 平台',
    models: [
      { id: 'peer-llm-v1', name: 'Peer LLM v1', contextWindow: 16384 },
      { id: 'peer-llm-v2', name: 'Peer LLM v2', contextWindow: 32768 },
    ],
    defaults: { model: 'peer-llm-v1', temperature: 0.5, maxTokens: 4096, timeout: 45000 },
    extraParams: [
      { key: 'platform_id', label: 'Platform ID', type: 'string', defaultValue: '', description: '平台标识' },
    ],
    authMethods: [
      { type: 'api_key', label: 'API Key' },
      { type: 'bearer_token', label: 'Bearer Token' },
    ],
    defaultApiUrl: 'http://localhost:8099/api/v1/chat',
    supportsStreaming: true,
    supportsMultimodal: false,
    temperatureRange: [0, 2],
    maxTokensLimit: 32768,
  },
};

/** Provider 模型查询快捷映射 */
export function getProfile(provider: AIProvider): ProviderProfile {
  return PROVIDER_PROFILES[provider];
}

/** 根据 Provider 获取默认模型 */
export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_PROFILES[provider]?.defaults.model ?? 'gpt-3.5-turbo';
}

/** 根据 Provider 获取默认 Temperature */
export function getDefaultTemperature(provider: AIProvider): number {
  return PROVIDER_PROFILES[provider]?.defaults.temperature ?? 0.7;
}

/** 根据 Provider 获取默认最大 Tokens */
export function getDefaultMaxTokens(provider: AIProvider): number {
  return PROVIDER_PROFILES[provider]?.defaults.maxTokens ?? 4096;
}

/** 最大上下文消息数 */
export const MAX_CONTEXT_MESSAGES = 50;
