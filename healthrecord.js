window.GAHealthRecord=(()=>{
 const norm=s=>String(s||"").trim().replace(/\s+/g," ");
 const key=s=>norm(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const uniq=(arr,fn=x=>key(x))=>{const m=new Map();arr.forEach(x=>{const k=fn(x);if(k&&!m.has(k))m.set(k,x)});return [...m.values()]};
 const dateSort=(a,b)=>(b.date||"").localeCompare(a.date||"");
 function diagnosisStatus(text){
  const t=key(text);
  if(/verdacht|v a |ausschluss|unklar/.test(t))return"Verdacht";
  if(/kontrolle unauffällig|abgeheilt|kein nachweis|nicht mehr/.test(t))return"abgeheilt/unauffällig";
  return"aktiv/zu prüfen"
 }
 function build(state){
  const docs=[...(state.documents||[])].sort(dateSort);
  const diagnosisRows=[];
  const medicationRows=[];
  const doctorRows=[];
  docs.forEach(d=>{
   (d.diagnoses||[]).forEach(text=>diagnosisRows.push({text:norm(text),date:d.date,documentId:d.id,documentName:d.name,specialty:d.topicSpecialty||d.specialty||"",status:diagnosisStatus(text)}));
   (d.medications||[]).forEach(text=>medicationRows.push({text:norm(text),date:d.date,documentId:d.id,documentName:d.name,doctor:d.doctor||d.issuer||"",status:/abgesetzt|beendet|nicht mehr/i.test(text)?"beendet":"aktuell/unklar"}));
   const doctor=norm(d.doctor||d.issuer);
   if(doctor)doctorRows.push({name:doctor,date:d.date,specialty:d.creatorSpecialty||d.topicSpecialty||d.specialty||"",documentId:d.id,documentName:d.name});
  });
  const diagnosisGroups=new Map();
  diagnosisRows.forEach(r=>{const k=key(r.text);if(!diagnosisGroups.has(k))diagnosisGroups.set(k,[]);diagnosisGroups.get(k).push(r)});
  const diagnoses=[...diagnosisGroups.values()].map(rows=>{
   rows.sort(dateSort);return {name:rows[0].text,firstDate:[...rows].sort((a,b)=>(a.date||"").localeCompare(b.date||""))[0]?.date||"",lastDate:rows[0].date,status:rows.some(x=>x.status==="aktiv/zu prüfen")?"aktiv/zu prüfen":rows[0].status,specialties:uniq(rows.map(x=>x.specialty).filter(Boolean)),documents:rows}
  }).sort((a,b)=>(b.lastDate||"").localeCompare(a.lastDate||""));
  const medications=uniq(medicationRows,r=>key(r.text)).sort(dateSort);
  const doctorGroups=new Map();
  doctorRows.forEach(r=>{const k=key(r.name);if(!doctorGroups.has(k))doctorGroups.set(k,[]);doctorGroups.get(k).push(r)});
  const doctors=[...doctorGroups.values()].map(rows=>{rows.sort(dateSort);return{name:rows[0].name,specialties:uniq(rows.map(x=>x.specialty).filter(Boolean)),lastDate:rows[0].date,count:rows.length,documents:rows}}).sort((a,b)=>(b.lastDate||"").localeCompare(a.lastDate||""));
  const timeline=[
   ...docs.map(d=>({date:d.date,kind:"Dokument",title:d.name,subtitle:d.topicSpecialty||d.specialty||d.type||"",documentId:d.id})),
   ...(state.values||[]).map(v=>({date:v.date,kind:"Labor",title:`${v.name}: ${v.value} ${v.unit||""}`,subtitle:v.source||"Laborwert"}))
  ].sort(dateSort);
  const recommendations=docs.flatMap(d=>(d.recommendations||[]).map(text=>({text:norm(text),date:d.date,documentId:d.id,documentName:d.name}))).sort(dateSort);
  return {documents:docs,diagnoses,medications,doctors,timeline,recommendations}
 }
 function search(state,query){
  const q=key(query);if(!q)return[];
  const words=q.split(/\s+/).filter(Boolean);
  return (state.documents||[]).map(d=>{
   const text=key([d.name,d.type,d.rubric,d.specialty,d.creatorSpecialty,d.topicSpecialty,d.doctor,d.issuer,(d.diagnoses||[]).join(" "),(d.medications||[]).join(" "),(d.recommendations||[]).join(" "),d.text].join(" "));
   const score=words.reduce((n,w)=>n+(text.includes(w)?1:0),0);
   return {d,score}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||(b.d.date||"").localeCompare(a.d.date||"")).map(x=>x.d)
 }
 function summary(state){
  const r=build(state),labs=state.values||[];
  const abnormal=labs.filter(v=>{const n=Number(v.value);return Number.isFinite(n)&&((v.min!=null&&n<v.min)||(v.max!=null&&n>v.max))});
  const latest=r.documents[0];
  const topSpecialties=Object.entries(r.documents.reduce((m,d)=>{const x=d.topicSpecialty||d.specialty||"Sonstiges";m[x]=(m[x]||0)+1;return m},{})).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const lines=[
   `In der Gesundheitsakte sind ${r.documents.length} Dokumente und ${labs.length} Laborwerte gespeichert.`,
   r.diagnoses.length?`${r.diagnoses.length} unterschiedliche Diagnose- oder Befundbegriffe wurden erkannt.`:"Noch keine strukturierten Diagnosen erkannt.",
   r.medications.length?`${r.medications.length} Medikamentenangaben wurden gefunden.`:"Noch keine Medikamentenangaben erkannt.",
   abnormal.length?`${abnormal.length} Laborwerte liegen außerhalb des jeweils hinterlegten Bereichs.`:"Nach den hinterlegten Bereichen sind derzeit keine Laborabweichungen markiert.",
   latest?`Der jüngste Eintrag ist „${latest.name}“ vom ${latest.date||"unbekannten Datum"}.`:"",
   topSpecialties.length?`Am häufigsten vertreten: ${topSpecialties.map(([n,c])=>`${n} (${c})`).join(", ")}.`:""
  ].filter(Boolean);
  return lines.join("\n\n")
 }
 return {build,search,summary};
})();