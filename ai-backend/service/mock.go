package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/aido/ai-backend/config"
	"github.com/aido/ai-backend/model"
)

// MockProvider 模拟 LLM 响应，无需外部 API 依赖，方便开发调试
type MockProvider struct {
	cfg *config.Config
}

func (p *MockProvider) Chat(req *model.ChatRequest) (*model.ChatResponse, error) {
	time.Sleep(time.Duration(p.cfg.MockDelayMs) * time.Millisecond)

	content := p.buildMockResponse(req)
	return &model.ChatResponse{
		Content:        content,
		Model:          "mock-llm-v1",
		ConversationID: req.ConversationID,
		MessageID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
		Usage: &model.TokenUsage{
			PromptTokens:     50,
			CompletionTokens: 30,
			TotalTokens:      80,
		},
	}, nil
}

func (p *MockProvider) ChatStream(req *model.ChatRequest, sendChunk func(*model.StreamChunk)) (*model.ChatResponse, error) {
	content := p.buildMockResponse(req)

	// 逐字发送模拟流式输出
	runes := []rune(content)
	for i, r := range runes {
		sendChunk(&model.StreamChunk{Content: string(r)})
		if i%3 == 2 {
			time.Sleep(time.Duration(p.cfg.MockDelayMs/10) * time.Millisecond)
		}
	}

	return &model.ChatResponse{
		Content:        content,
		Model:          "mock-llm-v1",
		ConversationID: req.ConversationID,
		MessageID:      fmt.Sprintf("msg-%d", time.Now().UnixNano()),
	}, nil
}

func (p *MockProvider) buildMockResponse(req *model.ChatRequest) string {
	// 测试连接：如果要求回复 "OK" 则直接回复
	if len(req.Messages) == 1 && strings.Contains(strings.ToLower(req.Messages[0].Content), "reply with exactly: ok") {
		return "OK"
	}

	lastMsg := ""
	if len(req.Messages) > 0 {
		lastMsg = req.Messages[len(req.Messages)-1].Content
	}

	numMsgs := len(req.Messages)
	isMultiTurn := req.ConversationID != "" && req.ParentID != ""

	intro := fmt.Sprintf(
		"Hello! I'm the **Enterprise AI** assistant (mock mode).\n\n"+
			"- Model: `%s`\n"+
			"- Temperature: %.1f\n"+
			"- Max tokens: %d\n"+
			"- Deployment: `%s`\n"+
			"- Tenant: `%s`\n"+
			"- Messages in context: %d\n"+
			"- Multi-turn: %v\n\n---\n\n",
		req.Model, req.Temperature, req.MaxTokens,
		req.DeploymentID, req.TenantID,
		numMsgs, isMultiTurn,
	)

	var response string
	lower := strings.ToLower(lastMsg)

	switch {
	case strings.Contains(lower, "analyze") || strings.Contains(lower, "metrics"):
		response = `## System Performance Analysis

Based on the metrics provided, here is my analysis:

| Metric | Value | Status |
|--------|-------|--------|
| CPU | 85% | ⚠️ Warning - approaching threshold |
| Memory | 72% | ✅ Normal |
| Disk I/O | 15ms | ✅ Normal |

**Recommendations:**
1. Scale up the application server to handle CPU load
2. Consider adding auto-scaling rules at 80% CPU
3. Review recent deployments for potential regressions

**Note:** This is a mock response for demonstration purposes.`

	case strings.Contains(lower, "troubleshoot") || strings.Contains(lower, "error"):
		response = `## Troubleshooting Analysis

### Issue Summary
The payment service is experiencing a 5.3% error rate spike.

### Root Cause Analysis
1. **Recent deployment detected**: Version 2.4.1 was rolled out 15 minutes ago
2. **Database connection pool exhaustion**: The new deployment increased connection usage by 300%
3. **Timeout cascade**: Connection wait times are causing upstream timeouts

### Recommended Actions
1. ⏸️ **Immediate**: Rollback to version 2.4.0
2. 🔍 **Verify**: Monitor error rate after rollback for 5 minutes
3. 🔧 **Fix**: Increase max_connections in database config before re-deploying

**Note:** This is a mock response for demonstration purposes.`

	case strings.Contains(lower, "dashboard") || strings.Contains(lower, "monitoring"):
		response = `## Monitoring Dashboard Design

Here's a recommended dashboard layout for your 12-service microservices architecture:

### Row 1: Service Health Overview
- **Latency Heatmap** (p50/p95/p99 by service)
- **Error Rate** (stacked area chart by status code)
- **Throughput** (requests per second by service)

### Row 2: Resource Utilization
- **CPU/Memory** (by pod/instance)
- **Network I/O** (in/out by service)
- **Disk Usage** (by volume)

### Row 3: Business Metrics
- **SLA Compliance** (percentage by service tier)
- **Active Alerts** (by severity)
- **Deployment Tracking** (recent rollouts)

**Note:** This is a mock response for demonstration purposes.`

	default:
		response = fmt.Sprintf(
			`Thank you for your message! I received:

> %s

I am configured as an **enterprise-grade AI assistant** with the following capabilities:

- 🔍 **Data Analysis**: Analyze metrics, logs, and traces
- 🚨 **Incident Response**: Troubleshoot alerts and outages
- 📊 **Dashboard Design**: Create monitoring dashboards
- 💡 **Best Practices**: Provide operational recommendations

*Currently running in mock mode. Configure LLM_BACKEND=openai and set OPENAI_API_KEY to connect to a real LLM provider.*`,
			lastMsg,
		)
	}

	return intro + response
}
