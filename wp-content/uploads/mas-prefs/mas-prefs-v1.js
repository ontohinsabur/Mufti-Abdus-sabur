/* Mufti Abdus Sabur — theme (light/dark/system) + language (bn/en) */
(function () {
  var H = document.documentElement, LS = window.localStorage;
  var BASE = '/wp-content/uploads/mas-prefs/';
  var DARK_CSS = BASE + 'mas-dark-v1.css', DICT_JS = BASE + 'i18n-en-v1.js';
  function get(k, d) { try { return LS.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;

  /* ---------- theme ---------- */
  function ensureDarkCss() {
    if (document.getElementById('mas-dark-css')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.id = 'mas-dark-css'; l.href = DARK_CSS;
    document.head.appendChild(l);
  }
  function applyTheme(pref) {
    var dark = pref === 'dark' || (pref === 'system' && mq && mq.matches);
    if (dark) ensureDarkCss();
    H.setAttribute('data-theme', dark ? 'dark' : 'light');
    H.setAttribute('data-theme-pref', pref);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#061230' : '#1877F2');
    mark('[data-theme-set]', 'themeSet', pref);
    if (dark) { setTimeout(darkFix, 300); setTimeout(darkFix, 1600); }
  }
  if (mq) {
    var onSys = function () { if (get('mas_theme', 'light') === 'system') applyTheme('system'); };
    mq.addEventListener ? mq.addEventListener('change', onSys) : mq.addListener(onSys);
  }


  /* safety net: light surface left behind with light (converted) text */
  function rgb(c){var m=c&&c.match(/[\d.]+/g);if(!m)return null;return {r:+m[0],g:+m[1],b:+m[2],a:m.length>3?+m[3]:1};}
  function L(c){function f(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);}
  function darkFix(){
    if(H.getAttribute('data-theme')!=='dark')return;
    var els=document.querySelectorAll('main *, footer *, .mas-audience-notice *, section *');
    for(var i=0;i<els.length;i++){var e=els[i];if(e.closest('svg,header.mas-site-header')||e.classList.contains('mas-dk-fix'))continue;
      var cs=getComputedStyle(e),b=rgb(cs.backgroundColor);if(!b||b.a<.5||L(b)<.72)continue;
      var ts=[e].concat([].slice.call(e.querySelectorAll('h1,h2,h3,h4,p,b,strong,small,span,li,a,label')).slice(0,14));
      for(var k=0;k<ts.length;k++){var c=rgb(getComputedStyle(ts[k]).color);if(c&&c.a>.3&&L(c)>.4&&ts[k].textContent.trim()){e.classList.add('mas-dk-fix');break;}}}
  }
  /* ---------- language ---------- */
  var BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  var MONTHS = { 'জানুয়ারি': 'January', 'ফেব্রুয়ারি': 'February', 'মার্চ': 'March', 'এপ্রিল': 'April', 'মে': 'May', 'জুন': 'June', 'জুলাই': 'July', 'আগস্ট': 'August', 'সেপ্টেম্বর': 'September', 'অক্টোবর': 'October', 'নভেম্বর': 'November', 'ডিসেম্বর': 'December' };
  var SHORT = { 'জানু': 'Jan', 'ফেব্রু': 'Feb', 'এপ্রি': 'Apr', 'জুলা': 'Jul', 'আগ': 'Aug', 'সেপ্টে': 'Sep', 'অক্টো': 'Oct', 'নভে': 'Nov', 'ডিসে': 'Dec' };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP = 'script,style,noscript,textarea,code,pre,[data-noi18n]';
  var textOrig = new WeakMap(), attrOrig = new WeakMap(), lang = 'bn', dict = null, observer = null, titleOrig = document.title;
  var hasBn = /[ঀ-৿]/;

  function norm(t) { return t.replace(/\s+/g, ' ').trim(); }
  function fallback(t) {
    // dates / numbers like "১৯ নভেম্বর ২০২৬", "৩ মিনিট"
    var out = t.replace(/[০-৯]/g, function (d) { return BN_DIGITS.indexOf(d); });
    for (var m in MONTHS) out = out.split(m).join(MONTHS[m]);
    out = out.replace(/(\d+)\s*(জানু|ফেব্রু|এপ্রি|জুলা|আগ|সেপ্টে|অক্টো|নভে|ডিসে)\s+(\d{4})/g, function (_, d, m, y) { return d + ' ' + SHORT[m] + ' ' + y; });
    out = out.replace(/(\d+)\s*মিনিট পড়ার সময়/g, '$1 min read').replace(/প্রায়\s*(\d+)\s*মিনিট/g, 'about $1 min').replace(/(\d+)\s*মিনিট/g, '$1 min').replace(/(\d+)টি/g, '$1');
    return out;
  }
  function tr(t) {
    var k = norm(t); if (!k || !hasBn.test(k)) return null;
    if (dict[k] != null) return dict[k];
    // try without trailing punctuation
    var m = k.match(/^(.*?)([\s।:.,!?\-–—→↗]+)$/);
    if (m && dict[m[1]] != null) return dict[m[1]] + m[2].replace('।', '.');
    var f = fallback(k); return f !== k ? f : null;
  }
  function doText(n) {
    var p = n.parentElement; if (!p || p.closest(SKIP)) return;
    if (!textOrig.has(n)) { if (!hasBn.test(n.nodeValue)) return; textOrig.set(n, n.nodeValue); }
    var o = textOrig.get(n);
    if (lang === 'en') {
      var r = tr(o); if (r == null) return;
      var lead = o.match(/^\s*/)[0], trail = o.match(/\s*$/)[0];
      n.nodeValue = lead + r + trail;
    } else n.nodeValue = o;
  }
  function doEl(el) {
    if (el.nodeType !== 1 || el.matches(SKIP)) return;
    var store = attrOrig.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i]; if (!el.hasAttribute(a)) continue;
      if (!store) { store = {}; attrOrig.set(el, store); }
      if (store[a] === undefined) { var v = el.getAttribute(a); if (!hasBn.test(v)) continue; store[a] = v; }
      if (lang === 'en') { var r = tr(store[a]); if (r != null) el.setAttribute(a, r); } else el.setAttribute(a, store[a]);
    }
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) doText(n);
    var els = el.querySelectorAll('[placeholder],[title],[aria-label],[alt]');
    for (var j = 0; j < els.length; j++) if (!els[j].closest(SKIP)) doAttrsOnly(els[j]);
  }
  function doAttrsOnly(el) {
    var store = attrOrig.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i]; if (!el.hasAttribute(a)) continue;
      if (!store) { store = {}; attrOrig.set(el, store); }
      if (store[a] === undefined) { var v = el.getAttribute(a); if (!hasBn.test(v)) continue; store[a] = v; }
      if (lang === 'en') { var r = tr(store[a]); if (r != null) el.setAttribute(a, r); } else el.setAttribute(a, store[a]);
    }
  }
  function translateAll() {
    doEl(document.body);
    if (lang === 'en') { var t = tr(titleOrig); if (t) document.title = t; } else document.title = titleOrig;
  }
  function watch() {
    if (observer) return;
    observer = new MutationObserver(function (ms) {
      if (lang !== 'en') return;
      ms.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes || [], function (n) {
          if (n.nodeType === 3) doText(n); else if (n.nodeType === 1) doEl(n);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function loadDict(cb) {
    if (dict) return cb();
    if (window.MAS_I18N_EN) { dict = window.MAS_I18N_EN; return cb(); }
    var s = document.getElementById('mas-i18n-js');
    if (!s) { s = document.createElement('script'); s.id = 'mas-i18n-js'; s.src = DICT_JS; s.async = true; document.head.appendChild(s); }
    var done = function () { dict = window.MAS_I18N_EN || {}; cb(); };
    if (window.MAS_I18N_EN) done(); else { s.addEventListener('load', done); s.addEventListener('error', function () { reveal(); }); }
  }
  function reveal() { H.classList.remove('mas-i18n-pending'); }
  function applyLang(l) {
    mark('[data-lang-set]', 'langSet', l);
    if (l === 'en') {
      loadDict(function () {
        lang = 'en'; H.lang = 'en'; H.setAttribute('data-lang', 'en'); translateAll(); watch(); reveal();
        document.dispatchEvent(new CustomEvent('mas-language-change', { detail: { lang: 'en' } }));
      });
    } else {
      lang = 'bn'; H.lang = 'bn'; H.removeAttribute('data-lang');
      if (dict) translateAll();
      reveal();
      document.dispatchEvent(new CustomEvent('mas-language-change', { detail: { lang: 'bn' } }));
    }
  }

  /* ---------- UI ---------- */
  function mark(sel, key, val) {
    var b = document.querySelectorAll(sel);
    for (var i = 0; i < b.length; i++) {
      var on = b[i].dataset[key] === val;
      b[i].classList.toggle('on', on); b[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-theme-set],[data-lang-set]');
    if (!t) return;
    e.preventDefault();
    if (t.dataset.themeSet) { set('mas_theme', t.dataset.themeSet); applyTheme(t.dataset.themeSet); }
    else { set('mas_lang', t.dataset.langSet); applyLang(t.dataset.langSet); }
  });

  function init() {
    applyTheme(get('mas_theme', 'light'));
    applyLang(get('mas_lang', 'bn'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
