import './globals.css';

export const metadata = {
  title: 'Mufti Abdus Sabur CRM',
  description: 'ফেসবুক বুস্টিং ও অ্যাড সেবার কাস্টমার পোর্টাল',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};
export const viewport = { themeColor: '#0B1220', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="bn" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
