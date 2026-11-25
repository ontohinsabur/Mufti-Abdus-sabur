import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { bnDate } from '@/lib/format';

export default async function AdminSupport({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams; const st = sp?.status || 'open';
  const { data: tickets } = await supabase.from('support_tickets').select('*, profiles(full_name, email, status, role)').eq('status', st).order('last_message_at', { ascending: false });
  return (
    <>
      <TopBar profile={profile} active="/admin/support" />
      <main className="wrap narrow">
        <h1>সাপোর্ট</h1>
        <div className="tabs"><Link href="/admin/support" className={st === 'open' ? 'active' : ''}>চলমান</Link><Link href="/admin/support?status=closed" className={st === 'closed' ? 'active' : ''}>বন্ধ</Link></div>
        <div className="list">
          {!tickets?.length && <p className="muted">কিছু নেই।</p>}
          {(tickets || []).map((t) => <Link key={t.id} href={`/admin/support/${t.id}`} className="row" style={{ color: 'inherit' }}><div><b>{t.subject}</b><div className="muted">{t.profiles?.full_name || t.profiles?.email}<VerifiedBadge profile={t.profiles} size={14} /> · {bnDate(t.last_message_at)}</div></div></Link>)}
        </div>
      </main>
    </>
  );
}
