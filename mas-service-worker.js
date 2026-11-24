'use strict';
var MAS_CACHE='mas-agency-pwa-v3';
var MAS_PRIVATE=/^\/(wp-admin|wp-login\.php|cart|checkout|my-account|wc-api|wp-json|order-pay|order-received|add-payment-method|lost-password|crm)(\/|$)/i;
var MAS_PUBLIC=/^\/(|about\/?|services\/?|how-it-works\/?|contact\/?|privacy-policy\/?|terms-and-conditions\/?|service-refund-policy\/?|payment-policy\/?)$/i;
var MAS_STATIC=/\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i;
var MAS_OFFLINE='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#1877F2"><title>You are Offline | Mufti Abdus Sabur</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f7fb;color:#0b1220;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}.card{max-width:420px;margin:24px;padding:32px;background:white;border:1px solid #e5eaf2;border-radius:18px;text-align:center;box-shadow:0 8px 28px #0b122010}h1{font-size:26px;margin:0 0 12px}p{color:#526078}button,a{display:inline-block;border:0;border-radius:8px;background:#1877f2;color:white;padding:12px 18px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}</style><main class="card"><h1>You are Offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Try again</button><p><a href="/">Return to homepage</a></p></main></html>';
self.addEventListener('install',function(event){event.waitUntil(caches.open(MAS_CACHE).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(event){event.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf('mas-agency-pwa-')===0&&k!==MAS_CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(event){
 var request=event.request;if(request.method!=='GET')return;
 var url=new URL(request.url);if(url.origin!==self.location.origin||MAS_PRIVATE.test(url.pathname))return;
 if(request.mode==='navigate'){
   if(!MAS_PUBLIC.test(url.pathname)||url.search)return;
   event.respondWith(fetch(request).catch(function(){return new Response(MAS_OFFLINE,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});}));
   return;
 }
 if(!MAS_STATIC.test(url.pathname)||url.searchParams.has('preview')||url.searchParams.has('elementor-preview'))return;
 event.respondWith(fetch(request).then(function(response){
   var cc=(response.headers.get('Cache-Control')||'').toLowerCase();
   if(response.ok&&response.type==='basic'&&cc.indexOf('private')===-1&&cc.indexOf('no-store')===-1){
     var headers=new Headers(response.headers);headers.set('X-MAS-Cached-At',String(Date.now()));
     var copy=response.clone().arrayBuffer().then(function(body){return new Response(body,{status:response.status,statusText:response.statusText,headers:headers});});
     caches.open(MAS_CACHE).then(function(cache){copy.then(function(cachedResponse){return cache.put(request,cachedResponse);}).catch(function(){});cache.keys().then(function(keys){if(keys.length>100)cache.delete(keys[0]);});}).catch(function(){});
   }
   return response;
 }).catch(function(){return caches.match(request).then(function(cached){if(!cached)return Response.error();var stored=Number(cached.headers.get('X-MAS-Cached-At')||0);if(!stored||Date.now()-stored>30*24*60*60*1000){caches.open(MAS_CACHE).then(function(cache){cache.delete(request);});return Response.error();}return cached;});}));
});
