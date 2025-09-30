# 🎯 Onboarding as First Playbook Plan

## **Overview**
Transform onboarding into the **first playbook automatically assigned after signup**, eliminating all onboarding-specific logic and making it purely playbook-driven.

---

## **Current State → Target State**

### **Before (Dual System):**
- OnboardingService with complex phase logic
- `user_onboarding_steps` table
- Onboarding-specific UI components
- Special completion validation

### **After (Playbook-Only):**
- PlaybookService handles everything
- `user_playbook_progress` table only
- Standard playbook UI components
- Standard playbook completion logic

---

## **Implementation Plan**

### **Phase 1: Auto-Assignment Logic**

#### **Step 1: Update Signup Flow**
```typescript
// In UserService or AuthService
async function handleNewUserSignup(userId: string) {
  // 1. Create user profile
  await createUserProfile(userId);
  
  // 2. Auto-assign onboarding playbook
  await playbookService.assignPlaybookToUser(
    userId, 
    'Nexus Business Onboarding Journey'
  );
  
  // 3. Set as active playbook
  await playbookService.setActivePlaybook(userId, playbookId);
}
```

#### **Step 2: Playbook Assignment Service**
```typescript
// In PlaybookService
async assignPlaybookToUser(userId: string, playbookName: string) {
  const playbook = await this.getPlaybookByName(playbookName);
  
  await this.createUserPlaybookProgress({
    user_id: userId,
    playbook_id: playbook.id,
    status: 'assigned',
    progress_percentage: 0,
    started_at: new Date()
  });
}
```

### **Phase 2: Update UI Components**

#### **Step 1: Replace Onboarding Components**
- **Before:** `OnboardingStep`, `OnboardingPhase`, `OnboardingProgress`
- **After:** `PlaybookItem`, `PlaybookProgress`, `PlaybookNavigation`

#### **Step 2: Update Navigation**
- **Before:** `/onboarding/step/1`, `/onboarding/phase/1`
- **After:** `/playbooks/onboarding-journey/items/1`

#### **Step 3: Update Progress Indicators**
- **Before:** Onboarding-specific progress bars
- **After:** Standard playbook progress components

### **Phase 3: Data Migration**

#### **Step 1: Migrate Existing Users**
```sql
-- For each user with onboarding steps, create playbook progress
INSERT INTO user_playbook_progress (
  user_id, 
  playbook_id, 
  progress_percentage, 
  status, 
  started_at
)
SELECT 
  uos.user_id,
  pt.id as playbook_id,
  CASE 
    WHEN COUNT(*) >= 7 THEN 100  -- All steps completed
    ELSE (COUNT(*) * 100) / 7    -- Partial completion
  END as progress_percentage,
  CASE 
    WHEN COUNT(*) >= 7 THEN 'completed'
    ELSE 'in_progress'
  END as status,
  MIN(uos.completed_at) as started_at
FROM user_onboarding_steps uos
CROSS JOIN playbook_templates pt 
WHERE pt.name = 'Nexus Business Onboarding Journey'
GROUP BY uos.user_id, pt.id;
```

#### **Step 2: Update User Profiles**
```sql
-- Update onboarding_completed based on playbook progress
UPDATE user_profiles 
SET onboarding_completed = (
  SELECT upp.status = 'completed' 
  FROM user_playbook_progress upp
  JOIN playbook_templates pt ON upp.playbook_id = pt.id
  WHERE pt.name = 'Nexus Business Onboarding Journey'
  AND upp.user_id = user_profiles.user_id
);
```

### **Phase 4: Cleanup**

#### **Step 1: Remove OnboardingService**
- Delete entire OnboardingService
- Remove all onboarding-specific imports
- Update service registry

#### **Step 2: Remove Legacy Tables**
```sql
-- After migration verification
DROP TABLE user_onboarding_steps;
DROP TABLE user_onboarding_phases;
DROP TABLE user_onboarding_completions;
```

#### **Step 3: Remove Legacy Components**
- Delete onboarding-specific React components
- Remove onboarding routes
- Clean up onboarding utilities

---

## **Benefits**

### **✅ Consistency**
- All guided experiences use same system
- Same UI patterns everywhere
- Same completion logic

### **✅ Simplicity**
- One service to maintain
- One data model
- One set of components

### **✅ Flexibility**
- Easy to modify onboarding by editing playbook
- Can add conditional steps
- Can reuse playbook logic for other journeys

### **✅ User Experience**
- Familiar interface for all guided experiences
- Consistent progress tracking
- Same completion celebrations

---

## **Implementation Steps**

### **Week 1: Core Logic**
- [ ] Update PlaybookService with auto-assignment
- [ ] Update signup flow
- [ ] Create migration script

### **Week 2: UI Updates**
- [ ] Replace onboarding components with playbook components
- [ ] Update navigation routes
- [ ] Update progress indicators

### **Week 3: Migration & Testing**
- [ ] Run data migration
- [ ] Test with existing users
- [ ] Verify completion logic

### **Week 4: Cleanup**
- [ ] Remove OnboardingService
- [ ] Remove legacy tables
- [ ] Remove legacy components

---

## **Success Criteria**

### **Technical**
- [ ] Zero onboarding-specific services
- [ ] All onboarding logic uses PlaybookService
- [ ] Migration preserves user progress
- [ ] No breaking changes to user experience

### **User Experience**
- [ ] New users get onboarding playbook automatically
- [ ] Existing users see same progress
- [ ] Completion logic works identically
- [ ] UI feels consistent

### **Maintenance**
- [ ] Reduced codebase complexity
- [ ] Single source of truth for guided experiences
- [ ] Easier to add new onboarding steps
- [ ] Consistent API patterns

---

*This approach makes onboarding truly just another playbook, eliminating all special cases and creating a unified guided experience system.*
