import Shell from './Shell';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/events', label: 'Events' },
  { to: '/insights', label: 'Insights' },
  { to: '/notifications/rules', label: 'Notification Rules' },
  { to: '/notifications/history', label: 'Notification History' },
  { to: '/recommendations', label: 'Recommendations' },
  { to: '/dashboard-link', label: 'Dashboard Link' },
];

// Pages that only read data; the rest edit settings, which a view-only
// dashboard-link session can't do.
const readOnlyPaths = new Set(['/', '/events', '/insights', '/notifications/history']);

export default function DashboardLayout() {
  const { auth } = useAuth();
  const readOnly = auth?.readOnly;

  return (
    <Shell
      title="MarcoPolo"
      navItems={readOnly ? navItems.filter((item) => readOnlyPaths.has(item.to)) : navItems}
      banner={
        readOnly ? (
          <div className="alert alert-info text-sm mb-4 py-2">View-only access via dashboard link.</div>
        ) : null
      }
    />
  );
}
