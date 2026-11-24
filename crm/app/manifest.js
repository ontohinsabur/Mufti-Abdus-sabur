export default function manifest() {
  return {
    name: 'Mufti Abdus Sabur CRM', short_name: 'MAS CRM',
    description: 'ফেসবুক বুস্টিং ও অ্যাড সেবার কাস্টমার পোর্টাল',
    start_url: '/', scope: '/', display: 'standalone',
    background_color: '#0B1220', theme_color: '#0B1220',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}
