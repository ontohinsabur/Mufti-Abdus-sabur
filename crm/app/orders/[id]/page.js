import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import OrderDetail from '@/components/OrderDetail';
import { WHATSAPP } from '@/lib/config';

export default async function OrderPage({ params, searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params; const sp = await searchParams;
  if (profile.role === 'admin') redirect(`/admin/orders/${id}`);
  const { data: o } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!o) notFound();
  const { data: events } = await supabase.from('order_events').select('*').eq('order_id', id).order('created_at');
  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap narrow">
        {sp?.new && <div className="alert ok">অর্ডার সফল হয়েছে! অর্ডার নম্বর #{o.order_no}। পেমেন্টের ব্যবস্থা পরের আপডেটে আসছে, এখন পেমেন্ট করতে হোয়াটসঅ্যাপে যোগাযোগ করুন।</div>}
        <OrderDetail o={o} events={events} />
        <Link className="btn" href={`/orders/new?from=${o.id}`}>🔃 আবার অর্ডার</Link>{' '}
        <a className="btn ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপে জিজ্ঞেস করুন</a>
      </main>
    </>
  );
}
