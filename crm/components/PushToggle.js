'use client';
import { useEffect, useState } from 'react';
import { saveSubscription, removeSubscription, vapidKey, sendTest } from '@/app/notifications/actions';

const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };

export default function PushToggle() {
  const [state, setState] = useState('loading'); // loading | unsupported | denied | off | on
  const [msg, setMsg] = useState('');
  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState(/iPhone|iPad/.test(navigator.userAgent) ? 'ios' : 'unsupported');
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      setState(Notification.permission === 'denied' ? 'denied' : sub ? 'on' : 'off');
    })().catch(() => setState('unsupported'));
  }, []);
  async function enable() {
    setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState('denied');
      const reg = await navigator.serviceWorker.ready;
      const key = await vapidKey();
      if (!key) return setMsg('নোটিফিকেশন সার্ভার এখনো প্রস্তুত নয়, একটু পরে চেষ্টা করুন।');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const r = await saveSubscription(JSON.parse(JSON.stringify(sub)), navigator.userAgent);
      if (r?.err) return setMsg('সংরক্ষণ করা যায়নি: ' + r.err);
      setState('on');
    } catch (e) { setMsg('চালু করা যায়নি: ' + e.message); }
  }
  async function disable() {
    const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
    if (sub) { await removeSubscription(sub.endpoint); await sub.unsubscribe(); }
    setState('off');
  }
  async function test() { const r = await sendTest(); setMsg(r.err || r.ok); }
  return (
    <div className="card">
      <h2>🔔 মোবাইলে নোটিফিকেশন</h2>
      {state === 'on' && <><p className="muted">এই ডিভাইসে নোটিফিকেশন চালু আছে।</p><button className="btn sm" onClick={test}>টেস্ট পাঠান</button>{' '}<button className="btn sm ghost" onClick={disable}>বন্ধ করুন</button></>}
      {state === 'off' && <><p className="muted">অর্ডার, পেমেন্ট আর উত্তর এলে সাথে সাথে ফোনে জানতে চালু করুন।</p><button className="btn" onClick={enable}>নোটিফিকেশন চালু করুন</button></>}
      {state === 'denied' && <p className="muted">ব্রাউজারে নোটিফিকেশন বন্ধ করা আছে। ব্রাউজারের সাইট সেটিং থেকে Notifications "Allow" করে পেজটা আবার খুলুন।</p>}
      {state === 'ios' && <p className="muted">iPhone-এ নোটিফিকেশন পেতে Safari-তে Share → "Add to Home Screen" দিয়ে অ্যাপটি ইনস্টল করুন, তারপর অ্যাপ থেকে এখানে চালু করুন।</p>}
      {state === 'unsupported' && <p className="muted">এই ব্রাউজারে পুশ নোটিফিকেশন চলে না। Chrome ব্যবহার করুন।</p>}
      {msg && <div className="alert warn" style={{ marginTop: 10 }}>{msg}</div>}
    </div>
  );
}
