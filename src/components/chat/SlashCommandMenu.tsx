import React from 'react';
import type { SlashCommand } from '@/lib/services/slashCommandService';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelectCommand: (command: SlashCommand) => void;
  onMouseEnter: (index: number) => void;
  loading?: boolean;
  query?: string;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onMouseEnter,
  loading = false,
  query = '',
}) => {
  return (
    <div
      className="absolute bottom-20 left-4 w-80 z-20 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
      role="listbox"
      aria-label="Slash command suggestions"
    >
      {loading ? (
        <div className="px-3 py-4 text-sm text-muted-foreground flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading commands...
        </div>
      ) : commands.length > 0 ? (
        <ul className="max-h-48 overflow-y-auto">
          {commands.map((cmd, idx) => (
            <li
              key={cmd.slug}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`px-3 py-2.5 text-sm cursor-pointer flex flex-col gap-1 hover:bg-accent transition-colors ${
                idx === selectedIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-popover text-popover-foreground'
              }`}
              onMouseEnter={() => onMouseEnter(idx)}
              onMouseDown={(e) => {
                // Prevent textarea blur
                e.preventDefault();
                onSelectCommand(cmd);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">/{cmd.slug}</span>
                {cmd.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {cmd.category}
                  </span>
                )}
              </div>
              {cmd.description && (
                <span className="text-xs opacity-80 leading-relaxed">
                  {cmd.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-3 py-3 text-sm text-muted-foreground">
          {query ? `No commands found for "${query}"` : 'No commands available'}
        </div>
      )}
    </div>
  );
};

export default SlashCommandMenu; 