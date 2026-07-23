window.GAImporter=(()=>{
 const scripts={};
 function target(){return document.getElementById("importSteps")}
 function step(text,status="",detail=""){const li=document.createElement("li");li.textContent=text;if(status)li.className=status;if(detail)li.title=detail;target()?.appendChild(li)}
 function reset(){if(target())target().innerHTML=""}
 function loadScript(url,key){
  if(scripts[key])return scripts[key];
  scripts[key]=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=url;s.crossOrigin="anonymous";s.onload=resolve;s.onerror=()=>reject(new Error(`${key} konnte nicht aus dem Internet geladen werden`));document.head.appendChild(s)});
  return scripts[key]
 }
 async function imageText(file){
  step(`${file.name}: OCR wird vorbereitet …`);
  if(!window.Tesseract)await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js","OCR-Bibliothek");
  step(`${file.name}: Texterkennung läuft …`);
  const r=await Tesseract.recognize(file,"deu+eng",{logger:m=>{if(m.status==="recognizing text"&&m.progress>0.95)step(`${file.name}: OCR fast abgeschlossen.`)}});
  const text=r.data.text||"";if(text.replace(/\W/g,"").length<15)throw new Error("Auf dem Bild wurde zu wenig lesbarer Text erkannt");
  return text
 }
 async function pdfText(file){
  step(`${file.name}: PDF-Bibliothek wird vorbereitet …`);
  if(!window.pdfjsLib)await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","PDF-Bibliothek");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const data=await file.arrayBuffer(),pdf=await window.pdfjsLib.getDocument({data}).promise;let text="";
  step(`${file.name}: PDF mit ${pdf.numPages} Seite(n) geöffnet.`,"ok");
  for(let p=1;p<=pdf.numPages;p++){step(`${file.name}: Seite ${p}/${pdf.numPages} wird gelesen …`);const page=await pdf.getPage(p),content=await page.getTextContent();text+=`\n--- Seite ${p} ---\n`+content.items.map(i=>i.str).join(" ")}
  if(text.replace(/\W/g,"").length<30)throw new Error("Das PDF enthält keinen direkt auslesbaren Text. Bitte als Bilder/Fotos importieren.");
  return text
 }
 async function read(file){
  if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf"))return pdfText(file);
  if(file.type.startsWith("image/"))return imageText(file);
  if(file.size>8_000_000)throw new Error("Textdatei ist größer als 8 MB");
  return file.text()
 }
 async function hash(file){const h=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
 async function process(files,bundle=false){
  reset();step(`${files.length} Datei(en) ausgewählt.`,"ok");
  const groups=bundle?[files]:files.map(f=>[f]),docs=[];
  for(let gi=0;gi<groups.length;gi++){
   const group=groups[gi];step(`Dokument ${gi+1}/${groups.length} wird verarbeitet.`);
   try{
    const parts=[],hashes=[];
    for(const file of group){
     step(`${file.name}: Datei wird geöffnet …`);
     parts.push(await read(file));hashes.push(await hash(file));step(`${file.name}: Text erfolgreich erkannt.`,"ok")
    }
    const text=parts.map((x,i)=>group.length>1?`\n--- DATEI/SEITE ${i+1}: ${group[i].name} ---\n${x}`:x).join("\n");
    const name=group.length>1?`Mehrseitiges Dokument (${group.length} Dateien)`:group[0].name;
    const doc=GAExtract.document(text,name,group[0].type,group.reduce((s,f)=>s+f.size,0));
    doc.hash=hashes.join(":");doc.sourceNames=group.map(f=>f.name);doc.pageCount=group.length;doc._files=group;
    step(`Erkannt: ${doc.type} · ${doc.specialty}.`,"ok");
    step(`${doc.bodyRegions.length} Körperregion(en), ${doc.diagnoses.length} Diagnose(n), ${doc.labValues.length+doc.measurements.length} Wert(e), ${doc.costs.length} Kostenangabe(n).`,"ok");
    step(`${name}: Vorschau bereit – bitte kontrollieren.`,"ok");docs.push(doc)
   }catch(e){step(`${group.map(f=>f.name).join(", ")}: ${e.message}`,"error");window.GAUI?.toast(`Import fehlgeschlagen: ${e.message}`,"error")}
  }
  step(`Importvorbereitung beendet: ${docs.length} Dokument(e) bereit.` ,docs.length?"ok":"error");
  return docs
 }
 return {process,reset,step};
})();