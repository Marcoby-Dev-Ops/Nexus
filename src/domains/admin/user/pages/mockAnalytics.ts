export const analytics = {
  track: (event: string, data?: any) => {
    // In a real app, this would be a call to a real analytics service
    console.log(`[Analytics] ${event}`, data);
  },
}; 