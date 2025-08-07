# Microsoft Graph Toolkit Troubleshooting Guide

## Common Issues and Solutions

### 1. "Lit is in dev mode" Warnings

**Issue**: Console warnings about Lit being in development mode.

**Solution**: These warnings are suppressed in our configuration:
- `src/main.tsx` - Console warning suppression in development
- `vite.config.ts` - Production mode configuration
- This is cosmetic and doesn't affect functionality

### 2. "Deferred DOM Node could not be resolved" Errors

**Issue**: DOM resolution errors when MGT components try to render.

**Root Causes**:
- MGT components not properly registered
- Provider initialization timing issues
- React/Lit integration conflicts

**Solutions**:

#### A. Ensure Proper Component Registration
```typescript
// In your main component file
import '@microsoft/mgt-components';
```

#### B. Use Error Boundaries
```typescript
const MGTErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.warn('MGT Component Error:', error);
    return <div>Component temporarily unavailable</div>;
  }
};
```

#### C. Check Provider State Before Rendering
```typescript
const useMGTReady = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const provider = Providers.globalProvider;
    setIsReady(!!provider);
  }, []);
  
  return isReady;
};
```

### 3. Authentication Issues

**Issue**: MGT components not authenticating properly.

**Check**:
1. Environment variable is set: `VITE_MICROSOFT_CLIENT_ID`
2. Provider is initialized: `Providers.globalProvider`
3. Correct scopes are configured

**Debug**:
```typescript
console.log('Provider:', Providers.globalProvider);
console.log('Provider State:', Providers.globalProvider?.state);
console.log('Client ID:', import.meta.env.VITE_MICROSOFT_CLIENT_ID);
```

### 4. Build Issues

**Issue**: Build fails with MGT-related errors.

**Solutions**:
- Ensure all MGT packages are in `optimizeDeps.include` in `vite.config.ts`
- Use manual chunks for better bundling
- Check for TypeScript compatibility issues

### 5. React Strict Mode Conflicts

**Issue**: Double rendering in React Strict Mode causing MGT issues.

**Solution**: MGT components handle this automatically, but you can wrap problematic components:
```typescript
const StrictModeCompatible: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  return <>{children}</>;
};
```

## Best Practices

### 1. Initialization Order
1. Import MGT components
2. Initialize provider
3. Wait for DOM ready
4. Render components

### 2. Error Handling
- Always wrap MGT components in error boundaries
- Provide fallback UI for failed components
- Log errors for debugging

### 3. Performance
- Use lazy loading for MGT components
- Implement proper loading states
- Cache provider state

### 4. Testing
- Mock MGT providers in tests
- Use test-specific configurations
- Handle async component loading

## Environment Configuration

### Development
```typescript
// main.tsx
if (!import.meta.env.PROD) {
  // Suppress Lit warnings
  console.warn = (msg) => {
    if (!msg.includes('Lit is in dev mode')) {
      originalWarn(msg);
    }
  };
}
```

### Production
```typescript
// vite.config.ts
define: {
  'process.env.NODE_ENV': JSON.stringify('production'),
}
```

## Debugging Steps

1. **Check Browser Console**
   - Look for MGT-specific errors
   - Check provider initialization logs
   - Verify authentication state

2. **Network Tab**
   - Verify Graph API calls are being made
   - Check authentication tokens
   - Look for CORS issues

3. **React DevTools**
   - Check component tree for MGT components
   - Verify props are passed correctly
   - Look for render cycles

4. **MGT DevTools**
   - Use browser extension if available
   - Check provider state
   - Verify component registration

## Known Limitations

1. **SSR**: MGT components don't support server-side rendering
2. **React 19**: Some compatibility issues may exist (using `--legacy-peer-deps`)
3. **TypeScript**: Type definitions may be incomplete for some props

## Alternative Approaches

If MGT continues to cause issues, consider:

1. **Direct Graph API**: Use axios/fetch with manual token management
2. **Custom Components**: Build your own components using Graph API
3. **Hybrid Approach**: Use MGT for auth, custom components for UI

## Support Resources

- [Microsoft Graph Toolkit Documentation](https://docs.microsoft.com/en-us/graph/toolkit/)
- [GitHub Issues](https://github.com/microsoftgraph/microsoft-graph-toolkit/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/microsoft-graph-toolkit) 