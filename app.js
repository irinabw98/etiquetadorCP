const DEFAULT_BACKGROUND_URL = 'fondo-default.jpg';

const state = {
  step: 1,
  backgroundSrc: DEFAULT_BACKGROUND_URL,
  photos: [],
  fileNameTouched: false
};

const $ = (id) => document.getElementById(id);

const els = {
  stepPill: $('stepPill'), tabStep1: $('tabStep1'), tabStep2: $('tabStep2'), step1: $('step1'), step2: $('step2'),
  protocolo: $('protocolo'), trial: $('trial'), localidad: $('localidad'), momentMode: $('momentMode'), singleMomentBox: $('singleMomentBox'), multipleMomentBox: $('multipleMomentBox'), momento: $('momento'), fecha: $('fecha'), momentosLista: $('momentosLista'),
  identificacionModo: $('identificacionModo'), slidesPorGrupo: $('slidesPorGrupo'), nombresGrupos: $('nombresGrupos'), goStep2: $('goStep2'),
  changeBg: $('changeBg'), resetBg: $('resetBg'), bgInput: $('bgInput'), backgroundPreview: $('backgroundPreview'),
  uploadPhotosBtn: $('uploadPhotosBtn'), photoInput: $('photoInput'), autoAssignBtn: $('autoAssignBtn'), photoList: $('photoList'), photoCounter: $('photoCounter'),
  slideCount: $('slideCount'), assignedCount: $('assignedCount'), fileName: $('fileName'), backStep1: $('backStep1'), downloadPptx: $('downloadPptx'), groupPreview: $('groupPreview'),
  assignHelp: $('assignHelp'), suggestionText: $('suggestionText')
};

function parseMoments(raw) {
  return String(raw || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split('|').map(p => p.trim());
    return { name: parts[0] || '', date: parts[1] || '' };
  }).filter(m => m.name);
}

function getMoments() {
  if (els.momentMode.value === 'multiple') return parseMoments(els.momentosLista.value);
  return [{ name: els.momento.value.trim(), date: els.fecha.value }].filter(m => m.name || m.date);
}

function meta() {
  const moments = getMoments();
  return {
    protocolo: els.protocolo.value.trim(),
    trial: els.trial.value.trim(),
    localidad: els.localidad.value.trim(),
    momentMode: els.momentMode.value,
    momento: els.momento.value.trim(),
    fecha: els.fecha.value,
    moments,
    identificacionModo: els.identificacionModo.value,
    slidesPorGrupo: Math.max(1, Number(els.slidesPorGrupo.value || 1)),
    nombresGruposRaw: els.nombresGrupos.value
  };
}

function normalizeOptions(raw) {
  return String(raw || '').split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
}

function sanitizeFileName(name) {
  return String(name || '').trim().replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_') || 'Etiquetado_Fotos';
}

function suggestedFileName() {
  const m = meta();
  const parts = m.momentMode === 'multiple' ? [m.protocolo, m.trial] : [m.protocolo, m.trial, m.momento];
  return sanitizeFileName(parts.filter(Boolean).join('-')) || 'Etiquetado_Fotos';
}

function refreshSuggestedFileName() {
  if (!state.fileNameTouched) els.fileName.value = suggestedFileName();
  els.suggestionText.textContent = meta().momentMode === 'multiple'
    ? 'El nombre sugerido será Protocolo-Trial.'
    : 'El nombre sugerido será Protocolo-Trial-Momento.';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}
async function urlToDataUrl(url) { if (url.startsWith('data:')) return url; const response = await fetch(url); const blob = await response.blob(); return fileToDataUrl(blob); }
function getImageSize(dataUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve({ width: img.width, height: img.height }); img.onerror = reject; img.src = dataUrl; }); }
function fitContain(imgW, imgH, boxW, boxH) { const imgRatio = imgW / imgH; const boxRatio = boxW / boxH; let w, h; if (imgRatio > boxRatio) { w = boxW; h = boxW / imgRatio; } else { h = boxH; w = boxH * imgRatio; } return { w, h, xOffset: (boxW - w) / 2, yOffset: (boxH - h) / 2 }; }

