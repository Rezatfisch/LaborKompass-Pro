(()=>{"use strict";
 const state=GAStorage.load();let mode="simple",pending={};
 const $=id=>document.getElementById(id);
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
 function updatePendingFromForm(id){
  const d=pending[id];if(!d)return null;
  const val=suffix=>document.getElementById(`${suffix}-${id}`)?.value??"";
  d.name=val("pname").trim()||d.name;d.date=val("pdate")||d.date;d.type=val("ptype").trim()||d.type;
  d.specialty=val("pspecialty").trim()||"Noch nicht zugeordnet";d.rubric=val("prubric").trim()||"Sonstige";
  d.issuer=val("pissuer").trim();d.doctor=val("pdoctor").trim();d.bodyRegions=textList(val("pregions"));
  d.diagnoses=textList(val("pdiagnoses"));d.medications=textList(val("pmedications"));d.recommendations=textList(val("precommendations"));
  d.manualClassification=true;
  return d
 }
 function structuredSummary(doc){
  const chips=(doc.bodyRegions||[]).map(x=>`<span class="chip">${GAUI.esc(x)}</span>`).join("");
  const source=(doc.sourceNames||[doc.name]).map(x=>`<li>${GAUI.esc(x)}</li>`).join("");
  const diag=(doc.diagnoses||[]).map(x=>`<span class="chip">${GAUI.esc(x)}</span>`).join("")||"<span class='small'>Keine eindeutige Diagnose erkannt</span>";
  const values=[...(doc.labValues||[]).map(v=>`${v.name}: ${v.value} ${v.unit}`),...(doc.measurements||[]).map(v=>`${v.label}: ${v.value} ${v.unit}`)];
  const costs=(doc.costs||[]).map(v=>`${v.label}: ${v.value.toFixed?.(2)??v.value} ${v.unit||"€"}`);
  return `<div class="field-group"><h4>Erkannte Zuordnung</h4><div class="chip-list">${chips||"<span class='small'>Keine Körperregion sicher erkannt</span>"}</div></div>
  <div class="field-group"><h4>Diagnosen und wichtige Begriffe</h4><div class="chip-list">${diag}</div></div>
  <div class="field-group"><h4>Erkannte Werte</h4>${values.length?`<ul class="source-list">${values.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul>`:"<p class='small'>Keine Messwerte sicher erkannt.</p>"}</div>
  <div class="field-group"><h4>Kosten</h4>${costs.length?`<ul class="source-list">${costs.map(x=>`<li>${GAUI.esc(x)}</li>`).join("")}</ul>`:"<p class='small'>Keine Kostenangaben erkannt.</p>"}</div>
  <details><summary>Quelldateien und erkannter Originaltext</summary><ul class="source-list">${source}</ul><div class="compact-text">${GAUI.esc(doc.text||"")}</div></details>`
 }
 async function saveDoc(id,asCopy=false){
  let doc=updatePendingFromForm(id);if(!doc)return;
  const dup=duplicate(doc);
  if(dup&&!asCopy)return GAUI.toast("Dokument ist bereits vorhanden. Bitte Ersetzen oder als Kopie speichern.","error");
  if(asCopy)doc={...doc,id:GAExtract.uid(),name:doc.name+" (Kopie)"};
  state.documents.push(doc);
  const n=$("takeLabs").checked?integrateLabs(doc):0;
  if($("saveOriginal").checked&&doc._files?.[0])try{await GAStorage.putOriginal(doc.id,doc._files[0]);doc.originalStored=true}catch(e){GAUI.toast("Dokument gespeichert, Original konnte nicht separat gespeichert werden.","error")}
  delete doc._files;delete pending[id];save();render();renderPendingCards();GAUI.toast(`Dokument gespeichert. ${n} neue Laborwerte übernommen.`)
 }
 async function replaceDoc(pid,did){
  const doc=updatePendingFromForm(pid),i=state.documents.findIndex(x=>x.id===did);if(!doc||i<0)return;
  doc.id=did;state.documents[i]=doc;integrateLabs(doc);delete doc._files;delete pending[pid];save();render();renderPendingCards();GAUI.toast("Vorhandenes Dokument ersetzt.")
 }
 function preview(doc){
  pending[doc.id]=doc;const dup=duplicate(doc),pct=Math.round((doc.confidence||.3)*100);
  const stateTag=dup?`<span class="tag duplicate">bereits ähnlich vorhanden</span>`:`<span class="tag new">neu</span>`;
  const uncertain=pct<60?`<span class="tag uncertain">Zuordnung kontrollieren</span>`:"";
  return `<details class="item import-card" id="preview-${doc.id}">
   <summary><div><div class="import-title">${GAUI.esc(doc.name)}</div><div class="import-status">${stateTag}${uncertain}<span class="tag">${GAUI.date(doc.date)}</span><span class="tag">${GAUI.esc(doc.specialty)}</span></div></div><span>▼</span></summary>
   <div class="import-body">
    <div class="small">Erkennungssicherheit: ${pct}%</div><div class="confidence"><i style="width:${pct}%"></i></div>
    ${pct<60?`<div class="review-warning">Die automatische Zuordnung ist unsicher. Bitte Fachgebiet, Dokumentart und Körperregion kontrollieren.</div>`:""}
    <div class="field-group"><h4>Grunddaten kontrollieren</h4>
     <div class="edit-grid">
      <div class="wide"><label>Dokumentname</label><input id="pname-${doc.id}" value="${GAUI.esc(doc.name)}"></div>
      <div><label>Dokumentdatum</label><input id="pdate-${doc.id}" type="date" value="${doc.date||""}"></div>
      <div><label>Dokumentart</label><input id="ptype-${doc.id}" value="${GAUI.esc(doc.type)}"></div>
      <div><label>Fachgebiet</label><input id="pspecialty-${doc.id}" list="specialtyOptions" value="${GAUI.esc(doc.specialty)}"></div>
      <div><label>Rubrik</label><input id="prubric-${doc.id}" value="${GAUI.esc(doc.rubric)}"></div>
      <div><label>Aussteller / Praxis</label><input id="pissuer-${doc.id}" value="${GAUI.esc(doc.issuer||"")}"></div>
      <div><label>Arzt / Behandler</label><input id="pdoctor-${doc.id}" value="${GAUI.esc(doc.doctor||"")}"></div>
      <div class="wide"><label>Körperregionen – mit Semikolon trennen</label><input id="pregions-${doc.id}" value="${GAUI.esc((doc.bodyRegions||[]).join("; "))}"></div>
     </div>
    </div>
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
  const docs=Object.values(pending);box.innerHTML=docs.length?docs.map(preview).join(""):"<p class='small'>Keine vorbereiteten Dokumente.</p>";updatePendingCount()
 } function render(){
  $("metricDocuments").textContent=state.documents.length;$("metricLabs").textContent=state.values.length;$("metricSpecialties").textContent=state.documents.filter(isSpecial).length;$("metricAbnormal").textContent=state.values.filter(abnormal).length;
  $("dashboardSummary").innerHTML=`<p><b>${state.documents.length}</b> Dokumente und <b>${state.values.length}</b> Laborwerte sind lokal gespeichert.</p>`;
  const recent=[...state.documents].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);$("recentItems").innerHTML=recent.map(d=>`<div class="item"><b>${GAUI.date(d.date)} · ${GAUI.esc(d.name)}</b><div class="small">${GAUI.esc(d.specialty)}</div></div>`).join("")||"<p>Noch keine Einträge.</p>";
  renderDocuments();renderSpecialties();renderLabs();renderTimeline();renderAnalysisSelect();
 }
 function renderDocuments(){
  const q=$("documentSearch").value.toLowerCase(),f=$("documentFilter").value,rubs=[...new Set(state.documents.map(d=>d.rubric))].sort(),cur=f;
  $("documentFilter").innerHTML='<option value="all">Alle Rubriken</option>'+rubs.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(rubs.includes(cur))$("documentFilter").value=cur;
  const arr=[...state.documents].filter(d=>(f==="all"||d.rubric===f)&&`${d.name} ${d.text} ${d.specialty} ${(d.diagnoses||[]).join(" ")}`.toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("documentList").innerHTML=arr.map(d=>`<details class="item import-card"><summary><div><div class="import-title">${GAUI.esc(d.name)}</div><div class="import-status"><span class="tag">${GAUI.date(d.date)}</span><span class="tag">${GAUI.esc(d.rubric)}</span><span class="tag">${GAUI.esc(d.specialty)}</span>${d.originalStored?'<span class="tag new">Original gespeichert</span>':""}</div></div><span>▼</span></summary><div class="import-body">${structuredSummary(d)}${GAUI.specialHtml(d.specialtyData)}<details><summary>Verständliche Auswertung</summary><pre class="output">${GAUI.esc(GAUI.analysis(d,mode))}</pre></details><div class="actions"><button onclick="GAApp.analyse('${d.id}')">Analysieren</button><button onclick="GAApp.share('${d.id}')">Teilen</button><button onclick="GAApp.remove('${d.id}')">Nur Dokument entfernen</button></div></div></details>`).join("")||"<article class='card'>Keine Dokumente gefunden.</article>";
 } function renderSpecialties(){
  const q=$("specialtySearch").value.toLowerCase(),f=$("specialtyFilter").value,docs=state.documents.filter(isSpecial),specs=[...new Set(docs.map(d=>d.specialty))].sort(),cur=f;$("specialtyFilter").innerHTML='<option value="all">Alle Fachgebiete</option>'+specs.map(x=>`<option>${GAUI.esc(x)}</option>`).join("");if(specs.includes(cur))$("specialtyFilter").value=cur;
  const arr=docs.filter(d=>(f==="all"||d.specialty===f)&&`${d.name} ${d.text} ${JSON.stringify(d.specialtyData)}`.toLowerCase().includes(q)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("specialtyList").innerHTML=arr.map(d=>`<div class="item"><h3>${GAUI.esc(d.name)}</h3><div class="meta">${GAUI.date(d.date)} · ${GAUI.esc(d.specialty)}</div>${GAUI.specialHtml(d.specialtyData)}${assignBox(d.id)}</div>`).join("")||"<article class='card'>Noch keine Fachbefunde. Neu auswerten oder manuell zuordnen.</article>";
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
  if(!document.getElementById("specialtyOptions")){const dl=document.createElement("datalist");dl.id="specialtyOptions";["Allgemeinmedizin","Augenheilkunde","Augenoptik","Zahnmedizin","Orthopädie / Unfallchirurgie","Neurologie","Urologie","Kardiologie","Radiologie","Hals-Nasen-Ohrenheilkunde","Dermatologie","Pneumologie","Gastroenterologie","Endokrinologie / Diabetologie","Psychologie / Psychiatrie","Chirurgie","Impfmedizin","Medikation","Abrechnung"].forEach(v=>{const o=document.createElement("option");o.value=v;dl.appendChild(o)});document.body.appendChild(dl)}

  $("tabs").onclick=e=>{const b=e.target.closest("button[data-page]");if(b)navigate(b.dataset.page)};
  $("fileInput").onchange=async e=>{const files=[...e.target.files];if(!files.length)return;const docs=await GAImporter.process(files,document.querySelector('input[name="bundleMode"]:checked').value==="bundle");docs.forEach(d=>pending[d.id]=d);renderPendingCards();e.target.value=""};
  $("manualAnalyse").onclick=()=>{const t=$("manualText").value.trim();if(!t)return GAUI.toast("Bitte Text einfügen.","error");const d=GAExtract.document(t,"Manuell eingefügtes Dokument","text/plain");pending[d.id]=d;renderPendingCards();GAUI.toast("Text analysiert – bitte Vorschau kontrollieren.")};
  $("clearImport").onclick=()=>{pending={};GAImporter.reset();GAImporter.step("Anzeige geleert. Bereit für neuen Import.");renderPendingCards();GAUI.toast("Importanzeige geleert.")};
  ["documentSearch","documentFilter"].forEach(id=>$(id).oninput=renderDocuments);["specialtySearch","specialtyFilter"].forEach(id=>$(id).oninput=renderSpecialties);["labSearch","labNameFilter"].forEach(id=>$(id).oninput=renderLabs);$("trendSelect").onchange=drawTrend;
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
 window.GAApp={saveDoc,replace:replaceDoc,discard:id=>{delete pending[id];renderPendingCards();GAUI.toast("Vorbereiteter Import verworfen.")},analyse:id=>{navigate("analysis");$("analysisDocument").value=id;$("runAnalysis").click()},share,remove:id=>{if(confirm("Nur das Dokument entfernen? Bereits übernommene Laborwerte bleiben erhalten.")){state.documents=state.documents.filter(x=>x.id!==id);save();render();GAUI.toast("Dokument aus dem Archiv entfernt.")}},removeLab:id=>{if(confirm("Diesen Laborwert löschen?")){state.values=state.values.filter(x=>x.id!==id);save();render();GAUI.toast("Laborwert gelöscht.")}},useReference:name=>{navigate("labs");const r=GALabRefs.find(name);$("newLabName").value=name;$("newLabUnit").value=r?.unit||"";$("newLabMin").value=r?.min??"";$("newLabMax").value=r?.max??"";$("newLabValue").focus();scrollTo(0,250)},assign:id=>{const d=state.documents.find(x=>x.id===id),v=$(`assign-${id}`).value;if(!d||!v)return;d.specialty=v;d.rubric=v==="Augenoptik"?"Optik / Brille":v==="Zahnmedizin"?"Zahnmedizin":v.split(" / ")[0];d.manualClassification=true;GAExtract.reanalyse(d);save();render();GAUI.toast("Fachgebiet zugeordnet.")}}; window.addEventListener("error",e=>GAUI.toast(`Programmfehler: ${e.message}`,"error"));window.addEventListener("unhandledrejection",e=>GAUI.toast(`Importfehler: ${e.reason?.message||e.reason}`,"error"));
 wire();state.documents.forEach(GAExtract.reanalyse);save();render();selfTest();GAUI.toast("Gesundheitsakte 3.2 wurde vollständig geladen.");
 if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js?v=3.2.0",{updateViaCache:"none"}).catch(console.warn);
})();