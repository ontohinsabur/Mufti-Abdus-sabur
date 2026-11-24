import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SupportForm from '@/components/SupportForm';
import WaButton from '@/components/WaButton';
import { bnDate } from '@/lib/format';

export default async function Support() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/support');
  const [{ data: tickets }, { data: orders }, { data: biz }] = await Promise.all([
    supabase.from('support_tickets').select('*').order('last_message_at', { ascending: false }),
    supabase.from('orders').select('id, order_no, service_name').order('created_at', { ascending: false }).limit(30),
    supabase.from('settings').select('value').eq('key', 'business').maybeSingle(),
  ]);
  return (
    <>
      <TopBar profile={profile} active="/support" />
      <main className="wrap narrow">
        <h1>সাপোর্ট</h1>
        <p className="muted">যেকোনো প্রশ্ন বা সমস্যা লিখুন, উত্তর এলে নোটিফিকেশন পাবেন। জরুরি হলে হোয়াটসঅ্যাপ করুন।</p>
        <p><WaButton number={biz?.value?.phone} business={false} label="হোয়াটসঅ্যাপে মেসেজ" className="btn ok" /></p>
        <h2>নতুন প্রশ্ন</h2>
        <SupportForm newTicket orders={orders || []} />
        <h2>আগের আলোচনা</h2>
        <div className="list">
          {!tickets?.length && <p className="muted">এখনো কোনো আলোচনা নেই।</p>}
          {(tickets || []).map((t) => (
            <Link key={t.id} href={`/support/${t.id}`} className="row" style={{ color: 'inherit' }}><div><b>{t.subject}</b><div className="muted">{bnDate(t.last_message_at)}</div></div>
              <span className={`badge ${t.status === 'open' ? 'running' : 'off'}`}>{t.status === 'open' ? 'চলমান' : 'বন্ধ'}</span></Link>
          ))}
        </div>
      </main>
    </>
  );
}
