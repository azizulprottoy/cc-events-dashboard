import { useState } from 'react';
import CopyField from './CopyField';

// Theme params are optional: they restyle the dashboard to the startup's
// brand when opened from this link (see src/theme.js).
export function dashboardLinkUrl(token, { mode, primary } = {}) {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (primary) params.set('primary', primary);
  const query = params.toString();
  return `${window.location.origin}/l/${token}${query ? `?${query}` : ''}`;
}

// Shared by the superadmin startup page and the startup's own settings page;
// the caller supplies the token and the create/revoke handlers.
export default function DashboardLinkCard({ token, onCreate, onRevoke, pending }) {
  const [useBrand, setUseBrand] = useState(false);
  const [primary, setPrimary] = useState('#16a34a');
  const [mode, setMode] = useState('');
  const url = token ? dashboardLinkUrl(token, { mode, primary: useBrand ? primary : '' }) : null;

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-base">Dashboard link</h2>
        <p className="text-sm text-base-content/60">
          A view-only link to this startup&apos;s events dashboard. Add it to your own admin menu and anyone who clicks
          it lands on the dashboard without logging in. No code needed.
        </p>

        {url ? (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-wrap items-end gap-3">
              <label className="form-control">
                <span className="label-text text-xs">Mode</span>
                <select className="select select-bordered select-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="">Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={useBrand}
                  onChange={(e) => setUseBrand(e.target.checked)}
                />
                <span className="label-text text-sm">Brand color</span>
              </label>
              {useBrand && (
                <input
                  type="color"
                  className="w-10 h-8 cursor-pointer rounded"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  aria-label="Brand color"
                />
              )}
            </div>
            <CopyField label="Link" value={url} />
            <CopyField
              label="Menu item HTML"
              value={`<a href="${url}" target="_blank" rel="noopener noreferrer">Analytics</a>`}
            />
            <p className="text-xs text-base-content/60">
              Embedding in an iframe? The host page can also pass <code>?mode=</code>, <code>primary=</code> and{' '}
              <code>bg=</code>, and switch them live with{' '}
              <code>postMessage({'{'} type: &apos;cc-events:theme&apos;, theme {'}'})</code>.
            </p>
            <p className="text-xs text-warning">
              Anyone with this link can view the dashboard. Only put it behind your own admin login, and rotate it if it
              leaks.
            </p>
          </div>
        ) : (
          <p className="text-sm mt-2">No link active.</p>
        )}

        <div className="card-actions justify-end mt-2">
          {url && (
            <button type="button" className="btn btn-error btn-outline btn-sm" disabled={pending} onClick={onRevoke}>
              Revoke
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={onCreate}>
            {url ? 'Rotate link' : 'Create link'}
          </button>
        </div>
      </div>
    </div>
  );
}
