const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;

export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `Login failed (${response.status})`);
    return data;
};

export const registerUser = async (username, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || `Registration failed (${response.status})`);
    return data;
};