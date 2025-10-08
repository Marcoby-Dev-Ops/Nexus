# Agent Handoff UI Integration

What's implemented

- `AgentSuggestion` component: shows suggested agent, confidence, reasoning, and buttons to Accept or Dismiss.
- `AgentSuggestionDemo` demo: uses mock suggestions and, on Accept, calls `defaultAgentService.switchAgent(agentId)` and `defaultAgentService.addAssistantResponse(...)` to simulate handing off the conversation.

How it works in-app

- The demo uses `defaultAgentService` to perform a non-destructive switch of the current agent ID and appends a short assistant response to the conversation history to indicate the handoff.
- This keeps the implementation non-blocking and reversible; integration into the real chat UI will require subscribing to `defaultAgentService.getConversationContext()` or using the `useDefaultAgent` hook.

How to use

- Import `AgentSuggestionDemo` into a dev page and render it to try the flow.
- To connect the suggestion UI to real LLM suggestions, wire `conversationRouter` LLM suggestion events into the client store (e.g., use a small event emitter or Zustand store) and render `AgentSuggestion` when suggestions appear.

Next steps

- Surface suggestions in the chat UI near the input box.
- Add analytics capturing accept/decline events.
- Implement transfer of detailed context (last N messages + memory summary) when switching agents.
