const fs = require('fs');
const path = require('path');

let cached = null;
let cachedMtimeMs = null;

function getRegistryPath() {
  // In Docker builds, the server image context is ./server, so the registry must live under server/.
  // server/src/atom/registry.js -> server/src/atom -> server/src -> server
  return path.resolve(__dirname, '../../config/atom-registry.json');
}

function loadAtomRegistry() {
  const p = getRegistryPath();
  const stat = fs.statSync(p);
  if (cached && cachedMtimeMs === stat.mtimeMs) return cached;
  const raw = fs.readFileSync(p, 'utf8');
  cached = JSON.parse(raw);
  cachedMtimeMs = stat.mtimeMs;
  return cached;
}

function getEntityPolicy(entityKey) {
  const reg = loadAtomRegistry();
  return reg?.entities?.[entityKey] || null;
}

module.exports = {
  loadAtomRegistry,
  getEntityPolicy,
  getRegistryPath
};
