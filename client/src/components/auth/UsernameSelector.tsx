import React, { useState } from 'react';

interface UsernameSelectorProps {
  suggestions: string[];
  selectedUsername: string;
  isCheckingUsername: boolean;
  usernameError: string;
  onUsernameSelect: (username: string) => void;
  onCustomUsernameChange: (username: string) => void;
}

export const UsernameSelector: React.FC<UsernameSelectorProps> = ({
  suggestions,
  selectedUsername,
  isCheckingUsername,
  usernameError,
  onUsernameSelect,
  onCustomUsernameChange,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUsername, setCustomUsername] = useState('');

  const handleCustomUsernameChange = (value: string) => {
    setCustomUsername(value);
    onCustomUsernameChange(value);
  };

  const handleSuggestionClick = (username: string) => {
    onUsernameSelect(username);
    setShowCustomInput(false);
    setCustomUsername('');
  };

  const handleCustomSubmit = () => {
    if (customUsername.trim()) {
      onUsernameSelect(customUsername.trim());
      setShowCustomInput(false);
      setCustomUsername('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Choose Your Username
        </label>
        <p className="text-sm text-gray-400 mb-4">
          This will be your login username. Choose something memorable and professional.
        </p>
      </div>

      {/* Username Suggestions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Suggested Usernames</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`p-3 text-left rounded-lg border transition-all duration-200 ${
                selectedUsername === suggestion
                  ? 'border-green-500 bg-green-500/10 text-green-200'
                  : 'border-gray-600 bg-gray-800/50 text-gray-200 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            >
              <div className="font-medium">{suggestion}</div>
              <div className="text-xs text-gray-400">
                {selectedUsername === suggestion && (
                  <span className="text-green-400">✓ Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Username Option */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">Custom Username</h4>
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showCustomInput ? 'Cancel' : 'Choose Custom'}
          </button>
        </div>

        {showCustomInput && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={customUsername}
                onChange={(e) => handleCustomUsernameChange(e.target.value)}
                placeholder="Enter custom username"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCustomSubmit}
                disabled={!customUsername.trim() || isCheckingUsername}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Use Custom Username
              </button>
            </div>

            <div className="text-xs text-gray-400">
              <p>• 3-20 characters long</p>
              <p>• Letters, numbers, underscores, and hyphens only</p>
              <p>• Must be unique</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {usernameError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{usernameError}</p>
        </div>
      )}

      {/* Selected Username Display */}
      {selectedUsername && !usernameError && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Selected Username</p>
              <p className="text-green-300">{selectedUsername}</p>
            </div>
            <div className="text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
