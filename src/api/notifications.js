import client from './client';

export const listRules = () => client.get('/notifications/rules').then((r) => r.data);

export const createRule = (payload) =>
  client.post('/notifications/rules', payload).then((r) => r.data);

export const updateRule = (id, payload) =>
  client.patch(`/notifications/rules/${id}`, payload).then((r) => r.data);

export const deleteRule = (id) => client.delete(`/notifications/rules/${id}`);

export const getHistory = (params) =>
  client.get('/notifications/history', { params }).then((r) => r.data);

export const getDeliveryMode = () => client.get('/notifications/delivery').then((r) => r.data);

export const getCatalog = () => client.get('/notifications/catalog').then((r) => r.data);

export const countAudience = (payload) =>
  client.post('/notifications/audience/count', payload).then((r) => r.data);

export const previewTemplate = (payload) => client.post('/notifications/preview', payload).then((r) => r.data);

export const sendRuleNow = (id) => client.post(`/notifications/rules/${id}/send`).then((r) => r.data);
