import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rotateDeliverySecret, setDelivery, testDelivery } from '../api/admin';
import { useToast } from '../context/ToastContext';
import CopyField from './CopyField';

// Webhook delivery: notification rules for this startup are rendered here and
// POSTed (HMAC-signed) to the startup's own endpoint, which sends them with
// its own mailboxes and push setup.
export default function WebhookDeliveryCard({ startupId, delivery }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [url, setUrl] = useState(delivery?.webhookUrl || '');
  const [secret, setSecret] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['startup', startupId] });

  const saveMutation = useMutation({
    mutationFn: () => setDelivery(startupId, url.trim()),
    onSuccess: (res) => {
      if (res.secret) setSecret(res.secret);
      setTestResult(null);
      refresh();
      showToast(res.webhookUrl ? 'Webhook saved' : 'Webhook delivery turned off', 'success');
    },
    onError: (err) => showToast(err.response?.data?.error || 'Save failed', 'error'),
  });

  const rotateMutation = useMutation({
    mutationFn: () => rotateDeliverySecret(startupId),
    onSuccess: (res) => {
      setSecret(res.secret);
      refresh();
      showToast('Secret rotated — update it in the startup app now', 'warning');
    },
  });

  const testMutation = useMutation({
    mutationFn: () => testDelivery(startupId),
    onSuccess: setTestResult,
    onError: (err) => setTestResult({ success: false, error: err.response?.data?.error || 'Test failed' }),
  });

  const active = Boolean(delivery?.webhookUrl);

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-base">Notification delivery</h2>
          <span className={`badge ${active ? 'badge-success' : 'badge-ghost'}`}>{active ? 'webhook' : 'built-in'}</span>
        </div>
        <p className="text-sm text-base-content/60">
          With a webhook URL, notification rules are rendered here and sent to the startup&apos;s app, signed with
          the secret below. The app delivers them with its own email and push. Leave empty to use MarcoPolo&apos;s
          built-in email/push/SMS.
        </p>
        <div className="flex gap-2">
          <input
            className="input input-bordered input-sm flex-1 font-mono"
            placeholder="https://api.example.com/api/v1/events/deliver"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Save
          </button>
        </div>
        {active && (
          <div className="card-actions justify-end items-center gap-2">
            {testResult && (
              <span className={`text-sm mr-auto ${testResult.success ? 'text-success' : 'text-error'}`}>
                {testResult.success ? 'Webhook answered the ping' : testResult.error}
              </span>
            )}
            <button type="button" className="btn btn-outline btn-sm" disabled={testMutation.isPending} onClick={() => testMutation.mutate()}>
              {testMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Send test ping'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={rotateMutation.isPending} onClick={() => rotateMutation.mutate()}>
              Rotate secret
            </button>
          </div>
        )}
      </div>

      {secret && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Webhook signing secret</h3>
            <p className="text-sm text-warning mb-3">
              Shown only once. Put it in the startup app&apos;s config (Kajache: CC_EVENTS_WEBHOOK_SECRET).
            </p>
            <CopyField label="Secret" value={secret} />
            <div className="modal-action">
              <button type="button" className="btn btn-primary" onClick={() => setSecret(null)}>Done</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
