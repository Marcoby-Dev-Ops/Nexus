const fs = require('fs');
const path = require('path');

let cached = null;
let cachedMtimeMs = null;

function getRegistryPath() {
  // server/src/atom/registry.js -> server/src/atom -> server/src -> server -> repo root
  return path.resolve(__dirname, '../../../config/atom-registry.json');
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
