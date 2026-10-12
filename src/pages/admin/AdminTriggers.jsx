import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminTriggers } from '../../api/admin';
import StartupSelect from '../../components/StartupSelect';

function describeTrigger(trigger) {
  if (trigger.type === 'event') return `on event "${trigger.event}"`;
  if (trigger.type === 'inactivity') return `after ${trigger.inactivityDays} days inactive`;
  if (trigger.type === 'schedule') return `cron ${trigger.cron}`;
  return trigger.type;
}

export default function AdminTriggers() {
  const [startupId, setStartupId] = useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-triggers', startupId],
    queryFn: () => getAdminTriggers({ startupId: startupId || undefined }),
  });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">Trigger points</h1>
        <StartupSelect value={startupId} onChange={setStartupId} />
      </div>

      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : data.length === 0 ? (
        <p className="text-base-content/60">No notification rules configured.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Startup</th>
                <th>Trigger</th>
                <th>Channel</th>
                <th>Template</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rule) => (
                <tr key={rule._id} className="hover">
                  <td className="font-medium">{rule.name}</td>
                  <td>{rule.startupId?.name || '—'}</td>
                  <td>
                    <span className="badge badge-sm badge-outline mr-1">{rule.trigger.type}</span>
                    <span className="text-xs">{describeTrigger(rule.trigger)}</span>
                  </td>
                  <td>{rule.channel}</td>
                  <td className="text-xs max-w-xs truncate">
                    {rule.template.subject ? <strong>{rule.template.subject}: </strong> : null}
                    {rule.template.body}
                  </td>
                  <td>
                    <span className={`badge badge-sm ${rule.active ? 'badge-success' : 'badge-ghost'}`}>
                      {rule.active ? 'active' : 'paused'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
