import client from './client';

export const getConfig = () => client.get('/recommendations/config').then((r) => r.data);

export const patchConfig = (payload) =>
  client.patch('/recommendations/config', payload).then((r) => r.data);

export const generateNow = () => client.post('/recommendations/generate').then((r) => r.data);

export const lookupByExternalId = (externalId) =>
  client.get(`/recommendations/lookup/${externalId}`).then((r) => r.data);
