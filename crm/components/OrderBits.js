'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

export function CopyText({ text, label = 'কপি', done = 'কপি হয়েছে', className = 'od-btn', icon = 'copy' }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove();
    }
    setOk(true); setTimeout(() => setOk(false), 1600);
  }
  return <button type="button" className={className} onClick={copy}><Icon name={ok ? 'check' : icon} size={18} />{ok ? done : label}</button>;
}

export function ShareLink({ url, title, className = 'od-btn' }) {
  const [ok, setOk] = useState(false);
  async function share() {
    const full = new URL(url, location.origin).href;
    try { if (navigator.share) { await navigator.share({ title, url: full }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(full); setOk(true); setTimeout(() => setOk(false), 1600); } catch {}
  }
  return <button type="button" className={className} onClick={share}><Icon name={ok ? 'check' : 'link'} size={18} />{ok ? 'লিংক কপি হয়েছে' : 'শেয়ার'}</button>;
}

// Facebook post preview card (picture, page name, text) from our link-preview route
export function PostPreview({ url }) {
  const [d, setD] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let off = false;
    fetch('/api/link-preview?url=' + encodeURIComponent(url)).then((r) => r.json()).then((x) => { if (!off) { setD(x); setState(x.title || x.image ? 'ok' : 'none'); } }).catch(() => !off && setState('none'));
    return () => { off = true; };
  }, [url]);
  return (
    <div className="pp">
      {state === 'loading' && <div className="pp-box empty">প্রিভিউ লোড হচ্ছে…</div>}
      {state === 'none' && <div className="pp-box empty">এই পোস্টের প্রিভিউ পাওয়া যায়নি (পোস্টটি প্রাইভেট বা মুছে ফেলা হতে পারে)।</div>}
      {state === 'ok' && (
        <a className="pp-box" href={url} target="_blank" rel="noopener noreferrer">
          {d.image && <span className="pp-img"><img src={d.image} alt="" referrerPolicy="no-referrer" /><i className="oc-play" /></span>}
          <span className="pp-t"><small>FACEBOOK</small><b>{d.page_name || d.title}</b>{d.description && <em>{d.description.slice(0, 220)}{d.description.length > 220 ? '…' : ''}</em>}</span>
        </a>
      )}
      <div className="pp-btns">
        <a className="od-btn" href={url} target="_blank" rel="noopener noreferrer">ফেসবুক পোস্ট খুলুন</a>
        <CopyText text={url} label="লিংক কপি" icon="link" />
      </div>
    </div>
  );
}
