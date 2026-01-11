const API_BASE = 'http://localhost:4000/api';

async function fetchJson(path, opts = {}) {
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(()=>null);
  if (!res.ok) return data || { error: 'Server error' };
  return data;
}

export async function apiPost(path, body, token) {
  return fetchJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
}
export async function apiGet(path, token) {
  return fetchJson(path, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}
export async function apiDelete(path, token) {
  return fetchJson(path, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
}
export async function apiPut(path, body, token) {
  return fetchJson(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
}
