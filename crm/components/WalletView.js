import { bnNum, bnDate } from '@/lib/format';

const TYPE = { order_unused: 'অব্যবহৃত বাজেট জমা', order_use: 'অর্ডারে ব্যবহার', refund_out: 'ফেরত দেওয়া হয়েছে', withdraw: 'টাকা তোলা', adjust: 'অ্যাডমিন সমন্বয়', overpay: 'অতিরিক্ত পেমেন্ট' };
const RS = { pending: ['অপেক্ষমাণ', 'pending'], done: ['পাঠানো হয়েছে', 'approved'], rejected: ['বাতিল', 'rejected'] };

export default function WalletView({ tx, requests }) {
  return (
    <>
      {requests?.length > 0 && (
        <div className="card"><h2>টাকা তোলার অনুরোধ</h2><div className="list">
          {requests.map((r) => (
            <div className="row" key={r.id}><div><b>৳{bnNum(r.amount)}</b> · {r.method} {r.account}<div className="muted">{bnDate(r.created_at)}{r.trx_id ? ` · TrxID ${r.trx_id}` : ''}{r.admin_note ? ` · ${r.admin_note}` : ''}</div></div>
              <span className={`badge ${RS[r.status][1]}`}>{RS[r.status][0]}</span></div>
          ))}
        </div></div>
      )}
      <div className="card"><h2>ওয়ালেটের লেনদেন</h2>
        {!tx?.length ? <p className="muted">এখনো কোনো লেনদেন নেই।</p> : (
          <div className="list">{tx.map((t) => (
            <div className="row" key={t.id}><div><b>{TYPE[t.type] || t.type}</b><div className="muted">{t.note}</div><div className="muted">{bnDate(t.created_at)}</div></div>
              <b style={{ color: Number(t.amount) >= 0 ? 'var(--ok)' : 'var(--bad)' }}>{Number(t.amount) >= 0 ? '+' : '−'}৳{bnNum(Math.abs(t.amount))}</b></div>
          ))}</div>
        )}
      </div>
    </>
  );
}
