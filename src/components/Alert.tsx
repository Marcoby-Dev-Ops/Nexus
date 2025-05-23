import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface AlertProps
 * @description Props for the Alert component.
 */
export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  message: string;
  className?: string;
}

/**
 * @name Alert
 * @description A notification component for feedback messages.
 * @param {AlertProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Alert component.
 */
export const Alert: React.FC<AlertProps> = React.memo(({ type = 'info', message, className = '' }) => {
  const base = 'rounded-md p-4 flex items-center gap-2';
  const variants = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  return (
    <div className={`${base} ${variants[type]} ${className}`} role="alert">
      {type === 'info' && <span aria-label="Info">ℹ️</span>}
      {type === 'success' && <span aria-label="Success">✅</span>}
      {type === 'warning' && <span aria-label="Warning">⚠️</span>}
      {type === 'error' && <span aria-label="Error">❌</span>}
      <span>{message}</span>
    </div>
  );
});

Alert.displayName = 'Alert';

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  message: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Alert; 