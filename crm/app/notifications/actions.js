'use server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

export async function saveSubscription(sub, ua) {
  const { supabase, user } = await getSession();
  if (!user || !sub?.endpoint) return { err: 'auth' };
  const { error } = await supabase.from('push_subscriptions').upsert({ user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: (ua || '').slice(0, 200) }, { onConflict: 'endpoint' });
  return error ? { err: error.message } : { ok: true };
}
export async function removeSubscription(endpoint) {
  const { supabase, user } = await getSession();
  if (!user) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}
export async function vapidKey() {
  const { supabase } = await getSession();
  const { data } = await supabase.rpc('vapid_public_key');
  return data;
}
export async function markAllRead() {
  const { supabase, user } = await getSession();
  if (!user) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/', 'layout');
}
export async function sendTest() {
  const { supabase } = await getSession();
  const { error } = await supabase.rpc('send_test_notification');
  revalidatePath('/notifications');
  return error ? { err: error.message } : { ok: 'টেস্ট নোটিফিকেশন পাঠানো হয়েছে। কয়েক সেকেন্ডের মধ্যে ফোনে আসার কথা।' };
}
