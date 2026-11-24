export const STATUS = {
  pending: { label: 'অপেক্ষমাণ', cls: 'pending' },
  accepted: { label: 'গৃহীত', cls: 'accepted' },
  running: { label: 'এড রানিং', cls: 'running' },
  off: { label: 'অফ', cls: 'off' },
  completed: { label: 'সম্পন্ন', cls: 'approved' },
  cancelled: { label: 'বাতিল', cls: 'rejected' },
};
export const PAY = { unpaid: 'অপরিশোধিত', partial: 'আংশিক পরিশোধ', paid: 'পরিশোধিত' };
export const bnNum = (n, d = 0) => Number(n || 0).toLocaleString('bn-BD', { minimumFractionDigits: d, maximumFractionDigits: 2 });
export const taka = (n) => (n === null || n === undefined ? 'কোটেশন বাকি' : '৳' + bnNum(n));
export const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const bnDate = (d) => (d ? new Date(d).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
export function timeLeft(o) {
  if (!o.run_end) return null;
  const end = new Date(o.run_end).getTime();
  const now = o.paused_at ? new Date(o.paused_at).getTime() : Date.now();
  const ms = end - now;
  if (ms <= 0) return 'সময় শেষ';
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  return `${d ? bnNum(d) + ' দিন ' : ''}${bnNum(h)} ঘণ্টা বাকি${o.paused_at ? ' (থেমে আছে)' : ''}`;
}
