import React from 'react';
import { Card } from '@/components/ui/Card';
import PropTypes from 'prop-types';

export interface QuickLaunchAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}

/**
 * @name QuickLaunchTiles
 * @description Displays a grid of quick-launch action tiles with consistent light styling.
 * @param {object} props
 * @param {QuickLaunchAction[]} props.actions - The actions to display as tiles.
 * @returns {JSX.Element}
 */
const QuickLaunchTiles: React.FC<{ actions: QuickLaunchAction[] }> = ({ actions }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="flex flex-col items-center p-6 rounded-lg bg-background border border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 group"
          aria-label={action.label}
          disabled={action.loading}
        >
          <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-200 mb-3">
            {action.icon && <span className="text-lg">{action.icon}</span>}
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};

QuickLaunchTiles.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
      loading: PropTypes.bool,
    })
  ).isRequired,
};

export default QuickLaunchTiles; 