Param(
  [switch]$DryRun
)

# Ensure gh is authenticated
try {
  gh auth status -h github.com | Out-Null
} catch {
  Write-Error "GitHub CLI not authenticated. Run 'gh auth login' and retry."; exit 1
}

# Define labels (name, color, description)
$labels = @(
  @{ name = 'area: tasks'; color = '1f77b4'; desc = 'Tasks & Inbox' },
  @{ name = 'area: dashboard'; color = 'ff7f0e'; desc = 'Dashboards & navigation' },
  @{ name = 'area: admin'; color = '2ca02c'; desc = 'Admin & organizations' },
  @{ name = 'area: onboarding'; color = '17becf'; desc = 'Onboarding flows' },
  @{ name = 'area: ai'; color = '9467bd'; desc = 'AI pages & settings' },
  @{ name = 'area: fire-cycle'; color = '8c564b'; desc = 'FIRE cycle & cross-departmental intelligence' },
  @{ name = 'area: integrations'; color = 'e377c2'; desc = 'Integrations & services' },
  @{ name = 'area: edge-functions'; color = '7f7f7f'; desc = 'Supabase Edge Functions' },
  @{ name = 'area: sql'; color = 'bcbd22'; desc = 'SQL migrations & RPCs' },
  @{ name = 'type: implementation'; color = '28a745'; desc = 'New implementation work' },
  @{ name = 'type: refactor'; color = '0366d6'; desc = 'Refactor to standards' },
  @{ name = 'priority: high'; color = 'd73a4a'; desc = 'High priority' },
  @{ name = 'priority: medium'; color = 'fbca04'; desc = 'Medium priority' },
  @{ name = 'priority: low'; color = '0e8a16'; desc = 'Low priority' }
)

foreach ($l in $labels) {
  # Create label if missing; ignore if exists
  try {
    gh label create "$($l.name)" --color "$($l.color)" --description "$($l.desc)" 2>$null
  } catch {
    # If creation fails (probably exists), continue
  }
}

