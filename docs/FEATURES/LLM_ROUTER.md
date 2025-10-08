# LLM-based Router Prototype

This feature adds a non-breaking, feature-flagged integration of an LLM-based router into the existing `ConversationRouter`.

How it works

- When the environment variable `USE_LLM_ROUTER=1` is set, `ConversationRouter.analyzeQuery` will call the prototype LLM router (async) and log any strong routing suggestions coming from the model.
- The main routing still uses existing heuristics for immediate responses. The LLM suggestion is non-blocking and is intended to be surfaced later as a UI suggestion or used to incrementally update routing decisions.

Files added/changed

- `client/src/lib/ai/services/prototypeRouter.ts` — prototype router implementation with mock mode via `PROTOTYPE_ROUTER_MOCK=1`.
- `client/scripts/run-prototype-router.ts` — self-contained mock harness for quick local testing.
- `client/src/lib/ai/services/conversationRouter.ts` — now optionally invokes the LLM router when `USE_LLM_ROUTER=1`.

How to test locally (mock mode)

Run the mock harness (no API keys required):

```bash
pnpm -w dlx tsx client/scripts/run-prototype-router.ts
```

How to enable LLM router in dev mode (real LLM calls)

1. Set provider API keys (e.g., `VITE_OPENAI_API_KEY`).
2. Set `USE_LLM_ROUTER=1` in your environment when running the client/dev server.
3. Optionally set `PROTOTYPE_ROUTER_MOCK=0` to force real LLM calls by the prototype router.

Notes

- This integration is intentionally conservative and non-blocking: heuristics still win for the immediate routing decision. LLM suggestions are logged; next steps are to surface them to the UI as suggestions and add feedback capture to learn from user accept/decline.
- Running LLM calls will consume credits and requires proper API configuration.
