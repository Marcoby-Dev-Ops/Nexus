import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface FormProps
 * @description Props for the Form component.
 */
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * @name Form
 * @description A form component for grouping form elements with validation.
 * @param {FormProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Form component.
 */
export const Form: React.FC<FormProps> = React.memo(({ onSubmit, children, className = '', ...props }) => (
  <form
    className={`space-y-4 ${className}`}
    onSubmit={onSubmit}
    noValidate
    {...props}
  >
    {children}
  </form>
));

Form.displayName = 'Form';

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Form; 