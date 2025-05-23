import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * @interface Tab
 * @description Tab item for the Tabs component.
 */
export interface Tab {
  label: string;
  content: React.ReactNode;
}

/**
 * @interface TabsProps
 * @description Props for the Tabs component.
 */
export interface TabsProps {
  tabs: Tab[];
  className?: string;
}

/**
 * @name Tabs
 * @description A tabs component for organizing content.
 * @param {TabsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Tabs component.
 */
export const Tabs: React.FC<TabsProps> = React.memo(({ tabs, className = '' }) => {
  const [active, setActive] = useState(0);
  return (
    <div className={className}>
      <div className="flex border-b border-border mb-2">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors ${active === idx ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActive(idx)}
            aria-selected={active === idx}
            role="tab"
            tabIndex={active === idx ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[active].content}</div>
    </div>
  );
});

Tabs.displayName = 'Tabs';

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default Tabs; 