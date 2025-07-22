#!/bin/bash

# AI Features Consolidation Script
# Moves all components from ai/features to ai/components for better organization

set -e

echo "🔄 Starting AI features consolidation..."

# Create backup of current structure
echo "📁 Creating backup..."
mkdir -p backup/ai-features
cp -r src/domains/ai/features backup/ai-features/

# Move components from features to main components directory
echo "📦 Moving components..."
find src/domains/ai/features/components -name "*.tsx" -exec cp {} src/domains/ai/components/ \;

# Move hooks from features to main hooks directory
echo "🎣 Moving hooks..."
if [ -d "src/domains/ai/features/hooks" ]; then
  find src/domains/ai/features/hooks -name "*.ts" -exec cp {} src/domains/ai/hooks/ \;
fi

# Move services from features to main services directory
echo "🔧 Moving services..."
if [ -d "src/domains/ai/features/services" ]; then
  find src/domains/ai/features/services -name "*.ts" -exec cp {} src/domains/ai/services/ \;
fi

# Move pages from features to main pages directory
echo "📄 Moving pages..."
if [ -d "src/domains/ai/features/pages" ]; then
  find src/domains/ai/features/pages -name "*.tsx" -exec cp {} src/domains/ai/pages/ \;
fi

# Move chat components
echo "💬 Moving chat components..."
if [ -d "src/domains/ai/features/chat" ]; then
  find src/domains/ai/features/chat -name "*.tsx" -exec cp {} src/domains/ai/components/ \;
fi

# Update import paths in moved files
echo "🔗 Updating import paths..."
find src/domains/ai/components -name "*.tsx" -exec sed -i 's|@/domains/ai/features/|@/domains/ai/|g' {} \;
find src/domains/ai/hooks -name "*.ts" -exec sed -i 's|@/domains/ai/features/|@/domains/ai/|g' {} \;
find src/domains/ai/services -name "*.ts" -exec sed -i 's|@/domains/ai/features/|@/domains/ai/|g' {} \;
find src/domains/ai/pages -name "*.tsx" -exec sed -i 's|@/domains/ai/features/|@/domains/ai/|g' {} \;

# Update exports in main index files
echo "📤 Updating exports..."

# Update components index
cat > src/domains/ai/components/index.ts << 'EOF'
// AI Components - Consolidated from features
export { default as StreamingComposer } from './StreamingComposer';
export { default as ContinuousImprovementDashboard } from './ContinuousImprovementDashboard';
export { default as AgentPicker } from './AgentPicker';
export { default as DomainAgentIndicator } from './DomainAgentIndicator';
export { default as ExecutiveAssistant } from './ExecutiveAssistant';
export { default as MVPScopeIndicator } from './MVPScopeIndicator';
export { default as MarcobyNexusAgent } from './MarcobyNexusAgent';
export { default as QuickChatTrigger } from './QuickChatTrigger';
export { default as SlashCommandMenu } from './SlashCommandMenu';
export { default as UserKnowledgeViewer } from './UserKnowledgeViewer';
export { default as ContextChips } from './ContextChips';
export { default as ModelPerformanceMonitor } from './ModelPerformanceMonitor';

// Consolidated from features/components
export { ContextCompletionSuggestions } from './ContextCompletionSuggestions';
export { QuickChat } from './QuickChat';
export { ProgressiveIntelligence } from './ProgressiveIntelligence';
export { AISuggestionCard } from './AISuggestionCard';
export { AdvancedAICapabilitiesDemo } from './AdvancedAICapabilitiesDemo';
export { ChatIntegrationExample } from './ChatIntegrationExample';
export { DepartmentalAgent } from './DepartmentalAgent';
export { InteractivePrompts } from './InteractivePrompts';
export { N8nAssistantPanel } from './N8nAssistantPanel';
export { PersonalMemoryCapture } from './PersonalMemoryCapture';
export { ProfessionalEmailUpsell } from './ProfessionalEmailUpsell';
export { VirtualizedMessageList } from './VirtualizedMessageList';
export { AIFeatureCard } from './AIFeatureCard';
export { ActionCard } from './ActionCard';
export { ProfessionalEmailActionCard } from './ProfessionalEmailActionCard';
export { AssistantUpgradeStatus } from './AssistantUpgradeStatus';
export { BusinessIntelligentChat } from './BusinessIntelligentChat';
export { EABusinessObservationCard } from './EABusinessObservationCard';
export { NexusAIController } from './NexusAIController';
export { ContextChipsDemo } from './ContextChipsDemo';
export { CrossPlatformIntelligenceDemo } from './CrossPlatformIntelligenceDemo';
export { ToolEnabledDemo } from './ToolEnabledDemo';
export { ContextualDataCompletionDemo } from './ContextualDataCompletionDemo';
export { ModernExecutiveAssistant } from './ModernExecutiveAssistant';
export { OrganizationalChatPanel } from './OrganizationalChatPanel';
EOF

# Remove the features directory
echo "🗑️ Removing features directory..."
rm -rf src/domains/ai/features

echo "✅ AI features consolidation complete!"
echo "📁 Components moved to: src/domains/ai/components/"
echo "📁 Hooks moved to: src/domains/ai/hooks/"
echo "📁 Services moved to: src/domains/ai/services/"
echo "📁 Pages moved to: src/domains/ai/pages/"
echo "📁 Backup created at: backup/ai-features/" 