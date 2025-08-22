# Database Field Dictionary

This document serves as the authoritative reference for all database field mappings, their purposes, and where they should be set in the Nexus application.

## Table of Contents

- [User Profiles](#user-profiles)
- [Companies](#companies)
- [Business Profiles](#business-profiles)
- [Integrations](#integrations)
- [Thoughts Management](#thoughts-management)
- [FIRE Cycle System](#fire-cycle-system)
- [World Insights](#world-insights)
- [Action Items](#action-items)
- [Knowledge Insights](#knowledge-insights)
- [AI & Analytics](#ai--analytics)
- [Field Mapping Rules](#field-mapping-rules)

---

## User Profiles (`user_profiles`)

### Core Identity Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key (references `auth.users.id`) | Auth system | Required | ✅ Always set |
| `user_id` | UUID | **Should always match `id`** | Auth system | Required | ✅ Fixed |
| `email` | TEXT | Primary email address | Auth system | Required | ✅ Always set |
| `business_email` | TEXT | Work/professional email | AccountSettings | null | ❌ Missing |
| `personal_email` | TEXT | Personal email address | AccountSettings | null | ❌ Missing |

### Personal Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `first_name` | TEXT | First name | AccountSettings | null | ✅ Set |
| `last_name` | TEXT | Last name | AccountSettings | null | ✅ Set |
| `full_name` | TEXT | Auto-calculated from first + last | AccountSettings | null | ✅ Set |
| `display_name` | TEXT | Display name | AccountSettings | null | ❓ Not shown |
| `avatar_url` | TEXT | Profile picture URL | AccountSettings | null | ❓ Not shown |
| `bio` | TEXT | Biography | AccountSettings | null | ✅ Set |

### Work Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `role` | TEXT | User role in organization | AccountSettings | 'user' | ✅ 'owner' |
| `department` | TEXT | Department/team | AccountSettings | null | ✅ 'executive' |
| `job_title` | TEXT | Job title | AccountSettings | null | ✅ 'Co-Founder & CEO' |
| `company` | TEXT | Company name (string) | AccountSettings | null | ✅ 'Marcoby' |
| `company_id` | UUID | Company reference (foreign key) | OrganizationSetupStep | null | ❓ Not shown |

### Contact Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `phone` | TEXT | Primary phone number | AccountSettings | null | ❓ Not shown |
| `work_phone` | TEXT | Work phone number | AccountSettings | null | ❓ Not shown |
| `mobile` | TEXT | Mobile phone number | AccountSettings | null | ❓ Not shown |
| `linkedin_url` | TEXT | LinkedIn profile or website | AccountSettings | null | ✅ Set |

### Location & Preferences

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `location` | TEXT | Geographic location | AccountSettings | null | ✅ 'Fontana, CA' |
| `timezone` | TEXT | User's timezone | AccountSettings | 'UTC' | ❓ Not shown |
| `work_location` | TEXT | Work location type | AccountSettings | null | ❓ Not shown |
| `preferences` | JSONB | User preferences | AccountSettings | {} | ✅ Set |

### Professional Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `skills` | TEXT[] | Skills array | AccountSettings | [] | ❓ Not shown |
| `certifications` | TEXT[] | Certifications array | AccountSettings | [] | ❓ Not shown |
| `github_url` | TEXT | GitHub profile | AccountSettings | null | ❓ Not shown |
| `twitter_url` | TEXT | Twitter profile | AccountSettings | null | ❓ Not shown |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `onboarding_completed` | BOOLEAN | Onboarding status | Onboarding | false | ✅ Set |
| `profile_completion_percentage` | INTEGER | Profile completion % | AccountSettings | 0 | ✅ Calculated |
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Companies (`companies`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | OrganizationSetupStep | gen_random_uuid() | ✅ Set |
| `name` | TEXT | Company name | OrganizationSetupStep | Required | ✅ 'Marcoby' |
| `domain` | TEXT | Company domain | OrganizationSetupStep | null | ❓ Not shown |
| `website` | TEXT | Company website | OrganizationSetupStep | null | ❓ Not shown |
| `description` | TEXT | Company description | OrganizationSetupStep | null | ❓ Not shown |

### Business Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `industry` | TEXT | Industry classification | OrganizationSetupStep | null | ❓ Not shown |
| `size` | TEXT | Company size | OrganizationSetupStep | 'startup' | ❓ Not shown |
| `founded_year` | INTEGER | Year founded | OrganizationSetupStep | null | ❓ Not shown |
| `revenue_range` | TEXT | Revenue range | OrganizationSetupStep | null | ❓ Not shown |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Business Profiles (`business_profiles`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | BusinessSetup | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | BusinessSetup | Required | ✅ Set |
| `company_id` | UUID | Company reference | BusinessSetup | Required | ✅ Set |

### Business Metrics

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `revenue_trend` | TEXT | Revenue trend | BusinessAnalytics | null | ✅ Set |
| `customer_satisfaction_score` | NUMERIC | Customer satisfaction | BusinessAnalytics | null | ✅ Set |
| `employee_count` | INTEGER | Number of employees | BusinessSetup | null | ❓ Not shown |
| `customer_count` | INTEGER | Number of customers | BusinessAnalytics | null | ❓ Not shown |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Integrations (`user_integrations`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | IntegrationSetup | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | IntegrationSetup | Required | ✅ Set |
| `integration_id` | UUID | Integration reference | IntegrationSetup | Required | ✅ Set |
| `integration_type` | TEXT | Integration type | IntegrationSetup | Required | ✅ Set |
| `integration_name` | TEXT | Display name | IntegrationSetup | Required | ✅ Set |

### Status & Configuration

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `status` | TEXT | Integration status | IntegrationSetup | 'pending' | ✅ Set |
| `credentials` | JSONB | Integration credentials | IntegrationSetup | {} | ✅ Set |
| `settings` | JSONB | Integration settings | IntegrationSetup | {} | ✅ Set |
| `last_sync` | TIMESTAMPTZ | Last sync timestamp | IntegrationSync | null | ✅ Set |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Thoughts Management (`thoughts`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | ThoughtCapture | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | ThoughtCapture | Required | ✅ Set |
| `created_by` | UUID | Creator reference | ThoughtCapture | Required | ✅ Set |
| `updated_by` | UUID | Last updater | ThoughtCapture | Required | ✅ Set |

### Content & Classification

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `content` | TEXT | Thought content | ThoughtCapture | Required | ✅ Set |
| `category` | TEXT | Thought category | ThoughtCapture | 'idea' | ✅ Set |
| `status` | TEXT | Thought status | ThoughtCapture | 'concept' | ✅ Set |
| `personal_or_professional` | TEXT | Context classification | ThoughtCapture | 'professional' | ✅ Set |
| `main_sub_categories` | JSONB | Sub-categories | ThoughtCapture | [] | ✅ Set |
| `initiative` | BOOLEAN | Is initiative | ThoughtCapture | false | ✅ Set |
| `impact` | TEXT | Impact assessment | ThoughtCapture | null | ✅ Set |

### Workflow & Relationships

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `parent_idea_id` | UUID | Parent thought | ThoughtCapture | null | ✅ Set |
| `workflow_stage` | TEXT | Workflow stage | ThoughtCapture | 'create_idea' | ✅ Set |
| `department` | TEXT | Department context | ThoughtCapture | null | ✅ Set |
| `priority` | TEXT | Priority level | ThoughtCapture | 'medium' | ✅ Set |
| `estimated_effort` | TEXT | Effort estimate | ThoughtCapture | null | ✅ Set |

### AI & Interaction

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `ai_insights` | JSONB | AI-generated insights | AIProcessor | {} | ✅ Set |
| `interaction_method` | TEXT | Capture method | ThoughtCapture | 'text' | ✅ Set |
| `ai_clarification_data` | JSONB | AI clarifications | AIProcessor | {} | ✅ Set |

### Timestamps

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `creation_date` | TIMESTAMPTZ | Creation date | System | NOW() | ✅ Set |
| `last_updated` | TIMESTAMPTZ | Last update | System | NOW() | ✅ Set |
| `created_at` | TIMESTAMPTZ | DB creation | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | DB update | System | NOW() | ✅ Set |

---

## FIRE Cycle System (`fire_cycle_logs`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | FireCycleProcessor | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | FireCycleProcessor | Required | ✅ Set |
| `phase` | TEXT | FIRE phase | FireCycleProcessor | 'focus' | ✅ Set |

### Analysis & Insights

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `insights` | JSONB | Phase insights | FireCycleProcessor | [] | ✅ Set |
| `actions` | JSONB | Recommended actions | FireCycleProcessor | [] | ✅ Set |
| `priority` | TEXT | Priority level | FireCycleProcessor | 'medium' | ✅ Set |
| `confidence` | NUMERIC | Analysis confidence | FireCycleProcessor | 0.5 | ✅ Set |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## World Insights (`world_insights`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | WorldOverview | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | WorldOverview | Required | ✅ Set |
| `type` | TEXT | Insight type | WorldOverview | Required | ✅ Set |
| `title` | TEXT | Insight title | WorldOverview | Required | ✅ Set |
| `description` | TEXT | Insight description | WorldOverview | Required | ✅ Set |

### Impact & Urgency

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `impact` | TEXT | Impact level | WorldOverview | 'medium' | ✅ Set |
| `urgency` | TEXT | Urgency level | WorldOverview | 'ongoing' | ✅ Set |
| `source` | TEXT | Data source | WorldOverview | Required | ✅ Set |
| `action_url` | TEXT | Action URL | WorldOverview | null | ✅ Set |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Action Items (`action_items`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | ActionCenter | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | ActionCenter | Required | ✅ Set |
| `title` | TEXT | Action title | ActionCenter | Required | ✅ Set |
| `description` | TEXT | Action description | ActionCenter | Required | ✅ Set |
| `type` | TEXT | Action type | ActionCenter | Required | ✅ Set |

### Priority & Effort

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `priority` | TEXT | Priority level | ActionCenter | 'medium' | ✅ Set |
| `effort` | TEXT | Effort level | ActionCenter | 'moderate' | ✅ Set |
| `impact` | TEXT | Impact level | ActionCenter | 'medium' | ✅ Set |
| `status` | TEXT | Action status | ActionCenter | 'pending' | ✅ Set |

### Automation & AI

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `automation_possible` | BOOLEAN | Can be automated | ActionCenter | false | ✅ Set |
| `ai_assisted` | BOOLEAN | AI assistance | ActionCenter | true | ✅ Set |
| `source` | TEXT | Action source | ActionCenter | Required | ✅ Set |
| `context` | TEXT | Business context | ActionCenter | null | ✅ Set |

### Timestamps

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `due_date` | TIMESTAMPTZ | Due date | ActionCenter | null | ✅ Set |
| `estimated_time` | INTEGER | Time in minutes | ActionCenter | 30 | ✅ Set |
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## Knowledge Insights (`knowledge_insights`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `id` | UUID | Primary key | KnowledgeEnhancer | gen_random_uuid() | ✅ Set |
| `user_id` | UUID | User reference | KnowledgeEnhancer | Required | ✅ Set |
| `title` | TEXT | Insight title | KnowledgeEnhancer | Required | ✅ Set |
| `description` | TEXT | Insight description | KnowledgeEnhancer | Required | ✅ Set |
| `type` | TEXT | Insight type | KnowledgeEnhancer | Required | ✅ Set |

### Analysis & Confidence

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `source` | TEXT | Data source | KnowledgeEnhancer | Required | ✅ Set |
| `confidence` | NUMERIC | Confidence score | KnowledgeEnhancer | 0.5 | ✅ Set |
| `impact` | TEXT | Impact level | KnowledgeEnhancer | 'medium' | ✅ Set |
| `urgency` | TEXT | Urgency level | KnowledgeEnhancer | 'ongoing' | ✅ Set |

### Data & Integration

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `data_points` | INTEGER | Number of data points | KnowledgeEnhancer | 0 | ✅ Set |
| `actionable` | BOOLEAN | Is actionable | KnowledgeEnhancer | true | ✅ Set |
| `action_url` | TEXT | Action URL | KnowledgeEnhancer | null | ✅ Set |
| `related_integrations` | TEXT[] | Related integrations | KnowledgeEnhancer | [] | ✅ Set |
| `ai_generated` | BOOLEAN | AI generated | KnowledgeEnhancer | true | ✅ Set |

### System Fields

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `created_at` | TIMESTAMPTZ | Creation timestamp | System | NOW() | ✅ Set |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | System | NOW() | ✅ Set |

---

## AI & Analytics (`ai_insights`)

### Core Information

| Field | Type | Purpose | Where Set | Default | Status |
|-------|------|---------|-----------|---------|--------|
| `user_id` | UUID | User reference | AI analysis | Required | ✅ Set |
| `insight_type` | TEXT | Type of insight | AI analysis | Required | ✅ Set |
| `content` | JSONB | Insight content | AI analysis | {} | ✅ Set |
| `priority` | TEXT | Insight priority | AI analysis | 'medium' | ✅ Set |

---

## Field Mapping Rules

### 1. User Profile Rules

- **`id` and `user_id`**: Must always be identical (both reference `auth.users.id`)
- **`full_name`**: Auto-calculated from `first_name + last_name` when both are present
- **`business_email`**: Should be work email (e.g., `von@marcoby.com`)
- **`personal_email`**: Should be personal email (e.g., `vonj@gmail.com`)
- **`role`**: Must be one of: 'owner', 'admin', 'manager', 'user'
- **`department`**: Should match company structure (e.g., 'executive', 'sales', 'marketing')

### 2. Company Profile Rules

- **`name`**: Company legal name
- **`domain`**: Primary company domain (e.g., `marcoby.com`)
- **`website`**: Full website URL (e.g., `https://marcoby.com`)
- **`size`**: Must be one of: 'startup', 'small', 'medium', 'large', 'enterprise'

### 3. Integration Rules

- **`integration_type`**: Must match supported integrations (e.g., 'microsoft', 'google', 'hubspot')
- **`status`**: Must be one of: 'pending', 'active', 'error', 'disabled'
- **`settings`**: Should contain integration-specific configuration

### 4. Thought Management Rules

- **`category`**: Must be one of: 'idea', 'task', 'reminder', 'update'
- **`status`**: Must be one of: 'future_goals', 'concept', 'in_progress', 'completed', 'pending', 'reviewed', 'implemented', 'not_started', 'upcoming', 'due', 'overdue'
- **`workflow_stage`**: Must be one of: 'create_idea', 'update_idea', 'implement_idea', 'achievement'
- **`personal_or_professional`**: Must be one of: 'personal', 'professional'

### 5. FIRE Cycle Rules

- **`phase`**: Must be one of: 'focus', 'insight', 'roadmap', 'execute'
- **`priority`**: Must be one of: 'critical', 'high', 'medium', 'low'
- **`confidence`**: Must be between 0.0 and 1.0

### 6. Action Item Rules

- **`type`**: Must be one of: 'task', 'automation', 'decision', 'meeting', 'analysis', 'optimization'
- **`priority`**: Must be one of: 'critical', 'high', 'medium', 'low'
- **`effort`**: Must be one of: 'quick', 'moderate', 'intensive'
- **`status`**: Must be one of: 'pending', 'in_progress', 'completed', 'deferred'

### 7. Knowledge Insight Rules

- **`type`**: Must be one of: 'pattern', 'trend', 'anomaly', 'opportunity', 'risk', 'prediction'
- **`impact`**: Must be one of: 'high', 'medium', 'low'
- **`urgency`**: Must be one of: 'immediate', 'today', 'this-week', 'ongoing'
- **`confidence`**: Must be between 0.0 and 1.0

### 8. Data Consistency Rules

- **Foreign Keys**: Always use UUIDs for relationships
- **Timestamps**: Always use `created_at` and `updated_at` with `TIMESTAMPTZ`
- **JSONB Fields**: Use for flexible data structures
- **Arrays**: Use `TEXT[]` for simple lists, `JSONB` for complex objects

---

## Current Issues & TODOs

### ❌ Missing Fields (Need Implementation)

1. **`business_email`** - Add to AccountSettings form ✅ (Added)
2. **`personal_email`** - Add to AccountSettings form ✅ (Added)
3. **`display_name`** - Show in AccountSettings form
4. **`company_id`** - Set during organization setup
5. **Company fields** - Complete organization setup flow

### ⚠️ Inconsistent Data (Need Fixes)

1. **`user_id`** - Fixed ✅ (Now consistent with `id`)
2. **`full_name`** - Fixed ✅ (Now calculated from first + last)
3. **`role`** - Fixed ✅ (Now set to 'owner')
4. **`department`** - Fixed ✅ (Now set to 'executive')

### 🔄 Ongoing Maintenance

1. **Profile completion calculation** - Update to include new fields
2. **Data validation** - Add constraints and checks
3. **Migration scripts** - Create for future schema changes
4. **Documentation** - Keep this dictionary updated

---

## Usage Guidelines

### For Developers

1. **Always check this dictionary** before adding new fields
2. **Follow the mapping rules** for data consistency
3. **Update this document** when adding new fields
4. **Use the provided field types** and constraints

### For Database Changes

1. **Create migrations** for all schema changes
2. **Update this dictionary** with new fields
3. **Test data consistency** after changes
4. **Document breaking changes** clearly

### For Frontend Development

1. **Use the correct field names** from this dictionary
2. **Handle null values** appropriately
3. **Validate data** before saving
4. **Show appropriate placeholders** for missing data

---

*Last updated: 2025-01-22*
*Maintained by: Development Team* 