import React, { useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** preset modal size: sm | md | lg | xl | full */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  title?: string;
}

/**
 * Simple modal component for 1.0
 */
const Modal: React.FC<ModalProps> = ({ open, onClose, children, className, title, size }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = (() => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-2xl';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      case 'full':
        return 'w-full h-full max-w-full';
      default:
        return 'max-w-4xl';
    }
  })();

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4">
      <div
        className={cn(
          'bg-popover text-popover-foreground rounded-lg shadow-lg p-6 w-full',
          sizeClass,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover: text-foreground"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && <h2 id="modal-title" className="text-lg font-semibold mb-4">{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal; 
