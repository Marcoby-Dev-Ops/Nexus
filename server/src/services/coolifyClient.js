require('../../loadEnv');

const axios = require('axios');

function getCoolifyConfig() {
  const baseURL = process.env.COOLIFY_API_URL;
  const token = process.env.COOLIFY_TOKEN;

  if (!baseURL) {
    throw new Error('COOLIFY_API_URL is not set');
  }
  if (!token) {
    throw new Error('COOLIFY_TOKEN is not set');
  }

  return { baseURL, token };
}

function createCoolifyClient() {
  const { baseURL, token } = getCoolifyConfig();

  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });
}

module.exports = {
  getCoolifyConfig,
  createCoolifyClient
};
