window.GAExtract=(()=>{
 const uid=()=>crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
 const num=x=>{const n=parseFloat(String(x).replace(",",".").replace(/[^\d+\-.]/g,""));return Number.isFinite(n)?n:null};
 const unique=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
 const clean=s=>String(s||"").replace(/\s+/g," ").trim();
 function detectDates(text,name=""){
  const src=text+" "+name,found=[];
  for(const m of src.matchAll(/\b(0?[1-9]|[12]\d|3[01])[.\-/](0?[1-9]|1[0-2])[.\-/]((?:19|20)\d{2})\b/g))found.push(`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`);
  for(const m of src.matchAll(/\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b/g))found.push(m[0]);
  return unique(found);
 }
 function detectDate(text,name=""){return detectDates(text,name)[0]||new Date().toISOString().slice(0,10)}
 const rules=[
  {keys:["fielmann","apollo optik","optiker","gläserstärken","glasstärken","sphäre","zylinder","pupillendistanz"],type:"Optiker- / Brillenpass",rubric:"Optik / Brille",specialty:"Augenoptik",regions:["Augen"]},
  {keys:["augenarzt","ophthalm","visus","fundus","makula","glaukom","netzhaut","augeninnendruck","oct"],type:"Augenärztlicher Befund",rubric:"Augenheilkunde",specialty:"Augenheilkunde",regions:["Augen"]},
  {keys:["zahnarzt","zahn","kiefer","parodont","goz","bema","heil- und kostenplan"],type:"Zahnärztliches Dokument",rubric:"Zahnmedizin",specialty:"Zahnmedizin",regions:["Zähne und Mund"]},
  {keys:["psycholog","psychother","psychiatr","depression","angststörung","psychischer befund"],type:"Psychologischer / psychiatrischer Bericht",rubric:"Psychische Gesundheit",specialty:"Psychologie / Psychiatrie",regions:["Psyche"]},
  {keys:["mrt","kernspin","magnetresonanz","ct ","computertomographie","röntgen","sonographie","ultraschall","radiolog"],type:"Bildgebender Befund",rubric:"Radiologie",specialty:"Radiologie",regions:[]},
  {keys:["orthop","schulter","knie","wirbelsäule","meniskus","bandscheibe","gelenk"],type:"Orthopädischer Befund",rubric:"Orthopädie",specialty:"Orthopädie / Unfallchirurgie",regions:[]},
  {keys:["neurolog","schwindel","vestib","polyneuropath","eeg","hirnnerven"],type:"Neurologischer Befund",rubric:"Neurologie",specialty:"Neurologie",regions:["Kopf und Gehirn"]},
  {keys:["prostata","psa","urolog","blase","hoden","uroflow"],type:"Urologischer Befund",rubric:"Urologie",specialty:"Urologie",regions:["Nieren und Harnwege"]},
  {keys:["ekg","kardiolog","herzkatheter","echokardi","langzeit-ekg"],type:"Kardiologischer Befund",rubric:"Kardiologie",specialty:"Kardiologie",regions:["Herz und Kreislauf"]},
  {keys:["hno","audiogramm","hörtest","tinnitus","innenohr"],type:"HNO-Befund",rubric:"HNO",specialty:"Hals-Nasen-Ohrenheilkunde",regions:["Ohren und Gleichgewicht"]},
  {keys:["dermatolog","hautbefund","ekzem","melanom","hautärzt"],type:"Hautärztlicher Befund",rubric:"Dermatologie",specialty:"Dermatologie",regions:["Haut"]},
  {keys:["pneumolog","spirometr","lungenfunktion","asthma","copd"],type:"Lungenfachärztlicher Befund",rubric:"Pneumologie",specialty:"Pneumologie",regions:["Lunge"]},
  {keys:["gastroenterolog","gastroskop","koloskop","magen","darm","leber","galle"],type:"Gastroenterologischer Befund",rubric:"Gastroenterologie",specialty:"Gastroenterologie",regions:["Bauchorgane"]},
  {keys:["endokrin","schilddrüse","diabetolog","hormonsprechstunde"],type:"Endokrinologischer Befund",rubric:"Endokrinologie",specialty:"Endokrinologie / Diabetologie",regions:[]},
  {keys:["rechnung","rechnungsnummer","zahlbetrag","eigenanteil","kostenvoranschlag"],type:"Medizinische Rechnung",rubric:"Rechnungen und Kosten",specialty:"Abrechnung",regions:[]},
  {keys:["rezept","verordnung","medikationsplan","bundeseinheitlicher medikationsplan"],type:"Rezept / Medikamentenplan",rubric:"Medikamente",specialty:"Medikation",regions:[]},
  {keys:["impfpass","schutzimpfung","impfstoff","charge"],type:"Impfunterlage",rubric:"Impfungen",specialty:"Impfmedizin",regions:[]},
  {keys:["labor","blutbild","serum","hämoglobin","leukozyten","kreatinin","referenzbereich"],type:"Laborbefund",rubric:"Labor",specialty:"Innere Medizin / Labormedizin",regions:[]},
  {keys:["entlassungsbericht","entlassbrief","epikrise","stationärer aufenthalt"],type:"Entlassungsbericht",rubric:"Krankenhaus",specialty:"Krankenhaus / Fachabteilung",regions:[]},
  {keys:["op-bericht","operationsbericht","operation am"],type:"Operationsbericht",rubric:"Operationen",specialty:"Chirurgie",regions:[]},
  {keys:["arztbrief","befundbericht","ärztlicher bericht"],type:"Arztbrief",rubric:"Arztbrief",specialty:"Allgemeinmedizin",regions:[]}
 ];
 function classify(text,name=""){
  const c=GAMedKnowledge.classify(text,name);
  return {type:c.type,rubric:c.mainRubric,mainRubric:c.mainRubric,specialty:c.specialty,creatorSpecialty:c.creatorSpecialty,topicSpecialty:c.topicSpecialty,bodyRegions:c.bodyRegions,laterality:c.laterality,alternatives:c.alternatives,classificationEvidence:c.classificationEvidence,classificationScore:c.confidence,learned:c.learned||false}
 }
 function bodyRegions(text,base=[]){
  const c=GAMedKnowledge.classify(text,"");
  return unique([...(base||[]),...(c.bodyRegions||[])])
 }
 const labDefs=[
  ["MCV","fl"],["RDW","%"],["Hämoglobin","g/dl"],["Leukozyten","/nl"],["Thrombozyten","/nl"],["Kreatinin","mg/dl"],["eGFR","ml/min"],["Triglyceride","mg/dl"],["Cholesterin","mg/dl"],["LDL","mg/dl"],["HDL","mg/dl"],["PSA","ng/ml"],["TSH","mU/l"],["Glukose","mg/dl"],["HbA1c","%"],["Ferritin","ng/ml"],["Vitamin B12","pg/ml"],["Folsäure","ng/ml"],["GOT","U/l"],["GPT","U/l"],["Gamma-GT","U/l"],["CRP","mg/l"]
 ];
 function findRangeAfter(text,start){
  const fragment=text.slice(start,start+100),m=fragment.match(/([+\-]?\d+(?:[.,]\d+)?)\s*(?:-|bis|–)\s*([+\-]?\d+(?:[.,]\d+)?)/i);
  return m?{min:num(m[1]),max:num(m[2])}:{min:null,max:null}
 }
 function labs(text,date){
  const out=[];
  for(const [name,unit] of labDefs){
   const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),rx=new RegExp(escaped+"[^\\d+\\-]{0,28}([+\\-]?\\d+(?:[.,]\\d+)?)","i"),m=rx.exec(text);
   if(m){const range=findRangeAfter(text,m.index+m[0].length);out.push({id:uid(),name,value:num(m[1]),unit,date,category:"Labor",source:"Import",...range})}
  }
  return out
 }
 function issuer(text){
  const lines=text.split(/\n+/).map(clean).filter(x=>x.length>3&&x.length<130);
  const preferred=lines.find(x=>/(praxis|klinik|zentrum|labor|fielmann|apotheke|zahnarzt|dr\.\s|prof\.\s)/i.test(x));
  return preferred||""
 }
 function doctor(text){
  const m=text.match(/(?:Dr\.?\s*(?:med\.?|dent\.?)?\s*|Prof\.?\s*Dr\.?\s*)[A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]{2,60}/);return m?clean(m[0]):""
 }
 function addresses(text){return unique(text.split(/\n+/).map(clean).filter(x=>/\b\d{5}\b/.test(x)&&/(straße|str\.|weg|platz|allee|gasse|ring)/i.test(x))).slice(0,4)}
 function diagnoses(text){
  const out=[];
  for(const m of text.matchAll(/(?:diagnose[n]?|beurteilung)\s*[:\-]\s*([^\n]{4,180})/gi))out.push(clean(m[1]));
  for(const m of text.matchAll(/\b[A-TV-Z]\d{2}(?:\.\d{1,2})?[GVARLBS]?\b/g))out.push(m[0]);
  return unique(out).slice(0,14)
 }
 function medications(text){
  const out=[];
  for(const m of text.matchAll(/(?:medikation|medikamente?|verordnung)\s*[:\-]\s*([^\n]{3,180})/gi))out.push(clean(m[1]));
  return unique(out).slice(0,12)
 }
 function recommendations(text){return unique(text.split(/\n+/).map(clean).filter(x=>/(empfehl|kontrolle|wiedervorstellung|therapie|weiterbehandlung|sollte)/i.test(x))).slice(0,12)}
 function costs(text){
  const result=[];
  for(const m of text.matchAll(/(gesamtbetrag|endbetrag|eigenanteil|zuzahlung|rechnungsbetrag|kosten|summe)\D{0,25}(\d{1,6}[.,]\d{2})\s*(?:€|eur)?/gi))result.push({label:clean(m[1]),value:num(m[2]),unit:"€"});
  return result.slice(0,10)
 }
 function appointments(text){
  const result=[];
  for(const m of text.matchAll(/(?:termin|kontrolle|wiedervorstellung)\D{0,25}((?:0?[1-9]|[12]\d|3[01])[.\-/](?:0?[1-9]|1[0-2])[.\-/](?:20)\d{2})/gi))result.push(m[1]);
  return unique(result)
 }
 function measurements(text,labValues=[]){
  const labsSet=new Set(labValues.map(x=>x.name.toLowerCase())),out=[],unitRx="(?:mmHg|mm|cm|kg|g|ml|l|%|°|dpt|dioptrien|Hz|kHz|ms|sek|s|min|Punkte|Grad)";
  const lines=text.split(/\n+/).map(clean).filter(x=>x.length<180);
  for(const line of lines){
   const m=line.match(new RegExp("^([^:]{2,45})\\s*[:=]\\s*([+\\-]?\\d+(?:[.,]\\d+)?)\\s*("+unitRx+")?","i"));
   if(m&&!labsSet.has(clean(m[1]).toLowerCase())){const label=clean(m[1]),unit=m[3]||"";out.push({label,value:num(m[2]),unit,valueType:GAMedKnowledge.valueType(label,unit,line)})}
  }
  return out.slice(0,20)
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
 function dental(text){const flat=text.replace(/\s+/g," ");return {kind:"dental",teeth:unique(flat.match(/\b(?:1[1-8]|2[1-8]|3[1-8]|4[1-8])\b/g)||[]),findings:unique(flat.match(/karies|parodontitis|gingivitis|implantat|krone|brücke|prothese|füllung|wurzelbehandlung|extraktion/gi)||[]),codes:unique(flat.match(/\b(?:BEMA|GOZ)\s*[-:]?\s*\d+[a-z]?\b/gi)||[])}}
 function generic(text){return {kind:"medical",icd:unique(text.match(/\b[A-TV-Z]\d{2}(?:\.\d{1,2})?[GVARLBS]?\b/g)||[]),procedures:unique(text.match(/MRT|CT|Röntgen|Sonographie|Ultraschall|EKG|EEG|Endoskopie|Operation|OCT|Audiogramm/gi)||[])}}
 function specialty(text,cls){if(/Augen|Optik/.test(cls.rubric+cls.specialty))return eye(text);if(cls.rubric==="Zahnmedizin")return dental(text);return generic(text)}
 function hasSpecial(s){return !!s&&Object.entries(s).some(([k,v])=>k!=="kind"&&(Array.isArray(v)?v.length:(v&&typeof v==="object"?Object.keys(v).length:!!v)))}
 function statements(text){const lines=text.split(/\n+/).map(clean).filter(x=>x.length>20);return unique(lines.filter(x=>/(befund|diagnose|beurteilung|empfehl|therapie|kontrolle|auffällig|unauffällig)/i.test(x)).slice(0,8).concat(lines.slice(0,3))).slice(0,8)}
 function confidence(doc){
  let score=doc.classificationScore||.25;
  if(doc.date)score+=.08;if(doc.issuer)score+=.08;if(doc.diagnoses.length)score+=.1;if(doc.labValues.length||doc.measurements.length)score+=.12;if(doc.bodyRegions.length)score+=.08;
  return Math.min(.98,score)
 }
 function document(text,name,mime,size=0){
  const cls=classify(text,name),date=detectDate(text,name),labValues=labs(text,date);
  const doc={id:uid(),name:name||"Manuell eingefügtes Dokument",mime,size,date,allDates:detectDates(text,name),...cls,text,
   issuer:issuer(text),doctor:doctor(text),addresses:addresses(text),bodyRegions:bodyRegions(text,cls.bodyRegions),laterality:cls.laterality||"ohne Seitenangabe",
   diagnoses:diagnoses(text),medications:medications(text),recommendations:recommendations(text),costs:costs(text),
   appointments:appointments(text),labValues,measurements:measurements(text,labValues),specialtyData:specialty(text,cls),
   keyStatements:statements(text),created:new Date().toISOString()};
  doc.confidence=confidence(doc);return doc
 }
 function reanalyse(doc){
  const fresh=document(doc.text||"",doc.name||"",doc.mime||"",doc.size||0),preserve=["id","created","hash","manualClassification","originalStored","creatorSpecialty","topicSpecialty","mainRubric","laterality","alternatives","classificationEvidence"];
  preserve.forEach(k=>{if(doc[k]!=null)fresh[k]=doc[k]});
  if(doc.manualClassification){fresh.type=doc.type;fresh.rubric=doc.rubric;fresh.mainRubric=doc.mainRubric||doc.rubric;fresh.specialty=doc.specialty;fresh.creatorSpecialty=doc.creatorSpecialty||fresh.creatorSpecialty;fresh.topicSpecialty=doc.topicSpecialty||doc.specialty;fresh.bodyRegions=doc.bodyRegions;fresh.laterality=doc.laterality||fresh.laterality}
  Object.assign(doc,fresh);return doc
 }
 return {uid,document,reanalyse,classify,hasSpecial,bodyRegions};
})();