(()=>{"use strict";
 const state=GAStorage.load();let mode="simple",pending={},lastSaveReceipt=null,selectedDocumentIds=new Set();
 const $=id=>document.getElementById(id);

 const CHOICE_DEFAULTS=GAChoices.catalogs;

 function customChoiceKey(id){return `ga_choice_${id}`}
 function getCustomChoices(id){try{return JSON.parse(localStorage.getItem(customChoiceKey(id))||"[]").filter(Boolean)}catch{return []}}
 function learnChoice(id,value){
  value=String(value||"").trim();if(!value)return;
  const all=new Set(getCustomChoices(id));all.add(value);localStorage.setItem(customChoiceKey(id),JSON.stringify([...all].sort((a,b)=>a.localeCompare(b,"de"))));
 }
 function ensureChoiceLists(){
  const host=document.body||document.documentElement;if(!host)return;
  for(const [id,defaults] of Object.entries(CHOICE_DEFAULTS)){
   let list=document.getElementById(id);if(!list){list=document.createElement("datalist");list.id=id;host.appendChild(list)}
   const existing=[];
   for(const d of state.documents||[]){
    if(id==="documentTypeOptions")existing.push(d.type);
    if(id==="specialtyOptions")existing.push(d.creatorSpecialty,d.topicSpecialty,d.specialty);
    if(id==="rubricOptions")existing.push(d.mainRubric,d.rubric);
    if(id==="bodyRegionOptions")existing.push(...(d.bodyRegions||[]));
   }
   const values=[...new Set([...defaults,...getCustomChoices(id),...existing].map(x=>String(x||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
   list.innerHTML=values.map(v=>`<option value="${GAUI.esc(v)}"></option>`).join("");
  }
 }
 function recordProgramError(kind,message,details=""){
  const item={at:new Date().toISOString(),kind,message:String(message||"Unbekannter Fehler"),details:String(details||"")};
  let log=[];try{log=JSON.parse(localStorage.getItem("ga_error_log")||"[]")}catch{}
  log.unshift(item);localStorage.setItem("ga_error_log",JSON.stringify(log.slice(0,30)));
  renderErrorConsole();return item
 }
 function renderErrorConsole(){
  const el=$("errorConsole");if(!el)return;
  let log=[];try{log=JSON.parse(localStorage.getItem("ga_error_log")||"[]")}catch{}
  el.innerHTML=log.length?`<details class="error-console"><summary>Technisches Fehlerprotokoll (${log.length})</summary><div class="actions"><button id="copyErrorLog" class="secondary">Fehlerprotokoll kopieren</button><button id="clearErrorLog">Protokoll leeren</button></div><pre>${GAUI.esc(log.map(x=>`${x.at} · ${x.kind}\n${x.message}${x.details?`\n${x.details}`:""}`).join("\n\n"))}</pre></details>`:"";
  const copy=$("copyErrorLog"),clear=$("clearErrorLog");
  if(copy)copy.onclick=async()=>{await navigator.clipboard?.writeText(JSON.stringify(log,null,2));GAUI.toast("Fehlerprotokoll kopiert.")};
  if(clear)clear.onclick=()=>{localStorage.removeItem("ga_error_log");renderErrorConsole();GAUI.toast("Fehlerprotokoll geleert.")};
 }
 function save(){GAStorage.save(state)}
 function navigate(id){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("active",x.dataset.page===id));scrollTo(0,0)}
 function isSpecial(d){return d.rubric!=="Labor"&&d.rubric!=="Sonstige"&&d.specialty!=="Noch nicht zugeordnet"}
 function enrichValue(v){
  const ref=GALabRefs.find(v.name);
  if(ref){
   if(!v.unit)v.unit=ref.unit;
   if(v.min==null&&ref.min!=null)v.orientationMin=ref.min;
   if(v.max==null&&ref.max!=null)v.orientationMax=ref.max;
  }
  return v;
 }
 function limits(v){const ref=GALabRefs.find(v.name);return {min:v.min??v.orientationMin??ref?.min??null,max:v.max??v.orientationMax??ref?.max??null,idealMin:ref?.idealMin??null,idealMax:ref?.idealMax??null,ref}}
 function abnormal(v){const l=limits(v);return GALabRefs.status(v.value,l.min,l.max)!=="ok"}
 function integrateLabs(doc){let n=0;for(const v of doc.labValues||[]){if(!state.values.some(x=>x.name===v.name&&x.date===v.date&&x.value===v.value)){state.values.push(v);n++}}return n}
 function duplicate(doc){return state.documents.find(d=>(doc.hash&&d.hash===doc.hash)||(d.name===doc.name&&d.date===doc.date))}
 function updatePendingCount(){
  const n=Object.keys(pending).length,el=$("pendingCount");
  if(el)el.textContent=`${n} vorbereitet`;
 }
 function textList(value){return String(value||"").split(/\n|;/).map(x=>x.trim()).filter(Boolean)}
 function flexibleChoice(key,current,inputId,labelId){
  return `<div class="flex-choice">${GAChoices.select(key,current,`data-flex-target="${inputId}" data-catalog="${key}" aria-label="${labelId||"Auswahl"}"`)}<input id="${inputId}" value="${GAUI.esc(current||"")}" placeholder="Eigenen Eintrag eingeben" hidden></div>`
 }
 function normalizePendingName(d){d.name=GAChoices.normalizeName(d.name,d.date,d.mime||d.originalFilesMeta?.[0]?.type||"");return d.name}
 function updatePendingFromForm(id){
  const d=pending[id];if(!d)return null;
  const original=d._autoClassification||{specialty:d.specialty,mainRubric:d.mainRubric||d.rubric,region:(d.bodyRegions||[])[0]||"",side:d.laterality||""};
  const val=suffix=>document.getElementById(`${suffix}-${id}`)?.value??"";
  d.name=val("pname").trim()||d.name;d.date=val("pdate")||d.date;d.type=val("ptype").trim()||d.type;normalizePendingName(d);
  d.creatorSpecialty=val("pcreator").trim()||"Noch nicht erkannt";
  d.topicSpecialty=val("ptopic").trim()||"Noch nicht zugeordnet";
  d.specialty=d.topicSpecialty!=="Noch nicht zugeordnet"?d.topicSpecialty:d.creatorSpecialty;
  d.mainRubric=val("pmainrubric").trim()||"Sonstiges";d.rubric=d.mainRubric;
  d.laterality=val("pside")||"ohne Seitenangabe";
  d.issuer=val("pissuer").trim();d.doctor=val("pdoctor").trim();d.bodyRegions=textList(val("pregions"));
  d.diagnoses=textList(val("pdiagnoses"));d.medications=textList(val("pmedications"));d.recommendations=textList(val("precommendations"));
  d.manualClassification=true;
  const changed=original.specialty!==d.topicSpecialty||original.mainRubric!==d.mainRubric||original.region!==(d.bodyRegions[0]||"")||original.side!==d.laterality;
  if(changed&&document.getElementById(`plearn-${id}`)?.checked){
   GAMedKnowledge.learn({keywords:d.classificationEvidence||[],specialty:d.topicSpecialty,mainRubric:d.mainRubric,region:d.bodyRegions[0]||"",side:d.laterality});
   d.learnedCorrection=true
  }
  learnChoice("documentTypeOptions",d.type);learnChoice("specialtyOptions",d.creatorSpecialty);learnChoice("specialtyOptions",d.topicSpecialty);learnChoice("rubricOptions",d.mainRubric);for(const r of d.bodyRegions)learnChoice("bodyRegionOptions",r);
  return d
 }
 function structuredSummary(doc){
  const chips=(doc.bodyRegions||[]).map(x=>`<span class="chip">${GAUI.esc(x)}</span>`).join("");
  const source=(doc.sourceNames||[doc.name]).map(x=>`<li>${GAUI.esc(x)}</li>`).join("");
  const diag=(doc.diagnoses||[]).map(x=>`<span class="chip">${GAUI.esc(x)}</span>`).join("")||"<span class='small'>Keine eindeutige Diagnose erkannt</span>";
  const groups={};
  for(const v of doc.labValues||[])(groups["Laborwerte"]??=[]).push(`${v.name}: ${v.value} ${v.unit}${v.min!=null||v.max!=null?` (Referenz ${v.min??"–"} bis ${v.max??"∞"})`:""}`);
  for(const v of doc.measurements||[])(groups[v.valueType||"Allgemeine Messwerte"]??=[]).push(`${v.label}: ${v.value} ${v.unit}`);
  const valueHtml=Object.keys(groups).length?Object.entries(groups).map(([type,items])=>`<details><summary>${GAUI.esc(type)} (${items.length})</summary><ul class="source-list">${items.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul></details>`).join(""):"<p class='small'>Keine Messwerte sicher erkannt.</p>";
  const costs=(doc.costs||[]).map(v=>`${v.label}: ${v.value.toFixed?.(2)??v.value} ${v.unit||"€"}`);
  const alt=(doc.alternatives||[]).map(a=>`<span class="chip">${GAUI.esc(a.name)} · ${a.confidence}%</span>`).join("");
  return `<div class="field-group"><h4>Medizinische Zuordnung</h4>
   <div class="reference-grid"><div><b>Erstellendes Fachgebiet</b><br>${GAUI.esc(doc.creatorSpecialty||"Nicht erkannt")}</div><div><b>Medizinisches Themengebiet</b><br>${GAUI.esc(doc.topicSpecialty||doc.specialty||"Nicht erkannt")}</div><div><b>Hauptrubrik</b><br>${GAUI.esc(doc.mainRubric||doc.rubric||"Sonstiges")}</div><div><b>Körperseite</b><br>${GAUI.esc(doc.laterality||"ohne Seitenangabe")}</div></div>
   <div class="chip-list">${chips||"<span class='small'>Keine Körperregion sicher erkannt</span>"}</div>
   ${alt?`<p class="small"><b>Alternative Vorschläge:</b></p><div class="chip-list">${alt}</div>`:""}
  </div>
  <div class="field-group"><h4>Diagnosen und wichtige Begriffe</h4><div class="chip-list">${diag}</div></div>
  <div class="field-group"><h4>Erkannte Werte nach Typ</h4>${valueHtml}</div>
  <div class="field-group"><h4>Kosten</h4>${costs.length?`<ul class="source-list">${costs.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul>`:"<p class='small'>Keine Kostenangaben erkannt.</p>"}</div>
  <details><summary>Quelldateien und erkannter Originaltext</summary><ul class="source-list">${source}</ul><div class="compact-text">${GAUI.esc(doc.text||"")}</div></details>`
 }

 function showSaveReceipt(doc,message="Dokument erfolgreich gespeichert"){
  lastSaveReceipt={id:doc.id,name:doc.name,at:new Date().toISOString(),message};
  sessionStorage.setItem("ga_last_save_receipt",JSON.stringify(lastSaveReceipt));
 }
 function saveReceiptHtml(){
  let r=lastSaveReceipt;
  if(!r)try{r=JSON.parse(sessionStorage.getItem("ga_last_save_receipt")||"null")}catch{}
  if(!r)return "";
  return `<div class="save-receipt" id="saveReceipt"><div><b>✅ ${GAUI.esc(r.message)}</b><br><span>Gespeichert unter: <b>Dokumente → ${GAUI.esc(r.name)}</b></span></div><button class="secondary" onclick="document.getElementById('saveReceipt')?.remove()">Schließen</button></div>`;
 }
 async function saveDoc(id,asCopy=false){
  let doc=updatePendingFromForm(id);if(!doc)return;
  const dup=duplicate(doc);
  if(dup&&!asCopy)return GAUI.toast("Dokument ist bereits vorhanden. Bitte Ersetzen oder als Kopie speichern.","error");
  if(asCopy){
   const oldName=doc.name,ext=GAChoices.extension(oldName,doc.mime||"");
   const base=ext?oldName.slice(0,-ext.length):oldName;
   doc={...doc,id:GAExtract.uid(),name:`${base}_Kopie${ext}`}
  }
  const files=doc._files||[];
  state.documents.push(doc);
  const n=$("takeLabs").checked?integrateLabs(doc):0;
  if($("saveOriginal").checked&&files.length)try{
   await GAStorage.putOriginalPackage(doc.id,files);doc.originalStored=true;doc.originalSavedAt=new Date().toISOString()
  }catch(e){
   recordProgramError("Originalspeicher",e.message,e.stack);
   GAUI.toast("Die Daten wurden gespeichert, der Originalbeleg jedoch nicht. Bitte nochmals kontrollieren.","error")
  }
  delete doc._files;
  save();

  // Speicherung unmittelbar gegen den lokalen Speicher prüfen.
  const memoryFound=state.documents.some(x=>x.id===doc.id);
  const storedFound=(GAStorage.load().documents||[]).some(x=>x.id===doc.id);
  if(!memoryFound||!storedFound){
   recordProgramError("Dokumentspeicherung","Speicherprüfung fehlgeschlagen",doc.name);
   GAUI.toast("Speichern konnte nicht bestätigt werden. Das Dokument bleibt zur Sicherheit im Import sichtbar.","error");
   doc._files=files;
   if(!pending[id])pending[id]=doc;
   renderPendingCards();
   return
  }

  delete pending[id];
  showSaveReceipt(doc,"Dokument erfolgreich gespeichert");
  ensureChoiceLists();
  if($("documentSearch"))$("documentSearch").value="";
  if($("documentFilter"))$("documentFilter").value="all";
  render();renderPendingCards();navigate("documents");
  setTimeout(()=>{
   const card=document.querySelector(`[data-document-id="${doc.id}"]`);
   if(card){card.classList.add("just-saved");card.scrollIntoView({behavior:"smooth",block:"center"})}
  },120);
  GAUI.toast(`✅ Erfolgreich gespeichert unter Dokumente: ${doc.name}. ${n} neue Laborwerte übernommen.`)
 }
 async function replaceDoc(pid,did){
  const doc=updatePendingFromForm(pid),i=state.documents.findIndex(x=>x.id===did);if(!doc||i<0)return;
  const files=doc._files||[];doc.id=did;
  if(files.length&&$("saveOriginal").checked){await GAStorage.putOriginalPackage(did,files);doc.originalStored=true;doc.originalSavedAt=new Date().toISOString()}
  state.documents[i]=doc;integrateLabs(doc);delete doc._files;save();
  const storedFound=(GAStorage.load().documents||[]).some(x=>x.id===did);
  if(!storedFound){GAUI.toast("Das Ersetzen konnte nicht bestätigt werden. Bitte nicht weiterarbeiten und Fehlerprotokoll prüfen.","error");return}
  delete pending[pid];if(pid!==did)await GAStorage.deleteOriginal(pid).catch(()=>{});
  showSaveReceipt(doc,"Vorhandenes Dokument erfolgreich ersetzt");
  ensureChoiceLists();if($("documentSearch"))$("documentSearch").value="";if($("documentFilter"))$("documentFilter").value="all";
  render();renderPendingCards();navigate("documents");
  setTimeout(()=>document.querySelector(`[data-document-id="${did}"]`)?.scrollIntoView({behavior:"smooth",block:"center"}),120);
  GAUI.toast(`✅ Erfolgreich gespeichert unter Dokumente: ${doc.name}`)
 }
 function preview(doc){
  pending[doc.id]=doc;
  if(!doc._autoClassification)doc._autoClassification={specialty:doc.topicSpecialty||doc.specialty,mainRubric:doc.mainRubric||doc.rubric,region:(doc.bodyRegions||[])[0]||"",side:doc.laterality||""};
  const dup=duplicate(doc),pct=Math.round((doc.confidence||.3)*100);
  const stateTag=dup?`<span class="tag duplicate">bereits ähnlich vorhanden</span>`:`<span class="tag new">neu</span>`;
  const uncertain=pct<65?`<span class="tag uncertain">Zuordnung kontrollieren</span>`:"";
  const evidence=(doc.classificationEvidence||[]).map(x=>`<span class="chip">${GAUI.esc(x)}</span>`).join("");
  return `<details class="item import-card" id="preview-${doc.id}">
   <summary><div><div class="import-title">${GAUI.esc(doc.name)}</div><div class="import-status">${stateTag}${uncertain}<span class="tag">${GAUI.date(doc.date)}</span><span class="tag">${GAUI.esc(doc.type)}</span><span class="tag">${GAUI.esc(doc.topicSpecialty||doc.specialty)}</span></div></div><span>▼</span></summary>
   <div class="import-body">
    <div class="small">Erkennungssicherheit: ${pct}%</div><div class="confidence"><i style="width:${pct}%"></i></div>
    ${pct<65?`<div class="review-warning">Die automatische Zuordnung ist nicht eindeutig. Bitte erstellendes Fachgebiet, Themengebiet, Rubrik, Körperregion und Seite kontrollieren.</div>`:""}
    <div class="field-group"><h4>Grunddaten und Zuordnung kontrollieren</h4>
     <div class="edit-grid">
      <div class="wide"><label>Dokumentname</label><input id="pname-${doc.id}" value="${GAUI.esc(GAChoices.normalizeName(doc.name,doc.date,doc.mime||""))}"><div class="small">Vorgabe: JJJJMMTT_Beschreibung, zum Beispiel 20231001_Hautarztbericht.pdf. Die Dateiendung bleibt automatisch erhalten.</div></div>
      <div><label>Dokumentdatum</label><input id="pdate-${doc.id}" type="date" value="${doc.date||""}"></div>
      <div><label>Dokumentart</label>${flexibleChoice("documentTypeOptions",doc.type,`ptype-${doc.id}`,"Dokumentart")}</div>
      <div><label>Erstellendes Fachgebiet</label>${flexibleChoice("specialtyOptions",doc.creatorSpecialty||"",`pcreator-${doc.id}`,"Erstellendes Fachgebiet")}</div>
      <div><label>Medizinisches Themengebiet</label>${flexibleChoice("specialtyOptions",doc.topicSpecialty||doc.specialty||"",`ptopic-${doc.id}`,"Medizinisches Themengebiet")}</div>
      <div><label>Hauptrubrik</label>${flexibleChoice("rubricOptions",doc.mainRubric||doc.rubric||"",`pmainrubric-${doc.id}`,"Hauptrubrik")}</div>
      <div><label>Körperseite</label><select id="pside-${doc.id}">${GAChoices.catalogs.lateralityOptions.map(x=>`<option${x===(doc.laterality||"ohne Seitenangabe")?" selected":""}>${x}</option>`).join("")}</select></div>
      <div><label>Aussteller / Praxis</label><input id="pissuer-${doc.id}" value="${GAUI.esc(doc.issuer||"")}"></div>
      <div><label>Arzt / Behandler</label><input id="pdoctor-${doc.id}" value="${GAUI.esc(doc.doctor||"")}"></div>
      <div class="wide"><label>Körperbereich / Körperregion</label>${GAChoices.select("bodyRegionOptions","",`data-region-target="pregions-${doc.id}" aria-label="Körperbereich hinzufügen"`)}<input id="pregions-${doc.id}" value="${GAUI.esc((doc.bodyRegions||[]).join("; "))}" placeholder="Mehrere Bereiche mit Semikolon trennen oder eigenen Begriff eintragen"><div class="small">Die Liste ist alphabetisch. Mehrere Bereiche können nacheinander hinzugefügt werden.</div></div>
     </div>
     ${evidence?`<p class="small"><b>Erkennungsbegriffe:</b></p><div class="chip-list">${evidence}</div>`:""}
     <label class="learn-check"><input id="plearn-${doc.id}" type="checkbox" checked> Meine Korrektur für ähnliche Dokumente lokal merken</label>
    </div>
    <div class="actions review-preview-actions"><button class="secondary" onclick="GAApp.reviewPending('${doc.id}')">Original und Scan-Ergebnis vergleichen</button></div>
    ${structuredSummary(doc)}
    <div class="field-group"><h4>Erkannte Inhalte korrigieren</h4>
     <label>Diagnosen / Begriffe – eine Zeile pro Eintrag</label><textarea id="pdiagnoses-${doc.id}">${GAUI.esc((doc.diagnoses||[]).join("\n"))}</textarea>
     <label>Medikamente</label><textarea id="pmedications-${doc.id}">${GAUI.esc((doc.medications||[]).join("\n"))}</textarea>
     <label>Empfehlungen / Kontrollen</label><textarea id="precommendations-${doc.id}">${GAUI.esc((doc.recommendations||[]).join("\n"))}</textarea>
    </div>
    ${GAUI.specialHtml(doc.specialtyData)}
    ${dup?`<div class="duplicate"><b>Ähnliches Dokument vorhanden:</b> ${GAUI.esc(dup.name)} vom ${GAUI.date(dup.date)}<div class="actions"><button onclick="GAApp.replace('${doc.id}','${dup.id}')">Vorhandenes ersetzen</button><button onclick="GAApp.saveDoc('${doc.id}',true)">Als Kopie speichern</button><button onclick="GAApp.discard('${doc.id}')">Verwerfen</button></div></div>`:
    `<div class="actions"><button class="primary" onclick="GAApp.saveDoc('${doc.id}')">Geprüftes Dokument speichern</button><button class="secondary" onclick="GAApp.discard('${doc.id}')">Verwerfen</button></div>`}
   </div></details>`
 }
 function renderPendingCards(){
  const box=$("importResults");if(!box)return;
  const docs=Object.values(pending);box.innerHTML=docs.length?docs.map(preview).join(""):"<p class='small'>Keine vorbereiteten Dokumente.</p>";GAChoices.bind(box);box.querySelectorAll("input[id^=pname-]").forEach(el=>el.addEventListener("blur",()=>{const id=el.id.slice(6),d=pending[id];if(d)el.value=GAChoices.normalizeName(el.value,document.getElementById(`pdate-${id}`)?.value,d.mime||"")}));updatePendingCount()
 } function render(){
  $("metricDocuments").textContent=state.documents.length;$("metricLabs").textContent=state.values.length;$("metricSpecialties").textContent=state.documents.filter(isSpecial).length;$("metricAbnormal").textContent=state.values.filter(abnormal).length;
  const unreviewed=state.documents.filter(d=>(d.reviewStatus||"unreviewed")!=="reviewed").length,withoutOriginal=state.documents.filter(d=>!d.originalStored).length;
  $("dashboardSummary").innerHTML=`<p><b>${state.documents.length}</b> Dokumente und <b>${state.values.length}</b> Laborwerte sind lokal gespeichert.</p><p><b>${unreviewed}</b> Dokumente benötigen noch eine Prüfung; bei <b>${withoutOriginal}</b> Dokument(en) fehlt der Originalbeleg.</p>`;
  const recent=[...state.documents].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);$("recentItems").innerHTML=recent.map(d=>`<div class="item"><b>${GAUI.date(d.date)} · ${GAUI.esc(d.name)}</b><div class="small">${GAUI.esc(d.specialty)}</div></div>`).join("")||"<p>Noch keine Einträge.</p>";
  renderDocuments();renderSpecialties();renderLabs();renderTimeline();renderAnalysisSelect();
 }
 function reviewBadge(d){
  const s=d.reviewStatus||"unreviewed",labels={unreviewed:"🔴 ungeprüft",partial:"🟡 teilweise geprüft",reviewed:"🟢 geprüft",uncertain:"⚠ OCR unsicher"};
  return `<span class="tag review-${s}">${labels[s]||labels.unreviewed}</span>`
 }
 function updateBulkRubricOptions(){
  const el=$("bulkRubric");if(!el)return;
  const values=[...new Set([...GAChoices.lists.rubrics,...state.documents.map(d=>d.rubric).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,"de"));
  const cur=el.value;el.innerHTML='<option value="">Rubrik für Auswahl …</option>'+values.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(values.includes(cur))el.value=cur
 }
 function updateSelectedCount(){
  const visible=[...document.querySelectorAll(".document-select")];
  const selected=visible.filter(x=>x.checked).length;
  if($("selectedDocumentCount"))$("selectedDocumentCount").textContent=`${selectedDocumentIds.size} ausgewählt`;
  if($("selectAllDocuments")){
   $("selectAllDocuments").checked=visible.length>0&&selected===visible.length;
   $("selectAllDocuments").indeterminate=selected>0&&selected<visible.length
  }
 }
 function renderDocuments(){
  const q=($("documentSearch")?.value||"").toLowerCase().trim();
  const f=$("documentFilter")?.value||"all";
  const status=$("documentStatusFilter")?.value||"all";
  const original=$("documentOriginalFilter")?.value||"all";
  const favorite=$("documentFavoriteFilter")?.value||"all";
  const sort=$("documentSort")?.value||"date-desc";
  const rubs=[...new Set(state.documents.map(d=>d.rubric).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de")),cur=f;
  $("documentFilter").innerHTML='<option value="all">Alle Rubriken</option>'+rubs.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(rubs.includes(cur))$("documentFilter").value=cur;
  updateBulkRubricOptions();

  let arr=[...state.documents].filter(d=>{
   const hay=`${d.name} ${d.text} ${d.type||""} ${d.rubric||""} ${d.specialty||""} ${d.creatorSpecialty||""} ${d.topicSpecialty||""} ${(d.diagnoses||[]).join(" ")} ${(d.medications||[]).join(" ")}`.toLowerCase();
   return (f==="all"||d.rubric===f)
    &&(status==="all"||(d.reviewStatus||"unreviewed")===status)
    &&(original==="all"||(original==="present"&&d.originalStored)||(original==="missing"&&!d.originalStored))
    &&(favorite==="all"||d.favorite===true)
    &&hay.includes(q)
  });

  const cmpText=(a,b,key)=>(a[key]||"").localeCompare(b[key]||"","de",{sensitivity:"base"});
  const sorters={
   "date-desc":(a,b)=>(b.date||"").localeCompare(a.date||""),
   "date-asc":(a,b)=>(a.date||"").localeCompare(b.date||""),
   "name-asc":(a,b)=>cmpText(a,b,"name"),
   "name-desc":(a,b)=>cmpText(b,a,"name"),
   "specialty-asc":(a,b)=>(a.topicSpecialty||a.specialty||"").localeCompare(b.topicSpecialty||b.specialty||"","de"),
   "type-asc":(a,b)=>(a.type||"").localeCompare(b.type||"","de")
  };
  arr.sort(sorters[sort]||sorters["date-desc"]);

  const cards=arr.map(d=>{
   const summary=(d.keyStatements||[]).slice(0,2).join(" · ")||"Noch keine klare Kurzfassung.";
   const diagnoses=(d.diagnoses||[]).slice(0,8),medications=(d.medications||[]).slice(0,8),recommendations=(d.recommendations||[]).slice(0,8);
   const detailParts=[
    diagnoses.length?`<div class="document-detail-block"><b>Diagnosen / Befunde</b><ul>${diagnoses.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul></div>`:"",
    medications.length?`<div class="document-detail-block"><b>Medikamente</b><ul>${medications.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul></div>`:"",
    recommendations.length?`<div class="document-detail-block"><b>Empfehlungen</b><ul>${recommendations.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul></div>`:""
   ].join("")||`<p class="small">Keine weiteren strukturierten Angaben vorhanden.</p>`;
   return `<article class="item document-card document-card-collapsed${selectedDocumentIds.has(d.id)?" selected-document":""}" data-document-id="${d.id}">
    <div class="document-card-tools">
     <label class="document-select-label"><input class="document-select" type="checkbox" data-select-id="${d.id}"${selectedDocumentIds.has(d.id)?" checked":""}> auswählen</label>
     <button class="favorite-button${d.favorite?" active":""}" onclick="GAApp.toggleFavorite('${d.id}')" title="${d.favorite?"Favorit entfernen":"Als Favorit markieren"}">${d.favorite?"★":"☆"}</button>
    </div>
    <div class="document-card-head"><div><div class="import-title document-title">${GAUI.esc(d.name)}</div><div class="import-status"><span class="tag">${GAUI.date(d.date)}</span><span class="tag">${GAUI.esc(d.rubric)}</span><span class="tag">${GAUI.esc(d.topicSpecialty||d.specialty)}</span>${reviewBadge(d)}${d.originalStored?'<span class="tag new">Original vorhanden</span>':'<span class="tag uncertain">Original fehlt</span>'}</div></div></div>
    <p class="small document-summary">${GAUI.esc(summary)}</p>
    <div class="document-more-content" aria-hidden="true">${detailParts}</div>
    <div class="document-card-footer">
     <button class="more-button secondary" onclick="GAApp.toggleDocumentMore('${d.id}',this)" aria-expanded="false">… mehr</button>
     <div class="actions document-actions">
      <button class="primary" onclick="GAApp.review('${d.id}')">Original & Daten prüfen</button>
      <button onclick="GAApp.analyse('${d.id}')">Analyse</button>
      <button onclick="GAApp.editArchive('${d.id}')">Umbenennen / Rubrik</button>
      <button onclick="GAApp.duplicateDocument('${d.id}')">Duplizieren</button>
      <button onclick="GAApp.share('${d.id}')">Teilen</button>
      <button onclick="GAApp.remove('${d.id}')">Entfernen</button>
     </div>
    </div>
   </article>`
  }).join("");

  $("documentList").innerHTML=saveReceiptHtml()+(arr.length?`<div class="document-grid">${cards}</div>`:"<article class='card'>Keine Dokumente gefunden.</article>");
  document.querySelectorAll(".document-select").forEach(cb=>cb.onchange=()=>{
   cb.checked?selectedDocumentIds.add(cb.dataset.selectId):selectedDocumentIds.delete(cb.dataset.selectId);
   cb.closest(".document-card")?.classList.toggle("selected-document",cb.checked);updateSelectedCount()
  });
  updateSelectedCount()
 } function renderSpecialties(){
  const q=$("specialtySearch").value.toLowerCase(),f=$("specialtyFilter").value,docs=state.documents.filter(isSpecial),specs=[...new Set(docs.map(d=>d.specialty))].sort(),cur=f;$("specialtyFilter").innerHTML='<option value="all">Alle Fachgebiete</option>'+specs.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(specs.includes(cur))$("specialtyFilter").value=cur;
  const arr=docs.filter(d=>(f==="all"||d.specialty===f)&&`${d.name} ${d.text} ${d.creatorSpecialty||""} ${d.topicSpecialty||d.specialty||""} ${JSON.stringify(d.specialtyData)}`.toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("specialtyList").innerHTML=arr.map(d=>`<div class="item"><h3>${GAUI.esc(d.name)}</h3><div class="meta">${GAUI.date(d.date)} · erstellt: ${GAUI.esc(d.creatorSpecialty||"–")} · Thema: ${GAUI.esc(d.topicSpecialty||d.specialty||"–")}</div>${GAUI.specialHtml(d.specialtyData)}${assignBox(d.id)}</div>`).join("")||"<article class='card'>Noch keine Fachbefunde. Neu auswerten oder manuell zuordnen.</article>";
 }
 function assignBox(id){return `<div class="actions"><select id="assign-${id}"><option value="">Fachgebiet ändern …</option><option>Augenheilkunde</option><option>Augenoptik</option><option>Zahnmedizin</option><option>Orthopädie / Unfallchirurgie</option><option>Neurologie</option><option>Urologie</option><option>Kardiologie</option><option>Radiologie</option><option>Hals-Nasen-Ohrenheilkunde</option><option>Allgemeinmedizin</option></select><button onclick="GAApp.assign('${id}')">Zuordnen</button></div>`}
 function renderUnassigned(){const arr=state.documents.filter(d=>!isSpecial(d));$("unassignedList").innerHTML=`<article class="card"><h2>Nicht zugeordnet</h2>${arr.map(d=>`<div class="item"><b>${GAUI.esc(d.name)}</b><div class="small">${GAUI.date(d.date)} · ${GAUI.esc(d.rubric)}</div>${assignBox(d.id)}</div>`).join("")||"<p>Alle Dokumente zugeordnet.</p>"}</article>`}
 function valuePosition(v,l){
  if(l.min==null&&l.max==null)return 50;
  let lo=l.min??0,hi=l.max??Math.max(lo*2,Number(v.value)*1.2,1),span=hi-lo||1;
  const displayLo=lo-span*.35,displayHi=hi+span*.35;
  return Math.max(1,Math.min(99,(Number(v.value)-displayLo)/(displayHi-displayLo)*100));
 }
 function labCard(v){
  const l=limits(v),s=GALabRefs.status(v.value,l.min,l.max),refText=`${l.min==null?"–":l.min} bis ${l.max==null?"∞":l.max} ${v.unit||""}`,ideal=`${l.idealMin==null?"–":l.idealMin} bis ${l.idealMax==null?"∞":l.idealMax} ${v.unit||""}`;
  return `<div class="item lab-card ${s}"><div class="lab-head"><div><h3>${GAUI.esc(v.name)}</h3><div class="small">${GAUI.date(v.date)} · ${GAUI.esc(v.note||v.source||"")}</div></div><div class="lab-value">${v.value} ${GAUI.esc(v.unit||"")}<br><span class="badge">${GALabRefs.describeStatus(s)}</span></div></div><div class="rangebar"><i style="left:${valuePosition(v,l)}%"></i></div><div class="reference-grid"><div><b>Referenz</b><br>${refText}${v.min==null&&v.max==null&&l.ref?" <span class='small'>(Orientierung)</span>":""}</div><div><b>Günstiger Orientierungskorridor</b><br>${ideal}</div></div>${l.ref?.info?`<details><summary>Erklärung</summary><div class="explanation">${GAUI.esc(l.ref.info)}</div></details>`:""}<button class="delete-mini" onclick="GAApp.removeLab('${v.id}')">Wert löschen</button></div>`
 }
 function renderLabs(){
  state.values.forEach(enrichValue);
  const q=$("labSearch").value.toLowerCase(),f=$("labNameFilter").value,names=[...new Set(state.values.map(v=>v.name))].sort(),cur=f;
  $("labNameFilter").innerHTML='<option value="all">Alle Werte</option>'+names.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(names.includes(cur))$("labNameFilter").value=cur;
  const arr=[...state.values].filter(v=>(f==="all"||v.name===f)&&v.name.toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("labList").innerHTML=arr.map(labCard).join("")||"<article class='card'>Keine Laborwerte.</article>";
  const allNames=[...new Set([...names,...GALabRefs.refs.map(r=>r.name)])].sort();
  $("knownLabNames").innerHTML=allNames.map(x=>`<option value="${GAUI.esc(x)}"></option>`).join("");
  const current=$("trendSelect").value;$("trendSelect").innerHTML=names.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(names.includes(current))$("trendSelect").value=current;
  renderCompareDates();renderReferences();drawTrend()
 }
 function drawTrend(){
  const name=$("trendSelect").value,arr=state.values.filter(v=>v.name===name).sort((a,b)=>(a.date||"").localeCompare(b.date||"")),c=$("trendCanvas"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
  if(!arr.length){$("trendText").textContent="Noch keine Messungen für diesen Wert.";return}
  const l=limits(arr[0]),vals=arr.map(x=>Number(x.value)),rawMin=Math.min(...vals,l.min??Infinity,l.idealMin??Infinity),rawMax=Math.max(...vals,l.max??-Infinity,l.idealMax??-Infinity),min=Number.isFinite(rawMin)?rawMin:Math.min(...vals),max=Number.isFinite(rawMax)?rawMax:Math.max(...vals),pad=48,range=max-min||1;
  ctx.font="14px system-ui";ctx.strokeStyle="#0b7285";ctx.fillStyle="#17232b";ctx.lineWidth=3;
  const yFor=v=>c.height-pad-(v-min)*(c.height-2*pad)/range;
  if(l.min!=null&&l.max!=null){ctx.fillStyle="#dcfce7";ctx.fillRect(pad,yFor(l.max),c.width-2*pad,yFor(l.min)-yFor(l.max));ctx.fillStyle="#17232b"}
  ctx.beginPath();arr.forEach((v,i)=>{const x=pad+i*(c.width-2*pad)/Math.max(1,arr.length-1),y=yFor(Number(v.value));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  arr.forEach((v,i)=>{const x=pad+i*(c.width-2*pad)/Math.max(1,arr.length-1),y=yFor(Number(v.value));ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillText(String(v.value),x-12,y-10);ctx.fillText(GAUI.date(v.date),x-28,c.height-14)});
  $("trendText").innerHTML=`<b>${arr.length} Messung(en)</b> von ${GAUI.date(arr[0].date)} bis ${GAUI.date(arr.at(-1).date)}. Grün markiert ist der hinterlegte Referenzbereich, sofern vorhanden.`;
 }
 function renderCompareDates(){
  const dates=[...new Set(state.values.map(v=>v.date).filter(Boolean))].sort(),a=$("compareDateA").value,b=$("compareDateB").value;
  $("compareDateA").innerHTML=dates.map(d=>`<option value="${d}">${GAUI.date(d)}</option>`).join("");
  $("compareDateB").innerHTML=dates.map(d=>`<option value="${d}">${GAUI.date(d)}</option>`).join("");
  if(dates.includes(a))$("compareDateA").value=a;else if(dates.length)$("compareDateA").value=dates[0];
  if(dates.includes(b))$("compareDateB").value=b;else if(dates.length)$("compareDateB").value=dates.at(-1);
 }
 function compareLabs(){
  const a=$("compareDateA").value,b=$("compareDateB").value;
  if(!a||!b)return GAUI.toast("Bitte zwei Labortermine auswählen.","error");
  const av=state.values.filter(v=>v.date===a),bv=state.values.filter(v=>v.date===b),names=[...new Set([...av.map(v=>v.name),...bv.map(v=>v.name)])].sort();
  const rows=names.map(name=>{const x=av.find(v=>v.name===name),y=bv.find(v=>v.name===name);if(!x||!y)return`<tr><td>${GAUI.esc(name)}</td><td>${x?x.value+" "+GAUI.esc(x.unit):"–"}</td><td>${y?y.value+" "+GAUI.esc(y.unit):"–"}</td><td>nicht vergleichbar</td></tr>`;const delta=Number(y.value)-Number(x.value),pct=Number(x.value)!==0?delta/Number(x.value)*100:null,cls=delta>0?"delta-up":delta<0?"delta-down":"delta-same",arrow=delta>0?"▲":delta<0?"▼":"●";return`<tr><td>${GAUI.esc(name)}</td><td>${x.value} ${GAUI.esc(x.unit)}</td><td>${y.value} ${GAUI.esc(y.unit)}</td><td class="${cls}">${arrow} ${delta>0?"+":""}${Math.round(delta*100)/100}${pct!=null?` (${pct>0?"+":""}${pct.toFixed(1)} %)`:""}</td></tr>`}).join("");
  $("compareOutput").innerHTML=`<table class="comparison-table"><thead><tr><th>Wert</th><th>${GAUI.date(a)}</th><th>${GAUI.date(b)}</th><th>Änderung</th></tr></thead><tbody>${rows}</tbody></table><p class="small">Ein Anstieg oder Abfall ist nicht automatisch gut oder schlecht. Entscheidend sind Referenzbereich, Verlauf und medizinischer Zusammenhang.</p>`;
 }
 function renderReferences(){
  const q=($("referenceSearch")?.value||"").toLowerCase(),cat=$("referenceCategory")?.value||"all",categories=[...new Set(GALabRefs.refs.map(r=>r.category))].sort(),cur=cat;
  $("referenceCategory").innerHTML='<option value="all">Alle Kategorien</option>'+categories.map(c=>`<option>${GAUI.esc(c)}</option>`).join("");if(categories.includes(cur))$("referenceCategory").value=cur;
  const refs=GALabRefs.refs.filter(r=>(cat==="all"||r.category===cat)&&`${r.name} ${r.category} ${r.info}`.toLowerCase().includes(q));
  $("referenceList").innerHTML=refs.map(r=>`<div class="reference-card"><div class="lab-head"><div><b>${GAUI.esc(r.name)}</b><div class="small">${GAUI.esc(r.category)}</div></div><span class="badge">${GAUI.esc(r.unit)}</span></div><div class="reference-grid"><div><b>Allgemeiner Referenzbereich</b><br>${r.min==null?"–":r.min} bis ${r.max==null?"∞":r.max} ${GAUI.esc(r.unit)}</div><div><b>Günstiger Orientierungskorridor</b><br>${r.idealMin==null?"–":r.idealMin} bis ${r.idealMax==null?"∞":r.idealMax} ${GAUI.esc(r.unit)}</div></div><p>${GAUI.esc(r.info)}</p><button class="secondary" onclick="GAApp.useReference('${GAUI.esc(r.name)}')">Als neuen Wert verwenden</button></div>`).join("");
 }
 function renderTimeline(){const items=[...state.documents.map(d=>({date:d.date,title:d.name,type:d.specialty})),...state.values.map(v=>({date:v.date,title:`${v.name}: ${v.value} ${v.unit}`,type:"Labor"}))].sort((a,b)=>(b.date||"").localeCompare(a.date||""));$("timelineList").innerHTML=items.map(x=>`<div class="item"><b>${GAUI.date(x.date)} · ${GAUI.esc(x.title)}</b><div class="small">${GAUI.esc(x.type)}</div></div>`).join("")||"<article class='card'>Noch keine Chronik.</article>"}
 function renderAnalysisSelect(){const cur=$("analysisDocument").value;$("analysisDocument").innerHTML='<option value="">Befund auswählen …</option>'+state.documents.map(d=>`<option value="${d.id}">${GAUI.date(d.date)} · ${GAUI.esc(d.name)}</option>`).join("");$("analysisDocument").value=cur}
 async function share(id){const d=state.documents.find(x=>x.id===id),text=GAUI.analysis(d,mode),file=new File([text],`Gesundheitsakte_${d.date}.txt`,{type:"text/plain"});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]})))await navigator.share({title:d.name,files:[file]});else download(file)}
 function download(blob,name=blob.name||"download"){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 function selfTest(){const funcs=[GAStorage.load,GAExtract.document,GAImporter.process,GAUI.analysis,render],ids=["tabs","fileInput","documentList","specialtyList","labList","timelineList","analysisOutput"];const missing=ids.filter(id=>!$(id));$("selfTest").innerHTML=missing.length?`<p class="status">Fehlende Bereiche: ${missing.join(", ")}</p>`:`<p class="status">Selbsttest erfolgreich: Speicher, Import, Analyse und Ansichten sind geladen.</p>`}
 function wire(){
  try{ensureChoiceLists()}catch(err){recordProgramError("Auswahllisten",err.message,err.stack)}

  $("tabs").onclick=e=>{const b=e.target.closest("button[data-page]");if(b)navigate(b.dataset.page)};
  $("fileInput").onchange=async e=>{const files=[...e.target.files];if(!files.length)return;const docs=await GAImporter.process(files,document.querySelector('input[name="bundleMode"]:checked').value==="bundle");for(const d of docs){pending[d.id]=d;if($("saveOriginal").checked&&d._files?.length)try{await GAStorage.putOriginalPackage(d.id,d._files);d.originalStored=true;d.originalStaged=true}catch{}}renderPendingCards();e.target.value=""};
  $("manualAnalyse").onclick=()=>{const t=$("manualText").value.trim();if(!t)return GAUI.toast("Bitte Text einfügen.","error");const d=GAExtract.document(t,"Manuell eingefügtes Dokument","text/plain");pending[d.id]=d;renderPendingCards();GAUI.toast("Text analysiert – bitte Vorschau kontrollieren.")};
  $("clearImport").onclick=async()=>{for(const d of Object.values(pending))if(d.originalStaged)await GAStorage.deleteOriginal(d.id).catch(()=>{});pending={};GAImporter.reset();GAImporter.step("Anzeige geleert. Bereit für neuen Import.");renderPendingCards();GAUI.toast("Importanzeige geleert.")};
  ["documentSearch","documentFilter","documentStatusFilter","documentOriginalFilter","documentFavoriteFilter","documentSort"].forEach(id=>$(id).oninput=renderDocuments);
  $("selectAllDocuments").onchange=e=>{document.querySelectorAll(".document-select").forEach(cb=>{cb.checked=e.target.checked;cb.checked?selectedDocumentIds.add(cb.dataset.selectId):selectedDocumentIds.delete(cb.dataset.selectId);cb.closest(".document-card")?.classList.toggle("selected-document",cb.checked)});updateSelectedCount()};
  $("bulkApplyRubric").onclick=()=>{const rubric=$("bulkRubric").value;if(!selectedDocumentIds.size)return GAUI.toast("Bitte zuerst Dokumente auswählen.","error");if(!rubric)return GAUI.toast("Bitte eine Zielrubrik auswählen.","error");state.documents.forEach(d=>{if(selectedDocumentIds.has(d.id))d.rubric=rubric});save();renderDocuments();GAUI.toast(`${selectedDocumentIds.size} Dokument(e) der Rubrik „${rubric}“ zugeordnet.`)};
  $("bulkMarkReviewed").onclick=()=>{if(!selectedDocumentIds.size)return GAUI.toast("Bitte zuerst Dokumente auswählen.","error");state.documents.forEach(d=>{if(selectedDocumentIds.has(d.id)){d.reviewStatus="reviewed";d.reviewedAt=new Date().toISOString()}});save();renderDocuments();GAUI.toast(`${selectedDocumentIds.size} Dokument(e) als geprüft markiert.`)};
  $("bulkDelete").onclick=async()=>{if(!selectedDocumentIds.size)return GAUI.toast("Bitte zuerst Dokumente auswählen.","error");const count=selectedDocumentIds.size;if(!confirm(`${count} ausgewählte Dokument(e) einschließlich Originalbelegen löschen?`))return;for(const id of [...selectedDocumentIds])await GAStorage.deleteOriginal(id).catch(()=>{});state.documents=state.documents.filter(d=>!selectedDocumentIds.has(d.id));selectedDocumentIds.clear();save();render();GAUI.toast(`${count} Dokument(e) gelöscht.`)};
  ["specialtySearch","specialtyFilter"].forEach(id=>$(id).oninput=renderSpecialties);["labSearch","labNameFilter"].forEach(id=>$(id).oninput=renderLabs);$("trendSelect").onchange=drawTrend;
  $("newLabDate").value=new Date().toISOString().slice(0,10);
  $("newLabName").onchange=()=>{const r=GALabRefs.find($("newLabName").value);if(r&&!$("newLabUnit").value)$("newLabUnit").value=r.unit};
  $("fillReference").onclick=()=>{const r=GALabRefs.find($("newLabName").value);if(!r)return GAUI.toast("Für diesen Wert ist kein Orientierungsbereich hinterlegt.","error");$("newLabUnit").value=r.unit;$("newLabMin").value=r.min??"";$("newLabMax").value=r.max??"";GAUI.toast("Orientierungsbereich übernommen. Bitte mit dem Laborbericht abgleichen.")};
  $("addLabValue").onclick=()=>{const name=$("newLabName").value.trim(),value=parseFloat($("newLabValue").value.replace(",","."));if(!name||!Number.isFinite(value))return GAUI.toast("Bitte Laborwert und gültigen Messwert eingeben.","error");const ref=GALabRefs.find(name),v={id:GAExtract.uid(),name,value,unit:$("newLabUnit").value.trim()||ref?.unit||"",min:$("newLabMin").value===""?null:parseFloat($("newLabMin").value.replace(",",".")),max:$("newLabMax").value===""?null:parseFloat($("newLabMax").value.replace(",",".")),date:$("newLabDate").value||new Date().toISOString().slice(0,10),note:$("newLabNote").value.trim(),source:"Manuelle Eingabe"};state.values.push(enrichValue(v));save();["newLabValue","newLabNote"].forEach(id=>$(id).value="");render();GAUI.toast("Laborwert gespeichert und in Verlauf sowie Vergleich übernommen.")};
  $("compareLabs").onclick=compareLabs;
  $("referenceSearch").oninput=renderReferences;$("referenceCategory").onchange=renderReferences;
  $("reanalyseAll").onclick=()=>{state.documents.forEach(GAExtract.reanalyse);save();render();GAUI.toast("Alle Befunde wurden neu ausgewertet.")};$("showUnassigned").onclick=renderUnassigned;
  $("analysisModes").onclick=e=>{const b=e.target.closest("button[data-mode]");if(!b)return;mode=b.dataset.mode;document.querySelectorAll("#analysisModes button").forEach(x=>x.classList.toggle("active",x===b));renderDocuments()};
  $("runAnalysis").onclick=()=>{const d=state.documents.find(x=>x.id===$("analysisDocument").value);$("analysisOutput").textContent=d?GAUI.analysis(d,mode):"Bitte Befund auswählen."};
  $("assistantRun").onclick=()=>{const q=$("assistantQuestion").value.toLowerCase();let arr=state.documents.filter(d=>`${d.name} ${d.text} ${d.specialty}`.toLowerCase().includes(q.split(/\s+/).find(x=>x.length>3)||q));if(/auge|brille|visus/.test(q))arr=state.documents.filter(d=>/Auge|Optik/.test(d.specialty));$("assistantOutput").textContent=arr.map(d=>`${GAUI.date(d.date)} · ${d.name}\n${d.keyStatements?.slice(0,3).join(" | ")}`).join("\n\n")||"Keine eindeutigen Treffer."};
  $("downloadBackup").onclick=()=>{const data=GAStorage.backup(state);download(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`Gesundheitsakte_Backup_${new Date().toISOString().slice(0,10)}.json`);$("backupInfo").textContent="Sicherung wurde zum Download bereitgestellt."};
  $("shareBackup").onclick=async()=>{const data=GAStorage.backup(state),f=new File([JSON.stringify(data,null,2)],`Gesundheitsakte_Backup_${new Date().toISOString().slice(0,10)}.json`,{type:"application/json"});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[f]})))await navigator.share({title:"Gesundheitsakte Sicherung",files:[f]});else download(f);$("backupInfo").textContent="Teilen beziehungsweise Download wurde geöffnet."};
  $("restoreBackup").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(confirm("Diese Sicherung wiederherstellen?")){Object.assign(state,GAStorage.restore(data));render();GAUI.toast("Sicherung wiederhergestellt.")}}catch(err){GAUI.toast("Sicherung ungültig: "+err.message,"error")}e.target.value=""};
  $("forceUpdate").onclick=async()=>{if("serviceWorker"in navigator)(await navigator.serviceWorker.getRegistrations()).forEach(r=>r.unregister());if("caches"in window)(await caches.keys()).forEach(k=>caches.delete(k));location.reload()};
 }
 window.GAApp={
  saveDoc,replace:replaceDoc,
  toggleDocumentMore:(id,button)=>{
   const card=document.querySelector(`[data-document-id="${id}"]`);if(!card)return;
   const expanded=card.classList.toggle("document-card-expanded");
   card.classList.toggle("document-card-collapsed",!expanded);
   const content=card.querySelector(".document-more-content");
   if(content)content.setAttribute("aria-hidden",String(!expanded));
   if(button){button.textContent=expanded?"weniger":"… mehr";button.setAttribute("aria-expanded",String(expanded))}
  },
  toggleFavorite:id=>{const d=state.documents.find(x=>x.id===id);if(!d)return;d.favorite=!d.favorite;save();renderDocuments();GAUI.toast(d.favorite?"Dokument als Favorit markiert.":"Favoritenmarkierung entfernt.")},
  editArchive:id=>{
   const d=state.documents.find(x=>x.id===id);if(!d)return;
   const newName=prompt("Neuer Dokumentname:",d.name);if(newName===null)return;
   const rubrics=[...new Set([...GAChoices.lists.rubrics,...state.documents.map(x=>x.rubric).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,"de"));
   const newRubric=prompt(`Neue Hauptrubrik:\\n\\n${rubrics.join("\\n")}`,d.rubric||"");if(newRubric===null)return;
   d.name=newName.trim()||d.name;d.rubric=newRubric.trim()||d.rubric;d.manualChanges=(d.manualChanges||0)+1;d.updatedAt=new Date().toISOString();
   save();renderDocuments();GAUI.toast(`Dokument gespeichert: ${d.name}`)
  },
  duplicateDocument:async id=>{
   const source=state.documents.find(x=>x.id===id);if(!source)return;
   const copy=JSON.parse(JSON.stringify(source));copy.id=GAExtract.uid();copy.name=source.name.replace(/(\.[^.]+)?$/,m=>`_Kopie${m||""}`);copy.favorite=false;copy.reviewStatus="unreviewed";copy.createdAt=new Date().toISOString();
   const pkg=await GAStorage.getOriginalPackage(id).catch(()=>null);if(pkg?.files?.length){await GAStorage.putOriginalPackage(copy.id,pkg.files.map(f=>new File([f.blob],f.name,{type:f.type,lastModified:f.lastModified||Date.now()})));copy.originalStored=true}
   state.documents.push(copy);save();renderDocuments();GAUI.toast(`Kopie erstellt: ${copy.name}`)
  },
  discard:async id=>{const d=pending[id];if(d?.originalStaged)await GAStorage.deleteOriginal(id).catch(()=>{});delete pending[id];renderPendingCards();GAUI.toast("Vorbereiteter Import verworfen.")},
  review:id=>{const d=state.documents.find(x=>x.id===id);if(d)GAReviewer.open(d,{onSave:updated=>{Object.assign(d,updated);save();render()}})},
  reviewPending:id=>{const d=pending[id];if(d)GAReviewer.open(d,{pending:true,onSave:updated=>{Object.assign(d,updated);renderPendingCards()},onFinalize:async updated=>{Object.assign(d,updated);GAReviewer.close();await saveDoc(id)}})},
  analyse:id=>{navigate("analysis");$("analysisDocument").value=id;$("runAnalysis").click()},share,
  remove:async id=>{if(confirm("Dokument und den lokal gespeicherten Originalbeleg entfernen? Bereits übernommene Laborwerte bleiben erhalten.")){state.documents=state.documents.filter(x=>x.id!==id);selectedDocumentIds.delete(id);await GAStorage.deleteOriginal(id).catch(()=>{});save();render();GAUI.toast("Dokument und Originalbeleg entfernt.")}},
  removeLab:id=>{if(confirm("Diesen Laborwert löschen?")){state.values=state.values.filter(x=>x.id!==id);save();render();GAUI.toast("Laborwert gelöscht.")}},
  useReference:name=>{navigate("labs");const r=GALabRefs.find(name);$("newLabName").value=name;$("newLabUnit").value=r?.unit||"";$("newLabMin").value=r?.min??"";$("newLabMax").value=r?.max??"";$("newLabValue").focus();scrollTo(0,250)},
  assign:id=>{const d=state.documents.find(x=>x.id===id),v=$(`assign-${id}`).value;if(!d||!v)return;d.specialty=v;d.rubric=v==="Augenoptik"?"Optik / Brille":v==="Zahnmedizin"?"Zahnmedizin":v.split(" / ")[0];d.manualClassification=true;GAExtract.reanalyse(d);save();render();GAUI.toast("Fachgebiet zugeordnet.")}
 }; window.addEventListener("error",e=>{recordProgramError("JavaScript",e.message,`${e.filename||""}:${e.lineno||""}:${e.colno||""}\n${e.error?.stack||""}`);GAUI.toast(`Programmfehler protokolliert: ${e.message}`,"error")});window.addEventListener("unhandledrejection",e=>{recordProgramError("Promise",e.reason?.message||e.reason,e.reason?.stack||"");GAUI.toast(`Importfehler protokolliert: ${e.reason?.message||e.reason}`,"error")});
 wire();state.documents.forEach(GAExtract.reanalyse);save();render();selfTest();GAUI.toast("Gesundheitsakte 3.3.6 mit Sortierung, Filtern und Sammelbearbeitung wurde vollständig geladen.");
 if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js?v=3.3.6",{updateViaCache:"none"}).catch(console.warn);
})();