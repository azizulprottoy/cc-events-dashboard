import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resetStartupUserPassword } from '../api/admin';
import CopyField from './CopyField';
import { useToast } from '../context/ToastContext';

// Dashboard logins for one startup. Passwords are stored hashed and can't be
// shown; a superadmin can reset one and sees the new password once.
export default function StartupLoginsCard({ startupId, users }) {
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(null);
  const [customPassword, setCustomPassword] = useState('');
  const [revealed, setRevealed] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ userId, password }) => resetStartupUserPassword(startupId, userId, password),
    onSuccess: (result) => {
      setConfirming(null);
      setCustomPassword('');
      setRevealed(result);
      showToast('Password reset — the old password no longer works', 'warning');
    },
  });

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-base">Dashboard logins</h2>
        <p className="text-sm text-base-content/60">
          Passwords are stored encrypted and can&apos;t be displayed. Reset one to get a new password you can share.
        </p>

        {users.length === 0 ? (
          <p className="text-sm">No logins.</p>
        ) : (
          <table className="table table-sm mt-2">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-sm badge-ghost">{u.role}</span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline btn-xs" onClick={() => setConfirming(u)}>
                      Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirming && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Reset password</h3>
            <p className="text-sm mb-3">
              Set a new password for <strong>{confirming.email}</strong>. Their current password stops working
              immediately — you&apos;ll need to send them the new one.
            </p>
            {mutation.isError && (
              <div className="alert alert-error text-sm mb-3">
                {mutation.error.response?.data?.error || 'Reset failed'}
              </div>
            )}
            <label className="form-control">
              <span className="label-text">New password (leave blank to generate one)</span>
              <input
                type="text"
                className="input input-bordered w-full font-mono"
                placeholder="Auto-generate"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                minLength={8}
              />
            </label>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setConfirming(null);
                  setCustomPassword('');
                  mutation.reset();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={mutation.isPending || (customPassword !== '' && customPassword.length < 8)}
                onClick={() => mutation.mutate({ userId: confirming._id, password: customPassword || undefined })}
              >
                Reset password
              </button>
            </div>
          </div>
        </dialog>
      )}

      {revealed && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">New password set</h3>
            <p className="text-sm text-warning mb-3">Shown only once. Copy it now and send it to the startup.</p>
            <div className="flex flex-col gap-3">
              <CopyField label="Email" value={revealed.email} />
              <CopyField label="Password" value={revealed.password} />
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-primary" onClick={() => setRevealed(null)}>
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