function groupPhotos() {
  const m = meta();
  const map = new Map();
  for (const photo of state.photos) {
    const groupName = photo.groupName && photo.groupName.trim() ? photo.groupName.trim() : 'Sin asignar';
    const momentName = m.momentMode === 'multiple' ? (photo.momentName && photo.momentName.trim() ? photo.momentName.trim() : 'Sin momento') : (m.moments[0]?.name || m.momento || '');
    const momentDate = m.momentMode === 'multiple' ? (photo.momentDate || '') : (m.moments[0]?.date || m.fecha || '');
    const key = `${momentName}||${momentDate}||${groupName}`;
    if (!map.has(key)) map.set(key, { momentName, momentDate, groupName, photos: [] });
    map.get(key).photos.push(photo);
  }
  return Array.from(map.values());
}

function splitEvenly(items, parts) {
  const cleanParts = Math.max(1, Number(parts || 1));
  if (!items.length) return [];
  const result = [], base = Math.floor(items.length / cleanParts), remainder = items.length % cleanParts;
  let start = 0;
  for (let i = 0; i < cleanParts; i++) { const size = base + (i < remainder ? 1 : 0); if (size <= 0) continue; result.push(items.slice(start, start + size)); start += size; }
  return result;
}
function getSlideChunksForGroup(group) { return splitEvenly(group.photos, meta().slidesPorGrupo); }
function countTotalSlides() { return groupPhotos().reduce((acc, group) => acc + getSlideChunksForGroup(group).length, 0); }

function dynamicPhotoLayout(count) {
  const area = { x: 0.72, y: 1.18, w: 11.88, h: 5.18 };
  const gap = 0.13;
  if (count <= 1) return [{ x: area.x, y: area.y, w: area.w, h: area.h }];
  const cols = count === 2 ? 2 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const cellW = (area.w - gap * (cols - 1)) / cols;
  const cellH = (area.h - gap * (rows - 1)) / rows;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols), col = i % cols;
    const itemsInRow = row === rows - 1 ? count - row * cols : cols;
    const rowOffset = itemsInRow < cols ? ((cols - itemsInRow) * (cellW + gap)) / 2 : 0;
    return { x: area.x + rowOffset + col * (cellW + gap), y: area.y + row * (cellH + gap), w: cellW, h: cellH };
  });
}

function setStep(step) {
  state.step = step;
  els.step1.classList.toggle('active', step === 1); els.step2.classList.toggle('active', step === 2);
  els.tabStep1.classList.toggle('active', step === 1); els.tabStep2.classList.toggle('active', step === 2);
  els.stepPill.textContent = `Paso ${step} de 2`; window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
  const m = meta();
  if (!m.protocolo || !m.trial || !m.localidad) { alert('Completá Protocolo, Trial y Localidad antes de continuar.'); return false; }
  if (m.momentMode === 'single' && (!m.momento || !m.fecha)) { alert('Completá Momento y Fecha antes de continuar.'); return false; }
  if (m.momentMode === 'multiple' && !m.moments.length) { alert('Cargá al menos un momento en la lista de momentos.'); return false; }
  return true;
}

