import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import SupportForm from '@/components/SupportForm';
import SupportThread from '@/components/SupportThread';

export default async function Ticket({ params }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params;
  if (profile.role === 'admin') redirect(`/admin/support/${id}`);
  const { data: t } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle();
  if (!t) notFound();
  const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', id).order('created_at');
  return (
    <>
      <TopBar profile={profile} active="/support" />
      <main className="wrap narrow"><h1>{t.subject}</h1><SupportThread msgs={msgs} me={user.id} /><SupportForm ticketId={t.id} /></main>
    </>
  );
}
