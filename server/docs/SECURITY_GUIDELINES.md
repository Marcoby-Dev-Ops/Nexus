# 🔐 Security Guidelines for Nexus

## **Environment Variables & Secrets Management**

### **🚨 Critical Security Rules**

1. **NEVER commit secrets to Git**
   - All `.env` files are gitignored
   - Use `.env.example` as a template only
   - Real secrets should be in `.env.local` (not committed)

2. **Use different secrets per environment**
   - Development: `.env.local`
   - Staging: Environment variables in deployment
   - Production: Secret management service

3. **Rotate secrets regularly**
   - API keys every 90 days
   - Database passwords every 180 days
   - OAuth secrets when compromised

### **📁 File Structure**

```
nexus/
├── .env.example          # Template (committed)
├── .env.local           # Local secrets (gitignored)
├── .env.production      # Production secrets (gitignored)
├── .env.staging         # Staging secrets (gitignored)
└── docs/security/       # Security documentation
```

### **🔧 Environment Setup**

#### **Development**
```bash
# 1. Copy template
cp env.example .env.local

# 2. Fill in your actual values
nano .env.local

# 3. Verify it's gitignored
git status  # Should not show .env.local
```

#### **Production (Coolify)**
```bash
# Set environment variables in Coolify dashboard
# Or use secret management service
```

### **🛡️ Secret Categories**

#### **🔴 Critical (Never expose)**
- Database passwords
- API keys (OpenAI, Stripe, etc.)
- OAuth client secrets
- JWT signing keys
- Encryption keys

#### **🟡 Sensitive (Limited exposure)**
- Database URLs (without passwords)
- Public API endpoints
- Feature flags
- Environment identifiers

#### **🟢 Public (Safe to expose)**
- App version
- Build timestamps
- Public API documentation URLs

### **🔍 Security Checklist**

#### **Before Committing**
- [ ] No `.env` files in git
- [ ] No hardcoded secrets in code
- [ ] No API keys in comments
- [ ] No passwords in logs

#### **Before Deployment**
- [ ] All secrets are in environment variables
- [ ] Database connections use SSL
- [ ] API keys are rotated
- [ ] Access logs are enabled

#### **Regular Maintenance**
- [ ] Audit secret usage monthly
- [ ] Rotate keys quarterly
- [ ] Review access permissions
- [ ] Update security dependencies

### **🚨 Emergency Procedures**

#### **If Secrets Are Compromised**
1. **Immediate Actions**
   ```bash
   # 1. Revoke all API keys
   # 2. Rotate database passwords
   # 3. Update OAuth client secrets
   # 4. Check access logs for unauthorized use
   ```

2. **Investigation**
   ```bash
   # Check git history for exposed secrets
   git log --all --full-history -- .env*
   
   # Search for hardcoded secrets
   grep -r "sk-" src/
   grep -r "pk_" src/
   ```

3. **Recovery**
   ```bash
   # Update all environment variables
   # Deploy with new secrets
   # Monitor for suspicious activity
   ```

### **🔧 Tools & Best Practices**

#### **Secret Scanning**
```bash
# Install pre-commit hooks
npm install -g detect-secrets

# Scan for secrets
detect-secrets scan src/

# Use GitGuardian or similar
```

#### **Environment Validation**
```typescript
// src/core/environment.ts
function validateSecrets() {
  const required = [
    'DATABASE_URL',
    'VITE_OPENROUTER_API_KEY',
    'VITE_AUTHENTIK_CLIENT_SECRET'
  ];
  
  for (const secret of required) {
    if (!process.env[secret]) {
      throw new Error(`Missing required secret: ${secret}`);
    }
  }
}
```

#### **Logging Security**
```typescript
// Never log secrets
logger.info('Database connected', { 
  host: 'localhost',  // ✅ Safe
  // password: 'xxx'  // ❌ Never log
});
```

### **📚 Additional Resources**

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [12 Factor App - Config](https://12factor.net/config)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security/security-advisories)

### **🆘 Security Contacts**

- **Security Issues**: Create private GitHub issue
- **Emergency**: Contact security team immediately
- **Questions**: Ask in #security Slack channel

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before committing!
