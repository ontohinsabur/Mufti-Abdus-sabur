import { requireAdmin } from '@/lib/admin';
import PrintButton from '@/components/PrintButton';
import { STATUS } from '@/lib/format';

export const metadata = { title: 'MAS Report' };
// A4 sales report — same design as the old CRM: logo + contact header, muftiabdussabur.com watermark on every page.
const bn = (x) => Number(x || 0).toLocaleString('bn-BD');
const tk = (x) => '৳' + Number(x || 0).toLocaleString('bn-BD', { maximumFractionDigits: 2 });
const dbn = (ymd) => new Date(ymd + 'T12:00:00+06:00').toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
const day = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

export default async function ReportPrint({ searchParams }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const now = new Date();
  const ok = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const from = ok(sp?.from) ? sp.from : day(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = ok(sp?.to) ? sp.to : day(now);
  const { data } = await supabase.from('orders').select('order_no, created_at, service_name, status, total_bdt, paid_amount, profiles!orders_customer_id_fkey(full_name, email)')
    .gte('created_at', `${from}T00:00:00+06:00`).lte('created_at', `${to}T23:59:59+06:00`).order('created_at');
  const rows = (data || []).map((o) => {
    const t = Number(o.total_bdt || 0), dead = o.status === 'cancelled';
    const due = dead || o.status === 'off' ? 0 : Math.max(0, t - Number(o.paid_amount || 0));
    return { ...o, t, due, paid: t - due, dead, name: o.profiles?.full_name || o.profiles?.email || '—' };
  });
  const live = rows.filter((r) => !r.dead);
  const sales = live.reduce((a, r) => a + r.t, 0), due = live.reduce((a, r) => a + r.due, 0), coll = sales - due;
  const svc = {}, cus = {}, st = {};
  rows.forEach((r) => { st[r.status] = (st[r.status] || 0) + 1; });
  live.forEach((r) => { (svc[r.service_name] ||= [0, 0]); svc[r.service_name][0]++; svc[r.service_name][1] += r.t; cus[r.name] = (cus[r.name] || 0) + r.t; });
  const range = from === to ? dbn(from) : `${dbn(from)} – ${dbn(to)}`;
  const made = new Date().toLocaleString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });

  return (
    <div className="rp">
      <style>{CSS}</style>
      <div className="bar">
        <PrintButton label="⎙ প্রিন্ট / PDF সেভ করুন" />
        <a href={`/admin/reports?from=${from}&to=${to}`}>← রিপোর্টে ফিরুন</a>
        <small>PDF বানাতে: প্রিন্টে চাপুন → Destination / প্রিন্টারে "Save as PDF" বেছে নিন</small>
      </div>
      <div className="wm"><span>muftiabdussabur.com</span></div>
      <div className="paper"><div className="wm-grid" /><div className="c">
        <header className="hd">
          <div><img src="/brand-logo.svg" alt="Mufti Abdus Sabur" /><div className="tag">Facebook Boosting &amp; Ads Service</div></div>
          <div className="rt"><b>বিক্রি রিপোর্ট</b><span>{range}</span><span style={{ fontSize: 11.5, color: '#6E829F' }}>তৈরি: {made}</span></div>
        </header>
        <div className="ct"><span>🌐 <b>muftiabdussabur.com</b></span><span>📞 <b>01927949015</b></span><span>✉ <b>info@muftiabdussabur.com</b></span><span>f <b>facebook.com/Muftiabdussabur</b></span></div>
        <div className="st">
          <div><small>অর্ডার</small><b>{bn(live.length)}</b></div>
          <div><small>মোট বিক্রি</small><b>{tk(sales)}</b></div>
          <div className="ok"><small>আদায়</small><b>{tk(coll)}</b></div>
          <div className={due > 0 ? 'hot' : ''}><small>বকেয়া</small><b>{tk(due)}</b></div>
          <div><small>বাতিল</small><b>{bn(rows.length - live.length)}</b></div>
          <div><small>গড় অর্ডার</small><b>{tk(live.length ? sales / live.length : 0)}</b></div>
        </div>
        <div className="two">
          <div><h2>সার্ভিস অনুযায়ী বিক্রি</h2>
            {Object.keys(svc).length ? <table><thead><tr><th>সার্ভিস</th><th className="n">অর্ডার</th><th className="n">টাকা</th></tr></thead><tbody>
              {Object.entries(svc).sort((a, b) => b[1][1] - a[1][1]).map(([k, v]) => <tr key={k}><td>{k}</td><td className="n">{bn(v[0])}</td><td className="n">{tk(v[1])}</td></tr>)}
            </tbody></table> : <p className="empty">এই সময়ে বিক্রি নেই।</p>}
          </div>
          <div><h2>সেরা কাস্টমার</h2>
            {Object.keys(cus).length ? <table><thead><tr><th>কাস্টমার</th><th className="n">টাকা</th></tr></thead><tbody>
              {Object.entries(cus).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => <tr key={k}><td>{k}</td><td className="n">{tk(v)}</td></tr>)}
            </tbody></table> : <p className="empty">—</p>}
            <h2>অবস্থা অনুযায়ী</h2>
            <div className="pills">{Object.entries(st).map(([k, v]) => <span key={k}>{STATUS[k]?.label || k}: <b>{bn(v)}</b></span>)}</div>
          </div>
        </div>
        <h2>অর্ডারের তালিকা ({bn(rows.length)}টি)</h2>
        {rows.length ? (
          <table><thead><tr><th>#</th><th>তারিখ</th><th>কাস্টমার</th><th>সার্ভিস</th><th>অবস্থা</th><th className="n">মোট</th><th className="n">পরিশোধিত</th><th className="n">বকেয়া</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.order_no}><td>{bn(r.order_no)}</td><td>{new Date(r.created_at).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', timeZone: 'Asia/Dhaka' })}</td><td>{r.name}</td><td>{r.service_name}</td><td>{STATUS[r.status]?.label}</td><td className="n">{tk(r.t)}</td><td className="n">{tk(r.paid)}</td><td className="n">{tk(r.due)}</td></tr>)}</tbody>
            <tfoot><tr><td colSpan={5}>মোট (বাতিল ছাড়া)</td><td className="n">{tk(sales)}</td><td className="n">{tk(coll)}</td><td className="n">{tk(due)}</td></tr></tfoot>
          </table>
        ) : <p className="empty">এই সময়ে কোনো অর্ডার নেই।</p>}
        <div className="sign"><div>প্রস্তুতকারী</div><div>অনুমোদনকারী</div></div>
      </div></div>
      <div className="ft"><span>Mufti Abdus Sabur · muftiabdussabur.com</span><span>বিক্রি রিপোর্ট · {range}</span></div>
    </div>
  );
}

