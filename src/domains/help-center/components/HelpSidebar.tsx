import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Shield, BookOpen, Info } from 'lucide-react';

interface HelpTreeItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  children?: HelpTreeItem[];
}

const helpTree: HelpTreeItem[] = [
  {
    label: 'User Guide',
    path: '/help/user-guide',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    label: 'Privacy & Compliance',
    icon: <Shield className="w-4 h-4" />,
    children: [
      {
        label: 'Privacy Policy',
        path: '/help/privacy-policy',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: 'Data Usage Policy',
        path: '/help/data-usage',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: 'Security & Compliance',
        path: '/help/security-compliance',
        icon: <Shield className="w-4 h-4" />,
      },
    ],
  },
  {
    label: 'About Nexus',
    path: '/help/about',
    icon: <Info className="w-4 h-4" />,
  },
];

const HelpTreeItemComponent: React.FC<{ item: HelpTreeItem; depth?: number }> = ({ item, depth = 0 }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className={`pl-${depth * 4} mb-1`}>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            className="mr-1 focus:outline-none"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 h-4 mr-1" />
        )}
        {item.path ? (
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-2 text-sm py-1 px-2 rounded transition-colors ${
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ) : (
          <span className="flex items-center space-x-2 text-sm py-1 px-2">
            {item.icon}
            <span>{item.label}</span>
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div className="ml-4 border-l border-muted-foreground/20 pl-2">
          {item.children!.map((child) => (
            <HelpTreeItemComponent key={child.label} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HelpSidebar: React.FC = () => {
  return (
    <aside className="w-72 bg-background border-r border-border p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Help & Documentation</h2>
      <nav>
        {helpTree.map((item) => (
          <HelpTreeItemComponent key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
}; 