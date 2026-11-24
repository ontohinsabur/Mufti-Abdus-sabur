'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

export async function postMessage(_, form) {
  const { supabase, user, profile } = await getSession();
  if (!user) return { err: 'আবার লগইন করুন।' };
  const ticket = form.get('ticket_id') ? Number(form.get('ticket_id')) : null;
  const { data, error } = await supabase.rpc('support_post', {
    p_ticket: ticket, p_body: form.get('body')?.toString() || '', p_subject: form.get('subject')?.toString() || null, p_order: form.get('order_id')?.toString() || null,
  });
  if (error) return { err: error.message.replace(/^.*?ERROR:\s*/, '') };
  const base = profile.role === 'admin' ? '/admin/support' : '/support';
  revalidatePath(`${base}/${data}`); revalidatePath(base);
  if (!ticket) redirect(`${base}/${data}`);
  return { ok: 'পাঠানো হয়েছে।', t: Date.now() };
}
export async function setTicketStatus(form) {
  const { supabase } = await getSession();
  await supabase.from('support_tickets').update({ status: form.get('status') }).eq('id', form.get('id'));
  revalidatePath('/admin/support'); revalidatePath(`/admin/support/${form.get('id')}`);
}
