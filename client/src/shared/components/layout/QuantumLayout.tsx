import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Target, Users, Zap, Brain, DollarSign, Building2, Activity } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import type { QuantumBlockId } from '@/core/types/quantum';

export const QUANTUM_LABELS: Record<QuantumBlockId, string> = {
  'value-proposition': 'Value Proposition',
  'customer-segments': 'Customer Segments', 
  'channels': 'Channels',
  'customer-relationships': 'Customer Relationships',
  'revenue-streams': 'Revenue Streams',
  'key-resources': 'Key Resources',
  'key-activities': 'Key Activities'
};

export const QUANTUM_ICONS: Record<QuantumBlockId, React.ComponentType<{ className?: string }>> = {
  'value-proposition': Target,
  'customer-segments': Users,
  'channels': Zap,
  'customer-relationships': Brain,
  'revenue-streams': DollarSign,
  'key-resources': Building2,
  'key-activities': Activity
};

interface QuantumLayoutProps {
  children: React.ReactNode;
}

export const QuantumLayout: React.FC<QuantumLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { blockId } = useParams<{ blockId: string }>();

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Home', href: '/home', icon: Home }
    ];

    if (location.pathname.includes('/quantum')) {
      breadcrumbs.push({ label: 'Quantum Business Model', href: '/home', icon: Target });
    }

    if (blockId && QUANTUM_LABELS[blockId as QuantumBlockId]) {
      breadcrumbs.push({ 
        label: QUANTUM_LABELS[blockId as QuantumBlockId], 
        href: `/quantum/blocks/${blockId}`,
        icon: QUANTUM_ICONS[blockId as QuantumBlockId]
      });
    }

    if (location.pathname.includes('/strengthen')) {
      breadcrumbs.push({ label: 'Strengthen', href: location.pathname });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => {
              const Icon = crumb.icon;
              const isLast = index === breadcrumbs.length - 1;
              
              return (
                <React.Fragment key={crumb.href}>
                  <Button
                    variant={isLast ? "ghost" : "ghost"}
                    size="sm"
                    className={`h-auto p-1 ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => !isLast && navigate(crumb.href)}
                    disabled={isLast}
                  >
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {crumb.label}
                  </Button>
                  {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
