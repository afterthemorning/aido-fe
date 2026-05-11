package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/aido/ai-backend/config"
	"github.com/aido/ai-backend/model"
	"github.com/aido/ai-backend/service"
)

type ChatHandler struct {
	cfg      *config.Config
	provider service.LLMProvider
}

func NewChatHandler(cfg *config.Config) *ChatHandler {
	return &ChatHandler{
		cfg:      cfg,
		provider: service.NewProvider(cfg),
	}
}

// HandleChat POST /api/v1/chat — 聊天入口（自动分流 流式/非流式）
// 对应前端 enterpriseAdapter.buildRequestBody + parseResponse/parseStreamChunk
func (h *ChatHandler) HandleChat(c *gin.Context) {
	req, err := parseChatRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, model.ErrorResponse{
			Error:  "invalid_request",
			Detail: err.Error(),
		})
		return
	}

	if req.ConversationID == "" {
		req.ConversationID = "chat-" + uuid.New().String()
	}

	// 流式模式
	if req.Stream {
		h.writeSSEStream(c, req)
		return
	}

	// 非流式模式
	md, err := h.provider.Chat(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.ErrorResponse{
			Error:  "provider_error",
			Detail: err.Error(),
		})
		return
	}
	md.ConversationID = req.ConversationID
	c.JSON(http.StatusOK, md)
}

// writeSSEStream 写入 SSE 流式响应
func (h *ChatHandler) writeSSEStream(c *gin.Context, req *model.ChatRequest) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	c.Stream(func(w io.Writer) bool {
		md, err := h.provider.ChatStream(req, func(chunk *model.StreamChunk) {
			data, _ := json.Marshal(chunk)
			fmt.Fprintf(w, "data: %s\n\n", data)
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		})
		if err != nil {
			errData, _ := json.Marshal(model.ErrorResponse{
				Error:  "stream_error",
				Detail: err.Error(),
			})
			fmt.Fprintf(w, "data: %s\n\n", errData)
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
			return false
		}

		// 发送完成信号（兼容前端 DONE 检测和 done 标记）
		fmt.Fprintf(w, "data: [DONE]\n\n")
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}

		// 发送元数据
		meta, _ := json.Marshal(map[string]interface{}{
			"metadata": map[string]interface{}{
				"conversation_id": md.ConversationID,
				"message_id":      md.MessageID,
				"model":           md.Model,
				"timestamp":       time.Now().Unix(),
			},
		})
		fmt.Fprintf(w, "data: %s\n\n", meta)
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		return false
	})
}

// HandleTest POST /api/v1/chat/test — 测试连接
func (h *ChatHandler) HandleTest(c *gin.Context) {
	req := &model.ChatRequest{
		Model:     h.cfg.OpenAIModel,
		Messages:  []model.ChatMessage{{Role: "user", Content: "Reply with exactly: OK"}},
		MaxTokens: 10,
	}

	md, err := h.provider.Chat(req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Connection successful",
		"latency": 0,
		"reply":   md.Content,
	})
}

// HandleModels GET /api/v1/models — 模型列表
func (h *ChatHandler) HandleModels(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"models": []gin.H{
			{"id": "enterprise-llm-v1", "name": "Enterprise LLM v1", "context_window": 32768},
			{"id": "enterprise-llm-v2", "name": "Enterprise LLM v2 (Latest)", "context_window": 65536},
			{"id": h.cfg.OpenAIModel, "name": "OpenAI: " + h.cfg.OpenAIModel, "context_window": 65536},
		},
		"backend": h.cfg.LLMBackend,
	})
}

// Health GET /health
func (h *ChatHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"backend": h.cfg.LLMBackend,
		"model":   h.cfg.OpenAIModel,
		"time":    time.Now().Unix(),
	})
}

func parseChatRequest(c *gin.Context) (*model.ChatRequest, error) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return nil, fmt.Errorf("read body: %w", err)
	}

	var req model.ChatRequest
	if err := json.Unmarshal(body, &req); err != nil {
		return nil, fmt.Errorf("parse body: %w", err)
	}

	if req.MaxTokens <= 0 {
		req.MaxTokens = 2048
	}
	if req.Temperature <= 0 {
		req.Temperature = 0.3
	}

	return &req, nil
}
