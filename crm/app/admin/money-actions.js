'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

const clean = (e) => e.message.replace(/^.*?ERROR:\s*/, '');
const n = (v) => { const s = (v ?? '').toString().replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim(); return s === '' ? null : Number(s); };
const touch = () => revalidatePath('/', 'layout');

export async function reviewPayment(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('review_payment', { p_payment: form.get('id'), p_ok: form.get('ok') === '1', p_note: form.get('note') || null });
  if (error) return { err: clean(error) };
  touch(); return { ok: form.get('ok') === '1' ? 'পেমেন্ট যাচাই হয়েছে।' : 'পেমেন্ট বাতিল করা হয়েছে।' };
}

export async function processWithdraw(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('process_wallet_request', { p_id: Number(form.get('id')), p_ok: form.get('ok') === '1', p_trx: form.get('trx') || null, p_note: form.get('note') || null });
  if (error) return { err: clean(error) };
  touch(); return { ok: 'অনুরোধ আপডেট হয়েছে।' };
}

export async function walletAdjust(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_wallet_adjust', { p_customer: form.get('customer_id'), p_amount: n(form.get('amount')), p_note: form.get('note')?.toString() || '' });
  if (error) return { err: clean(error) };
  touch(); return { ok: 'ওয়ালেট সমন্বয় হয়েছে।' };
}

export async function savePayLater(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('profiles').update({
    pay_later_enabled: form.get('enabled') === 'on', pay_later_limit: n(form.get('limit')) || 0, pay_later_due_days: n(form.get('days')) || 7,
  }).eq('id', form.get('customer_id'));
  if (error) return { err: clean(error) };
  touch(); return { ok: 'Pay Later সেটিং সংরক্ষণ হয়েছে।' };
}

export async function settleUnused(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('settle_unused_budget', { p_order: form.get('id'), p_spent_usd: n(form.get('spent')), p_mode: form.get('mode'), p_note: form.get('note') || null });
  if (error) return { err: clean(error) };
  touch(); return { ok: 'হিসাব মেলানো হয়েছে।' };
}

export async function savePaymentSettings(_, form) {
  const { supabase } = await requireAdmin();
  const m = (k) => ({ enabled: form.get(`${k}_enabled`) === 'on', number: form.get(`${k}_number`)?.toString().trim() || '', account_type: form.get(`${k}_type`)?.toString() || 'Personal', instructions: form.get(`${k}_ins`)?.toString().trim() || '' });
  const value = {
    bkash: m('bkash'), nagad: m('nagad'), rocket: m('rocket'),
    bank: { enabled: form.get('bank_enabled') === 'on', bank_name: form.get('bank_name')?.toString().trim() || '', account_name: form.get('bank_acname')?.toString().trim() || '',
            account_number: form.get('bank_number')?.toString().trim() || '', branch: form.get('bank_branch')?.toString().trim() || '', routing_number: form.get('bank_routing')?.toString().trim() || '', instructions: form.get('bank_ins')?.toString().trim() || '' },
    cash_enabled: form.get('cash_enabled') === 'on',
  };
  const { error } = await supabase.from('settings').upsert({ key: 'payment', value });
  if (error) return { err: clean(error) };
  const rate = n(form.get('usd_rate'));
  if (rate) await supabase.from('settings').upsert({ key: 'usd_bdt_rate', value: rate });
  touch(); return { ok: 'পেমেন্ট সেটিং সংরক্ষণ হয়েছে।' };
}
