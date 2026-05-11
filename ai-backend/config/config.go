package config

import (
	"os"
	"strconv"
	"strings"
)

// Config 服务端配置
type Config struct {
	Host string
	Port int

	CORSOrigins []string

	// LLM 后端模式: "genai" | "openai" | "mock"
	LLMBackend string

	// ── GenAI 服务（对标 innovation-lift-7） ──
	GenaiEngineAPI string
	GenaiContextID string
	GenaiConfigID  string

	// ── OpenAI 兼容上游（备选） ──
	OpenAIAPIURL string
	OpenAIAPIKey string
	OpenAIModel  string

	// ── Mock 模式 ──
	MockDelayMs int
}

func Load() *Config {
	cfg := &Config{
		Host:        getEnv("HOST", "0.0.0.0"),
		Port:        getEnvInt("PORT", 8099),
		CORSOrigins: []string{"http://localhost:5173", "http://127.0.0.1:5173"},

		LLMBackend: getEnv("LLM_BACKEND", "mock"),

		// GenAI 服务（对标 innovation-lift-7 app.py）
		GenaiEngineAPI: getEnv("GENAI_ENGINE_API",
			"https://api.loreal.net/global/it4it/btdp-genaiengine/v1"),
		GenaiContextID: getEnv("GENAI_CONTEXT_ID", ""),
		GenaiConfigID:  getEnv("GENAI_CONFIG_ID", "default"),

		// OpenAI 备选
		OpenAIAPIURL: getEnv("OPENAI_API_URL",
			"https://api.deepseek.com/v1/chat/completions"),
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		OpenAIModel:  getEnv("OPENAI_MODEL", "deepseek-chat"),

		MockDelayMs: getEnvInt("MOCK_DELAY_MS", 300),
	}

	if raw := os.Getenv("CORS_ORIGINS"); raw != "" {
		cfg.CORSOrigins = parseCSV(raw)
	}
	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getEnvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func parseCSV(s string) []string {
	out := []string{}
	cur := strings.Builder{}
	for _, ch := range s {
		if ch == ',' {
			if cur.Len() > 0 {
				out = append(out, strings.TrimSpace(cur.String()))
				cur.Reset()
			}
		} else if ch != '"' && ch != '[' && ch != ']' {
			cur.WriteRune(ch)
		}
	}
	if cur.Len() > 0 {
		out = append(out, strings.TrimSpace(cur.String()))
	}
	return out
}
