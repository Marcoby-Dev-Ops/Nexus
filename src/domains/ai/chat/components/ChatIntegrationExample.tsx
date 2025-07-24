import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QuickChatTrigger } from '@/domains/ai/chat';
import { StreamingComposer } from '@/domains/ai/components/StreamingComposer';

// Simple ChatPage component for the example
const ChatPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Full Chat Experience</h1>
      <StreamingComposer />
    </div>
  );
};

/**
 * Example Integration Component
 * Shows how to integrate both Quick Chat and Full Chat Page
 */
export const ChatIntegrationExample: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Navigation Example */}
        <nav className="border-b border-border p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Your App</h1>
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="text-foreground hover: text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/chat" 
                className="text-foreground hover:text-primary transition-colors"
              >
                Chat
              </Link>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>

        {/* Quick Chat Trigger (appears on all pages except /chat) */}
        <QuickChatTrigger 
          position="bottom-right"
          theme="vibrant"
          showBadge={true}
        />
      </div>
    </Router>
  );
};

/**
 * Example Home Page
 */
const HomePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to Your App
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Experience our two-tier AI chat system
        </p>
        
        <div className="grid md: grid-cols-2 gap-8 mt-12">
          {/* Quick Chat Feature */}
          <div className="p-6 border border-border rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Quick Chat</h2>
            <p className="text-muted-foreground mb-4">
              Fast, contextual AI assistance right from your current page. 
              Perfect for quick questions and immediate help.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Floating chat window</li>
              <li>• Context-aware responses</li>
              <li>• Quick action buttons</li>
              <li>• Seamless expansion to full chat</li>
            </ul>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">💡 Try it now!</p>
              <p className="text-sm text-muted-foreground">
                Click the floating chat button in the bottom-right corner
              </p>
            </div>
          </div>

          {/* Full Chat Feature */}
          <div className="p-6 border border-border rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Full Chat Experience</h2>
            <p className="text-muted-foreground mb-4">
              Comprehensive chat interface with conversation history, 
              advanced features, and persistent sessions.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Conversation management</li>
              <li>• Message history and search</li>
              <li>• File attachments and voice input</li>
              <li>• Export and sharing features</li>
            </ul>
            <Link
              to="/chat"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover: bg-primary/90 transition-colors"
            >
              Open Full Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-center p-4 font-semibold">Quick Chat</th>
                <th className="text-center p-4 font-semibold">Full Chat</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-4">Instant Access</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">➖</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4">Conversation History</td>
                <td className="p-4 text-center">Limited</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4">File Attachments</td>
                <td className="p-4 text-center">➖</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4">Voice Input</td>
                <td className="p-4 text-center">➖</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4">Export/Share</td>
                <td className="p-4 text-center">➖</td>
                <td className="p-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="p-4">Context Switching</td>
                <td className="p-4 text-center">✅</td>
                <td className="p-4 text-center">✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChatIntegrationExample; 