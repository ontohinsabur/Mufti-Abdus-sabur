import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import OrderCard from '@/components/OrderCard';
import Icon from '@/components/Icon';
import AutoSelect from '@/components/AutoSelect';
import Pager, { paginate } from '@/components/Pager';
import { bnNum } from '@/lib/format';

const OPTS = [['all', 'সব অর্ডার'], ['pending', 'অপেক্ষমাণ'], ['accepted', 'গৃহীত'], ['running', 'এড রানিং'], ['off', 'অফ'], ['completed', 'সম্পন্ন'], ['cancelled', 'বাতিল'], ['due', 'বকেয়া আছে']];

export default async function Orders({ searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/orders');
  if (profile.status !== 'approved') redirect('/pending');
  const sp = await searchParams;
  const st = OPTS.some(([k]) => k === sp?.status) ? sp.status : 'all';
  const k = (sp?.q || '').trim().toLowerCase().replace(/^#/, '').replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(400);
  if (st === 'due') q = q.not('status', 'in', '(off,cancelled)').neq('payment_status', 'paid').not('total_bdt', 'is', null);
  else if (st !== 'all') q = q.eq('status', st);
  const { data } = await q;
  const list = (data || []).filter((o) => !k || String(o.order_no) === k || [o.page_name, o.service_name, o.post_url, o.customer_note, o.invoice_no].some((x) => (x || '').toLowerCase().includes(k)));
  const { rows, page, pages } = paginate(list, sp, 12);
  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap">
        <div className="ph"><h1>আমার অর্ডার</h1><span>{bnNum(list.length)}টি অর্ডার</span></div>
        <form className="searchbar">
          <Icon name="search" />
          <input name="q" defaultValue={sp?.q || ''} placeholder="অর্ডার #, পেজ, লিংক বা নোট" />
          <AutoSelect name="status" value={st} options={OPTS} />
        </form>
        {rows.length === 0 ? <div className="panel"><p className="panel-empty">কোনো অর্ডার পাওয়া যায়নি।</p></div>
          : <div className="oc-grid">{rows.map((o) => <OrderCard key={o.id} o={o} admin={false} />)}</div>}
        <Pager page={page} pages={pages} base="/orders" sp={sp} />
      </main>
    </>
  );
}
