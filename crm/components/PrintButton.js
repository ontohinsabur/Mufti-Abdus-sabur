'use client';
export default function PrintButton({ label = '⬇ Download / Print PDF' }) { return <button type="button" className="btn" onClick={() => window.print()}>{label}</button>; }
