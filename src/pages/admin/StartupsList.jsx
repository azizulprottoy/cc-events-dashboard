import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createStartup, listStartups } from '../../api/admin';
import CopyField from '../../components/CopyField';
import { useToast } from '../../context/ToastContext';

function CreateStartupModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', contactEmail: '', ownerEmail: '' });
  const mutation = useMutation({
    mutationFn: createStartup,
    onSuccess: (data) => {
      onCreated(data);
      setForm({ name: '', contactEmail: '', ownerEmail: '' });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate(form);
  }

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">New startup</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mutation.isError && (
            <div className="alert alert-error text-sm">
              {mutation.error.response?.data?.error || 'Failed to create startup'}
            </div>
          )}
          <label className="form-control">
            <span className="label-text">Startup name</span>
            <input
              className="input input-bordered w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text">Contact email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              required
            />
          </label>
          <label className="form-control">
            <span className="label-text">Owner login email</span>
            <input
              type="email"
              className="input input-bordered w-full"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              required
            />
          </label>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="loading loading-spinner" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function CredentialsRevealModal({ result, onClose }) {
  if (!result) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Save these now</h3>
        <p className="text-sm text-warning mb-3">
          The API secret and owner password are shown only once. Copy them before closing.
        </p>
        <div className="flex flex-col gap-3">
          <CopyField label="API Key" value={result.apiKey.key} />
          <CopyField label="API Secret" value={result.apiKey.secret} />
          <CopyField label="Owner Email" value={result.owner.email} />
          <CopyField label="Owner Password" value={result.owner.password} />
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function StartupsList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [revealResult, setRevealResult] = useState(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: startups, isLoading } = useQuery({ queryKey: ['startups'], queryFn: listStartups });

  function handleCreated(data) {
    setModalOpen(false);
    setRevealResult(data);
    queryClient.invalidateQueries({ queryKey: ['startups'] });
    showToast('Startup created', 'success');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Startups</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          New startup
        </button>
      </div>

      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : startups.length === 0 ? (
        <p className="text-base-content/60">No startups registered yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Email</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => (
                <tr key={s._id} className="hover">
                  <td>
                    <Link to={`/admin/startups/${s._id}`} className="link link-primary">
                      {s.name}
                    </Link>
                  </td>
                  <td>{s.contactEmail}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateStartupModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      <CredentialsRevealModal result={revealResult} onClose={() => setRevealResult(null)} />
    </div>
  );
}
