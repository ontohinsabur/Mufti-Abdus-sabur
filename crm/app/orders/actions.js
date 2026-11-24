'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/supabase/server';

const num = (v) => { const s = (v ?? '').toString().replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim(); return s === '' ? null : Number(s); };

export async function placeOrder(_, form) {
  const { supabase, user, profile } = await getSession();
  if (!user) return { err: 'আবার লগইন করুন।' };
  const admin = profile?.role === 'admin';
  const pageId = form.get('page_id')?.toString() || null;
  const budget = num(form.get('budget_usd')); const days = num(form.get('duration_days'));
  if (budget !== null && Number.isNaN(budget)) return { err: 'বাজেট সংখ্যায় লিখুন।' };
  if (days !== null && (Number.isNaN(days) || !Number.isInteger(days))) return { err: 'দিন পূর্ণ সংখ্যায় লিখুন।' };
  const customer = admin ? form.get('customer_id')?.toString() : null;
  if (admin && !customer) return { err: 'গ্রাহক নির্বাচন করুন।' };

  const { data, error } = await supabase.rpc('place_order', {
    p_service: form.get('service_id')?.toString(),
    p_page_id: pageId,
    p_page_name: form.get('page_name')?.toString() || null,
    p_post_url: form.get('post_url')?.toString() || null,
    p_budget_usd: budget, p_duration: days,
    p_note: form.get('note')?.toString() || null,
    p_customer: customer,
    p_pay_mode: form.get('pay_mode')?.toString() || (admin ? 'none' : 'now'),
    p_use_wallet: form.get('use_wallet') === 'on',
    p_method: form.get('method')?.toString() || null,
    p_sender: form.get('sender')?.toString() || null,
    p_trx: form.get('trx')?.toString() || null,
  });
  if (error) return { err: error.message.replace(/^.*?ERROR:\s*/, '') };
  // remember the access confirmation for this page (valid for 3 days)
  if (!admin && form.get('access_yes') === '1' && data?.page_id) {
    await supabase.from('facebook_pages').update({ access_confirmed_at: new Date().toISOString() }).eq('id', data.page_id);
  }
  revalidatePath('/orders'); revalidatePath('/admin/orders');
  redirect(admin ? `/admin/orders/${data.id}?new=1` : `/orders/${data.id}?new=1`);
}
