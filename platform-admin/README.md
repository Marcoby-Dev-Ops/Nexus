# Nexus Platform Admin

A separate admin panel for managing the Nexus platform, designed for platform operators and administrators.

## 🎯 Overview

This admin panel provides comprehensive platform management capabilities including:

- **Tenant Management** - Manage organizations and their settings
- **User Management** - Platform-wide user administration
- **AI Usage Monitoring** - Track AI costs and usage across all tenants
- **Integrations Management** - Monitor platform integrations
- **Billing Management** - Revenue tracking and billing oversight
- **System Health** - Platform performance and uptime monitoring
- **Analytics & Reporting** - Platform-wide metrics and insights

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Access to the Nexus backend API

### Installation

1. **Install dependencies:**
   ```bash
   cd platform-admin
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_ADMIN_EMAIL=admin@nexus.com
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

   The admin panel will be available at `http://localhost:5174`

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for navigation

### Backend Integration
- Shares the same backend API as the main Nexus application
- Admin-specific endpoints for platform management
- Secure authentication for admin access only

## 📁 Project Structure

```
platform-admin/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── package.json
```

## 🔐 Authentication

The admin panel uses a separate authentication system:

- Admin-specific login credentials
- JWT token-based authentication
- Secure session management
- Role-based access control

## 🚀 Deployment

### Development
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm preview
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5174
CMD ["npm", "run", "preview"]
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |
| `VITE_ADMIN_EMAIL` | Default admin email | `admin@nexus.com` |

### API Endpoints

The admin panel expects the following API endpoints:

- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/validate-token` - Token validation
- `GET /api/admin/tenants` - Get all tenants
- `GET /api/admin/users` - Get all users
- `GET /api/admin/ai-usage` - Get AI usage stats
- `GET /api/admin/integrations` - Get integration stats
- `GET /api/admin/billing` - Get billing data
- `GET /api/admin/analytics` - Get analytics data

## 🛡️ Security

- Admin-only access with secure authentication
- Separate from user-facing application
- Role-based permissions
- Audit logging for all admin actions
- Secure API communication

## 📊 Features

### Dashboard
- Platform overview with key metrics
- Recent activity feed
- Quick access to all management sections

### Tenant Management
- View all tenant organizations
- Manage tenant settings and configurations
- Monitor tenant usage and performance
- Handle tenant billing and subscriptions

### User Management
- Platform-wide user administration
- Role and permission management
- User activity monitoring
- Support ticket management

### AI Usage Monitoring
- Track OpenAI and OpenRouter API usage
- Monitor costs across all tenants
- Set usage limits and alerts
- Performance analytics

### Integrations Management
- Monitor all platform integrations
- Track integration health and performance
- Manage API keys and credentials
- Handle integration errors

### Billing Management
- Platform revenue tracking
- Tenant subscription management
- Payment processing oversight
- Financial reporting

### System Health
- Platform uptime monitoring
- Performance metrics
- Error tracking and alerting
- Resource usage monitoring

### Analytics & Reporting
- Platform usage analytics
- User behavior insights
- Business performance reports
- Custom data exports

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new features
3. Include proper error handling
4. Add loading states for async operations
5. Test thoroughly before submitting

## 📝 License

This project is part of the Nexus platform and follows the same licensing terms.
