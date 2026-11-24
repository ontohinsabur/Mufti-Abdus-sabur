'use client';
import { useActionState } from 'react';
import { saveProfile, addPage } from './actions';

function Msg({ s }) { return s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null; }

export function ProfileForm({ profile }) {
  const [s, act, busy] = useActionState(saveProfile, null);
  return (
    <form action={act} className="card">
      <h2>আপনার তথ্য</h2><Msg s={s} />
      <label>নাম</label><input name="full_name" defaultValue={profile.full_name} />
      <label>ইমেইল</label><input defaultValue={profile.email} disabled />
      <label>মোবাইল</label><input name="phone" defaultValue={profile.phone || ''} inputMode="tel" />
      <label>হোয়াটসঅ্যাপ নম্বর</label><input name="whatsapp" defaultValue={profile.whatsapp || ''} inputMode="tel" />
      <label>নতুন পাসওয়ার্ড <span className="muted">(বদলাতে না চাইলে ফাঁকা রাখুন)</span></label><input name="password" type="password" autoComplete="new-password" />
      <button className="btn block" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ করুন'}</button>
    </form>
  );
}

export function AddPageForm() {
  const [s, act, busy] = useActionState(addPage, null);
  return (
    <form action={act}>
      <Msg s={s} />
      <label>পেজের নাম</label><input name="name" placeholder="যেমন: আমার শপ" />
      <label>পেজের লিংক <span className="muted">(ঐচ্ছিক)</span></label><input name="url" placeholder="https://facebook.com/..." />
      <button className="btn block" disabled={busy}>পেজ যোগ করুন</button>
    </form>
  );
}
