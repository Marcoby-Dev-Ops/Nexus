# RAG System Implementation Guide

## Overview

This document provides technical implementation details for the **Contextual RAG (Retrieval Augmented Generation)** system. For architecture overview, see [RAG System Architecture](../architecture/RAG_SYSTEM_ARCHITECTURE.md). For feature descriptions, see [RAG System Features](../features/RAG_SYSTEM_FEATURES.md).

The RAG system transforms Nexus AI assistants from generic conversational agents into data-driven business experts by combining real-time business data with expert personalities to deliver contextually intelligent responses.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Query    │───▶│  ContextualRAG   │───▶│ Expert Response │
│                 │    │                  │    │                 │
│ "How are sales  │    │ • User Context   │    │ "Based on your │
│  performing?"   │    │ • Dept Data      │    │  $1.85M pipeline│
│                 │    │ • Intelligence   │    │  and 87% quota  │
└─────────────────┘    │ • Routing Logic  │    │  attainment..." │
                       └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Business Data      │
                    │                       │
                    │ • Sales Pipeline      │
                    │ • Marketing Metrics   │
                    │ • Financial Data      │
                    │ • Operations Status   │
                    └───────────────────────┘
```

## Key Components

### 1. ContextualRAG Class (`src/lib/contextualRAG.ts`)

The core RAG engine that provides:

- **User Intelligence**: Session data, preferences, role, department context
- **Business Context**: Company metrics, growth stage, industry insights  
- **Department Data**: Real-time performance data from sales, marketing, finance, operations
- **Intelligent Routing**: Determines which AI assistant should handle each query
- **Contextual Prompts**: Enhanced system prompts with relevant business data

### 2. Enhanced Chat Context (`src/lib/chatContext.ts`)

Integrated RAG system into the chat context builder:

- **Intelligent Routing**: `getIntelligentRouting()` recommends the best assistant
- **Enhanced Prompts**: `buildEnhancedSystemPrompt()` combines expert personalities with RAG context
- **Auto-initialization**: RAG system initializes automatically with user context

### 3. Database Schema

Created comprehensive business data tables:

```sql
-- User activity tracking
user_activity (id, user_id, page, action, metadata, created_at)

-- Sales department data
sales_pipeline (id, company_id, deal_name, company_name, value, stage, close_date, status)
sales_deals (id, company_id, value, stage, status, rep_name)
sales_performance (id, company_id, rep_name, quota, achieved, metrics)

-- Marketing department data  
marketing_campaigns (id, company_id, campaign_name, type, budget, spent, conversions)
marketing_leads (id, company_id, email, company_name, source, qualified, score)
website_analytics (id, company_id, date, visitors, page_views, bounce_rate)

-- Finance department data
financial_data (id, company_id, type, category, amount, date, month, year)
financial_metrics (id, company_id, date, revenue_forecast, cash_balance, burn_rate, cac, ltv)

-- Operations department data
projects (id, company_id, name, status, health, progress_percentage)
support_tickets (id, company_id, title, status, priority, assigned_to)
team_capacity (id, company_id, team_member, department, utilization)
```

## Usage Examples

### Executive Assistant with User Context

**User Query:** "What should be our Q1 priorities?"

**RAG Enhanced Response:**
```
Based on your profile as VP of Sales at TechCorp (growth stage, $5M revenue):

EXECUTIVE CONTEXT & INTELLIGENCE:
- Sarah Johnson (VP of Sales) from TechCorp Inc.
- Company Stage: growth (Medium)
- Industry: Technology
- Revenue: $5,000,000 annually
- Growth Rate: 25%

Given your current sales pipeline of $1.85M and 87% quota attainment, 
I recommend focusing Q1 priorities on:

1. PIPELINE ACCELERATION: Your $250K TechCorp deal in proposal stage 
   needs executive attention to close by Feb 15th
2. TEAM OPTIMIZATION: With 8 deals closing this month, ensure your 
   top performer Sarah Johnson has adequate support
3. MARKET EXPANSION: 25% growth rate indicates readiness for new 
   market segments

