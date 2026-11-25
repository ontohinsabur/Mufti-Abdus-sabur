import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import OrderForm from '@/components/OrderForm';
import { loadOrderFormData } from '@/lib/orderData';

export default async function AdminNewOrder({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const data = await loadOrderFormData(supabase, { admin: true });
  let initial = sp?.customer ? { customer_id: sp.customer } : {};
  if (sp?.from) { const { data: src } = await supabase.from('orders').select('*').eq('id', sp.from).maybeSingle(); if (src) initial = src; }
  return (
    <>
      <TopBar profile={profile} active="/admin/orders/new" />
      <main className="wrap of-wrap">
        <h1 className="page-title">{sp?.from ? 'আবার অর্ডার' : 'নতুন অর্ডার'}</h1>
        <p className="muted" style={{ marginTop: -4 }}>কাস্টমার বেছে নিয়ে অর্ডার তৈরি করুন। পেমেন্টের তথ্য না দিলে অর্ডার অপরিশোধিত হিসেবে তৈরি হবে।</p>
        <OrderForm {...data} initial={initial} admin />
      </main>
    </>
  );
}
