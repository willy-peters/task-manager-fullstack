import apiClient from './client.js';

/** POST /auth/register → { success, token, user } */
export async function registerUser({ name, email, password }) {
  const { data } = await apiClient.post('/auth/register', { name, email, password });
  return { token: data.token, user: data.user };
}

/** POST /auth/login → { success, token, user } */
export async function loginUser({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return { token: data.token, user: data.user };
}

/** GET /auth/me (Bearer) → { success, user } */
export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.user;
}

/** GET /health → wakes up the Render instance; failures are ignored. */
export async function pingHealth() {
  try {
    const { data } = await apiClient.get('/health');
    return data;
  } catch {
    return null;
  }
}
