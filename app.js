const DEFAULT_BACKGROUND_URL = "fondo-default.jpg";
const DB_NAME = "etiquetador_fotos_db_v1";
const DB_STORE = "project";
const PROJECT_KEY = "current_project";

const state = {
  step: 1,
  backgroundSrc: DEFAULT_BACKGROUND_URL,
  photos: [],
  hydrated: false,
  lastSuggestedFileName: "",
  fileNameTouched: false
};

const $ = (id) => document.getElementById(id);
const els = {
  btnStart: $("btnStart"),
  btnClearProject: $("btnClearProject"),
  instructions: $("instructions"),
  progressTabs: Array.from(document.querySelectorAll(".progress-tab")),
  step1: $("step1"),
  step2: $("step2"),
    protocolo: $("protocolo"),
  trial: $("trial"),
  localidad: $("localidad"),
  photosPerSlide: $("photosPerSlide"),
  treatmentsInput: $("treatmentsInput"),
  momentsInput: $("momentsInput"),
  qualityMode: $("qualityMode"),
  labelStyle: $("labelStyle"),
  backgroundPreview: $("backgroundPreview"),
  btnChangeBg: $("btnChangeBg"),
  btnResetBg: $("btnResetBg"),
  bgInput: $("bgInput"),
  btnGoPhotos: $("btnGoPhotos"),
  dropZones: $("dropZones"),
  btnAutoAssign: $("btnAutoAssign"),
  btnClearPhotos: $("btnClearPhotos"),
  btnBackConfig: $("btnBackConfig"),
  photoCounter: $("photoCounter"),
  momentCount: $("momentCount"),
  treatmentCount: $("treatmentCount"),
  assignedCount: $("assignedCount"),
  pptSlidesCount: $("pptSlidesCount"),
  assignmentPreview: $("assignmentPreview"),
  fileName: $("fileName"),
  btnDownloadPhotos: $("btnDownloadPhotos"),
  btnDownloadPpt: $("btnDownloadPpt"),
  btnDownloadAll: $("btnDownloadAll"),
  exportStatus: $("exportStatus")
};

