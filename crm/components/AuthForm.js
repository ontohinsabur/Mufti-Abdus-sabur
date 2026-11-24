'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const MSG = {
  'Invalid login credentials': 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।',
  'Email not confirmed': 'আপনার ইমেইল এখনো নিশ্চিত করা হয়নি। ইমেইলে পাঠানো লিংকে চাপুন।',
  'User already registered': 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। লগইন করুন।',
};
const bn = (m) => MSG[m] || (m?.includes('Password') ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : m);

export default function AuthForm({ mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true);
    try {
      if (mode === 'register') {
        if (!f.name.trim()) throw new Error('আপনার নাম লিখুন।');
        if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ''))) throw new Error('সঠিক মোবাইল নম্বর লিখুন (যেমন 01XXXXXXXXX)।');
        const { data, error } = await supabase.auth.signUp({
          email: f.email.trim(), password: f.password,
          options: { data: { full_name: f.name.trim(), phone: f.phone.trim() }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) { setOk('অ্যাকাউন্ট খোলা হয়েছে! আপনার ইমেইলে একটি লিংক পাঠানো হয়েছে, সেটায় চেপে ইমেইল নিশ্চিত করুন।'); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) throw error;
      }
      router.replace('/'); router.refresh();
    } catch (e2) { setErr(bn(e2.message)); } finally { setBusy(false); }
  }

  async function google() {
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) setErr('Google দিয়ে লগইন এখনো চালু করা হয়নি। ইমেইল দিয়ে চেষ্টা করুন।');
  }

  async function reset() {
    setErr(''); setOk('');
    if (!f.email.trim()) { setErr('আগে আপনার ইমেইল লিখুন, তারপর এখানে চাপুন।'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/profile` });
    if (error) setErr(bn(error.message)); else setOk('পাসওয়ার্ড বদলানোর লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
  }

  const reg = mode === 'register';
  return (
    <div className="wrap narrow">
      <div className="center" style={{ margin: '24px 0' }}>
        <span className="brand-mark" style={{ display: 'inline-grid', width: 56, height: 56, fontSize: 28, color: '#fff' }}>M</span>
        <h1 style={{ marginTop: 12 }}>{reg ? 'নতুন অ্যাকাউন্ট খুলুন' : 'আবার স্বাগতম'}</h1>
        <p className="muted">{reg ? 'অর্ডার, পেমেন্ট আর হিসাব দেখতে রেজিস্ট্রেশন করুন।' : 'আপনার অর্ডার ও হিসাব দেখতে লগইন করুন।'}</p>
      </div>
      <form className="card" onSubmit={submit}>
        {err && <div className="alert err">{err}</div>}
        {ok && <div className="alert ok">{ok}</div>}
        {reg && <>
          <label>আপনার নাম</label><input value={f.name} onChange={set('name')} autoComplete="name" />
          <label>মোবাইল নম্বর</label><input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="01XXXXXXXXX" />
        </>}
        <label>ইমেইল</label><input type="email" value={f.email} onChange={set('email')} autoComplete="email" required />
        <label>পাসওয়ার্ড</label><input type="password" value={f.password} onChange={set('password')} autoComplete={reg ? 'new-password' : 'current-password'} required minLength={6} />
        <button className="btn block" disabled={busy}>{busy ? 'অপেক্ষা করুন…' : reg ? 'রেজিস্ট্রেশন করুন' : 'লগইন'}</button>
        <button type="button" className="btn block ghost" onClick={google}>Google দিয়ে {reg ? 'রেজিস্ট্রেশন' : 'লগইন'}</button>
        <p className="center muted" style={{ marginTop: 16 }}>
          {reg ? <>আগেই অ্যাকাউন্ট আছে? <Link href="/login">লগইন করুন</Link></>
               : <>নতুন গ্রাহক? <Link href="/register">অ্যাকাউন্ট খুলুন</Link> · <a href="#" onClick={(e) => { e.preventDefault(); reset(); }}>পাসওয়ার্ড ভুলে গেছেন?</a></>}
        </p>
      </form>
    </div>
  );
}
