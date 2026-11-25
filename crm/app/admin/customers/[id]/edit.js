'use client';
import { useActionState, useState } from 'react';
import { updateCustomer } from '../../actions';

export default function CustomerEdit({ c }) {
  const [s, act, busy] = useActionState(updateCustomer, null);
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <div className="panel-h" style={{ marginBottom: open ? 12 : 0 }}><h2 style={{ margin: 0 }}>অ্যাকাউন্টের তথ্য</h2>
        <button type="button" className="btn sm ghost" onClick={() => setOpen(!open)}>{open ? 'বন্ধ করুন' : '✏️ এডিট'}</button></div>
      {open && (
        <form action={act}>
          {s?.err && <div className="alert err">{s.err}</div>}{s?.ok && <div className="alert ok">{s.ok}</div>}
          <input type="hidden" name="id" value={c.id} />
          <label>নাম</label><input name="full_name" defaultValue={c.full_name || ''} />
          <label>মোবাইল</label><input name="phone" defaultValue={c.phone || ''} inputMode="tel" />
          <label>WhatsApp নম্বর <span className="muted">(মোবাইল থেকে আলাদা হলে)</span></label><input name="whatsapp" defaultValue={c.whatsapp || ''} inputMode="tel" />
          <label>অ্যাডমিন নোট <span className="muted">(শুধু আপনি দেখবেন)</span></label><textarea name="note" rows={2} defaultValue={c.note || ''} />
          <p className="muted" style={{ marginTop: 8 }}>ইমেইল: {c.email} (লগইনের ইমেইল কাস্টমার নিজে বদলাতে পারবেন)</p>
          <button className="btn block" disabled={busy}>সংরক্ষণ</button>
        </form>
      )}
    </div>
  );
}
