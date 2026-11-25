'use client';
import { useState } from 'react';

// Post picture from the Facebook link (via our link-preview route), with a play mark like the old CRM.
export default function PostThumb({ url }) {
  const [bad, setBad] = useState(!url);
  return (
    <span className="oc-thumb">
      {!bad && <img src={`/api/link-preview?img=1&url=${encodeURIComponent(url)}`} alt="" loading="lazy" onError={() => setBad(true)} />}
      <i className="oc-play" aria-hidden="true" />
    </span>
  );
}
