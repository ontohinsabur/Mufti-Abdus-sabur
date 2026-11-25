'use client';
import { useEffect, useState } from 'react';

// The "এড রানিং" step bar fills up slowly from run start to run end.
export default function RunBar({ start, end, paused }) {
  const calc = () => {
    const s = new Date(start).getTime(), e = new Date(end).getTime();
    const now = paused ? new Date(paused).getTime() : Date.now();
    if (!s || !e || e <= s) return 0;
    return Math.max(0, Math.min(100, ((now - s) / (e - s)) * 100));
  };
  const [p, setP] = useState(calc);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setP(calc()), 30000);
    return () => clearInterval(t);
  }, [start, end, paused]); // eslint-disable-line
  return <i className="run" title={`${Math.floor(p)}% সময় পার হয়েছে`}><u style={{ width: `${p}%` }} /></i>;
}
