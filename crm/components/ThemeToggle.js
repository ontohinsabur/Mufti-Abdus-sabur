'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function ThemeToggle() {
  const [t, setT] = useState(null);
  useEffect(() => { setT(document.documentElement.dataset.theme || 'dark'); }, []);
  function flip() {
    const n = t === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('theme', n); } catch {}
    setT(n);
  }
  return (
    <button type="button" className="icon-btn sun" onClick={flip} aria-label={t === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}>
      <Icon name={t === 'light' ? 'moon' : 'sun'} />
    </button>
  );
}
