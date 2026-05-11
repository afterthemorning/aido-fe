package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"

	"github.com/aido/ai-backend/config"
	"github.com/aido/ai-backend/handler"
)

func main() {
	cfg := config.Load()
	chatHandler := handler.NewChatHandler(cfg)

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		for _, allowed := range cfg.CORSOrigins {
			if origin == allowed {
				c.Header("Access-Control-Allow-Origin", origin)
				break
			}
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	api := r.Group("/api/v1")
	{
		api.POST("/chat", chatHandler.HandleChat)
		api.POST("/chat/stream", chatHandler.HandleChat)
		api.POST("/chat/test", chatHandler.HandleTest)
		api.GET("/models", chatHandler.HandleModels)
	}

	// Health
	r.GET("/health", chatHandler.Health)

	// Start server
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	log.Printf("AI Chat Backend starting on %s", addr)
	log.Printf("  LLM Backend: %s", cfg.LLMBackend)
	log.Printf("  OpenAI URL: %s", cfg.OpenAIAPIURL)
	log.Printf("  Model: %s", cfg.OpenAIModel)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
