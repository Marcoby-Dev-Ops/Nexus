import React from 'react';
import PropTypes from 'prop-types';

/**
 * @name SidebarIcon
 * @description Wrapper for sidebar nav icons for consistent sizing/alignment.
 * @param {object} props
 * @param {React.ReactNode} props.children - Icon element.
 * @param {string} [props.className] - Additional class names.
 */
interface SidebarIconProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ children, className }) => (
  <span className={`inline-flex items-center justify-center w-5 h-5 ${className ?? ''}`}>{children}</span>
);

SidebarIcon.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default SidebarIcon; 