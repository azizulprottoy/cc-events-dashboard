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

export const getAdminEvents = (params) => client.get('/admin/events', { params }).then((r) => r.data);

export const getEventCatalog = (params) =>
  client.get('/admin/events/catalog', { params }).then((r) => r.data);

export const getAdminTriggers = (params) => client.get('/admin/triggers', { params }).then((r) => r.data);

export const createDashboardLink = (id) =>
  client.post(`/admin/startups/${id}/dashboard-link`).then((r) => r.data);

export const revokeDashboardLink = (id) => client.delete(`/admin/startups/${id}/dashboard-link`);

export const resetStartupUserPassword = (id, userId, password) =>
  client.post(`/admin/startups/${id}/users/${userId}/reset-password`, password ? { password } : {}).then((r) => r.data);
