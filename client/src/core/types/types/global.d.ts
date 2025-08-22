declare global {
  interface Window {
    process: {
      env: {
        NODEENV: 'development' | 'production' | 'test';
      };
    };
  }
} 