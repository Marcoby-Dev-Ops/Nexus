# Domain Agents

## Overview

Domain Agents are specialized AI assistants that provide expert knowledge and capabilities tailored to specific business departments. Each domain agent has access to department-specific tools, contextual business data, and specialized expertise to deliver highly relevant and actionable insights.

## Architecture

### Core Components

1. **Agent Registry** (`src/lib/ai/agentRegistry.ts`)
   - Central registry of all available agents
   - Hierarchical structure: Executive → Departmental → Specialist
   - Rich agent profiles with knowledge bases and personalities

2. **Domain Agent Service** (`src/lib/ai/domainAgentService.ts`)
   - Enhanced agent capabilities with domain context
   - Real-time business data integration
   - Contextual knowledge and insights

3. **Domain Agent Tools** (`src/lib/ai/domainAgentTools.ts`)
   - Department-specific tools and capabilities
   - Automated analysis and recommendations
   - Integration with business systems

4. **Edge Function Enhancement** (`supabase/functions/ai-rag-assessment-chat/index.ts`)
   - Enhanced supervisor routing with domain capabilities
   - Streaming responses with agent metadata
   - Live business data integration

## Agent Hierarchy

### Executive Level
- **Executive Assistant**: Strategic advisor for C-suite decisions
  - Specialties: Strategic planning, cross-department coordination, business transformation
  - Tools: Business intelligence, strategic planning, performance dashboard
  - Scope: Company-wide strategic initiatives

### Departmental Level
- **VP of Sales**: Revenue optimization and sales strategy
- **CMO**: Marketing strategy and growth initiatives  
- **CFO**: Financial planning and analysis
- **COO**: Operations and process optimization

### Specialist Level
- **Sales Specialists**: Account management, customer success, lead generation
- **Marketing Specialists**: Content, campaigns, SEO, social media
- **Finance Specialists**: Accounting, financial analysis, tax planning
- **Operations Specialists**: Project management, IT support, quality assurance

## Domain Capabilities

### Sales Department
**Tools Available:**
- CRM Integration
- Pipeline Analysis
- Lead Scoring
- Sales Forecasting
- Revenue Optimization

**Expertise Areas:**
- Pipeline Management
- Revenue Optimization
- Sales Strategy
- Lead Qualification
- Customer Relationship Management

**Live Data Sources:**
- HubSpot CRM deals and contacts
- Sales KPI snapshots
- Pipeline velocity metrics
- Conversion rate analysis

### Marketing Department
**Tools Available:**
- Campaign Analysis
- SEO Tools
- Social Media Analytics
- Content Generation
- Lead Attribution

**Expertise Areas:**
- Marketing Strategy
- Growth Hacking
- Brand Management
- Digital Marketing
- Customer Acquisition

**Live Data Sources:**
- Website traffic metrics
- Campaign performance data
- Lead conversion rates
- Social engagement metrics

### Finance Department
**Tools Available:**
- Financial Modeling
- Budget Analysis
- Cost Optimization
- ROI Calculation
- Variance Analysis

**Expertise Areas:**
- Financial Planning
- Budget Management
- Cost Analysis
- Financial Modeling
- Risk Assessment

**Live Data Sources:**
- Revenue and profitability metrics
- Budget variance data
- Cash flow analysis
- Financial KPI snapshots

### Operations Department
**Tools Available:**
- Process Optimization
- Automation Tools
- Performance Monitoring
- Workflow Design
- Capacity Planning

**Expertise Areas:**
- Process Optimization
- Automation
- Operational Efficiency
- Performance Monitoring
- Quality Management

**Live Data Sources:**
- Service uptime metrics
- Process efficiency data
- Automation coverage
- Performance indicators

## Usage Examples

### 1. Sales Pipeline Analysis

**User Query:** "How is our sales pipeline performing this quarter?"

**Agent Routing:** → Sales Director (VP of Sales)
- **Confidence:** 85%
- **Reasoning:** Query contains 3 sales keywords - routing to sales specialist

**Domain Capabilities:**
- **Tools:** CRM integration, pipeline analysis, sales forecasting
- **Expertise:** Pipeline management, revenue optimization, sales strategy
- **Insights:** "4 open deals worth $205,000", "Conversion rate: 16.7%", "Average deal size: $51,250"

**Expected Response:**
```
*[Routed to VP of Sales]*

Based on your current sales pipeline data, here's the quarterly performance analysis:

**Pipeline Overview:**
- 4 active deals worth $205,000 total
- Average deal size: $51,250
- Current conversion rate: 16.7%

**Key Insights:**
- Pipeline value increased 15% from last quarter
- Conversion rate is above industry average (12-15%)
- Deal velocity has improved by 8 days

**Recommendations:**
1. Focus on the 2 largest deals in negotiation stage
2. Implement lead scoring to improve qualification
3. Consider expanding successful outreach strategies
```

### 2. Marketing Campaign Strategy

**User Query:** "What marketing campaigns should we run to increase lead generation?"

**Agent Routing:** → Marketing Director (CMO)
- **Confidence:** 92%
- **Reasoning:** Query involves marketing strategy - routing to marketing specialist

**Domain Capabilities:**
- **Tools:** Campaign analysis, SEO tools, social media analytics, content generation
- **Expertise:** Marketing strategy, growth hacking, brand management, digital marketing
- **Insights:** "Website traffic: 3,500 visitors", "Lead conversion: 4.2%", "Social engagement up 15%"

### 3. Financial Budget Analysis

**User Query:** "Can you analyze our budget variance for this month?"

