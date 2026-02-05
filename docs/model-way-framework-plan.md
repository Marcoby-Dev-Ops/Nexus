# Nexus Model-Way Framework Implementation Plan

**Date:** 2026-02-05  
**Goal:** Transform Nexus into the "Outlook for AI" by teaching professional AI collaboration through UI/UX and system prompts.

## Core Principles (Outlook Analogy)
1. **Intent first, not prompts** → Subject lines
2. **Safe behavior defaults** → Attachment warnings
3. **Structure through UI** → To/CC/Subject/Body
4. **Thinking with AI** → Draft→Sent→Archived
5. **AI has modes** → Normal/Confidential/Encrypted
6. **AI ≠ memory** → Inbox vs Calendar vs Contacts

## Technical Architecture

### Layer 1: OpenClaw Provider (AI Engine)
**File:** `Nexus/server/services/NexusAIGatewayService.js`
- Modify `OpenClawProvider.buildMessages()` to inject:
  - Intent-aware system prompts
  - Conversation phase tracking
  - Auto-redaction of secrets
  - Structured response scaffolding

**Key methods to update:**
1. `detectIntent()` - Simple keyword → intent mapping
2. `scaffoldUserInput()` - Add Context/Goal/Attempts/Next Step sections
3. `trackPhase()` - Discovery→Synthesis→Decision→Execution
4. `autoRedact()` - Replace secrets with `<API_KEY>` placeholders

### Layer 2: Nexus UI (User Experience)
**Files:**
- `client/src/pages/ai/ChatPage.tsx` - Add intent picker modal
- `client/src/lib/ai/components/ModernChatInterface.tsx` - Add phase indicator, structured input
- `client/src/lib/ai/components/ChatWelcome.tsx` - New user onboarding flow

**UI Components to create:**
1. **IntentPicker** - 🧠 Brainstorm / 🛠 Solve / ✍️ Write / 📊 Decide / 📚 Learn
2. **PhaseIndicator** - Visual progress bar (Discovery→Synthesis→Decision→Execution)
3. **StructuredInput** - Collapsible: Context/Goal/Attempts/Next Step
4. **SaveArtifactPrompt** - "Save as: note/decision/template/nothing?"

### Layer 3: Database Schema
**New tables:**
```sql
-- Track intents and phases
ai_intent_types (id, name, emoji, description)
conversation_phases (id, conversation_id, phase, entered_at, exited_at)
saved_artifacts (id, conversation_id, artifact_type, content, created_at)
```

**Migration scripts** to add columns to existing `conversations` table:
- `intent_type_id` UUID REFERENCES ai_intent_types(id)
- `current_phase` VARCHAR(20)

### Layer 4: RAG Service Integration
**File:** `client/src/lib/services/NexusRAGService.ts`
- Enhance `buildSystemPrompt()` to include intent/phase context
- Add artifact saving endpoints
- Integrate with knowledge base for template reuse

## Implementation Phases

### Phase 1: OpenClaw Prototype (24h)
- Create sandbox container with modified provider
- Test intent detection and structured responses
- Validate auto-redaction logic
- **Deliverable:** Working API endpoint demonstrating model-way behavior

### Phase 2: UI Integration (48h)
- Add intent picker to ChatPage (modal for first message)
- Implement PhaseIndicator component
- Create StructuredInput (collapsible sections)
- Build SaveArtifactPrompt component
- **Deliverable:** UI showing full model-way flow

### Phase 3: Database & Persistence (24h)
- Create migration scripts
- Update RAG service to store metadata
- Implement artifact saving/retrieval
- **Deliverable:** Complete data layer with history tracking

### Phase 4: Production Deployment (24h)
- Feature-flag rollout (`ENABLE_MODEL_WAY`)
- Staging testing on Coolify
- Gradual enablement by tenant
- **Deliverable:** Live in production with opt-in

## Success Metrics
1. **User adoption:** % of conversations using intents
2. **Safety compliance:** Secrets auto-redacted successfully
3. **Structure usage:** % using scaffolded input
4. **Artifact creation:** Notes/decisions/templates saved
5. **Time to value:** Reduction in "open-ended rambling" conversations

## Risk Mitigation
- **Backward compatible:** Existing conversations unchanged
- **Opt-in:** Feature flags control rollout
- **Fallback:** Traditional chat if errors
- **Performance:** Lightweight intent detection (keyword → ML later)

## Next Immediate Step
Set up Nexus→OpenClaw integration so you can chat with your Nexus agent through the Nexus UI rather than OpenClaw console.