import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import SupportForm from '@/components/SupportForm';
import SupportThread from '@/components/SupportThread';
import WaButton from '@/components/WaButton';
import { setTicketStatus } from '@/app/support/actions';

export default async function AdminTicket({ params }) {
  const { supabase, user, profile } = await requireAdmin();
  const { id } = await params;
  const { data: t } = await supabase.from('support_tickets').select('*, profiles(id, full_name, email, phone, whatsapp)').eq('id', id).maybeSingle();
  if (!t) notFound();
  const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', id).order('created_at');
  const c = t.profiles;
  return (
    <>
      <TopBar profile={profile} active="/admin/support" />
      <main className="wrap narrow">
        <h1>{t.subject}</h1>
        <p className="muted"><Link href={`/admin/customers/${c.id}`}>{c.full_name || c.email}</Link>{t.order_id && <> · <Link href={`/admin/orders/${t.order_id}`}>সংশ্লিষ্ট অর্ডার</Link></>}</p>
        <p style={{ display: 'flex', gap: 6 }}>
          <WaButton number={c.whatsapp || c.phone} text={`আসসালামু আলাইকুম ${c.full_name || ''}, আপনার "${t.subject}" বিষয়ে —`} />
          <form action={setTicketStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value={t.status === 'open' ? 'closed' : 'open'} /><button className="btn sm ghost">{t.status === 'open' ? 'বন্ধ করুন' : 'আবার খুলুন'}</button></form>
        </p>
        <SupportThread msgs={msgs} me={user.id} />
        <SupportForm ticketId={t.id} />
      </main>
    </>
  );
}
