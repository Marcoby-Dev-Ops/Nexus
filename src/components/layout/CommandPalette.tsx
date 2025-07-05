import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navItems } from './navConfig';
import { features as featureRegistry } from '@/lib/ui/featureRegistry';
import { getSlashCommands, type SlashCommand } from '@/lib/services/slashCommandService';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Bot, Code, Terminal } from 'lucide-react';

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

// Type guard to check if an item is a NavItem or FeatureItem
const isNavOrFeature = (item: any): item is NavItem | FeatureItem => {
  return 'path' in item;
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const loadCommands = async () => {
        const slashCommands = await getSlashCommands();
        setCommands(slashCommands);
      };
      loadCommands();
    }
  }, [open]);

  const navResults: (NavItem | FeatureItem)[] = [
    ...navItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),
    ...featureRegistry.filter(f => f.name.toLowerCase().includes(query.toLowerCase())),
  ];

  const commandResults = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.slug.toLowerCase().includes(query.toLowerCase())
  );
  
  const results: (NavItem | FeatureItem | SlashCommand)[] = [...navResults, ...commandResults];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter' && results[searchIndex]) {
      const result = results[searchIndex];
      if (isNavOrFeature(result)) {
        window.location.href = result.path;
      } else {
        console.log('Executing command:', result);
      }
      onClose();
      setQuery('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Command Palette">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSearchIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search for pages, features, or commands..."
          aria-label="Search"
          className="pl-10"
        />
      </div>
      <ul role="listbox" aria-label="Search results" className="mt-4 max-h-80 overflow-y-auto">
        {results.length === 0 && <li className="p-4 text-center text-muted-foreground">No results found.</li>}
        {results.map((item, i) => (
          <li
            key={isNavOrFeature(item) ? item.path : item.slug}
            role="option"
            aria-selected={i === searchIndex}
            className={`flex items-center justify-between px-4 py-3 rounded-md cursor-pointer ${i === searchIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            onMouseEnter={() => setSearchIndex(i)}
            onClick={() => {
              if (isNavOrFeature(item)) {
                window.location.href = item.path;
              } else {
                console.log('Executing command:', item);
              }
              onClose();
              setQuery('');
            }}
          >
            <div className="flex items-center">
              <span className="mr-3 text-muted-foreground">
                {isNavOrFeature(item) && item.icon ? item.icon : <Terminal className="w-4 h-4" />}
              </span>
              <span>{isNavOrFeature(item) ? item.name : item.title}</span>
            </div>
            <Badge variant="secondary">{isNavOrFeature(item) ? 'Navigate' : 'Command'}</Badge>
          </li>
        ))}
      </ul>
    </Modal>
  );
}; 