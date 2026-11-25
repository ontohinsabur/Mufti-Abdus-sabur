import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import Tile from '@/components/Tile';

export const metadata = { title: 'আরও | MAS CRM' };

const DAILY = [
  ['/admin/customers', 'কাস্টমার', 'users', 'violet'],
  ['/admin/services#access', 'এক্সেস আইডি', 'key', 'green'],
  ['/admin/invoices', 'ইনভয়েস', 'invoice', 'amber'],
  ['/admin/payments?tab=due', 'বাকি (Pay Later)', 'clock', 'rose'],
  ['/admin/customers?status=approved', 'হিসাবের খাতা', 'book', 'teal'],
  ['/admin/payments?tab=record', 'একসাথে পেমেন্ট', 'check', 'green'],
  ['/admin/wallet', 'ব্যালেন্স ও ফেরত', 'pay', 'blue'],
  ['/admin/support', 'সাপোর্ট', 'chat', 'rose'],
  ['/notifications', 'নোটিফিকেশন', 'bell', 'blue'],
  ['/admin/reports', 'রিপোর্ট', 'chart', 'teal'],
];
const SETUP = [
  ['/admin/services', 'সার্ভিস', 'tag', 'green'],
  ['/admin/services#rates', 'ডিফল্ট দাম', 'pay', 'amber'],
  ['/admin/customers?status=approved', 'কাস্টম রেট', 'tag', 'violet'],
  ['/admin/notices', 'বিজ্ঞপ্তি', 'mega', 'amber'],
  ['/admin/settings', 'সেটিংস', 'gear', 'slate'],
];

export default async function More() {
  const { profile } = await requireAdmin();
  return (
    <>
      <TopBar profile={profile} active="/admin/more" />
      <main className="wrap">
        <h1 className="page-title">আরও</h1>
        <p className="muted" style={{ marginTop: -6 }}>সব অপশন এক জায়গায়</p>
        <h3 className="sec-h">প্রতিদিনের কাজ</h3>
        <div className="tiles">{DAILY.map(([h, l, i, t]) => <Tile key={h} href={h} label={l} icon={i} tone={t} />)}</div>
        <h3 className="sec-h">সেটআপ ও কনটেন্ট</h3>
        <div className="tiles">{SETUP.map(([h, l, i, t]) => <Tile key={h} href={h} label={l} icon={i} tone={t} />)}</div>
        <div className="card more-foot">
          <form action="/auth/signout" method="post"><button className="more-link bad"><Icon name="logout" />লগআউট</button></form>
        </div>
      </main>
    </>
  );
}
