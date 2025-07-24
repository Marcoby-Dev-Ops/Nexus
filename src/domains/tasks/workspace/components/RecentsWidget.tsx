import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

interface Pin {
  id: string;
  title: string;
  description?: string;
  url?: string;
  created_at: string;
}

interface RecentsWidgetProps {
  className?: string;
}

export const RecentsWidget: React.FC<RecentsWidgetProps> = ({ className }) => {
  const { user } = useAuth();
  const queryWrapper = new DatabaseQueryWrapper();
  
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pins with proper authentication
  const loadPins = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase.from('Pin').select('*').order('created_at', { ascending: false }).limit(10),
        user.id,
        'load-pins'
      );

      if (error) {
        logger.error('Error loading pins:', error);
        setError('Failed to load pins');
      } else {
        setPins(data || []);
      }
    } catch (error) {
      logger.error('Error in loadPins:', error);
      setError('Failed to load pins');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove pin with proper authentication
  const removePin = async (pinId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase.from('Pin').delete().eq('id', pinId),
        user.id,
        'remove-pin'
      );

      if (error) {
        logger.error('Error removing pin:', error);
        setError('Failed to remove pin');
      } else {
        setPins(prev => prev.filter(pin => pin.id !== pinId));
      }
    } catch (error) {
      logger.error('Error in removePin:', error);
      setError('Failed to remove pin');
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPins();
    }
  }, [user?.id]);

  if (isLoading) {
    return <div className={className}>Loading pins...</div>;
  }

  if (error) {
    return <div className={className}>Error: {error}</div>;
  }

  return (
    <div className={className}>
      <h3>Recent Pins</h3>
      {pins.length === 0 ? (
        <p>No recent pins</p>
      ) : (
        <ul>
          {pins.map(pin => (
            <li key={pin.id}>
              <div>
                <h4>{pin.title}</h4>
                {pin.description && <p>{pin.description}</p>}
                {pin.url && <a href={pin.url} target="_blank" rel="noopener noreferrer">View</a>}
                <button onClick={() => removePin(pin.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 