import { useState } from 'react';

export default function JsonBlock({ value }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(value, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button type="button" className="btn btn-xs absolute top-2 right-2" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="bg-base-200 rounded-box p-3 text-xs font-mono overflow-x-auto">{text}</pre>
    </div>
  );
}
