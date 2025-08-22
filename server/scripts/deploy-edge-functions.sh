#!/bin/bash

# Deploy Edge Functions to Remote Supabase
# This script deploys all edge functions to the remote database

set -e

echo "🚀 Deploying Edge Functions to Remote Supabase..."

# Get the project ID from environment
PROJECT_ID="kqclbpimkraenvbffnpk"

# List of functions to deploy (add more as needed)
FUNCTIONS=(
    "ai_chat"
    "ai_agent_router"
    "company-enrichment"
    "ai_rag_chat"
    "ai_generate_thought_suggestions"
    "ai_embed_thought"
    "ai_conversation_summariser"
    "ai_embed_document"
    "ai_execute_action"
    "ai_generate_suggestions"
    "ai_ea_stream"
    "ai_metrics_daily"
    "ai_email_sync"
    "ai_generate_business_plan"
    "ai_embed_company_profile"
    "ai_sync_cloud_storage"
    "brain_analysis"
    "merge-thoughts"
    "verify-domain"
    "health"
    "assistant"
    "pipeline"
    "contacts"
    "deals"
    "google-oauth-callback"
    "microsoft-graph-oauth-callback"
    "create_or_reset_test_user"
    "credential-manager"
    "update_user_role"
    "get_users"
    "get_talking_points"
    "generate_followup_email"
    "get_finance_performance"
    "get_sales_performance"
    "integration-data-ingestor"
    "trigger-n8n-workflow"
    "ai-rag-assessment-chat"
    "submit-assessment-response"
    "business_health"
    "ninjarmm-oauth-callback"
    "supabase"
    "stripe-customer-portal"
    "stripe-subscription-webhook"
    "stripe-checkout-session"
    "complete-founder-onboarding"
    "hubspot-callback"
    "sync_user_profile"
    "ops_action_worker"
    "ops_metrics_ingest"
    "paypal_refresh_token"
    "paypal_oauth_callback"
    "paypal_sync"
    "upsert_kpis"
    "passkey-register-challenge"
    "passkey-auth-verify"
    "passkey-auth-challenge"
    "passkey-register-verify"
    "healthz"
    "ai_embed_document"
    "workspace-items"
    "stripe-billing"
    "chat"
)

# Function to deploy a single edge function
deploy_function() {
    local function_name=$1
    local function_path="supabase/functions/$function_name"
    
    if [ ! -d "$function_path" ]; then
        echo "⚠️  Function $function_name not found, skipping..."
        return 0
    fi
    
    echo "📦 Deploying $function_name..."
    
    # Check if function has index.ts
    if [ ! -f "$function_path/index.ts" ]; then
        echo "⚠️  $function_name missing index.ts, skipping..."
        return 0
    fi
    
    # Deploy using Supabase CLI
    if pnpm supabase functions deploy "$function_name" --project-ref "$PROJECT_ID"; then
        echo "✅ Successfully deployed $function_name"
    else
        echo "❌ Failed to deploy $function_name"
        return 1
    fi
}

# Deploy all functions
echo "📋 Found ${#FUNCTIONS[@]} functions to deploy"

for function in "${FUNCTIONS[@]}"; do
    deploy_function "$function"
done

echo "🎉 Edge function deployment complete!"
echo ""
echo "📊 Summary:"
echo "- Deployed to project: $PROJECT_ID"
echo "- Functions processed: ${#FUNCTIONS[@]}"
echo ""
echo "🔗 Your functions are now available at:"
echo "https://$PROJECT_ID.supabase.co/functions/v1/" 