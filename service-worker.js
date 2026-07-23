const CACHE="gesundheitsakte-3.4.0";
const ASSETS=["./","./index.html?v=3.3.8","./styles.css?v=3.3.8","./storage.js?v=3.3.8","./medknowledge.js?v=3.3.8","./extractors.js?v=3.3.8","./importer.js?v=3.3.8","./ui.js?v=3.3.8","./choices.js?v=3.3.8","./compat.js?v=3.3.8","./reviewer.js?v=3.3.8","./labrefs.js?v=3.3.8","./app.js?v=3.3.8","./manifest.webmanifest?v=3.3.8","./icon-192.png","./icon-512.png","./logo-64.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>k===CACHE?Promise.resolve():caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const url=new URL(e.request.url);
 const isCode=e.request.mode==="navigate"||/\.(?:html|js|css|webmanifest)$/.test(url.pathname);
 if(isCode){
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html?v=3.3.8"))));
 }else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
