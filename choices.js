window.GAChoices=(()=>{
 const catalogs={
  documentTypeOptions:[
   "Allergiepass","Anamnese","Arbeitsunfähigkeitsbescheinigung","Arztbrief","Augenärztlicher Befund","Befundbericht","Bescheinigung","CT-Befund","Dermatologischer Befund","Diagnosebericht","Entlassungsbericht","Funktionsdiagnostik","HNO-Befund","Impfbescheinigung","Impfpass","Kardiologischer Befund","Laborbericht","Medikamentenplan","MRT-Befund","Operationsbericht","Pathologiebericht","Pflegebericht","Psychologischer Bericht","Radiologischer Befund","Rechnung","Reha-Bericht","Rezept","Röntgenbefund","Sonografie / Ultraschall","Therapiebericht","Überweisung","Vorsorgebericht","Zahnärztlicher Befund","Sonstiges"
  ],
  specialtyOptions:[
   "Allgemeinmedizin","Allergologie","Anästhesiologie","Arbeitsmedizin","Augenheilkunde","Augenoptik","Chirurgie","Dermatologie","Endokrinologie","Gastroenterologie","Gefäßmedizin / Angiologie","Geriatrie","Gynäkologie","Hämatologie / Onkologie","Hals-Nasen-Ohrenheilkunde","Hausarztpraxis","Innere Medizin","Kardiologie","Kinder- und Jugendmedizin","Laboratoriumsmedizin","Nephrologie","Neurologie","Nuklearmedizin","Orthopädie / Unfallchirurgie","Pathologie","Pneumologie","Psychiatrie / Psychotherapie","Radiologie","Rehabilitation","Rheumatologie","Schmerzmedizin","Urologie","Zahnmedizin","Noch nicht zugeordnet"
  ],
  rubricOptions:[
   "Allergien und Unverträglichkeiten","Allgemeine Befunde","Arbeitsmedizin und Bescheinigungen","Augen und Optik","Bildgebung","Blut und Labor","Dermatologie und Haut","Diagnosen","Ernährung und Stoffwechsel","Frauenheilkunde","Hals, Nase und Ohren","Herz und Kreislauf","Impfungen","Innere Organe","Kiefer und Zähne","Knochen, Gelenke und Orthopädie","Krankenhaus und Entlassung","Medikamente und Rezepte","Nerven und Neurologie","Operationen und Eingriffe","Pathologie und Gewebe","Pflege und Hilfsmittel","Psyche und Psychotherapie","Rechnungen und Kosten","Rehabilitation und Therapie","Schmerz","Vorsorge und Früherkennung","Sonstiges"
  ],
  bodyRegionOptions:[
   "Auge","Auge links","Auge rechts","Arm","Arm links","Arm rechts","Bauch","Becken","Bein","Bein links","Bein rechts","Blase","Blut","Brust","Brustkorb","Darm","Ellenbogen","Ellenbogen links","Ellenbogen rechts","Fuß","Fuß links","Fuß rechts","Gallenblase","Ganzkörper","Gehirn","Gesicht","Hand","Hand links","Hand rechts","Harnwege","Hals","Halswirbelsäule","Haut","Herz","Hüfte","Hüfte links","Hüfte rechts","Inneres / innere Organe","Kiefer","Knie","Knie links","Knie rechts","Kopf","Leber","Lendenwirbelsäule","Lunge","Magen","Milz","Mund","Nase / Nebenhöhlen","Niere","Niere links","Niere rechts","Oberarm","Oberarm links","Oberarm rechts","Ohr","Ohr links","Ohr rechts","Prostata","Rücken","Rumpf","Schilddrüse","Schulter","Schulter links","Schulter rechts","Speiseröhre","Wirbelsäule","Zahn / Zähne","Zunge"
  ].sort((a,b)=>a.localeCompare(b,"de")),
  lateralityOptions:["ohne Seitenangabe","beidseits","links","rechts"]
 };
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function values(key,current=""){
  const arr=[...(catalogs[key]||[])];
  if(current&&!arr.includes(current))arr.push(current);
  return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
 }
 function select(key,current="",attrs=""){
  const opts=values(key,current).map(v=>`<option value="${esc(v)}"${v===current?" selected":""}>${esc(v)}</option>`).join("");
  return `<select ${attrs}><option value="">Bitte auswählen</option>${opts}<option value="__custom__">＋ Eigener Eintrag …</option></select>`;
 }
 function extension(name,mime=""){
  const m=String(name||"").match(/\.([a-z0-9]{2,5})$/i);if(m)return "."+m[1].toLowerCase();
  if(mime.includes("pdf"))return ".pdf";if(mime.includes("jpeg"))return ".jpg";if(mime.includes("png"))return ".png";return "";
 }
 function normalizeName(name,date,mime=""){
  let n=String(name||"").trim().replace(/[\\/:*?"<>|]+/g,"-");
  const ext=extension(n,mime);if(ext)n=n.slice(0,-ext.length);
  n=n.replace(/^\d{4}[_-]?\d{2}[_-]?\d{2}[_-]?/i,"").replace(/^_+|_+$/g,"").replace(/\s+/g,"_");
  const d=/^\d{4}-\d{2}-\d{2}$/.test(date||"")?date.replaceAll("-","_"):"0000_00_00";
  return `${d}_${n||"Dokument"}${ext||extension("",mime)}`;
 }
 function bind(root=document){
  root.querySelectorAll("select[data-flex-target]").forEach(sel=>{
   if(sel.dataset.bound)return;sel.dataset.bound="1";
   const input=root.querySelector(`#${CSS.escape(sel.dataset.flexTarget)}`);if(!input)return;
   const sync=()=>{
    if(sel.value==="__custom__"){input.hidden=false;input.value="";input.focus()}
    else if(sel.value){input.value=sel.value;input.hidden=true;input.dispatchEvent(new Event("change",{bubbles:true}))}
   };
   sel.addEventListener("change",sync);
   if(input.value&&values(sel.dataset.catalog).includes(input.value)){sel.value=input.value;input.hidden=true}else{sel.value=input.value?"__custom__":"";input.hidden=!input.value}
  });
  root.querySelectorAll("select[data-region-target]").forEach(sel=>{
   if(sel.dataset.bound)return;sel.dataset.bound="1";
   sel.addEventListener("change",()=>{
    const input=root.querySelector(`#${CSS.escape(sel.dataset.regionTarget)}`);if(!input||!sel.value)return;
    if(sel.value==="__custom__"){input.focus();sel.value="";return}
    const vals=input.value.split(";").map(x=>x.trim()).filter(Boolean);if(!vals.includes(sel.value))vals.push(sel.value);input.value=vals.join("; ");sel.value="";
   })
  });
 }
 return {catalogs,values,select,normalizeName,extension,bind,esc};
})();
