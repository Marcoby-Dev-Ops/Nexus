import React, { useState, useEffect } from 'react';

interface OptimizedSignupFieldProps {
  type: 'text' | 'email' | 'tel' | 'select';
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  autoComplete?: string;
  disabled?: boolean;
  // New props for enhanced features
  helpText?: string;
  showHelp?: boolean;
  autoSuggestions?: string[];
  maxLength?: number;
  pattern?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal';
}

export function OptimizedSignupField({
  type,
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options = [],
  autoComplete,
  disabled = false,
  helpText,
  showHelp = false,
  autoSuggestions = [],
  maxLength,
  pattern,
  inputMode,
}: OptimizedSignupFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Show error only after user has interacted with the field
  const shouldShowError = hasInteracted && error;
  const showSuccess = hasInteracted && !error && value.length > 0;

  useEffect(() => {
    if (value.length > 0) {
      setHasInteracted(true);
    }
  }, [value]);

  // Auto-suggestions logic
  useEffect(() => {
    if (autoSuggestions.length > 0 && value.length > 0 && isFocused) {
      const filtered = autoSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, autoSuggestions, isFocused]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const getFieldClasses = () => {
    let baseClasses = "w-full px-4 py-3 border rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent backdrop-blur-sm transition-all duration-200";
    
    if (disabled) {
      baseClasses += " bg-white/10 border-white/20 opacity-50 cursor-not-allowed";
    } else if (shouldShowError) {
      baseClasses += " bg-white/20 border-red-500/50 focus:ring-red-500";
    } else if (showSuccess) {
      baseClasses += " bg-white/20 border-green-500/50 focus:ring-green-500";
    } else if (isFocused) {
      baseClasses += " bg-white/20 border-green-500/50 focus:ring-green-500";
    } else {
      baseClasses += " bg-white/20 border-white/30 focus:ring-green-500";
    }

    return baseClasses;
  };

  const renderField = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getFieldClasses()}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-describedby={`${name}-help ${name}-error`}
        >
          <option value="" className="bg-gray-800 text-white">
            {placeholder || `Select ${label.toLowerCase()}`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800 text-white">
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={getFieldClasses()}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        aria-describedby={`${name}-help ${name}-error`}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-green-200" htmlFor={name}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {maxLength && (
          <span className="text-xs text-gray-400 ml-2">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      
      <div className="relative">
        {renderField()}
        
        {/* Success/Error indicators */}
        {showSuccess && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {shouldShowError && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Auto-suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors duration-150"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Help text */}
      {showHelp && helpText && (
        <div id={`${name}-help`} className="flex items-start space-x-2 text-blue-300 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>{helpText}</span>
        </div>
      )}
      
      {/* Error message */}
      {shouldShowError && (
        <div id={`${name}-error`} className="flex items-center space-x-2 text-red-400 text-sm animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {showSuccess && (
        <div className="flex items-center space-x-2 text-green-400 text-sm animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Looks good!</span>
        </div>
      )}
    </div>
  );
}
