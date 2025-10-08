module.exports = async function ai_vector_search(payload = {}, _user) {
  // Accepts { queryEmbedding, companyId, limit, threshold, contentType }
  // Minimal stub that returns no documents to avoid 500s
  return {
    success: true,
    data: {
      documents: []
    }
  };
};
