
## 5. `Nexus/docs/PROJECT_CONTEXT.md`

**Purpose:** This file, despite its `.md` extension, appears to function as a structured configuration or manifest listing active business domains/modules within Nexus, rather than a prose-based documentation of project vision and goals. The content `{'ckb': True, 'finance': True, 'marketplace': True, 'operations': True, 'sales': True}` suggests it's used to delineate which core areas are considered active or enabled.

**Categorization:** **MVP (Minimum Viable Product Essential Configuration/Documentation)** - Defines the operational scope of the product's business logic, making it critical for the MVP. However, its current format is not suitable for direct client-facing documentation.

**Key Features/Observations:**
*   **Active Domains/Modules:** Explicitly lists `ckb`, `finance`, `marketplace`, `operations`, and `sales` as active or enabled (`True`). This gives a clear, high-level overview of the functional areas Nexus covers.
*   **Unexpected Format:** The file format (parsed as a dictionary/JSON) is atypical for a markdown file, suggesting it might be consumed programmatically by parts of the system.

**Accuracy Check against Current Codebase/Architecture:**
*   **Internal Consistency:** The file is internally consistent in its stated purpose as a list of domains. Its accuracy in representing *actual* active domains in the codebase would require further investigation into how these flags are used (e.g., conditionality in code). Assuming it's an authoritative list, it's accurate.

**Clean-up/Refinement Notes:**
*   **Naming and Location:** Given its structured, configuration-like content, `PROJECT_CONTEXT.md` is a misleading name and location for a file that is not prose documentation. It should either be:
    *   Renamed to `project_config.json` or `enabled_domains.yaml` and moved to a `config/` directory within `server/` or `client/` (depending on its consumer).
    *   If it *is* intended to have a prose component for human understanding, that prose should be added, clearly explaining what these domains represent and how changing them affects the system. The current dictionary content should probably be moved to a code comment or a separate configuration file.
    *   *Recommendation: Rename to `active_domains.json` (or similar) and move to `server/config/`. If a prose `PROJECT_CONTEXT.md` is desired, create a new one with actual project vision and goals, separate from this configuration list.*
*   **Client-Facing Suitability:** In its current form, this file is **not suitable for direct client-facing documentation**. It is technical configuration information. If Nexus aims to expose its domain architecture to clients, it should be done through a user-friendly document that explains each domain's purpose and value proposition.
