import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import { PayTogether } from '@/components/PayForms';
import { METHOD } from '@/components/PayMethod';
import { dueOrders } from '@/lib/money';
import { bnNum, bnDate } from '@/lib/format';

const PS = { submitted: ['যাচাই চলছে', 'pending'], verified: ['যাচাই হয়েছে', 'approved'], rejected: ['বাতিল', 'rejected'] };

export default async function Payments() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/payments');
  if (profile.status !== 'approved') redirect('/pending');
  const [due, { data: pays }, { data: pay }] = await Promise.all([
    dueOrders(supabase, user.id),
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('settings').select('value').eq('key', 'payment').maybeSingle(),
  ]);
  return (
    <>
      <TopBar profile={profile} active="/payments" />
      <main className="wrap narrow">
        <h1>পেমেন্ট</h1>
        <div className="card"><h2>বকেয়া — একসাথে পেমেন্ট</h2><p className="muted">যেগুলো পরিশোধ করবেন সেগুলোতে টিক দিন, তারপর একবারেই পুরো টাকা পাঠান।</p>
          <PayTogether orders={due} pay={pay?.value} />
        </div>
        <div className="card"><h2>পেমেন্টের ইতিহাস</h2>
          {!pays?.length ? <p className="muted">এখনো কোনো পেমেন্ট নেই।</p> : (
            <div className="list">{pays.map((p) => (
              <div className="row" key={p.id}><div><b>#{p.payment_no} · ৳{bnNum(p.amount)}</b> · {METHOD[p.method]}{p.trx_id ? ` · ${p.trx_id}` : ''}
                <div className="muted">{bnDate(p.created_at)}{p.admin_note ? ` · ${p.admin_note}` : ''}</div></div>
                <span className={`badge ${PS[p.status][1]}`}>{PS[p.status][0]}</span></div>
            ))}</div>
          )}
        </div>
      </main>
    </>
  );
}
