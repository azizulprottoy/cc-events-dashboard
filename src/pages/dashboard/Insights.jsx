import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getInsightAudience,
  getInsightEvents,
  getInsightProperties,
  getInsightTop,
  getInsightTrend,
} from '../../api/dashboard';
import { tooltipStyle, usePrimaryColor } from '../../theme';

// Preferred dimensions, best first; whichever exists in the data is the default.
const PREFERRED = ['categoryName', 'serviceTitle', 'category', 'productId', 'serviceId'];
const DAY_OPTIONS = [7, 30, 90, 365];
const METRICS = [
  ['score', 'Score'],
  ['events', 'Clicks / events'],
  ['users', 'Unique users'],
];
const LINE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
// One-click views for common questions; shown when the data supports them.
const PRESETS = [
  { label: 'Service clicks', property: 'serviceTitle', action: 'service_viewed' },
  { label: 'Category clicks', property: 'categoryName', action: 'category_viewed' },
  { label: 'Most booked services', property: 'serviceTitle', action: 'booking_created' },
];

function Trend({ property, days, action }) {
  const primary = usePrimaryColor();
  const { data, isLoading } = useQuery({
    queryKey: ['insight-trend', property, days, action],
    queryFn: () => getInsightTrend({ property, days, events: action || undefined, top: 5 }),
  });
  if (isLoading) return <span className="loading loading-spinner" />;
  if (!data?.series.length) return null;

  const chartData = data.dates.map((date, i) => {
    const point = { date: date.slice(5) };
    data.series.forEach((s) => {
      point[String(s.value)] = s.counts[i];
    });
    return point;
  });

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <h2 className="card-title text-base">
          {action ? `${action} over time` : 'Activity over time'} — top 5 {property}
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.series.map((s, i) => (
                <Line
                  key={String(s.value)}
                  type="monotone"
                  dataKey={String(s.value)}
                  stroke={i === 0 ? primary : LINE_COLORS[(i - 1) % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function toCsv(rows) {
  const header = ['externalId', 'name', 'email', 'phone', 'score', 'events', 'lastInteractionAt', 'topInterests'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.externalId,
      r.name,
      r.email,
      r.phone,
      r.score,
      r.events,
      r.lastInteractionAt,
      r.topValues.map((t) => t.value).join(' | '),
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Audience({ property, days, action, value, onClear }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['insight-audience', property, days, action, value],
    queryFn: () =>
      getInsightAudience({ property, days, events: action || undefined, value: value ?? undefined, limit: 500 }),
  });

  const title = value == null ? 'Top users by interest' : `Audience: ${value}`;

  return (
    <div className="card bg-base-100 shadow border border-base-200">
      <div className="card-body">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="card-title text-base">{title}</h2>
            <p className="text-xs text-base-content/60">
              {value == null
                ? 'Each user’s strongest interests. Click a row in the table above to see one audience.'
                : `Users most interested in this ${property}, ranked by score. Export to target them.`}
            </p>
          </div>
          <div className="flex gap-2">
            {value != null && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
                Show all
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={data.length === 0}
              onClick={() => downloadCsv(`audience-${property}-${value ?? 'all'}.csv`, data)}
            >
              Export CSV ({data.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <span className="loading loading-spinner" />
        ) : data.length === 0 ? (
          <p className="text-base-content/60 text-sm">No users yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[28rem]">
            <table className="table table-sm table-pin-rows">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">Events</th>
                  <th>Top interests</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.externalId} className="hover">
                    <td>
                      <div className="font-medium">{u.name || '—'}</div>
                      <div className="font-mono text-xs text-base-content/60">{u.externalId}</div>
                    </td>
                    <td className="text-xs">
                      <div>{u.email || '—'}</div>
                      <div className="text-base-content/60">{u.phone || ''}</div>
                    </td>
                    <td className="text-right tabular-nums font-semibold">{u.score}</td>
                    <td className="text-right tabular-nums">{u.events}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {u.topValues.map((t) => (
                          <span key={String(t.value)} className="badge badge-sm badge-ghost">
                            {String(t.value)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs whitespace-nowrap">{new Date(u.lastInteractionAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Insights() {
  const [property, setProperty] = useState('');
  const [days, setDays] = useState(30);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('');
  const [metric, setMetric] = useState('score');
  const primary = usePrimaryColor();

  const { data: properties = [], isLoading: loadingProps } = useQuery({
    queryKey: ['insight-properties'],
    queryFn: getInsightProperties,
  });

  useEffect(() => {
    if (property || properties.length === 0) return;
    const keys = properties.map((p) => p.key);
    setProperty(PREFERRED.find((k) => keys.includes(k)) || keys[0]);
  }, [properties, property]);

  const { data: actions = [] } = useQuery({
    queryKey: ['insight-events', property, days],
    queryFn: () => getInsightEvents({ property, days }),
    enabled: Boolean(property),
  });

  const { data: topRaw = [], isLoading: loadingTop } = useQuery({
    queryKey: ['insight-top', property, days, action],
    queryFn: () => getInsightTop({ property, days, events: action || undefined }),
    enabled: Boolean(property),
  });

  const top = [...topRaw].sort((a, b) => b[metric] - a[metric]);
  const maxValue = Math.max(1, ...top.map((t) => t[metric]));
  const chartData = top.slice(0, 10).map((t) => ({ name: String(t.value), [metric]: t[metric] }));
  const metricLabel = METRICS.find(([key]) => key === metric)[1];
  const propertyKeys = properties.map((p) => p.key);

  function changeProperty(next) {
    setProperty(next);
    setAction('');
    setSelected(null);
  }

  function applyPreset(preset) {
    setProperty(preset.property);
    setAction(preset.action);
    setMetric('events');
    setSelected(null);
  }

  if (loadingProps) return <span className="loading loading-spinner" />;
  if (properties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Insights</h1>
        <p className="text-base-content/60">No event properties to analyse yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-base-content/60">
          What users engage with most. Score weights intent: views 1, bookings/carts/bids 3, purchases/completions 5.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm w-auto"
            value={property}
            onChange={(e) => changeProperty(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.key} value={p.key}>
                {p.key}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm w-auto"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setSelected(null);
            }}
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.event} value={a.event}>
                {a.event} ({a.count})
              </option>
            ))}
          </select>
          <select className="select select-bordered select-sm w-auto" value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRICS.map(([key, label]) => (
              <option key={key} value={key}>
                Rank by {label.toLowerCase()}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm w-auto"
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setSelected(null);
            }}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        {PRESETS.some((p) => propertyKeys.includes(p.property)) && <div className="divider divider-horizontal mx-0" />}
        {PRESETS.filter((p) => propertyKeys.includes(p.property)).map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`btn btn-xs ${property === preset.property && action === preset.action ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {loadingTop ? (
        <span className="loading loading-spinner" />
      ) : top.length === 0 ? (
        <p className="text-base-content/60">
          No {action || 'events'} with “{property}” in this period.
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="card bg-base-100 shadow border border-base-200 xl:col-span-2">
            <div className="card-body">
              <h2 className="card-title text-base">
                Most popular {property} by {metricLabel.toLowerCase()}
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} cursor={false} />
                    <Bar dataKey={metric} name={metricLabel} fill={primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow border border-base-200 xl:col-span-3">
            <div className="card-body">
              <h2 className="card-title text-base">Ranking</h2>
              <div className="overflow-x-auto max-h-80">
                <table className="table table-sm table-pin-rows">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{property}</th>
                      <th>{metricLabel}</th>
                      {metric !== 'score' && <th className="text-right">Score</th>}
                      {metric !== 'users' && <th className="text-right">Users</th>}
                      {metric !== 'events' && <th className="text-right">Events</th>}
                      <th>Top actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((row, i) => (
                      <tr
                        key={String(row.value)}
                        className={`hover cursor-pointer ${selected === row.value ? 'bg-base-200' : ''}`}
                        onClick={() => setSelected(row.value)}
                      >
                        <td className="text-base-content/60">{i + 1}</td>
                        <td className="font-medium max-w-48 truncate">{String(row.value)}</td>
                        <td className="min-w-32">
                          <div className="flex items-center gap-2">
                            <progress className="progress progress-primary w-20" value={row[metric]} max={maxValue} />
                            <span className="tabular-nums text-xs">{row[metric]}</span>
                          </div>
                        </td>
                        {metric !== 'score' && <td className="text-right tabular-nums">{row.score}</td>}
                        {metric !== 'users' && <td className="text-right tabular-nums">{row.users}</td>}
                        {metric !== 'events' && <td className="text-right tabular-nums">{row.events}</td>}
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {row.byEvent.slice(0, 3).map((e) => (
                              <span key={e.event} className="badge badge-sm badge-ghost">
                                {e.event} · {e.count}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {property && top.length > 0 && <Trend property={property} days={days} action={action} />}

      {property && (
        <Audience property={property} days={days} action={action} value={selected} onClear={() => setSelected(null)} />
      )}
    </div>
  );
}
