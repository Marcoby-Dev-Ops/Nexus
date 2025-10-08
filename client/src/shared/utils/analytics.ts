// Lightweight analytics wrapper for client-side custom events
export function trackEvent(name: string, detail: Record<string, any> = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  } catch (e) {
    // swallow - analytics should not break UI
    // eslint-disable-next-line no-console
    console.debug('trackEvent failed', name, e);
  }
}

export default trackEvent;
