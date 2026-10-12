import Shell from './Shell';

const navItems = [
  { to: '/admin/startups', label: 'Startups', end: true },
  { to: '/admin/events', label: 'Events', end: true },
  { to: '/admin/triggers', label: 'Trigger points', end: true },
];

export default function AdminLayout() {
  return <Shell title="MarcoPolo Admin" navItems={navItems} />;
}
