window.GAMedKnowledge=(()=>{
 const normalize=s=>String(s||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");
 const contains=(s,k)=>normalize(s).includes(normalize(k));
 const MAIN_RUBRICS=[
  "Befunde und Arztbriefe","Bildgebung","Labor","Diagnosen","Behandlungen und Therapien",
  "Operationen","Medikamente","Augen und Optik","Zahnmedizin","Psychische Gesundheit",
  "Rechnungen und Kosten","Impfungen","Vorsorge und Prävention","Sonstiges"
 ];
 const DOC_TYPES=[
  {type:"MRT-Befund",rubric:"Bildgebung",creator:"Radiologie",keys:["mrt","magnetresonanz","kernspintomographie","kernspin"],weight:5},
  {type:"CT-Befund",rubric:"Bildgebung",creator:"Radiologie",keys:["computertomographie","ct-","ct "],weight:5},
  {type:"Röntgenbefund",rubric:"Bildgebung",creator:"Radiologie",keys:["roentgen","röntgen"],weight:5},
  {type:"Ultraschallbefund",rubric:"Bildgebung",creator:"Radiologie",keys:["sonographie","ultraschall"],weight:4},
  {type:"Laborbericht",rubric:"Labor",creator:"Labormedizin",keys:["labor","referenzbereich","serum","blutbild"],weight:4},
  {type:"Operationsbericht",rubric:"Operationen",creator:"Chirurgie",keys:["operationsbericht","op-bericht","intraoperativ"],weight:6},
  {type:"Entlassungsbericht",rubric:"Befunde und Arztbriefe",creator:"Krankenhaus",keys:["entlassungsbericht","epikrise","stationaer","stationär"],weight:5},
  {type:"Arztbrief",rubric:"Befunde und Arztbriefe",creator:"Ärztlicher Dienst",keys:["arztbrief","aerztlicher bericht","ärztlicher bericht","befundbericht"],weight:4},
  {type:"Rechnung",rubric:"Rechnungen und Kosten",creator:"Abrechnung",keys:["rechnungsnummer","rechnungsbetrag","zahlbetrag","eigenanteil"],weight:5},
  {type:"Heil- und Kostenplan",rubric:"Rechnungen und Kosten",creator:"Zahnmedizin",keys:["heil- und kostenplan","festzuschuss","befundklasse"],weight:6},
  {type:"Medikationsplan",rubric:"Medikamente",creator:"Medikation",keys:["medikationsplan","wirkstoff","dosierung"],weight:5},
  {type:"Rezept / Verordnung",rubric:"Medikamente",creator:"Medikation",keys:["rezept","verordnung"],weight:3},
  {type:"Impfunterlage",rubric:"Impfungen",creator:"Impfmedizin",keys:["impfstoff","schutzimpfung","charge"],weight:5},
  {type:"Brillenpass / Optikerbeleg",rubric:"Augen und Optik",creator:"Augenoptik",keys:["sphaere","sphäre","zylinder","pupillendistanz","brillenpass","fielmann"],weight:5},
  {type:"Augenärztlicher Befund",rubric:"Augen und Optik",creator:"Augenheilkunde",keys:["augeninnendruck","fundus","makula","visus","oct"],weight:4},
  {type:"Zahnärztlicher Befund",rubric:"Zahnmedizin",creator:"Zahnmedizin",keys:["zahnstatus","parodont","goz","bema","implantat"],weight:4},
  {type:"Psychologischer / psychiatrischer Bericht",rubric:"Psychische Gesundheit",creator:"Psychologie / Psychiatrie",keys:["psychotherapie","psychiatr","psychischer befund","depression"],weight:4}
 ];
 const TOPICS=[
  {name:"Orthopädie / Unfallchirurgie",keys:["schulter","rotatorenmanschette","supraspinatus","infraspinatus","subscapularis","knie","meniskus","wirbelsaeule","wirbelsäule","bandscheibe","arthrose","gelenk","huefte","hüfte"],weight:3},
  {name:"Neurologie",keys:["neurolog","schwindel","vestibular","polyneuropath","hirnnerv","eeg","parkinson","epilep"],weight:3},
  {name:"Kardiologie",keys:["herz","ekg","echokardi","koronar","rhythmus","blutdruck"],weight:3},
  {name:"Urologie",keys:["prostata","psa","blase","hoden","uroflow","harnwege"],weight:3},
  {name:"Hals-Nasen-Ohrenheilkunde",keys:["hno","audiogramm","hoerverlust","hörverlust","tinnitus","innenohr"],weight:3},
  {name:"Augenheilkunde",keys:["auge","visus","fundus","makula","netzhaut","glaukom","augeninnendruck"],weight:3},
  {name:"Zahnmedizin",keys:["zahn","kiefer","parodont","implantat","krone","bruecke","brücke"],weight:3},
  {name:"Gastroenterologie",keys:["magen","darm","leber","galle","koloskop","gastroskop"],weight:3},
  {name:"Pneumologie",keys:["lunge","bronchien","asthma","copd","spirometrie"],weight:3},
  {name:"Endokrinologie / Diabetologie",keys:["schilddruese","schilddrüse","diabetes","hba1c","hormon"],weight:3},
  {name:"Dermatologie",keys:["haut","dermatolog","ekzem","melanom"],weight:3},
  {name:"Psychologie / Psychiatrie",keys:["psych","depression","angststoerung","angststörung","burnout"],weight:3},
  {name:"Allgemeinmedizin / Innere Medizin",keys:["allgemeinmedizin","innere medizin","hausarzt"],weight:2}
 ];
 const REGIONS=[
  {system:"Bewegungsapparat",region:"Schulter",keys:["schulter","rotatorenmanschette","supraspinatus","infraspinatus","subscapularis","akromion"]},
  {system:"Bewegungsapparat",region:"Knie",keys:["knie","meniskus","kreuzband","patella"]},
  {system:"Bewegungsapparat",region:"Wirbelsäule",keys:["wirbelsaeule","wirbelsäule","bandscheibe","hws","bws","lws"]},
  {system:"Bewegungsapparat",region:"Hüfte / Becken",keys:["huefte","hüfte","becken"]},
  {system:"Bewegungsapparat",region:"Hand / Finger",keys:["hand","finger","karpaltunnel"]},
  {system:"Sinnesorgane",region:"Augen",keys:["auge","visus","netzhaut","makula","brille"]},
  {system:"Sinnesorgane",region:"Ohren / Gleichgewicht",keys:["ohr","audiogramm","tinnitus","vestibular"]},
  {system:"Nervensystem",region:"Kopf / Gehirn",keys:["gehirn","schaedel","schädel","hirn","neurolog"]},
  {system:"Herz-Kreislauf",region:"Herz / Gefäße",keys:["herz","koronar","ekg","gefaess","gefäß"]},
  {system:"Atmung",region:"Lunge / Atemwege",keys:["lunge","bronchien","asthma","copd"]},
  {system:"Verdauung",region:"Magen / Darm",keys:["magen","darm","koloskop","gastroskop"]},
  {system:"Verdauung",region:"Leber / Galle",keys:["leber","galle"]},
  {system:"Harn- und Geschlechtsorgane",region:"Nieren / Harnwege",keys:["niere","harnwege","blase"]},
  {system:"Harn- und Geschlechtsorgane",region:"Prostata",keys:["prostata","psa"]},
  {system:"Mund und Zähne",region:"Zähne / Kiefer",keys:["zahn","kiefer","parodont"]},
  {system:"Haut",region:"Haut",keys:["haut","ekzem","melanom"]},
  {system:"Psychische Gesundheit",region:"Psyche",keys:["psych","depression","angst","burnout"]}
 ];
 const VALUE_TYPES=[
  {type:"Laborwert",keys:["mg/dl","g/dl","/nl","mmol/l","u/l","ng/ml","pg/ml","referenzbereich"]},
  {type:"Vitalwert",keys:["mmhg","blutdruck","puls","herzfrequenz","bmi","gewicht"]},
  {type:"Augenwert",keys:["sphaere","sphäre","zylinder","achse","visus","pupillendistanz","augeninnendruck","dpt"]},
  {type:"Hörwert",keys:["db","khz","audiogramm","hoerschwelle","hörschwelle"]},
  {type:"Bewegungswert",keys:["beweglichkeit","flexion","extension","abduktion","adduktion","grad"]},
  {type:"Bildgebungsmaß",keys:["laesion","läsion","durchmesser","groesse","größe","mm","cm"]},
  {type:"Zahncode",keys:["goz","bema","zahnnummer"]},
  {type:"Medikamentendosis",keys:["mg ","µg","mikrogramm","tablette","dosierung"]},
  {type:"Kosten",keys:["eur","€","euro","rechnungsbetrag"]}
 ];
 function scoreItems(text,items){
  const s=normalize(text);
  return items.map(item=>{
   let score=0,hits=[];
   for(const k of item.keys)if(s.includes(normalize(k))){score+=item.weight||1;hits.push(k)}
   return {...item,score,hits}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)
 }
 function learningRules(){
  try{return JSON.parse(localStorage.getItem("ga_learning_rules")||"[]")}catch{return[]}
 }
 function applyLearning(text,result){
  const s=normalize(text);
  for(const rule of learningRules()){
   if(rule.keywords?.every(k=>s.includes(normalize(k)))){
    if(rule.specialty)result.topicSpecialty=rule.specialty;
    if(rule.mainRubric)result.mainRubric=rule.mainRubric;
    if(rule.region)result.bodyRegions=[rule.region,...result.bodyRegions.filter(x=>x!==rule.region)];
    if(rule.side)result.laterality=rule.side;
    result.learned=true
   }
  }
  return result
 }
 function classify(text,name=""){
  const src=`${name}\n${text}`,docScores=scoreItems(src,DOC_TYPES),topicScores=scoreItems(src,TOPICS);
  const d=docScores[0]||{type:"Medizinisches Dokument",rubric:"Sonstiges",creator:"Noch nicht erkannt",score:0,hits:[]};
  const t=topicScores[0]||{name:"Noch nicht zugeordnet",score:0,hits:[]};
  const regions=REGIONS.filter(r=>r.keys.some(k=>contains(src,k))).map(r=>`${r.system} › ${r.region}`);
  const side=/\brechts?\b/i.test(src)&&/\blinks?\b/i.test(src)?"beidseits":/\brechts?\b/i.test(src)?"rechts":/\blinks?\b/i.test(src)?"links":"ohne Seitenangabe";
  const maxDoc=Math.max(1,d.score),maxTopic=Math.max(1,t.score);
  const alternatives=topicScores.slice(1,4).map(x=>({name:x.name,confidence:Math.min(95,Math.round(35+x.score/maxTopic*45))}));
  const result={
   type:d.type,mainRubric:d.rubric,creatorSpecialty:d.creator,topicSpecialty:t.name,
   specialty:t.name!=="Noch nicht zugeordnet"?t.name:d.creator,
   rubric:d.rubric,bodyRegions:[...new Set(regions)],laterality:side,
   alternatives,classificationEvidence:[...d.hits,...t.hits],
   confidence:Math.min(.97,.35+Math.min(.3,d.score*.04)+Math.min(.25,t.score*.035)+(regions.length?.08:0))
  };
  return applyLearning(src,result)
 }
 function valueType(label,unit,line=""){
  const src=`${label} ${unit} ${line}`;
  const scores=scoreItems(src,VALUE_TYPES);
  return scores[0]?.type||"Allgemeiner Messwert"
 }
 function learn({keywords,specialty,mainRubric,region,side}){
  const rules=learningRules(),rule={keywords:[...new Set((keywords||[]).map(normalize).filter(x=>x.length>2))].slice(0,6),specialty,mainRubric,region,side,created:new Date().toISOString()};
  if(!rule.keywords.length)return false;
  const key=JSON.stringify(rule.keywords);
  const i=rules.findIndex(r=>JSON.stringify(r.keywords)===key);
  if(i>=0)rules[i]=rule;else rules.push(rule);
  localStorage.setItem("ga_learning_rules",JSON.stringify(rules.slice(-100)));return true
 }
 function clearLearning(){localStorage.removeItem("ga_learning_rules")}
 return {MAIN_RUBRICS,classify,valueType,learn,clearLearning,learningRules};
})();