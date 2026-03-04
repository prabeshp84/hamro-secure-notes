// FIX: Use env variable instead of hardcoded localhost
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiFetch = async (endpoint, method = 'GET', body = null, token = null) => {
  try {
    const res = await fetch(`${API_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : null
    });
    return res;
  } catch {
    return null; // network/server offline
  }
};
