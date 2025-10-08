# AI Usage Monitoring Guide

This guide explains how to set up and use the comprehensive AI usage monitoring system for Nexus, which tracks OpenAI and OpenRouter API usage, costs, and provides admin monitoring capabilities.

## 🎯 Overview

The AI Usage Monitoring system provides:

- **Real-time tracking** of API usage across OpenAI and OpenRouter
- **Cost monitoring** with detailed breakdowns by provider, model, and task type
- **Alert system** for high usage, low balances, and error rates
- **Budget management** with daily, weekly, and monthly limits
- **Performance analytics** with response times and success rates
- **Admin dashboard** for comprehensive monitoring and management

## 🚀 Quick Start

### 1. Apply Database Migration

First, apply the database migration to create the monitoring tables:

```bash
# Run the migration script
node scripts/apply_ai_usage_monitoring_migration.js
```

This creates the following tables:
- `ai_provider_usage` - Tracks individual API requests
- `ai_provider_credits` - Tracks provider balances and status
- `ai_usage_alerts` - Stores system alerts and notifications
- `ai_usage_budgets` - Manages usage budgets and limits
- `ai_model_performance` - Tracks model-specific performance metrics

### 2. Access the Admin Dashboard

Navigate to `/admin/ai-usage` in your Nexus application to access the monitoring dashboard.

## 📊 Dashboard Features

### Overview Tab
- **Key Metrics**: Total requests, costs, tokens, and active alerts
- **Daily Usage Chart**: Visual representation of usage over time
- **Provider Distribution**: Breakdown of usage by provider

### Providers Tab
- **Provider Credits**: Current balances and API key status
- **Model Performance**: Detailed metrics by model and task type

### Alerts Tab
- **Active Alerts**: Real-time notifications for issues
- **Alert Management**: Acknowledge and resolve alerts

### Projections Tab
- **Cost Projections**: 30-day cost estimates based on current usage
- **Provider Projections**: Individual provider cost forecasts

## 🔧 Configuration

### Environment Variables

Ensure these environment variables are set:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Database Configuration
# Use PostgreSQL with pgvector for vector operations
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/nexus
```

### Alert Thresholds

The system automatically creates alerts based on these thresholds:

- **High Usage**: Daily cost > $10 (medium), > $25 (high), > $50 (critical)
- **Error Rate**: > 10% (high), > 25% (critical)
- **Low Balance**: Configurable per provider

## 📈 Usage Tracking

### What Gets Tracked

Every AI API request is automatically tracked with:

- **Provider**: OpenAI, OpenRouter, or Local
- **Model**: Specific model used (e.g., gpt-4, claude-3-sonnet)
- **Task Type**: Chat, embedding, completion, or image generation
- **Tokens**: Input and output token counts
- **Cost**: Calculated cost in USD
- **Performance**: Response time and success status
- **Metadata**: User ID, organization, request parameters

### Cost Calculation

Costs are calculated based on current pricing:

**OpenAI Pricing (per 1K tokens):**
- GPT-4o: $0.0025 input, $0.01 output
- GPT-4o-mini: $0.00015 input, $0.0006 output
- GPT-3.5-turbo: $0.0005 input, $0.0015 output
- Text embeddings: $0.00002-$0.00013 per 1K tokens

**OpenRouter Pricing (approximate):**
- Claude models: $0.003-$0.075 per 1K tokens
- Llama models: $0.0002-$0.0008 per 1K tokens
- Other models: Varies by provider

## 🚨 Alert System

### Alert Types

1. **High Usage Alerts**
   - Triggered when daily spending exceeds thresholds
   - Configurable severity levels

2. **Error Rate Alerts**
   - Triggered when API error rate exceeds 10%
   - Helps identify provider issues

3. **Low Balance Alerts**
   - Triggered when provider balance is low
   - Prevents service interruptions

4. **Quota Exceeded Alerts**
   - Triggered when API quotas are reached
   - Automatic fallback to other providers

### Managing Alerts

- **View**: All active alerts are displayed in the dashboard
- **Acknowledge**: Mark alerts as acknowledged
- **Resolve**: Alerts are automatically resolved when conditions improve

## 💰 Budget Management

### Setting Budgets

Configure usage budgets through the admin interface:

```typescript
// Example budget configuration
const budget = {
  org_id: 'your-org-id',
  provider: 'openai',
  budget_type: 'monthly', // daily, weekly, monthly
  budget_amount_usd: 100.00,
  reset_date: '2024-01-01'
};
```

### Budget Enforcement

- **Soft Limits**: Warnings when approaching budget
- **Hard Limits**: Automatic service suspension when exceeded
- **Rollover**: Configurable budget rollover policies

## 📊 Analytics & Reporting

### Usage Statistics

The system provides comprehensive analytics:

- **Total Requests**: Overall API call volume
- **Success Rate**: Percentage of successful requests
- **Average Response Time**: Performance metrics
- **Cost per Request**: Efficiency analysis
- **Token Usage**: Input/output token ratios

### Export Capabilities

Data can be exported for external analysis:

- **CSV Export**: Detailed usage records
- **JSON API**: Programmatic access to metrics
- **Scheduled Reports**: Automated reporting

## 🔒 Security & Privacy

### Data Protection

- **Row Level Security (RLS)**: Ensures users only see their own data
- **Admin Access**: Admins can view all usage data
- **Audit Logs**: Complete audit trail of all operations

### Compliance

- **GDPR Compliance**: User data can be exported/deleted
- **Data Retention**: Configurable retention policies
- **Encryption**: All data encrypted at rest and in transit

## 🛠️ Maintenance

### Regular Tasks

1. **Monitor Alerts**: Check for critical alerts daily
2. **Review Costs**: Analyze spending patterns weekly
3. **Update Balances**: Verify provider balances monthly
4. **Performance Review**: Analyze response times and success rates

### Troubleshooting

**Common Issues:**

1. **Missing Usage Data**
   - Check if AI Gateway is properly configured
   - Verify database connection
   - Check for errors in application logs

2. **Incorrect Cost Calculations**
   - Verify pricing tables are up to date
   - Check for currency conversion issues
   - Review token counting accuracy

3. **Alert Notifications**
   - Check alert configuration
   - Verify notification channels
   - Review alert thresholds

## 🔄 Integration

### API Integration

The monitoring system can be integrated with external tools:

```typescript
// Example: Get usage statistics
const stats = await aiUsageMonitoringService.getUsageStats({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  provider: 'openai'
});

