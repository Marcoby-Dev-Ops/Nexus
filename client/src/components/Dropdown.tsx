import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * @interface DropdownProps
 * @description Props for the Dropdown component.
 */
export interface DropdownProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * @name Dropdown
 * @description A dropdown menu component for actions and navigation.
 * @param {DropdownProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Dropdown component.
 */
export const Dropdown: React.FC<DropdownProps> = React.memo(({ label, children, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="inline-flex justify-center w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        {label}
        <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.25 3.85a.75.75 0 01-1.02 0l-4.25-3.85a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

Dropdown.propTypes = {
  label: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Dropdown; 