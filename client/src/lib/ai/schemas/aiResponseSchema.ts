import { z } from 'zod';

export const SourceMetaSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  snippet: z.string().optional(),
  url: z.string().url().optional(),
  score: z.number().optional(),
});

export const RoutingSchema = z.object({
  agent: z.string().optional(),
  confidence: z.number().optional(),
  reasoning: z.string().optional(),
});

export const DomainCapabilitiesSchema = z.object({
  tools: z.array(z.string()).optional(),
  expertise: z.array(z.string()).optional(),
  insights: z.array(z.string()).optional(),
}).optional();

export const ModelInfoSchema = z.object({
  model: z.string().optional(),
  provider: z.string().optional(),
}).optional();

export const ServerMessageSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  content: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}).optional();

export const AIChatResponseSchema = z.object({
  content: z.string().optional(),
  sources: z.array(SourceMetaSchema).optional(),
  routing: RoutingSchema.optional(),
  agentId: z.string().optional(),
  domainCapabilities: DomainCapabilitiesSchema,
  modelInfo: ModelInfoSchema,
  conversationId: z.string().optional(),
  serverMessage: ServerMessageSchema,
});

export type AIChatResponse = z.infer<typeof AIChatResponseSchema>;
