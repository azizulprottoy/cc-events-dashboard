import client from './client';

export const getOverview = (days = 7) =>
  client.get('/dashboard/overview', { params: { days } }).then((r) => r.data);

export const getEventsOverTime = (days = 30) =>
  client.get('/dashboard/charts/events-over-time', { params: { days } }).then((r) => r.data);

export const getUserGrowth = (days = 30) =>
  client.get('/dashboard/charts/user-growth', { params: { days } }).then((r) => r.data);

export const getEventsFeed = (params) =>
  client.get('/dashboard/events', { params }).then((r) => r.data);
