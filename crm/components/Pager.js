import Link from 'next/link';
// simple page links: ‹ ১ ২ ৩ › (keeps the other query params)
export function paginate(list, sp, per = 10) {
  const pages = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(pages, Math.max(1, parseInt(sp?.page, 10) || 1));
  return { rows: list.slice((page - 1) * per, page * per), page, pages };
}
export default function Pager({ page, pages, base, sp }) {
  if (pages <= 1) return null;
  const href = (n) => { const q = new URLSearchParams(); Object.entries(sp || {}).forEach(([k, v]) => { if (k !== 'page' && v) q.set(k, v); }); if (n > 1) q.set('page', n); const s = q.toString(); return s ? `${base}?${s}` : base; };
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return (
    <nav className="pager">
      {page > 1 && <Link href={href(page - 1)}>‹</Link>}
      {nums.map((n, i) => n === '…' ? <span key={'d' + i}>…</span> : <Link key={n} href={href(n)} className={n === page ? 'on' : ''}>{n.toLocaleString('bn-BD')}</Link>)}
      {page < pages && <Link href={href(page + 1)}>›</Link>}
    </nav>
  );
}
