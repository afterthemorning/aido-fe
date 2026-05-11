package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/aido/ai-backend/config"
	"github.com/aido/ai-backend/model"
)

// LLMProvider 抽象 LLM 调用接口
type LLMProvider interface {
	Chat(req *model.ChatRequest) (*model.ChatResponse, error)
	ChatStream(req *model.ChatRequest, sendChunk func(*model.StreamChunk)) (*model.ChatResponse, error)
}

func NewProvider(cfg *config.Config) LLMProvider {
	switch cfg.LLMBackend {
	case "genai":
		return &GenAIProvider{cfg: cfg}
	case "openai":
		return &OpenAIProvider{cfg: cfg}
	default:
		return &MockProvider{cfg: cfg}
	}
}

// ═══════════════════════════════════════════
// GenAI Provider — 对标 innovation-lift-7
// 端点: /contexts/{context_id}/configs/{config_id}/generations
// 认证: Bearer token
// 请求: {"message": "..."}
// 响应: {"messages": [{"type":"ai","data":{"content":"..."}}]}
// ═══════════════════════════════════════════

type GenAIProvider struct {
	cfg *config.Config
}

func (p *GenAIProvider) Chat(req *model.ChatRequest) (*model.ChatResponse, error) {
	// 取最后一条用户消息作为 prompt
	prompt := p.lastUserMessage(req.Messages)
	if prompt == "" {
		return nil, fmt.Errorf("no user message found")
	}

	url := fmt.Sprintf("%s/contexts/%s/configs/%s/generations",
		p.cfg.GenaiEngineAPI, p.cfg.GenaiContextID, p.cfg.GenaiConfigID)

	payload := map[string]interface{}{
		"message": prompt,
	}
	// 多轮对话支持
	if req.ConversationID != "" {
		payload["conversation_id"] = req.ConversationID
	}
	if req.ParentID != "" {
		payload["parent_id"] = req.ParentID
	}

	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("genai: create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	// 认证策略：先读取 Authorization 头，如果没有则用配置中的 API Key
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.OpenAIAPIKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("genai: request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("genai: status %d: %s", resp.StatusCode, string(respBody))
	}

	// 解析 GenAI 响应（messages 列表格式）
	var genaiResp struct {
		Messages []struct {
			Type string `json:"type"`
			Data struct {
				Content string `json:"content"`
				ID      string `json:"id"`
			} `json:"data"`
		} `json:"messages"`
		ConversationID string `json:"conversation_id"`
	}

	if err := json.Unmarshal(respBody, &genaiResp); err != nil {
		return nil, fmt.Errorf("genai: parse response: %w", err)
	}

	// 提取 AI 回复文本（最后一条 AI 消息）
	content := p.extractLastAIContent(genaiResp.Messages)

	return &model.ChatResponse{
		Content:        content,
		Model:          fmt.Sprintf("genai-%s", p.cfg.GenaiConfigID),
		ConversationID: genaiResp.ConversationID,
		MessageID:      p.extractLastAIID(genaiResp.Messages),
		Usage:          &model.TokenUsage{PromptTokens: 0, CompletionTokens: 0, TotalTokens: 0},
	}, nil
}

func (p *GenAIProvider) ChatStream(_ *model.ChatRequest, _ func(*model.StreamChunk)) (*model.ChatResponse, error) {
	// 流式支持取决于 GenAI 服务端能力
	return nil, fmt.Errorf("genai: streaming not yet supported for this provider")
}

func (p *GenAIProvider) lastUserMessage(msgs []model.ChatMessage) string {
	for i := len(msgs) - 1; i >= 0; i-- {
		if msgs[i].Role == "user" {
			return msgs[i].Content
		}
	}
	return ""
}

func (p *GenAIProvider) extractLastAIContent(msgs []struct {
	Type string `json:"type"`
	Data struct {
		Content string `json:"content"`
		ID      string `json:"id"`
	} `json:"data"`
}) string {
	for i := len(msgs) - 1; i >= 0; i-- {
		if msgs[i].Type == "ai" && msgs[i].Data.Content != "" {
			return msgs[i].Data.Content
		}
	}
	return ""
}

func (p *GenAIProvider) extractLastAIID(msgs []struct {
	Type string `json:"type"`
	Data struct {
		Content string `json:"content"`
		ID      string `json:"id"`
	} `json:"data"`
}) string {
	for i := len(msgs) - 1; i >= 0; i-- {
		if msgs[i].Type == "ai" && msgs[i].Data.ID != "" {
			return msgs[i].Data.ID
		}
	}
	return fmt.Sprintf("msg-%d", time.Now().UnixNano())
}

// ═══════════════════════════════════════════
// OpenAI Provider — 代理到 OpenAI 兼容 API
// ═══════════════════════════════════════════

type OpenAIProvider struct {
	cfg *config.Config
}

func (p *OpenAIProvider) Chat(req *model.ChatRequest) (*model.ChatResponse, error) {
	openaiReq := p.buildOpenAIReq(req)
	body, _ := json.Marshal(openaiReq)

	httpReq, err := http.NewRequest("POST", p.cfg.OpenAIAPIURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("openai: create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.OpenAIAPIKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openai: request: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("openai: status %d: %s", resp.StatusCode, string(respBody))
	}

	var openaiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Model string `json:"model"`
		Usage *struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
	}
	if err := json.Unmarshal(respBody, &openaiResp); err != nil {
		return nil, fmt.Errorf("openai: parse: %w", err)
	}

	if len(openaiResp.Choices) == 0 {
		return nil, fmt.Errorf("openai: empty choices")
	}

	result := &model.ChatResponse{
		Content:        openaiResp.Choices[0].Message.Content,
		Model:          openaiResp.Model,
		ConversationID: req.ConversationID,
		MessageID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
	}
	if openaiResp.Usage != nil {
		result.Usage = &model.TokenUsage{
			PromptTokens:     openaiResp.Usage.PromptTokens,
			CompletionTokens: openaiResp.Usage.CompletionTokens,
			TotalTokens:      openaiResp.Usage.TotalTokens,
		}
	}
	return result, nil
}

func (p *OpenAIProvider) ChatStream(req *model.ChatRequest, sendChunk func(*model.StreamChunk)) (*model.ChatResponse, error) {
	openaiReq := p.buildOpenAIReq(req)
	openaiReq["stream"] = true
	body, _ := json.Marshal(openaiReq)

	httpReq, err := http.NewRequest("POST", p.cfg.OpenAIAPIURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("openai stream: create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.OpenAIAPIKey)
	httpReq.Header.Set("Accept", "text/event-stream")

	client := &http.Client{Timeout: 180 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openai stream: request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("openai stream: status %d: %s", resp.StatusCode, string(respBody))
	}

	var fullContent strings.Builder
	reader := NewSSEReader(resp.Body)

	for {
		data, err := reader.ReadEvent()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("openai stream: read sse: %w", err)
		}
		if string(data) == "[DONE]" {
			break
		}
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(data, &chunk); err != nil {
			continue
		}
		for _, c := range chunk.Choices {
			if c.Delta.Content != "" {
				fullContent.WriteString(c.Delta.Content)
				sendChunk(&model.StreamChunk{Content: c.Delta.Content})
			}
		}
	}

	return &model.ChatResponse{
		Content:        fullContent.String(),
		ConversationID: req.ConversationID,
		MessageID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
	}, nil
}

func (p *OpenAIProvider) buildOpenAIReq(req *model.ChatRequest) map[string]interface{} {
	messages := make([]map[string]string, 0)
	if req.SystemPrompt != "" {
		messages = append(messages, map[string]string{"role": "system", "content": req.SystemPrompt})
	}
	for _, m := range req.Messages {
		messages = append(messages, map[string]string{"role": m.Role, "content": m.Content})
	}
	body := map[string]interface{}{
		"model":       p.cfg.OpenAIModel,
		"messages":    messages,
		"temperature": req.Temperature,
		"max_tokens":  req.MaxTokens,
	}
	if req.TopP != nil {
		body["top_p"] = *req.TopP
	}
	return body
}

// ═══════════════════════════════════════════
// SSE Reader
// ═══════════════════════════════════════════

type lineReader struct {
	r   io.Reader
	buf []byte
	pos int
	end int
}

func NewLineReader(r io.Reader) *lineReader {
	return &lineReader{r: r, buf: make([]byte, 4096)}
}

func (lr *lineReader) ReadLine() ([]byte, error) {
	for {
		for i := lr.pos; i < lr.end; i++ {
			if lr.buf[i] == '\n' {
				line := lr.buf[lr.pos:i]
				lr.pos = i + 1
				if len(line) > 0 && line[len(line)-1] == '\r' {
					line = line[:len(line)-1]
				}
				return line, nil
			}
		}
		if lr.pos > 0 {
			copy(lr.buf, lr.buf[lr.pos:lr.end])
			lr.end -= lr.pos
			lr.pos = 0
		}
		n, err := lr.r.Read(lr.buf[lr.end:])
		if n > 0 {
			lr.end += n
		}
		if err != nil {
			if lr.end > lr.pos {
				line := lr.buf[lr.pos:lr.end]
				lr.pos = lr.end
				if len(line) > 0 && line[len(line)-1] == '\r' {
					line = line[:len(line)-1]
				}
				return line, err
			}
			return nil, err
		}
	}
}

type SSEReader struct {
	reader *lineReader
}

func NewSSEReader(r io.Reader) *SSEReader {
	return &SSEReader{reader: NewLineReader(r)}
}

func (sr *SSEReader) ReadEvent() ([]byte, error) {
	for {
		line, err := sr.reader.ReadLine()
		if err != nil {
			return nil, err
		}
		if len(line) > 6 && string(line[:6]) == "data: " {
			return line[6:], nil
		}
	}
}
