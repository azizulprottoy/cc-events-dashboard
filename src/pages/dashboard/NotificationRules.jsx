import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countAudience,
  createRule,
  deleteRule,
  getCatalog,
  getDeliveryMode,
  listRules,
  previewTemplate,
  sendRuleNow,
  updateRule,
} from '../../api/notifications';
import { useToast } from '../../context/ToastContext';

const TRIGGER_LABELS = {
  event: 'On event',
  broadcast: 'Broadcast (send now)',
  schedule: 'Schedule',
  inactivity: 'Inactivity win-back',
};

const emptyForm = {
  name: '',
  channel: 'email',
  triggerType: 'event',
  event: '',
  inactivityDays: 7,
  cron: '0 9 * * *',
  cooldownHours: '',
  subject: '',
  title: '',
  body: '',
  html: '',
  url: '',
  from: '',
  userTypes: [],
  activeWithinDays: '',
  didEvent: '',
  didEventDays: '',
  didNotEvent: '',
  didNotEventDays: '',
  traits: [],
};

function ruleToForm(rule) {
  if (!rule) return emptyForm;
  const a = rule.audience || {};
  const t = rule.template || {};
  return {
    ...emptyForm,
    name: rule.name,
    channel: rule.channel,
    triggerType: rule.trigger.type,
    event: rule.trigger.event || '',
    inactivityDays: rule.trigger.inactivityDays || 7,
    cron: rule.trigger.cron || '0 9 * * *',
    cooldownHours: rule.cooldownHours ?? '',
    subject: t.subject || '',
    title: t.title || '',
    body: t.body || '',
    html: t.html || '',
    url: t.url || '',
    from: t.from || '',
    userTypes: a.userTypes || [],
    activeWithinDays: a.activeWithinDays ?? '',
    didEvent: a.didEvent?.event || '',
    didEventDays: a.didEvent?.withinDays ?? '',
    didNotEvent: a.didNotEvent?.event || '',
    didNotEventDays: a.didNotEvent?.withinDays ?? '',
    traits: (a.traits || []).map((tr) => ({ key: tr.key, value: String(tr.value ?? '') })),
  };
}

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

// Trait values typed in the form are strings; turn obvious numbers and
// booleans back into their types so they match what identify() stored.
const parseValue = (v) => (v === 'true' ? true : v === 'false' ? false : v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v);

function formToAudience(form) {
  return {
    userTypes: form.userTypes,
    activeWithinDays: numOrNull(form.activeWithinDays),
    didEvent: { event: form.didEvent || null, withinDays: numOrNull(form.didEventDays) },
    didNotEvent: { event: form.didNotEvent || null, withinDays: numOrNull(form.didNotEventDays) },
    traits: form.traits.filter((t) => t.key).map((t) => ({ key: t.key, value: parseValue(t.value) })),
  };
}

function formToTrigger(form) {
  const trigger = { type: form.triggerType };
  if (form.triggerType === 'event') trigger.event = form.event;
  if (form.triggerType === 'inactivity') trigger.inactivityDays = Number(form.inactivityDays);
  if (form.triggerType === 'schedule') trigger.cron = form.cron;
  return trigger;
}

function formToTemplate(form) {
  const email = form.channel === 'email';
  const push = form.channel === 'push';
  return {
    subject: email ? form.subject : null,
    title: push ? form.title : null,
    body: form.body,
    html: email ? form.html : null,
    url: email || push ? form.url : null,
    from: email ? form.from : null,
  };
}

