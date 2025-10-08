// Helper to read runtime-injected environment variables.
// Runtime config is injected into the page as `window.__APP_CONFIG__` by the container.
const runtimeConfig = (globalThis as any).__APP_CONFIG__ || {};

export function getRuntimeEnv(key: string): string | undefined {
  // Prefer runtime value, fall back to build-time import.meta.env
  const fromRuntime = runtimeConfig[key];
  if (fromRuntime !== undefined && fromRuntime !== '') {
    let s = String(fromRuntime);
    // Strip single or double quotes that may be injected accidentally
    if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
      s = s.slice(1, -1);
    }
    return s;
  }
  const fromBuild = (import.meta.env as any)[key];
  if (fromBuild !== undefined && fromBuild !== '') return String(fromBuild);
  return undefined;
}

export function getRequiredRuntimeEnv(key: string): string {
  const v = getRuntimeEnv(key);
  if (!v) throw new Error(`${key} is not configured`);
  return v;
}

export function getRuntimeConfig(): Record<string, unknown> {
  return { ...(import.meta.env as any), ...runtimeConfig };
}

export default getRuntimeEnv;
