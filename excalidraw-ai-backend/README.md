# Excalidraw AI Backend

AI-powered mind map generation backend for Excalidraw, using Zhipu AI GLM-4 model.

## Features

- ✅ **AI Mind Map Generation**: Generate structured mind maps from text prompts
- ✅ **Zhipu AI Integration**: Uses GLM-4-Flash (free, 100万 tokens/day)
- ✅ **SSE Streaming**: Real-time response streaming
- ✅ **Rate Limiting**: Built-in request throttling
- ✅ **TypeScript**: Full type safety
- ✅ **Docker Ready**: Containerized deployment
- ✅ **Excalidraw Compatible**: Works seamlessly with existing frontend

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Zhipu AI API Key ([Get one here](https://open.bigmodel.cn/))

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your ZHIPUAI_API_KEY
```

### Development

```bash
npm run dev
```

Server will start on http://localhost:3016

### Production

```bash
npm run build
npm start
```

## API Usage

### Endpoint

```
POST /v1/ai/text-to-diagram/chat-streaming
```

### Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a mindmap about machine learning"
    }
  ]
}
```

### Response

Server-Sent Events (SSE) stream:

```
data: {"type":"content","delta":"mindmap\n  root((Mach"}

data: {"type":"content","delta":"ine Learning))\n    Supervised"}

data: {"type":"content","delta":"\n      Classification"}

data: [DONE]
```

## Integration with Excalidraw

### Method 1: Environment Variable

Set in Excalidraw's `.env`:

```bash
VITE_APP_AI_BACKEND=http://localhost:3016
```

### Method 2: Direct Integration

The API is fully compatible with Excalidraw's existing TTDStreamFetch client.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3016` |
| `NODE_ENV` | Environment | `development` |
| `ZHIPUAI_API_KEY` | Zhipu AI API key | Required |
| `ZHIPUAI_MODEL` | AI model | `glm-4-flash` |
| `RATE_LIMIT_LIMIT` | Daily request limit | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `86400000` |

### Available Models

- `glm-4-flash` - Free, fast (100万 tokens/day)
- `glm-4` - Better performance (25万 tokens/day for new users)
- `glm-4-plus` - Best performance (paid)

## Docker Deployment

### Build and Run

```bash
docker build -t excalidraw-ai-backend .
docker run -p 3016:3016 \
  -e ZHIPUAI_API_KEY=your-key \
  -e NODE_ENV=production \
  excalidraw-ai-backend
```

### Docker Compose

```bash
docker-compose up -d
```

## Testing

### Test the Endpoint

```bash
curl -N -X POST http://localhost:3016/v1/ai/text-to-diagram/chat-streaming \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Create a mindmap about web development"}]}'
```

### Health Check

```bash
curl http://localhost:3016/health
```

## Project Structure

```
excalidraw-ai-backend/
├── src/
│   ├── index.ts                    # Express server
│   ├── config/
│   │   └── env.ts                  # Environment config
│   ├── routes/
│   │   └── chatStreaming.ts        # API routes
│   ├── services/
│   │   ├── zhipuAI.ts             # Zhipu AI client
│   │   ├── streamTransformer.ts   # SSE transformer
│   │   └── rateLimiter.ts         # Rate limiting
│   ├── prompts/
│   │   └── mindmapPrompts.ts      # Prompt templates
│   ├── middleware/
│   │   ├── errorHandler.ts        # Error handling
│   │   └── requestLogger.ts       # Request logging
│   └── types/
│       └── index.ts               # TypeScript types
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
└── README.md
```

## Security

- API Key stored in environment variables
- CORS configured for production
- Rate limiting to prevent abuse
- Input validation on all endpoints

## Cost

- **GLM-4-Flash**: 100万 tokens/day (FREE)
- **GLM-4**: 25万 tokens/day for new users (FREE tier)
- **GLM-4-Plus**: Pay per use

## Monitoring

### Logs

```bash
# View logs
docker logs excalidraw-ai-backend -f
```

### Rate Limit Status

Rate limit info is included in response headers:

```
X-Ratelimit-Limit: 100
X-Ratelimit-Remaining: 95
X-Ratelimit-Reset: 2025-04-02T00:00:00.000Z
```

## Troubleshooting

### "ZHIPUAI_API_KEY is required"

Make sure you've set the API key in `.env` file:

```bash
ZHIPUAI_API_KEY=your-actual-api-key
```

### "Rate limit exceeded"

You've exceeded the daily request limit. Either:
1. Wait for the window to reset (default: 24 hours)
2. Increase `RATE_LIMIT_LIMIT` in `.env`
3. Reset the limit by restarting the server

### Port already in use

Change the port in `.env`:

```bash
PORT=3017
```

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- [Zhipu AI](https://open.bigmodel.cn/)
- [Excalidraw](https://excalidraw.com/)
- [GLM-4 Documentation](https://bigmodel.cn/dev/api/normal-model/glm-4)

---

**Made with ❤️ for Excalidraw community**
