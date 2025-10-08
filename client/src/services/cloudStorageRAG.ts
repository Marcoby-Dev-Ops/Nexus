// Lightweight shim for cloud storage RAG sync functionality.
// This file provides a minimal client-side service the UI can call.
// The real sync work should be performed server-side; this calls a server
// endpoint if one exists, and falls back to a safe default result.

export type CloudStorageSyncResult = {
  totalProcessed: number;
  totalErrors: string[];
};

export const cloudStorageRAGService = {
  async syncAllProviders(): Promise<CloudStorageSyncResult> {
    // Prefer calling a server-side endpoint which performs the long-running sync.
    try {
      const resp = await fetch('/api/rag/sync-cloud-storage', { method: 'POST' });
      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText || 'Request failed');
        return { totalProcessed: 0, totalErrors: [text] };
      }

      const payload = await resp.json().catch(() => ({}));
      return {
        totalProcessed: typeof payload.totalProcessed === 'number' ? payload.totalProcessed : (payload.processed || 0),
        totalErrors: Array.isArray(payload.errors) ? payload.errors.map(String) : []
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Return a safe shape so the UI can show a friendly error.
      return { totalProcessed: 0, totalErrors: [message] };
    }
  }
};

export default cloudStorageRAGService;
