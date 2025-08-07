# Logging Controls

## Reducing Console Noise

The application has several logging controls to reduce console noise during development:

### Environment Variables

Add these to your `.env` file to control logging:

```bash
# Disable auth state change logs (reduces noise significantly)
VITE_ENABLE_AUTH_LOGS=false

# Disable debug logs (shows only INFO and above)
VITE_ENABLE_DEBUG_LOGS=false
```

### Default Behavior

- **Auth Logs**: Disabled by default in development
- **Debug Logs**: Disabled by default in development  
- **Info Logs**: Always shown
- **Error Logs**: Always shown

### Enabling Debug Logs

To enable detailed logging for debugging:

```bash
VITE_ENABLE_AUTH_LOGS=true
VITE_ENABLE_DEBUG_LOGS=true
```

### Common Noise Sources

1. **Auth State Changes**: Multiple auth state changes during initialization
2. **Service Calls**: Repeated service method calls
3. **Theme Changes**: Multiple theme provider initializations
4. **Component Mounting**: Repeated component lifecycle logs

### Fixed Issues

- ✅ Auth state change loop reduced
- ✅ Service method errors resolved with mock data
- ✅ JavaScript errors in DigestibleMetricsDashboard fixed
- ✅ Logger noise reduced in development
