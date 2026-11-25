import Link from 'next/link';
import Icon from './Icon';

const n = (x) => (x || 0).toLocaleString('bn-BD');

export default function Tile({ href, label, icon, tone, solid, count }) {
  return (
    <Link href={href} className="tile">
      <span className={`tile-ic ${tone} ${solid ? 'solid' : ''}`}><Icon name={icon} size={26} /></span>
      <b>{label}</b>
      {count > 0 && <em className="tile-count">{n(count)}</em>}
    </Link>
  );
}

