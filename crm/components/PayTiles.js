'use client';
import { useEffect, useState } from 'react';

export const METHOD = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', bank: 'ব্যাংক', cash: 'ক্যাশ', wallet: 'ওয়ালেট' };
const LOGO = {
  none: ['!', 'none'], later: ['⏱', 'later'], bkash: ['bK', 'bkash'], nagad: ['N', 'nagad'], rocket: ['R', 'rocket'], bank: ['🏛', 'bank'], cash: ['৳', 'cash'],
};

// Old-CRM style payment picker: method tiles, account card, sender/trx fields.
// Sends pay_mode (none | now | later) and, for "now", method + sender + trx.
export default function PayTiles({ pay, admin, payLater, amount, money, laterBox, onMode }) {
  const methods = admin ? ['bkash', 'nagad', 'rocket', 'bank', 'cash']
    : ['bkash', 'nagad', 'rocket', 'bank'].filter((k) => pay?.[k]?.enabled).concat(pay?.cash_enabled ? ['cash'] : []);
  const tiles = [...(admin ? [['none', 'বাকি (পেমেন্ট হয়নি)']] : []), ...methods.map((k) => [k, METHOD[k]]), ...(payLater ? [['later', 'Pay Later (বাকি)']] : [])];
  const [sel, setSel] = useState(admin ? 'none' : methods[0] || (payLater ? 'later' : ''));
  const [copied, setCopied] = useState(false);
  const mode = sel === 'none' ? 'none' : sel === 'later' ? 'later' : 'now';
  useEffect(() => { onMode?.(mode); }, [mode]); // eslint-disable-line
  const acc = pay?.[sel] || {};
  const num = sel === 'bank' ? acc.account_number : acc.number;
  const copy = async () => { try { await navigator.clipboard.writeText(num); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  if (!tiles.length) return <div className="alert warn">এখন কোনো পেমেন্ট পদ্ধতি চালু নেই। হোয়াটসঅ্যাপে যোগাযোগ করুন।</div>;
  const opt = admin ? <em>(ঐচ্ছিক)</em> : null;

  return (
    <div className="pt">
      <input type="hidden" name="pay_mode" value={mode} />
      {mode === 'now' && <input type="hidden" name="method" value={sel} />}
      <div className="pt-top">
        <div>
          <span className="of-lbl">{admin ? 'কীভাবে পেমেন্ট করেছে?' : 'কীভাবে পেমেন্ট করবেন?'}</span>
          <div className="pt-tiles">
            {tiles.map(([k, label]) => (
              <button type="button" key={k} className={`pt-tile ${LOGO[k][1]} ${sel === k ? 'on' : ''}`} onClick={() => setSel(k)}>
                <i>{LOGO[k][0]}</i><b>{label}</b>
              </button>
            ))}
          </div>
        </div>
        {mode === 'now' && num && sel !== 'cash' && (
          <div className={`pt-acc ${sel}`}>
            <div>
              <small>{sel === 'bank' ? `${acc.bank_name || 'ব্যাংক'} · ${acc.account_name || ''}${acc.branch ? ` · ${acc.branch}` : ''}` : `${METHOD[sel]} নম্বর (${acc.account_type || 'Personal'})`}</small>
              <b>{num}</b>
              {acc.instructions && <small>{acc.instructions}</small>}
            </div>
            <button type="button" onClick={copy}>{copied ? 'কপি হয়েছে' : 'কপি'}</button>
          </div>
        )}
        {mode === 'later' && laterBox}
      </div>

      {mode === 'now' && (
        <div className="of-grid" style={{ marginTop: 16 }}>
          <div className="of-field">
            <span className="of-lbl">{admin ? 'কত টাকা পেয়েছেন?' : 'কত টাকা পাঠাবেন?'}</span>
            <input readOnly value={money(amount)} />
            <small className="of-help">পুরো টাকা একসাথে নেওয়া হয়, আংশিক পেমেন্ট নয়।</small>
          </div>
          {sel !== 'cash' && sel !== 'bank' && (
            <div className="of-field">
              <span className="of-lbl">যে নম্বর থেকে পেমেন্ট {admin ? 'এসেছে' : 'করেছেন'} {opt}</span>
              <input name="sender" inputMode="tel" placeholder="যে নম্বর থেকে পেমেন্ট করেছে" />
            </div>
          )}
          {sel !== 'cash' && (
            <div className="of-field">
              <span className="of-lbl">ট্রানজেকশন আইডি {opt}</span>
              <input name="trx" placeholder="যেমন: DKN7U8UORN" />
            </div>
          )}
          {sel === 'cash' && !admin && <p className="muted full">ক্যাশ পেমেন্ট অ্যাডমিন হাতে পেয়ে নিশ্চিত করবেন।</p>}
        </div>
      )}
    </div>
  );
}
