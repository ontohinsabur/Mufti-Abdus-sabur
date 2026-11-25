// Facebook-style blue "Verified" badge (same design as the old CRM).
// Shown after an approved customer's name; never for admins, pending or rejected accounts.
export function isVerified(p) {
  return !!p && p.status === 'approved' && p.role !== 'admin';
}

export default function VerifiedBadge({ profile, size = 16 }) {
  if (!isVerified(profile)) return null;
  return (
    <svg className="vb" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="ভেরিফাইড">
      <title>ভেরিফাইড</title>
      <path fill="#1877F2" d="M12 1l2.6 2.1 3.3-.4 1.2 3.1 3.1 1.2-.4 3.3L23 12l-2.1 2.6.4 3.3-3.1 1.2-1.2 3.1-3.3-.4L12 23l-2.6-2.1-3.3.4-1.2-3.1-3.1-1.2.4-3.3L1 12l2.1-2.6-.4-3.3 3.1-1.2 1.2-3.1 3.3.4z" />
      <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.3l3 3 6-6.3" />
    </svg>
  );
}
