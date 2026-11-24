import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import { WHATSAPP } from '@/lib/config';

export default async function Pending() {
  const { user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile?.status === 'approved') redirect('/');
  const rejected = profile?.status === 'rejected';
  return (
    <>
      <TopBar profile={profile} active="/dashboard" />
      <main className="wrap narrow">
        <div className="card center">
          <div style={{ fontSize: 48 }}>{rejected ? '⛔' : '⏳'}</div>
          <h1>{rejected ? 'অ্যাকাউন্ট অনুমোদন পায়নি' : 'অনুমোদনের অপেক্ষায়'}</h1>
          <p className="muted">
            {rejected
              ? 'দুঃখিত, আপনার অ্যাকাউন্টটি অনুমোদন দেওয়া হয়নি, তাই এখন অর্ডার দেওয়া যাবে না। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।'
              : `আসসালামু আলাইকুম ${profile?.full_name || ''}! আপনার অ্যাকাউন্ট খোলা হয়েছে। অ্যাডমিন অনুমোদন দিলে নামের পাশে নীল ব্যাজ আসবে এবং আপনি অর্ডার দিতে পারবেন।`}
          </p>
          <a className="btn block" href={WHATSAPP} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপে যোগাযোগ করুন</a>
        </div>
      </main>
    </>
  );
}
