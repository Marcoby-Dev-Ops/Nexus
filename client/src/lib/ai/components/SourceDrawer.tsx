import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/shared/components/ui/Dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export interface SourceMeta {
  title?: string;
  url?: string;
  content: string;
}

interface Props {
  open: boolean;
  source: SourceMeta | null;
  onClose: () => void;
}

const SourceDrawer: React.FC<Props> = ({ open, source, onClose }) => (
  <Dialog open={open} onOpenChange={(state) => { if (!state) onClose(); }}>
    <DialogOverlay className="bg-black/40" />
    <DialogContent
      className="fixed right-0 top-0 h-screen w-full max-w-md bg-background shadow-lg outline-none flex flex-col p-6 z-drawer data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-right-1/2"
    >
      {source && (
        <div className="flex-1 overflow-y-auto">
          {source.title && <h3 className="text-lg font-semibold mb-2">{source.title}</h3>}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            className="prose prose-sm dark: prose-invert max-w-none"
          >
            {source.content}
          </ReactMarkdown>
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex mt-4 text-primary underline">
              Open Source ↗
            </a>
          )}
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default SourceDrawer; 
