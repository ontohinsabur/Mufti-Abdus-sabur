import Link from 'next/link';
import { bnNum, bnDate } from '@/lib/format';

const MONTH = (k) => new Date(k + '-01T00:00:00').toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });

export default function LedgerView({ ledger, orderBase }) {
  const { rows, balance, months } = ledger;
  return (
    <>
      <div className="grid">
        <div className="stat"><span className="muted">মোট বিল</span><b>৳{bnNum(rows.reduce((a, r) => a + r.debit, 0))}</b></div>
        <div className="stat"><span className="muted">মোট পরিশোধ</span><b>৳{bnNum(rows.reduce((a, r) => a + r.credit, 0))}</b></div>
        <div className="stat"><span className="muted">{balance >= 0 ? 'বাকি' : 'অগ্রিম'}</span><b>৳{bnNum(Math.abs(balance))}</b></div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>মাসভিত্তিক হিসাব</h2>
        {months.length === 0 ? <p className="muted">এখনো কোনো হিসাব নেই।</p> : (
          <div style={{ overflowX: 'auto' }}><table className="t"><thead><tr><th>মাস</th><th>অর্ডার</th><th>বুস্ট (ডলার)</th><th>বিল</th><th>পরিশোধ</th></tr></thead><tbody>
            {months.map((m) => <tr key={m.month}><td>{MONTH(m.month)}</td><td>{bnNum(m.orders)}</td><td>${m.usd.toFixed(2)}</td><td>৳{bnNum(m.billed)}</td><td>৳{bnNum(m.paid)}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
      <div className="card">
        <h2>লেনদেনের খাতা</h2>
        {rows.length === 0 ? <p className="muted">এখনো কোনো লেনদেন নেই।</p> : (
          <div style={{ overflowX: 'auto' }}><table className="t"><thead><tr><th>তারিখ</th><th>বিবরণ</th><th>বিল</th><th>পরিশোধ</th><th>ব্যালেন্স</th></tr></thead><tbody>
            {[...rows].reverse().map((r, i) => (
              <tr key={i}>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>{bnDate(r.at)}</td>
                <td>{r.kind === 'order' && orderBase ? <Link href={`${orderBase}/${r.id}`}>{r.ref}</Link> : <b>{r.ref}</b>}<div className="muted">{r.text}</div></td>
                <td>{r.debit ? `৳${bnNum(r.debit)}` : ''}</td>
                <td style={{ color: 'var(--ok)' }}>{r.credit ? `৳${bnNum(r.credit)}` : ''}</td>
                <td><b>{r.balance < 0 ? '-' : ''}৳{bnNum(Math.abs(r.balance))}</b></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
        <p className="muted">ব্যালেন্স = মোট বিল − মোট পরিশোধ। অফ অর্ডার খাতায় থাকে, কিন্তু বকেয়া তালিকায় ধরা হয় না।</p>
      </div>
    </>
  );
}
