import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHistory } from '../../api/notifications';

const LIMIT = 20;

const statusBadge = { sent: 'badge-success', queued: 'badge-warning', failed: 'badge-error' };

export default function NotificationHistory() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notification-history', page],
    queryFn: () => getHistory({ page, limit: LIMIT }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notification History</h1>

      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : data.items.length === 0 ? (
        <p className="text-base-content/60">No notifications sent yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Content</th>
                  <th>Error</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((n) => (
                  <tr key={n._id} className="hover">
                    <td className="capitalize">{n.channel}</td>
                    <td>
                      <span className={`badge ${statusBadge[n.status] || 'badge-ghost'}`}>{n.status}</span>
                    </td>
                    <td className="max-w-xs truncate text-sm">{n.content}</td>
                    <td className="max-w-xs truncate text-xs text-error">{n.error || ''}</td>
                    <td className="text-xs whitespace-nowrap">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-base-content/60">
              Page {page} of {totalPages} ({data.total} total)
            </span>
            <div className="join">
              <button
                type="button"
                className="btn btn-sm join-item"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn btn-sm join-item"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
