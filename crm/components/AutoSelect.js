'use client';
// a <select> that submits its form as soon as it changes
export default function AutoSelect({ name, value, options, className = '' }) {
  return (
    <select name={name} defaultValue={value} className={className} onChange={(e) => e.target.form?.requestSubmit()}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
