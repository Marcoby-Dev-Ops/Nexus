module.exports = async function ai_rag_stats(payload = {}, _user) {
  const now = new Date().toISOString();
  // Return empty stats to unblock UI
  return {
    success: true,
    data: {
      totalDocuments: 0,
      documentTypes: {},
      lastUpdated: now
    }
  };
};
