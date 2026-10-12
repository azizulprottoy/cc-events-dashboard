import client from './client';

export const startupLogin = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);

export const exchangeDashboardLink = (token) => client.post('/auth/link', { token }).then((r) => r.data);
