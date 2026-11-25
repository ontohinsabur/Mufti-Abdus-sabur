// data needed by the order form
export async function loadOrderFormData(supabase, { admin, userId }) {
  const svcQ = supabase.from('services').select('*').order('sort');
  const [{ data: services }, { data: setting }, { data: paySet }] = await Promise.all([
    admin ? svcQ : svcQ.eq('active', true),
    supabase.from('settings').select('value').eq('key', 'access_id').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'payment').maybeSingle(),
  ]);
  let summary = null; const summaries = {};
  let pages, rates = {}, customers = [];
  if (admin) {
    const [{ data: p }, { data: r }, { data: c }] = await Promise.all([
      supabase.from('facebook_pages').select('*').eq('archived', false).order('name'),
      supabase.from('customer_rates').select('*').eq('active', true),
      supabase.from('profiles').select('id, full_name, email, phone, status, role').eq('role', 'customer').eq('status', 'approved').order('full_name'),
    ]);
    pages = p || []; customers = c || [];
    const sums = await Promise.all(customers.map((x) => supabase.rpc('customer_summary', { p_customer: x.id }).single()));
    customers.forEach((x, i) => { summaries[x.id] = { ...(sums[i].data || {}), name: x.full_name }; });
    (r || []).forEach((x) => { rates[`${x.customer_id}:${x.service_id}`] = x; });
  } else {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('facebook_pages').select('*').eq('customer_id', userId).eq('archived', false).order('name'),
      supabase.from('customer_rates').select('*').eq('customer_id', userId).eq('active', true),
    ]);
    pages = p || [];
    (r || []).forEach((x) => { rates[x.service_id] = x; });
    summary = (await supabase.rpc('customer_summary').single()).data;
  }
  return { services: services || [], pages, rates, customers, access: setting?.value || {}, pay: paySet?.value || {}, summary, summaries };
}