# Issues to create
$issues = @(
  @{ title = 'UnifiedInbox: implement error tracking and user-facing notifications'; 
     body = @'
File: src/components/tasks/UnifiedInbox.tsx

- Implement proper error tracking and user-facing error handling
- Integrate with notification/toast system
- Add tests for error scenarios

Acceptance Criteria:
- Errors are captured, logged via logger, and user sees actionable feedback
- Unit tests cover failure paths
'@;
     labels = @('area: tasks','type: implementation','priority: medium') },
  @{ title = 'UnifiedInbox: add mailbox setup flow'; 
     body = @'
File: src/components/tasks/UnifiedInbox.tsx

- Implement “Add mailbox” flow (modal or route) with validation
- Wire into mailbox configuration service/API

Acceptance Criteria:
- Users can add a mailbox via UI and it persists
'@;
     labels = @('area: tasks','type: implementation','priority: medium') },
  @{ title = 'PersonalTrinityWidget: implement "See all" navigation'; 
     body = @'
File: src/components/dashboard/PersonalTrinityWidget.tsx

- Replace alert placeholder with navigation to full pages

Acceptance Criteria:
- Buttons navigate to correct routes
'@;
     labels = @('area: dashboard','type: implementation','priority: low') },
  @{ title = 'DataSourceConnections: implement connection flows (OAuth/wizards)'; 
     body = @'
File: src/components/dashboard/DataSourceConnections.tsx

- Implement actual connection logic invoking integration services
- Support OAuth wizard flows

Acceptance Criteria:
- Clicking connect launches flow and updates status on success
'@;
     labels = @('area: integrations','type: implementation','priority: high') },
  @{ title = 'OrganizationMembers: invite, role update, removal; actions dropdown'; 
     body = @'
File: src/pages/organizations/[orgId]/OrganizationMembersPage.tsx

- Implement member invitation, role update, removal via service calls
- Add actions dropdown for member rows

Acceptance Criteria:
- All actions persist via services and update UI state
'@;
     labels = @('area: admin','type: implementation','priority: high') },
  @{ title = 'OrganizationSettings: implement update and deletion service calls'; 
     body = @'
File: src/pages/organizations/[orgId]/OrganizationSettingsPage.tsx

- Implement organization update and deletion via service layer

Acceptance Criteria:
- Save/Delete perform real operations with confirmation and error handling
'@;
     labels = @('area: admin','type: implementation','priority: high') },
  @{ title = 'Onboarding: implement step completion logic'; 
     body = @'
File: src/components/admin/onboarding/hooks/useOnboarding.ts

- Implement real step completion persistence using onboarding tables/RPC

Acceptance Criteria:
- Completing a step writes to user_onboarding_steps and updates UI
'@;
     labels = @('area: onboarding','type: implementation','priority: high') },
  @{ title = 'Onboarding Questionnaire: submit answers to backend'; 
     body = @'
File: src/components/admin/onboarding/pages/Questionnaire.tsx

- Replace simulated API with real submission

Acceptance Criteria:
- Answers stored; success/error UX handled
'@;
     labels = @('area: onboarding','type: implementation','priority: medium') },
  @{ title = 'Onboarding Assessment: replace mock assessment API'; 
     body = @'
File: src/components/admin/onboarding/hooks/useAssessmentData.ts

- Replace mock data with service call + types

Acceptance Criteria:
- Hook returns real data; loading/error states covered by tests
'@;
     labels = @('area: onboarding','type: implementation','priority: medium') },
  @{ title = 'Subscription Hook: replace mock with real API'; 
     body = @'
File: src/components/admin/user/hooks/useSubscription.ts

- Replace mock plan getter with real subscription API

Acceptance Criteria:
- Plan reflects backend; error state surfaced
'@;
     labels = @('area: admin','type: implementation','priority: medium') },
  @{ title = 'AIHub: replace agent fetch stubs with service calls'; 
     body = @'
File: src/pages/ai/AIHubPage.tsx

- Implement getAllAgents/getAgentsByType via service layer

Acceptance Criteria:
- Agents render from real data; empty/error handled
'@;
     labels = @('area: ai','type: implementation','priority: medium') },
  @{ title = 'ChatPage: replace agent fetch stubs with real services'; 
     body = @'
File: src/pages/ai/ChatPage.tsx

- Replace TODO stubs for agent fetching with service calls

Acceptance Criteria:
- Chat agent lists load from service; failure handled
'@;
     labels = @('area: ai','type: implementation','priority: medium') },
  @{ title = 'AI Settings: load/save settings via API'; 
     body = @'
File: src/pages/ai/AISettingsPage.tsx

- Implement load/save using aiService

Acceptance Criteria:
- Settings persist and reflect current values
'@;
     labels = @('area: ai','type: implementation','priority: medium') },
  @{ title = 'AI Models: default update, testing, and update APIs'; 
     body = @'
File: src/pages/ai/AIModelPage.tsx

- Implement API call for default model update
- Implement model testing flow
- Implement model updates via API

Acceptance Criteria:
- Actions persist and show feedback states
'@;
     labels = @('area: ai','type: implementation','priority: medium') },
  @{ title = 'AI Agent: implement agent update/delete APIs'; 
     body = @'
File: src/pages/ai/AIAgentPage.tsx

- Implement update and delete via service layer

Acceptance Criteria:
- Changes persist; UI list updates accordingly
'@;
     labels = @('area: ai','type: implementation','priority: medium') },
  @{ title = 'FIRE Cycle: implement action execution in fireCycleAgent'; 
     body = @'
File: src/core/fire-cycle/fireCycleAgent.ts

- Implement actual action execution (tasks, projects, etc.)

Acceptance Criteria:
- Actions execute via service; tests for side-effects
'@;
     labels = @('area: fire-cycle','type: implementation','priority: medium') },
  @{ title = 'Cross-Dept Sync: DB loading and real-time intelligence generation'; 
     body = @'
File: src/services/integrations/realTimeCrossDepartmentalSync.ts

- Load recent intelligence and department data from DB
- Implement real-time intelligence generation

Acceptance Criteria:
- Service produces non-empty intelligence from real data
'@;
     labels = @('area: integrations','type: implementation','priority: high') },
  @{ title = 'Shared util: implement realTimeCrossDepartmentalSync utilities'; 
     body = @'
File: client/src/shared/lib/core/realTimeCrossDepartmentalSync.ts

- Implement utility functions
'@;
     labels = @('area: integrations','type: implementation','priority: low') },
  @{ title = 'Shared util: implement nexusUnifiedBrain utilities'; 
     body = @'
File: client/src/shared/lib/core/nexusUnifiedBrain.ts

- Implement utility functions
'@;
     labels = @('area: integrations','type: implementation','priority: low') },
  @{ title = 'Core util: implement constants utilities/structure'; 
     body = @'
File: src/core/constants.ts

- Implement core constants and structure
'@;
     labels = @('area: integrations','type: implementation','priority: low') },
  @{ title = 'Edge Function: implement business_health logic using services'; 
     body = @'
File: supabase/functions/business_health/index.ts

- Implement business health logic via BusinessService patterns

Acceptance Criteria:
- Returns computed health from live data
'@;
     labels = @('area: edge-functions','type: implementation','priority: high') },
  @{ title = 'Edge Functions: refactor to standardized service-layer patterns'; 
     body = @'
Refactor the following functions to call standardized service-layer methods (remove duplicated logic):

- update_user_role → UserService.bulkUpdateRoles
- sync_user_profile → UserService.updateUserProfile
- ops_metrics_ingest → AnalyticsService.ingestMetrics
- merge-thoughts → AIService.mergeThoughts
- get_sales_performance → AnalyticsService.getSalesPerformance
- get_finance_performance → AnalyticsService.getFinancePerformance
- email-analysis → EmailIntelligenceService.processIncomingEmail
- company-enrichment → CompanyService.enrichCompanyData
- ai_metrics_daily → AnalyticsService.collectDailyMetrics
- ai_generate_suggestions → AIService.generateSuggestions
- ai_generate_business_plan → BusinessService.generateBusinessPlan
- ai_embed_thought, ai_embed_document, ai_embed_company_profile → AIService.generateEmbedding/embedCompanyProfile

Acceptance Criteria:
- Each function delegates to service-layer with consistent error handling
'@;
     labels = @('area: edge-functions','type: refactor','priority: medium') },
  @{ title = 'Email Webhook: implement signature verification and notification retry'; 
     body = @'
File: supabase/functions/email-webhook/index.ts

- Implement provider-specific signature verification
- Implement retry mechanism for failed notifications

Acceptance Criteria:
- Invalid signatures rejected; notification retries logged
'@;
     labels = @('area: edge-functions','type: implementation','priority: high') },
  @{ title = 'Assistant Function: multi-modal inputs and extended RAG'; 
     body = @'
File: supabase/functions/assistant/index.ts

- Handle voice/file/clipboard inputs
- Extend RAG to tasks, reminders, docs, CRM, calendar

Acceptance Criteria:
- Inputs processed; context sources configurable
'@;
     labels = @('area: edge-functions','type: implementation','priority: medium') },
  @{ title = 'SQL RPC: implement get_personal_analytics function logic'; 
     body = @'
File: supabase/migrations/20250805000005_create_get_personal_analytics_function.sql

- Implement analytics logic for personal analytics RPC

Acceptance Criteria:
- Function returns meaningful analytics with tests
'@;
     labels = @('area: sql','type: implementation','priority: medium') }
)

# Create issues
$created = @()
foreach ($i in $issues) {
  $labelArgs = @()
  foreach ($lab in $i.labels) { $labelArgs += @('-l', $lab) }
  if ($DryRun) {
    Write-Host "DRY RUN: gh issue create -t `"$($i.title)`" ... labels: $($i.labels -join ', ')"
  } else {
    $out = gh issue create -t "$($i.title)" -b "$($i.body)" @labelArgs 2>$null
    if ($LASTEXITCODE -eq 0) {
      $created += $out
      Write-Host "Created: $out"
    } else {
      Write-Warning "Failed to create issue: $($i.title)"
    }
  }
}

Write-Host "Total created: $($created.Count)"