**Agent Routing:** → Finance Director (CFO)
- **Confidence:** 78%
- **Reasoning:** Query contains 2 finance keywords - routing to finance specialist

**Domain Capabilities:**
- **Tools:** Financial modeling, budget analysis, cost optimization, ROI calculation
- **Expertise:** Financial planning, budget management, cost analysis, financial modeling
- **Insights:** "Monthly revenue: $45,000", "Profit margin: 28%", "Cash flow: $12,000"

### 4. Strategic Planning Query

**User Query:** "What should our strategic priorities be for next quarter?"

**Agent Routing:** → Executive Assistant
- **Confidence:** 95%
- **Reasoning:** Query involves strategic planning - routing to Executive Assistant

**Domain Capabilities:**
- **Tools:** Business intelligence, strategic planning, performance dashboard, board reporting
- **Expertise:** Strategic planning, business transformation, executive leadership
- **Insights:** Cross-departmental performance data, business health score, strategic recommendations

## Implementation Guide

### 1. Setting Up Domain Agents

```typescript
import { domainAgentService } from '@/lib/ai/domainAgentService';

// Get enhanced agent with domain context
const enhancedAgent = await domainAgentService.getEnhancedAgent('sales-dept', {
  companyId: 'your-company-id',
  role: 'sales_manager'
});

// Generate enhanced system prompt
const systemPrompt = domainAgentService.generateEnhancedSystemPrompt(enhancedAgent);
```

### 2. Using Domain Agent Tools

```typescript
import { domainAgentTools } from '@/lib/ai/domainAgentTools';

// Execute sales pipeline analysis
const pipelineAnalysis = await domainAgentTools.executeTool('analyze_sales_pipeline', {
  timeframe: '30d',
  stage_filter: 'negotiation'
});

// Execute marketing campaign analysis
const campaignAnalysis = await domainAgentTools.executeTool('campaign_performance_analysis', {
  campaign_type: 'email',
  timeframe: '90d'
});
```

### 3. Displaying Agent Capabilities

```tsx
import DomainAgentIndicator from '@/components/chat/DomainAgentIndicator';

<DomainAgentIndicator
  agentId="sales-dept"
  routing={{
    agent: 'sales-dept',
    confidence: 0.85,
    reasoning: 'Query contains sales keywords'
  }}
  domainCapabilities={{
    tools: ['crm_integration', 'pipeline_analysis'],
    expertise: ['Pipeline Management', 'Revenue Optimization'],
    insights: ['4 open deals worth $205,000']
  }}
  showDetails={true}
/>
```

## Testing Strategy

### Unit Tests
- Agent registry functionality
- Domain context building
- Tool execution
- Enhanced prompt generation

### Integration Tests
- Edge function routing
- Live data integration
- Agent capability streaming
- Error handling

### Manual Test Cases
1. **Sales Pipeline Query**: Verify routing to Sales Director with sales tools
2. **Marketing Strategy Query**: Verify routing to CMO with marketing tools
3. **Financial Analysis Query**: Verify routing to CFO with finance tools
4. **Strategic Planning Query**: Verify routing to Executive Assistant
5. **Ambiguous Query**: Verify fallback to Executive Assistant

### Performance Benchmarks
- Agent routing response time: < 200ms
- Domain context building: < 500ms
- Tool execution: < 2s
- Enhanced prompt generation: < 100ms

## Configuration

### Environment Variables
```bash
# Supabase configuration (already configured)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key

# OpenAI configuration (already configured)
OPENAI_API_KEY=your-openai-key
```

### Database Tables
- `ai_kpi_snapshots`: Real-time KPI data for domain insights
- `deals`: Sales pipeline data
- `contacts`: CRM contact data
- `user_profiles`: User and company associations

## Monitoring and Analytics

### Key Metrics
- Agent routing accuracy
- User satisfaction with domain responses
- Tool usage frequency
- Response relevance scores

### Logging
- Agent selection reasoning
- Domain capability utilization
- Tool execution success rates
- Performance metrics

## Future Enhancements

### Planned Features
1. **Custom Agent Training**: Train agents on company-specific data
2. **Advanced Tool Integration**: Connect to more business systems
3. **Multi-Agent Collaboration**: Agents working together on complex queries
4. **Predictive Insights**: Proactive recommendations based on trends
5. **Voice Interface**: Voice interaction with domain agents

### Integration Roadmap
1. **Phase 1**: Core domain agents (✅ Complete)
2. **Phase 2**: Advanced tools and integrations
3. **Phase 3**: Machine learning optimization
4. **Phase 4**: Voice and mobile interfaces

## Troubleshooting

### Common Issues

**Agent Not Routing Correctly**
- Check keyword matching in `analyzeIntent` function
- Verify agent registry configuration
- Review confidence thresholds

**Missing Domain Capabilities**
- Verify business data availability
- Check KPI snapshot data
- Ensure proper company_id context

**Tool Execution Failures**
- Check database connectivity
- Verify required permissions
- Review error logs

**Performance Issues**
- Monitor database query performance
- Check OpenAI API response times
- Optimize domain context building

### Debug Mode
Enable debug logging to troubleshoot issues:

```typescript
// Enable debug mode
localStorage.setItem('domain-agents-debug', 'true');

// Check routing decisions
console.log('Agent routing:', routingInfo);
console.log('Domain capabilities:', domainCapabilities);
```

## Conclusion

Domain Agents represent a significant advancement in AI-powered business assistance, providing specialized expertise and contextual awareness that dramatically improves the relevance and actionability of AI responses. The system is designed to scale with your business needs while maintaining high performance and accuracy. 