const LABEL = { approved: 'অনুমোদিত', pending: 'অপেক্ষমাণ', rejected: 'বাতিল' };
export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status === 'approved' && <span className="blue-tick">✔</span>}{LABEL[status] || status}</span>;
}
