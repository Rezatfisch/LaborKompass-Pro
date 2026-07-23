const CACHE="gesundheitsakte-v2.0.1";
const STATIC=["./manifest.webmanifest","./icon-192.png","./icon-512.png","./logo-64.png"];
self.addEventListener("install",event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
});
self.addEventListener("activate",event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const request=event.request;
 if(request.mode==="navigate"){
  event.respondWith(
   fetch(request,{cache:"no-store"})
    .then(response=>response)
    .catch(async()=>await caches.match("./index.html")||Response.error())
  );
  return;
 }
 event.respondWith(
  fetch(request,{cache:"no-store"})
   .then(response=>{
    if(response.ok){
     const copy=response.clone();
     caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
   })
   .catch(()=>caches.match(request))
 );
});