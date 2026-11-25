'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Live notifications while the app is open: a short "ting" + a pop-up at the top of the screen.
let ctx;
function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}
export function ting() {
  try {
    unlockAudio(); if (!ctx) return;
    const t = ctx.currentTime;
    [[1318.5, 0], [1760, 0.09]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.45);
      o.connect(g).connect(ctx.destination); o.start(t + d); o.stop(t + d + 0.5);
    });
  } catch {}
  try { navigator.vibrate?.([120, 60, 120]); } catch {}
}

export default function NotifyLive({ userId }) {
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const seen = useRef(new Set());

  useEffect(() => {
    const u = () => unlockAudio();
    window.addEventListener('pointerdown', u, { once: true });
    window.addEventListener('keydown', u, { once: true });
    return () => { window.removeEventListener('pointerdown', u); window.removeEventListener('keydown', u); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const show = (n) => {
      if (!n?.id || seen.current.has(n.id)) return;
      seen.current.add(n.id);
      ting();
      setToasts((t) => [...t.slice(-2), n]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 7000);
      router.refresh();
    };
    const ch = supabase.channel(`notif-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (p) => show(p.new))
      .subscribe();
    // the service worker tells us about pushes too (covers a dropped realtime connection)
    const onMsg = (e) => { if (e.data?.type === 'push' && e.data.n) show(e.data.n); };
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => { supabase.removeChannel(ch); navigator.serviceWorker?.removeEventListener('message', onMsg); };
  }, [userId]); // eslint-disable-line

  if (!toasts.length) return null;
  return (
    <div className="ntoasts" role="status" aria-live="polite">
      {toasts.map((n) => (
        <a key={n.id} href={n.url || '/notifications'} className="ntoast" onClick={() => setToasts((t) => t.filter((x) => x.id !== n.id))}>
          <span className="ntoast-ic">🔔</span>
          <span className="ntoast-t"><b>{n.title}</b>{n.body && <small>{n.body}</small>}</span>
          <button type="button" aria-label="বন্ধ" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToasts((t) => t.filter((x) => x.id !== n.id)); }}>×</button>
        </a>
      ))}
    </div>
  );
}
