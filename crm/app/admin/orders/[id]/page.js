import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import OrderDetail from '@/components/OrderDetail';
import Controls from './controls';
import WaButton from '@/components/WaButton';
import { STATUS, bnNum } from '@/lib/format';

export default async function AdminOrder({ params, searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const { id } = await params; const sp = await searchParams;
  const { data: o } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, phone, whatsapp, status, role)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const { data: events } = await supabase.from('order_events').select('*').eq('order_id', id).order('created_at');
  return (
    <>
      <TopBar profile={profile} active="/admin/orders" />
      <main className="wrap narrow">
        {sp?.new && <div className="alert ok">অর্ডার তৈরি হয়েছে।</div>}
        {sp?.split && <div className="alert ok">বাকি বাজেট দিয়ে এই নতুন অর্ডার তৈরি হয়েছে।</div>}
        {o.split_parent && <p className="muted">এটা একটা আগের অর্ডারের বাকি অংশ। <Link href={`/admin/orders/${o.split_parent}`}>আগের অর্ডার দেখুন</Link></p>}
        {o.split_child && <p className="muted">এই অর্ডারের বাকি অংশ নতুন অর্ডারে গেছে। <Link href={`/admin/orders/${o.split_child}`}>নতুন অর্ডার দেখুন</Link></p>}
        <OrderDetail o={o} events={events} admin />
        <p><WaButton number={o.profiles?.whatsapp || o.profiles?.phone} label="গ্রাহককে WhatsApp"
          text={`আসসালামু আলাইকুম ${o.profiles?.full_name || ''}\nঅর্ডার #${o.order_no} (${o.service_name}${o.page_name ? ' · ' + o.page_name : ''})\nঅবস্থা: ${STATUS[o.status]?.label}${o.total_bdt != null ? `\nমোট: ৳${bnNum(o.total_bdt)} · পরিশোধ: ৳${bnNum(o.paid_amount)}` : ''}`} /></p>
        <Controls o={o} />
        <Link className="btn ghost" href={`/admin/orders/new?from=${o.id}`}>🔃 আবার অর্ডার</Link>{' '}
        {o.total_bdt != null && <a className="btn ghost" href={`/invoice/${o.id}`}>🧾 ইনভয়েস</a>}{' '}
        {o.payment_status !== 'paid' && o.total_bdt != null && <Link className="btn ghost" href={`/admin/payments?tab=record&customer=${o.customer_id}`}>💳 পেমেন্ট রেকর্ড</Link>}
      </main>
    </>
  );
}
