import React from 'react';
import PropTypes from 'prop-types';

/**
 * @interface ModalProps
 * @description Props for the Modal component.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * @name Modal
 * @description A modal dialog component for overlays and confirmations.
 * @param {ModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered Modal component or null if closed.
 */
export const Modal: React.FC<ModalProps> = React.memo(({ open, onClose, title, children, className = '' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`bg-popover text-popover-foreground rounded-lg shadow-lg p-6 w-full max-w-md ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {title && <h2 id="modal-title" className="text-lg font-semibold mb-4">{title}</h2>}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Modal; 