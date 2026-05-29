import { deleteJson, postJson, putJson, requestJson } from './client';

const normalizeSession = (payload) => ({
  token: payload?.token,
  refreshToken: payload?.refresh_token,
  user: payload?.user ?? null,
});

export const login = async ({ email, password }) => {
  const payload = await postJson('/api/v1/auth/login', { email, password });
  return normalizeSession(payload);
};

export const register = async ({ name, email, password }) => {
  await postJson('/api/v1/auth/register', { email, name, password });
};

export const forgotPassword = async (email) => {
  const payload = await postJson('/api/v1/auth/forgot-password', { email });
  return payload?.data ?? payload?.message ?? 'If your email is registered, a reset link has been sent.';
};

export const refreshSession = async (refreshToken) => {
  const payload = await postJson('/api/v1/auth/refresh', { refresh_token: refreshToken });
  return normalizeSession(payload);
};

export const logout = async (refreshToken) => {
  await postJson('/api/v1/auth/logout', { refresh_token: refreshToken });
};

export const getMe = async () => requestJson('/api/v1/auth/me', { auth: true });

export const getAuthSessions = async (refreshToken = '') => {
  const payload = await requestJson('/api/v1/auth/sessions', {
    auth: true,
    headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : undefined,
  });
  return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
};

export const updateProfile = async ({ avatar, name, preferredLang } = {}) => (
  putJson('/api/v1/auth/me', {
    ...(avatar !== undefined ? { avatar } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(preferredLang !== undefined ? { preferred_lang: preferredLang } : {}),
  }, { auth: true })
);

export const updatePassword = async ({ oldPassword, newPassword }) => (
  putJson('/api/v1/auth/password', {
    old_password: oldPassword,
    new_password: newPassword,
  }, { auth: true })
);

export const deleteAccount = async () => deleteJson('/api/v1/auth/me', { auth: true });
