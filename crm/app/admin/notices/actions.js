'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function publish(_, form) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('publish_notice', { p_title: form.get('title')?.toString() || '', p_body: form.get('body')?.toString() || '', p_notify: form.get('notify') === 'on' });
  if (error) return { err: error.message.replace(/^.*?ERROR:\s*/, '') };
  revalidatePath('/', 'layout');
  return { ok: 'নোটিশ প্রকাশ হয়েছে।' };
}
export async function toggle(form) {
  const { supabase } = await requireAdmin();
  await supabase.from('notices').update({ active: form.get('active') === '1' }).eq('id', form.get('id'));
  revalidatePath('/', 'layout');
}
export async function remove(form) {
  const { supabase } = await requireAdmin();
  await supabase.from('notices').delete().eq('id', form.get('id'));
  revalidatePath('/', 'layout');
}
