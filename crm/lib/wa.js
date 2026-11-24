// WhatsApp links. Bangladeshi numbers like 01XXXXXXXXX become 8801XXXXXXXXX.
export function waNumber(raw) {
  const d = (raw || '').replace(/[০-৯]/g, (x) => '০১২৩৪৫৬৭৮৯'.indexOf(x)).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('880')) return d;
  if (d.startsWith('01') && d.length === 11) return '88' + d;
  if (d.startsWith('1') && d.length === 10) return '880' + d;
  return d;
}
export const waLink = (num, text) => `https://wa.me/${waNumber(num)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