function escapeHtml(value) { return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

function updateMomentModeUI() {
  const isMultiple = els.momentMode.value === 'multiple';
  els.singleMomentBox.classList.toggle('hidden', isMultiple);
  els.multipleMomentBox.classList.toggle('hidden', !isMultiple);
  els.assignHelp.textContent = isMultiple
    ? 'Subí todas las fotos y elegí momento + tratamiento/parcela para cada una.'
    : 'Subí todas las fotos y elegí a qué tratamiento/parcela pertenece cada una.';
  refreshSuggestedFileName();
  renderPhotoList();
}

function renderPhotoList() {
  els.photoCounter.textContent = `${state.photos.length} foto${state.photos.length === 1 ? '' : 's'}`;
  if (!state.photos.length) { els.photoList.className = 'photo-list empty'; els.photoList.innerHTML = '<p>Todavía no cargaste fotos.</p>'; renderGroupPreview(); return; }
  const options = normalizeOptions(els.nombresGrupos.value);
  const moments = getMoments();
  const isMultiple = els.momentMode.value === 'multiple';
  els.photoList.className = 'photo-list'; els.photoList.innerHTML = '';
  state.photos.forEach((photo, index) => {
    const row = document.createElement('div'); row.className = 'photo-row';
    const momentHtml = isMultiple ? `<label>Momento<select data-action="moment" data-id="${photo.id}"><option value="">Seleccionar...</option>${moments.map((mom) => `<option value="${escapeHtml(mom.name)}" ${photo.momentName === mom.name ? 'selected' : ''}>${escapeHtml(mom.name)}${mom.date ? ' · ' + escapeHtml(mom.date) : ''}</option>`).join('')}</select></label>` : '';
    const selectorHtml = options.length
      ? `<select data-action="group" data-id="${photo.id}"><option value="">Seleccionar...</option>${options.map((opt) => `<option value="${escapeHtml(opt)}" ${photo.groupName === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}</select>`
      : `<input data-action="group" data-id="${photo.id}" type="text" value="${escapeHtml(photo.groupName)}" placeholder="Escribir ${els.identificacionModo.value}" />`;
    row.innerHTML = `<img class="photo-thumb" src="${photo.dataUrl}" alt="${escapeHtml(photo.fileName)}" /><div><p class="photo-title">Foto ${index + 1}</p><p class="photo-name">${escapeHtml(photo.fileName)}</p><div class="assign-grid">${momentHtml}<label>${els.identificacionModo.value === 'tratamiento' ? 'Tratamiento' : 'Parcela'}${selectorHtml}</label></div></div><button class="delete-btn" type="button" data-action="delete" data-id="${photo.id}">×</button>`;
    els.photoList.appendChild(row);
  });
  renderGroupPreview();
}

function renderGroupPreview() {
  const groups = groupPhotos();
  const assigned = state.photos.filter((p) => p.groupName && p.groupName.trim() && (els.momentMode.value !== 'multiple' || (p.momentName && p.momentName.trim()))).length;
  els.slideCount.textContent = countTotalSlides(); els.assignedCount.textContent = assigned;
  if (!groups.length) { els.groupPreview.className = 'group-preview empty'; els.groupPreview.innerHTML = '<p>No hay grupos todavía.</p>'; return; }
  const slidesByGroup = meta().slidesPorGrupo;
  els.groupPreview.className = 'group-preview';
  els.groupPreview.innerHTML = groups.map((group) => {
    const chunks = getSlideChunksForGroup(group);
    const title = `${group.momentName ? group.momentName + ' · ' : ''}${group.groupName}`;
    return `<div class="group-card"><h3>${escapeHtml(title)}</h3><p>${group.photos.length} foto(s) · ${chunks.length} slide(s) · pedido: ${slidesByGroup} slide(s)</p><div class="mini-grid" style="grid-template-columns: repeat(${Math.min(3, Math.max(1, group.photos.length))}, 1fr)">${group.photos.slice(0, 6).map((p) => `<img src="${p.dataUrl}" alt="${escapeHtml(p.fileName)}" />`).join('')}</div></div>`;
  }).join('');
}

function buildLegend(m, group, slideIndex, slideTotal) {
  const label = m.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela';
  return [`Protocolo: ${m.protocolo || '-'}`, `Trial: ${m.trial || '-'}`, `Localidad: ${m.localidad || '-'}`, `Momento: ${group.momentName || '-'}`, `Fecha: ${group.momentDate || '-'}`, `${label}: ${group.groupName || '-'}`, slideTotal > 1 ? `Slide: ${slideIndex}/${slideTotal}` : ''].filter(Boolean).join('   |   ');
}
function getPptxConstructor() { return window.PptxGenJS || window.pptxgen; }

async function generatePptx() {
  if (!state.photos.length) { alert('Primero cargá al menos una foto.'); return; }
  const PptxCtor = getPptxConstructor();
  if (typeof PptxCtor === 'undefined') { alert('No se pudo encontrar la librería local pptxgen.bundle.js. Revisá que ese archivo esté subido en la raíz del repo junto con index.html.'); return; }
  const m = meta(); const groups = groupPhotos();
  const pptx = new PptxCtor(); pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Etiquetador de fotos'; pptx.subject = 'Fotos etiquetadas'; pptx.title = els.fileName.value.trim() || suggestedFileName(); pptx.lang = 'es-AR'; pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'es-AR' };
  const backgroundData = await urlToDataUrl(state.backgroundSrc);
  for (const group of groups) {
    const chunks = getSlideChunksForGroup(group);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]; const slide = pptx.addSlide();
      slide.addImage({ data: backgroundData, x: 0, y: 0, w: 13.333, h: 7.5 });
      slide.addText(group.groupName || 'Sin asignar', { x: 0.74, y: 0.82, w: 6.6, h: 0.35, fontFace: 'Aptos Display', fontSize: 17, bold: true, color: '4B2385', margin: 0, fit: 'shrink' });
      if (m.momentMode === 'multiple') slide.addText(group.momentName || '', { x: 0.74, y: 1.05, w: 6.6, h: 0.22, fontFace: 'Aptos', fontSize: 10, bold: true, color: '6D36B5', margin: 0, fit: 'shrink' });
      const layout = dynamicPhotoLayout(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const photo = chunk[i], box = layout[i], size = await getImageSize(photo.dataUrl), fitted = fitContain(size.width, size.height, box.w, box.h);
        slide.addShape(pptx.ShapeType.roundRect, { x: box.x, y: box.y, w: box.w, h: box.h, rectRadius: 0.08, line: { color: 'D8CCE9', pt: 1.05 }, fill: { color: 'FFFFFF', transparency: 0 }, shadow: { type: 'outer', color: '6D36B5', opacity: 0.11, blur: 1, angle: 45, distance: 1 } });
        slide.addImage({ data: photo.dataUrl, x: box.x + fitted.xOffset, y: box.y + fitted.yOffset, w: fitted.w, h: fitted.h });
      }
      slide.addShape(pptx.ShapeType.roundRect, { x: 1.18, y: 6.67, w: 11.18, h: 0.34, rectRadius: 0.05, line: { color: 'D8CCE9', pt: 0.7 }, fill: { color: 'FFFFFF', transparency: 4 } });
      slide.addText(buildLegend(m, group, chunkIndex + 1, chunks.length), { x: 1.34, y: 6.725, w: 10.86, h: 0.22, fontFace: 'Aptos', fontSize: 9.4, color: '24113F', bold: true, margin: 0, align: 'center', valign: 'mid', fit: 'shrink' });
    }
  }
  const safeName = sanitizeFileName(els.fileName.value.trim() || suggestedFileName()); await pptx.writeFile({ fileName: `${safeName}.pptx` });
}

els.goStep2.addEventListener('click', () => { if (validateStep1()) setStep(2); });
els.tabStep1.addEventListener('click', () => setStep(1));
els.tabStep2.addEventListener('click', () => { if (validateStep1()) setStep(2); });
els.backStep1.addEventListener('click', () => setStep(1));
els.changeBg.addEventListener('click', () => els.bgInput.click());
els.resetBg.addEventListener('click', () => { state.backgroundSrc = DEFAULT_BACKGROUND_URL; els.backgroundPreview.src = DEFAULT_BACKGROUND_URL; });
els.bgInput.addEventListener('change', async (event) => { const file = event.target.files?.[0]; if (!file) return; state.backgroundSrc = await fileToDataUrl(file); els.backgroundPreview.src = state.backgroundSrc; event.target.value = ''; });
els.uploadPhotosBtn.addEventListener('click', () => els.photoInput.click());
els.photoInput.addEventListener('change', async (event) => { const files = Array.from(event.target.files || []); const next = await Promise.all(files.map(async (file, index) => ({ id: `${Date.now()}-${index}-${file.name}`, fileName: file.name, dataUrl: await fileToDataUrl(file), groupName: '', momentName: '', momentDate: '' }))); state.photos.push(...next); event.target.value = ''; renderPhotoList(); });
els.photoList.addEventListener('input', handlePhotoField);
els.photoList.addEventListener('change', handlePhotoField);
function handlePhotoField(event) {
  const target = event.target; if (!target.dataset.action) return;
  const photo = state.photos.find((p) => p.id === target.dataset.id); if (!photo) return;
  if (target.dataset.action === 'group') photo.groupName = target.value;
  if (target.dataset.action === 'moment') { photo.momentName = target.value; const found = getMoments().find(m => m.name === target.value); photo.momentDate = found?.date || ''; }
  renderGroupPreview();
}
els.photoList.addEventListener('click', (event) => { const target = event.target; if (target.dataset.action !== 'delete') return; state.photos = state.photos.filter((p) => p.id !== target.dataset.id); renderPhotoList(); });
els.autoAssignBtn.addEventListener('click', () => {
  const options = normalizeOptions(meta().nombresGruposRaw);
  if (!options.length) { alert('Primero cargá la lista de tratamientos/parcelas en el Paso 1.'); return; }

  const moments = getMoments();
  const isMultiple = els.momentMode.value === 'multiple';

  function assignBlocks(photoSubset, moment) {
    const total = photoSubset.length;
    const treatmentCount = options.length;
    const base = Math.floor(total / treatmentCount);
    const remainder = total % treatmentCount;
    let cursor = 0;

    options.forEach((groupName, groupIndex) => {
      const blockSize = base + (groupIndex < remainder ? 1 : 0);
      for (let i = 0; i < blockSize && cursor < total; i++) {
        const photo = photoSubset[cursor];
        photo.groupName = groupName;
        if (moment) {
          photo.momentName = moment.name || '';
          photo.momentDate = moment.date || '';
        }
        cursor++;
      }
    });
  }

  if (isMultiple && moments.length > 1) {
    const photosPerMomentBase = Math.floor(state.photos.length / moments.length);
    const photosPerMomentRemainder = state.photos.length % moments.length;
    let cursor = 0;

    moments.forEach((moment, momentIndex) => {
      const blockSize = photosPerMomentBase + (momentIndex < photosPerMomentRemainder ? 1 : 0);
      const subset = state.photos.slice(cursor, cursor + blockSize);
      assignBlocks(subset, moment);
      cursor += blockSize;
    });
  } else {
    assignBlocks(state.photos, isMultiple ? moments[0] : null);
  }

  renderPhotoList();
});

['input', 'change'].forEach((evt) => { [els.protocolo, els.trial, els.momento, els.momentosLista].forEach((el) => el.addEventListener(evt, refreshSuggestedFileName)); });
els.fileName.addEventListener('input', () => { state.fileNameTouched = true; });
els.slidesPorGrupo.addEventListener('input', renderGroupPreview);
els.nombresGrupos.addEventListener('change', renderPhotoList);
els.identificacionModo.addEventListener('change', renderPhotoList);
els.momentMode.addEventListener('change', updateMomentModeUI);
els.momentosLista.addEventListener('change', renderPhotoList);
els.downloadPptx.addEventListener('click', generatePptx);

updateMomentModeUI();
refreshSuggestedFileName();
renderPhotoList();
