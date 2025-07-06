declare global {
  interface Window {
    process: {
      env: {
        NODE_ENV: 'development' | 'production' | 'test';
      };
    };
  }
} 