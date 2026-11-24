// orders the customer still has to pay (off & cancelled are not counted; money waiting for verification is not "due")
export async function dueOrders(supabase, customerId) {
  let q = supabase.from('orders').select('id, order_no, service_name, page_name, total_bdt, paid_amount, pay_later, due_date, status, created_at, customer_id')
    .not('status', 'in', '(off,cancelled)').not('total_bdt', 'is', null).neq('payment_status', 'paid').order('created_at');
  if (customerId) q = q.eq('customer_id', customerId);
  const { data: orders } = await q;
  if (!orders?.length) return [];
  const { data: pend } = await supabase.from('payment_allocations').select('order_id, amount, payments!inner(status)').in('order_id', orders.map((o) => o.id)).eq('payments.status', 'submitted');
  const pending = {};
  (pend || []).forEach((p) => { pending[p.order_id] = (pending[p.order_id] || 0) + Number(p.amount); });
  return orders.map((o) => ({ ...o, pending: pending[o.id] || 0, remaining: Math.round((Number(o.total_bdt) - Number(o.paid_amount) - (pending[o.id] || 0)) * 100) / 100 }))
    .filter((o) => o.remaining > 0);
}

// ledger: orders are debits, verified payments are credits (cancelled orders are left out)
export async function buildLedger(supabase, customerId) {
  const [{ data: orders }, { data: pays }] = await Promise.all([
    supabase.from('orders').select('id, order_no, service_name, page_name, total_bdt, budget_usd, status, created_at').eq('customer_id', customerId).neq('status', 'cancelled').not('total_bdt', 'is', null),
    supabase.from('payments').select('id, payment_no, amount, method, trx_id, status, created_at, verified_at').eq('customer_id', customerId).eq('status', 'verified'),
  ]);
  const rows = [
    ...(orders || []).map((o) => ({ at: o.created_at, kind: 'order', ref: `অর্ডার #${o.order_no}`, text: `${o.service_name}${o.page_name ? ' · ' + o.page_name : ''}${o.status === 'off' ? ' (অফ)' : ''}`, debit: Number(o.total_bdt), credit: 0, id: o.id, usd: o.budget_usd })),
    ...(pays || []).map((p) => ({ at: p.verified_at || p.created_at, kind: 'pay', ref: `পেমেন্ট #${p.payment_no}`, text: p.trx_id ? `${p.method} · ${p.trx_id}` : p.method, debit: 0, credit: Number(p.amount), method: p.method })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));
  let bal = 0;
  rows.forEach((r) => { bal = Math.round((bal + r.debit - r.credit) * 100) / 100; r.balance = bal; });
  // monthly summary (Dhaka time)
  const months = {};
  rows.forEach((r) => {
    const k = new Date(r.at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }).slice(0, 7);
    const m = (months[k] ||= { month: k, orders: 0, usd: 0, billed: 0, paid: 0 });
    if (r.kind === 'order') { m.orders++; m.usd += Number(r.usd || 0); m.billed += r.debit; } else m.paid += r.credit;
  });
  return { rows, balance: bal, months: Object.values(months).sort((a, b) => b.month.localeCompare(a.month)) };
}
