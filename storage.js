window.GAStorage=(()=>{
 const keys={values:"lk_values",documents:"lk_documents",diagnoses:"lk_diag",meds:"lk_meds",symptoms:"lk_sym",vitals:"lk_vitals",vaccinations:"lk_vaccinations",allergies:"lk_allergies",operations:"lk_operations"};
 const safeParse=(s,fallback)=>{try{return JSON.parse(s)??fallback}catch{return fallback}};
 function load(){
  return {
   values:safeParse(localStorage.getItem(keys.values),[]),
   documents:safeParse(localStorage.getItem(keys.documents),[]),
   diagnoses:safeParse(localStorage.getItem(keys.diagnoses),[]),
   meds:safeParse(localStorage.getItem(keys.meds),[]),
   symptoms:safeParse(localStorage.getItem(keys.symptoms),[]),
   vitals:safeParse(localStorage.getItem(keys.vitals),[]),
   vaccinations:safeParse(localStorage.getItem(keys.vaccinations),[]),
   allergies:safeParse(localStorage.getItem(keys.allergies),[]),
   operations:safeParse(localStorage.getItem(keys.operations),[])
  };
 }
 function save(state){
  Object.entries(keys).forEach(([field,key])=>localStorage.setItem(key,JSON.stringify(state[field]||[])));
  localStorage.setItem("ga_last_saved",new Date().toISOString());
 }
 function backup(state){return {app:"Gesundheitsakte",version:"3.2.0",exportedAt:new Date().toISOString(),...state}}
 function restore(data){
  const state={};
  Object.keys(keys).forEach(k=>state[k]=Array.isArray(data[k])?data[k]:[]);
  save(state);return state;
 }
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open("GesundheitsakteFiles",1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("originals"))r.result.createObjectStore("originals")};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function putOriginal(id,file){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("originals","readwrite");tx.objectStore("originals").put(file,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
 async function getOriginal(id){const db=await openDB();return new Promise((resolve,reject)=>{const q=db.transaction("originals").objectStore("originals").get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
 return {load,save,backup,restore,putOriginal,getOriginal};
})();