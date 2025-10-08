# Agent Handoff UI

Files:

- `AgentSuggestion.tsx` — small presentational component showing suggested agent, confidence, reasoning, Accept/Dismiss actions.
- `AgentSuggestionDemo.tsx` — self-contained demo page you can import into any route or Storybook.

How to try:

- Import `AgentSuggestionDemo` into a development page or Storybook story and render it. It's self-contained and uses mock suggestions.

Example:

```tsx
import AgentSuggestionDemo from '@/components/AgentHandoff/AgentSuggestionDemo';

export default function DemoPage(){
  return <AgentSuggestionDemo />
}
```
