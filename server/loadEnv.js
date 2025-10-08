const path = require('path');
const { config } = require('dotenv');

const envPath = path.resolve(__dirname, '.env');

if (!process.env.__SERVER_ENV_LOADED__) {
  config({ path: envPath });
  process.env.__SERVER_ENV_LOADED__ = 'true';
}

module.exports = { envPath };
