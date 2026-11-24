import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import NoticeForm from './form';
import { toggle, remove } from './actions';
import { bnDate } from '@/lib/format';

export default async function Notices() {
  const { supabase, profile } = await requireAdmin();
  const { data: list } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  return (
    <>
      <TopBar profile={profile} active="/admin/notices" />
      <main className="wrap narrow">
        <h1>নোটিশ</h1><p className="muted">চালু থাকা নোটিশ গ্রাহকের ড্যাশবোর্ডে দেখাবে।</p>
        <NoticeForm />
        <div className="list">{(list || []).map((n) => (
          <div className="card notice" key={n.id}>
            <b>{n.title}</b> <span className={`badge ${n.active ? 'approved' : 'off'}`}>{n.active ? 'চালু' : 'বন্ধ'}</span>
            <p style={{ whiteSpace: 'pre-line' }}>{n.body}</p><p className="muted">{bnDate(n.created_at)}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <form action={toggle}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="active" value={n.active ? '0' : '1'} /><button className="btn sm ghost">{n.active ? 'বন্ধ করুন' : 'চালু করুন'}</button></form>
              <form action={remove}><input type="hidden" name="id" value={n.id} /><button className="btn sm bad">মুছুন</button></form>
            </div>
          </div>
        ))}</div>
      </main>
    </>
  );
}