function openDb(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME,1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbSet(key,value){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(DB_STORE,"readwrite");
    tx.objectStore(DB_STORE).put(value,key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGet(key){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(DB_STORE,"readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbDelete(key){
  const db = await openDb();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(DB_STORE,"readwrite");
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function debounce(fn, wait=350){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), wait);
  };
}

function parseLines(raw){
  return String(raw || "")
    .split(/\r?\n/)
    .map(v => v.trim())
    .filter(Boolean);
}
function parseMoments(raw){
  return String(raw || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, idx)=>{
    const parts = line.split("|").map(p => p.trim());
    return { id: "m"+idx+"_"+slug(parts[0] || "Momento"), name: parts[0] || "Momento", date: parts[1] || "" };
  });
}
function getTreatments(){
  return parseLines(els.treatmentsInput.value).map((name, idx)=>({ id:"t"+idx+"_"+slug(name), name }));
}
function getMoments(){
  return parseMoments(els.momentsInput.value);
}
function getMeta(){
  return {
    protocolo: els.protocolo.value.trim(),
    trial: els.trial.value.trim(),
    localidad: els.localidad.value.trim(),
    photosPerSlide: Math.max(1, Math.min(6, Number(els.photosPerSlide.value || 3))),
    qualityMode: els.qualityMode.value,
    labelStyle: els.labelStyle.value,
    treatments: getTreatments(),
    moments: getMoments(),
    backgroundSrc: state.backgroundSrc
  };
}
function slug(value){
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\w]+/g,"_").replace(/^_+|_+$/g,"").toLowerCase() || "item";
}
function sanitizeFileName(value){
  return String(value || "Etiquetador_Fotos").trim()
    .replace(/[\\/:*?"<>|]/g,"_").replace(/\s+/g,"_").replace(/_+/g,"_") || "Etiquetador_Fotos";
}
function escapeHtml(value){
  return String(value || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function buildDefaultFileName(){
  const meta = getMeta();
  const momentNames = meta.moments.map(m => m.name).filter(Boolean);
  const momentPart = momentNames.length === 1 ? momentNames[0] : (momentNames.length > 1 ? momentNames.join("_") : "");
  return sanitizeFileName([meta.protocolo, meta.trial, meta.localidad, momentPart].filter(Boolean).join("_"));
}
function refreshFileNameDefault(force = false){
  const suggested = buildDefaultFileName();
  if(!suggested || !els.fileName) return;

  const current = els.fileName.value;
  const canReplace =
    force ||
    !state.fileNameTouched ||
    !current ||
    current === "Etiquetador_Fotos" ||
    current === state.lastSuggestedFileName ||
    current.startsWith("Etiquetador_");

  if(canReplace){
    els.fileName.value = suggested;
    state.lastSuggestedFileName = suggested;
    state.fileNameTouched = false;
  }
}



function setStep(step){
  state.step = step;
  const screens = [els.step1, els.step2].filter(Boolean);
  screens.forEach((el, i) => el.classList.toggle("active", i + 1 === step));
  els.progressTabs.forEach(tab => tab.classList.toggle("active", Number(tab.dataset.step) === step));
  window.scrollTo({top:0, behavior:"smooth"});
  saveProject();
}
function validateConfig(){
  const m = getMeta();
  if(!m.protocolo || !m.trial || !m.localidad){
    alert("Completá protocolo, trial y localidad.");
    return false;
  }
  if(!m.treatments.length){
    alert("Cargá al menos un tratamiento. Recordá: un tratamiento por línea.");
    return false;
  }
  if(!m.moments.length){
    alert("Cargá al menos un momento. Formato sugerido: 21 DAA | 2026-01-15");
    return false;
  }
  return true;
}
function isHeicFile(file){
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif") || type.includes("heic") || type.includes("heif");
}
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
async function normalizeImageFile(file){
  if(!isHeicFile(file)) return fileToDataUrl(file);
  if(typeof window.heic2any !== "function") throw new Error("No se pudo cargar la librería HEIC.");
  const converted = await window.heic2any({ blob:file, toType:"image/jpeg", quality:.95 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return fileToDataUrl(blob);
}
function getImageSize(dataUrl){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = () => resolve({ width:img.naturalWidth || img.width, height:img.naturalHeight || img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
function getMimeFromDataUrl(dataUrl){
  const match = String(dataUrl).match(/^data:([^;]+);/);
  return match ? match[1] : "image/jpeg";
}
function dataUrlToBlob(dataUrl){
  const [head, body] = dataUrl.split(",");
  const mime = (head.match(/:(.*?);/) || [,"application/octet-stream"])[1];
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type:mime });
}
async function urlToDataUrl(url){
  if(!url || String(url).startsWith("data:")) return url;
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToDataUrl(blob);
}
async function getBackgroundForPpt(meta){
  try{
    return await urlToDataUrl(meta.backgroundSrc || DEFAULT_BACKGROUND_URL);
  }catch(error){
    console.warn("No se pudo convertir el fondo para PPT", error);
    return "";
  }
}
async function maybeCompressImage(dataUrl, mode){
  if(mode === "original") return dataUrl;
  const size = await getImageSize(dataUrl);
  const maxSide = mode === "high" ? 2200 : 1400;
  const ratio = Math.min(1, maxSide / Math.max(size.width, size.height));
  if(ratio >= 1 && mode === "high") return dataUrl;
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(size.width * ratio);
  canvas.height = Math.round(size.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", mode === "high" ? .92 : .78);
}
function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function bakeImageOrientation(dataUrl, mode){
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const sourceType = getMimeFromDataUrl(dataUrl);
  const type = sourceType.includes("png") ? "image/png" : "image/jpeg";
  const quality = mode === "light" ? .82 : .95;
  return canvas.toDataURL(type, quality);
}

async function rotateImageDataUrl90(dataUrl, mode){
  const img = await loadImage(dataUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = srcH;
  canvas.height = srcW;
  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -srcW / 2, -srcH / 2, srcW, srcH);

  const sourceType = getMimeFromDataUrl(dataUrl);
  const type = sourceType.includes("png") ? "image/png" : "image/jpeg";
  const quality = mode === "light" ? .82 : .95;
  return canvas.toDataURL(type, quality);
}

async function addPhotoFiles(files, momentId){
  const clean = Array.from(files || []).filter(f => (f.type || "").startsWith("image/") || /\.(heic|heif)$/i.test(f.name || ""));
  if(!clean.length) return;
  setStatus("Cargando fotos...");
  const next = [];
  for(const file of clean){
    try{
      const rawDataUrl = await normalizeImageFile(file);
      const compressedDataUrl = await maybeCompressImage(rawDataUrl, getMeta().qualityMode);
      const dataUrl = await bakeImageOrientation(compressedDataUrl, getMeta().qualityMode);
      const size = await getImageSize(dataUrl);
      next.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now()+"_"+Math.random(),
        fileName: file.name,
        dataUrl,
        width: size.width,
        height: size.height,
        momentId,
        treatmentId: "",
        order: state.photos.length + next.length
      });
    }catch(err){
      alert("No se pudo cargar " + file.name + ". " + (err?.message || ""));
    }
  }
  state.photos.push(...next);
  renderAll();
  await saveProject();
  setStatus("Fotos cargadas.");
}

function renderDropZones(){
  const moments = getMoments();
  const treatments = getTreatments();
  els.dropZones.innerHTML = "";
  if(!moments.length){
    els.dropZones.innerHTML = `<div class="hint-box">Primero cargá momentos en configuración.</div>`;
    return;
  }
  moments.forEach(moment=>{
    const photos = state.photos.filter(p => p.momentId === moment.id).sort((a,b)=>a.order-b.order);
    const card = document.createElement("article");
    card.className = "moment-card";
    card.innerHTML = `
      <div class="moment-header">
        <div>
          <h3>${escapeHtml(moment.name)}</h3>
          <small>${escapeHtml(moment.date || "Sin fecha")} · ${photos.length} foto(s)</small>
        </div>
      </div>
      <div class="drop-zone" data-moment-id="${escapeHtml(moment.id)}">
        <div>
          <strong>Arrastrá fotos acá</strong>
          <span>También podés hacer click para seleccionar archivos</span>
        </div>
      </div>
      <input class="hidden moment-file-input" data-moment-id="${escapeHtml(moment.id)}" type="file" accept="image/*,.heic,.heif" multiple>
      <div class="photo-list">
        ${photos.map(photo => renderPhotoItem(photo, treatments)).join("")}
      </div>
    `;
    els.dropZones.appendChild(card);
  });

  els.dropZones.querySelectorAll(".drop-zone").forEach(zone=>{
    const momentId = zone.dataset.momentId;
    const input = els.dropZones.querySelector(`.moment-file-input[data-moment-id="${CSS.escape(momentId)}"]`);
    zone.addEventListener("click", () => input.click());
    ["dragenter","dragover"].forEach(evt => zone.addEventListener(evt, e => {
      e.preventDefault();
      zone.classList.add("drag-over");
    }));
    ["dragleave","drop"].forEach(evt => zone.addEventListener(evt, e => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if(evt === "drop") addPhotoFiles(e.dataTransfer.files, momentId);
    }));
    input.addEventListener("change", e => {
      addPhotoFiles(e.target.files, momentId);
      input.value = "";
    });
  });

  els.dropZones.querySelectorAll("[data-action='treatment']").forEach(sel=>{
    sel.addEventListener("change", async ()=>{
      const photo = state.photos.find(p => p.id === sel.dataset.photoId);
      if(photo) photo.treatmentId = sel.value;
      renderAll();
      await saveProject();
    });
  });
  els.dropZones.querySelectorAll("[data-action='remove']").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      state.photos = state.photos.filter(p => p.id !== btn.dataset.photoId);
      renderAll();
      await saveProject();
    });
  });
  els.dropZones.querySelectorAll("[data-action='up'],[data-action='down']").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      movePhoto(btn.dataset.photoId, btn.dataset.action === "up" ? -1 : 1);
      renderAll();
      await saveProject();
    });
  });

  els.dropZones.querySelectorAll("[data-action='rotate']").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      await rotatePhoto90(btn.dataset.photoId);
    });
  });
}
function renderPhotoItem(photo, treatments){
  return `
    <div class="photo-item">
      <img src="${photo.dataUrl}" alt="${escapeHtml(photo.fileName)}">
      <div class="photo-meta">
        <p>${escapeHtml(photo.fileName)}</p>
        <select data-action="treatment" data-photo-id="${escapeHtml(photo.id)}">
          <option value="">Seleccionar tratamiento...</option>
          ${treatments.map(t => `<option value="${escapeHtml(t.id)}" ${photo.treatmentId === t.id ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")}
        </select>
        <div class="photo-actions">
          <button class="icon-btn" data-action="up" data-photo-id="${escapeHtml(photo.id)}" type="button">↑</button>
          <button class="icon-btn" data-action="down" data-photo-id="${escapeHtml(photo.id)}" type="button">↓</button>
          <button class="icon-btn" data-action="rotate" data-photo-id="${escapeHtml(photo.id)}" type="button">Rotar ↻</button>
          <button class="icon-btn danger" data-action="remove" data-photo-id="${escapeHtml(photo.id)}" type="button">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
function movePhoto(photoId, delta){
  const photo = state.photos.find(p => p.id === photoId);
  if(!photo) return;
  const group = state.photos.filter(p => p.momentId === photo.momentId).sort((a,b)=>a.order-b.order);
  const i = group.findIndex(p => p.id === photoId);
  const j = i + delta;
  if(j < 0 || j >= group.length) return;
  const temp = group[i].order;
  group[i].order = group[j].order;
  group[j].order = temp;
}

async function rotatePhoto90(photoId){
  const photo = state.photos.find(p => p.id === photoId);
  if(!photo) return;

  try{
    const rotatedDataUrl = await rotateImageDataUrl90(photo.dataUrl, getMeta().qualityMode);
    const size = await getImageSize(rotatedDataUrl);
    photo.dataUrl = rotatedDataUrl;
    photo.width = size.width;
    photo.height = size.height;
    photo.rotation = 0;

    renderAll();
    await saveProject();
  }catch(error){
    console.error(error);
    alert("No se pudo rotar la foto.");
  }
}


function autoAssignTreatments(){
  const moments = getMoments();
  const treatments = getTreatments();
  if(!treatments.length){ alert("Primero cargá tratamientos."); return; }
  for(const moment of moments){
    const photos = state.photos.filter(p => p.momentId === moment.id).sort((a,b)=>a.order-b.order);
    if(!photos.length) continue;
    const block = Math.ceil(photos.length / treatments.length);
    photos.forEach((photo, idx)=>{
      const treatmentIndex = Math.min(treatments.length - 1, Math.floor(idx / block));
      photo.treatmentId = treatments[treatmentIndex].id;
    });
  }
  renderAll();
  saveProject();
}

function clearPhotosOnly(){
  if(!state.photos.length){
    alert("No hay fotos cargadas para vaciar.");
    return;
  }
  if(!confirm("¿Querés eliminar todas las fotos cargadas? La configuración se mantiene.")) return;
  state.photos = [];
  renderAll();
  saveProject();
}

function renderStats(){
  const moments = getMoments();
  const treatments = getTreatments();
  const assigned = state.photos.filter(p => p.treatmentId).length;
  els.photoCounter.textContent = `${state.photos.length} foto${state.photos.length === 1 ? "" : "s"}`;
  els.momentCount.textContent = moments.length;
  els.treatmentCount.textContent = treatments.length;
  els.assignedCount.textContent = assigned;
  els.pptSlidesCount.textContent = estimatePptSlides();
}
function renderAssignmentPreview(){
  const moments = getMoments();
  const treatments = getTreatments();
  if(!state.photos.length){
    els.assignmentPreview.className = "assignment-preview empty";
    els.assignmentPreview.textContent = "Sin fotos cargadas todavía.";
    return;
  }
  els.assignmentPreview.className = "assignment-preview";
  const rows = [];
  for(const moment of moments){
    const momentPhotos = state.photos.filter(p => p.momentId === moment.id);
    for(const treatment of treatments){
      const count = momentPhotos.filter(p => p.treatmentId === treatment.id).length;
      rows.push(`<div class="assignment-row"><strong>${escapeHtml(moment.name)} · ${escapeHtml(treatment.name)}</strong><small>${count} foto(s)</small></div>`);
    }
  }
  els.assignmentPreview.innerHTML = rows.join("");
}
function estimatePptSlides(){
  const m = getMeta();
  const pps = m.photosPerSlide;
  let slides = 1;
  slides += m.moments.length;
  for(const moment of m.moments){
    for(const treatment of m.treatments){
      const count = state.photos.filter(p => p.momentId === moment.id && p.treatmentId === treatment.id).length;
      slides += Math.ceil(count / pps);
    }
  }
  slides += m.treatments.length;
  for(const treatment of m.treatments){
    for(const moment of m.moments){
      const count = state.photos.filter(p => p.treatmentId === treatment.id && p.momentId === moment.id).length;
      slides += Math.ceil(count / pps);
    }
  }
  return slides;
}
function renderAll(){
  refreshFileNameDefault(false);
  renderDropZones();
  renderStats();
  renderAssignmentPreview();
}

function fitContain(imgW,imgH,boxW,boxH){
  const r = imgW / imgH;
  const br = boxW / boxH;
  let w,h;
  if(r > br){ w = boxW; h = boxW / r; } else { h = boxH; w = boxH * r; }
  return { w,h,x:(boxW-w)/2,y:(boxH-h)/2 };
}
function chunk(arr,size){
  const out = [];
  for(let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size));
  return out;
}

function buildLabelLines(photo, meta){
  const moment = meta.moments.find(m => m.id === photo.momentId) || {};
  const treatment = meta.treatments.find(t => t.id === photo.treatmentId) || {};
  if(meta.labelStyle === "compact"){
    return [`${meta.protocolo} | ${meta.trial} | ${meta.localidad} | ${moment.name || ""} | ${moment.date || ""} | ${treatment.name || ""}`];
  }
  return [
    `Protocolo: ${meta.protocolo}`,
    `Trial: ${meta.trial}`,
    `Localidad: ${meta.localidad}`,
    `Momento: ${moment.name || ""}`,
    `Fecha: ${moment.date || ""}`,
    `Tratamiento: ${treatment.name || ""}`
  ];
}
async function makeLabeledImage(photo, meta){
  const img = await loadImage(photo.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = photo.width;
  canvas.height = photo.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const moment = meta.moments.find(m => m.id === photo.momentId) || {};
  const treatment = meta.treatments.find(t => t.id === photo.treatmentId) || {};
  const fields = [
    ["Protocolo", meta.protocolo],
    ["Trial", meta.trial],
    ["Localidad", meta.localidad],
    ["Momento", moment.name || ""],
    ["Fecha", moment.date || ""],
    ["Tratamiento", treatment.name || ""]
  ];

  const padX = Math.max(14, Math.round(canvas.width * .014));
  const fontSize = Math.max(13, Math.round(canvas.width * .014));
  const labelFontSize = Math.max(11, Math.round(fontSize * .78));
  const bandH = Math.max(Math.round(fontSize * 2.55), Math.round(canvas.height * .062));
  const y0 = canvas.height - bandH;

  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.fillRect(0, y0, canvas.width, bandH);
  ctx.strokeStyle = "rgba(53,24,94,.22)";
  ctx.lineWidth = Math.max(1, Math.round(canvas.width * .001));
  ctx.beginPath();
  ctx.moveTo(0, y0);
  ctx.lineTo(canvas.width, y0);
  ctx.stroke();

  const colW = (canvas.width - padX * 2) / fields.length;
  fields.forEach(([label, value], idx) => {
    const x = padX + idx * colW;
    ctx.fillStyle = "#6f6680";
    ctx.font = `800 ${labelFontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(label + ":", x, y0 + Math.round(bandH * .18));

    ctx.fillStyle = "#24113f";
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
    let text = String(value || "");
    while(ctx.measureText(text).width > colW - 8 && text.length > 8) text = text.slice(0,-2) + "…";
    ctx.fillText(text, x, y0 + Math.round(bandH * .50));
  });

  const type = getMimeFromDataUrl(photo.dataUrl).includes("png") ? "image/png" : "image/jpeg";
  const quality = meta.qualityMode === "light" ? .82 : .95;
  return canvas.toDataURL(type, quality);
}


async function createPhotosZip(){
  const meta = getMeta();
  const zip = new JSZip();
  const folderName = buildDefaultFileName() || "fotos_etiquetadas";
  const folder = zip.folder(folderName);
  const usedNames = new Map();

  for(let i=0;i<state.photos.length;i++){
    const photo = state.photos[i];
    const moment = meta.moments.find(m => m.id === photo.momentId) || {};
    const treatment = meta.treatments.find(t => t.id === photo.treatmentId) || {};
    const labeled = await makeLabeledImage(photo, meta);
    const ext = getMimeFromDataUrl(labeled).includes("png") ? "png" : "jpg";

    const baseName = sanitizeFileName(`${meta.protocolo}_${meta.trial}_${meta.localidad}_${moment.name}_${treatment.name}`);
    const currentCount = usedNames.get(baseName) || 0;
    usedNames.set(baseName, currentCount + 1);
    const suffix = currentCount === 0 ? "" : `_foto_${currentCount + 1}`;
    const name = `${baseName}${suffix}.${ext}`;

    folder.file(name, dataUrlToBlob(labeled));
    setStatus(`Generando fotos ${i+1}/${state.photos.length}...`);
  }
  return zip;
}

function addCover(slide, meta, title, subtitle){
  addBackground(slide, meta);
  slide.addShape("rect",{x:.75,y:1.45,w:11.85,h:4.3,fill:{color:"FFFFFF",transparency:8},line:{color:"E7DEF5"}});
  slide.addText(title,{x:1.05,y:2.15,w:11.1,h:.65,fontFace:"Arial",fontSize:30,bold:true,color:"35185E",align:"center"});
  slide.addText(subtitle,{x:1.25,y:2.95,w:10.7,h:.6,fontFace:"Arial",fontSize:16,bold:true,color:"17072C",align:"center",fit:"shrink"});
  slide.addText(`Protocolo: ${meta.protocolo}   |   Trial: ${meta.trial}   |   Localidad: ${meta.localidad}`,{x:1.25,y:3.75,w:10.7,h:.45,fontSize:12,color:"6F6680",align:"center",fit:"shrink"});
}
function addSectorVision(slide, meta, title, subtitle){
  addBackground(slide, meta);
  slide.addShape("rect",{x:.85,y:1.65,w:11.65,h:3.65,fill:{color:"FFFFFF",transparency:5},line:{color:"E7DEF5"}});
  slide.addText(title,{x:1.15,y:2.25,w:11.05,h:.7,fontFace:"Arial",fontSize:28,bold:true,color:"35185E",align:"center"});
  slide.addText(subtitle,{x:1.35,y:3.12,w:10.65,h:.55,fontFace:"Arial",fontSize:16,bold:true,color:"17072C",align:"center",fit:"shrink"});
}
function addBackground(slide, meta){
  if(meta.pptBackgroundSrc) slide.addImage({data:meta.pptBackgroundSrc,x:0,y:0,w:13.333,h:7.5});
  else if(meta.backgroundSrc) slide.addImage({data:meta.backgroundSrc,x:0,y:0,w:13.333,h:7.5});
  else slide.background = { color:"FFFFFF" };
}
function addFooter(slide, text){
  const footerW = 7.85;
  const footerX = (13.333 - footerW) / 2;
  slide.addShape("rect",{x:footerX,y:6.90,w:footerW,h:.42,fill:{color:"FFFFFF",transparency:4},line:{color:"E7DEF5"}});
  slide.addText(text,{x:footerX+.12,y:6.995,w:footerW-.24,h:.18,fontFace:"Arial",fontSize:8.6,bold:true,color:"35185E",align:"center",fit:"shrink"});
}
function addPhotoRow(slide, photos, bottomLabels, footerText, meta){
  addBackground(slide, meta);
  const n = photos.length;
  const area = {x:.55,y:1.18,w:12.25,h:5.08};
  const labelH = .34;
  const gap = .17;
  const cellW = (area.w - gap*(n-1))/n;
  const imgH = area.h - labelH - .08;
  photos.forEach((photo, i)=>{
    const x = area.x + i*(cellW+gap);
    const fit = fitContain(photo.width, photo.height, cellW, imgH);
    slide.addShape("rect",{x,y:area.y,w:cellW,h:imgH,fill:{color:"FFFFFF",transparency:0},line:{color:"E7DEF5"}});
    slide.addImage({
      data:photo.dataUrl,
      x:x + fit.x,
      y:area.y + fit.y,
      w:fit.w,
      h:fit.h
    });

    slide.addShape("rect",{x,y:area.y+imgH+.06,w:cellW,h:labelH,fill:{color:"FFFFFF",transparency:0},line:{color:"E7DEF5"}});
    slide.addText(bottomLabels[i] || "",{
      x:x+.04,
      y:area.y+imgH+.145,
      w:cellW-.08,
      h:.12,
      fontFace:"Arial",
      fontSize:8.6,
      bold:true,
      color:"35185E",
      align:"center",
      fit:"shrink"
    });
  });
  addFooter(slide, footerText);
}
async function createPptBlob(){
  const PptxConstructor = window.pptxgenjs || window.PptxGenJS || window.pptxgen;
  if(typeof PptxConstructor !== "function") throw new Error("No se cargó PptxGenJS. Verificá que el archivo pptxgen.bundle.js esté en la misma carpeta que index.html.");
  const meta = getMeta();
  meta.pptBackgroundSrc = await getBackgroundForPpt(meta);
  const pptx = new PptxConstructor();
  window.pptx = pptx;
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Etiquetador de fotos";
  pptx.subject = "Fotos etiquetadas";
  pptx.title = `${meta.protocolo} ${meta.trial}`;
  pptx.company = "";
  pptx.theme = {
    headFontFace: "Arial",
    bodyFontFace: "Arial",
    lang: "es-AR"
  };

  let slide = pptx.addSlide();
  addCover(slide, meta, "Resultados", `${meta.protocolo} · ${meta.trial} · ${meta.localidad}`);

  slide = pptx.addSlide();
  addSectorVision(slide, meta, "Sector 1", "Fotos ordenadas por momento");

  for(const moment of meta.moments){
    const photosMoment = state.photos
      .filter(p => p.momentId === moment.id && p.treatmentId)
      .sort((a,b)=>a.order-b.order);
    const byTreat = meta.treatments.flatMap(t => photosMoment.filter(p => p.treatmentId === t.id));
    for(const group of chunk(byTreat, meta.photosPerSlide)){
      slide = pptx.addSlide();
      const labels = group.map(p => (meta.treatments.find(t => t.id === p.treatmentId) || {}).name || "");
      const footer = `Protocolo: ${meta.protocolo}   |   Trial: ${meta.trial}   |   Localidad: ${meta.localidad}   |   Momento: ${moment.name}   |   Fecha: ${moment.date || ""}`;
      addPhotoRow(slide, group, labels, footer, meta);
    }
  }

  slide = pptx.addSlide();
  addSectorVision(slide, meta, "Sector 2", "Fotos ordenadas por tratamiento");

  for(const treatment of meta.treatments){
    const photosTreat = state.photos
      .filter(p => p.treatmentId === treatment.id)
      .sort((a,b)=>a.order-b.order);
    const byMoment = meta.moments.flatMap(m => photosTreat.filter(p => p.momentId === m.id));
    for(const group of chunk(byMoment, meta.photosPerSlide)){
      slide = pptx.addSlide();
      const labels = group.map(p => (meta.moments.find(m => m.id === p.momentId) || {}).name || "");
      const footer = `Protocolo: ${meta.protocolo}   |   Trial: ${meta.trial}   |   Localidad: ${meta.localidad}   |   Tratamiento: ${treatment.name}`;
      addPhotoRow(slide, group, labels, footer, meta);
    }
  }

  return await pptx.write("blob");
}

function downloadBlob(blob, fileName){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2500);
}
async function downloadPhotos(){
  if(!state.photos.length){ alert("Primero cargá fotos."); return; }
  setStatus("Generando ZIP de fotos...");
  const zip = await createPhotosZip();
  const blob = await zip.generateAsync({type:"blob"});
  downloadBlob(blob, sanitizeFileName(els.fileName.value || buildDefaultFileName()) + "_fotos.zip");
  setStatus("ZIP de fotos descargado.");
}
async function downloadPpt(){
  if(!state.photos.length){ alert("Primero cargá fotos."); return; }
  setStatus("Generando PowerPoint...");
  const blob = await createPptBlob();
  downloadBlob(blob, sanitizeFileName(els.fileName.value || buildDefaultFileName()) + ".pptx");
  setStatus("PowerPoint descargado.");
}
async function downloadAll(){
  if(!state.photos.length){ alert("Primero cargá fotos."); return; }
  setStatus("Generando descarga completa...");
  const zip = new JSZip();
  const photosZip = await createPhotosZip();
  const photosBlob = await photosZip.generateAsync({type:"blob"});
  const pptBlob = await createPptBlob();
  const base = sanitizeFileName(els.fileName.value || buildDefaultFileName());
  zip.file(base + "_fotos.zip", photosBlob);
  zip.file(base + ".pptx", pptBlob);
  const finalBlob = await zip.generateAsync({type:"blob"});
  downloadBlob(finalBlob, base + "_descarga_completa.zip");
  setStatus("Descarga completa generada.");
}
function setStatus(text){
  if(els.exportStatus) els.exportStatus.textContent = text;
}

const saveProject = debounce(async ()=>{
  if(!state.hydrated) return;
  const project = {
    meta: {
      protocolo: els.protocolo.value,
      trial: els.trial.value,
      localidad: els.localidad.value,
      photosPerSlide: els.photosPerSlide.value,
      treatmentsInput: els.treatmentsInput.value,
      momentsInput: els.momentsInput.value,
      qualityMode: els.qualityMode.value,
      labelStyle: els.labelStyle.value,
      fileName: els.fileName.value,
      fileNameTouched: state.fileNameTouched,
      lastSuggestedFileName: state.lastSuggestedFileName
    },
    backgroundSrc: state.backgroundSrc,
    photos: state.photos,
    step: state.step
  };
  await dbSet(PROJECT_KEY, project);
}, 500);

async function loadProject(){
  const project = await dbGet(PROJECT_KEY);
  if(!project){
    state.hydrated = true;
    renderAll();
    return;
  }
  const m = project.meta || {};
  els.protocolo.value = m.protocolo || "";
  els.trial.value = m.trial || "";
  els.localidad.value = m.localidad || "";
  els.photosPerSlide.value = m.photosPerSlide || "3";
  els.treatmentsInput.value = m.treatmentsInput || "";
  els.momentsInput.value = m.momentsInput || "";
  els.qualityMode.value = m.qualityMode || "original";
  els.labelStyle.value = m.labelStyle || "technical";
  els.fileName.value = m.fileName || "Etiquetador_Fotos";
  state.fileNameTouched = Boolean(m.fileNameTouched);
  state.lastSuggestedFileName = m.lastSuggestedFileName || "";
  state.backgroundSrc = project.backgroundSrc || DEFAULT_BACKGROUND_URL;
  state.photos = Array.isArray(project.photos) ? project.photos : [];
  els.backgroundPreview.src = state.backgroundSrc;
  state.hydrated = true;
  renderAll();
  setStep(project.step || 1);
}

function bindEvents(){
  if(els.btnStart) els.btnStart.addEventListener("click",()=>setStep(1));

  if(els.btnClearProject) els.btnClearProject.addEventListener("click", async ()=>{
    if(!confirm("¿Seguro que querés limpiar el proyecto guardado?")) return;
    await dbDelete(PROJECT_KEY);
    location.reload();
  });

  els.progressTabs.forEach(tab => tab.addEventListener("click",()=>{
    const target = Number(tab.dataset.step);
    if(target > 1 && !validateConfig()) return;
    setStep(target);
  }));

  if(els.btnGoPhotos) els.btnGoPhotos.addEventListener("click",()=>{
    if(!validateConfig()) return;
    refreshFileNameDefault(false);
    renderAll();
    setStep(2);
  });

  if(els.btnBackConfig) els.btnBackConfig.addEventListener("click",()=>setStep(1));
  if(els.btnAutoAssign) els.btnAutoAssign.addEventListener("click", autoAssignTreatments);
  if(els.btnClearPhotos) els.btnClearPhotos.addEventListener("click", clearPhotosOnly);

  if(els.btnDownloadPhotos) els.btnDownloadPhotos.addEventListener("click",()=>downloadPhotos().catch(err=>{console.error(err);alert(err.message || err);setStatus("Error al exportar fotos.");}));
  if(els.btnDownloadPpt) els.btnDownloadPpt.addEventListener("click",()=>downloadPpt().catch(err=>{console.error(err);alert(err.message || err);setStatus("Error al exportar PPT.");}));
  if(els.btnDownloadAll) els.btnDownloadAll.addEventListener("click",()=>downloadAll().catch(err=>{console.error(err);alert(err.message || err);setStatus("Error al generar descarga completa.");}));

  if(els.btnChangeBg) els.btnChangeBg.addEventListener("click",()=>els.bgInput.click());
  if(els.btnResetBg) els.btnResetBg.addEventListener("click",()=>{
    state.backgroundSrc = DEFAULT_BACKGROUND_URL;
    if(els.backgroundPreview) els.backgroundPreview.src = DEFAULT_BACKGROUND_URL;
    saveProject();
  });
  if(els.bgInput) els.bgInput.addEventListener("change", async e=>{
    const file = e.target.files?.[0];
    if(!file) return;
    state.backgroundSrc = await normalizeImageFile(file);
    if(els.backgroundPreview) els.backgroundPreview.src = state.backgroundSrc;
    saveProject();
  });

  ["input","change"].forEach(evt=>{
    [
      els.protocolo,
      els.trial,
      els.localidad,
      els.photosPerSlide,
      els.treatmentsInput,
      els.momentsInput,
      els.qualityMode,
      els.labelStyle
    ].filter(Boolean).forEach(el=>{
      el.addEventListener(evt,()=>{ renderAll(); saveProject(); });
    });
  });

  if(els.fileName){
    els.fileName.addEventListener("input", () => {
      state.fileNameTouched = true;
      saveProject();
    });
  }
}

bindEvents();
loadProject();


window.addEventListener("error", (event) => {
  console.error("Error general:", event.error || event.message);
  const box = document.getElementById("exportStatus");
  if(box) box.textContent = "Error detectado: " + (event.message || "revisar consola");
});
