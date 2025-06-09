// Enhanced AI Chat Components
export { QuickChat } from './QuickChat';
export { QuickChatTrigger } from './QuickChatTrigger';
export { default as ChatPage } from '../../pages/ChatPage';

// Enhanced Message Components
export { MessageBubble } from './enhanced/MessageBubble';
export { ChatInput } from './enhanced/ChatInput';
export { ModernExecutiveAssistant } from './enhanced/ModernExecutiveAssistant';

// Enhanced Hooks
export { useEnhancedChat } from '../../lib/hooks/useEnhancedChat';

// Enhanced Types
export type { ChatMessage, ChatState, ChatActions, StreamingMessage, AttachmentData, MessageReaction } from '../../lib/types/chat';

// Legacy Components (for backward compatibility)
export { ExecutiveAssistant } from './ExecutiveAssistant';
export { OrganizationalChatPanel } from './OrganizationalChatPanel';
export { DepartmentalAgent } from './DepartmentalAgent';

// Modern Components (recommended)
export { ModernExecutiveAssistant as ExecutiveAssistantV2 } from './enhanced/ModernExecutiveAssistant'; 