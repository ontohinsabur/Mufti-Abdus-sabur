import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import OrderDetail from '@/components/OrderDetail';
import { WHATSAPP } from '@/lib/config';
import { PayTogether, WalletPay } from '@/components/PayForms';
import { dueOrders } from '@/lib/money';
import { bnNum } from '@/lib/format';

export default async function OrderPage({ params, searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params; const sp = await searchParams;
  if (profile.role === 'admin') redirect(`/admin/orders/${id}`);
  const { data: o } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: events }, due, { data: pay }, { data: sum }] = await Promise.all([
    supabase.from('order_events').select('*').eq('order_id', id).order('created_at'),
    dueOrders(supabase, user.id),
    supabase.from('settings').select('value').eq('key', 'payment').maybeSingle(),
    supabase.rpc('customer_summary').single(),
  ]);
  const mine = due.filter((d) => d.id === o.id);
  const pendingHere = Number(o.total_bdt || 0) - Number(o.paid_amount || 0) > 0 && !mine.length && o.payment_status !== 'paid' && o.total_bdt != null;
  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap narrow">
        {sp?.new && <div className="alert ok">অর্ডার সফল হয়েছে! অর্ডার নম্বর #{o.order_no}।{o.quote_status === 'pending' ? ' দাম ঠিক করে আমরা জানাব।' : o.pay_later ? ' বাকিতে নেওয়া হয়েছে।' : ' পেমেন্ট যাচাইয়ের পর কাজ শুরু হবে।'}</div>}
        {pendingHere && <div className="alert warn">এই অর্ডারের পেমেন্ট যাচাইয়ের অপেক্ষায় আছে।</div>}
        <OrderDetail o={o} events={events} />
        {mine.length > 0 && (
          <div className="card"><h2>পরিশোধ করুন</h2>
            <PayTogether orders={mine} pay={pay?.value} single />
            {Number(sum?.wallet) > 0 && <WalletPay orderId={o.id} balance={Number(sum.wallet)} />}
          </div>
        )}
        {o.total_bdt != null && <p><a className="btn ghost" href={`/invoice/${o.id}`}>🧾 ইনভয়েস দেখুন</a></p>}
        <Link className="btn" href={`/orders/new?from=${o.id}`}>🔃 আবার অর্ডার</Link>{' '}
        <a className="btn ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপে জিজ্ঞেস করুন</a>
      </main>
    </>
  );
}
