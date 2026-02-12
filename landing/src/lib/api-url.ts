/**
 * API URL utility to centralize API endpoint construction
 */
export function getApiUrl(): string {
    // Use VITE_API_URL if defined, otherwise empty string for relative URLs
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

export function buildApiUrl(path: string): string {
    const baseUrl = getApiUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}
