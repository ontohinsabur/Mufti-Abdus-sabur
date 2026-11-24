# Mufti Abdus Sabur — স্ট্যাটিক ওয়েব অ্যাপ

https://muftiabdussabur.com এর পূর্ণ কপি (২৪ নভেম্বর ২০২৬)। কোনো সার্ভার বা ডাটাবেস লাগে না, যেকোনো স্ট্যাটিক হোস্টে (Vercel, Netlify, GitHub Pages, cPanel) চলবে।

## কী আছে
- হোমপেজ, পরিচিতি, সেবাসমূহ (১০টি সেবার পেজ), যেভাবে কাজ করি, যোগাযোগ, FAQ
- ব্লগ: ৫৪টি পোস্ট, পেজিনেশন, ক্যাটাগরি ও ট্যাগ পেজ
- নীতিমালা: প্রাইভেসি, শর্তাবলি, সার্ভিস ও রিফান্ড, পেমেন্ট
- সব ছবি, CSS, JS (`wp-content/`, `wp-includes/`)
- PWA: `mas-manifest.webmanifest` + `mas-service-worker.js` (হোম স্ক্রিনে অ্যাপ হিসেবে ইনস্টল করা যায়)
- `data/`: সব পোস্ট, পেজ, ক্যাটাগরি, ট্যাগ ও মিডিয়ার কাঁচা ডাটা (JSON)
- `sitemap.xml`, `robots.txt`, `404.html`, `vercel.json`

## যা বদলানো হয়েছে
- ব্লগ পোস্টের মন্তব্য ফর্ম (এর জন্য WordPress লাগত) সরিয়ে হোয়াটসঅ্যাপ বাটন দেওয়া হয়েছে।
- কাস্টমার পোর্টাল / লগইন / কার্ট লিংকগুলো https://crm.muftiabdussabur.com/ এ যায়।
- WooCommerce ও WordPress-এর সার্ভার-নির্ভর স্ক্রিপ্ট বাদ দেওয়া হয়েছে।
- canonical ও শেয়ার (og:) ট্যাগ আগের মতো muftiabdussabur.com এর দিকেই রাখা হয়েছে।

## Vercel-এ পাবলিশ
Vercel → Add New Project → এই রিপোজিটরি ইমপোর্ট → Framework: **Other**, Build Command ফাঁকা, Output Directory `.` → Deploy।
