import Shell from './Shell';

const navItems = [{ to: '/admin/startups', label: 'Startups', end: true }];

export default function AdminLayout() {
  return <Shell title="MarcoPolo Admin" navItems={navItems} />;
}
