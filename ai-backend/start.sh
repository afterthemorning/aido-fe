#!/bin/bash
set -e

MODE="${1:-mock}"
DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env if exists
if [ -f "$DIR/.env" ]; then
  set -a
  source "$DIR/.env"
  set +a
fi

case "$MODE" in
  mock)
    echo "Starting in MOCK mode — no external dependencies required"
    echo "  Chat at: http://localhost:8099/api/v1/chat"
    export LLM_BACKEND=mock
    ;;
  openai)
    echo "Starting in OPENAI mode — requires OPENAI_API_KEY"
    echo "  Chat at: http://localhost:8099/api/v1/chat"
    echo "  Backend: $OPENAI_API_URL"
    export LLM_BACKEND=openai
    ;;
  genai)
    echo "Starting in GENAI mode — connects to GenAI service"
    echo "  API: $GENAI_ENGINE_API"
    echo "  Context: $GENAI_CONTEXT_ID"
    echo "  Config: $GENAI_CONFIG_ID"
    export LLM_BACKEND=genai
    ;;
  *)
    echo "Usage: $0 [mock|openai|genai]"
    exit 1
    ;;
esac

cd "$DIR"
go build -o ai-backend . && ./ai-backend
