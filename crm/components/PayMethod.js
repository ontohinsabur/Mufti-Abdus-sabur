'use client';
import { useState } from 'react';

export const METHOD = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', bank: 'ব্যাংক', cash: 'ক্যাশ', wallet: 'ওয়ালেট' };

export function enabledMethods(pay) {
  const m = [];
  ['bkash', 'nagad', 'rocket', 'bank'].forEach((k) => pay?.[k]?.enabled && m.push(k));
  if (pay?.cash_enabled) m.push('cash');
  return m;
}

// method picker + account details + sender/trx inputs (names: method, sender, trx)
export default function PayMethod({ pay, admin }) {
  const list = admin ? ['bkash', 'nagad', 'rocket', 'bank', 'cash'] : enabledMethods(pay);
  const [m, setM] = useState(list[0] || '');
  const [copied, setCopied] = useState(false);
  if (!list.length) return <div className="alert warn">এখন কোনো পেমেন্ট পদ্ধতি চালু নেই। হোয়াটসঅ্যাপে যোগাযোগ করুন।</div>;
  const acc = pay?.[m] || {};
  const num = m === 'bank' ? acc.account_number : acc.number;
  const copy = async () => { try { await navigator.clipboard.writeText(num); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div>
      <label>পেমেন্ট পদ্ধতি</label>
      <div className="tabs">{list.map((k) => <a key={k} href="#" className={m === k ? 'active' : ''} onClick={(e) => { e.preventDefault(); setM(k); }}>{METHOD[k]}</a>)}</div>
      <input type="hidden" name="method" value={m} />
      {!admin && num && (
        <div className="price-box" style={{ marginTop: 0 }}>
          {m === 'bank'
            ? <div>ব্যাংক: <b>{acc.bank_name || ''}</b> · নাম: <b>{acc.account_name}</b> · শাখা: {acc.branch}{acc.routing_number ? ` · রাউটিং: ${acc.routing_number}` : ''}</div>
            : <div>{METHOD[m]} ({acc.account_type || 'Personal'}) নম্বরে <b>Send Money</b> করুন:</div>}
          <div className="copy" style={{ marginTop: 6 }}><input readOnly value={num} /><button type="button" className="btn sm" onClick={copy}>{copied ? 'কপি হয়েছে' : 'কপি'}</button></div>
          {acc.instructions && <p className="muted">{acc.instructions}</p>}
        </div>
      )}
      {m !== 'cash' && (<>
        {m !== 'bank' && <><label>যে নম্বর থেকে পাঠিয়েছেন</label><input name="sender" inputMode="tel" placeholder="01XXXXXXXXX" /></>}
        <label>ট্রানজেকশন আইডি (TrxID){admin ? ' — ঐচ্ছিক' : ''}</label><input name="trx" placeholder="যেমন: DKN7U8UORN" />
      </>)}
      {m === 'cash' && !admin && <p className="muted">ক্যাশ পেমেন্ট অ্যাডমিন হাতে পেয়ে নিশ্চিত করবেন।</p>}
    </div>
  );
}
