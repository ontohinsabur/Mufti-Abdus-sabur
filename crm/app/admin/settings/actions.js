'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function saveTelegram(_, form) {
  const { supabase } = await requireAdmin();
  const token = form.get('token')?.toString().trim() || '';
  const chat = form.get('chat')?.toString().trim() || '';
  if (token && !/^\d{5,}:[\w-]{20,}$/.test(token)) return { err: 'টোকেনটি সঠিক মনে হচ্ছে না।' };
  if (token || form.get('clear') === '1') { const { error } = await supabase.rpc('set_private_config', { p_key: 'telegram_bot_token', p_value: token }); if (error) return { err: error.message }; }
  const { error } = await supabase.rpc('set_private_config', { p_key: 'telegram_chat_id', p_value: chat });
  if (error) return { err: error.message };
  revalidatePath('/admin/settings');
  return { ok: 'Telegram সেটিং সংরক্ষণ হয়েছে।' };
}
