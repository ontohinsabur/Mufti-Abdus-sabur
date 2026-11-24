'use client';
import { useActionState } from 'react';
import { publish } from './actions';
export default function NoticeForm() {
  const [s, act, busy] = useActionState(publish, null);
  return (
    <form action={act} className="card">
      <h2>নতুন নোটিশ</h2>
      {s?.err && <div className="alert err">{s.err}</div>}{s?.ok && <div className="alert ok">{s.ok}</div>}
      <label>শিরোনাম</label><input name="title" />
      <label>বিবরণ</label><textarea name="body" rows={5} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="notify" defaultChecked style={{ width: 'auto' }} /> সব অনুমোদিত গ্রাহককে নোটিফিকেশন পাঠান</label>
      <button className="btn block" disabled={busy}>প্রকাশ করুন</button>
    </form>
  );
}
