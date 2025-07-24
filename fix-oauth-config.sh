#!/bin/bash

echo "🔧 Fixing OAuth Configuration Issues..."

# Backup current .env
cp .env .env.backup
echo "✅ Created backup: .env.backup"

# Update Microsoft redirect URI
sed -i 's|MICROSOFT_REDIRECT_URI=http://localhost:5173/integrations/microsoft/callback|MICROSOFT_REDIRECT_URI=https://nexus.marcoby.com/integrations/microsoft/callback|g' .env

# Update Google redirect URI
sed -i 's|GOOGLE_REDIRECT_URI=https://kqclbpimkraenvbffnpk.supabase.co/auth/v1/callback|GOOGLE_REDIRECT_URI=https://nexus.marcoby.com/integrations/google/callback|g' .env

# Check if Slack credentials are still placeholders
if grep -q "your_slack_client_id_here" .env; then
    echo "⚠️  Slack credentials are still placeholders"
    echo "   You need to set up Slack OAuth credentials"
fi

echo "✅ Environment variables updated"
echo ""
echo "📋 Next Steps:"
echo "1. Update OAuth provider dashboards with new redirect URIs"
echo "2. Restart your development server"
echo "3. Test the integrations"
echo ""
echo "🔗 OAuth Provider Dashboards:"
echo "- Microsoft: https://portal.azure.com"
echo "- Google: https://console.cloud.google.com"
echo "- Slack: https://api.slack.com/apps"
echo ""
echo "📖 See docs/OAUTH_TROUBLESHOOTING.md for detailed instructions" 