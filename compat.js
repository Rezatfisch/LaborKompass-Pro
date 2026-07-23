(()=>{
 "use strict";
 const fallbackRubrics=["Allgemeine Befunde","Bildgebung","Blut und Labor","Dermatologie und Haut","Diagnosen","Medikamente und Rezepte","Sonstiges"];
 const c=window.GAChoices=window.GAChoices||{};
 c.catalogs=c.catalogs||{};
 c.catalogs.rubricOptions=Array.isArray(c.catalogs.rubricOptions)?c.catalogs.rubricOptions:fallbackRubrics;
 c.catalogs.documentTypeOptions=Array.isArray(c.catalogs.documentTypeOptions)?c.catalogs.documentTypeOptions:[];
 c.catalogs.specialtyOptions=Array.isArray(c.catalogs.specialtyOptions)?c.catalogs.specialtyOptions:[];
 c.catalogs.bodyRegionOptions=Array.isArray(c.catalogs.bodyRegionOptions)?c.catalogs.bodyRegionOptions:[];
 c.catalogs.lateralityOptions=Array.isArray(c.catalogs.lateralityOptions)?c.catalogs.lateralityOptions:["ohne Seitenangabe","beidseits","links","rechts"];
 c.lists=c.lists||{};
 c.lists.rubrics=Array.isArray(c.lists.rubrics)?c.lists.rubrics:c.catalogs.rubricOptions;
 c.lists.documentTypes=Array.isArray(c.lists.documentTypes)?c.lists.documentTypes:c.catalogs.documentTypeOptions;
 c.lists.specialties=Array.isArray(c.lists.specialties)?c.lists.specialties:c.catalogs.specialtyOptions;
 c.lists.bodyRegions=Array.isArray(c.lists.bodyRegions)?c.lists.bodyRegions:c.catalogs.bodyRegionOptions;
 window.GA_BOOT_DIAGNOSTICS={version:"3.3.8",compatibilityShim:true,loadedAt:new Date().toISOString()};
})();
