import Link from 'next/link';

export default function TopBar({ profile, active }) {
  const admin = profile?.role === 'admin';
  const links = admin
    ? [['/admin', 'ড্যাশবোর্ড'], ['/admin/orders', 'অর্ডার'], ['/admin/customers', 'গ্রাহক'], ['/admin/services', 'সেবা ও রেট']]
    : [['/dashboard', 'ড্যাশবোর্ড'], ['/orders', 'অর্ডার'], ['/profile', 'প্রোফাইল']];
  return (
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">M</span><span>Mufti Abdus Sabur</span></Link>
      <nav className="nav">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={active === href ? 'active' : ''}>{label}</Link>
        ))}
        <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
          <button className="btn sm ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>লগআউট</button>
        </form>
      </nav>
    </header>
  );
}
