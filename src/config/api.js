const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .trim()
  .replace(/\/+$/, '');

export const API_ORIGIN = configuredApiUrl.replace(/\/api$/i, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;
