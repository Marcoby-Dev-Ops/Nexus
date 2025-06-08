# Nexus

> **Enterprise Business Intelligence Platform** powered by Supabase, React, and AI

[![CI/CD Pipeline](https://github.com/your-org/nexus/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/nexus/actions)
[![Coverage](https://codecov.io/gh/your-org/nexus/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/nexus)

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🏗️ **Project Structure**

```
Nexus/
├── src/                 # React application source
├── public/              # Static assets
├── supabase/           # Database migrations & functions
├── docs/               # 📚 All project documentation
├── .github/workflows/  # CI/CD automation
└── [config files]     # TypeScript, Vite, Jest, etc.
```

## 🛠️ **Development**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Check code quality |
| `npm run type-check` | TypeScript validation |

## 📚 **Documentation**

- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - High-level architecture and goals
- **[Testing Guide](docs/TESTING_CHECKLIST.md)** - Comprehensive testing system
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[OAuth Setup](docs/MICROSOFT_365_OAUTH_SUMMARY.md)** - Authentication configuration
- **[API Documentation](docs/api.md)** - Backend API reference

## 🔧 **Tech Stack**

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Functions)
- **Testing**: Jest, Testing Library, Cypress (E2E)
- **Build**: Vite, ESLint, TypeScript
- **CI/CD**: GitHub Actions, Codecov

## 🤝 **Contributing**

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Check linting: `npm run lint`
5. Submit a pull request

All PRs automatically run through our CI/CD pipeline with tests, linting, and security checks.

## 📄 **License**

See [LICENSE](docs/LICENSE) for details. 