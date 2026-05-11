package model

// ChatRequest 前端 Enterprise AI Adapter 发来的聊天请求体
// 字段对齐：src/shared/ai/services.ts -> enterpriseAdapter.buildRequestBody
type ChatRequest struct {
	Model          string             `json:"model"`
	DeploymentID   string             `json:"deployment_id"`
	TenantID       string             `json:"tenant_id"`
	SystemPrompt   string             `json:"system_prompt"`
	Messages       []ChatMessage      `json:"messages"`
	Temperature    float64            `json:"temperature"`
	MaxTokens      int                `json:"max_tokens"`
	TopP           *float64           `json:"top_p"`
	Stream         bool               `json:"stream"`
	ConversationID string             `json:"conversation_id"`
	ParentID       string             `json:"parent_id"`
	CustomParams   map[string]string  `json:"custom_params"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatResponse 非流式响应
// 字段对齐：enterpriseAdapter.parseResponse
type ChatResponse struct {
	Content        string       `json:"content"`
	Model          string       `json:"model"`
	ConversationID string       `json:"conversation_id,omitempty"`
	MessageID      string       `json:"message_id,omitempty"`
	Usage          *TokenUsage  `json:"usage,omitempty"`
}

// StreamChunk SSE 流式数据块
// 前端解析：enterpriseAdapter.parseStreamChunk
type StreamChunk struct {
	Content string `json:"content"`
	Done    bool   `json:"done,omitempty"`
}

// ErrorResponse 统一错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Detail  string `json:"detail,omitempty"`
}

// TokenUsage Token 使用统计
type TokenUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// TestRequest 测试连接请求
type TestRequest struct {
	Messages []ChatMessage `json:"messages"`
}
