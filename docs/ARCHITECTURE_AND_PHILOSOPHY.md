# Architecture & Philosophy

> "Your Assistant. Your Machine. Your Rules."

Nexus is not just a chat app; it is a **Modern AI-Powered Business Operating System** designed for sovereignty, auditability, and structured thinking.

---

## 🧠 The Philosophy: "The Model-Way"

We believe AI should not just be a chatbot, but a structured partner in thought. The "Model-Way" framework transforms unstructured chat into a professional workflow akin to "Outlook for AI".

### 1. Intent First, Not Prompts
Just as you write a subject line for an email, every interaction in Nexus starts with an **Intent**:
- **🧠 Brainstorm**: Open-ended exploration.
- **🛠️ Solve**: Targeted problem-solving.
- **✍️ Write**: Drafting content/documents.
- **📊 Decide**: Weighing options and risks.
- **📚 Learn**: Educational deep-dives.

### 2. Structured Phases
Complex work isn't done in one shot. Nexus guides conversations through distinct **Phases**:
1.  **Discovery**: Gathering context and requirements.
2.  **Synthesis**: Analyzing data and proposing structure.
3.  **Decision**: Making choices based on synthesis.
4.  **Execution**: Performing the work (coding, writing, calling APIs).

### 3. Auditable & Private
- **Full Audit Trail**: Every user message and AI response is recorded in our PostgreSQL database (`ai_messages` table) for compliance and history.
- **Self-Hosted**: Nexus and its agent runtime (OpenClaw) run on *your* infrastructure (Coolify).
- **Data Sovereignty**: Your keys, your data. No third-party SaaS black boxes.

---

## 🏗️ Architecture

The system is composed of three primary layers representing the **App**, the **Agent**, and the **Intelligence**.

### 1. The App Layer: `Nexus`
- **Frontend**: React 19, Vite, Tailwind, shadcn/ui.
  - Responsible for the UI/UX of the "Model-Way" (Intent pickers, Phase indicators).
- **Backend**: Node.js / Express.
  - **API**: Handles auth (Authentik), business logic, and RAG.
  - **Persistence**: Writes chat history to PostgreSQL (`vector_db`) before forwarding to the agent.

### 2. The Agent Layer: `OpenClaw`
*The "Office Building" where work happens.*
- **Role**: Validates requests, manages tool execution, and maintains agent "personality" (SOUL).
- **Runtime**:
  - Runs as a secure gateway on port `18790`.
  - **Sandboxing**: Spawns isolated Docker containers for dangerous tasks (coding, shell execution).
  - **Tools**: Equipped with web browsing, file system access, and CLI tools.
- **Routing**: Receives requests from Nexus and decides *how* to fulfill them (which model, which tools).

### 3. The Intelligence Layer: `OpenRouter`
- **Primary Model**: **Google Gemini 2.5 Flash** (via OpenRouter).
  - Chosen for its high speed, massive context window (1M+ tokens), and reasoning capabilities.
- **Fallbacks**: Claude 3.5 Sonnet, GPT-4o Mini (configured in OpenClaw).

---

## 🔄 Data Flow

When a user sends a message in Nexus:

1.  **Nexus UI**: Captures User Message + Intent.
2.  **Nexus Backend**:
    - **Records** user message to DB (`ai_messages`).
    - **Forwards** request to OpenClaw (`http://localhost:18790/v1/chat/completions`).
3.  **OpenClaw**:
    - **Injects** System Prompts (Personality + Tools).
    - **Calls** LLM (Gemini 2.5 Flash).
    - **Executes** Tools (if needed) in Sandbox.
4.  **Nexus Backend**:
    - **Streams** response to UI.
    - **Accumulates** full response.
    - **Records** final assistant message to DB (`ai_messages`).

---

## 🔒 Security

- **Authentication**: Authentik (OIDC) protects the Nexus Frontend/API.
- **Internal Ops**: OpenClaw listens on `127.0.0.1` (or internal Docker network), inaccessible to the public internet.
- **Secrets**: API keys (OpenRouter) are stored in environment variables, never exposed to the client.
