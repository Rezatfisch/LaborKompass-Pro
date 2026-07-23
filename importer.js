window.GAImporter=(()=>{
 const scripts={};
 function target(){return document.getElementById("importSteps")}
 function step(text,status="",detail=""){const li=document.createElement("li");li.textContent=text;if(status)li.className=status;if(detail)li.title=detail;target()?.appendChild(li)}
 function reset(){if(target())target().innerHTML=""}
 function loadScript(url,key){
  if(scripts[key])return scripts[key];
  scripts[key]=new Promise((resolve,reject)=>{
   const s=document.createElement("script");s.src=url;s.crossOrigin="anonymous";
   s.onload=resolve;s.onerror=()=>reject(new Error(`${key} konnte nicht aus dem Internet geladen werden`));
   document.head.appendChild(s)
  });
  return scripts[key]
 }
 async function ensureOCR(){
  if(!window.Tesseract){
   step("OCR-Bibliothek wird geladen …");
   await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js","OCR-Bibliothek")
  }
 }
 async function imageText(file,label=file.name){
  await ensureOCR();
  step(`${label}: Texterkennung läuft …`);
  const r=await Tesseract.recognize(file,"deu+eng",{
   logger:m=>{
    if(m.status==="recognizing text"&&Number.isFinite(m.progress)){
     const p=Math.round(m.progress*100);
     const el=target()?.lastElementChild;
     if(el&&p%10===0)el.textContent=`${label}: Texterkennung ${p}% …`
    }
   }
  });
  const text=r.data.text||"";
  if(text.replace(/\W/g,"").length<15)throw new Error(`${label}: Es wurde zu wenig lesbarer Text erkannt`);
  step(`${label}: OCR erfolgreich abgeschlossen.`,"ok");
  return text
 }
 async function canvasToBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PDF-Seite konnte nicht als Bild erzeugt werden")),"image/jpeg",.92))
 }
 async function renderPdfPage(page,pageNumber,total){
  const base=page.getViewport({scale:1}),maxWidth=1800;
  const scale=Math.min(2.2,Math.max(1.45,maxWidth/base.width));
  const viewport=page.getViewport({scale});
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{alpha:false});
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  step(`Scan-PDF: Seite ${pageNumber}/${total} wird für OCR vorbereitet …`);
  await page.render({canvasContext:ctx,viewport}).promise;
  const blob=await canvasToBlob(canvas);
  canvas.width=1;canvas.height=1;
  return blob
 }
 async function ocrPdf(pdf,fileName){
  await ensureOCR();
  let text="";
  step(`Scan-PDF erkannt. ${pdf.numPages} Seite(n) werden automatisch per OCR gelesen.`,"ok");
  for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p);
   const blob=await renderPdfPage(page,p,pdf.numPages);
   const pageText=await imageText(blob,`${fileName} – Seite ${p}/${pdf.numPages}`);
   text+=`\n--- OCR Seite ${p} ---\n${pageText}\n`;
   page.cleanup?.()
  }
  return text
 }
 function meaningfulText(text){
  const cleaned=String(text||"").replace(/\s+/g," ").replace(/[|_–—-]/g,"").trim();
  const letters=(cleaned.match(/[A-Za-zÄÖÜäöüß]/g)||[]).length;
  return cleaned.length>=45&&letters>=25
 }
 async function pdfText(file){
  step(`${file.name}: PDF-Bibliothek wird vorbereitet …`);
  if(!window.pdfjsLib)await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","PDF-Bibliothek");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const data=await file.arrayBuffer(),pdf=await window.pdfjsLib.getDocument({data}).promise;let text="";
  step(`${file.name}: PDF mit ${pdf.numPages} Seite(n) geöffnet.`,"ok");
  for(let p=1;p<=pdf.numPages;p++){
   step(`${file.name}: Seite ${p}/${pdf.numPages} wird auf eingebetteten Text geprüft …`);
   const page=await pdf.getPage(p),content=await page.getTextContent();
   text+=`\n--- Seite ${p} ---\n`+content.items.map(i=>i.str).join(" ");
   page.cleanup?.()
  }
  if(meaningfulText(text)){
   step(`${file.name}: Direkt auslesbarer PDF-Text gefunden.`,"ok");
   return text
  }
  step(`${file.name}: Kein ausreichender eingebetteter Text – automatische OCR wird gestartet.`,"ok");
  const ocrText=await ocrPdf(pdf,file.name);
  if(!meaningfulText(ocrText))throw new Error("Auch die automatische OCR konnte keinen ausreichend lesbaren Text erkennen");
  step(`${file.name}: Scan-PDF vollständig erkannt.`,"ok");
  return ocrText
 }
 async function read(file){
  if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf"))return pdfText(file);
  if(file.type.startsWith("image/"))return imageText(file,file.name);
  if(file.size>8_000_000)throw new Error("Textdatei ist größer als 8 MB");
  return file.text()
 }
 async function hash(file){
  const h=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
  return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")
 }
 async function process(files,bundle=false){
  reset();step(`${files.length} Datei(en) ausgewählt.`,"ok");
  const groups=bundle?[files]:files.map(f=>[f]),docs=[];
  for(let gi=0;gi<groups.length;gi++){
   const group=groups[gi];step(`Dokument ${gi+1}/${groups.length} wird verarbeitet.`);
   try{
    const parts=[],hashes=[];
    for(const file of group){
     step(`${file.name}: Datei wird geöffnet …`);
     parts.push(await read(file));hashes.push(await hash(file));
     step(`${file.name}: Text erfolgreich erkannt.`,"ok")
    }
    const rawText=parts.map((x,i)=>group.length>1?`\n--- DATEI/SEITE ${i+1}: ${group[i].name} ---\n${x}`:x).join("\n");
    const cleanedText=rawText.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").replace(/([A-Za-zÄÖÜäöüß])\s+-\s*\n\s*([A-Za-zÄÖÜäöüß])/g,"$1$2").trim();
    const name=group.length>1?`Mehrseitiges Dokument (${group.length} Dateien)`:group[0].name;
    const doc=GAExtract.document(cleanedText,name,group[0].type,group.reduce((s,f)=>s+f.size,0));
    doc.ocrRawText=rawText;doc.cleanedText=cleanedText;doc.ocrMethod=/--- OCR Seite/.test(rawText)?"OCR":"Direkttext";
    doc.hash=hashes.join(":");doc.sourceNames=group.map(f=>f.name);doc.pageCount=group.length;
    doc.originalFilesMeta=group.map((f,i)=>({index:i,name:f.name,type:f.type,size:f.size,lastModified:f.lastModified}));
    doc._files=group;doc.reviewStatus="unreviewed";doc.fieldReview={};doc.manualChanges=0;
    step(`Erkannt: ${doc.type} · ${doc.specialty}.`,"ok");
    step(`${doc.bodyRegions.length} Körperregion(en), ${doc.diagnoses.length} Diagnose(n), ${doc.labValues.length+doc.measurements.length} Wert(e), ${doc.costs.length} Kostenangabe(n).`,"ok");
    step(`${name}: Vorschau bereit – bitte kontrollieren.`,"ok");docs.push(doc)
   }catch(e){
    step(`${group.map(f=>f.name).join(", ")}: ${e.message}`,"error");
    window.GAUI?.toast(`Import fehlgeschlagen: ${e.message}`,"error")
   }
  }
  step(`Importvorbereitung beendet: ${docs.length} Dokument(e) bereit.`,docs.length?"ok":"error");
  return docs
 }
 return {process,reset,step};
})();