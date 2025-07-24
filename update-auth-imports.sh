#!/bin/bash

# Script to update all files using old auth system to use new auth system
echo "Updating auth imports across the codebase..."

# Function to update a file
update_file() {
    local file="$1"
    local old_import="$2"
    local new_import="$3"
    local old_hook="$4"
    local new_hook="$5"
    
    echo "Updating $file..."
    
    # Update import
    sed -i "s|$old_import|$new_import|g" "$file"
    
    # Update hook usage
    sed -i "s|$old_hook|$new_hook|g" "$file"
}

# Update files using useZustandAuth
update_file "src/shared/components/layout/Header.tsx" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

update_file "src/domains/tasks/workspace/pages/WorkspacePage.tsx" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

update_file "src/domains/dashboard/components/ConsolidatedDashboard.tsx" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

update_file "src/domains/help-center/knowledge/pages/Home.tsx" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

update_file "src/domains/admin/onboarding/hooks/useOnboarding.ts" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

update_file "src/domains/admin/onboarding/pages/OnboardingChecklist.tsx" \
    "import { useZustandAuth } from '@/shared/hooks/useZustandAuth';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useZustandAuth" \
    "useAuth"

# Update files using useAuthContext
update_file "src/domains/departments/finance/components/FinancialOperationsPage.tsx" \
    "import { useAuth } from '../../../contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/departments/sales/components/SalesPerformancePage.tsx" \
    "import { useAuth } from '../../../contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/ai/components/AISuggestionCard.tsx" \
    "import { useAuth } from '../../../contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/integrations/pages/HubSpotTest.tsx" \
    "import { useAuthContext } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/shared/hooks/useBusinessHealth.ts" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/onboarding/components/UserContextStep.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/user/pages/SignUpPage.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/user/pages/AccountSettings.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/onboarding/components/ProfileConfirmationStep.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/onboarding/components/BusinessSnapshotStep.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/onboarding/components/BusinessContextStep.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/user/pages/EmailNotVerified.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/onboarding/pages/CompanyProfilePage.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/pages/DebugPage.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

update_file "src/domains/admin/pages/UserManagementPage.tsx" \
    "import { useAuth } from '@/shared/contexts/AuthContext';" \
    "import { useAuth } from '@/core/auth/AuthProvider';" \
    "useAuthContext" \
    "useAuth"

echo "Auth import updates completed!" 