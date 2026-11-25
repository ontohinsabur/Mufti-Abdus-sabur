import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import PrintButton from '@/components/PrintButton';
import { METHOD } from '@/components/PayMethod';

export const metadata = { title: 'ইনভয়েস | Mufti Abdus Sabur' };

// Same layout as the old MAS CRM invoice (green A4 design).
const tk = (n) => `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}৳`;
const dt = (x) => new Date(x).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }).replace(',', ',').replace(/ (am|pm)$/i, (m) => m.toUpperCase());
const dd = (x) => new Date(x).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Dhaka' });
const STATUS = { paid: 'PAID', partial: 'PARTIAL', unpaid: 'UNPAID' };

export default async function Invoice({ params }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params;
  const { data: o } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, phone, whatsapp)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: biz }, { data: allocs }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'business').maybeSingle(),
    supabase.from('payment_allocations').select('amount, payments!inner(payment_no, method, trx_id, status, verified_at, created_at)').eq('order_id', id).eq('payments.status', 'verified'),
  ]);
  const b = { name: 'Mufti Abdus Sabur', tagline: 'Facebook Ads Service', phone: '01927949015', email: 'info@muftiabdussabur.com', site: 'https://muftiabdussabur.com/', ...(biz?.value || {}) };
  const admin = profile?.role === 'admin';
  const c = o.profiles || {};
  const total = Number(o.total_bdt || 0);
  const paid = Number(o.paid_amount || 0);
  const due = o.status === 'cancelled' ? 0 : Math.max(0, total - paid);
  const pays = [...(allocs || [])].sort((x, y) => new Date(y.payments.verified_at || y.payments.created_at) - new Date(x.payments.verified_at || x.payments.created_at));
  const last = pays[0]?.payments;
  const method = last ? METHOD[last.method] || last.method : o.pay_later ? 'Pay Later (বাকি)' : '—';
  const trx = pays.map((a) => a.payments.trx_id).filter(Boolean).join(', ') || '—';
  const usdShown = o.spent_usd ?? o.budget_usd;
  const back = admin ? `/admin/orders/${o.id}` : `/orders/${o.id}`;

  return (
    <main className="inv-app">
      <style>{CSS}</style>
      <div className="inv-tools no-print">
        <a className="inv-tbtn" href={back}>← অর্ডারে ফিরে যান</a>
        <PrintButton />
      </div>
      <article className="inv-paper">
        <header className="inv-head">
          <div className="inv-logo"><img src="/brand-logo.svg" alt={b.name} /><small>{b.tagline}</small></div>
          <div className="inv-number">
            <b>INVOICE</b>
            <strong>{o.invoice_no || `#${o.order_no}`}</strong>
            <small>Invoice Date: {dt(o.created_at)}</small>
            <small>Order #{o.order_no}</small>
          </div>
        </header>
        <div className="inv-rule" />
        <div className="inv-contact">☎ {b.phone}　·　✉ {b.email}　·　{b.site}</div>

        <section className="inv-grid">
          <div className="inv-card">
            <h3>Customer Information · গ্রাহকের তথ্য</h3>
            <b>{c.full_name || c.email}</b>
            <p>{(c.whatsapp || c.phone) && <>Mobile / WhatsApp: {c.whatsapp || c.phone}<br /></>}Email: {c.email}</p>
          </div>
          <div className="inv-card">
            <h3>Billing / Service Information</h3>
            <b>{o.page_name || o.service_name}</b>
            <p>{o.page_name && <>Facebook Page: {o.page_name}<br /></>}Service: {o.service_name}{o.post_url && <><br />Post: <span className="inv-url">{o.post_url}</span></>}</p>
          </div>
        </section>

        <table className="inv-table">
          <thead><tr><th>Service Description</th><th>USD Budget</th><th>Qty / Duration</th><th>Unit Price</th><th>Total Amount</th></tr></thead>
          <tbody>
            <tr>
              <td><b>{o.service_name}</b>
                <small>{usdShown != null ? `${o.spent_usd != null ? 'Billed on actual spend' : 'Saved budget snapshot'}: $${Number(usdShown).toFixed(2)}${o.rate_bdt_per_usd ? ` × ৳${Number(o.rate_bdt_per_usd)}/USD` : ''} · BDT Budget Snapshot: ৳${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : o.customer_note ? o.customer_note.slice(0, 120) : ''}</small></td>
              <td className="num">{usdShown != null ? `$${Number(usdShown).toFixed(2)}` : '—'}</td>
              <td className="center">1{o.duration_days ? ` · ${o.duration_days} days` : ''}</td>
              <td className="num">{tk(total)}</td>
              <td className="num"><b>{tk(total)}</b></td>
            </tr>
          </tbody>
        </table>

        <section className="inv-grid inv-finance">
          <div className="inv-card">
            <h3>Payment Information · পেমেন্ট তথ্য</h3>
            <p>Payment Method: <b>{method}</b><br />
              Transaction ID: <b>{trx}</b><br />
              Payment Status: <b className={`inv-status ${o.status === 'cancelled' ? 'unpaid' : o.payment_status}`}>{o.status === 'cancelled' ? 'CANCELLED' : STATUS[o.payment_status]}</b><br />
              {last ? <>Payment Date: <b>{dd(last.verified_at || last.created_at)}</b></> : o.pay_later && o.due_date ? <>Due Date: <b>{dd(o.due_date)}</b></> : null}</p>
            {pays.length > 1 && (
              <p className="inv-paylist">{pays.map((a, i) => <span key={i}>#{a.payments.payment_no} · {METHOD[a.payments.method] || a.payments.method} · {tk(a.amount)}{a.payments.trx_id ? ` · ${a.payments.trx_id}` : ''}</span>)}</p>
            )}
          </div>
          <div className="inv-card inv-summary">
            <h3>Invoice Summary · হিসাব</h3>
            <div><span>Service / Order Total</span><b>{tk(total)}</b></div>
            <div><span>Additional Charges</span><b>{tk(0)}</b></div>
            <div><span>Paid Amount</span><b>{tk(paid)}</b></div>
            <div><span>Due Amount</span><b>{tk(due)}</b></div>
            <div className="inv-grand"><span>Grand Total</span><b>{tk(total)}</b></div>
          </div>
        </section>

        <section className="inv-note">
          <h3>Important Information · গুরুত্বপূর্ণ তথ্য</h3>
          <p>আপনার অর্ডারের জন্য ধন্যবাদ। অর্ডার বা সার্ভিস সম্পর্কে জানতে আমাদের সঙ্গে যোগাযোগ করুন।</p>
        </section>

        <footer className="inv-footer">
          <div><b>{b.name}</b><span>{b.tagline}</span><span>{b.phone} · {b.email}</span><span>{b.site}</span></div>
          <div>Thank you for your business<br /><small>আপনার আস্থার জন্য ধন্যবাদ</small></div>
        </footer>
      </article>
    </main>
  );
}

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
body{background:#eef3ef!important}
.inv-app{padding:18px 12px 40px;min-height:100vh;background:#eef3ef}
.inv-tools{max-width:190mm;margin:0 auto 12px;display:flex;gap:10px;justify-content:space-between}
.inv-tbtn,.inv-tools .btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-weight:700;border:1px solid #cfe0d4;background:#fff;color:#075b35;text-decoration:none;cursor:pointer;font-family:inherit;font-size:1rem}
.inv-tools .btn{background:linear-gradient(135deg,#064e2d,#087747);color:#fff;border:0}
.inv-paper{box-sizing:border-box;width:190mm;max-width:100%;min-height:277mm;margin:auto;background:#fff;color:#1f3328;border:1px solid #dce8df;border-radius:3mm;padding:10mm 11mm;font:9.5pt/1.5 Inter,"SolaimanLipi",sans-serif;display:flex;flex-direction:column;gap:4.5mm;box-shadow:0 5px 24px #064e2d18}
.inv-paper *{box-sizing:border-box}
.inv-head{display:flex;justify-content:space-between;align-items:center;gap:5mm;min-height:30mm}
.inv-logo{position:relative;width:64mm;height:17mm;flex:0 0 64mm}
.inv-logo img{display:block;width:64mm;height:17mm;object-fit:contain}
.inv-logo small{position:absolute;left:24%;top:74%;color:#60766a;font-size:8.5pt;line-height:1.1;white-space:nowrap}
.inv-number{background:linear-gradient(135deg,#064e2d,#087747);color:#fff;border-radius:3.5mm;padding:4mm 5mm;min-width:68mm;box-shadow:0 3mm 8mm rgba(6,78,45,.18)}
.inv-number b,.inv-number strong,.inv-number small{display:block}
.inv-number b{font-size:9pt;letter-spacing:3px;opacity:.85}
.inv-number strong{font-size:19pt;letter-spacing:.3px;margin:1.5mm 0 2mm}
.inv-number small{font-size:8.5pt;opacity:.92}
.inv-rule{height:1.4mm;border-radius:2mm;background:linear-gradient(90deg,#0b6a3d,#3d9c60,#c4dca5)}
.inv-contact{background:#f2f8f3;border-radius:2.5mm;padding:2.8mm 4mm;color:#315943;font-size:8.8pt;overflow-wrap:anywhere}
.inv-grid{display:grid;grid-template-columns:1fr 1fr;gap:4.5mm}
.inv-card{border:1px solid #dfe9e1;border-radius:3.5mm;background:#fbfdfb;padding:4.5mm 5mm;overflow-wrap:anywhere;min-width:0}
.inv-card h3,.inv-note h3{margin:0 0 2.5mm;padding-bottom:2mm;border-bottom:1px solid #e1ece3;color:#086139;font-size:10pt}
.inv-card>b{font-size:11pt;color:#16301f}
.inv-card p{margin:2mm 0 0;font-size:9pt;line-height:1.7}
.inv-url{font-size:7.8pt;color:#557064}
.inv-paylist span{display:block;font-size:8pt;color:#557064}
.inv-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9pt}
.inv-table th{background:#086239;color:#fff;text-align:left;padding:3.2mm 2.5mm;font-size:8.8pt}
.inv-table td{padding:3.6mm 2.5mm;border-bottom:1px solid #e7eee8;vertical-align:top;overflow-wrap:anywhere}
.inv-table th:nth-child(1){width:32%}.inv-table th:nth-child(2){width:13%}.inv-table th:nth-child(3){width:18%}.inv-table th:nth-child(4),.inv-table th:nth-child(5){width:18.5%}
.inv-table .num{text-align:right}.inv-table .center{text-align:center}
.inv-table small{display:block;color:#63776a;font-size:7.8pt;margin-top:1.2mm}
.inv-finance{align-items:stretch}
.inv-summary>div{display:flex;justify-content:space-between;gap:2mm;padding:2mm 0;border-bottom:1px solid #e5eee6;font-size:9pt}
.inv-summary>div:last-child{border:0}
.inv-summary .inv-grand{background:#e8f5e8;border-radius:2.5mm;margin:2.5mm -1.5mm -1.5mm;padding:3.5mm 3mm;color:#075b35;font-size:12.5pt;font-weight:800}
.inv-status{border-radius:12px;padding:.8mm 2.5mm;font-size:8.5pt}
.inv-status.paid{background:#dff3e5;color:#096236}.inv-status.partial{background:#fff0cb;color:#815600}.inv-status.unpaid{background:#fde7e4;color:#9b2c24}
.inv-note{background:#f0f8ee;border:1px solid #dcebd8;border-radius:3.5mm;padding:4mm 5mm}
.inv-note p{margin:0;font-size:9pt;line-height:1.7}
.inv-footer{margin-top:auto;background:linear-gradient(110deg,#064e2d,#087747);border-radius:3.5mm;padding:5mm 6mm;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:4mm;min-height:24mm}
.inv-footer div:first-child{display:flex;flex-direction:column;gap:.8mm}
.inv-footer b{font-size:12.5pt}.inv-footer span,.inv-footer small{font-size:8.5pt}
.inv-footer div:last-child{text-align:right;font-weight:700;font-size:10.5pt}
@media(max-width:900px){.inv-paper{width:100%;min-height:0;padding:5mm}.inv-head{flex-wrap:wrap}.inv-number{min-width:0;flex:1}.inv-grid{grid-template-columns:1fr}}
@media print{
  @page{size:A4 portrait;margin:8mm}
  html,body,.inv-app{background:#fff!important;margin:0!important;padding:0!important}
  .no-print,.sidebar,.topactions,.bottombar{display:none!important}
  .inv-paper{width:194mm!important;max-width:none!important;min-height:279mm!important;margin:0!important;padding:8mm 9mm!important;gap:4mm!important;border:0!important;border-radius:0!important;box-shadow:none!important;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
  .inv-grid{grid-template-columns:1fr 1fr!important}
  .inv-head,.inv-grid,.inv-finance,.inv-note,.inv-footer,.inv-table{break-inside:avoid!important;page-break-inside:avoid!important}
  a{color:inherit!important;text-decoration:none!important}
}`;
