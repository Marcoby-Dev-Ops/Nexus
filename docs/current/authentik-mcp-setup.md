# Authentik MCP Server Setup Guide

This guide covers the installation and configuration of the Authentik MCP (Model Context Protocol) servers for integration with your Nexus project.

## Overview

The Authentik MCP servers provide programmatic access to Authentik identity and access management platform through two different packages:

1. **@cdmx/authentik-mcp** - Full access MCP server with CRUD operations
2. **@cdmx/authentik-diag-mcp** - Diagnostic/read-only MCP server for monitoring

## Installation

The Authentik MCP servers have been installed as project dependencies:

```bash
pnpm add @cdmx/authentik-mcp @cdmx/authentik-diag-mcp
```

## Configuration

### MCP Configuration Files

Two MCP configuration files have been created:

1. **Global Configuration** (`~/.cursor/mcp.json`) - For Cursor IDE integration
2. **Project Configuration** (`mcp.json`) - For project-specific settings

### Required Configuration

Before using the MCP servers, you need to update the configuration with your Authentik instance details:

1. **Base URL**: Your Authentik instance URL (e.g., `https://auth.yourdomain.com`)
2. **API Token**: A valid Authentik API token with appropriate permissions

### API Token Setup

#### For Full Access (@cdmx/authentik-mcp)

1. Log in to Authentik as an administrator
2. Navigate to **Directory** > **Tokens**
3. Create a new token with full API permissions
4. Copy the token for use with the full MCP server

#### For Diagnostic Access (@cdmx/authentik-diag-mcp)

1. Log in to Authentik as an administrator
2. Navigate to **Directory** > **Tokens**
3. Create a new token with minimal read-only permissions
4. Copy the token for use with the diagnostic MCP server

## Available Tools

### Full MCP Server Tools

#### User Management
- `authentik_list_users` - List users with filtering
- `authentik_get_user` - Get user details
- `authentik_create_user` - Create new user
- `authentik_update_user` - Update existing user
- `authentik_delete_user` - Delete user

#### Group Management
- `authentik_list_groups` - List groups
- `authentik_get_group` - Get group details
- `authentik_create_group` - Create new group
- `authentik_update_group` - Update existing group
- `authentik_delete_group` - Delete group

#### Application Management
- `authentik_list_applications` - List applications
- `authentik_get_application` - Get application details
- `authentik_create_application` - Create new application
- `authentik_update_application` - Update existing application
- `authentik_delete_application` - Delete application

#### Event Monitoring
- `authentik_list_events` - List system events
- `authentik_get_event` - Get event details

#### Flow Management
- `authentik_list_flows` - List authentication flows
- `authentik_get_flow` - Get flow details

#### Provider Management
- `authentik_list_providers` - List providers
- `authentik_get_provider` - Get provider details

#### Token Management
- `authentik_list_tokens` - List API tokens
- `authentik_create_token` - Create new token

### Diagnostic MCP Server Tools

#### Event Monitoring
- `authentik_list_events` - List system events with filtering
- `authentik_get_event` - Get detailed event information
- `authentik_search_events` - Search events by criteria
- `authentik_get_user_events` - Get user-specific events

#### User Information (Read-Only)
- `authentik_get_user_info` - Get user information
- `authentik_list_users_info` - List users for diagnostics
- `authentik_get_user_events` - Get user event history

#### Group Information (Read-Only)
- `authentik_get_group_info` - Get group information
- `authentik_list_groups_info` - List groups for diagnostics
- `authentik_get_group_members` - Get group members

#### System Health
- `authentik_get_system_config` - Get system configuration
- `authentik_get_version_info` - Get version information

#### Application/Flow/Provider Status (Read-Only)
- `authentik_get_application_status` - Check application status
- `authentik_list_applications_status` - List application statuses
- `authentik_get_flow_status` - Check flow status
- `authentik_list_flows_status` - List flow statuses
- `authentik_get_provider_status` - Check provider status
- `authentik_list_providers_status` - List provider statuses

## Use Cases

### Full MCP Server
- **User Management**: Create, update, and manage user accounts
- **Group Administration**: Organize users into groups with appropriate permissions
- **Application Setup**: Configure and deploy new applications
- **Flow Configuration**: Set up and customize authentication flows
- **System Administration**: Complete system management and configuration

### Diagnostic MCP Server
- **Security Monitoring**: Track authentication events and security incidents
- **Performance Analysis**: Monitor system performance and user experience
- **Compliance Reporting**: Generate audit reports and compliance documentation
- **Troubleshooting**: Diagnose authentication and access issues
- **Health Monitoring**: Monitor system health and configuration drift

## Integration with Nexus

### Authentication Integration
The Authentik MCP servers can be integrated with Nexus's authentication system to:

1. **Synchronize Users**: Automatically create/update user accounts in Authentik
2. **Group Management**: Manage user groups and permissions
3. **Application Registration**: Register Nexus applications in Authentik
4. **SSO Configuration**: Set up single sign-on for Nexus applications

### Security Monitoring
Use the diagnostic MCP server to:

1. **Monitor Authentication Events**: Track login attempts and security incidents
2. **Audit Trail Analysis**: Generate compliance reports
3. **Performance Monitoring**: Monitor authentication system performance
4. **Health Checks**: Ensure Authentik system health

## Security Best Practices

### Token Management
- Use dedicated tokens for each server type
- Rotate tokens regularly
- Apply principle of least privilege
- Monitor token usage

### Environment Security
- Always use HTTPS in production
- Verify SSL certificates
- Use environment variables for sensitive data
- Implement proper access controls

### Monitoring
- Enable audit logging
- Monitor API usage patterns
- Set up alerting for suspicious activities
- Regular security reviews

## Testing

### Local Development
For local development and testing:

```bash
# Test full MCP server
npx @cdmx/authentik-mcp --base-url http://localhost:9000 --token your-token

# Test diagnostic MCP server
npx @cdmx/authentik-diag-mcp --base-url http://localhost:9000 --token your-token
```

### Integration Testing
Create integration tests to verify MCP server functionality:

```typescript
// Example integration test
describe('Authentik MCP Integration', () => {
  it('should list users successfully', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify base URL and network connectivity
2. **Authentication Errors**: Check API token validity and permissions
3. **Permission Errors**: Ensure token has appropriate permissions
4. **SSL Errors**: Verify SSL certificate configuration

### Debug Mode
Enable debug mode for troubleshooting:

```bash
DEBUG=* npx @cdmx/authentik-mcp --base-url https://your-instance --token your-token
```

## Resources

- [Authentik Documentation](https://goauthentik.io/docs/)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/cdmx-in/authentik-mcp)
- [Nexus Authentication Documentation](./authentication/README.md)

## Support

For issues and support:
- Check the [GitHub Issues](https://github.com/cdmx-in/authentik-mcp/issues)
- Review Authentik community forums
- Contact the development team




