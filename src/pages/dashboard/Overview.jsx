import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getEventsOverTime, getOverview, getUserGrowth } from '../../api/dashboard';
import StatCard from '../../components/StatCard';
import { tooltipStyle, usePrimaryColor } from '../../theme';

export default function Overview() {
  const primary = usePrimaryColor();
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['overview'],
    queryFn: () => getOverview(7),
  });
  const { data: eventsOverTime, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-over-time'],
    queryFn: () => getEventsOverTime(30),
  });
  const { data: userGrowth, isLoading: loadingGrowth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: () => getUserGrowth(30),
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {loadingOverview ? (
        <span className="loading loading-spinner" />
      ) : (
        <div>
          <div className="stats stats-vertical sm:stats-horizontal shadow w-full mb-4">
            <StatCard label={`Events (${overview.periodDays}d)`} value={overview.totalEvents} />
            <StatCard label={`Active users (${overview.periodDays}d)`} value={overview.activeUsers} />
          </div>
          <div className="card bg-base-100 shadow border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-base">Top events</h2>
              {overview.topEventTypes.length === 0 ? (
                <p className="text-base-content/60 text-sm">No events yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {overview.topEventTypes.map((row) => (
                    <li key={row.event} className="flex justify-between text-sm">
                      <span>{row.event}</span>
                      <span className="font-mono">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base">Events over time (30d)</h2>
            {loadingEvents ? (
              <span className="loading loading-spinner" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={eventsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={primary} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base">New users (30d)</h2>
            {loadingGrowth ? (
              <span className="loading loading-spinner" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip {...tooltipStyle} cursor={false} />
                  <Bar dataKey="newUsers" fill={primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