// Example: Create custom alert
await aiUsageMonitoringService.createAlert({
  alert_type: 'custom',
  provider: 'openai',
  severity: 'medium',
  title: 'Custom Alert',
  message: 'Custom alert message',
  threshold_value: 50,
  current_value: 45
});
```

### Webhook Integration

Configure webhooks for real-time notifications:

```typescript
// Example webhook payload
{
  "event": "usage_alert",
  "provider": "openai",
  "severity": "high",
  "title": "High Daily Usage",
  "message": "Daily usage has reached $25.00",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📚 Best Practices

### Cost Optimization

1. **Model Selection**: Use appropriate models for tasks
2. **Token Management**: Optimize prompt length and response size
3. **Caching**: Cache similar requests to reduce API calls
4. **Batch Processing**: Group requests when possible

### Monitoring Strategy

1. **Set Realistic Budgets**: Based on expected usage patterns
2. **Monitor Trends**: Track usage growth and patterns
3. **Alert Tuning**: Adjust thresholds based on actual usage
4. **Regular Reviews**: Schedule monthly cost reviews

### Performance Optimization

1. **Response Time Monitoring**: Track and optimize slow requests
2. **Error Rate Analysis**: Identify and fix recurring issues
3. **Provider Health**: Monitor provider reliability
4. **Load Balancing**: Distribute requests across providers

## 🆘 Support

For issues or questions:

1. **Check Logs**: Review application and database logs
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test Connectivity**: Verify API key validity and network connectivity
4. **Contact Support**: Reach out to the development team

## 🔮 Future Enhancements

Planned features:

- **Advanced Analytics**: Machine learning-based usage predictions
- **Cost Optimization**: Automatic model selection based on cost
- **Multi-tenant Support**: Enhanced organization-level monitoring
- **Integration APIs**: REST APIs for external integrations
- **Custom Dashboards**: User-configurable monitoring views
- **Automated Actions**: Automatic responses to alerts

---

This monitoring system provides comprehensive visibility into your AI usage, helping you optimize costs, maintain performance, and ensure reliable service delivery.
