window.GAImporter=(()=>{
 const scripts={};
 function step(text,status=""){const li=document.createElement("li");li.textContent=text;if(status)li.className=status;document.getElementById("importSteps").appendChild(li)}
 function reset(){document.getElementById("importSteps").innerHTML=""}
 function loadScript(url,key){if(scripts[key])return scripts[key];scripts[key]=new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error(`${key} konnte nicht geladen werden`));document.head.appendChild(s)});return scripts[key]}
 async function imageText(file){
  step("OCR-Bibliothek wird geladen …");
  if(!window.Tesseract)await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js","OCR");
  step("Texterkennung läuft …");
  const r=await Tesseract.recognize(file,"deu+eng");return r.data.text||""
 }
 async function pdfText(file){
  step("PDF-Bibliothek wird geladen …");
  if(!window.pdfjsLib)await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","PDF.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const data=await file.arrayBuffer(),pdf=await window.pdfjsLib.getDocument({data}).promise;let text="";
  step(`PDF geöffnet: ${pdf.numPages} Seite(n).`,"ok");
  for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),content=await page.getTextContent();text+=`\n--- Seite ${p} ---\n`+content.items.map(i=>i.str).join(" ")}
  if(text.replace(/\W/g,"").length<30)throw new Error("Das PDF enthält keinen auslesbaren Text. Bitte Seiten als Fotos importieren oder Text manuell einfügen.");
  return text
 }
 async function read(file){if(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf"))return pdfText(file);if(file.type.startsWith("image/"))return imageText(file);return file.text()}
 async function hash(file){const h=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
 async function process(files,bundle=false){
  reset();step(`${files.length} Datei(en) ausgewählt.`,"ok");
  const groups=bundle?[files]:files.map(f=>[f]),docs=[];
  for(const group of groups){
   try{
    let parts=[],hashes=[];
    for(const file of group){step(`${file.name} wird gelesen …`);parts.push(await read(file));hashes.push(await hash(file));step(`${file.name}: Text erkannt.`,"ok")}
    const text=parts.join("\n"),name=group.length>1?`Mehrseitiger Bericht (${group.length} Dateien)`:group[0].name;
    const doc=GAExtract.document(text,name,group[0].type,group.reduce((s,f)=>s+f.size,0));doc.hash=hashes.join(":");doc._files=group;
    step(`Dokument erkannt: ${doc.type} · ${doc.specialty}.`,"ok");step(`${doc.labValues.length} Laborwerte erkannt.`,"ok");docs.push(doc)
   }catch(e){step(`Fehler: ${e.message}`,"error");window.GAUI.toast(e.message,"error")}
  }
  return docs
 }
 return {process,reset,step};
})();