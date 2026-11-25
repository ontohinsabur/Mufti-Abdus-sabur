'use client';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { placeOrder } from '@/app/orders/actions';
import { bnNum, usd } from '@/lib/format';
import PayTiles from '@/components/PayTiles';
import { CustomerPicker, ServicePicker } from '@/components/OrderPickers';

const NEW = '__new__';
const FRESH_MS = 3 * 86400000;
const BUDGETS = [5, 10, 20, 50, 100];
const DAYS = [3, 5, 7, 10, 15, 30];
const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const shortUrl = (u) => u.replace(/^https?:\/\/(www\.|web\.|m\.)?/, '').slice(0, 32) + (u.length > 40 ? '…' : '');

function Sec({ n, title, sub, children }) {
  return (
    <section className="of-sec">
      <div className="of-sec-h"><span>{n}</span><div><h3>{title}</h3>{sub && <small>{sub}</small>}</div></div>
      {children}
    </section>
  );
}

export default function OrderForm({ services, pages, rates, access, pay, summary, summaries = {}, posts = {}, initial = {}, admin = false, customers = [], customerId }) {
  const [state, act, busy] = useActionState(placeOrder, null);
  const topRef = useRef(null);
  const [cust, setCust] = useState(initial.customer_id || customerId || '');
  const [svcId, setSvcId] = useState(initial.service_id || services[0]?.id || '');
  const [pageId, setPageId] = useState(initial.page_id || (pages.length ? pages[0].id : NEW));
  const [newPage, setNewPage] = useState(initial.page_id ? '' : initial.page_name || '');
  const [post, setPost] = useState(initial.post_url || '');
  const [budget, setBudget] = useState(initial.budget_usd ? String(initial.budget_usd) : '');
  const [days, setDays] = useState(initial.duration_days ? String(initial.duration_days) : '');
  const [note, setNote] = useState(initial.customer_note || '');
  const [accessYes, setAccessYes] = useState(null);
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [payMode, setPayMode] = useState(admin ? 'none' : 'now');

  const svc = services.find((s) => s.id === svcId);
  const isAd = svc?.pricing_type === 'per_usd';
  const custPages = admin ? pages.filter((p) => p.customer_id === cust) : pages;
  const page = custPages.find((p) => p.id === pageId);
  const accessFresh = page?.access_confirmed_at && Date.now() - new Date(page.access_confirmed_at).getTime() < FRESH_MS;
  const needAccess = isAd && !admin && !accessFresh;
  const prevPosts = (admin ? posts[cust] : posts.me) || [];
  const sm = admin ? summaries[cust] : summary;

  useEffect(() => { if (admin && !custPages.find((p) => p.id === pageId)) setPageId(custPages[0]?.id || NEW); }, [cust]); // eslint-disable-line
  useEffect(() => { setAccessYes(null); }, [pageId]);
  useEffect(() => { if (state?.err) topRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state]);

  // price preview (the server recalculates — this is only for display)
  const rate = useMemo(() => {
    if (!svc) return null;
    const r = rates?.[(admin ? cust + ':' : '') + svc.id];
    if (svc.pricing_type === 'per_usd') return Number(r?.rate_bdt_per_usd || svc.rate_bdt_per_usd || 0);
    if (svc.pricing_type === 'fixed_bdt') return Number(r?.fixed_price_bdt || svc.fixed_price_bdt || 0);
    return null;
  }, [svc, rates, cust, admin]);
  const priceOf = (sv) => {
    const r = rates?.[(admin ? cust + ':' : '') + sv.id];
    if (sv.pricing_type === 'per_usd') { const v = Number(r?.rate_bdt_per_usd || sv.rate_bdt_per_usd || 0); return v ? `৳${bnNum(v)} / ডলার` : ''; }
    if (sv.pricing_type === 'fixed_bdt') { const v = Number(r?.fixed_price_bdt || sv.fixed_price_bdt || 0); return v ? `৳${bnNum(v)}` : ''; }
    return 'কোটেশন';
  };
  const total = isAd ? (Number(budget) || 0) * (rate || 0) : rate;
  const minErr = isAd && Number(days) > 0 && Number(budget) > 0 && Number(budget) < Number(days);
  const priced = svc?.pricing_type !== 'quote' && rate;
  const wallet = Number(sm?.wallet || 0);
  const fromWallet = useWallet ? Math.min(wallet, total || 0) : 0;
  const rest = Math.max(0, (total || 0) - fromWallet);

  // auto-detect page from the post link
  const timer = useRef();
  useEffect(() => {
    clearTimeout(timer.current);
    if (!/^https?:\/\/[^\s]*(facebook\.com|fb\.watch|fb\.com|instagram\.com)\//i.test(post.trim())) { setPreview(null); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/link-preview?url=' + encodeURIComponent(post.trim()));
        const d = await r.json();
        setPreview(d.title || d.image ? d : null);
        if (d.page_name) {
          const hit = custPages.find((p) => p.name.trim().toLowerCase() === d.page_name.trim().toLowerCase());
          if (hit) setPageId(hit.id); else { setPageId(NEW); setNewPage(d.page_name); }
        }
      } catch { setPreview(null); }
    }, 600);
  }, [post]); // eslint-disable-line

  const copy = async (txt, k) => { try { await navigator.clipboard.writeText(txt); setCopied(k); setTimeout(() => setCopied(''), 1500); } catch {} };
  let n = 0; const no = () => (++n).toLocaleString('bn-BD');

  return (
    <form action={act} className="of" ref={topRef}>
      {state?.err && <div className="alert err">{state.err}</div>}

      <Sec n={no()} title="অর্ডারের তথ্য" sub={admin ? 'কাস্টমার ও সার্ভিস বেছে নিন' : 'কোন সার্ভিস নেবেন বেছে নিন'}>
        <div className="of-grid">
          {admin && (
            <div className="of-field full">
              <span className="of-lbl">কাস্টমার *</span>
              <CustomerPicker customers={customers} value={cust} onChange={setCust} summary={summaries[cust]} />
              <input type="hidden" name="customer_id" value={cust} />
            </div>
          )}
          <div className="of-field full">
            <span className="of-lbl">সার্ভিস *</span>
            <ServicePicker services={services} value={svcId} onChange={setSvcId} priceOf={priceOf} />
            <input type="hidden" name="service_id" value={svcId} />
            {admin && <small className="of-help">কাস্টমারের নিজস্ব রেট থাকলে সেটাই আগে ধরা হয়।</small>}
          </div>
          <div className="of-field full">
            <span className="of-lbl">অর্ডার নোট <em>(ঐচ্ছিক)</em></span>
            <textarea name="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="কাস্টম অডিয়েন্স / গ্রেটিং মেসেজ / FAQ / অন্যান্য তথ্য" />
          </div>
        </div>
      </Sec>

      {isAd && (
        <Sec n={no()} title="বিজ্ঞাপনের বিবরণ" sub="বাজেট, সময় ও পোস্টের লিংক">
          <div className="of-grid">
            <div className="of-field">
              <span className="of-lbl">কত ডলারের বিজ্ঞাপন? *</span>
              <input name="budget_usd" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="যেমন: ২০" />
              <div className="of-quick">{BUDGETS.map((b) => <button type="button" key={b} className={Number(budget) === b ? 'on' : ''} onClick={() => setBudget(String(b))}>${bnNum(b)}</button>)}</div>
              {rate ? <b className="of-rate">প্রতি ডলার {money(rate)}</b> : null}
              <small className="of-help">দিনে কমপক্ষে $1 খরচ করতে হবে (Meta-র নিয়ম)।</small>
            </div>
            <div className="of-field">
              <span className="of-lbl">কতদিন চলবে? *</span>
              <input name="duration_days" value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" placeholder="দিন সংখ্যা" />
              <div className="of-quick">{DAYS.map((d) => <button type="button" key={d} className={Number(days) === d ? 'on' : ''} onClick={() => setDays(String(d))}>{bnNum(d)} দিন</button>)}</div>
            </div>
            {minErr && <div className="alert warn full">Meta-র নিয়মে প্রতিদিন কমপক্ষে ১ ডলার লাগে। {bnNum(days)} দিনের জন্য কমপক্ষে {usd(days)} দিন।</div>}

            <div className="of-field">
              <span className="of-lbl">ফেসবুক পোস্টের লিংক *</span>
              <input name="post_url" value={post} onChange={(e) => setPost(e.target.value)} placeholder="https://www.facebook.com/..." inputMode="url" />
              <small className="of-help">Facebook Post, Reel বা Video URL দিন।</small>
              {prevPosts.length > 0 && (<>
                <small className="of-help">আগের পোস্ট লিংক:</small>
                <div className="of-prev">{prevPosts.map((u) => <button type="button" key={u} className={post === u ? 'on' : ''} onClick={() => setPost(u)} title={u}>{shortUrl(u)}</button>)}</div>
              </>)}
            </div>
            <div className="of-field">
              <span className="of-lbl">লিংকের প্রিভিউ</span>
              {preview ? (
                <div className="of-preview">
                  {preview.image && <img src={preview.image} alt="" referrerPolicy="no-referrer" />}
                  <div><b>{preview.title || 'পোস্ট'}</b><small>{(preview.description || '').slice(0, 120)}</small>
                    <a href={post} target="_blank" rel="noopener noreferrer">পোস্ট খুলুন ↗</a></div>
                </div>
              ) : <div className="of-preview empty">লিংক দিলে এখানে প্রিভিউ ও পোস্ট খোলার লিংক দেখা যাবে।</div>}
            </div>

            <div className="of-field full">
              <span className="of-lbl">ফেসবুক পেজ</span>
              <div className="of-pages">
                {custPages.map((p) => <button type="button" key={p.id} className={pageId === p.id ? 'on' : ''} onClick={() => setPageId(p.id)}><i>f</i>{p.name}</button>)}
                <button type="button" className={`add ${pageId === NEW ? 'on' : ''}`} onClick={() => setPageId(NEW)}>+ নতুন পেজ</button>
              </div>
              <input type="hidden" name="page_id" value={pageId === NEW ? '' : pageId} />
              {pageId === NEW && <input name="page_name" value={newPage} onChange={(e) => setNewPage(e.target.value)} placeholder="ফেসবুক পেজের নাম লিখুন (পরের বার তালিকায় থাকবে)" style={{ marginTop: 8 }} />}
              <small className="of-help">পোস্টের লিংক দিলে পেজ নিজে থেকেই বাছাই হয়ে যায়।</small>
            </div>

            {!admin && pageId !== NEW && accessFresh && <div className="alert ok full">✔ এই পেজের এক্সেস দেওয়া আছে বলে নিশ্চিত করেছেন।</div>}
            {needAccess && (
              <div className="price-box full">
                <b style={{ fontSize: '1rem' }}>এই পেজে আমাদের এক্সেস দিয়েছেন?</b>
                <div className="choice">
                  <button type="button" className={`btn ok ${accessYes === true ? 'on' : ''}`} onClick={() => setAccessYes(true)}>হ্যাঁ</button>
                  <button type="button" className={`btn ghost ${accessYes === false ? 'on' : ''}`} onClick={() => setAccessYes(false)}>না</button>
                </div>
                {accessYes === false && (
                  <div style={{ marginTop: 10 }}>
                    <p className="muted">এড চালাতে আপনার পেজে আমাদের এক্সেস দরকার। নিচের লিংক খুলে পেজ সিলেক্ট করে এক্সেস দিন, তারপর "হ্যাঁ" চাপুন।</p>
                    {access?.link && (<><label>এক্সেস লিংক</label>
                      <div className="copy"><input readOnly value={access.link} /><button type="button" className="btn sm" onClick={() => copy(access.link, 'l')}>{copied === 'l' ? 'কপি হয়েছে' : 'কপি'}</button></div></>)}
                    {access?.business_portfolio_id && (<><label>Business Portfolio ID</label>
                      <div className="copy"><input readOnly value={access.business_portfolio_id} /><button type="button" className="btn sm" onClick={() => copy(access.business_portfolio_id, 'b')}>{copied === 'b' ? 'কপি হয়েছে' : 'কপি'}</button></div></>)}
                    <ol className="muted" style={{ paddingLeft: 18 }}>
                      <li>ফেসবুকে আপনার পেজের Settings → <b>Page access</b> খুলুন।</li>
                      <li><b>Add partner</b> চেপে উপরের Business Portfolio ID বসান।</li>
                      <li>বিজ্ঞাপন (Ads) এর অনুমতি চালু করে সেভ করুন।</li>
                    </ol>
                  </div>
                )}
                <input type="hidden" name="access_yes" value={accessYes ? '1' : ''} />
              </div>
            )}
          </div>
        </Sec>
      )}

      {!priced ? (
        <section className="of-sec">
          <input type="hidden" name="pay_mode" value="none" />
          <div className="price-box" style={{ marginTop: 0 }}>এই সেবার দাম আলোচনা করে ঠিক হবে। {admin ? 'অর্ডারটি কোটেশন হিসেবে তৈরি হবে।' : 'অর্ডার দিলে আমরা যোগাযোগ করব।'}</div>
        </section>
      ) : (
        <Sec n={no()} title="পেমেন্ট" sub={admin ? 'টাকা পেয়ে থাকলে মাধ্যম বেছে নিন, না পেলে বাকি রাখুন' : 'পুরো টাকা পরিশোধ করে অর্ডার নিশ্চিত করুন'}>
          {wallet > 0 && (
            <label className="of-wallet">
              <input type="checkbox" name="use_wallet" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
              <span><b>ব্যালেন্স থেকে কাটুন ({admin ? 'কাস্টমারের' : 'আপনার'} ব্যালেন্স {money(wallet)})</b>
                <small>টিক দেওয়া থাকলে অর্ডারের দাম থেকে আগে ব্যালেন্সের টাকা কাটা হবে, শুধু বাকিটা পেমেন্ট করতে হবে।</small></span>
            </label>
          )}
          {rest > 0 ? (
            <PayTiles key={cust} onMode={setPayMode} pay={pay} admin={admin} payLater={!!sm?.pay_later_enabled} amount={rest} money={money}
              laterBox={sm && (
                <div className="pt-acc later"><div>
                  <small>বাকির লিমিট {money(sm.pay_later_limit)} · বর্তমান বাকি {money(sm.due)}</small>
                  <b>আরও নেওয়া যাবে {money(sm.available_credit)}</b>
                  {rest > Number(sm.available_credit) && <small className="bad">{sm.name || 'আপনার'} বাকির লিমিট নেই, আগে পেমেন্ট করেন।</small>}
                </div></div>
              )} />
          ) : <><input type="hidden" name="pay_mode" value="now" /><p className="muted">পুরো দাম ব্যালেন্স থেকে কাটা হবে।</p></>}
          <PaySummary mode={rest > 0 ? payMode : 'now'} total={total} rest={rest} fromWallet={fromWallet} isAd={isAd} budget={budget} rate={rate} />
        </Sec>
      )}

      <div className="of-submit">
        <button className="btn-new" disabled={busy || (needAccess && accessYes !== true) || (admin && !cust)}>
          {busy ? 'অর্ডার হচ্ছে…' : needAccess && accessYes !== true ? 'আগে এক্সেস নিশ্চিত করুন' : admin && !cust ? 'আগে কাস্টমার বেছে নিন' : admin ? 'অর্ডার তৈরি করুন' : 'অর্ডার দিন'}
        </button>
        <a href={admin ? '/admin/orders' : '/orders'} className="oc-btn">বাতিল</a>
      </div>
    </form>
  );
}

function PaySummary({ total, rest, fromWallet, isAd, budget, rate, mode }) {
  const paid = fromWallet + (mode === 'now' ? rest : 0);
  return (
    <div className="of-sum">
      <div><small>অর্ডারের মোট</small><b>{money(total)}</b>{isAd && <em>{usd(budget || 0)} × {money(rate)}</em>}</div>
      <div><small>পরিশোধ</small><b className="ok">{money(paid)}</b></div>
      <div><small>বাকি</small><b className={(total || 0) - paid > 0.009 ? 'due' : ''}>{money(Math.max(0, (total || 0) - paid))}</b></div>
    </div>
  );
}
