window.GAUI=(()=>{
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=s=>{if(!s)return"ohne Datum";const [y,m,d]=s.split("-");return d&&m&&y?`${d}.${m}.${y}`:s};
 function toast(message,type="ok"){const t=document.getElementById("toast");t.textContent=message;t.className=`show ${type==="error"?"error":""}`;clearTimeout(t._timer);t._timer=setTimeout(()=>t.className="",4500)}
 function specialHtml(s){
  if(!GAExtract.hasSpecial(s))return `<p class="small">Noch keine Einzelwerte sicher erkannt.</p>`;
  if(s.kind==="eye"){const box=(title,o)=>`<div class="special-box"><b>${title}</b>${Object.entries(o||{}).map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")||"<p>Keine Werte</p>"}</div>`;return `<div class="special-grid">${box("Rechtes Auge",s.right)}${box("Linkes Auge",s.left)}${box("Hilfsmittel",s.aid)}${box("Kosten",s.costs)}</div>`}
  return `<div class="special-grid">${Object.entries(s).filter(([k])=>k!=="kind").map(([k,v])=>`<div class="special-box"><b>${esc(k)}</b><p>${esc(Array.isArray(v)?v.join(", "):JSON.stringify(v))}</p></div>`).join("")}</div>`
 }
 function analysis(doc,mode){
  const findings=doc.keyStatements||[],questions=["Welche Bedeutung hat der Befund für meine Beschwerden?","Welche Kontrolle ist wann sinnvoll?","Welche Warnzeichen erfordern eine frühere Vorstellung?"];
  if(/Auge|Optik/.test(doc.specialty))questions.unshift("Warum unterscheiden sich Visus und Sehstärke beider Augen?","Sollten Augeninnendruck, Netzhaut, Linse und Sehnerv kontrolliert werden?");
  if(/Zahn/.test(doc.specialty))questions.unshift("Welche Behandlung ist notwendig und welche optional?","Welche Alternativen unterscheiden sich bei Haltbarkeit und Kosten?");
  const sections=[];
  const add=(h,a)=>{if(a?.length)sections.push(h+"\n• "+a.join("\n• "))};
  if(mode==="compact"){sections.push(`KURZTEXT FÜR DAS ARZTGESPRÄCH\nIch möchte den ${doc.type.toLowerCase()} vom ${date(doc.date)} besprechen. Wichtig sind: ${findings.slice(0,3).join(" | ")||"die erkannten Befundangaben"}. Bitte erklären Sie Bedeutung, Verlauf, Kontrollen und Behandlungsalternativen.`);add("WICHTIGE FRAGEN",questions);return sections.join("\n\n")}
  add("ZUSAMMENFASSUNG",[`${doc.type} vom ${date(doc.date)} · ${doc.specialty}.`,`${doc.labValues?.length||0} Laborwerte erkannt.`]);add("DOKUMENTIERTE BEFUNDE",findings);
  if(mode!=="simple"){add("MÖGLICHE SYMPTOME",["Beschwerden hängen vom betroffenen Organ, Beginn, Dauer, Stärke und Begleitsymptomen ab."]);add("MÖGLICHE URSACHEN",["Ein Befund kann verschiedene Ursachen haben. Vorgeschichte, Untersuchung und Verlauf sind entscheidend."])}
  if(["expanded","medical"].includes(mode)){add("VARIANTEN UND ALTERNATIVEN",["Beobachtung, konservative Behandlung, weitere Diagnostik, Hilfsmittel, Medikamente oder fachärztliche Mitbeurteilung können je nach Befund infrage kommen."]);add("VORTEILE",["Gezielte Abklärung kann Behandlung und Verlaufskontrolle verbessern."]);add("NACHTEILE",["Möglicher Aufwand, Kosten, Nebenwirkungen oder zusätzliche Untersuchungen."]);add("GEFAHREN",["Akute Warnzeichen übersehen oder Therapien ohne ärztliche Rücksprache verändern."]);add("GEGENMASSNAHMEN",["Originalbefund prüfen, Symptome dokumentieren und Kontrollen wahrnehmen."])}
  add(mode==="doctor"?"FRAGESTELLUNGEN AN DIE WEITERBEHANDELNDE PRAXIS":"FRAGEN FÜR DEN ARZTTERMIN",questions);
  sections.push("Hinweis: Automatische Orientierung, keine Diagnose. Mit Originalbefund und behandelnder Praxis abgleichen.");return sections.join("\n\n")
 }
 return {esc,date,toast,specialHtml,analysis};
})();