'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function setStatus(form) {
  const { supabase, user } = await requireAdmin();
  const id = form.get('id'); const status = form.get('status');
  if (!['approved', 'pending', 'rejected'].includes(status)) return;
  await supabase.from('profiles').update({
    status, approved_at: status === 'approved' ? new Date().toISOString() : null,
    approved_by: status === 'approved' ? user.id : null,
  }).eq('id', id);
  await supabase.from('audit_log').insert({ actor: user.id, action: 'customer_status', target: id, details: { status } });
  revalidatePath('/admin'); revalidatePath('/admin/customers'); revalidatePath(`/admin/customers/${id}`);
}

// admin edits a customer's account details (name, mobile, WhatsApp, note)
export async function updateCustomer(_, form) {
  const { supabase, user } = await requireAdmin();
  const id = form.get('id');
  const v = (k) => form.get(k)?.toString().trim() || null;
  const name = v('full_name');
  if (!name) return { err: 'নাম লিখুন।' };
  const { error } = await supabase.from('profiles').update({ full_name: name, phone: v('phone'), whatsapp: v('whatsapp'), note: v('note') }).eq('id', id);
  if (error) return { err: error.message };
  await supabase.from('audit_log').insert({ actor: user.id, action: 'customer_edit', target: id, details: { full_name: name } });
  revalidatePath(`/admin/customers/${id}`); revalidatePath('/admin/customers');
  return { ok: 'কাস্টমারের তথ্য সংরক্ষণ হয়েছে।' };
}
