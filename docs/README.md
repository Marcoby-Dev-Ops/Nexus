# Supabase CLI (v1)

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

To install the beta release channel:

```bash
npm i supabase@beta --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```

# Nexus Documentation 📚

Welcome to the comprehensive documentation for the Nexus platform.

## 📋 **Table of Contents**

### 🎯 **Getting Started**
- **[Project Overview](PROJECT_OVERVIEW.md)** - Architecture, goals, and system design
- **[Quick Start Guide](README.md)** - Basic setup and development workflow

### 🔧 **Development**
- **[Testing System](TESTING_CHECKLIST.md)** - Comprehensive testing infrastructure
- **[API Documentation](api.md)** - Backend endpoints and integration
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions

### 🔐 **Authentication & OAuth**
- **[Microsoft 365 OAuth](MICROSOFT_365_OAUTH_SUMMARY.md)** - OAuth setup and configuration
- **[Onboarding System](ONBOARDING_SYSTEM_SUMMARY.md)** - User onboarding flow

### 🤖 **AI & Automation**
- **[Chat Function Deployment](DEPLOY_CHAT_FUNCTION.md)** - AI chat system setup
- **[AI Assistants](ai-assistants.md)** - Department-specific AI agents

### 📊 **Business Modules**
- **[Finance Module](finance-module.md)** - Financial management features
- **[Sales Module](sales-module.md)** - Sales pipeline and CRM
- **[Operations Module](operations-module.md)** - Operational workflows
- **[Marketplace](marketplace.md)** - Module marketplace system

### 📈 **Customer Success**
- **[Core Customer Journeys](CORE_CUSTOMER_JOURNEYS_FOR_NEXUS.md)** - User experience flows

### 🔨 **Infrastructure**
- **[Docker Configuration](docker-compose.yml)** - Containerization setup
- **[File Structure](FileScopeMCP-tree.json)** - Complete project file tree

### 📋 **Project Management**
- **[License](LICENSE)** - Legal and licensing information
- **[Debug Logs](mcp-debug.log)** - System debug information
- **[N8N Integration Logs](n8n-mcp.log)** - Automation platform logs

## 🗂️ **Documentation Categories**

### **For Developers**
- Project Overview
- Testing System  
- API Documentation
- Deployment Guide

### **For Administrators**
- OAuth Configuration
- Infrastructure Setup
- Docker Configuration

### **For Product Managers**
- Customer Journeys
- Module Documentation
- Onboarding System

### **For End Users**
- AI Assistants Guide
- Business Module Guides
- Marketplace Documentation

## 🔍 **Quick Reference**

| Need | Document |
|------|----------|
| Understanding the system | [Project Overview](PROJECT_OVERVIEW.md) |
| Setting up development | [Testing System](TESTING_CHECKLIST.md) |
| Deploying to production | [Deployment Guide](DEPLOYMENT.md) |
| Configuring authentication | [OAuth Setup](MICROSOFT_365_OAUTH_SUMMARY.md) |
| Working with AI features | [Chat Function](DEPLOY_CHAT_FUNCTION.md) |

---

💡 **Tip**: Use Ctrl+F (Cmd+F on Mac) to quickly search for specific topics across all documentation.
