'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

// "অ্যাপ ইনস্টল" button: Android/PC uses the browser's install prompt, iPhone gets a short how-to.
export default function InstallApp() {
  const [evt, setEvt] = useState(null);
  const [ios, setIos] = useState(false);
  const [tip, setTip] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) return;
    try { navigator.serviceWorker?.register('/sw.js'); } catch {}
    const h = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) setIos(true);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (!evt && !ios) return null;
  async function go() {
    if (evt) { evt.prompt(); await evt.userChoice.catch(() => {}); setEvt(null); } else setTip(!tip);
  }
  return (
    <span className="install-wrap">
      <button type="button" className="icon-btn install" onClick={go} aria-label="অ্যাপ ইনস্টল করুন" title="অ্যাপ ইনস্টল করুন"><Icon name="download" /></button>
      {tip && <span className="install-tip">Safari-তে নিচের <b>Share ⬆</b> চেপে <b>Add to Home Screen</b> বেছে নিন।</span>}
    </span>
  );
}