function formToPayload(form) {
  return {
    name: form.name,
    channel: form.channel,
    trigger: formToTrigger(form),
    audience: formToAudience(form),
    cooldownHours: numOrNull(form.cooldownHours),
    template: formToTemplate(form),
  };
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function audienceSummary(a = {}) {
  const parts = [];
  if (a.userTypes?.length) parts.push(a.userTypes.join(' / '));
  if (a.activeWithinDays) parts.push(`active ${a.activeWithinDays}d`);
  if (a.didEvent?.event) parts.push(`did ${a.didEvent.event}${a.didEvent.withinDays ? ` (${a.didEvent.withinDays}d)` : ''}`);
  if (a.didNotEvent?.event) parts.push(`not ${a.didNotEvent.event}${a.didNotEvent.withinDays ? ` (${a.didNotEvent.withinDays}d)` : ''}`);
  (a.traits || []).forEach((t) => parts.push(`${t.key}=${t.value}`));
  return parts.length ? parts.join(', ') : 'Everyone';
}

function Section({ title, children, hint }) {
  return (
    <fieldset className="border border-base-300 rounded-box p-4 flex flex-col gap-3">
      <legend className="px-2 text-sm font-semibold">{title}</legend>
      {hint && <p className="text-xs text-base-content/60 -mt-1">{hint}</p>}
      {children}
    </fieldset>
  );
}

function RuleFormModal({ rule, catalog, deliveryMode, onClose, onSaved }) {
  const [form, setForm] = useState(ruleToForm(rule));
  const [previewId, setPreviewId] = useState('');
  const lastField = useRef('body');
  const fieldRefs = useRef({});
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const webhook = deliveryMode === 'webhook';

  const mutation = useMutation({
    mutationFn: () => (rule ? updateRule(rule._id, formToPayload(form)) : createRule(formToPayload(form))),
    onSuccess: onSaved,
  });

  const audienceKey = useDebounced(JSON.stringify({ audience: formToAudience(form), channel: form.channel }), 400);
  const audienceQuery = useQuery({
    queryKey: ['audience-count', audienceKey],
    queryFn: () => countAudience(JSON.parse(audienceKey)),
    enabled: form.triggerType !== 'event',
  });

  const preview = useMutation({
    mutationFn: () =>
      previewTemplate({ template: formToTemplate(form), trigger: formToTrigger(form), externalId: previewId || undefined }),
  });

  // Placeholders the author can click to insert where the cursor last was.
  const placeholders = [
    'user.username',
    'user.email',
    ...(catalog?.traits || []).filter((k) => !['username', 'email'].includes(k)).map((k) => `user.${k}`),
    ...(form.triggerType === 'event' ? (catalog?.properties?.[form.event] || []).map((k) => `properties.${k}`) : []),
    ...(form.triggerType === 'inactivity' ? ['inactivityDays'] : []),
  ];

  function insertPlaceholder(ph) {
    const field = lastField.current;
    const el = fieldRefs.current[field];
    const token = `{{${ph}}}`;
    const value = form[field] || '';
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    set({ [field]: value.slice(0, start) + token + value.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const textField = (name, props = {}) => ({
    ref: (el) => (fieldRefs.current[name] = el),
    value: form[name],
    onFocus: () => (lastField.current = name),
    onChange: (e) => set({ [name]: e.target.value }),
    ...props,
  });

  function toggleUserType(ut) {
    set({ userTypes: form.userTypes.includes(ut) ? form.userTypes.filter((x) => x !== ut) : [...form.userTypes, ut] });
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate();
  }

  const pv = preview.data?.content;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-3">{rule ? 'Edit rule' : 'New notification rule'}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mutation.isError && (
            <div className="alert alert-error text-sm">{mutation.error.response?.data?.error || 'Save failed'}</div>
          )}

          <datalist id="rule-events">
            {(catalog?.events || []).map((e) => (
              <option key={e.event} value={e.event}>{`${e.count} in 90d`}</option>
            ))}
          </datalist>

          <label className="form-control">
            <span className="label-text">Name</span>
            <input className="input input-bordered w-full" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
          </label>

          <Section title="When">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">Trigger</span>
                <select className="select select-bordered w-full" value={form.triggerType} onChange={(e) => set({ triggerType: e.target.value })}>
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              {form.triggerType === 'event' && (
                <label className="form-control">
                  <span className="label-text">Event name</span>
                  <input className="input input-bordered w-full" list="rule-events" placeholder="e.g. booking_completed" value={form.event} onChange={(e) => set({ event: e.target.value })} required />
                </label>
              )}
              {form.triggerType === 'inactivity' && (
                <label className="form-control">
                  <span className="label-text">Not seen for (days)</span>
                  <input type="number" min="1" className="input input-bordered w-full" value={form.inactivityDays} onChange={(e) => set({ inactivityDays: e.target.value })} required />
                </label>
              )}
              {form.triggerType === 'schedule' && (
                <label className="form-control">
                  <span className="label-text">Cron expression (server time)</span>
                  <input className="input input-bordered w-full font-mono" value={form.cron} onChange={(e) => set({ cron: e.target.value })} required />
                </label>
              )}
            </div>
            <p className="text-xs text-base-content/60">
              {form.triggerType === 'event' && 'Sent to the user who did the event, if they match the audience below.'}
              {form.triggerType === 'broadcast' && 'Sent to the whole audience when you press "Send now" on the rules list.'}
              {form.triggerType === 'schedule' && 'Sent to the whole audience on every cron tick.'}
              {form.triggerType === 'inactivity' && 'Checked daily. Each inactive user in the audience gets it once per inactivity window.'}
            </p>
            <label className="form-control sm:w-1/2">
              <span className="label-text">Cooldown per user (hours, optional)</span>
              <input type="number" min="1" className="input input-bordered w-full" placeholder="no limit" value={form.cooldownHours} onChange={(e) => set({ cooldownHours: e.target.value })} />
            </label>
          </Section>

          <Section title="Who" hint="All conditions must match. Leave everything empty to reach every user.">
            {catalog?.userTypes?.length > 0 && (
              <div>
                <span className="label-text">User type</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {catalog.userTypes.map((ut) => (
                    <label key={ut} className="label cursor-pointer gap-2 border border-base-300 rounded-btn px-3 py-1">
                      <input type="checkbox" className="checkbox checkbox-sm" checked={form.userTypes.includes(ut)} onChange={() => toggleUserType(ut)} />
                      <span className="text-sm">{ut}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="form-control">
                <span className="label-text">Active within (days)</span>
                <input type="number" min="1" className="input input-bordered input-sm w-full" value={form.activeWithinDays} onChange={(e) => set({ activeWithinDays: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text">Did event</span>
                <input className="input input-bordered input-sm w-full" list="rule-events" value={form.didEvent} onChange={(e) => set({ didEvent: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text">…within (days)</span>
                <input type="number" min="1" className="input input-bordered input-sm w-full" placeholder="ever" value={form.didEventDays} onChange={(e) => set({ didEventDays: e.target.value })} />
              </label>
              <div />
              <label className="form-control">
                <span className="label-text">Did NOT do event</span>
                <input className="input input-bordered input-sm w-full" list="rule-events" value={form.didNotEvent} onChange={(e) => set({ didNotEvent: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text">…within (days)</span>
                <input type="number" min="1" className="input input-bordered input-sm w-full" placeholder="ever" value={form.didNotEventDays} onChange={(e) => set({ didNotEventDays: e.target.value })} />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-text">Trait equals</span>
              {form.traits.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input input-bordered input-sm flex-1" list="rule-traits" placeholder="trait" value={t.key} onChange={(e) => set({ traits: form.traits.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} />
                  <input className="input input-bordered input-sm flex-1" placeholder="value" value={t.value} onChange={(e) => set({ traits: form.traits.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ traits: form.traits.filter((_, j) => j !== i) })}>✕</button>
                </div>
              ))}
              <datalist id="rule-traits">
                {(catalog?.traits || []).map((k) => <option key={k} value={k} />)}
              </datalist>
              <button type="button" className="btn btn-ghost btn-xs self-start" onClick={() => set({ traits: [...form.traits, { key: '', value: '' }] })}>+ Add trait condition</button>
            </div>
            {form.triggerType !== 'event' && (
              <div className="text-sm">
                {audienceQuery.isFetching ? (
                  <span className="loading loading-dots loading-xs" />
                ) : audienceQuery.data ? (
                  <span>
                    Reaches <b>{audienceQuery.data.count}</b> user{audienceQuery.data.count === 1 ? '' : 's'}
                    {!webhook && form.channel !== 'sms' && ` with ${form.channel === 'email' ? 'an email' : 'a push token'} on file`}
                    {!webhook && form.channel === 'sms' && ' with a phone on file'}
                  </span>
                ) : audienceQuery.isError ? (
                  <span className="text-error">{audienceQuery.error.response?.data?.error || 'Could not count audience'}</span>
                ) : null}
              </div>
            )}
          </Section>

          <Section title="Message">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text">Channel</span>
                <select className="select select-bordered w-full" value={form.channel} onChange={(e) => set({ channel: e.target.value })}>
                  <option value="email">Email</option>
                  <option value="push">Push notification</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              {form.channel === 'email' && webhook && (
                <label className="form-control">
                  <span className="label-text">Send from (mailbox key)</span>
                  <input className="input input-bordered w-full" placeholder="default mailbox" value={form.from} onChange={(e) => set({ from: e.target.value })} />
                </label>
              )}
            </div>

            <div>
              <span className="label-text">Personalise: click to insert at the cursor. Add a fallback with <code>{'{{user.username | there}}'}</code>.</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {placeholders.map((ph) => (
                  <button key={ph} type="button" className="badge badge-outline hover:badge-primary cursor-pointer font-mono text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => insertPlaceholder(ph)}>
                    {ph}
                  </button>
                ))}
              </div>
            </div>

            {form.channel === 'email' && (
              <label className="form-control">
                <span className="label-text">Subject</span>
                <input className="input input-bordered w-full" {...textField('subject')} required />
              </label>
            )}
            {form.channel === 'push' && (
              <label className="form-control">
                <span className="label-text">Title</span>
                <input className="input input-bordered w-full" {...textField('title')} required />
              </label>
            )}
            <label className="form-control">
              <span className="label-text">{form.channel === 'email' ? 'Text' : 'Message'}</span>
              <textarea className="textarea textarea-bordered w-full" rows={4} {...textField('body')} required />
            </label>
            {form.channel === 'email' && (
              <label className="form-control">
                <span className="label-text">HTML (optional; without it the text is sent as simple HTML)</span>
                <textarea className="textarea textarea-bordered w-full font-mono text-xs" rows={5} {...textField('html')} />
              </label>
            )}
            {form.channel !== 'sms' && (
              <label className="form-control">
                <span className="label-text">{form.channel === 'push' ? 'Link opened on tap (optional)' : 'Button link (optional)'}</span>
                <input className="input input-bordered w-full" placeholder="https://" {...textField('url')} />
              </label>
            )}
          </Section>

          <Section title="Preview" hint="Renders with a real user's data. Nothing is sent.">
            <div className="flex gap-2">
              <input className="input input-bordered input-sm flex-1" placeholder="externalId (default: most recent user)" value={previewId} onChange={(e) => setPreviewId(e.target.value)} />
              <button type="button" className="btn btn-sm" disabled={!form.body || preview.isPending} onClick={() => preview.mutate()}>
                {preview.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Preview'}
              </button>
            </div>
            {preview.isError && <div className="text-error text-sm">{preview.error.response?.data?.error || 'Preview failed'}</div>}
            {pv && (
              <div className="border border-base-300 rounded-box p-3 text-sm flex flex-col gap-1">
                <div className="text-xs text-base-content/60">For {preview.data.externalId}</div>
                {form.channel === 'email' && <div><b>Subject:</b> {pv.subject}</div>}
                {form.channel === 'push' && <div><b>{pv.title}</b></div>}
                {pv.html ? (
                  <iframe title="Email preview" sandbox="" srcDoc={pv.html} className="w-full h-56 bg-white rounded" />
                ) : (
                  <div className="whitespace-pre-wrap">{pv.body}</div>
                )}
                {pv.url && <div className="text-xs"><b>Link:</b> {pv.url}</div>}
              </div>
            )}
          </Section>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
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
  const { data: catalog } = useQuery({ queryKey: ['notification-catalog'], queryFn: getCatalog });
  const { data: delivery } = useQuery({ queryKey: ['notification-delivery'], queryFn: getDeliveryMode });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      showToast('Rule deleted', 'success');
    },
  });

  const activeMutation = useMutation({
    mutationFn: (rule) => updateRule(rule._id, { active: !rule.active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  const sendMutation = useMutation({
    mutationFn: sendRuleNow,
    onSuccess: (res) => {
      showToast(`Sending to ${res.matched} user${res.matched === 1 ? '' : 's'}`, 'success');
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['rules'] }), 3000);
    },
    onError: (err) => showToast(err.response?.data?.error || 'Send failed', 'error'),
  });

  function handleSaved() {
    setModalRule(undefined);
    queryClient.invalidateQueries({ queryKey: ['rules'] });
    showToast('Rule saved', 'success');
  }

  function handleSend(rule) {
    if (window.confirm(`Send "${rule.name}" to its audience now?`)) sendMutation.mutate(rule._id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Notification Rules</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModalRule(null)}>New rule</button>
      </div>
      {delivery && (
        <p className="text-sm text-base-content/60 mb-4">
          {delivery.mode === 'webhook'
            ? 'Messages are delivered by your own app through its webhook.'
            : 'Messages are delivered by MarcoPolo email, push and SMS.'}
        </p>
      )}

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
                <th>Audience</th>
                <th>Channel</th>
                <th>Last run</th>
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
                    {rule.trigger.type === 'broadcast' && 'broadcast'}
                    {rule.cooldownHours ? <span className="text-base-content/50"> · {rule.cooldownHours}h cooldown</span> : null}
                  </td>
                  <td className="text-sm max-w-xs truncate" title={audienceSummary(rule.audience)}>{audienceSummary(rule.audience)}</td>
                  <td className="capitalize">{rule.channel}</td>
                  <td className="text-xs">
                    {rule.lastRun?.at ? (
                      <>
                        {new Date(rule.lastRun.at).toLocaleString()}
                        <br />
                        <span className="text-success">{rule.lastRun.sent} sent</span>
                        {rule.lastRun.failed > 0 && <span className="text-error"> · {rule.lastRun.failed} failed</span>}
                        {rule.lastRun.skipped > 0 && <span className="text-base-content/50"> · {rule.lastRun.skipped} skipped</span>}
                      </>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    <input type="checkbox" className="toggle toggle-success toggle-sm" checked={rule.active} disabled={activeMutation.isPending} onChange={() => activeMutation.mutate(rule)} />
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {['broadcast', 'schedule'].includes(rule.trigger.type) && (
                      <button type="button" className="btn btn-primary btn-xs mr-1" disabled={!rule.active || sendMutation.isPending} onClick={() => handleSend(rule)}>
                        Send now
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalRule(rule)}>Edit</button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => window.confirm(`Delete "${rule.name}"?`) && deleteMutation.mutate(rule._id)}
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
        <RuleFormModal
          rule={modalRule}
          catalog={catalog}
          deliveryMode={delivery?.mode}
          onClose={() => setModalRule(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
