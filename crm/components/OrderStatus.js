import { STATUS } from '@/lib/format';
export default function OrderStatus({ status }) {
  const s = STATUS[status] || { label: status, cls: '' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
