window.GAExtract=(()=>{
 const uid=()=>crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
 const num=x=>{const n=parseFloat(String(x).replace(",",".").replace(/[^\d+\-.]/g,""));return Number.isFinite(n)?n:null};
 function detectDate(text,name=""){
  const m=(text+" "+name).match(/\b(0?[1-9]|[12]\d|3[01])[.\-/](0?[1-9]|1[0-2])[.\-/]((?:19|20)\d{2})\b/);
  if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  const i=(text+" "+name).match(/\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b/);return i?i[0]:new Date().toISOString().slice(0,10)
 }
 function classify(text,name=""){
  const s=(name+" "+text).toLowerCase(),rules=[
   [["fielmann","optiker","gläserstärken","glasstärken","sphäre","zylinder","pupillendist"],["Optiker- / Brillenpass","Optik / Brille","Augenoptik"]],
   [["augenarzt","ophthalm","visus","fundus","makula","glaukom","netzhaut","augeninnendruck"],["Augenärztlicher Befund","Augenheilkunde","Augenheilkunde"]],
   [["zahnarzt","zahn","kiefer","parodont","goz","bema"],["Zahnärztlicher Befund","Zahnmedizin","Zahnmedizin"]],
   [["mrt","kernspin","ct ","computertomographie","röntgen","sonographie","ultraschall"],["Bildgebender Befund","Radiologie","Radiologie"]],
   [["orthop","schulter","knie","wirbelsäule","meniskus","bandscheibe"],["Orthopädischer Befund","Orthopädie","Orthopädie / Unfallchirurgie"]],
   [["neurolog","schwindel","vestib","polyneuropath","eeg"],["Neurologischer Befund","Neurologie","Neurologie"]],
   [["prostata","psa","urolog","blase","hoden"],["Urologischer Befund","Urologie","Urologie"]],
   [["ekg","kardiolog","herzkatheter","echokardi"],["Kardiologischer Befund","Kardiologie","Kardiologie"]],
   [["hno","audiogramm","hörtest","tinnitus"],["HNO-Befund","HNO","Hals-Nasen-Ohrenheilkunde"]],
   [["labor","blutbild","serum","hämoglobin","leukozyten","kreatinin"],["Laborbefund","Labor","Innere Medizin / Labormedizin"]],
   [["arztbrief","entlass","epikrise"],["Arztbrief","Arztbrief","Allgemeinmedizin"]]
  ];
  for(const [keys,res] of rules)if(keys.some(k=>s.includes(k)))return {type:res[0],rubric:res[1],specialty:res[2]};
  return {type:"Befund",rubric:"Sonstige",specialty:"Noch nicht zugeordnet"}
 }
 const labDefs=[
  ["MCV","fl"],["RDW","%"],["Hämoglobin","g/dl"],["Leukozyten","/nl"],["Thrombozyten","/nl"],["Kreatinin","mg/dl"],["eGFR","ml/min"],["Triglyceride","mg/dl"],["Cholesterin","mg/dl"],["LDL","mg/dl"],["HDL","mg/dl"],["PSA","ng/ml"],["TSH","mU/l"],["Glukose","mg/dl"],["HbA1c","%"],["Ferritin","ng/ml"],["Vitamin B12","pg/ml"],["Folsäure","ng/ml"],["GOT","U/l"],["GPT","U/l"],["Gamma-GT","U/l"],["CRP","mg/l"]
 ];
 function labs(text,date){
  const out=[];
  for(const [name,unit] of labDefs){
   const rx=new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"[^\\d+\\-]{0,25}([+\\-]?\\d+(?:[.,]\\d+)?)","i"),m=text.match(rx);
   if(m)out.push({id:uid(),name,value:num(m[1]),unit,date,category:"Labor",source:"Import"});
  }
  return out
 }
 function eye(text){
  const raw=text.replace(/\r/g,"\n"),out={kind:"eye",right:{},left:{},aid:{},costs:{}};
  for(const [side,target] of [["rechts",out.right],["links",out.left]]){
   const line=raw.split(/\n/).find(x=>x.toLowerCase().includes(side))||"";
   const ns=(line.match(/[+\-]?\d+(?:[.,]\d+)?/g)||[]).map(num);
   if(ns.length>=6)Object.assign(target,{sphere:ns[0],cylinder:ns[1],axis:ns[2],addition:ns[3],pd:ns[4],visus:ns[5]});
  }
  const total=text.match(/(?:endbetrag|gesamt|zwischensumme)[^\d]{0,20}(\d{1,5}[.,]\d{2})/i);if(total)out.costs.total=num(total[1]);
  return out
 }
 function dental(text){const flat=text.replace(/\s+/g," ");return {kind:"dental",teeth:[...new Set(flat.match(/\b(?:1[1-8]|2[1-8]|3[1-8]|4[1-8])\b/g)||[])],findings:[...new Set(flat.match(/karies|parodontitis|gingivitis|implantat|krone|brücke|prothese|füllung|wurzelbehandlung|extraktion/gi)||[])],codes:[...new Set(flat.match(/\b(?:BEMA|GOZ)\s*[-:]?\s*\d+[a-z]?\b/gi)||[])]}}
 function generic(text){return {kind:"medical",icd:[...new Set(text.match(/\b[A-TV-Z]\d{2}(?:\.\d{1,2})?[GVARLBS]?\b/g)||[])],procedures:[...new Set(text.match(/MRT|CT|Röntgen|Sonographie|Ultraschall|EKG|EEG|Endoskopie|Operation/gi)||[])]}}
 function specialty(text,cls){if(/Augen|Optik/.test(cls.rubric+cls.specialty))return eye(text);if(cls.rubric==="Zahnmedizin")return dental(text);return generic(text)}
 function hasSpecial(s){return !!s&&Object.values(s).some(v=>Array.isArray(v)?v.length:(v&&typeof v==="object"?Object.keys(v).length:!!v))}
 function statements(text){const lines=text.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>20);return lines.filter(x=>/(befund|diagnose|beurteilung|empfehl|therapie|kontrolle|auffällig|unauffällig)/i.test(x)).slice(0,8).concat(lines.slice(0,3)).slice(0,8)}
 function document(text,name,mime,size=0){const date=detectDate(text,name),cls=classify(text,name);return {id:uid(),name:name||"Manueller Befund",mime,size,date,...cls,text,labValues:labs(text,date),specialtyData:specialty(text,cls),keyStatements:statements(text),created:new Date().toISOString()}}
 function reanalyse(doc){const cls=classify(doc.text||"",doc.name||"");if(doc.rubric==="Sonstige"||!doc.specialty)Object.assign(doc,cls);doc.labValues=labs(doc.text||"",doc.date||detectDate(doc.text||"",doc.name));doc.specialtyData=specialty(doc.text||"",doc);doc.keyStatements=statements(doc.text||"");return doc}
 return {uid,document,reanalyse,classify,hasSpecial};
})();