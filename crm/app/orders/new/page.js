import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import OrderForm from '@/components/OrderForm';
import { loadOrderFormData } from '@/lib/orderData';

export default async function NewOrder({ searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/orders/new');
  if (profile.status !== 'approved') redirect('/pending');
  const sp = await searchParams;
  const data = await loadOrderFormData(supabase, { admin: false, userId: user.id });
  // "আবার অর্ডার": copy an earlier order; otherwise start from the last order's service & page
  let initial = {};
  const src = sp?.from
    ? (await supabase.from('orders').select('*').eq('id', sp.from).maybeSingle()).data
    : (await supabase.from('orders').select('service_id, page_id, page_name').order('created_at', { ascending: false }).limit(1).maybeSingle()).data;
  if (src) initial = src;
  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap narrow">
        <h1>{sp?.from ? 'আবার অর্ডার' : 'নতুন অর্ডার'}</h1>
        <OrderForm {...data} initial={initial} customerId={user.id} />
      </main>
    </>
  );
}
