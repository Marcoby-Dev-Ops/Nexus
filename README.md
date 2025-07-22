# Nexus - Business Intelligence Platform

**Nexus** is a comprehensive business intelligence platform designed to enable innovators, thinkers, and self-starters to start, standardize, operate, and grow businesses without requiring formal business education.

## 🚀 Recent Updates

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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm
- Supabase CLI

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/nexus.git
cd nexus

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
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_BRAVE_API_KEY=your_brave_key

# Integrations
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_HUBSPOT_CLIENT_ID=your_hubspot_client_id
```

## 📚 Documentation

- [User Guide](./docs/USER_GUIDE.md) - Complete user documentation
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Technical implementation details
- [API Reference](./docs/API_REFERENCE.md) - Integration and API documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.nexus.com](https://docs.nexus.com)
- **Community**: [Discord](https://discord.gg/nexus)
- **Issues**: [GitHub Issues](https://github.com/your-org/nexus/issues)

---

**Nexus** - Empowering entrepreneurs with intelligent business tools. No degree required. 