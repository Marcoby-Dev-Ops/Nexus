#!/bin/bash

# Test Supabase Functions Script
# Tests the newly implemented functions with local Supabase instance

set -e

echo "🧪 Testing Supabase Functions"
echo "============================="

# Local Supabase URLs
LOCAL_API_URL="http://127.0.0.1:54321"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "[INFO] Testing functions with local Supabase instance..."

# Test 1: Health check
echo "[TEST 1] Testing function availability..."
curl -s -X GET "${LOCAL_API_URL}/functions/v1/ai_embed_document" \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" | jq '.' || echo "Function not available (expected for local)"

# Test 2: Test ai_generate_suggestions
echo "[TEST 2] Testing ai_generate_suggestions..."
curl -s -X POST "${LOCAL_API_URL}/functions/v1/ai_generate_suggestions" \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "marketing",
    "context": "We are a SaaS startup looking to increase our user base",
    "companyInfo": {
      "industry": "Technology",
      "size": "10-50 employees",
      "stage": "growth"
    },
    "userId": "test-user-123",
    "constraints": {
      "budget": 5000,
      "timeline": "3 months"
    }
  }' | jq '.' || echo "Function test failed"

# Test 3: Test ai_metrics_daily
echo "[TEST 3] Testing ai_metrics_daily..."
curl -s -X POST "${LOCAL_API_URL}/functions/v1/ai_metrics_daily" \
  -H "Authorization: Bearer ${LOCAL_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'$(date +%Y-%m-%d)'",
    "userId": "test-user-123",
    "includeAnalysis": true
  }' | jq '.' || echo "Function test failed"

echo "[INFO] Function tests completed!"
echo "[INFO] Check the responses above for any errors."
echo "[INFO] You can also test functions manually using the Studio at: http://127.0.0.1:54323" 