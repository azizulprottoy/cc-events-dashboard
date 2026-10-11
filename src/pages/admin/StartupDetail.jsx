import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getStartup, patchStartup, regenerateKey } from '../../api/admin';
import CopyField from '../../components/CopyField';
import { useToast } from '../../context/ToastContext';

export default function StartupDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [revealedKey, setRevealedKey] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['startup', id], queryFn: () => getStartup(id) });

  const statusMutation = useMutation({
    mutationFn: (status) => patchStartup(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup', id] });
      showToast('Status updated', 'success');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateKey(id),
    onSuccess: (result) => {
      setRevealedKey(result.apiKey);
      queryClient.invalidateQueries({ queryKey: ['startup', id] });
      showToast('Key regenerated — the old key is now revoked', 'warning');
    },
  });

  if (isLoading) return <span className="loading loading-spinner" />;

  const { startup, apiKey } = data;

  return (
    <div className="max-w-2xl">
      <Link to="/admin/startups" className="link text-sm mb-4 inline-block">
        &larr; Back to startups
      </Link>
      <h1 className="text-2xl font-bold mb-4">{startup.name}</h1>

      <div className="card bg-base-100 shadow border border-base-200 mb-4">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-base-content/60">Contact email</p>
              <p>{startup.contactEmail}</p>
            </div>
            <span className={`badge ${startup.status === 'active' ? 'badge-success' : 'badge-error'}`}>
              {startup.status}
            </span>
          </div>
          <div className="card-actions justify-end mt-4">
            {startup.status === 'active' ? (
              <button
                type="button"
                className="btn btn-error btn-sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate('suspended')}
              >
                Suspend
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate('active')}
              >
                Activate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">Integration key</h2>
          {apiKey ? (
            <p className="font-mono text-sm">{apiKey.key}</p>
          ) : (
            <p className="text-base-content/60 text-sm">No active key</p>
          )}
          <p className="text-sm text-base-content/60">
            Regenerating immediately revokes the current key — any integration using it stops working until
            updated with the new one.
          </p>
          <div className="card-actions justify-end">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate()}
            >
              Regenerate key
            </button>
          </div>
        </div>
      </div>

      {revealedKey && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">New key generated</h3>
            <p className="text-sm text-warning mb-3">The secret is shown only once. Copy it now.</p>
            <div className="flex flex-col gap-3">
              <CopyField label="API Key" value={revealedKey.key} />
              <CopyField label="API Secret" value={revealedKey.secret} />
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-primary" onClick={() => setRevealedKey(null)}>
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
