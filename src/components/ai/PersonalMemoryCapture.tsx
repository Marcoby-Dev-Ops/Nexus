import React, { useState } from 'react';
import { Brain, Lightbulb, Target, BookOpen, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { thoughtsService } from '@/lib/services/thoughtsService';

/**
 * PersonalMemoryCapture
 * 
 * Allows users to capture personal thoughts, insights, and goals
 * within their business context for long-term memory and AI reference
 */

interface PersonalThought {
  content: string;
  category: 'idea' | 'learning' | 'reflection' | 'goal';
  tags: string[];
  businessContext?: {
    department?: string;
    project?: string;
    relatedTo?: string;
  };
}

interface PersonalMemoryCaptureProps {
  currentContext?: {
    department?: string;
    page?: string;
    conversationTopic?: string;
  };
  onThoughtSaved?: (thought: PersonalThought) => void;
}

export const PersonalMemoryCapture: React.FC<PersonalMemoryCaptureProps> = ({
  currentContext,
  onThoughtSaved
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PersonalThought['category']>('idea');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const categories = [
    { value: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-warning/10 text-warning-foreground' },
    { value: 'learning', label: 'Learning', icon: BookOpen, color: 'bg-primary/10 text-primary' },
    { value: 'reflection', label: 'Reflection', icon: Brain, color: 'bg-accent/10 text-accent-foreground' },
    { value: 'goal', label: 'Goal', icon: Target, color: 'bg-success/10 text-success' }
  ];

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      // ---- Map capture category to thoughts table schema ----
      const categoryMap: Record<string, 'idea' | 'task' | 'update' | 'reminder'> = {
        idea: 'idea',
        learning: 'update',
        reflection: 'update',
        goal: 'task',
      };

      const createReq = {
        content: content.trim(),
        category: categoryMap[category],
        status: 'concept' as const,
        main_sub_categories: tags.split(',').map(t => t.trim()).filter(Boolean),
        personal_or_professional: 'personal' as const,
        interaction_method: 'text' as const,
        // Put department/page context into impact field for now (future structured)
        impact: currentContext?.department ? `Dept:${currentContext.department}` : undefined,
      };

      const inserted = await thoughtsService.createThought(createReq);

      // Reset form
      setContent('');
      setTags('');
      setIsOpen(false);
      
      const savedThought: PersonalThought = {
        content: createReq.content,
        category,
        tags: createReq.main_sub_categories ?? [],
        businessContext: currentContext,
      };
      onThoughtSaved?.(savedThought);
      
      console.log('Personal thought saved with business context:', currentContext);

      // Fire-and-forget embedding creation (no await to keep UI snappy)
      if (inserted?.id) {
        // Fire embedding
        supabase.functions.invoke('ai_embed_thought', {
          body: {
            thoughtId: inserted.id,
            content: inserted.content,
          },
        }).catch((err) => {
          console.error('Failed to invoke ai_embed_thought:', err);
        });

        // Trigger suggestion generation (integration-aware)
        supabase.functions.invoke('ai_generate_thought_suggestions', {
          body: { thoughtId: inserted.id },
        }).catch((err) => {
          console.error('Failed to invoke ai_generate_thought_suggestions:', err);
        });
      }
    } catch (error) {
      console.error('Failed to save personal thought:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg border text-foreground transition-all"
      >
        <Brain className="w-4 h-4" />
        <span>Capture Thought</span>
      </button>
    );
  }

  return (
    <div className="bg-muted/50 rounded-xl p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Capture Personal Thought</h3>
        {currentContext?.department && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {currentContext.department}
          </span>
        )}
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {categories.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setCategory(value as PersonalThought['category'])}
            className={`flex flex-col items-center gap-1 p-4 rounded-lg text-xs transition-all ${
              category === value
                ? color
                : 'bg-card hover:bg-background text-muted-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content Input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`What's on your mind? This will be remembered and connected to your ${currentContext?.department || 'work'} context...`}
        className="w-full p-2 border bg-background border-border rounded-lg resize-none text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        rows={3}
        autoFocus
      />

      {/* Tags Input */}
      <div className="flex items-center gap-2 mt-2 mb-4">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="flex-1 p-2 border bg-background border-border rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Context Display */}
      {currentContext && (
        <div className="mb-3 p-4 bg-card rounded border">
          <p className="text-xs text-muted-foreground mb-1">Business Context:</p>
          <div className="flex flex-wrap gap-1">
            {currentContext.department && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {currentContext.department}
              </span>
            )}
            {currentContext.page && (
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                {currentContext.page}
              </span>
            )}
            {currentContext.conversationTopic && (
                                    <span className="text-xs bg-warning/10 text-warning-foreground px-2 py-1 rounded">
                Topic: {currentContext.conversationTopic}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim() || loading}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Thought'}
        </button>
      </div>
    </div>
  );
}; 