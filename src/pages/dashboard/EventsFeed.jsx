import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEventsFeed } from '../../api/dashboard';

const LIMIT = 20;

export default function EventsFeed() {
  const [filters, setFilters] = useState({ event: '', externalId: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['events-feed', filters, page],
    queryFn: () => getEventsFeed({ ...filters, page, limit: LIMIT }),
  });

  function handleFilterChange(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Filter by event name"
          className="input input-bordered input-sm"
          value={filters.event}
          onChange={(e) => handleFilterChange('event', e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by user id"
          className="input input-bordered input-sm"
          value={filters.externalId}
          onChange={(e) => handleFilterChange('externalId', e.target.value)}
        />
      </div>

      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : data.items.length === 0 ? (
        <p className="text-base-content/60">No events match.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Source</th>
                  <th>Properties</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((event) => (
                  <tr key={event._id} className="hover">
                    <td className="font-medium">{event.event}</td>
                    <td className="font-mono text-xs">{event.externalId}</td>
                    <td>{event.source}</td>
                    <td className="font-mono text-xs max-w-xs truncate">
                      {JSON.stringify(event.properties || {})}
                    </td>
                    <td className="text-xs whitespace-nowrap">{new Date(event.createdAt).toLocaleString()}</td>
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
