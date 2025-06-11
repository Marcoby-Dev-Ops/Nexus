import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-10 w-10">
          <div className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-t-brand-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute top-1 left-1 h-8 w-8 rounded-full border-4 border-t-transparent border-r-brand-primary/70 border-b-transparent border-l-transparent animate-spin animation-delay-150"></div>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}; 