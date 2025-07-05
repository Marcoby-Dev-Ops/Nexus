import { useEffect, useState } from 'react';
import { supabase } from '@/lib/core/supabase';
import type { ActionCardRecord } from '@/components/ai/ActionCard';

export function useActionCards(conversationId?: string) {
  const [cards, setCards] = useState<ActionCardRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!conversationId) return;

    let ignore = false;
    const fetchCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_action_cards')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at');
      if (!ignore && !error) {
        setCards(data || []);
      }
      setLoading(false);
    };

    fetchCards();

    const channel = supabase.channel(`cards_${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_action_cards', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            setCards(prev => [...prev, payload.new as any]);
          } else if (payload.eventType === 'UPDATE') {
            setCards(prev => prev.map(c => (c.id === payload.new.id ? (payload.new as any) : c)));
          } else if (payload.eventType === 'DELETE') {
            setCards(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { cards, loading };
} 