/**
 * 核心 AI 连接模块类型定义
 *
 * 架构对齐：agentic-platform-samples
 * 参考分层：Context → Config → Model/Provider → Generation
 *
 * - Provider: 各AI平台独立配置与参数映射
 * - Context: 对话上下文/业务场景隔离
 * - Config: LLM 配置绑定（模型、system_prompt、参数）
 * - Generation: 实际推理执行
 * - Conversation: 多轮对话状态管理（conversation_id + parent_id）
 */

/** 模型提供商枚举 */
export enum AIProvider {
  /** OpenAI 兼容接口（含 DeepSeek、通义千问等） */
  OpenAI = 'openai',
  /** Google Vertex AI */
  VertexAI = 'vertex_ai',
  /** 企业自有 AI 平台 */
  Enterprise = 'enterprise',
  /** 其他平级 AI 平台 */
  Peer = 'peer',
}

/** 提供商完整档案（独立配置结构与默认值） */
export interface ProviderProfile {
  type: AIProvider;
  displayName: string;
  description: string;
  /** 该提供商支持的全部模型 */
  models: ProviderModel[];
  /** 该提供商的默认配置 */
  defaults: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
  /** 提供商特有的额外参数及默认值 */
  extraParams: ProviderExtraParam[];
  /** 该提供商支持的认证方式 */
  authMethods: { type: 'api_key' | 'oauth' | 'bearer_token'; label: string }[];
  /** 默认 API 端点（可为空由用户填写） */
  defaultApiUrl?: string;
  /** 是否支持流式输出 */
  supportsStreaming: boolean;
  /** 是否支持多模态 */
  supportsMultimodal: boolean;
  /** 温度值有效范围 */
  temperatureRange: [number, number];
  /** 最大 Token 上限 */
  maxTokensLimit: number;
}

/** 提供商支持的模型 */
export interface ProviderModel {
  id: string;
  name: string;
  /** 模型上下文窗口 */
  contextWindow?: number;
  /** 模型备注 */
  note?: string;
}

/** 提供商额外参数定义 */
export interface ProviderExtraParam {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  defaultValue?: string | number | boolean;
  description?: string;
}

/** 提供商连接配置 */
export interface ProviderConfig {
  type: AIProvider;
  /** API 端点 URL */
  api_url: string;
  /** 认证凭证 */
  api_key?: string;
  /** 企业/平台名称标识 */
  name?: string;
  /** 额外认证参数 */
  auth_params?: Record<string, string>;
}

/** AI 配置（对标 sample 的 Config 层：绑定 model/args/system_prompt） */
export interface AIConfig {
  id?: string;
  name?: string;
  type?: 'chat' | 'image' | 'prompt' | 'data_process';
  llm: {
    provider: AIProvider;
    model: string;
    args: Record<string, unknown>;
  };
  system_prompt?: string;
  /** 单轮对话模式（无记忆） */
  is_single_turn?: boolean;
  tools?: {
    toolkit: { name: string; config?: Record<string, unknown> }[];
    max_rounds?: number;
    min_rounds?: number;
  };
  params?: Record<string, unknown>;
}

/** 对话上下文 */
export interface AIContext {
  id: string;
  name?: string;
  configs: AIConfig[];
  provider_connections?: ProviderConfig[];
}

/** 对话消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant';

/** 对话消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  id?: string;
  timestamp?: number;
}

/** 多轮对话状态（对标 sample 的 conversation_id + parent_id） */
export interface ConversationState {
  /** 会话唯一 ID */
  conversationId: string;
  /** 上一条 AI 消息的 ID（用于多轮对话链接） */
  parentId: string | null;
  /** 消息历史 */
  messages: ChatMessage[];
  /** 是否为单轮模式 */
  isSingleTurn: boolean;
}

/** AI 连接全配置（快捷组合） */
export interface AIConnectionConfig {
  id?: string;
  name?: string;
  provider: AIProvider;
  url?: string;
  api_key?: string;
  model_name?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
  headers?: Record<string, string>;
  proxy?: string;
  skip_ssl_verify?: boolean;
  custom_params?: Record<string, string>;
  /** 提供商专属扩展参数 */
  providerExtra?: Record<string, unknown>;
}

/** AI 完成请求 */
export interface AICompletionRequest {
  config: AIConnectionConfig;
  messages: ChatMessage[];
  stream?: boolean;
  /** 多轮对话状态 */
  conversation?: {
    conversationId?: string;
    parentId?: string | null;
  };
}

/** AI 完成响应（含对话状态） */
export interface AICompletionResponse {
  content: string;
  model: string;
  /** 用于下一轮对话的 conversation_id */
  conversationId?: string;
  /** 本条 AI 消息的 ID（用于 parent_id 链接） */
  messageId?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** 数据处理器配置 */
export interface AIProcessorConfig {
  connection: AIConnectionConfig;
  processing_template?: string;
  output_fields?: Record<string, string>;
  error_generation?: {
    enabled: boolean;
    severity?: 'info' | 'warning' | 'critical';
    category?: string;
  };
}

/** 数据处理结果 */
export interface AIProcessResult {
  output: Record<string, unknown>;
  errors?: AIProcessError[];
  raw_response?: string;
}

/** AI 处理生成的错误信息 */
export interface AIProcessError {
  severity: 'info' | 'warning' | 'critical';
  category: string;
  title: string;
  description: string;
  suggestion?: string;
}

/** Agent 定义 */
export interface AgentDefinition {
  id?: string;
  name: string;
  description?: string;
  model: string;
  system_prompt: string;
  tools?: string[];
  managed_by?: string[];
  manages?: string[];
}
