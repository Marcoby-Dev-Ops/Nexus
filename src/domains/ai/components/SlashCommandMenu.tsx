import React from 'react';
import type { SlashCommand } from '@/domains/services/slashCommandService';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelectCommand: (cmd: SlashCommand) => void;
  onMouseEnter: (idx: number) => void;
  loading?: boolean;
  query?: string;
}

/**
 * SlashCommandMenu
 * Accessible, keyboard-navigable command suggestion menu for chat composer.
 */
const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onMouseEnter,
  loading = false,
  query = '',
}) => {
  return (
    <div
      aria-label="Slash command suggestions"
      className="absolute bottom-20 left-4 w-80 z-20 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
      role="listbox"
    >
      {loading ? (
        <div className="px-3 py-4 text-sm text-muted-foreground flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading commands...
        </div>
      ) : commands.length === 0 ? (
        <div className="px-3 py-3 text-sm text-muted-foreground">
          {query ? `No commands found for "${query}"` : 'No commands found'}
        </div>
      ) : (
        <ul className="max-h-48 overflow-y-auto">
          {commands.map((cmd, idx) => (
            <li
              key={cmd.slug}
              role="option"
              aria-selected={selectedIndex === idx}
              className={
                `px-3 py-2.5 text-sm cursor-pointer flex flex-col gap-1 hover:bg-accent transition-colors ` +
                (selectedIndex === idx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-popover text-popover-foreground')
              }
              onClick={() => onSelectCommand(cmd)}
              onMouseEnter={() => onMouseEnter(idx)}
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
                <span className="text-xs opacity-80 leading-relaxed">{cmd.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SlashCommandMenu; 