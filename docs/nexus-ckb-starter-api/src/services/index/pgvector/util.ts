export function toSqlVector(vec: number[]): string { return `[${vec.join(',')}]`; }
