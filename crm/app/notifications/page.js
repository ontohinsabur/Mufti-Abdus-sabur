import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import PushToggle from '@/components/PushToggle';
import { markAllRead } from './actions';
import { bnDate } from '@/lib/format';

export default async function Notifications() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { data: list } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  const unread = (list || []).filter((n) => !n.read_at).length;
  return (
    <>
      <TopBar profile={profile} active="/notifications" />
      <main className="wrap narrow">
        <h1>নোটিফিকেশন</h1>
        <PushToggle />
        <div className="card">
          <div className="row" style={{ border: 0, padding: 0, marginBottom: 8 }}><h2 style={{ margin: 0 }}>সাম্প্রতিক</h2>
            {unread > 0 && <form action={markAllRead}><button className="btn sm ghost">সব পড়া হয়েছে</button></form>}</div>
          {!list?.length ? <p className="muted">এখনো কোনো নোটিফিকেশন নেই।</p> : (
            <div className="list">{list.map((n) => (
              <Link key={n.id} href={n.url || '#'} className="row" style={{ color: 'inherit', borderLeft: n.read_at ? undefined : '4px solid var(--brand)' }}>
                <div><b>{n.title}</b>{n.body && <div className="muted" style={{ whiteSpace: 'pre-line' }}>{n.body}</div>}<div className="muted">{bnDate(n.created_at)}</div></div>
              </Link>
            ))}</div>
          )}
        </div>
      </main>
    </>
  );
}
