# Self-Serve Onboarding Guide

Welcome to Nexus!

This guide is designed to help you prepare your environment and gather the necessary information for a smooth and rapid deployment of your Nexus instance. Follow this checklist to get ready.

## Your First Steps: Setting Up Nexus

### A. Essential Information & Decisions

Before you begin the setup wizard, have these answers ready:

1.  **Your Nexus URL Strategy:**
    *   What subdomain will Nexus use? (e.g., `app.yourcompany.com`)
    *   Do you have access to manage the DNS records for this domain?

2.  **Administrator Email:**
    *   Who will be the primary administrator for your Nexus account? This email will receive the initial login credentials.

3.  **Estimated Usage:**
    *   To help us optimize performance for your team, please estimate:
        *   Number of active users in the first month.
        *   How heavily do you expect your team to use AI features (Low/Medium/High)?
        *   How many integrations do you plan to connect initially?

4.  **Data Location:**
    *   Do you have any specific requirements for where your data is stored globally (e.g., US, EU, APAC)?

### B. Connecting Your Tools (Integrations)

To unlock Nexus's full power, you'll want to connect your existing business applications.

1.  **Identify Key Integrations:**
    *   List out the tools you want to connect (e.g., Salesforce, HubSpot, Jira, Slack, QuickBooks).

2.  **Prepare Access:**
    *   Ensure you have **admin-level access** to these applications.
    *   You will likely need to authorize Nexus via OAuth (logging in to the tool through Nexus) or generate an **API Key** from the tool's settings. Have these credentials or permissions ready.

### C. Domain & Network Preparation

1.  **DNS Access:**
    *   You will need to log in to your domain registrar or DNS provider (e.g., Cloudflare, GoDaddy, Route 53).
    *   You will be asked to create **CNAME** or **A Records** to point your chosen subdomain (e.g., `app.yourcompany.com`) to our servers.
    *   We will provide the exact IP addresses or target domains during the setup process.

2.  **IT Collaboration (If Applicable):**
    *   If your organization has strict network firewalls, let your IT team know that Nexus will require outbound access. We can provide specific IPs for whitelisting if needed.

### D. Account & Security

1.  **Single Sign-On (SSO):**
    *   (Enterprise Plan Only) If you plan to use SSO (Okta, Azure AD, etc.), have your IT team ready to provide your Identity Provider's configuration details (Client ID, Secret, Metadata URL).

2.  **Compliance:**
    *   If your industry has specific compliance needs (HIPAA, GDPR), please review our security documentation to ensure we meet your standards.

### E. What Happens Next?

Once you have gathered this information, you are ready to proceed with the automated provisioning process. You will enter these details into our secure portal, and our system will stand up your dedicated Nexus instance. You will receive an email notification when your workspace is ready!

### F. Technical Configuration for Deployment

**Crucial:** For your "Log In" and "Sign Up" buttons to work, the static website must know where your backend API is located.

When deploying, ensure your build process includes these **Environment Variables**:

*   `VITE_FORCE_CROSS_ORIGIN_API=true`
*   `VITE_API_URL=https://api.yourcompany.com` (The URL of your running Nexus backend)
*   `VITE_AUTHENTIK_URL=https://auth.yourcompany.com`
*   `VITE_AUTHENTIK_CLIENT_ID=...` (Your OAuth Client ID)

*Our deployment script (`scripts/deploy-hosting.sh`) will prompt you for these if they are not set.*
