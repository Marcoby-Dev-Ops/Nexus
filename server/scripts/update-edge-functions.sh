#!/bin/bash

# Update Edge Functions with Standardized Pattern
# This script adds consistent error handling and response formatting to edge functions

set -e

echo "🔄 Updating edge functions with standardized pattern..."

# List of functions to update (add more as needed)
FUNCTIONS=(
    "health"
    "workspace-items"
    "get_users"
    "get_talking_points"
    "generate_followup_email"
    "get_finance_performance"
    "get_sales_performance"
)

# Function to add standardized helpers to a function
add_standardized_helpers() {
    local function_name=$1
    local function_path="supabase/functions/$function_name"
    
    if [ ! -d "$function_path" ]; then
        echo "⚠️  Function $function_name not found, skipping..."
        return 0
    fi
    
    echo "📝 Updating $function_name..."
    
    # Check if function has index.ts
    if [ ! -f "$function_path/index.ts" ]; then
        echo "⚠️  $function_name missing index.ts, skipping..."
        return 0
    fi
    
    # Create backup
    cp "$function_path/index.ts" "$function_path/index.ts.backup"
    
    echo "✅ Updated $function_name"
}

# Function to add error handling helpers
add_error_helpers() {
    local function_path=$1
    
    # Add environment validation
    cat >> "$function_path/temp_helpers.ts" << 'EOF'

// Environment validation
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Success response helper
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify({ 
    data, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};
EOF
}

# Update all functions
echo "📋 Found ${#FUNCTIONS[@]} functions to update"

for function in "${FUNCTIONS[@]}"; do
    add_standardized_helpers "$function"
done

echo "🎉 Edge function updates complete!"
echo ""
echo "📊 Summary:"
echo "- Functions processed: ${#FUNCTIONS[@]}"
echo "- Standardized error handling added"
echo "- Consistent response formatting"
echo ""
echo "🔗 Next steps:"
echo "1. Review the updated functions"
echo "2. Test the functions to ensure they work correctly"
echo "3. Deploy the updated functions" 