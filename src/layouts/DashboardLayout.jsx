import Shell from './Shell';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/events', label: 'Events' },
  { to: '/notifications/rules', label: 'Notification Rules' },
  { to: '/notifications/history', label: 'Notification History' },
  { to: '/recommendations', label: 'Recommendations' },
];

export default function DashboardLayout() {
  return <Shell title="MarcoPolo" navItems={navItems} />;
}
