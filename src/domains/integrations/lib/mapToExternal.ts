export function mapToExternal<T = any>(standard: any, fieldMap: Record<string, string>): T {
  const result: any = {};
  for (const [standardKey, externalKey] of Object.entries(fieldMap)) {
    if (standard[standardKey] !== undefined) {
      result[externalKey] = standard[standardKey];
    }
  }
  return result;
} 