export { AIProvider } from './types';
export type {
  AIConnectionConfig,
  AIConfig,
  AIContext,
  ProviderConfig,
  ProviderProfile,
  ProviderModel,
  ProviderExtraParam,
  ChatMessage,
  MessageRole,
  ConversationState,
  AICompletionRequest,
  AICompletionResponse,
  AIProcessorConfig,
  AIProcessResult,
  AIProcessError,
  AgentDefinition,
} from './types';

export {
  DEFAULT_AI_CONFIG,
  PROVIDER_PROFILES,
  MAX_CONTEXT_MESSAGES,
  getProfile,
  getDefaultModel,
  getDefaultTemperature,
  getDefaultMaxTokens,
} from './constants';

export {
  createContext,
  createConfig,
  configToConnection,
  callAICompletion,
  callAICompletionStream,
  sendChatMessage,
  processWithAI,
  testAIConnection,
} from './services';
