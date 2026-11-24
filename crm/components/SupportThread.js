import { bnDate } from '@/lib/format';
export default function SupportThread({ msgs, me }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(msgs || []).map((m) => (
        <div key={m.id} className={`bubble ${m.sender === me ? 'me' : 'them'}`}>{m.body}<div style={{ fontSize: '.75rem', opacity: .75, marginTop: 4 }}>{bnDate(m.created_at)}</div></div>
      ))}
    </div>
  );
}
