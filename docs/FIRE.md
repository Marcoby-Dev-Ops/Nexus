# FIRE Mapping (Frame, Ingest, Reason, Execute)

This document explains Nexus's proprietary FIRE mapping and how it aligns with the AI Gateway and agent loop.

## Frame
- Constrain tasks into the Business Ontology (domain ↔ metric ↔ action)
- Policy-driven routing by role, sensitivity, budget tier
- System prompts are versioned and task-specific

## Ingest
- Connectors normalize data (CRM, ERP, files)
- PII redaction and enrichment before LLM
- Hybrid retrieval (BM25 + vector) and context planning

## Reason
- Gateway routes to the best model (OpenAI, OpenRouter, Local)
- RAG pipeline: rewrite → retrieve → rerank → plan context
- Shadow mode for continuous evaluation

## Execute
- Allowlisted tools with Zod schema validation
- Dry-run for dangerous ops; idempotency keys
- Logged actions and human-in-the-loop for high impact

## Explainability
- Every call records: provider, model, latency, tokens, cost
- Trace model selection reasons via `ModelRegistry`
- “Explain this choice” can read metrics + selection reason and show to user

## Implementation Pointers
- Middleware: `src/ai/middleware/shadowMode.ts`
- RAG: `src/ai/rag/pipeline.ts`
- Tools: `src/ai/tools/registry.ts`
- Metrics: `src/ai/observability/metrics.ts`
- Gateway: `src/ai/lib/AIGateway.ts`
