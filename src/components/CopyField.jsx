import { useState } from 'react';

export default function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <label className="form-control">
      <span className="label-text">{label}</span>
      <div className="join w-full">
        <input type="text" readOnly value={value} className="input input-bordered join-item w-full font-mono text-sm" />
        <button type="button" className="btn join-item" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </label>
  );
}
