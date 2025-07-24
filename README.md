# Nexus - Business Intelligence Platform

**Nexus** is a comprehensive business intelligence platform designed to enable innovators, thinkers, and self-starters to start, standardize, operate, and grow businesses without requiring formal business education.

## 🚀 Recent Updates

### Domain Configuration & Deployment
- **Development Environment**: `nexus.marcoby.net` for testing and development
- **Production Environment**: `nexus.marcoby.com` for live deployments
- **Coolify Deployment**: Automated deployment via Coolify with Docker containerization
- **Environment Variables**: Comprehensive configuration for all integrations

### Microsoft 365 Integration Consolidation
- **Unified Integration**: OneDrive, SharePoint, Teams, and Outlook now integrated under single Microsoft 365 connection
- **Enhanced Permissions**: Comprehensive OAuth flow grants access to all Microsoft 365 services
- **Improved UX**: Simplified setup process with unified analytics across all Microsoft services
- **Better Organization**: Logical grouping of all Microsoft 365 capabilities

### Integration Marketplace Improvements
- **Enhanced Contrast**: Fixed accessibility issues with filter colors and badges
- **Better Visual Hierarchy**: Improved badge styling for connection status, difficulty levels, and popular integrations
- **Responsive Design**: Optimized layout for mobile and desktop viewing

### Codebase Cleanup
- **Removed Outdated Functions**: Cleaned up unused Edge Functions and temporary files
- **Simplified Architecture**: Consolidated OneDrive/SharePoint into Microsoft 365 integration
- **Updated Documentation**: Refreshed integration descriptions and user guides

## 🎯 Core Features

### **Unified Workspace**
- **Inbox Management**: Centralized email, calendar, and communication management
- **Task & Project Tracking**: Integrated task management with AI-powered prioritization
- **Document Intelligence**: AI-powered document analysis and RAG capabilities
- **Team Collaboration**: Real-time collaboration tools and analytics

### **AI-Powered Intelligence**
- **Conversational AI**: Natural language interaction for business tasks
- **Predictive Analytics**: AI-driven insights and recommendations
- **Automated Workflows**: Intelligent process automation
- **Knowledge Management**: Smart document processing and retrieval

### **Comprehensive Integrations**
- **Microsoft 365**: Teams, Outlook, OneDrive, SharePoint with unified analytics
- **Google Workspace**: Gmail, Drive, Calendar, and productivity tools
- **CRM Systems**: HubSpot, Salesforce, and custom CRM integrations
- **Communication**: Slack, Microsoft Teams, and messaging platforms
- **Financial**: Stripe, PayPal, and payment processing
- **Analytics**: Google Analytics, Search Console, and business intelligence tools

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI/ML**: OpenAI GPT-4, Claude, Custom RAG Systems
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: React Context, Custom Hooks
- **Package Manager**: pnpm
- **Deployment**: Coolify with Docker containerization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm
- Supabase CLI

### Local Development
```bash
# Clone the repository
git clone https://github.com/Marcoby-Dev-Ops/Nexus.git
cd Nexus

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

### Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kqclbpimkraenvbffnpk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Domain Configuration
VITE_NEXT_PUBLIC_APP_URL=https://nexus.marcoby.net
VITE_DEV_APP_URL=http://localhost:5173

# AI Services
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_BRAVE_API_KEY=your_brave_key

# OAuth Integrations
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
VITE_HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_ENV=live

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
VITE_N8N_URL=https://automate.marcoby.net
VITE_N8N_API_KEY=your_n8n_api_key
```

## 🌐 Deployment

### Development Environment
- **URL**: https://nexus.marcoby.net
- **Deployment**: Automated via Coolify
- **Branch**: `main`
- **Container**: Docker with Node.js serve

### Production Environment
- **URL**: https://nexus.marcoby.com
- **Deployment**: Manual via Coolify
- **Environment**: Production configuration

### Deployment Process
1. **Push to GitHub**: Changes automatically trigger Coolify deployment
2. **Docker Build**: Multi-stage build with environment variables
3. **Health Check**: Automated health monitoring
4. **SSL Certificate**: Automatic Let's Encrypt SSL

## 📚 Documentation

- [Domain Configuration](./DOMAIN_UPDATE_SUMMARY.md) - Domain setup and OAuth configuration
- [Deployment Guide](./docs/deployment/COOLIFY_DEPLOYMENT_GUIDE.md) - Coolify deployment instructions
- [OAuth Configuration](./docs/OAUTH_CONFIGURATION_GUIDE.md) - OAuth provider setup
- [Developer Guide](./docs/DEVELOPMENT.md) - Local development setup

## 🔧 Development Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm test                   # Run tests
pnpm lint                   # Lint code
pnpm type-check             # TypeScript check

# Database
pnpm supabase:db:pull      # Pull remote schema
pnpm supabase:db:push      # Push local changes
pnpm supabase:gen-types    # Generate TypeScript types

# Edge Functions
pnpm supabase functions deploy  # Deploy all functions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.nexus.com](https://docs.nexus.com)
- **Community**: [Discord](https://discord.gg/nexus)
- **Issues**: [GitHub Issues](https://github.com/Marcoby-Dev-Ops/Nexus/issues)

---

**Nexus** - Empowering entrepreneurs with intelligent business tools. No degree required. 