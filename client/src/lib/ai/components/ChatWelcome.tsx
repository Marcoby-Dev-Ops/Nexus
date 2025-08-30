import React from 'react';
import { Sparkles } from 'lucide-react';

interface ChatWelcomeProps {
  userName: string;
}

export default function ChatWelcome({ userName }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-gray-300" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-100">
        Good to see you, {userName}
      </h1>
      <p className="text-gray-400 max-w-md">
        I'm here to help you with your business intelligence needs. What would you like to explore today?
      </p>
    </div>
  );
}
