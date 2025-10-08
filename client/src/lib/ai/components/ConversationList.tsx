import React, { useEffect, useState } from 'react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string;
  className?: string;
}

export default function ConversationList({ 
  onSelectConversation, 
  currentConversationId,
  className 
}: ConversationListProps) {
  const { user } = useAuth();
  const { 
    conversations, 
    fetchConversations, 
    createConversation, 
    archiveConversation,
    isLoading 
  } = useAIChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewConversation = async () => {
    try {
      const conversationId = await createConversation(
        'New Conversation', 
        'gpt-4',
        undefined,
        user?.id
      );
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    await archiveConversation(conversationId);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button 
            onClick={handleNewConversation}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No conversations yet</p>
            <Button 
              onClick={handleNewConversation}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations
              .filter(conv => !conv.is_archived)
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .map((conversation) => (
                <Card 
                  key={conversation.id}
                  className={`cursor-pointer transition-colors ${
                    currentConversationId === conversation.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.message_count} messages
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id);
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
