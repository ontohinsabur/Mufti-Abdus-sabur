// data needed by the order form
export async function loadOrderFormData(supabase, { admin, userId }) {
  const svcQ = supabase.from('services').select('*').order('sort');
  const [{ data: services }, { data: setting }] = await Promise.all([
    admin ? svcQ : svcQ.eq('active', true),
    supabase.from('settings').select('value').eq('key', 'access_id').maybeSingle(),
  ]);
  let pages, rates = {}, customers = [];
  if (admin) {
    const [{ data: p }, { data: r }, { data: c }] = await Promise.all([
      supabase.from('facebook_pages').select('*').eq('archived', false).order('name'),
      supabase.from('customer_rates').select('*').eq('active', true),
      supabase.from('profiles').select('id, full_name, email, phone').eq('role', 'customer').eq('status', 'approved').order('full_name'),
    ]);
    pages = p || []; customers = c || [];
    (r || []).forEach((x) => { rates[`${x.customer_id}:${x.service_id}`] = x; });
  } else {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('facebook_pages').select('*').eq('customer_id', userId).eq('archived', false).order('name'),
      supabase.from('customer_rates').select('*').eq('customer_id', userId).eq('active', true),
    ]);
    pages = p || [];
    (r || []).forEach((x) => { rates[x.service_id] = x; });
  }
  return { services: services || [], pages, rates, customers, access: setting?.value || {} };
}
