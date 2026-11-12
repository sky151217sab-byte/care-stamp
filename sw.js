// ケア記録スタンプ service worker
// The page itself is fetched network-first so a new version shows up as soon as you are online;
// everything falls back to the cache so the app also opens offline.
const CACHE='care-stamp-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const isPage=req.mode==='navigate'||(url.origin===location.origin&&/\/(index\.html)?$/.test(url.pathname));
  if(isPage){
    e.respondWith(fetch(req).then(res=>{
      const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  // icons, manifest and Google Fonts: cache first, then network
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok||res.type==='opaque'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  }).catch(()=>hit)));
});
