// Enhanced AI Chat Components
export { QuickChat } from './QuickChat';
export { QuickChatTrigger } from './QuickChatTrigger';
export { default as ChatPage } from '../../pages/ChatPage';

// Enhanced Message Components
export { ModernExecutiveAssistant } from './enhanced/ModernExecutiveAssistant';

// Enhanced Hooks

// Enhanced Types
export type { ChatMessage, ChatState, ChatActions, StreamingMessage, AttachmentData, MessageReaction } from '../../lib/types/chat';

// Legacy Components (for backward compatibility)
export { ExecutiveAssistant } from './ExecutiveAssistant';
export { OrganizationalChatPanel } from './OrganizationalChatPanel';
export { DepartmentalAgent } from './DepartmentalAgent';

// Modern Components (recommended)
export { ModernExecutiveAssistant as ExecutiveAssistantV2 } from './enhanced/ModernExecutiveAssistant';
export { ActionCard } from './ActionCard';

export { ProfessionalEmailUpsell } from './ProfessionalEmailUpsell';
export { UserKnowledgeViewer } from './UserKnowledgeViewer';
export { ProgressiveIntelligence } from './ProgressiveIntelligence';
export { AISuggestionCard } from './AISuggestionCard';
export { ToolEnabledDemo } from './ToolEnabledDemo';
export { InteractivePrompts } from './InteractivePrompts'; 