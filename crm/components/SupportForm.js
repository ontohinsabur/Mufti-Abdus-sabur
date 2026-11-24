'use client';
import { useActionState, useEffect, useRef } from 'react';
import { postMessage } from '@/app/support/actions';

export default function SupportForm({ ticketId, newTicket, orders = [] }) {
  const [s, act, busy] = useActionState(postMessage, null);
  const ref = useRef(null);
  useEffect(() => { if (s?.ok) ref.current?.reset(); }, [s]);
  return (
    <form action={act} ref={ref} className="card">
      {s?.err && <div className="alert err">{s.err}</div>}
      {ticketId && <input type="hidden" name="ticket_id" value={ticketId} />}
      {newTicket && (<>
        <label>বিষয়</label><input name="subject" placeholder="যেমন: অর্ডার নিয়ে প্রশ্ন" />
        {orders.length > 0 && (<><label>কোন অর্ডার নিয়ে? <span className="muted">(ঐচ্ছিক)</span></label>
          <select name="order_id"><option value="">—</option>{orders.map((o) => <option key={o.id} value={o.id}>#{o.order_no} · {o.service_name}</option>)}</select></>)}
      </>)}
      <label>বার্তা</label><textarea name="body" rows={4} />
      <button className="btn block" disabled={busy}>{busy ? 'পাঠানো হচ্ছে…' : 'পাঠান'}</button>
    </form>
  );
}
