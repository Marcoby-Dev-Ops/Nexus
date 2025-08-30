/**
 * Conversation Router Component
 * 
 * Demonstrates the business-aware ChatGPT concept by intelligently
 * routing conversations based on user context and conversation type.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { unifiedPlaybookService } from '@/services/playbook/UnifiedPlaybookService';
import { logger } from '@/shared/utils/logger';

interface ConversationContext {
  conversationType: 'update' | 'new_knowledge' | 'question' | 'onboarding';
  context: {
    activePlaybooks: any[];
    completedPlaybooks: any[];
    recommendedPlaybooks: any[];
    needsOnboarding: boolean;
  };
  suggestedActions: string[];
}

export const ConversationRouter: React.FC = () => {
  const { user } = useAuth();
  const [context, setContext] = useState<ConversationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMessage, setUserMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadBusinessContext();
    }
  }, [user]);

  const loadBusinessContext = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get initial business context
      const contextResponse = await playbookService.getBusinessContext(user.id);
      
      if (contextResponse.success && contextResponse.data) {
        // Classify the conversation based on context
        const classificationResponse = await playbookService.classifyConversation(
          user.id, 
          'Hello' // Default greeting
        );

        if (classificationResponse.success && classificationResponse.data) {
          setContext(classificationResponse.data);
        }
      }
    } catch (error) {
      logger.error('Error loading business context:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      setLoading(true);
      
      // Classify the conversation based on user message
      const classificationResponse = await playbookService.classifyConversation(user.id, message);
      
      if (classificationResponse.success && classificationResponse.data) {
        setContext(classificationResponse.data);
        setUserMessage(message);
      }
    } catch (error) {
      logger.error('Error classifying conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversationType = () => {
    if (!context) return null;

    switch (context.conversationType) {
      case 'onboarding':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-semibold mb-2">🎯 Onboarding Detected</h3>
            <p className="text-blue-700 mb-3">
              I can see you're new to Nexus! Let me help you get set up with your business profile.
            </p>
            <div className="space-y-2">
              {context.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => handleUserMessage(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        );

      case 'update':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">📈 Update Conversation</h3>
            <p className="text-green-700 mb-3">
              I see you have {context.context.activePlaybooks.length} active playbook{context.context.activePlaybooks.length !== 1 ? 's' : ''}. 
              Let's continue where you left off!
            </p>
            <div className="space-y-2">
              {context.context.activePlaybooks.map((playbook: any) => (
                <div key={playbook.id} className="bg-white p-3 rounded border">
                  <p className="font-medium">{playbook.playbook_name || 'Active Playbook'}</p>
                  <p className="text-sm text-gray-600">Progress: {playbook.progress_percentage || 0}%</p>
                </div>
              ))}
              {context.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                  onClick={() => handleUserMessage(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        );

      case 'new_knowledge':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-purple-800 font-semibold mb-2">🧠 New Knowledge Exploration</h3>
            <p className="text-purple-700 mb-3">
              Great! Let's explore new areas to improve your business. Here are some recommended playbooks:
            </p>
            <div className="space-y-2">
              {context.context.recommendedPlaybooks.slice(0, 3).map((playbook: any) => (
                <div key={playbook.id} className="bg-white p-3 rounded border">
                  <p className="font-medium">{playbook.name}</p>
                  <p className="text-sm text-gray-600">{playbook.description}</p>
                </div>
              ))}
              {context.suggestedActions.map((action, index) => (
                <button
                  key={index}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
                  onClick={() => handleUserMessage(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-gray-800 font-semibold mb-2">❓ General Question</h3>
            <p className="text-gray-700 mb-3">
              How can I help you today? I can assist with your business questions or guide you through playbooks.
            </p>
          </div>
        );
    }
  };

  const renderBusinessContext = () => {
    if (!context) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">📊 Your Business Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Active Playbooks</p>
            <p className="text-2xl font-bold text-blue-600">{context.context.activePlaybooks.length}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Completed</p>
            <p className="text-2xl font-bold text-green-600">{context.context.completedPlaybooks.length}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Recommended</p>
            <p className="text-2xl font-bold text-purple-600">{context.context.recommendedPlaybooks.length}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Business-Aware ChatGPT
        </h1>
        <p className="text-gray-600">
          I know your business context and can intelligently route our conversation.
        </p>
      </div>

      {renderBusinessContext()}
      {renderConversationType()}

      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">💬 Try these conversation starters:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleUserMessage("How's my progress?")}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm transition-colors"
          >
            How's my progress?
          </button>
          <button
            onClick={() => handleUserMessage("I want to start something new")}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm transition-colors"
          >
            I want to start something new
          </button>
          <button
            onClick={() => handleUserMessage("Update my business info")}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Update my business info
          </button>
          <button
            onClick={() => handleUserMessage("What should I work on next?")}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md text-sm transition-colors"
          >
            What should I work on next?
          </button>
        </div>
      </div>

      {userMessage && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Your message:</strong> "{userMessage}"
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Classified as:</strong> {context?.conversationType.replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  );
};
