'use client';
import { useState } from 'react';
import Icon from './Icon';

export default function CopyButton({ text, className = 'oc-ic', title = 'লিংক কপি' }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch {} t.remove();
    }
    setOk(true); setTimeout(() => setOk(false), 1600);
  }
  return <button type="button" className={`${className} ${ok ? 'ok' : ''}`} onClick={copy} title={ok ? 'কপি হয়েছে' : title} aria-label={title}><Icon name={ok ? 'check' : 'copy'} size={20} /></button>;
}
