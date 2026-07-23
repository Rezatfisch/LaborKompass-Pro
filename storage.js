window.GAStorage=(()=>{
 const keys={values:"lk_values",documents:"lk_documents",diagnoses:"lk_diag",meds:"lk_meds",symptoms:"lk_sym",vitals:"lk_vitals",vaccinations:"lk_vaccinations",allergies:"lk_allergies",operations:"lk_operations"};
 const safeParse=(s,fallback)=>{try{return JSON.parse(s)??fallback}catch{return fallback}};
 function load(){return Object.fromEntries(Object.entries(keys).map(([field,key])=>[field,safeParse(localStorage.getItem(key),[])]))}
 function save(state){Object.entries(keys).forEach(([field,key])=>localStorage.setItem(key,JSON.stringify(state[field]||[])));localStorage.setItem("ga_last_saved",new Date().toISOString())}
 function backup(state){return {app:"Gesundheitsakte",version:"3.3.0",exportedAt:new Date().toISOString(),note:"Originaldateien liegen getrennt im lokalen Browser-Speicher und sind in dieser JSON-Sicherung nicht enthalten.",...state}}
 function restore(data){const state={};Object.keys(keys).forEach(k=>state[k]=Array.isArray(data[k])?data[k]:[]);save(state);return state}
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("GesundheitsakteFiles",2);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("originals"))db.createObjectStore("originals")};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function putOriginalPackage(id,files){
  const packageData={savedAt:new Date().toISOString(),files:[...files].map((file,index)=>({name:file.name||`Seite ${index+1}`,type:file.type||"application/octet-stream",size:file.size||0,lastModified:file.lastModified||Date.now(),blob:file}))};
  const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("originals","readwrite");tx.objectStore("originals").put(packageData,id);tx.oncomplete=()=>resolve(packageData);tx.onerror=()=>reject(tx.error)})
 }
 async function putOriginal(id,file){return putOriginalPackage(id,[file])}
 async function getOriginalPackage(id){const db=await openDB();return new Promise((resolve,reject)=>{const q=db.transaction("originals").objectStore("originals").get(id);q.onsuccess=()=>{const value=q.result;if(value instanceof Blob)resolve({savedAt:null,files:[{name:value.name||"Original",type:value.type,size:value.size,blob:value}]});else resolve(value||null)};q.onerror=()=>reject(q.error)})}
 async function getOriginal(id){const p=await getOriginalPackage(id);return p?.files?.[0]?.blob||null}
 async function deleteOriginal(id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("originals","readwrite");tx.objectStore("originals").delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
 return {load,save,backup,restore,putOriginal,putOriginalPackage,getOriginal,getOriginalPackage,deleteOriginal};
})();