'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function saveRates(_, form) {
  const { supabase } = await requireAdmin();
  const cid = form.get('customer_id');
  const ids = form.getAll('service_id');
  for (const sid of ids) {
    const r = (form.get(`rate_${sid}`) || '').toString().trim();
    const f = (form.get(`fixed_${sid}`) || '').toString().trim();
    if (r === '' && f === '') { await supabase.from('customer_rates').delete().eq('customer_id', cid).eq('service_id', sid); continue; }
    const { error } = await supabase.from('customer_rates').upsert({
      customer_id: cid, service_id: sid, rate_bdt_per_usd: r === '' ? null : Number(r), fixed_price_bdt: f === '' ? null : Number(f),
      active: true, updated_at: new Date().toISOString(),
    });
    if (error) return { err: error.message };
  }
  revalidatePath(`/admin/customers/${cid}`);
  return { ok: 'গ্রাহকের রেট সংরক্ষণ হয়েছে।' };
}
