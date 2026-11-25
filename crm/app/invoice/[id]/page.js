import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import InvoiceView from '@/components/InvoiceView';

export const metadata = { title: 'ইনভয়েস | Mufti Abdus Sabur' };

export default async function Invoice({ params }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params;
  const { data: o } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, phone, whatsapp)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: biz }, { data: allocs }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'business').maybeSingle(),
    supabase.from('payment_allocations').select('amount, payments!inner(payment_no, method, trx_id, status, verified_at, created_at)').eq('order_id', id).eq('payments.status', 'verified'),
  ]);
  return <InvoiceView o={o} allocs={allocs} biz={biz?.value} admin={profile?.role === 'admin'} />;
}
