'use client';
import { useEffect, useRef, useState } from 'react';
import VerifiedBadge from './VerifiedBadge';
import { bnNum } from '@/lib/format';

function useOutside(ref, close) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [ref, close]);
}
const ini = (s) => (s || '?').trim().slice(0, 2).toUpperCase();

// Searchable customer chooser (name, mobile or email), like the old CRM.
export function CustomerPicker({ customers, value, onChange, summary }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false));
  const sel = customers.find((c) => c.id === value);
  const k = q.trim().toLowerCase();
  const list = customers.filter((c) => !k || [c.full_name, c.email, c.phone].some((x) => (x || '').toLowerCase().includes(k))).slice(0, 50);
  return (
    <div className="pk" ref={box}>
      <input className="pk-search" value={open ? q : sel ? `${sel.full_name || sel.email}` : q} onFocus={() => { setOpen(true); setQ(''); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} placeholder="🔍 নাম, মোবাইল বা ইমেইল দিয়ে কাস্টমার খুঁজুন" />
      {open && (
        <div className="pk-menu">
          {list.length === 0 && <p className="muted" style={{ padding: 12, margin: 0 }}>কোনো কাস্টমার পাওয়া যায়নি।</p>}
          {list.map((c) => (
            <button type="button" key={c.id} className={c.id === value ? 'on' : ''} onClick={() => { onChange(c.id); setOpen(false); setQ(''); }}>
              <span className="pk-av">{ini(c.full_name || c.email)}</span>
              <span className="pk-t"><b>{c.full_name || c.email}<VerifiedBadge profile={c} size={14} /></b><small>{[c.phone, c.email].filter(Boolean).join(' · ')}</small></span>
            </button>
          ))}
        </div>
      )}
      {sel && (
        <div className="pk-card">
          <span className="pk-av lg">{ini(sel.full_name || sel.email)}</span>
          <span className="pk-t"><b>{sel.full_name || sel.email}<VerifiedBadge profile={sel} size={16} /></b><small>{[sel.phone, sel.email].filter(Boolean).join(' · ')}</small></span>
          <span className="pk-tags">
            {summary?.pay_later_enabled ? <em className="pl">Pay Later চালু</em> : <em>শুধু পুরো পেমেন্ট</em>}
            {Number(summary?.due || 0) > 0 && <em className="due">বাকি ৳{bnNum(summary.due)}</em>}
            {Number(summary?.wallet || 0) > 0 && <em className="ok">ব্যালেন্স ৳{bnNum(summary.wallet)}</em>}
          </span>
        </div>
      )}
    </div>
  );
}

// Service dropdown showing each service with its price.
export function ServicePicker({ services, value, onChange, priceOf }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false));
  const cur = services.find((s) => s.id === value);
  return (
    <div className="pk" ref={box}>
      <button type="button" className="pk-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="pk-t"><b>{cur ? cur.name : 'সার্ভিস বেছে নিন'}</b>{cur && <small>{priceOf(cur)}{cur.description ? ` · ${cur.description}` : ''}</small>}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="pk-menu">
          {services.map((s) => (
            <button type="button" key={s.id} className={s.id === value ? 'on' : ''} onClick={() => { onChange(s.id); setOpen(false); }}>
              <span className="pk-t"><b>{s.name}</b>{s.description && <small>{s.description}</small>}</span>
              <em className="pk-price">{priceOf(s)}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
