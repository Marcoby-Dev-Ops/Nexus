import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { selectWithOptions, deleteOne } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

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
  
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load pins with proper authentication
  const loadPins = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await selectWithOptions<Pin>('Pin', {
        orderBy: { column: 'created_at', ascending: false },
        limit: 10
      });
      setPins(data || []);
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
      await deleteOne('Pin', pinId);
      setPins(prev => prev.filter(pin => pin.id !== pinId));
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