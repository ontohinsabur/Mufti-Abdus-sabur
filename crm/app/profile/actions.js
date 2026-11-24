'use server';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

export async function saveProfile(_, form) {
  const { supabase, user } = await getSession();
  if (!user) return { err: 'আবার লগইন করুন।' };
  const pw = form.get('password')?.toString() || '';
  const { error } = await supabase.from('profiles').update({
    full_name: form.get('full_name')?.toString().trim(),
    phone: form.get('phone')?.toString().trim() || null,
    whatsapp: form.get('whatsapp')?.toString().trim() || null,
  }).eq('id', user.id);
  if (error) return { err: 'সংরক্ষণ করা যায়নি: ' + error.message };
  if (pw) {
    if (pw.length < 6) return { err: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
    const { error: e2 } = await supabase.auth.updateUser({ password: pw });
    if (e2) return { err: 'পাসওয়ার্ড বদলানো যায়নি: ' + e2.message };
  }
  revalidatePath('/profile');
  return { ok: pw ? 'প্রোফাইল ও নতুন পাসওয়ার্ড সংরক্ষণ হয়েছে।' : 'প্রোফাইল সংরক্ষণ হয়েছে।' };
}

export async function addPage(_, form) {
  const { supabase, user } = await getSession();
  if (!user) return { err: 'আবার লগইন করুন।' };
  const name = form.get('name')?.toString().trim();
  if (!name) return { err: 'পেজের নাম লিখুন।' };
  const { error } = await supabase.from('facebook_pages').insert({ customer_id: user.id, name, url: form.get('url')?.toString().trim() || null });
  if (error) return { err: 'পেজ যোগ করা যায়নি: ' + error.message };
  revalidatePath('/profile');
  return { ok: 'পেজ যোগ হয়েছে।' };
}

export async function archivePage(form) {
  const { supabase, user } = await getSession();
  if (!user) return;
  await supabase.from('facebook_pages').update({ archived: true }).eq('id', form.get('id'));
  revalidatePath('/profile');
}
