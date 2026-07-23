window.GALabRefs=(()=>{
 const refs=[
  {name:"MCV",unit:"fl",min:80,max:100,idealMin:82,idealMax:96,category:"Blutbild",info:"Mittlere Größe der roten Blutkörperchen. Erhöhte Werte können unter anderem bei Vitamin-B12-/Folatmangel, Alkoholwirkung oder bestimmten Medikamenten vorkommen."},
  {name:"RDW",unit:"%",min:11.5,max:15.0,idealMin:11.5,idealMax:14.5,category:"Blutbild",info:"Streuung der Größe roter Blutkörperchen. Zusammen mit MCV interpretieren."},
  {name:"Hämoglobin",unit:"g/dl",min:13.5,max:17.5,idealMin:14,maxIdeal:17,idealMax:17,category:"Blutbild",info:"Sauerstofftransport im Blut. Bereiche unterscheiden sich unter anderem nach Geschlecht und Labor."},
  {name:"Leukozyten",unit:"/nl",min:4.0,max:10.0,idealMin:4.5,idealMax:9.0,category:"Blutbild",info:"Weiße Blutkörperchen; können bei Infektionen, Entzündungen und vielen anderen Einflüssen verändert sein."},
  {name:"Thrombozyten",unit:"/nl",min:150,max:400,idealMin:170,idealMax:350,category:"Blutbild",info:"Blutplättchen und Teil der Blutgerinnung."},
  {name:"Kreatinin",unit:"mg/dl",min:0.7,max:1.3,idealMin:0.7,idealMax:1.1,category:"Niere",info:"Wird zur Beurteilung der Nierenfunktion genutzt; Muskelmasse und Flüssigkeitshaushalt beeinflussen den Wert."},
  {name:"eGFR",unit:"ml/min",min:60,max:null,idealMin:90,idealMax:null,category:"Niere",info:"Geschätzte Filterleistung der Nieren. Alter und Berechnungsformel sind wichtig."},
  {name:"Triglyceride",unit:"mg/dl",min:null,max:150,idealMin:null,idealMax:100,category:"Fettstoffwechsel",info:"Blutfette, besonders von Nahrungsaufnahme, Alkohol, Gewicht und Stoffwechsel beeinflusst."},
  {name:"Cholesterin",unit:"mg/dl",min:null,max:200,idealMin:null,idealMax:190,category:"Fettstoffwechsel",info:"Gesamtcholesterin; das persönliche Risiko wird nicht allein durch diesen Wert bestimmt."},
  {name:"LDL",unit:"mg/dl",min:null,max:116,idealMin:null,idealMax:100,category:"Fettstoffwechsel",info:"LDL-Zielwerte hängen stark vom persönlichen Herz-Kreislauf-Risiko ab."},
  {name:"HDL",unit:"mg/dl",min:40,max:null,idealMin:50,idealMax:null,category:"Fettstoffwechsel",info:"HDL wird im Zusammenhang mit dem gesamten Herz-Kreislauf-Risiko beurteilt."},
  {name:"Glukose",unit:"mg/dl",min:70,max:99,idealMin:75,idealMax:95,category:"Zuckerstoffwechsel",info:"Nüchternwert. Zeitpunkt der Blutabnahme und Essen sind entscheidend."},
  {name:"HbA1c",unit:"%",min:4.0,max:5.6,idealMin:4.5,idealMax:5.5,category:"Zuckerstoffwechsel",info:"Langzeitblutzucker der vergangenen Wochen. Zielwerte bei Diabetes werden individuell festgelegt."},
  {name:"TSH",unit:"mU/l",min:0.4,max:4.0,idealMin:0.5,idealMax:2.5,category:"Schilddrüse",info:"Steuerhormon der Schilddrüse. Interpretation zusammen mit Beschwerden und gegebenenfalls fT4/fT3."},
  {name:"PSA",unit:"ng/ml",min:null,max:4.0,idealMin:null,idealMax:2.5,category:"Urologie",info:"Prostataspezifisches Antigen. Alter, Prostatagröße, Entzündungen und Verlauf sind wichtig; kein alleiniger Krebsnachweis."},
  {name:"CRP",unit:"mg/l",min:null,max:5,idealMin:null,idealMax:3,category:"Entzündung",info:"Unspezifischer Entzündungsmarker. Ursache und Verlauf müssen klinisch eingeordnet werden."},
  {name:"GOT",unit:"U/l",min:null,max:35,idealMin:null,idealMax:30,category:"Leber",info:"Enzym aus mehreren Geweben; zusammen mit anderen Leber- und Muskelwerten bewerten."},
  {name:"GPT",unit:"U/l",min:null,max:45,idealMin:null,idealMax:35,category:"Leber",info:"Leberenzym; Referenzen unterscheiden sich nach Labor und Geschlecht."},
  {name:"Gamma-GT",unit:"U/l",min:null,max:60,idealMin:null,idealMax:40,category:"Leber",info:"Kann bei Leber-/Gallenbelastung, Alkohol und Medikamenten verändert sein."},
  {name:"Ferritin",unit:"ng/ml",min:30,max:400,idealMin:50,idealMax:200,category:"Vitamine & Speicher",info:"Eisenspeicherwert; Entzündungen können ihn erhöhen."},
  {name:"Vitamin B12",unit:"pg/ml",min:200,max:900,idealMin:300,idealMax:700,category:"Vitamine & Speicher",info:"Bei Grenzwerten können ergänzende Marker nötig sein."},
  {name:"Folsäure",unit:"ng/ml",min:4,max:20,idealMin:7,idealMax:15,category:"Vitamine & Speicher",info:"Versorgung hängt unter anderem von Ernährung, Aufnahme und Medikamenten ab."}
 ];
 const normalize=s=>String(s||"").toLowerCase().replace(/[\s\-_.]/g,"").replace("gamma","g");
 function find(name){const n=normalize(name);return refs.find(r=>normalize(r.name)===n)||refs.find(r=>n.includes(normalize(r.name))||normalize(r.name).includes(n))}
 function status(value,min,max){const v=Number(value);if(min!=null&&v<min)return"low";if(max!=null&&v>max)return"high";return"ok"}
 function describeStatus(s){return s==="low"?"unter Referenz":s==="high"?"über Referenz":"im Referenzbereich"}
 return {refs,find,status,describeStatus};
})();