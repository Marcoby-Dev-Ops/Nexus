import React, { useState } from 'react';
import { Target, Lightbulb, Map, Play, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useFireCyclePhase } from './FireCycleProvider';
import { FireCycleOverlay } from './FireCycleOverlay';

interface FireCycleFloatingWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FireCycleFloatingWidget: React.FC<FireCycleFloatingWidgetProps> = ({
  position = 'bottom-right',
  className = ''
}) => {
  const { phase } = useFireCyclePhase();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default: return 'bottom-4 right-4';
    }
  };

  const getPhaseIcon = (phaseId: string) => {
    switch (phaseId) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return Map;
      case 'execute': return Play;
      default: return Target;
    }
  };

  const getPhaseLabel = (phaseId: string) => {
    switch (phaseId) {
      case 'focus': return 'Focus';
      case 'insight': return 'Insight';
      case 'roadmap': return 'Roadmap';
      case 'execute': return 'Execute';
      default: return 'Focus';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {isExpanded ? (
        <div className="bg-card border rounded-lg shadow-xl max-w-sm">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-foreground">FIRE Cycle</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover: bg-muted transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 rounded hover: bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <FireCycleOverlay variant="expanded" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-end space-y-2">
          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover: bg-primary/90 transition-colors"
              title="Open FIRE Cycle"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
          
          {/* Current Phase Indicator */}
          <div className="bg-card border rounded-lg shadow-lg p-3 min-w-[200px]">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                {React.createElement(getPhaseIcon(phase), { className: "w-4 h-4 text-primary" })}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {getPhaseLabel(phase)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Phase
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
