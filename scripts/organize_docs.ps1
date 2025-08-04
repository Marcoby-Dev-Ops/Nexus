# Documentation Organization Script
# This script moves files from docs/ root to appropriate subdirectories

Write-Host "Starting documentation organization..." -ForegroundColor Green

# Create directories if they don't exist
$directories = @(
    "docs/current/architecture",
    "docs/current/development", 
    "docs/current/deployment",
    "docs/current/features",
    "docs/current/guides",
    "docs/legacy/cleanup",
    "docs/legacy/migrations"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Current Documentation - Core
$currentCore = @(
    "PROJECT_OVERVIEW.md",
    "QUICK_START_GUIDE.md", 
    "GETTING_STARTED_DEV.md",
    "DEVELOPMENT.md",
    "FRONTEND_SUPABASE_GUIDE.md"
)

# Current Documentation - Architecture
$currentArchitecture = @(
    "UNIFIED_ARCHITECTURE.md",
    "SERVICE_LAYER_ARCHITECTURE.md",
    "RLS_POLICY_STANDARDS.md",
    "RLS_AUTHENTICATION_STANDARD.md",
    "WORLD_CLASS_USER_MANAGEMENT.md",
    "SIMPLIFIED_USER_MANAGEMENT.md"
)

# Current Documentation - Development
$currentDevelopment = @(
    "FORMS_GUIDE.md",
    "UI_COMPONENTS.md",
    "WSL_TROUBLESHOOTING.md",
    "OAUTH_CONFIGURATION_GUIDE.md",
    "OAUTH_TROUBLESHOOTING.md",
    "INTEGRATION_AUTHENTICATION_PATTERNS.md"
)

# Current Documentation - Features
$currentFeatures = @(
    "FIRE_CYCLE_SYSTEM.md",
    "FIRE_CYCLE_ENHANCED_FEATURES.md",
    "MICROSOFT_365_INTEGRATION.md",
    "MICROSOFT_ARCHITECTURE.md",
    "MICROSOFT_GRAPH_TOOLKIT_TROUBLESHOOTING.md",
    "n8n-integration-guide.md",
    "onboarding-verification-strategy.md"
)

# Current Documentation - Deployment
$currentDeployment = @(
    "REMOTE_SYNC_WORKFLOW.md",
    "MARCOBY_BUSINESS_SETUP.md",
    "github-project-setup.md",
    "PAYPAL_LIVE_SETUP.md",
    "PAYPAL_OAUTH_SETUP.md",
    "PAYPAL_OAUTH_MODERN_SETUP.md",
    "PAYPAL_OAUTH_TROUBLESHOOTING.md",
    "PAYPAL_PRODUCTION_TEST.md"
)

# Current Documentation - Guides
$currentGuides = @(
    "ONBOARDING.md",
    "FIELD_MAPPING_QUICK_REFERENCE.md"
)

# Legacy Documentation - Cleanup
$legacyCleanup = @(
    "LEGACY_FILE_REMOVAL_PLAN.md",
    "CLEANUP_FINAL_SUMMARY.md",
    "CLEANUP_SUMMARY.md",
    "CLEANUP_PLAN.md",
    "CLEANUP_PRIORITY_ROADMAP.md",
    "LEGACY_CLEANUP_SUMMARY.md",
    "TODO.md",
    "TODO_ANALYSIS.md",
    "REDUNDANCY_ELIMINATION_PLAN.md",
    "PAGE_REDUNDANCY_ELIMINATION_PLAN.md",
    "ARCHITECTURE_STANDARDIZATION_SUMMARY.md",
    "UX_UI_CONSISTENCY_IMPROVEMENTS_SUMMARY.md",
    "MOCK_DATA_INVENTORY.md",
    "FIRE_Nexus_Conversation_Export.md"
)

# Legacy Documentation - Migrations
$legacyMigrations = @(
    "SERVICE_MIGRATION_SUMMARY.md",
    "SERVICE_LAYER_CLEANUP_SUMMARY.md",
    "SERVICE_CONSOLIDATION_PLAN.md",
    "COMPONENT_MIGRATION_GUIDE.md",
    "FORMS_MIGRATION_SUMMARY.md",
    "FORMS_VALIDATION_CLEANUP_PLAN.md",
    "API_SERVICE_CLEANUP_PLAN.md",
    "MIGRATION_CONSOLIDATION_SUMMARY.md",
    "MIGRATION_STRATEGY.md",
    "MIGRATION_EMERGENCY_GUIDE.md",
    "LEGACY_SYSTEM_MIGRATION.md",
    "COMPANY_SERVICE_MIGRATION_SUMMARY.md",
    "FINAL_IMPORT_UPDATE_SUMMARY.md",
    "MISSING_FILES_ANALYSIS.md",
    "INDEX_FILES_VERIFICATION.md",
    "LINT_CONFIG_STATUS.md",
    "MICROSOFT_365_INTEGRATION_MIGRATION.md"
)

# Function to move files
function Move-Files {
    param(
        [string[]]$Files,
        [string]$Destination,
        [string]$Category
    )
    
    foreach ($file in $Files) {
        $sourcePath = "docs/$file"
        $destPath = "docs/$Destination/$file"
        
        if (Test-Path $sourcePath) {
            try {
                Move-Item $sourcePath $destPath -Force
                Write-Host "✓ Moved $file to $Category" -ForegroundColor Green
            }
            catch {
                $errorMsg = $_.Exception.Message
                Write-Host "Failed to move $file: $errorMsg" -ForegroundColor Red
            }
        }
        else {
            Write-Host "⚠ File not found: $file" -ForegroundColor Yellow
        }
    }
}

# Move current documentation
Write-Host "`nMoving current documentation..." -ForegroundColor Cyan
Move-Files $currentCore "current" "Core Documentation"
Move-Files $currentArchitecture "current/architecture" "Architecture"
Move-Files $currentDevelopment "current/development" "Development"
Move-Files $currentFeatures "current/features" "Features"
Move-Files $currentDeployment "current/deployment" "Deployment"
Move-Files $currentGuides "current/guides" "Guides"

# Move legacy documentation
Write-Host "`nMoving legacy documentation..." -ForegroundColor Cyan
Move-Files $legacyCleanup "legacy/cleanup" "Legacy Cleanup"
Move-Files $legacyMigrations "legacy/migrations" "Legacy Migrations"

# Move remaining files that should be in current
$remainingCurrent = @(
    "NEXT_GENERATION_BUSINESS_OS_VISION.md",
    "NEXUS_VISION_EXECUTION_PLAN.md",
    "NEXUS_BLOG_IDEAS_AND_MESSAGING.md",
    "MVP_LAUNCH_CHECKLIST.md",
    "MVP_FEEDBACK_LOOPS_ANALYSIS.md"
)

Move-Files $remainingCurrent "current" "Vision and Strategy"

Write-Host "`nDocumentation organization complete!" -ForegroundColor Green
Write-Host "Check the remaining files in docs/ root that may need manual categorization." -ForegroundColor Yellow 