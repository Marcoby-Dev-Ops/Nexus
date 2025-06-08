import React, { useState } from 'react';
import { Brain, Lightbulb, Target, BookOpen, Tag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PersonalThought['category']>('idea');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const categories = [
    { value: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-amber-100 text-amber-800' },
    { value: 'learning', label: 'Learning', icon: BookOpen, color: 'bg-primary/10 text-primary' },
    { value: 'reflection', label: 'Reflection', icon: Brain, color: 'bg-secondary/10 text-purple-800' },
    { value: 'goal', label: 'Goal', icon: Target, color: 'bg-success/10 text-success' }
  ];

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const thoughtData = {
        user_id: user.id,
        content: content.trim(),
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        business_context: currentContext,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('personal_thoughts')
        .insert([thoughtData]);

      if (error) throw error;

      // Reset form
      setContent('');
      setTags('');
      setIsOpen(false);
      
      onThoughtSaved?.(thoughtData as PersonalThought);
      
      console.log('Personal thought saved with business context:', currentContext);
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
        className="flex items-center gap-2 px-4 py-4 text-sm bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-lg border border-purple-200 text-purple-700 transition-all"
      >
        <Brain className="w-4 h-4" />
        <span>Capture Thought</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-secondary" />
        <h3 className="text-sm font-semibold text-purple-800">Capture Personal Thought</h3>
        {currentContext?.department && (
          <span className="text-xs bg-secondary/10 text-purple-700 px-4 py-4 rounded-full">
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
        className="w-full p-4 border border-border rounded-lg resize-none text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        rows={3}
      />

      {/* Tags Input */}
      <div className="flex items-center gap-2 mt-2 mb-4">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="flex-1 p-4 border border-border rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Context Display */}
      {currentContext && (
        <div className="mb-3 p-4 bg-card rounded border">
          <p className="text-xs text-muted-foreground mb-1">Business Context:</p>
          <div className="flex flex-wrap gap-1">
            {currentContext.department && (
              <span className="text-xs bg-primary/10 text-primary px-4 py-4 rounded">
                {currentContext.department}
              </span>
            )}
            {currentContext.page && (
              <span className="text-xs bg-success/10 text-success px-4 py-4 rounded">
                {currentContext.page}
              </span>
            )}
            {currentContext.conversationTopic && (
              <span className="text-xs bg-amber-100 text-amber-700 px-4 py-4 rounded">
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
          className="px-4 py-4 bg-secondary text-primary-foreground text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Thought'}
        </button>
      </div>
    </div>
  );
}; 