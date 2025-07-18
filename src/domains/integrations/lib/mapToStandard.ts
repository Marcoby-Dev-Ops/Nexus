export function mapToStandard<T = any>(external: any, fieldMap: Record<string, string>): T {
  const result: any = {};
  for (const [standard, externalKey] of Object.entries(fieldMap)) {
    // Support both direct and nested (properties) access
    result[standard] = external.properties?.[externalKey] ?? external[externalKey];
  }
  return result;
} 