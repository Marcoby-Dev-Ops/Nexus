import React from 'react';
import { MessageCircle } from 'lucide-react';

// You can replace this with your actual chat trigger logic or modal
export const QuickChatTrigger: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        aria-label="Open AI Chat"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
        onClick={() => setOpen(true)}
        type="button"
      >
        <MessageCircle size={28} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-lg w-full relative">
            <button
              aria-label="Close AI Chat"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-2">AI Assistant</h2>
            <div className="text-gray-700 dark:text-gray-200 mb-4">
              {/* Placeholder for chat UI */}
              <p>How can I help you today?</p>
            </div>
            {/* Add your chat input and message list here */}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickChatTrigger; 