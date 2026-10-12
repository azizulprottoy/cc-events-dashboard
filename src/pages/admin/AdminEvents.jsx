import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminEvents, getEventCatalog } from '../../api/admin';
import JsonBlock from '../../components/JsonBlock';
import StartupSelect from '../../components/StartupSelect';

const LIMIT = 20;

// Reference body for POST /v1/events, shown so integrators know which
// keys are recognised. Only externalId and event are required.
const EXAMPLE_PAYLOAD = {
  externalId: 'user_123',
  event: 'purchase_completed',
  source: 'web',
  timestamp: '2026-10-11T09:30:00.000Z',
  sessionId: 'sess_abc123',
  properties: {
    orderId: 'ord_9876',
    amount: 49.99,
    currency: 'USD',
    items: 3,
    coupon: 'WELCOME10',
  },
  context: {
    ip: '203.0.113.42',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)',
    url: 'https://shop.example.com/checkout',
  },
};

const PAYLOAD_FIELDS = [
  ['externalId', 'string', 'required', 'Your user id. End users are created on first sight.'],
  ['event', 'string', 'required', 'Event name. Matched against event-type notification rules.'],
  ['source', '"web" | "mobile" | "server"', 'optional', 'Defaults to "server".'],
  ['timestamp', 'ISO 8601 string', 'optional', 'When it happened. Defaults to ingest time.'],
  ['sessionId', 'string', 'optional', 'Groups events into a session.'],
  ['properties', 'object', 'optional', 'Free-form key/value pairs for this event.'],
  ['context', '{ ip, userAgent, url, deviceInfo }', 'optional', 'Request/device metadata.'],
];

function SampleModal({ row, onClose }) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-1">{row.event}</h3>
        <p className="text-sm text-base-content/60 mb-3">
          Most recent payload from {row.startup.name || 'unknown startup'}, shaped as a <code>POST /v1/events</code> body.
        </p>
        <JsonBlock value={row.samplePayload} />
        {Object.keys(row.samplePayload.properties).length > 0 && (
          <>
            <h4 className="font-semibold mt-4 mb-2 text-sm">Property keys</h4>
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Type</th>
                  <th>Example value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(row.samplePayload.properties).map(([key, val]) => (
                  <tr key={key}>
                    <td className="font-mono">{key}</td>
                    <td>{Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val}</td>
                    <td className="font-mono max-w-xs truncate">{JSON.stringify(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <div className="modal-action">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Catalog({ startupId }) {
  const [selected, setSelected] = useState(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-event-catalog', startupId],
    queryFn: () => getEventCatalog({ startupId: startupId || undefined }),
  });

  if (isLoading) return <span className="loading loading-spinner" />;
  if (data.length === 0) return <p className="text-base-content/60">No events ingested yet.</p>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Event</th>
              <th>Startup</th>
              <th className="text-right">Count</th>
              <th>Last seen</th>
              <th>Triggers</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={`${row.startup._id}:${row.event}`} className="hover">
                <td className="font-medium">{row.event}</td>
                <td>{row.startup.name || '—'}</td>
                <td className="text-right tabular-nums">{row.count}</td>
                <td className="text-xs whitespace-nowrap">{new Date(row.lastSeenAt).toLocaleString()}</td>
                <td>
                  {row.triggers.length === 0 ? (
                    <span className="text-base-content/40 text-xs">none</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.triggers.map((t) => (
                        <span key={t._id} className={`badge badge-sm ${t.active ? 'badge-primary' : 'badge-ghost'}`}>
                          {t.name} · {t.channel}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => setSelected(row)}>
                    Sample JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <SampleModal row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Feed({ startupId }) {
  const [filters, setFilters] = useState({ event: '', externalId: '' });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', startupId, filters, page],
    queryFn: () => getAdminEvents({ ...filters, startupId: startupId || undefined, page, limit: LIMIT }),
  });

  function handleFilterChange(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div>
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
                  <th>Startup</th>
                  <th>User</th>
                  <th>Source</th>
                  <th>Properties</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((event) => (
                  <Fragment key={event._id}>
                    <tr
                      className="hover cursor-pointer"
                      onClick={() => setExpanded(expanded === event._id ? null : event._id)}
                    >
                      <td className="font-medium">{event.event}</td>
                      <td>{event.startupId?.name || '—'}</td>
                      <td className="font-mono text-xs">{event.externalId}</td>
                      <td>{event.source}</td>
                      <td className="font-mono text-xs max-w-xs truncate">{JSON.stringify(event.properties || {})}</td>
                      <td className="text-xs whitespace-nowrap">{new Date(event.createdAt).toLocaleString()}</td>
                    </tr>
                    {expanded === event._id && (
                      <tr>
                        <td colSpan={6}>
                          <JsonBlock
                            value={{
                              properties: event.properties || {},
                              sessionId: event.sessionId,
                              context: event.context,
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

function PayloadReference() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h2 className="font-semibold mb-2">Example body</h2>
        <p className="text-sm text-base-content/60 mb-2">
          <code>POST /v1/events</code> with the startup&apos;s API key. For many at once, send an array to{' '}
          <code>/v1/events/batch</code>.
        </p>
        <JsonBlock value={EXAMPLE_PAYLOAD} />
      </div>
      <div>
        <h2 className="font-semibold mb-2">Fields</h2>
        <table className="table table-xs">
          <thead>
            <tr>
              <th>Key</th>
              <th>Type</th>
              <th />
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {PAYLOAD_FIELDS.map(([key, type, req, note]) => (
              <tr key={key}>
                <td className="font-mono">{key}</td>
                <td className="font-mono">{type}</td>
                <td>
                  <span className={`badge badge-xs ${req === 'required' ? 'badge-error' : 'badge-ghost'}`}>{req}</span>
                </td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TABS = [
  ['catalog', 'Event types'],
  ['feed', 'Live feed'],
  ['reference', 'Payload reference'],
];

export default function AdminEvents() {
  const [tab, setTab] = useState('catalog');
  const [startupId, setStartupId] = useState('');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">Events</h1>
        {tab !== 'reference' && <StartupSelect value={startupId} onChange={setStartupId} />}
      </div>

      <div role="tablist" className="tabs tabs-border mb-4">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={`tab ${tab === key ? 'tab-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && <Catalog startupId={startupId} />}
      {tab === 'feed' && <Feed startupId={startupId} />}
      {tab === 'reference' && <PayloadReference />}
    </div>
  );
}
