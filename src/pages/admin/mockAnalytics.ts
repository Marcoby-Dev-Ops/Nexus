export const analytics = {
  track: (event: string, data?: any) => {
    // In a real app, this would be a call to a real analytics service
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${event}`, data);
  },
}; 