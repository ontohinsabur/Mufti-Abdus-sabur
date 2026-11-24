import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import { ProfileForm, AddPageForm } from './forms';
import { archivePage } from './actions';

export default async function Profile() {
  const { user, profile, supabase } = await getSession();
  if (!user) redirect('/login');
  const { data: pages } = await supabase.from('facebook_pages').select('*').eq('customer_id', user.id).eq('archived', false).order('created_at');
  return (
    <>
      <TopBar profile={profile} active="/profile" />
      <main className="wrap narrow">
        <p>অ্যাকাউন্টের অবস্থা: <StatusBadge status={profile.status} /></p>
        <ProfileForm profile={profile} />
        {profile.role !== 'admin' && (
          <div className="card">
            <h2>আপনার ফেসবুক পেজ</h2>
            <div className="list" style={{ marginBottom: 12 }}>
              {(pages || []).length === 0 && <p className="muted">এখনো কোনো পেজ যোগ করা হয়নি।</p>}
              {(pages || []).map((p) => (
                <div className="row" key={p.id}>
                  <div><b>{p.name}</b>{p.url && <div className="muted"><a href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a></div>}</div>
                  <form action={archivePage}><input type="hidden" name="id" value={p.id} /><button className="btn sm ghost">সরান</button></form>
                </div>
              ))}
            </div>
            <AddPageForm />
          </div>
        )}
      </main>
    </>
  );
}
