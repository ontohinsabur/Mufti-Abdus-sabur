import Link from 'next/link';
import OrderStatus from '@/components/OrderStatus';
import { taka, usd, bnDate, timeLeft, PAY, bnNum } from '@/lib/format';

export default function OrderList({ orders, base, admin, reorderBase }) {
  if (!orders?.length) return <p className="muted">কোনো অর্ডার নেই।</p>;
  return (
    <div className="list">
      {orders.map((o) => (
        <div className="row" key={o.id}>
          <Link href={`${base}/${o.id}`} style={{ color: 'inherit', flex: 1, minWidth: 220 }}>
            <b>#{o.order_no} · {o.service_name}</b> <OrderStatus status={o.status} />
            {admin && o.profiles && <div className="muted">👤 {o.profiles.full_name || o.profiles.email}</div>}
            <div className="muted">
              {o.page_name && <>📄 {o.page_name} · </>}
              {o.budget_usd ? <>{usd(o.budget_usd)} · {bnNum(o.duration_days)} দিন · </> : null}
              {taka(o.total_bdt)} · {PAY[o.payment_status]}
            </div>
            <div className="muted">{bnDate(o.created_at)}{o.status === 'running' || o.status === 'off' ? ` · ⏱ ${timeLeft(o) || ''}` : ''}</div>
          </Link>
          <div className="actions">
            <Link className="btn sm ghost" href={`${reorderBase}?from=${o.id}`} title="আবার অর্ডার">🔃 আবার অর্ডার</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
