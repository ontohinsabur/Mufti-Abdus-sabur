import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import OrderCard from '@/components/OrderCard';
import Icon from '@/components/Icon';
import AutoSelect from '@/components/AutoSelect';
import { bnNum } from '@/lib/format';
import Pager, { paginate } from '@/components/Pager';

export const metadata = { title: 'অর্ডার | MAS CRM' };
const OPTS = [['all', 'সব অর্ডার'], ['active', 'চলমান কাজ'], ['pending', 'অপেক্ষমাণ'], ['accepted', 'গৃহীত'], ['running', 'এড রানিং'], ['off', 'অফ'], ['completed', 'সম্পন্ন'], ['cancelled', 'বাতিল'], ['due', 'বকেয়া আছে']];

export default async function AdminOrders({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const st = OPTS.some(([k]) => k === sp?.status) ? sp.status : 'all';
  const q = (sp?.q || '').trim().slice(0, 80);
  let query = supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, phone, whatsapp, status, role)').order('created_at', { ascending: false }).limit(400);
  if (st === 'active') query = query.in('status', ['pending', 'accepted', 'running', 'off']);
  else if (st === 'due') query = query.not('status', 'in', '(off,cancelled)').neq('payment_status', 'paid').not('total_bdt', 'is', null);
  else if (st !== 'all') query = query.eq('status', st);
  const [{ data }, { count: all }] = await Promise.all([query, supabase.from('orders').select('id', { count: 'exact', head: true })]);
  const k = q.toLowerCase().replace(/^#/, '');
  const digits = k.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  const orders = (data || []).filter((o) => !k || String(o.order_no) === digits || [o.profiles?.full_name, o.profiles?.email, o.profiles?.phone, o.post_url, o.customer_note, o.admin_note, o.page_name, o.service_name, o.invoice_no]
    .some((x) => (x || '').toLowerCase().includes(k)));
  const pg = paginate(orders, sp, 12);
  return (
    <>
      <TopBar profile={profile} active="/admin/orders" />
      <main className="wrap">
        <div className="ph"><h1>অর্ডার</h1><span>{bnNum(all)}টি অর্ডার</span></div>
        <form className="searchbar">
          <Icon name="search" />
          <input name="q" defaultValue={q} placeholder="অর্ডার #, নাম, মোবাইল, লিংক বা নোট" />
          <AutoSelect name="status" value={st} options={OPTS} />
        </form>
        {(st !== 'all' || q) && <p className="muted" style={{ margin: '0 4px 12px' }}>{bnNum(orders.length)}টি অর্ডার পাওয়া গেছে</p>}
        {orders.length === 0 ? <div className="panel"><p className="panel-empty">কোনো অর্ডার পাওয়া যায়নি।</p></div>
          : <div className="oc-grid">{pg.rows.map((o) => <OrderCard key={o.id} o={o} />)}</div>}
        <Pager page={pg.page} pages={pg.pages} base="/admin/orders" sp={sp} />
      </main>
    </>
  );
}
