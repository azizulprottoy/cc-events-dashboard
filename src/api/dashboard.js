import client from './client';

export const getOverview = (days = 7) =>
  client.get('/dashboard/overview', { params: { days } }).then((r) => r.data);

export const getEventsOverTime = (days = 30) =>
  client.get('/dashboard/charts/events-over-time', { params: { days } }).then((r) => r.data);

export const getUserGrowth = (days = 30) =>
  client.get('/dashboard/charts/user-growth', { params: { days } }).then((r) => r.data);

export const getEventsFeed = (params) =>
  client.get('/dashboard/events', { params }).then((r) => r.data);

export const getMyDashboardLink = () => client.get('/dashboard/link').then((r) => r.data);

export const createMyDashboardLink = () => client.post('/dashboard/link').then((r) => r.data);

export const revokeMyDashboardLink = () => client.delete('/dashboard/link');

export const getInsightProperties = () => client.get('/dashboard/insights/properties').then((r) => r.data);

export const getInsightTop = (params) => client.get('/dashboard/insights/top', { params }).then((r) => r.data);

export const getInsightAudience = (params) =>
  client.get('/dashboard/insights/audience', { params }).then((r) => r.data);

export const getInsightEvents = (params) => client.get('/dashboard/insights/events', { params }).then((r) => r.data);

export const getInsightTrend = (params) => client.get('/dashboard/insights/trend', { params }).then((r) => r.data);
