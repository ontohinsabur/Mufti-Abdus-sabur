'use client';
import { useActionState } from 'react';
import { saveTelegram } from './actions';
import { sendTest } from '@/app/notifications/actions';

export default function TelegramForm({ status }) {
  const [s, act, busy] = useActionState(saveTelegram, null);
  const [t, testAct, testBusy] = useActionState(async () => sendTest(), null);
  return (
    <div className="card">
      <h2>Telegram অ্যালার্ট</h2>
      <p className="muted">নতুন অর্ডার, পেমেন্ট, রেজিস্ট্রেশন আর সাপোর্টের খবর আপনার Telegram-এ যাবে। টোকেন একবার সেভ করলে আর দেখা যায় না, নিরাপদে থাকে।</p>
      <p>অবস্থা: {status?.telegram_token_set ? <span className="badge approved">টোকেন সেট আছে</span> : <span className="badge pending">টোকেন নেই</span>}</p>
      <form action={act}>
        {s?.err && <div className="alert err">{s.err}</div>}{s?.ok && <div className="alert ok">{s.ok}</div>}
        <label>Bot Token <span className="muted">(BotFather থেকে)</span></label><input name="token" type="password" autoComplete="off" placeholder={status?.telegram_token_set ? '•••••• (বদলাতে নতুন টোকেন দিন)' : '123456:ABC...'} />
        <label>Chat ID</label><input name="chat" defaultValue={status?.telegram_chat_id || ''} />
        <button className="btn block" disabled={busy}>সংরক্ষণ</button>
      </form>
      <form action={testAct} style={{ marginTop: 8 }}>
        {t?.ok && <div className="alert ok">{t.ok}</div>}
        <button className="btn ghost block" disabled={testBusy}>টেস্ট নোটিফিকেশন পাঠান</button>
      </form>
    </div>
  );
}
