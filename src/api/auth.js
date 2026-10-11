import client from './client';

export const startupLogin = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);
