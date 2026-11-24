'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

const clean = (e) => e.message.replace(/^.*?ERROR:\s*/, '');
const n = (v) => { const s = (v ?? '').toString().replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim(); return s === '' ? null : Number(s); };

export async function changeStatus(_, form) {
  const { supabase } = await requireAdmin();
  const id = form.get('id');
  const { error } = await supabase.rpc('set_order_status', { p_order: id, p_status: form.get('status'), p_note: form.get('note') || null });
  if (error) return { err: clean(error) };
  revalidatePath(`/admin/orders/${id}`); revalidatePath('/admin/orders');
  return { ok: 'স্ট্যাটাস বদলানো হয়েছে।' };
}

export async function setPrice(_, form) {
  const { supabase } = await requireAdmin();
  const id = form.get('id');
  const { error } = await supabase.rpc('set_order_price', { p_order: id, p_total: n(form.get('total')) });
  if (error) return { err: clean(error) };
  revalidatePath(`/admin/orders/${id}`);
  return { ok: 'দাম ঠিক করা হয়েছে।' };
}

export async function saveNote(_, form) {
  const { supabase } = await requireAdmin();
  const id = form.get('id');
  const { error } = await supabase.from('orders').update({ admin_note: form.get('admin_note')?.toString().trim() || null }).eq('id', id);
  if (error) return { err: clean(error) };
  revalidatePath(`/admin/orders/${id}`);
  return { ok: 'নোট সংরক্ষণ হয়েছে।' };
}

export async function splitOrder(_, form) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('split_off_order', { p_order: form.get('id'), p_spent_usd: n(form.get('spent')) });
  if (error) return { err: clean(error) };
  revalidatePath('/admin/orders');
  redirect(`/admin/orders/${data.id}?split=1`);
}
