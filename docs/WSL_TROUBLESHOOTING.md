# WSL Troubleshooting Guide

## 🐧 **WSL-Specific Issues with Supabase**

### **Common WSL Problems**

#### **1. Docker Container Issues**
```bash
# Error: "No such container: supabase_db_..."
# Solution: Use WSL repair script
pnpm db:wsl-repair
```

#### **2. Migration History Mismatch**
```bash
# Error: "migration history does not match"
# Solution: WSL-specific repair
pnpm db:wsl-repair
```

#### **3. Docker Desktop Not Running**
```bash
# Error: "failed to inspect container health"
# Solution: Start Docker Desktop on Windows
```

### **WSL-Specific Repair Process**

#### **Step 1: Check Docker Status**
```bash
# Check if Docker is running
docker info

# If not running, start Docker Desktop on Windows
# Then restart your WSL terminal
```

#### **Step 2: Clean Up Containers**
```bash
# Stop any running Supabase instances
supabase stop

# Clean up orphaned containers
docker container prune -f
```

#### **Step 3: Use WSL Repair Script**
```bash
# Run the WSL-specific repair
pnpm db:wsl-repair
```

### **WSL Environment Setup**

#### **Prerequisites**
1. **Docker Desktop** installed on Windows
2. **WSL Integration** enabled in Docker Desktop
3. **Supabase CLI** installed in WSL
4. **Node.js/pnpm** installed in WSL

#### **Docker Desktop Settings**
1. Open Docker Desktop on Windows
2. Go to Settings → Resources → WSL Integration
3. Enable integration for your WSL distribution
4. Apply & Restart

#### **WSL Terminal Setup**
```bash
# Restart WSL terminal after Docker Desktop changes
exit
# Then open a new WSL terminal
```

### **WSL-Specific Commands**

#### **Check WSL Environment**
```bash
# Check if you're in WSL
uname -a

# Check Docker status
docker info

# Check Supabase CLI
supabase --version
```

#### **WSL Repair Commands**
```bash
# Full WSL repair (recommended)
pnpm db:wsl-repair

# Manual WSL cleanup
supabase stop
docker container prune -f
supabase start
```

### **Common WSL Error Solutions**

#### **"No such container" Error**
```bash
# This happens when Docker containers get out of sync
pnpm db:wsl-repair
```

#### **"failed to inspect container health"**
```bash
# Docker Desktop not running or WSL integration disabled
# 1. Start Docker Desktop on Windows
# 2. Enable WSL integration
# 3. Restart WSL terminal
# 4. Run: pnpm db:wsl-repair
```

#### **"migration history does not match"**
```bash
# WSL-specific migration repair
pnpm db:wsl-repair
```

#### **Permission Denied Errors**
```bash
# Fix file permissions in WSL
chmod +x scripts/*.sh
```

### **WSL Best Practices**

#### **Daily Workflow in WSL**
```bash
# Morning: Check Docker and sync
docker info
pnpm db:sync:from-remote

# Development
pnpm supabase:start
pnpm dev

# Evening: Push changes
pnpm db:sync:to-remote
```

#### **Before Creating Migrations in WSL**
```bash
# 1. Ensure Docker is running
docker info

# 2. Sync with remote
pnpm db:sync:from-remote

# 3. Create migration
pnpm db:sync:create-migration your_migration_name

# 4. Test locally
pnpm supabase:db:reset
pnpm supabase:start

# 5. Push to remote
pnpm db:sync:to-remote
```

### **WSL Troubleshooting Checklist**

#### **When Things Break in WSL**
- [ ] Is Docker Desktop running on Windows?
- [ ] Is WSL integration enabled in Docker Desktop?
- [ ] Have you restarted the WSL terminal?
- [ ] Are file permissions correct?
- [ ] Is Supabase CLI installed in WSL?

#### **Recovery Steps**
1. **Start Docker Desktop** on Windows
2. **Enable WSL integration** in Docker settings
3. **Restart WSL terminal**
4. **Run WSL repair**: `pnpm db:wsl-repair`
5. **Test local development**: `pnpm dev`

### **WSL-Specific Scripts**

#### **Available Commands**
```bash
pnpm db:wsl-repair        # WSL-specific repair
pnpm db:quick-repair       # General repair (may not work in WSL)
pnpm db:repair-migrations  # Detailed repair
pnpm db:sync:from-remote   # Sync from remote
pnpm db:sync:to-remote     # Sync to remote
```

### **Performance Tips for WSL**

#### **File System Performance**
- Store project in WSL filesystem (not Windows mounted drive)
- Use `/home/username/projects/` instead of `/mnt/c/...`

#### **Docker Performance**
- Enable WSL 2 backend in Docker Desktop
- Allocate sufficient memory to WSL in Docker settings

### **Emergency WSL Recovery**

#### **Complete WSL Reset**
```bash
# 1. Stop everything
supabase stop
docker system prune -f

# 2. Restart Docker Desktop on Windows

# 3. Restart WSL terminal

# 4. Run WSL repair
pnpm db:wsl-repair

# 5. Test
pnpm supabase:start
pnpm dev
```

### **Success Metrics for WSL**

After repair:
- ✅ Docker containers start without errors
- ✅ Local database matches remote
- ✅ No "No such container" errors
- ✅ Development server starts
- ✅ Can create new migrations
- ✅ File permissions are correct 