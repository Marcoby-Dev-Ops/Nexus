import React from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import PropTypes from 'prop-types';

export interface QuickLaunchAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}

/**
 * @name QuickLaunchTiles
 * @description Displays a grid of quick-launch action tiles.
 * @param {object} props
 * @param {QuickLaunchAction[]} props.actions - The actions to display as tiles.
 * @returns {JSX.Element}
 */
const QuickLaunchTiles: React.FC<{ actions: QuickLaunchAction[] }> = ({ actions }) => (
  <Card header="Quick Launch">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Button
          key={action.label}
          onClick={action.onClick}
          variant="primary"
          className="flex flex-row items-center justify-center gap-2 h-12 w-full rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition"
          aria-label={action.label}
          loading={action.loading}
        >
          {action.icon && <span className="text-xl mr-2">{action.icon}</span>}
          <span className="font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  </Card>
);

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