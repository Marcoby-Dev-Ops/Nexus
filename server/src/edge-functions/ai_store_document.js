module.exports = async function ai_store_document(_payload = {}, _user) {
  // Accepts { content, contentType, companyId, metadata }
  // Stub success until vector DB is configured
  return {
    success: true,
    data: { stored: true }
  };
};
