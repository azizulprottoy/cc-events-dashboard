import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateNow, getConfig, lookupByExternalId, patchConfig } from '../../api/recommendations';
import { useToast } from '../../context/ToastContext';

export default function RecommendationSettings() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: config, isLoading } = useQuery({ queryKey: ['rec-config'], queryFn: getConfig });
  const [lookbackDays, setLookbackDays] = useState(null);

  const saveMutation = useMutation({
    mutationFn: patchConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-config'] });
      showToast('Config saved', 'success');
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateNow,
    onSuccess: (result) => showToast(`Generated for ${result.updated} end-users`, 'success'),
  });

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const lookupMutation = useMutation({
    mutationFn: lookupByExternalId,
    onSuccess: setLookupResult,
  });

  const currentLookback = lookbackDays ?? config?.lookbackDays ?? '';

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold">Recommendations</h1>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">Configuration</h2>
          {isLoading ? (
            <span className="loading loading-spinner" />
          ) : (
            <form
              className="flex items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate({ lookbackDays: Number(currentLookback) });
              }}
            >
              <label className="form-control">
                <span className="label-text">Lookback window (days)</span>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-32"
                  value={currentLookback}
                  onChange={(e) => setLookbackDays(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                Save
              </button>
            </form>
          )}
          <p className="text-sm text-base-content/60 mt-2">
            Recommendations regenerate nightly. Popularity is computed over this many trailing days.
          </p>
          <div className="card-actions justify-end">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              {generateMutation.isPending ? <span className="loading loading-spinner" /> : 'Generate now'}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">Look up a user's recommendations</h2>
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              lookupMutation.mutate(lookupId);
            }}
          >
            <input
              type="text"
              placeholder="externalId"
              className="input input-bordered flex-1"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              required
            />
            <button type="submit" className="btn" disabled={lookupMutation.isPending}>
              Look up
            </button>
          </form>

          {lookupResult && (
            <div className="mt-3">
              {lookupResult.items.length === 0 ? (
                <p className="text-base-content/60 text-sm">No recommendations for this user yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {lookupResult.items.map((item) => (
                    <li key={item.label} className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-mono">{item.score}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
