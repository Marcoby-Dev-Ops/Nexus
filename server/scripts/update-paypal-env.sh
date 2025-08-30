#!/bin/bash

# Update PayPal environment variables in Supabase to use live mode
echo "Updating PayPal environment variables to live mode..."

# Update the environment variables in your .env file
sed -i 's/PAYPAL_ENV=sandbox/PAYPAL_ENV=live/g' .env
sed -i 's/VITE_PAYPAL_ENV=sandbox/VITE_PAYPAL_ENV=live/g' .env

echo "✅ Updated .env file to use PayPal live mode"

# Note: You'll need to manually update the Supabase Edge Function environment variables
echo "⚠️  IMPORTANT: You need to manually update the Supabase Edge Function environment variables:"
echo "   1. Go to your Supabase dashboard"
echo "   2. Navigate to Settings > Edge Functions"
echo "   3. Update these environment variables:"
echo "      - PAYPAL_ENV=live"
echo "      - PAYPAL_CLIENT_ID=your_live_client_id"
echo "      - PAYPAL_CLIENT_SECRET=your_live_client_secret"
echo ""
echo "   4. Redeploy the PayPal Edge Functions:"
echo "      - paypal_oauth_callback"
echo "      - paypal_refresh_token"
echo "      - paypal_sync"
echo ""
echo "   5. Restart your development server:"
echo "      pnpm run dev" 