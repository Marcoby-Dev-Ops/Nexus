import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useCurrentUser } from '@/hooks/index';
import { useAuthStore } from '@/core/auth/authStore';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { resolveCanonicalUserId } from '@/core/auth/userIdentity';
import { Button } from '@/shared/components/ui/Button';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { ConversationalAIService } from '@/services/ai/ConversationalAIService';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { Sparkles, X } from 'lucide-react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { StreamRuntimeMetadata, StreamRuntimeStatus } from '@/services/ai/ConversationalAIService';
import type { FileAttachment } from '@/shared/types/chat';
import { chatAttachmentService } from '@/lib/ai/services/chatAttachmentService';
import { ATTACHMENT_ONLY_PLACEHOLDER } from '@/shared/constants/chat';

// Initialize AI Service
const conversationalAIService = new ConversationalAIService();
const CHAT_EMAIL_CONNECT_FLOW_ENABLED = import.meta.env.VITE_CHAT_EMAIL_CONNECT_FLOW !== 'false';

type OAuthHandoffPayload = {
  type: 'nexus:oauth:completed';
  provider?: string;
  status?: 'connected' | 'failed';
  integrationId?: string | null;
  connectedAt?: string | null;
  errorCode?: string;
  error?: string;
  correlationId?: string;
  conversationId?: string | null;
};

function generateTitle(message: string, maxLen = 50): string {
  const cleaned = message.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.3 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function generateAttachmentTitle(attachments: FileAttachment[]): string {
  if (!attachments.length) return 'New Conversation';
  if (attachments.length === 1) return `File: ${attachments[0].name}`;
  return `Files: ${attachments[0].name} +${attachments.length - 1}`;
}

function buildAttachmentSummary(attachments: FileAttachment[]): string {
  if (!attachments.length) return '';
  const lines = attachments.map((attachment) => `- ${attachment.name}`);
  return `\n\nAttached files:\n${lines.join('\n')}`;
}

function toRuntimeAttachments(attachments: FileAttachment[]) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    url: attachment.url || attachment.downloadUrl || '',
    downloadUrl: attachment.downloadUrl || attachment.url || ''
  }));
}

type GeneratedAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  downloadUrl?: string;
};

function mergeGeneratedAttachments(existing: GeneratedAttachment[], incoming: GeneratedAttachment[]): GeneratedAttachment[] {
  const byKey = new Map<string, GeneratedAttachment>();
  for (const attachment of [...existing, ...incoming]) {
    const link = attachment.downloadUrl || attachment.url || '';
    const key = `${link}::${attachment.name}`;
    if (!link || !attachment.name || byKey.has(key)) continue;
    byKey.set(key, attachment);
  }
  return Array.from(byKey.values());
}

