window.GAReviewer=(()=>{
 let current=null,callbacks={},urls=[],pageIndex=0,zoom=1;
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=s=>window.GAUI?.date(s)||s||"ohne Datum";
 function ensure(){
  if(document.getElementById("reviewWorkspace"))return;
  const root=document.createElement("div");root.id="reviewWorkspace";root.className="review-overlay";root.innerHTML=`
   <div class="review-shell" role="dialog" aria-modal="true" aria-label="Dokument prüfen">
    <header class="review-header"><div><h2 id="reviewTitle">Prüfarbeitsplatz</h2><div id="reviewMeta" class="small"></div></div>
     <div class="actions"><button id="reviewClose" class="secondary">Schließen</button></div></header>
    <div class="review-statusbar" id="reviewStatusbar"></div>
    <nav class="review-tabs">
     <button data-rpanel="original" class="active">Original</button>
     <button data-rpanel="data">Erkannte Daten</button>
     <button data-rpanel="ocr">OCR-Text</button>
     <button data-rpanel="analysis">Analyse</button>
    </nav>
    <main class="review-main">
     <section id="rpanel-original" class="review-panel active"></section>
     <section id="rpanel-data" class="review-panel"></section>
     <section id="rpanel-ocr" class="review-panel"></section>
     <section id="rpanel-analysis" class="review-panel"></section>
    </main>
   </div>`;
  document.body.appendChild(root);
  root.querySelector("#reviewClose").onclick=close;
  root.querySelector(".review-tabs").onclick=e=>{const b=e.target.closest("button[data-rpanel]");if(!b)return;showPanel(b.dataset.rpanel)};
  root.onclick=e=>{if(e.target===root)close()};
 }
 function clearUrls(){urls.forEach(URL.revokeObjectURL);urls=[]}
 function close(){clearUrls();document.getElementById("reviewWorkspace")?.classList.remove("show");current=null}
 function showPanel(name){
  document.querySelectorAll(".review-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.rpanel===name));
  document.querySelectorAll(".review-panel").forEach(p=>p.classList.toggle("active",p.id===`rpanel-${name}`));
 }
 function statusInfo(d){
  const status=d.reviewStatus||"unreviewed",map={unreviewed:["🔴","Ungeprüft"],partial:["🟡","Teilweise geprüft"],reviewed:["🟢","Geprüft"],uncertain:["⚠️","OCR unsicher"]};
  const [icon,label]=map[status]||map.unreviewed;
  const conf=Math.round((d.confidence||.3)*100),ocr=quality(d).ocr;
  return `<span class="review-state ${status}">${icon} ${label}</span><span class="tag">Erkennung ${conf}%</span><span class="tag">OCR-Qualität ${ocr}%</span><span class="tag">${d.manualChanges||0} Korrektur(en)</span>`;
 }
 function quality(d){
  const raw=String(d.ocrRawText||d.text||""),chars=raw.replace(/\s/g,"").length;
  const odd=(raw.match(/[�□■_]{2,}|[|]{3,}/g)||[]).length;
  const ocr=Math.max(20,Math.min(100,Math.round(55+Math.min(30,chars/80)-odd*6)));
  const fields=[d.date,d.type,d.specialty,d.rubric,d.bodyRegions?.length,d.diagnoses?.length].filter(Boolean).length;
  const completeness=Math.round(fields/6*100);
  return {ocr,completeness,overall:Math.round((ocr+completeness+Math.round((d.confidence||.3)*100))/3)}
 }
 async function renderOriginal(){
  const box=document.getElementById("rpanel-original");box.innerHTML=`<div class="loading">Original wird geladen …</div>`;
  const pkg=await GAStorage.getOriginalPackage(current.id);
  if(!pkg?.files?.length){
   box.innerHTML=`<div class="empty-original"><h3>Kein Originalbeleg gespeichert</h3><p>Für dieses Dokument ist nur der erkannte Text vorhanden. Du kannst den Originalbeleg jetzt nachträglich hinzufügen.</p><label class="file-label">Original hinzufügen<input id="reviewReplaceMissing" type="file" accept=".pdf,image/*" multiple></label></div>`;
   box.querySelector("#reviewReplaceMissing").onchange=e=>replaceOriginal(e.target.files);return;
  }
  current.originalStored=true;pageIndex=Math.min(pageIndex,pkg.files.length-1);
  clearUrls();pkg.files.forEach(f=>urls.push(URL.createObjectURL(f.blob)));
  const files=pkg.files;
  const thumbs=files.map((f,i)=>`<button class="original-thumb ${i===pageIndex?"active":""}" data-page="${i}"><span>${i+1}</span><small>${esc(f.name)}</small></button>`).join("");
  box.innerHTML=`<div class="original-toolbar">
    <button id="origPrev" ${pageIndex===0?"disabled":""}>← Vorherige</button><span>Seite/Datei ${pageIndex+1} von ${files.length}</span><button id="origNext" ${pageIndex===files.length-1?"disabled":""}>Nächste →</button>
    <button id="zoomOut">−</button><span>${Math.round(zoom*100)}%</span><button id="zoomIn">+</button><button id="zoomReset">Einpassen</button>
    <button id="downloadOriginal" class="secondary">Original speichern</button><label class="file-label compact">Original ersetzen<input id="replaceOriginal" type="file" accept=".pdf,image/*" multiple></label>
   </div><div class="original-layout"><aside class="original-thumbs">${thumbs}</aside><div id="originalStage" class="original-stage"></div></div>`;
  const f=files[pageIndex],url=urls[pageIndex],stage=box.querySelector("#originalStage");
  if((f.type||"").includes("pdf")||String(f.name).toLowerCase().endsWith(".pdf")){
   stage.innerHTML=`<iframe class="pdf-frame" src="${url}#toolbar=1&navpanes=0&view=FitH" title="Original-PDF"></iframe><p class="pdf-fallback">Wird das PDF nicht angezeigt, nutze „Original speichern“ und öffne es mit deinem PDF-Programm.</p>`;
  }else if((f.type||"").startsWith("image/")){
   stage.innerHTML=`<div class="image-pan"><img src="${url}" alt="Originalbeleg" style="transform:scale(${zoom})"></div>`;
  }else stage.innerHTML=`<div class="empty-original">Dieses Dateiformat kann nicht direkt angezeigt werden.</div>`;
  box.querySelector("#origPrev").onclick=()=>{pageIndex--;renderOriginal()};
  box.querySelector("#origNext").onclick=()=>{pageIndex++;renderOriginal()};
  box.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{pageIndex=Number(b.dataset.page);renderOriginal()});
  box.querySelector("#zoomOut").onclick=()=>{zoom=Math.max(.4,zoom-.2);renderOriginal()};
  box.querySelector("#zoomIn").onclick=()=>{zoom=Math.min(3,zoom+.2);renderOriginal()};
  box.querySelector("#zoomReset").onclick=()=>{zoom=1;renderOriginal()};
  box.querySelector("#downloadOriginal").onclick=()=>downloadFile(f.blob,f.name);
  box.querySelector("#replaceOriginal").onchange=e=>replaceOriginal(e.target.files);
 }
 async function replaceOriginal(fileList){
  const files=[...fileList];if(!files.length)return;
  if(!confirm("Den gespeicherten Originalbeleg ersetzen? Die erkannten Daten bleiben erhalten."))return;
  await GAStorage.putOriginalPackage(current.id,files);
  current.originalStored=true;current.originalFilesMeta=files.map((f,i)=>({index:i,name:f.name,type:f.type,size:f.size,lastModified:f.lastModified}));
  current.originalReplacedAt=new Date().toISOString();current.manualChanges=(current.manualChanges||0)+1;
  callbacks.onSave?.(current);pageIndex=0;zoom=1;await renderOriginal();renderHeader();
  window.GAUI?.toast("Originalbeleg wurde ersetzt. Die erkannten Daten blieben erhalten.")
 }
 function downloadFile(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name||"Original";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
 function listField(title,key,items){
  const arr=Array.isArray(items)?items:[];
  return `<div class="review-field"><div class="review-field-head"><b>${esc(title)}</b><span class="field-confidence">${Math.round((current.confidence||.3)*100)}%</span></div>
   <textarea data-field="${key}" rows="${Math.max(2,Math.min(6,arr.length+1))}">${esc(arr.join("\n"))}</textarea>
   <div class="field-source">Quelle: erkannter Dokumenttext${current.pageCount?` · ${current.pageCount} Seite(n)`:""}</div></div>`
 }
 function choiceInput(key,value,catalog){const inputId=`review-${key}`;return `<div class="flex-choice">${GAChoices.select(catalog,value||"",`data-flex-target="${inputId}" data-catalog="${catalog}"`)}<input id="${inputId}" data-field="${key}" value="${esc(value||"")}" placeholder="Eigenen Eintrag eingeben" hidden></div>`}
 function regionInput(items){return `<div class="review-field"><div class="review-field-head"><b>Körperbereich / Körperregion</b><span class="field-confidence">${Math.round((current.confidence||.3)*100)}%</span></div>${GAChoices.select("bodyRegionOptions","",`data-region-target="review-bodyRegions"`)}<input id="review-bodyRegions" data-field="bodyRegions" value="${esc((items||[]).join("; "))}" placeholder="Mehrere Bereiche mit Semikolon trennen oder eigenen Begriff eintragen"><div class="field-source">Alphabetische Auswahlliste; mehrere Bereiche können nacheinander ergänzt werden.</div></div>`}
 function renderData(){
  const box=document.getElementById("rpanel-data");
  box.innerHTML=`<div class="review-data-grid">
   <div class="review-form">
    <h3>Dokumentdaten prüfen</h3>
    <div class="edit-grid">
     <div class="wide"><label>Dokumentname</label><input id="reviewDocumentName" data-field="name" value="${esc(GAChoices.normalizeName(current.name,current.date,current.mime||""))}"><div class="small">Vorgabe: JJJJMMTT_Beschreibung, zum Beispiel 20231001_Hautarztbericht.pdf. Die Dateiendung bleibt automatisch erhalten.</div></div>
     <div><label>Datum</label><input data-field="date" type="date" value="${esc(current.date||"")}"></div>
     <div><label>Dokumentart</label>${choiceInput("type",current.type,"documentTypeOptions")}</div>
     <div><label>Hauptrubrik</label>${choiceInput("rubric",current.rubric,"rubricOptions")}</div>
     <div><label>Erstellendes Fachgebiet</label>${choiceInput("creatorSpecialty",current.creatorSpecialty,"specialtyOptions")}</div>
     <div><label>Medizinisches Themengebiet</label>${choiceInput("topicSpecialty",current.topicSpecialty||current.specialty,"specialtyOptions")}</div>
     <div><label>Körperseite</label><select data-field="laterality">${GAChoices.catalogs.lateralityOptions.map(x=>`<option${x===(current.laterality||"ohne Seitenangabe")?" selected":""}>${x}</option>`).join("")}</select></div>
     <div><label>Arzt / Behandler</label><input data-field="doctor" value="${esc(current.doctor||"")}"></div>
    </div>
    ${regionInput(current.bodyRegions)}
    ${listField("Diagnosen / Befunde","diagnoses",current.diagnoses)}
    ${listField("Medikamente","medications",current.medications)}
    ${listField("Empfehlungen / Kontrollen","recommendations",current.recommendations)}
    <label>Prüfstatus</label><select id="reviewStatus"><option value="unreviewed">🔴 Ungeprüft</option><option value="partial">🟡 Teilweise geprüft</option><option value="reviewed">🟢 Geprüft</option><option value="uncertain">⚠ OCR unsicher</option></select>
    <label class="learn-check"><input id="reviewUncertain" type="checkbox"${current.hasUncertainOCR?" checked":""}> Dieses Dokument enthält unsichere OCR-Stellen</label>
    <div class="actions"><button id="saveReview" class="secondary">Korrekturen zwischenspeichern</button><button id="markReviewed" class="secondary">Als geprüft markieren</button>${callbacks.pending?'<button id="finalizeReview" class="primary">Geprüft und endgültig unter Dokumente speichern</button>':""}</div><p class="small review-save-hint">${callbacks.pending?"Der grüne Knopf speichert den Import endgültig und öffnet anschließend automatisch den Bereich „Dokumente“.":"Die Änderung wird sofort im gespeicherten Dokument übernommen."}</p>
   </div>
   <aside class="quality-card"><h3>Qualitätsbewertung</h3>${qualityHtml(current)}<p class="small">Die Bewertung ist eine technische Orientierung. Sie ersetzt nicht den Vergleich mit dem Original.</p></aside>
  </div>`;
  GAChoices.bind(box);box.querySelector("#reviewDocumentName")?.addEventListener("blur",e=>e.target.value=GAChoices.normalizeName(e.target.value,box.querySelector('[data-field="date"]')?.value,current.mime||""));
  box.querySelector("#reviewStatus").value=current.reviewStatus||"unreviewed";
  box.querySelector("#saveReview").onclick=()=>saveData(false);
  box.querySelector("#markReviewed").onclick=()=>{box.querySelector("#reviewStatus").value="reviewed";saveData(true)};
  const finalize=box.querySelector("#finalizeReview");
  if(finalize)finalize.onclick=()=>{box.querySelector("#reviewStatus").value="reviewed";saveData(true,false);callbacks.onFinalize?.(current)};
 }
 function saveData(markAll,rerender=true){
  const box=document.getElementById("rpanel-data"),changed=[];
  box.querySelectorAll("[data-field]").forEach(el=>{
   const key=el.dataset.field,old=JSON.stringify(current[key]??null);
   let value=el.value;
   if(["bodyRegions","diagnoses","medications","recommendations"].includes(key))value=value.split(/\n|;/).map(x=>x.trim()).filter(Boolean);
   current[key]=value;
   if(key==="topicSpecialty")current.specialty=value;
   if(JSON.stringify(value)!==old)changed.push(key)
  });
  current.name=GAChoices.normalizeName(current.name,current.date,current.mime||current.originalFilesMeta?.[0]?.type||"");
  current.reviewStatus=box.querySelector("#reviewStatus").value;
  current.hasUncertainOCR=box.querySelector("#reviewUncertain").checked;
  current.reviewedAt=new Date().toISOString();current.manualChanges=(current.manualChanges||0)+changed.length;
  current.reviewHistory=current.reviewHistory||[];
  current.reviewHistory.push({at:current.reviewedAt,fields:changed,status:current.reviewStatus});
  if(markAll)current.fieldReview={all:"reviewed"};
  callbacks.onSave?.(current);if(rerender){renderHeader();renderAnalysis();renderData()}
  window.GAUI?.toast(callbacks.pending?(rerender?"Korrekturen zwischengespeichert. Für den endgültigen Abschluss den grünen Speicherknopf drücken.":"Dokument wird endgültig gespeichert."):(changed.length?`${changed.length} Korrektur(en) gespeichert.`:"Prüfstatus gespeichert."))
 }
 function qualityHtml(d){const q=quality(d);return `<div class="quality-meter"><span>OCR-Qualität</span><b>${q.ocr}%</b><i><em style="width:${q.ocr}%"></em></i></div><div class="quality-meter"><span>Vollständigkeit</span><b>${q.completeness}%</b><i><em style="width:${q.completeness}%"></em></i></div><div class="quality-meter"><span>Gesamtqualität</span><b>${q.overall}%</b><i><em style="width:${q.overall}%"></em></i></div>`}
 function renderOCR(){
  const raw=current.ocrRawText||current.text||"",clean=current.cleanedText||current.text||"";
  document.getElementById("rpanel-ocr").innerHTML=`<div class="ocr-columns"><article><h3>OCR-Rohtext</h3><p class="small">Unverändertes Ergebnis der Texterkennung.</p><pre class="ocr-text">${esc(raw)}</pre></article><article><h3>Bereinigter Text</h3><p class="small">Für die automatische Auswertung verwendete Fassung.</p><textarea id="cleanedOcrEditor">${esc(clean)}</textarea><div class="actions"><button id="saveCleanedText" class="primary">Bereinigten Text speichern und neu auswerten</button></div></article></div>`;
  document.getElementById("saveCleanedText").onclick=()=>{
   const value=document.getElementById("cleanedOcrEditor").value.trim();if(!value)return;
   current.cleanedText=value;current.text=value;current.manualChanges=(current.manualChanges||0)+1;
   const fresh=GAExtract.document(value,current.name,current.mime,current.size);
   ["type","rubric","mainRubric","specialty","creatorSpecialty","topicSpecialty","bodyRegions","laterality","diagnoses","medications","recommendations","costs","labValues","measurements","specialtyData","keyStatements","confidence"].forEach(k=>current[k]=fresh[k]);
   current.reviewStatus="partial";callbacks.onSave?.(current);renderAll();showPanel("ocr");window.GAUI?.toast("Bereinigter Text gespeichert und Dokument neu ausgewertet.")
  }
 }
 function section(title,content,kind=""){
  const body=Array.isArray(content)?content.filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join(""):esc(content||"");
  if(!body)return"";
  return `<details class="analysis-card ${kind}" open><summary>${esc(title)}</summary>${Array.isArray(content)?`<ul>${body}</ul>`:`<p>${body}</p>`}</details>`
 }
 function renderAnalysis(){
  const d=current,q=quality(d),facts=[
   `${d.type||"Dokument"} vom ${date(d.date)}`,
   `Hauptrubrik: ${d.rubric||"nicht zugeordnet"}`,
   `Themengebiet: ${d.topicSpecialty||d.specialty||"nicht zugeordnet"}`,
   ...(d.bodyRegions||[]).map(x=>`Körperregion: ${x}${d.laterality&&d.laterality!=="ohne Seitenangabe"?` (${d.laterality})`:""}`)
  ];
  const values=[...(d.labValues||[]).map(v=>`${v.name}: ${v.value} ${v.unit||""}`),...(d.measurements||[]).map(v=>`${v.label}: ${v.value} ${v.unit||""} (${v.valueType||"Messwert"})`)];
  const questions=["Welche der erkannten Angaben sind medizinisch besonders wichtig?","Welche Behandlung oder Kontrolle wird empfohlen?","Welche Warnzeichen sollten zu einer früheren Vorstellung führen?"];
  if(d.topicSpecialty?.includes("Orthopädie"))questions.unshift("Welche Befunde erklären die Beschwerden und welche Therapie ist zunächst sinnvoll?");
  const uncertain=[];
  if(q.ocr<65||d.hasUncertainOCR)uncertain.push("Die OCR-Qualität ist eingeschränkt. Bitte den Originalbeleg sorgfältig vergleichen.");
  if((d.confidence||0)<.65)uncertain.push("Die automatische medizinische Zuordnung ist nicht eindeutig.");
  if(!(d.diagnoses||[]).length)uncertain.push("Keine Diagnose wurde sicher erkannt.");
  const summary=(d.keyStatements||[]).slice(0,4);
  document.getElementById("rpanel-analysis").innerHTML=`<div class="analysis-intro"><h3>Strukturierte Dokumentanalyse</h3><p>Dokumentierte Fakten, allgemeine Orientierung und Unsicherheiten werden bewusst getrennt dargestellt.</p></div>
   ${section("Dokumentübersicht",facts)}
   ${section("Kurzfassung",summary.length?summary:["Der erkannte Text enthält noch keine ausreichend klaren Kernaussagen."])}
   ${section("Gesicherte Angaben",[...(d.diagnoses||[]),...(d.recommendations||[])])}
   ${section("Erkannte Messwerte",values)}
   ${section("Medikamente",d.medications||[])}
   ${section("Empfehlungen aus dem Dokument",d.recommendations||[])}
   ${section("Allgemeine medizinische Einordnung",["Die Bedeutung eines Befunds hängt von Beschwerden, Untersuchung, Vorgeschichte und Verlauf ab. Automatisch erkannte Angaben sollten mit dem Original und der behandelnden Praxis abgeglichen werden."])}
   ${section("Fragen für den Arzt",questions)}
   ${section("Unsichere Erkennungen",uncertain,"warning")}
   <div class="quality-card">${qualityHtml(d)}</div>`;
 }
 function renderHeader(){
  document.getElementById("reviewTitle").textContent=current.name||"Dokument prüfen";
  document.getElementById("reviewMeta").textContent=`${date(current.date)} · ${current.type||"Dokument"} · ${current.topicSpecialty||current.specialty||"nicht zugeordnet"}`;
  document.getElementById("reviewStatusbar").innerHTML=statusInfo(current)
 }
 function renderAll(){renderHeader();renderOriginal();renderData();renderOCR();renderAnalysis()}
 async function open(doc,opts={}){
  ensure();current=doc;callbacks=opts;pageIndex=0;zoom=1;
  document.getElementById("reviewWorkspace").classList.add("show");renderAll();showPanel(opts.panel||"original")
 }
 return {open,close};
})();