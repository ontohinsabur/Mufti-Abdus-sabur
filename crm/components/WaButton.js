'use client';
import { waNumber } from '@/lib/wa';

// For the admin: on Android open WhatsApp Business (com.whatsapp.w4b) directly; elsewhere fall back to wa.me
export default function WaButton({ number, text, label = 'WhatsApp', business = true, className = 'btn sm ok' }) {
  const n = waNumber(number);
  if (!n) return null;
  const web = `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  function open(e) {
    if (!business || !/Android/i.test(navigator.userAgent)) return;
    e.preventDefault();
    const q = [`phone=${n}`]; if (text) q.push(`text=${encodeURIComponent(text)}`);
    location.href = `intent://send/?${q.join('&')}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${encodeURIComponent(web)};end`;
  }
  return <a href={web} onClick={open} target="_blank" rel="noopener noreferrer" className={className}>🟢 {label}</a>;
}
