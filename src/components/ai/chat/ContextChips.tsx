import React from 'react';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { X } from 'lucide-react';

interface ContextChip {
  id: string;
  label: string;
  type: 'user' | 'system' | 'data' | 'integration';
  removable?: boolean;
}

interface ContextChipsProps {
  chips: ContextChip[];
  onRemove?: (chipId: string) => void;
  className?: string;
}

export const ContextChips: React.FC<ContextChipsProps> = ({
  chips,
  onRemove,
  className = ''
}) => {
  const getChipVariant = (type: ContextChip['type']) => {
    switch (type) {
      case 'user':
        return 'default';
      case 'system':
        return 'secondary';
      case 'data':
        return 'outline';
      case 'integration':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant={getChipVariant(chip.type)}
          className="flex items-center space-x-1"
        >
          <span>{chip.label}</span>
          {chip.removable && onRemove && (
            <button
              onClick={() => onRemove(chip.id)}
              className="ml-1 hover:bg-background/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}; 