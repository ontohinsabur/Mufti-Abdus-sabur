import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = /(^|\.)(facebook\.com|fb\.watch|fb\.com|instagram\.com)$/i;

function meta(html, key) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i');
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2] ?? '') : '';
}
function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
// guess the page name from facebook's title formats: "Page Name | ...", "... | By Page Name", "Page Name - ..."
function guessPage(title, html) {
  const by = title.match(/\|\s*By\s+(.+)$/i) || title.match(/^(.+?)\s+(?:posted|shared|is live)/i);
  if (by) return by[1].trim();
  const author = html.match(/"(?:author|owner)"\s*:\s*\{[^{}]*"name"\s*:\s*"([^"]+)"/i);
  if (author) return decode(JSON.parse(`"${author[1]}"`));
  const parts = title.split(/\s+[|·-]\s+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length > 1 && parts[0].length <= 60) return parts[0];
  return '';
}

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'auth' }, { status: 401 });

  const raw = new URL(request.url).searchParams.get('url') || '';
  let u;
  try { u = new URL(raw); } catch { return NextResponse.json({ error: 'bad url' }, { status: 400 }); }
  if (!/^https?:$/.test(u.protocol) || !ALLOWED.test(u.hostname)) return NextResponse.json({ error: 'not facebook' }, { status: 400 });

  try {
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Accept-Language': 'bn,en;q=0.8' },
      redirect: 'follow', signal: AbortSignal.timeout(8000),
    });
    const html = (await res.text()).slice(0, 600000);
    const title = meta(html, 'og:title') || meta(html, 'twitter:title') || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '');
    const out = {
      title: decode(title).slice(0, 200),
      description: meta(html, 'og:description').slice(0, 300),
      image: meta(html, 'og:image'),
      page_name: guessPage(decode(title), html).slice(0, 150),
    };
    if (new URL(request.url).searchParams.get('img')) {
      if (!out.image) return new NextResponse(null, { status: 404 });
      return NextResponse.redirect(out.image, { status: 302, headers: { 'Cache-Control': 'private, max-age=3600' } });
    }
    return NextResponse.json(out, { headers: { 'Cache-Control': 'private, max-age=600' } });
  } catch {
    if (new URL(request.url).searchParams.get('img')) return new NextResponse(null, { status: 404 });
    return NextResponse.json({ title: '', description: '', image: '', page_name: '' });
  }
}
