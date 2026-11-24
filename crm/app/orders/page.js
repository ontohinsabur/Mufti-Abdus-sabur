import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import OrderList from '@/components/OrderList';
import { STATUS } from '@/lib/format';

export default async function Orders({ searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/orders');
  if (profile.status !== 'approved') redirect('/pending');
  const sp = await searchParams; const st = sp?.status || 'all';
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (st !== 'all') q = q.eq('status', st);
  const { data: orders } = await q;
  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap">
        <div className="row" style={{ marginBottom: 12 }}><h1 style={{ margin: 0 }}>আমার অর্ডার</h1><Link className="btn" href="/orders/new">+ নতুন অর্ডার</Link></div>
        <div className="tabs">
          <Link href="/orders" className={st === 'all' ? 'active' : ''}>সব</Link>
          {Object.entries(STATUS).map(([k, v]) => <Link key={k} href={`/orders?status=${k}`} className={st === k ? 'active' : ''}>{v.label}</Link>)}
        </div>
        <OrderList orders={orders} base="/orders" reorderBase="/orders/new" />
      </main>
    </>
  );
}
