import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// True when another site shows this dashboard in an iframe (e.g. a
// startup's own admin panel). That page already has its own chrome.
const isEmbedded = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin access to window.top throws: we're framed
  }
})();

export default function Shell({ title, navItems, banner = null }) {
  const { logout } = useAuth();

  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-base-100">
        <div role="tablist" className="tabs tabs-border px-4 pt-2 border-b border-base-200">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              role="tab"
              className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="mp-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <div className="navbar bg-base-100 border-b border-base-200 lg:hidden">
          <label htmlFor="mp-drawer" className="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <span className="ml-2 text-lg font-semibold">{title}</span>
        </div>
        <main className="flex-1 p-4 sm:p-6">
          {banner}
          <Outlet />
        </main>
      </div>
      <div className="drawer-side">
        <label htmlFor="mp-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <aside className="bg-base-100 min-h-full w-64 border-r border-base-200 p-4 flex flex-col">
          <div className="text-xl font-bold px-2 mb-6">{title}</div>
          <ul className="menu w-full flex-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-ghost btn-sm justify-start" onClick={logout}>
            Log out
          </button>
        </aside>
      </div>
    </div>
  );
}
