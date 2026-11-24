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
  revalidatePath('/admin'); revalidatePath('/admin/customers');
}
