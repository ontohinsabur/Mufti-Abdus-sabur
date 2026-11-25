import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import OrderList from '@/components/OrderList';
import { STATUS } from '@/lib/format';

export default async function AdminOrders({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams; const st = sp?.status || 'active';
  const q = (sp?.q || '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
  let query = supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, status, role)').order('created_at', { ascending: false }).limit(200);
  if (st === 'active') query = query.in('status', ['pending', 'accepted', 'running', 'off']);
  else if (st !== 'all') query = query.eq('status', st);
  if (q) query = /^\d+$/.test(q) ? query.eq('order_no', Number(q)) : query.or(`page_name.ilike.%${q}%,service_name.ilike.%${q}%`);
  const { data: orders } = await query;
  return (
    <>
      <TopBar profile={profile} active="/admin/orders" />
      <main className="wrap">
        <div className="row" style={{ marginBottom: 12 }}><h1 style={{ margin: 0 }}>অর্ডার</h1><Link className="btn" href="/admin/orders/new">+ গ্রাহকের জন্য অর্ডার</Link></div>
        <div className="tabs">
          <Link href="/admin/orders" className={st === 'active' ? 'active' : ''}>চলমান কাজ</Link>
          {Object.entries(STATUS).map(([k, v]) => <Link key={k} href={`/admin/orders?status=${k}`} className={st === k ? 'active' : ''}>{v.label}</Link>)}
          <Link href="/admin/orders?status=all" className={st === 'all' ? 'active' : ''}>সব</Link>
        </div>
        <form style={{ marginBottom: 12 }}><input type="hidden" name="status" value={st} /><input name="q" defaultValue={q} placeholder="অর্ডার নম্বর, পেজ বা সেবার নাম" /></form>
        <OrderList orders={orders} base="/admin/orders" reorderBase="/admin/orders/new" admin />
      </main>
    </>
  );
}
