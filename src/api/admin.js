import client from './client';

export const adminLogin = (email, password) =>
  client.post('/admin/auth/login', { email, password }).then((r) => r.data);

export const listStartups = () => client.get('/admin/startups').then((r) => r.data);

export const getStartup = (id) => client.get(`/admin/startups/${id}`).then((r) => r.data);

export const createStartup = (payload) =>
  client.post('/admin/startups', payload).then((r) => r.data);

export const patchStartup = (id, payload) =>
  client.patch(`/admin/startups/${id}`, payload).then((r) => r.data);

export const regenerateKey = (id) =>
  client.post(`/admin/startups/${id}/regenerate-key`).then((r) => r.data);
