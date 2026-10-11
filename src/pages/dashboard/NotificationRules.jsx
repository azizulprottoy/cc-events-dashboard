import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRule, deleteRule, listRules, updateRule } from '../../api/notifications';
import { useToast } from '../../context/ToastContext';

const emptyForm = {
  name: '',
  channel: 'email',
  triggerType: 'event',
  event: '',
  inactivityDays: 7,
  cron: '0 9 * * *',
  subject: '',
  body: '',
};

function ruleToForm(rule) {
  if (!rule) return emptyForm;
  return {
    name: rule.name,
    channel: rule.channel,
    triggerType: rule.trigger.type,
    event: rule.trigger.event || '',
    inactivityDays: rule.trigger.inactivityDays || 7,
    cron: rule.trigger.cron || '0 9 * * *',
    subject: rule.template.subject || '',
    body: rule.template.body,
  };
}

function formToPayload(form) {
  const trigger = { type: form.triggerType };
  if (form.triggerType === 'event') trigger.event = form.event;
  if (form.triggerType === 'inactivity') trigger.inactivityDays = Number(form.inactivityDays);
  if (form.triggerType === 'schedule') trigger.cron = form.cron;

  return {
    name: form.name,
    channel: form.channel,
    trigger,
    template: { subject: form.subject || undefined, body: form.body },
  };
}

function RuleFormModal({ rule, onClose, onSaved }) {
  const [form, setForm] = useState(ruleToForm(rule));

  const mutation = useMutation({
    mutationFn: () => (rule ? updateRule(rule._id, formToPayload(form)) : createRule(formToPayload(form))),
    onSuccess: onSaved,
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-2">{rule ? 'Edit rule' : 'New notification rule'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mutation.isError && (
            <div className="alert alert-error text-sm">{mutation.error.response?.data?.error || 'Save failed'}</div>
          )}
          <label className="form-control">
            <span className="label-text">Name</span>
            <input
              className="input input-bordered w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label className="form-control">
            <span className="label-text">Trigger type</span>
            <select
              className="select select-bordered w-full"
              value={form.triggerType}
              onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
            >
              <option value="event">On event</option>
              <option value="inactivity">Inactivity</option>
              <option value="schedule">Schedule</option>
            </select>
          </label>

          {form.triggerType === 'event' && (
            <label className="form-control">
              <span className="label-text">Event name</span>
              <input
                className="input input-bordered w-full"
                placeholder="e.g. Signup"
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                required
              />
            </label>
          )}
          {form.triggerType === 'inactivity' && (
            <label className="form-control">
              <span className="label-text">Inactivity days</span>
              <input
                type="number"
                min="1"
                className="input input-bordered w-full"
                value={form.inactivityDays}
                onChange={(e) => setForm({ ...form, inactivityDays: e.target.value })}
                required
              />
            </label>
          )}
          {form.triggerType === 'schedule' && (
            <label className="form-control">
              <span className="label-text">Cron expression</span>
              <input
                className="input input-bordered w-full font-mono"
                value={form.cron}
                onChange={(e) => setForm({ ...form, cron: e.target.value })}
                required
              />
            </label>
          )}

          <label className="form-control">
            <span className="label-text">Channel</span>
            <select
              className="select select-bordered w-full"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
            </select>
          </label>

          {form.channel === 'email' && (
            <label className="form-control">
              <span className="label-text">Subject</span>
              <input
                className="input input-bordered w-full"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
          )}

          <label className="form-control">
            <span className="label-text">
              Body <span className="text-base-content/50">(use {'{{'}externalId{'}}'} etc. as placeholders)</span>
            </span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </label>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="loading loading-spinner" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default function NotificationRules() {
  const [modalRule, setModalRule] = useState(undefined); // undefined = closed, null = create, object = edit
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rules, isLoading } = useQuery({ queryKey: ['rules'], queryFn: listRules });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      showToast('Rule deleted', 'success');
    },
  });

  function handleSaved() {
    setModalRule(undefined);
    queryClient.invalidateQueries({ queryKey: ['rules'] });
    showToast('Rule saved', 'success');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Notification Rules</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModalRule(null)}>
          New rule
        </button>
      </div>

      {isLoading ? (
        <span className="loading loading-spinner" />
      ) : rules.length === 0 ? (
        <p className="text-base-content/60">No rules yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Channel</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id} className="hover">
                  <td>{rule.name}</td>
                  <td className="text-sm">
                    {rule.trigger.type === 'event' && `on "${rule.trigger.event}"`}
                    {rule.trigger.type === 'inactivity' && `${rule.trigger.inactivityDays}d inactive`}
                    {rule.trigger.type === 'schedule' && <span className="font-mono">{rule.trigger.cron}</span>}
                  </td>
                  <td className="capitalize">{rule.channel}</td>
                  <td>
                    <span className={`badge ${rule.active ? 'badge-success' : 'badge-ghost'}`}>
                      {rule.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalRule(rule)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => deleteMutation.mutate(rule._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalRule !== undefined && (
        <RuleFormModal rule={modalRule} onClose={() => setModalRule(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
