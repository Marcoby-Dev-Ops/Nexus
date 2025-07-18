import React from 'react';
import { X } from 'lucide-react';

export type SourceMeta = {
  id: string;
  type: string;
  label: string;
  confidence?: number;
  accessLevel?: string;
  verified?: boolean;
  description?: string;
  contentPreview?: string;
  [key: string]: any;
};

export interface SourceDrawerProps {
  open: boolean;
  source: SourceMeta | null;
  onClose: () => void;
}

const SourceDrawer: React.FC<SourceDrawerProps> = ({ open, source, onClose }) => {
  if (!open || !source) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-xl p-6 relative overflow-y-auto">
        <button
          aria-label="Close source details"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          Source Details
          {source.verified && <span className="ml-2 text-emerald-600">Verified</span>}
        </h2>
        <div className="mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">Type: {source.type}</div>
          <div className="text-sm text-gray-500 dark:text-gray-300">Label: {source.label}</div>
          {typeof source.confidence === 'number' && (
            <div className="text-sm text-gray-500 dark:text-gray-300">Confidence: {(source.confidence * 100).toFixed(0)}%</div>
          )}
          {source.accessLevel && (
            <div className="text-sm text-gray-500 dark:text-gray-300">Access: {source.accessLevel}</div>
          )}
        </div>
        {source.description && (
          <div className="mb-2 text-gray-700 dark:text-gray-200">
            <strong>Description:</strong> {source.description}
          </div>
        )}
        {source.contentPreview && (
          <div className="mb-2 text-gray-700 dark:text-gray-200">
            <strong>Preview:</strong> <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">{source.contentPreview}</pre>
          </div>
        )}
        {/* Add more metadata fields as needed */}
      </div>
    </div>
  );
};

export default SourceDrawer; 