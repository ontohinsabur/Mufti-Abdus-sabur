'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

const n = (v) => { const s = (v ?? '').toString().trim(); return s === '' ? null : Number(s); };

export async function saveService(_, form) {
  const { supabase } = await requireAdmin();
  const id = form.get('id');
  const { error } = await supabase.from('services').update({
    name: form.get('name')?.toString().trim(), description: form.get('description')?.toString().trim() || null,
    rate_bdt_per_usd: n(form.get('rate_bdt_per_usd')), fixed_price_bdt: n(form.get('fixed_price_bdt')),
    active: form.get('active') === 'on',
  }).eq('id', id);
  if (error) return { err: error.message };
  revalidatePath('/admin/services');
  return { ok: 'সংরক্ষণ হয়েছে।' };
}

export async function saveAccess(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('settings').upsert({
    key: 'access_id', value: { link: form.get('link')?.toString().trim() || '', business_portfolio_id: form.get('bpid')?.toString().trim() || '' },
  });
  if (error) return { err: error.message };
  revalidatePath('/admin/services');
  return { ok: 'এক্সেস আইডি সংরক্ষণ হয়েছে।' };
}