function appendGeneratedAttachmentSummary(content: string, attachments: GeneratedAttachment[]): string {
  if (!attachments.length) return content;
  const missingLinks = attachments.filter((attachment) => {
    const link = attachment.downloadUrl || attachment.url || '';
    return link && !content.includes(link);
  });
  if (!missingLinks.length) return content;

  const lines = missingLinks.map((attachment) => {
    const link = attachment.downloadUrl || attachment.url || '';
    return `- [${attachment.name}](${link})`;
  });

  return `${content}\n\nGenerated files:\n${lines.join('\n')}`;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { currentUser } = useCurrentUser();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { setHeaderContent } = useHeaderContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedAgentId = searchParams.get('agent') || 'nexus-assistant';

  const AGENT_LABELS: Record<string, string> = {
    'nexus-assistant': 'Executive Assistant',
    'executive-assistant': 'Executive Assistant',
    'concierge-director': 'Concierge Director',
    'business-identity-consultant': 'Business Identity Consultant',
    'sales-dept': 'Sales Specialist',
    'finance-dept': 'Finance Specialist',
    'operations-dept': 'Operations Specialist',
    'marketing-dept': 'Marketing Specialist'
  };

  const selectedAgentName = AGENT_LABELS[requestedAgentId] || 'Executive Assistant';

  // Connect to AIChatStore
  const {
    messages: storeMessages,
    sendMessage,
    saveAIResponse, // Confirmed exists in store
    createConversation, // Confirmed exists in store
    fetchConversations,
    isLoading: conversationsLoading,
    error,
    currentConversation,
    setCurrentConversationById,
    // Add additional keys for streaming if available, otherwise we use local state
  } = useAIChatStore();

  // Local state for streaming UI since store might not expose everything needed for this view's specifics or we want isolation
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [contextInjectedForStream, setContextInjectedForStream] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamRuntimeStatus | null>(null);
  const [thinkingContent, setThinkingContent] = useState('');
  const [contextChips, setContextChips] = useState<string[]>([]);
  const [pendingEmailConnection, setPendingEmailConnection] = useState<{ email: string } | null>(null);
  const [pendingImapConnection, setPendingImapConnection] = useState<{
    email: string;
    provider: string;
    host: string;
    port: number;
    useSSL: boolean;
    username: string;
  } | null>(null);
  const [pendingOAuthConversationId, setPendingOAuthConversationId] = useState<string | null>(null);

  // Knowledge context state
  const ragEnabled = contextInjectedForStream;
  const ragConfidence: 'high' | 'medium' | 'low' = 'high';
  const knowledgeTypes: string[] = [];
  const ragSources: any[] = [];
  const ragRecommendations: string[] = [];
  const businessContextData = null;

  // Update Header
  useEffect(() => {
    setHeaderContent('Chat', 'Business Intelligence Assistant');
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Reset streaming state when switching conversations
  useEffect(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setThinkingContent('');
    setLocalIsLoading(false);
    setContextInjectedForStream(false);
    setStreamStatus(null);
  }, [currentConversation?.id]);

  const conversationId = currentConversation?.id;

  const getAccessToken = () => {
    const storeState = useAuthStore.getState();
    const session = storeState.session;
    return session?.session?.accessToken || session?.accessToken || '';
  };

  const startEmailOAuthProviderConnection = useCallback(async (
    provider: 'microsoft' | 'google_workspace',
    options: { flowConversationId?: string | null } = {}
  ) => {
    if (!user?.id) {
      toast({
        title: 'Session missing',
        description: 'Please sign in again before connecting your email.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      const canonicalUserId = resolveCanonicalUserId(user.id, session);
      const accessToken = session?.session?.accessToken || session?.accessToken;

      if (!canonicalUserId) {
        throw new Error('Unable to resolve authenticated user identity');
      }

      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      const providerPath = provider === 'google_workspace' ? 'google-workspace' : provider;
      const correlationId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const startUrl = `/api/oauth/${providerPath}/start?userId=${encodeURIComponent(canonicalUserId)}&redirectUri=${encodeURIComponent(redirectUri)}`;
      const startResponse = await fetch(startUrl, {
        credentials: 'include',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          'x-correlation-id': correlationId
        }
      });

      if (!startResponse.ok) {
        const details = await startResponse.text();
        throw new Error(`Failed to start ${provider} OAuth (${startResponse.status}): ${details}`);
      }

      const startData = await startResponse.json();
      if (!startData?.authUrl || !startData?.state) {
        throw new Error(`${provider} OAuth start response is missing authUrl/state`);
      }

      sessionStorage.setItem('oauth_state', startData.state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_user_id', canonicalUserId);
      sessionStorage.setItem('oauth_return_to', '/chat');
      sessionStorage.setItem('oauth_flow', 'chat-inline');
      sessionStorage.setItem('oauth_flow_conversation_id', options.flowConversationId || conversationId || '');
      sessionStorage.setItem('oauth_correlation_id', startData.correlationId || correlationId);

      setPendingOAuthConversationId(options.flowConversationId || conversationId || null);

      const popup = window.open(
        startData.authUrl,
        'nexus-oauth-connect',
        'width=560,height=760,resizable=yes,scrollbars=yes'
      );
      if (!popup) {
        window.location.href = startData.authUrl;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to start ${provider} OAuth`;
      logger.error('Chat-triggered email connection failed', { provider, error: message });
      toast({
        title: 'Connection failed',
        description: message,
        variant: 'destructive'
      });
    }
  }, [user?.id, toast, conversationId]);

  const isAffirmative = (text: string) =>
    /^(yes|yep|yeah|confirm|correct|use that|that one|go ahead|proceed|do it)\b/.test(text.trim());

  const isNegative = (text: string) =>
    /^(no|nope|different|not that|another)\b/.test(text.trim());

  const ensureConversationForLocalFlow = useCallback(async (seed: string): Promise<string | null> => {
    if (conversationId) return conversationId;
    if (!createConversation || !user?.id) return null;
    return createConversation(generateTitle(seed), 'gpt-4', undefined, user.id);
  }, [conversationId, createConversation, user?.id]);

  const postLocalAssistantMessage = useCallback(async (conversationIdValue: string | null, content: string) => {
    if (!conversationIdValue || !saveAIResponse) return;
    await saveAIResponse(content, conversationIdValue, { persist: false });
  }, [saveAIResponse]);

  const resolveEmailAndConnect = useCallback(async (email: string, flowConversationId: string | null) => {
    try {
      const token = getAccessToken();
      const resolveResponse = await fetch('/api/oauth/email-provider/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email })
      });

      if (!resolveResponse.ok) {
        const details = await resolveResponse.text();
        throw new Error(`Provider resolution failed (${resolveResponse.status}): ${details}`);
      }

      const resolution = await resolveResponse.json();
      const provider = resolution?.recommendation?.provider;
      const workflow = resolution?.recommendation?.workflow;
      const displayName = resolution?.recommendation?.displayName || 'Email Provider';

      if (workflow === 'oauth' && provider === 'microsoft') {
        await postLocalAssistantMessage(
          flowConversationId,
          `Detected **${displayName}** for \`${email}\`. Starting Microsoft 365 connection now.`
        );
        await startEmailOAuthProviderConnection('microsoft', { flowConversationId });
        return;
      }

      if (workflow === 'oauth' && provider === 'google_workspace') {
        await postLocalAssistantMessage(
          flowConversationId,
          `Detected **${displayName}** for \`${email}\`. Starting Google Workspace connection now.`
        );
        await startEmailOAuthProviderConnection('google_workspace', { flowConversationId });
        return;
      }

      await postLocalAssistantMessage(
        flowConversationId,
        `Detected **${displayName}** for \`${email}\`, which currently needs manual IMAP/SMTP setup. OAuth is not available yet for this provider.`
      );
      const suggested = resolution?.suggestedImap || {};
      const suggestedHost = suggested.host || `imap.${email.split('@')[1] || ''}`;
      const suggestedPort = Number(suggested.port || 993);
      const suggestedUseSSL = suggested.useSSL !== false;
      const suggestedUsername = suggested.username || email;

      setPendingImapConnection({
        email,
        provider: provider || 'custom_imap',
        host: suggestedHost,
        port: suggestedPort,
        useSSL: suggestedUseSSL,
        username: suggestedUsername,
      });

      await postLocalAssistantMessage(
        flowConversationId,
        `To connect via IMAP, reply with:\n\`password=YOUR_APP_PASSWORD\`\nYou can optionally override defaults:\n\`host=${suggestedHost} port=${suggestedPort} username=${suggestedUsername} ssl=${suggestedUseSSL}\``
      );
      toast({
        title: `${displayName} detected`,
        description: 'OAuth is not available yet. Send your IMAP app password in chat to complete setup.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve email provider';
      logger.error('Email provider resolution failed', { error: message, email });
      await postLocalAssistantMessage(
        flowConversationId,
        `I could not resolve the email provider for \`${email}\`. Please try again or provide a different address.`
      );
      toast({
        title: 'Provider detection failed',
        description: message,
        variant: 'destructive'
      });
    }
  }, [postLocalAssistantMessage, startEmailOAuthProviderConnection, toast]);

  const parseImapKeyValues = (input: string): Record<string, string> => {
    const entries: Record<string, string> = {};
    const regex = /([a-zA-Z_]+)=("([^"]+)"|'([^']+)'|[^\s]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      const key = (match[1] || '').toLowerCase();
      const value = (match[3] || match[4] || match[2] || '').replace(/^['"]|['"]$/g, '');
      if (key) entries[key] = value;
    }
    return entries;
  };

  const parseInboxDatePreset = (message: string): string | null => {
    const text = message.toLowerCase();
    if (text.includes('today')) return 'today';
    if (text.includes('last week')) return 'last_week';
    if (text.includes('last month')) return 'last_month';
    if (text.includes('this week')) return 'this_week';
    if (text.includes('this month')) return 'this_month';
    if (text.includes('last 7 days')) return 'last_7_days';
    if (text.includes('last 30 days')) return 'last_30_days';
    return null;
  };

  const parseInboxOpenIntent = (message: string, explicitEmail: string) => {
    const normalized = message.toLowerCase();
    const wantsInbox =
      normalized.includes('open inbox') ||
      normalized.includes('show inbox') ||
      normalized.includes('open mailbox') ||
      normalized.includes('show mailbox') ||
      normalized.includes('show emails') ||
      normalized.includes('emails from');
    if (!wantsInbox) return null;

    return {
      datePreset: parseInboxDatePreset(message),
      from: explicitEmail || null,
      unreadOnly: normalized.includes('unread')
    };
  };

  const getLiveIntegrationStatusMessage = useCallback(async (): Promise<string> => {
    if (!user?.id) {
      return 'I cannot check integration status because your session is not available. Please sign in again.';
    }

    const sessionResult = await authentikAuthService.getSession();
    const session = sessionResult.data;
    const canonicalUserId = resolveCanonicalUserId(user.id, session);
    const accessToken = session?.session?.accessToken || session?.accessToken;

    if (!canonicalUserId) {
      return 'I cannot determine your account identity yet. Please refresh and try again.';
    }

    const response = await fetch(`/api/oauth/integrations/${encodeURIComponent(canonicalUserId)}`, {
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to load integrations (${response.status}): ${details}`);
    }

    const payload = await response.json();
    const integrations = Array.isArray(payload?.integrations) ? payload.integrations : [];
    const connected = integrations.filter((i: any) => {
      const status = String(i?.status || '').toLowerCase();
      return status === 'connected' || status === 'active';
    });

    if (!connected.length) {
      return 'You currently do not have any connected integrations.';
    }

    const lines = connected.map((integration: any) => {
      const name = integration.integrationName || integration.provider || 'Unknown';
      const status = integration.status || 'connected';
      return `- ${name}: ${status}`;
    });
    return `Live integration status for your account:\n${lines.join('\n')}`;
  }, [user?.id]);

  const loadContextChips = useCallback(async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const query = new URLSearchParams({
        agentId: requestedAgentId,
        limit: '4'
      });

      if (conversationId) {
        query.set('conversationId', conversationId);
      }

      const response = await fetch(`/api/knowledge/context-chips?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;
      const payload = await response.json();
      const chips = Array.isArray(payload?.data?.chips) ? payload.data.chips : [];
      setContextChips(chips.filter((chip: unknown): chip is string => typeof chip === 'string' && chip.trim().length > 0));
    } catch {
      // Keep fallback chips in ChatWelcome if API is unavailable.
    }
  }, [user, requestedAgentId, conversationId]);

  useEffect(() => {
    loadContextChips();
  }, [loadContextChips]);

  useEffect(() => {
    const onOAuthMessage = async (event: MessageEvent<OAuthHandoffPayload>) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || payload.type !== 'nexus:oauth:completed') return;

      let flowConversationId =
        payload.conversationId ||
        sessionStorage.getItem('oauth_flow_conversation_id') ||
        pendingOAuthConversationId ||
        conversationId ||
        null;
      if (!flowConversationId) {
        flowConversationId = await ensureConversationForLocalFlow('integration connection result');
      }
      const provider = payload.provider || sessionStorage.getItem('oauth_provider') || 'email';

      if (payload.status === 'connected') {
        const connectedAt = payload.connectedAt ? new Date(payload.connectedAt).toLocaleString() : 'just now';
        await postLocalAssistantMessage(
          flowConversationId,
          `Connected **${provider}** successfully at ${connectedAt}. Nexus now has delegated access for this service.`
        );
        window.dispatchEvent(new CustomEvent('nexus:integrations-updated'));
      } else {
        const failureReason = payload.error || payload.errorCode || 'OAuth callback failed';
        await postLocalAssistantMessage(
          flowConversationId,
          `Connection failed for **${provider}**. Error: ${failureReason}. You can retry and I will continue from here.`
        );
      }

      try {
        const statusMessage = await getLiveIntegrationStatusMessage();
        await postLocalAssistantMessage(flowConversationId, statusMessage);
      } catch (error) {
        logger.warn('Failed to refresh integration status after OAuth callback', {
          error: error instanceof Error ? error.message : String(error)
        });
      }

      setPendingOAuthConversationId(null);
      sessionStorage.removeItem('oauth_flow');
      sessionStorage.removeItem('oauth_flow_conversation_id');
      sessionStorage.removeItem('oauth_correlation_id');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_user_id');
      sessionStorage.removeItem('oauth_return_to');
    };

    window.addEventListener('message', onOAuthMessage);
    return () => window.removeEventListener('message', onOAuthMessage);
  }, [
    conversationId,
    pendingOAuthConversationId,
    getLiveIntegrationStatusMessage,
    postLocalAssistantMessage,
    ensureConversationForLocalFlow
  ]);

  const handleSendMessage = async (message: string, attachments: FileAttachment[] = []) => {
    if (!user) return;

    const trimmedMessage = message.trim();
    const hasAttachments = attachments.length > 0;
    if (!trimmedMessage && !hasAttachments) return;

    const normalizedMessage = trimmedMessage.toLowerCase();
    const wantsEmailConnection =
      normalizedMessage.includes('connect my email') ||
      normalizedMessage.includes('connect email') ||
      normalizedMessage.includes('connect gmail') ||
      normalizedMessage.includes('connect google') ||
      normalizedMessage.includes('connect outlook') ||
      normalizedMessage.includes('connect 365') ||
      normalizedMessage.includes('connect microsoft 365') ||
      normalizedMessage.includes('set up email access');
    const asksIntegrationStatus =
      normalizedMessage.includes('status of my integration') ||
      normalizedMessage.includes('status of my integrations') ||
      normalizedMessage.includes('what is my integration status') ||
      normalizedMessage.includes('what integrations are connected') ||
      normalizedMessage.includes('is microsoft connected') ||
      normalizedMessage.includes('is 365 connected');
    const explicitEmailMatch = trimmedMessage.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const explicitEmail = explicitEmailMatch?.[0] || '';
    const inboxOpenIntent = parseInboxOpenIntent(trimmedMessage, explicitEmail);

    if (inboxOpenIntent) {
      const flowConversationId = await ensureConversationForLocalFlow(trimmedMessage);
      if (flowConversationId) {
        await sendMessage(trimmedMessage, flowConversationId, [], { persist: false });
        await postLocalAssistantMessage(
          flowConversationId,
          'Opening your mailbox view with the requested filters.'
        );
      }
      const params = new URLSearchParams();
      if (inboxOpenIntent.datePreset) params.set('datePreset', inboxOpenIntent.datePreset);
      if (inboxOpenIntent.from) params.set('from', inboxOpenIntent.from);
      if (inboxOpenIntent.unreadOnly) params.set('unreadOnly', 'true');
      const suffix = params.toString();
      navigate(`/tasks/workspace/inbox${suffix ? `?${suffix}` : ''}`);
      return;
    }

    // Step 3 of flow: user provides IMAP credentials after provider detection fallback
    if (pendingImapConnection) {
      const flowConversationId = await ensureConversationForLocalFlow(trimmedMessage);
      if (flowConversationId) {
        await sendMessage(trimmedMessage, flowConversationId, [], { persist: false });
      }

      const kv = parseImapKeyValues(trimmedMessage);
      const password = kv.password || (trimmedMessage.includes('=') ? '' : trimmedMessage.trim());
      if (!password) {
        await postLocalAssistantMessage(
          flowConversationId,
          'I need an IMAP app password. Reply with `password=YOUR_APP_PASSWORD`.'
        );
        return;
      }

      const host = kv.host || pendingImapConnection.host;
      const port = Number(kv.port || pendingImapConnection.port || 993);
      const username = kv.username || kv.user || pendingImapConnection.username;
      const sslRaw = (kv.ssl || kv.tls || `${pendingImapConnection.useSSL}`).toLowerCase();
      const useSSL = !(sslRaw === 'false' || sslRaw === '0' || sslRaw === 'no');

      try {
        const token = getAccessToken();
        const response = await fetch('/api/oauth/imap/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            email: pendingImapConnection.email,
            providerHint: pendingImapConnection.provider,
            host,
            port,
            username,
            password,
            useSSL,
          }),
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(`IMAP connect failed (${response.status}): ${details}`);
        }

        setPendingImapConnection(null);
        await postLocalAssistantMessage(
          flowConversationId,
          `IMAP connected successfully for \`${pendingImapConnection.email}\`. Nexus can now access your email through this connector.`
        );
        window.dispatchEvent(new CustomEvent('nexus:integrations-updated'));
        toast({
          title: 'Email connected',
          description: `IMAP connection established for ${pendingImapConnection.email}.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect IMAP account';
        logger.error('Chat-triggered IMAP connect failed', { error: message });
        await postLocalAssistantMessage(
          flowConversationId,
          `IMAP connection failed. Please verify host/username/app-password and try again.\nError: ${message}`
        );
        toast({
          title: 'IMAP connection failed',
          description: message,
          variant: 'destructive',
        });
      }
      return;
    }

    // Step 2 of flow: user confirms or adjusts email after prompt
    if (pendingEmailConnection) {
      const flowConversationId = await ensureConversationForLocalFlow(trimmedMessage);
      if (flowConversationId) {
        await sendMessage(trimmedMessage, flowConversationId, [], { persist: false });
      }

      if (explicitEmail && explicitEmail.toLowerCase() !== pendingEmailConnection.email.toLowerCase()) {
        setPendingEmailConnection({ email: explicitEmail });
        await postLocalAssistantMessage(
          flowConversationId,
          `Got it. Use \`${explicitEmail}\` to connect your email? Reply **yes** to continue.`
        );
        return;
      }

      if (isAffirmative(normalizedMessage)) {
        const email = pendingEmailConnection.email;
        setPendingEmailConnection(null);
        await resolveEmailAndConnect(email, flowConversationId);
        return;
      }

      if (isNegative(normalizedMessage)) {
        setPendingEmailConnection(null);
        await postLocalAssistantMessage(
          flowConversationId,
          'Please share the email address you want to connect (example: `you@company.com`).'
        );
        return;
      }
    }

    if (CHAT_EMAIL_CONNECT_FLOW_ENABLED && wantsEmailConnection) {
      const flowConversationId = await ensureConversationForLocalFlow(trimmedMessage);
      if (flowConversationId) {
        await sendMessage(trimmedMessage, flowConversationId, [], { persist: false });
      }

      const candidateEmail = explicitEmail || currentUser.email || profile?.email || user?.email || '';
      if (!candidateEmail) {
        await postLocalAssistantMessage(
          flowConversationId,
          'Sure. Which email address should I connect? (example: `you@company.com`)'
        );
        return;
      }

      setPendingEmailConnection({ email: candidateEmail });
      await postLocalAssistantMessage(
        flowConversationId,
        `Sure. Are you referring to \`${candidateEmail}\` or a different email address? Reply **yes** to confirm, or send a different email.`
      );
      return;
    }

    if (asksIntegrationStatus) {
      const flowConversationId = await ensureConversationForLocalFlow(trimmedMessage);
      if (flowConversationId) {
        await sendMessage(trimmedMessage, flowConversationId, [], { persist: false });
      }
      try {
        const statusMessage = await getLiveIntegrationStatusMessage();
        await postLocalAssistantMessage(flowConversationId, statusMessage);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to read integration status';
        logger.error('Failed to fetch live integration status', { error: message });
        await postLocalAssistantMessage(
          flowConversationId,
          `I could not load live integration status right now. ${message}`
        );
      }
      return;
    }

    try {
      // Check if this is an explicit switching command to avoid creating dummy "New Chat" threads
      const lowerMessage = trimmedMessage.toLowerCase();
      const isExplicitSwitch = lowerMessage.startsWith('continue this:') || lowerMessage.startsWith('switch to:');

      // Create or get conversation
      let currentConversationId = conversationId;

      if (!currentConversationId && !isExplicitSwitch) {
        if (createConversation) {
          const title = trimmedMessage ? generateTitle(trimmedMessage) : generateAttachmentTitle(attachments);
          currentConversationId = await createConversation(title, 'gpt-4', undefined, user.id);
        } else {
          // Fallback if somehow not available (should not happen based on store check)
          throw new Error("Create conversation not available");
        }
      }

      let uploadedAttachments: FileAttachment[] = [];
      if (hasAttachments) {
        if (!currentConversationId) {
          throw new Error('Select or create a conversation before uploading files.');
        }

        const filesToUpload = attachments
          .map((attachment) => attachment.file)
          .filter((file): file is File => file instanceof File);

        if (filesToUpload.length !== attachments.length) {
          throw new Error('Some selected files are missing file data. Please re-attach and try again.');
        }

        uploadedAttachments = await chatAttachmentService.uploadAttachments({
          conversationId: currentConversationId,
          files: filesToUpload
        });
      }

      const messageContent = trimmedMessage || ATTACHMENT_ONLY_PLACEHOLDER;
      const runtimeAttachments = toRuntimeAttachments(uploadedAttachments);
      const aiMessage = `${messageContent}${buildAttachmentSummary(runtimeAttachments)}`;

      // save and display the user message via store (only if not a switch or inside an existing conversation)
      if (currentConversationId) {
        // We use persist: false because the backend /api/ai/chat already saves the user message for audit/metadata purposes
        await sendMessage(messageContent, currentConversationId, runtimeAttachments, { persist: false });
      }

      // Now set loading states for AI response
      setLocalIsLoading(true);
      setIsStreaming(true);
      setContextInjectedForStream(false);
      setStreamStatus({ stage: 'thinking', label: 'Agent is thinking', detail: 'Preparing response.' });

      // Use Conversational AI Service (Streaming)
      const orgId = profile?.company_id || 'default';

      const contextInit = await conversationalAIService.initializeContext(user.id, orgId);
      const aiContext = (contextInit.success && contextInit.data) ? contextInit.data : {
        userId: user.id,
        organizationId: orgId,
        businessContext: {}
      };

      let accumulatedResponse = '';
      let accumulatedReasoning = '';
      let generatedAttachmentsFromStream: GeneratedAttachment[] = [];
      setStreamingContent('');
      setThinkingContent('');

      // Get auth token from Zustand auth store
      const token = getAccessToken();

      await conversationalAIService.streamMessage(
        aiMessage,
        aiContext,
        (chunk) => {
          accumulatedResponse += chunk;
          setStreamingContent(accumulatedResponse);
        },
        token,
        storeMessages
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .slice(-20)
          .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        {
          conversationId: currentConversationId || undefined,
          agentId: requestedAgentId,
          attachments: runtimeAttachments
        },
        (metadata: StreamRuntimeMetadata) => {
          if (typeof metadata.contextInjected === 'boolean') {
            setContextInjectedForStream(metadata.contextInjected);
          }
          if (Array.isArray(metadata.generatedAttachments) && metadata.generatedAttachments.length > 0) {
            generatedAttachmentsFromStream = mergeGeneratedAttachments(
              generatedAttachmentsFromStream,
              metadata.generatedAttachments
            );
          }
          if (metadata.switchTarget && currentConversationId !== metadata.switchTarget) {
            logger.info('Switch intent detected, navigating to conversation', { target: metadata.switchTarget });
            setTimeout(() => {
              setCurrentConversationById(metadata.switchTarget!);
              toast({
                title: "Context Switched",
                description: "Switched to requested conversation.",
              });
            }, 1000); // Small delay to let user see "Switching..." message if any
          }
        },
        (status: StreamRuntimeStatus) => {
          setStreamStatus(status);
        },
        (thought: string) => {
          accumulatedReasoning += thought;
          setThinkingContent(prev => prev + thought);
        }
      );

      // Save final response
      if (saveAIResponse && currentConversationId) {
        const finalResponse = appendGeneratedAttachmentSummary(accumulatedResponse, generatedAttachmentsFromStream);
        const localAttachments = generatedAttachmentsFromStream.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          url: attachment.url,
          downloadUrl: attachment.downloadUrl
        }));
        // We use persist: false because the backend /api/ai/chat already saves the assistant message for audit/metadata purposes
        await saveAIResponse(finalResponse, currentConversationId, {
          persist: false,
          metadata: {
            reasoning: accumulatedReasoning || undefined,
            attachments: localAttachments.length ? localAttachments : undefined
          }
        });
      }

      setStreamingContent('');

      // Refresh conversations to update snippets/order
      await fetchConversations();
      await loadContextChips();

    } catch (error) {
      logger.error('Chat error', { error });
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLocalIsLoading(false);
      setIsStreaming(false);
      setStreamStatus(null);
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setLocalIsLoading(false);
    setStreamStatus(null);
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <Button
            onClick={() => {
              // we probably need a clearError action in store, or just re-fetch
              fetchConversations();
            }}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Chat Interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm">Loading chat...</p>
            </div>
          </div>
        }>
          <ModernChatInterface
            messages={
              isStreaming && streamingContent
                ? [
                  ...storeMessages,
                  {
                    id: 'streaming-msg',
                    conversation_id: conversationId || 'temp',
                    role: 'assistant',
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: { streaming: true, model: 'gpt-4' }
                  }
                ]
                : storeMessages
            }
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration} // Make sure this prop exists on ModernChatInterface
            isStreaming={isStreaming}
            disabled={localIsLoading || conversationsLoading}
            placeholder="Ask anything — general questions or ask about your business."
            showTypingIndicator={isStreaming}
            className="h-full"
            userName={currentUser.name}
            userEmail={currentUser.email}
            userAvatarUrl={currentUser.avatarUrl}
            agentId={requestedAgentId}
            agentName={selectedAgentName}
            ragEnabled={ragEnabled}
            ragConfidence={ragConfidence === 'high' ? 0.9 : ragConfidence === 'medium' ? 0.7 : 0.4} // Map string to number
            knowledgeTypes={knowledgeTypes}
            ragSources={ragSources}
            ragRecommendations={ragRecommendations}
            businessContext={businessContextData}
            suggestions={contextChips}
            streamStatus={streamStatus}
            thinkingContent={thinkingContent}
          />
        </React.Suspense>
      </div>
    </div>
  );
};

export default ChatPage;
