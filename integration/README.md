# Nexus OpenClaw Integration Service

Provides OpenAI-compatible API for Nexus backend with Model-Way Framework implementation.

## Features

- **OpenAI-compatible API** (`/v1/chat/completions`) for easy integration with Nexus
- **Model-Way Framework** implementation:
  - Intent detection (🧠 Brainstorm, 🛠 Solve, ✍️ Write, 📊 Decide, 📚 Learn)
  - Phase tracking (Discovery → Synthesis → Decision → Execution)
  - Structured scaffolding based on intent/phase
  - Conversation metadata in responses
- **Health endpoints** compatible with Nexus health checks
- **Deployment ready** for Coolify, Docker, or standalone

## Quick Start

```bash
cd integration
npm install
npm start
```

Or with environment variables:
```bash
PORT=18790 OPENCLAW_BIN=openclaw npm start
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 18790)
- `OPENCLAW_BIN` - OpenClaw binary path (default: 'openclaw')
- `WORKSPACE_DIR` - Workspace directory (default: '/root/.openclaw/workspace')

## API Endpoints

- `GET /health` - Health check (Nexus uses this)
- `GET /v1/health` - Health check with /v1 prefix
- `POST /v1/chat/completions` - OpenAI-compatible chat completions
- `GET /v1/modelway/intents` - List Model-Way intents and phases
- `GET /v1/modelway/demo` - Demo of Model-Way Framework

## Integration with Nexus

Set in Nexus backend `.env`:
```env
OPENCLAW_API_URL=http://localhost:18790/v1
OPENCLAW_API_KEY=sk-openclaw-local
```

## Model-Way Framework

The Model-Way Framework teaches structured AI collaboration:

### Intents
- 🧠 **Brainstorm** - Generate ideas, explore possibilities
- 🛠 **Solve** - Solve problems, debug, fix issues  
- ✍️ **Write** - Draft content, emails, documents
- 📊 **Decide** - Make decisions, analyze options
- 📚 **Learn** - Learn, research, understand concepts

### Phases
1. **Discovery** (25%) - Explore, ask questions, gather insights
2. **Synthesis** (50%) - Organize, connect dots, identify patterns
3. **Decision** (75%) - Present options, make recommendations
4. **Execution** (100%) - Action steps, timeline, success metrics

## Deployment

### Coolify Deployment
Create a new application in Coolify with:
- **Build Method**: Dockerfile
- **Dockerfile**: `integration/Dockerfile`
- **Port**: 18790
- **Environment Variables**: As above

### Docker
```bash
docker build -t nexus-openclaw-integration -f integration/Dockerfile .
docker run -p 18790:18790 nexus-openclaw-integration
```

## Development

```bash
# Install dependencies
cd integration
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test
```

## Architecture

```
Nexus Frontend → Nexus Backend → OpenClaw Integration Service → OpenClaw AI
                         ↓
                 Model-Way Framework
                 (Intent/Phase Tracking)
```

## Next Steps

1. Replace simulated responses with real OpenClaw AI calls
2. Add database persistence for conversation state
3. Implement Thoughts Management integration
4. Add WebSocket support for real-time updates