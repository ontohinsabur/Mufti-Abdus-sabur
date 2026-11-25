import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import { setStatus } from '../actions';

const TABS = [['pending', 'অপেক্ষমাণ'], ['approved', 'অনুমোদিত'], ['rejected', 'বাতিল'], ['all', 'সবাই']];

export default async function Customers({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  let status = sp?.status;
  if (!status) {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer').eq('status', 'pending');
    status = count ? 'pending' : 'approved';
  }
  const q = (sp?.q || '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
  let query = supabase.from('profiles').select('*, facebook_pages(count)').eq('role', 'customer').order('created_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: rows } = await query;
  const Btn = ({ id, to, cls, children }) => (
    <form action={setStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} /><button className={`btn sm ${cls}`}>{children}</button></form>
  );
  return (
    <>
      <TopBar profile={profile} active="/admin/customers" />
      <main className="wrap">
        <h1>গ্রাহক</h1>
        <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={`/admin/customers?status=${k}`} className={status === k ? 'active' : ''}>{l}</Link>)}</div>
        <form style={{ marginBottom: 12 }}><input type="hidden" name="status" value={status} /><input name="q" defaultValue={q} placeholder="নাম, ইমেইল বা মোবাইল দিয়ে খুঁজুন" /></form>
        <div className="list">
          {(rows || []).length === 0 && <p className="muted">এই তালিকায় কেউ নেই।</p>}
          {(rows || []).map((c) => (
            <div className="row" key={c.id}>
              <div>
                <Link href={`/admin/customers/${c.id}`}><b>{c.full_name || '(নাম নেই)'}</b></Link> <StatusBadge status={c.status} />
                <div className="muted">{c.email}{c.phone ? ` · ${c.phone}` : ''} · পেজ: {(c.facebook_pages?.[0]?.count || 0).toLocaleString('bn-BD')}</div>
                <div className="muted">যোগ দিয়েছেন: {new Date(c.created_at).toLocaleDateString('bn-BD')}</div>
              </div>
              <div className="actions">
                {c.status !== 'approved' && <Btn id={c.id} to="approved" cls="ok">✔ অনুমোদন দিন</Btn>}
                {c.status !== 'rejected' && <Btn id={c.id} to="rejected" cls="bad">বাতিল</Btn>}
                {c.status !== 'pending' && <Btn id={c.id} to="pending" cls="ghost">অপেক্ষমাণে রাখুন</Btn>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
