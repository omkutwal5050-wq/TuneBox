const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