const CSS = `
@page{size:A4;margin:12mm 12mm 16mm}
body{background:#E9EEF6!important;color:#142E50}
.rp *{box-sizing:border-box}
.rp{font-family:"SolaimanLipi",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#142E50;min-height:100vh}
.rp .bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:12px;background:#0F2747}
.rp .bar .btn,.rp .bar a{font:inherit;font-weight:700;font-size:15px;border:0;border-radius:12px;padding:10px 18px;cursor:pointer;text-decoration:none}
.rp .bar .btn{background:#2563EB;color:#fff}.rp .bar a{background:rgba(255,255,255,.12);color:#fff}
.rp .bar small{color:#B8C8E3;font-size:12.5px;width:100%;text-align:center}
.rp .paper{position:relative;width:210mm;max-width:100%;min-height:297mm;margin:16px auto;background:#fff;padding:14mm 14mm 18mm;box-shadow:0 10px 40px rgba(15,39,71,.15);overflow:hidden}
.rp .wm{position:fixed;inset:0;pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center}
.rp .wm span{transform:rotate(-32deg);font:800 64px/1 system-ui,sans-serif;letter-spacing:2px;color:#0F2747;opacity:.06;white-space:nowrap}
.rp .wm-grid{position:absolute;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='340' height='220'><text x='20' y='130' transform='rotate(-30 170 110)' font-family='Arial' font-size='22' font-weight='700' fill='%230F2747' fill-opacity='0.035'>muftiabdussabur.com</text></svg>");background-repeat:repeat}
.rp .c{position:relative;z-index:1}
.rp .hd{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:12px;border-bottom:3px solid #0F2747}
.rp .hd img{height:16mm;width:auto;display:block}
.rp .hd .tag{font-size:12px;color:#6E829F;margin-top:3px}
.rp .hd .rt{text-align:right}.rp .hd .rt b{display:block;font-size:22px;letter-spacing:.5px}.rp .hd .rt span{display:block;font-size:13.5px;color:#41567A}
.rp .ct{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px;color:#41567A;padding:8px 0 0}.rp .ct b{color:#142E50}
.rp h2{font-size:15px;margin:18px 0 8px;padding-left:8px;border-left:4px solid #2563EB;color:#142E50}
.rp .st{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.rp .st div{border:1px solid #DCE4F0;border-radius:10px;padding:9px 12px;background:rgba(255,255,255,.85)}
.rp .st small{display:block;font-size:11.5px;color:#6E829F}.rp .st b{font-size:18px}
.rp .st .ok b{color:#15803D}.rp .st .hot b{color:#B42318}
.rp .two{display:grid;grid-template-columns:1.3fr 1fr;gap:16px}
.rp table{width:100%;border-collapse:collapse;font-size:12px;background:rgba(255,255,255,.8)}
.rp th{background:#0F2747;color:#fff;text-align:left;font-weight:700;padding:6px 7px}
.rp td{padding:5px 7px;border-bottom:1px solid #E3EAF5;color:#142E50}
.rp tr:nth-child(even) td{background:rgba(244,247,252,.85)}
.rp td.n,.rp th.n{text-align:right;white-space:nowrap}
.rp tfoot td{font-weight:800;border-top:2px solid #0F2747;background:#F4F7FC}
.rp thead{display:table-header-group}.rp tr{break-inside:avoid}
.rp .pills{display:flex;flex-wrap:wrap;gap:6px}.rp .pills span{border:1px solid #DCE4F0;border-radius:999px;padding:3px 10px;font-size:12px}
.rp .empty{color:#6E829F;font-size:13px}
.rp .ft{position:fixed;left:0;right:0;bottom:0;display:none;justify-content:space-between;font-size:10px;color:#6E829F;padding:0 12mm 5mm}
.rp .sign{display:flex;justify-content:space-between;margin-top:34px;font-size:12px;color:#41567A}.rp .sign div{border-top:1px solid #9FB0C8;padding-top:4px;min-width:45mm;text-align:center}
@media print{body,.rp{background:#fff!important}.rp .bar{display:none}.rp .paper{width:auto;min-height:0;margin:0;padding:0;box-shadow:none;overflow:visible}.rp .wm-grid{position:fixed}.rp .ft{display:flex}}
@media screen and (max-width:820px){.rp .paper{width:auto;margin:10px;padding:16px;min-height:0}.rp .st{grid-template-columns:repeat(2,1fr)}.rp .two{grid-template-columns:1fr}.rp .hd{flex-direction:column;align-items:flex-start}.rp .hd .rt{text-align:left}}
`;