Would you like me to connect you with our Finance specialist to 
model the revenue impact of these initiatives?
```

### Sales Department Assistant with Real Data

**User Query:** "Show me our sales performance"

**RAG Enhanced Response:**
```
SALES PERFORMANCE ANALYSIS - Real-Time Data:

CURRENT SALES METRICS:
- Pipeline Value: $1,850,000
- Deals Closing This Month: 8
- Quota Attainment: 87%
- Top Performer: Sarah Johnson

TOP OPPORTUNITIES:
1. TechCorp Inc. - $250,000 (Proposal stage, closes Feb 15)
2. Innovation Labs - $185,000 (Negotiation, closes Feb 28)  
3. Future Systems - $320,000 (Qualified, closes Mar 15)

RECENT WINS:
- DataFlow Corp: $125,000 (Mike Chen)
- CloudTech Solutions: $95,000 (Sarah Johnson)

STRATEGIC RECOMMENDATIONS:
Based on 18+ years of VP-level sales experience, I recommend:
- Accelerate the TechCorp proposal with executive engagement
- Replicate Sarah's winning methodology across the team
- Focus qualification efforts on the $320K Future Systems opportunity

This performance indicates strong momentum toward quarterly targets.
```

### Intelligent Query Routing

The system automatically routes queries to the most appropriate assistant:

```typescript
// Finance-related query
const routing = await ragSystem.getRoutingIntelligence("What's our burn rate?");
// Result: routes to Finance CFO with cash flow data

// Strategic query  
const routing = await ragSystem.getRoutingIntelligence("What's our growth strategy?");
// Result: routes to Executive Assistant with full business context

// Marketing metrics query
const routing = await ragSystem.getRoutingIntelligence("How are our campaigns performing?");
// Result: routes to Marketing CMO with campaign data
```

## Implementation Details

### Initialization

```typescript
const ragSystem = new ContextualRAG();
await ragSystem.initialize(userId);
```

### Getting Contextual Data

```typescript
// Executive context with user intelligence
const execContext = await ragSystem.getExecutiveContext(query);

// Department-specific context with business data
const salesContext = await ragSystem.getDepartmentContext('sales', query);

// Intelligent routing recommendation
const routing = await ragSystem.getRoutingIntelligence(query);
```

### Integration with Expert Prompting

```typescript
// Enhanced system prompt combining expert personality + RAG data
const systemPrompt = buildEnhancedSystemPrompt(agent, userContext, sessionAnalytics, ragContext);
```

## Business Impact

### Before RAG System
**User:** "How are we doing financially?"  
**Assistant:** "I'd be happy to help you understand financial performance. Could you provide more details about what specific metrics you'd like to review?"

### After RAG System  
**User:** "How are we doing financially?"  
**CFO Assistant:** "Based on current financial data: Revenue is $425K this month (+10% vs. last month), with $850K cash balance and 78.5% gross margin. Your $12K budget variance in Technology spending needs attention. Our burn rate of $45K monthly projects positive cash flow for 18+ months. I recommend optimizing the Technology category spending to improve margins. Would you like me to model specific cost reduction scenarios?"

## Benefits

1. **Data-Driven Responses**: All recommendations reference actual business metrics
2. **Contextual Intelligence**: Assistants understand user role, company stage, and current situation  
3. **Intelligent Routing**: Questions automatically go to the most qualified expert
4. **Personalized Guidance**: Responses consider user's department, permissions, and recent activity
5. **Business Continuity**: Context persists across conversations and agent switches

## Future Enhancements

- **Real-time Data Sync**: Live database connections for instant metric updates
- **Predictive Analytics**: ML-powered forecasting and trend analysis
- **Cross-department Insights**: Automatic correlation of metrics across business functions
- **Custom Data Sources**: Integration with external business systems (CRM, ERP, Analytics)
- **Advanced Routing**: ML-based query classification and agent selection

## Technical Notes

- Demo data is provided for immediate functionality
- Database tables are created and populated with sample business metrics
- TypeScript types ensure type safety across all RAG operations
- Error handling provides graceful fallbacks when data is unavailable
- Performance optimized with data pre-loading and caching strategies

The RAG system transforms Nexus from a chat platform into a true business intelligence assistant, providing users with instant access to Fortune 500-level expertise backed by real-time business data. 