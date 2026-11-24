'use server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

const clean = (e) => e.message.replace(/^.*?ERROR:\s*/, '');
const n = (v) => { const s = (v ?? '').toString().replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim(); return s === '' ? null : Number(s); };
const touch = () => ['/payments', '/orders', '/dashboard', '/ledger', '/wallet', '/admin/payments', '/admin/orders'].forEach((p) => revalidatePath(p, 'layout'));

export async function payOrders(_, form) {
  const { supabase, user, profile } = await getSession();
  if (!user) return { err: 'আবার লগইন করুন।' };
  const ids = form.getAll('order_id').map(String).filter(Boolean);
  const { data, error } = await supabase.rpc('submit_payment', {
    p_orders: ids, p_method: form.get('method')?.toString(), p_sender: form.get('sender')?.toString() || null,
    p_trx: form.get('trx')?.toString() || null, p_note: form.get('note')?.toString() || null,
    p_amount: profile?.role === 'admin' ? n(form.get('amount')) : null,
  });
  if (error) return { err: clean(error) };
  touch();
  return { ok: profile?.role === 'admin' ? `পেমেন্ট #${data.payment_no} রেকর্ড হয়েছে (৳${data.amount})।` : `পেমেন্ট #${data.payment_no} জমা হয়েছে (৳${data.amount})। যাচাইয়ের পর অর্ডারে পরিশোধিত দেখাবে।` };
}

export async function payWithWallet(_, form) {
  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc('pay_with_wallet', { p_order: form.get('order_id') });
  if (error) return { err: clean(error) };
  touch();
  return { ok: `ওয়ালেট থেকে ৳${data.amount} পরিশোধ হয়েছে।` };
}

export async function requestWithdraw(_, form) {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc('request_wallet_withdraw', {
    p_amount: n(form.get('amount')), p_method: form.get('method')?.toString() || 'bkash',
    p_account: form.get('account')?.toString() || '', p_note: form.get('note')?.toString() || null,
  });
  if (error) return { err: clean(error) };
  touch();
  return { ok: 'টাকা তোলার অনুরোধ পাঠানো হয়েছে। অ্যাডমিন পাঠিয়ে দিলে এখানে দেখাবে।' };
}
