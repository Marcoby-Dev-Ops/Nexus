const REQUIRED_RUNTIME_METHODS = [
  'getRuntimeInfo',
  'getCapabilities',
  'chatCompletions',
  'healthCheck'
];

function assertRuntimeContract(runtime) {
  if (!runtime || typeof runtime !== 'object') {
    throw new Error('Invalid runtime: expected object');
  }

  for (const methodName of REQUIRED_RUNTIME_METHODS) {
    if (typeof runtime[methodName] !== 'function') {
      throw new Error(`Invalid runtime: missing method ${methodName}()`);
    }
  }

  return runtime;
}

module.exports = {
  REQUIRED_RUNTIME_METHODS,
  assertRuntimeContract
};
