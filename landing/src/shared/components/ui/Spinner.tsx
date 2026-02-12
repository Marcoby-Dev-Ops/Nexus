import React from 'react';

export interface SpinnerProps {
    size?: number;
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = React.memo(({ size = 24, className = '' }) => (
    <svg
        className={`animate-spin text-primary ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="status"
        aria-label="Loading"
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
));

Spinner.displayName = 'Spinner';
export default Spinner;
