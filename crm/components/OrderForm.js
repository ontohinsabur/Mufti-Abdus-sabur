'use client';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { placeOrder } from '@/app/orders/actions';
import { bnNum, usd } from '@/lib/format';

const NEW = '__new__';
const FRESH_MS = 3 * 86400000;

export default function OrderForm({ services, pages, rates, access, initial = {}, admin = false, customers = [], customerId }) {
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

  const svc = services.find((s) => s.id === svcId);
  const isAd = svc?.pricing_type === 'per_usd';
  const custPages = admin ? pages.filter((p) => p.customer_id === cust) : pages;
  const page = custPages.find((p) => p.id === pageId);
  const accessFresh = page?.access_confirmed_at && Date.now() - new Date(page.access_confirmed_at).getTime() < FRESH_MS;
  const needAccess = isAd && !admin && !accessFresh;

  // keep the selected page valid when the customer (admin view) changes
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
  const total = isAd ? (Number(budget) || 0) * (rate || 0) : rate;
  const minErr = isAd && Number(days) > 0 && Number(budget) > 0 && Number(budget) < Number(days);

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

  return (
    <form action={act} className="card" ref={topRef}>
      {state?.err && <div className="alert err">{state.err}</div>}

      {admin && (<>
        <label>গ্রাহক</label>
        <select name="customer_id" value={cust} onChange={(e) => setCust(e.target.value)} required>
          <option value="">— গ্রাহক নির্বাচন করুন —</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}{c.phone ? ` (${c.phone})` : ''}</option>)}
        </select>
      </>)}

      <label>সেবা</label>
      <select name="service_id" value={svcId} onChange={(e) => setSvcId(e.target.value)}>
        {services.map((s) => <option key={s.id} value={s.id}>{s.name}{s.description ? ` — ${s.description}` : ''}</option>)}
      </select>

      {isAd && (<>
        <label>ফেসবুক পোস্টের লিংক</label>
        <input name="post_url" value={post} onChange={(e) => setPost(e.target.value)} placeholder="https://www.facebook.com/..." inputMode="url" />
        {preview && (
          <div className="preview">
            {preview.image && <img src={preview.image} alt="" referrerPolicy="no-referrer" />}
            <div><b>{preview.title || 'পোস্ট'}</b><div className="muted">{(preview.description || '').slice(0, 140)}</div></div>
          </div>
        )}

        <label>ফেসবুক পেজ</label>
        <select value={pageId} onChange={(e) => setPageId(e.target.value)}>
          {custPages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <option value={NEW}>+ নতুন পেজ</option>
        </select>
        <input type="hidden" name="page_id" value={pageId === NEW ? '' : pageId} />
        {pageId === NEW && <input name="page_name" value={newPage} onChange={(e) => setNewPage(e.target.value)} placeholder="নতুন পেজের নাম (পরের বার তালিকায় থাকবে)" style={{ marginTop: 8 }} />}

        {!admin && pageId !== NEW && accessFresh && (
          <div className="alert ok" style={{ marginTop: 10 }}>✔ এই পেজের এক্সেস দেওয়া আছে বলে নিশ্চিত করেছেন।</div>
        )}
        {needAccess && (
          <div className="price-box">
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

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label>বাজেট (ডলার)</label><input name="budget_usd" value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="যেমন 10" /></div>
          <div><label>কতদিন চলবে</label><input name="duration_days" value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" placeholder="দিন" /></div>
        </div>
        {minErr && <div className="alert warn" style={{ marginTop: 8 }}>Meta-র নিয়মে প্রতিদিন কমপক্ষে ১ ডলার লাগে। {bnNum(days)} দিনের জন্য কমপক্ষে {usd(days)} দিন।</div>}
      </>)}

      <label>নোট <span className="muted">(ঐচ্ছিক)</span></label>
      <textarea name="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="টার্গেট এলাকা, বয়স বা অন্য কিছু জানাতে চাইলে লিখুন" />

      <div className="price-box">
        {svc?.pricing_type === 'quote' || !rate
          ? <span>এই সেবার দাম আলোচনা করে ঠিক হবে। অর্ডার দিলে আমরা যোগাযোগ করব।</span>
          : <>মোট: <b>৳{bnNum(total)}</b>{isAd && <span className="muted"> ({usd(budget || 0)} × ৳{bnNum(rate)})</span>}</>}
      </div>

      <button className="btn block" disabled={busy || (needAccess && accessYes !== true)}>
        {busy ? 'অর্ডার হচ্ছে…' : needAccess && accessYes !== true ? 'আগে এক্সেস নিশ্চিত করুন' : 'অর্ডার দিন'}
      </button>
    </form>
  );
}
