import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { navItems } from '@/shared/components/layout/navConfig';
import { features as featureRegistry } from '@/shared/components/ui/featureRegistry';
import { getSlashCommands, type SlashCommand } from '@/domains/ai/services/slashCommandService';
import Modal from '@/shared/components/ui/Modal';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { Search, Terminal, ArrowRight } from 'lucide-react';

type NavItem = import('./navConfig').NavItem;
interface FeatureItem {
  id: string;
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

// Type guard to differentiate command items from navigation items
const isCommand = (item: any): item is SlashCommand => {
  return 'slug' in item && typeof item.slug === 'string';
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const loadCommands = async () => {
        try {
          const slashCommands = await getSlashCommands();
          setCommands(slashCommands);
        } catch (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error("Failed to load slash commands: ", error);
          setCommands([]);
        }
      };
      loadCommands();
    }
  }, [open]);

  const navResults = [
    ...navItems.filter(item => item.name?.toLowerCase?.()?.includes(query.toLowerCase())),
    ...featureRegistry.filter(f => f.name?.toLowerCase?.()?.includes(query.toLowerCase())),
  ];

  const commandResults = commands.filter(c =>
    c.title?.toLowerCase?.()?.includes(query.toLowerCase()) ||
    c.slug?.toLowerCase?.()?.includes(query.toLowerCase())
  );

  const results: (NavItem | FeatureItem | SlashCommand)[] = [...navResults, ...commandResults];

  const handleSelect = (item: NavItem | FeatureItem | SlashCommand) => {
    if (isCommand(item)) {
      // Basic command execution - can be expanded
      // eslint-disable-next-line no-console
      console.log(`Executing command: /${item.slug}`);
      // You might want to pass this to a global command handler
    } else {
      navigate(item.path);
    }
    setQuery('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[searchIndex]) {
      e.preventDefault();
      handleSelect(results[searchIndex]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Command Palette">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSearchIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for pages, features, or commands..."
          aria-label="Search"
          className="pl-10"
        />
      </div>
      <ul role="listbox" aria-label="Search results" className="mt-4 max-h-[60vh] overflow-y-auto">
        {results.length === 0 && (
          <li className="p-4 text-center text-muted-foreground">No results found.</li>
        )}
        {results.map((item, i) => (
          <li
            key={isCommand(item) ? item.slug: item.path || `item-${i}`}
            role="option"
            aria-selected={i === searchIndex}
            className={`flex items-center justify-between px-4 py-3 rounded-md cursor-pointer ${
              i === searchIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
            onMouseEnter={() => setSearchIndex(i)}
            onClick={() => handleSelect(item)}
          >
            <div className="flex items-center">
              <span className="mr-3 text-muted-foreground">
                {isCommand(item) ? <Terminal className="w-4 h-4" /> : item.icon || <ArrowRight className="w-4 h-4" />}
              </span>
              <span>{isCommand(item) ? item.title: item.name || 'Unnamed Item'}</span>
            </div>
            <Badge variant="secondary">{isCommand(item) ? 'Command' : 'Navigate'}</Badge>
          </li>
        ))}
      </ul>
    </Modal>
  );
}; 