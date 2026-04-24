const DEFAULT_BACKGROUND_URL = 'fondo-default.jpg';

const state = {
  step: 1,
  backgroundSrc: DEFAULT_BACKGROUND_URL,
  backgroundIsDataUrl: false,
  photos: []
};

const $ = (id) => document.getElementById(id);

const els = {
  stepPill: $('stepPill'),
  tabStep1: $('tabStep1'),
  tabStep2: $('tabStep2'),
  step1: $('step1'),
  step2: $('step2'),
  protocolo: $('protocolo'),
  trial: $('trial'),
  localidad: $('localidad'),
  momento: $('momento'),
  fecha: $('fecha'),
  identificacionModo: $('identificacionModo'),
  fotosPorGrupo: $('fotosPorGrupo'),
  nombresGrupos: $('nombresGrupos'),
  goStep2: $('goStep2'),
  changeBg: $('changeBg'),
  resetBg: $('resetBg'),
  bgInput: $('bgInput'),
  backgroundPreview: $('backgroundPreview'),
  uploadPhotosBtn: $('uploadPhotosBtn'),
  photoInput: $('photoInput'),
  autoAssignBtn: $('autoAssignBtn'),
  photoList: $('photoList'),
  photoCounter: $('photoCounter'),
  slideCount: $('slideCount'),
  assignedCount: $('assignedCount'),
  fileName: $('fileName'),
  backStep1: $('backStep1'),
  downloadPptx: $('downloadPptx'),
  groupPreview: $('groupPreview')
};

const PPT_LAYOUTS = {
  1: [{ x: 0.78, y: 1.28, w: 11.78, h: 4.72 }],
  2: [
    { x: 0.72, y: 1.28, w: 5.75, h: 4.72 },
    { x: 6.86, y: 1.28, w: 5.75, h: 4.72 }
  ],
  3: [
    { x: 0.62, y: 1.28, w: 3.95, h: 4.72 },
    { x: 4.69, y: 1.28, w: 3.95, h: 4.72 },
    { x: 8.76, y: 1.28, w: 3.95, h: 4.72 }
  ]
};

function meta() {
  return {
    protocolo: els.protocolo.value.trim(),
    trial: els.trial.value.trim(),
    localidad: els.localidad.value.trim(),
    momento: els.momento.value.trim(),
    fecha: els.fecha.value,
    identificacionModo: els.identificacionModo.value,
    fotosPorGrupo: Number(els.fotosPorGrupo.value || 1),
    nombresGruposRaw: els.nombresGrupos.value
  };
}

function normalizeOptions(raw) {
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToDataUrl(url) {
  if (url.startsWith('data:')) return url;
  const response = await fetch(url);
  const blob = await response.blob();
  return await fileToDataUrl(blob);
}

function getImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function fitContain(imgW, imgH, boxW, boxH) {
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  let w = boxW;
  let h = boxH;

  if (imgRatio > boxRatio) h = boxW / imgRatio;
  else w = boxH * imgRatio;

  return { w, h, xOffset: (boxW - w) / 2, yOffset: (boxH - h) / 2 };
}

function groupPhotos() {
  const map = new Map();
  state.photos.forEach((photo) => {
    const key = photo.groupName?.trim() || 'Sin asignar';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(photo);
  });
  return Array.from(map.entries()).map(([groupName, photos]) => ({ groupName, photos }));
}

function setStep(step) {
  state.step = step;
  els.step1.classList.toggle('active', step === 1);
  els.step2.classList.toggle('active', step === 2);
  els.tabStep1.classList.toggle('active', step === 1);
  els.tabStep2.classList.toggle('active', step === 2);
  els.stepPill.textContent = `Paso ${step} de 2`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
  const m = meta();
  const required = [m.protocolo, m.trial, m.localidad, m.momento, m.fecha];
  if (required.some((v) => !v)) {
    alert('Completá Protocolo, Trial, Localidad, Momento y Fecha antes de continuar.');
    return false;
  }
  return true;
}

function renderPhotoList() {
  els.photoCounter.textContent = `${state.photos.length} foto${state.photos.length === 1 ? '' : 's'}`;

  if (!state.photos.length) {
    els.photoList.className = 'photo-list empty';
    els.photoList.innerHTML = '<p>Todavía no cargaste fotos.</p>';
    renderGroupPreview();
    return;
  }

  const options = normalizeOptions(els.nombresGrupos.value);
  els.photoList.className = 'photo-list';
  els.photoList.innerHTML = '';

  state.photos.forEach((photo, index) => {
    const row = document.createElement('div');
    row.className = 'photo-row';

    const selectorHtml = options.length
      ? `<select data-action="group" data-id="${photo.id}">
          <option value="">Seleccionar...</option>
          ${options.map((opt) => `<option value="${escapeHtml(opt)}" ${photo.groupName === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
        </select>`
      : `<input data-action="group" data-id="${photo.id}" type="text" value="${escapeHtml(photo.groupName)}" placeholder="Escribir ${els.identificacionModo.value}" />`;

    row.innerHTML = `
      <img class="photo-thumb" src="${photo.dataUrl}" alt="${escapeHtml(photo.fileName)}" />
      <div>
        <p class="photo-title">Foto ${index + 1}</p>
        <p class="photo-name">${escapeHtml(photo.fileName)}</p>
        <label>${els.identificacionModo.value === 'tratamiento' ? 'Tratamiento' : 'Parcela'}${selectorHtml}</label>
      </div>
      <button class="delete-btn" type="button" data-action="delete" data-id="${photo.id}">×</button>
    `;
    els.photoList.appendChild(row);
  });

  renderGroupPreview();
}

function renderGroupPreview() {
  const groups = groupPhotos();
  const assigned = state.photos.filter((p) => p.groupName && p.groupName.trim()).length;
  els.slideCount.textContent = groups.length;
  els.assignedCount.textContent = assigned;

  if (!groups.length) {
    els.groupPreview.className = 'group-preview empty';
    els.groupPreview.innerHTML = '<p>No hay grupos todavía.</p>';
    return;
  }

  const cols = Number(els.fotosPorGrupo.value || 1);
  els.groupPreview.className = 'group-preview';
  els.groupPreview.innerHTML = groups.map((group) => `
    <div class="group-card">
      <h3>${escapeHtml(group.groupName)}</h3>
      <p>${group.photos.length} foto(s) · se usarán hasta ${cols} por slide</p>
      <div class="mini-grid cols-${cols}">
        ${group.photos.slice(0, cols).map((p) => `<img src="${p.dataUrl}" alt="${escapeHtml(p.fileName)}" />`).join('')}
      </div>
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildLegend(m, groupName) {
  const label = m.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela';
  return [
    `Protocolo: ${m.protocolo || '-'}`,
    `Trial: ${m.trial || '-'}`,
    `Localidad: ${m.localidad || '-'}`,
    `Momento: ${m.momento || '-'}`,
    `Fecha: ${m.fecha || '-'}`,
    `${label}: ${groupName || '-'}`
  ].join('   |   ');
}

async function generatePptx() {
  if (!state.photos.length) {
    alert('Primero cargá al menos una foto.');
    return;
  }

  if (typeof pptxgen === 'undefined') {
    alert('No se pudo cargar la librería para generar PowerPoint. Revisá que tengas conexión a internet o usá la versión con dependencias instaladas.');
    return;
  }

  const m = meta();
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Etiquetador de fotos';
  pptx.subject = 'Fotos etiquetadas';
  pptx.title = els.fileName.value.trim() || 'Etiquetado_Fotos';
  pptx.lang = 'es-AR';
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'es-AR'
  };

  const backgroundData = await urlToDataUrl(state.backgroundSrc);
  const photosPerGroup = Number(els.fotosPorGrupo.value || 1);
  const layout = PPT_LAYOUTS[photosPerGroup] || PPT_LAYOUTS[1];

  for (const group of groupPhotos()) {
    const slide = pptx.addSlide();
    slide.addImage({ data: backgroundData, x: 0, y: 0, w: 13.333, h: 7.5 });

    slide.addText(group.groupName || 'Sin asignar', {
      x: 0.72,
      y: 0.84,
      w: 6.8,
      h: 0.34,
      fontFace: 'Aptos Display',
      fontSize: 17,
      bold: true,
      color: '4B2385',
      margin: 0
    });

    for (let i = 0; i < Math.min(group.photos.length, photosPerGroup); i++) {
      const photo = group.photos[i];
      const box = layout[i];
      const size = await getImageSize(photo.dataUrl);
      const fitted = fitContain(size.width, size.height, box.w, box.h);

      slide.addShape(pptx.ShapeType.roundRect, {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        rectRadius: 0.08,
        line: { color: 'D8CCE9', pt: 1.2 },
        fill: { color: 'FFFFFF', transparency: 0 },
        shadow: { type: 'outer', color: '6D36B5', opacity: 0.12, blur: 1, angle: 45, distance: 1 }
      });

      slide.addImage({
        data: photo.dataUrl,
        x: box.x + fitted.xOffset,
        y: box.y + fitted.yOffset,
        w: fitted.w,
        h: fitted.h
      });
    }

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.65,
      y: 6.32,
      w: 12.02,
      h: 0.56,
      rectRadius: 0.06,
      line: { color: 'D8CCE9', pt: 0.8 },
      fill: { color: 'FFFFFF', transparency: 4 }
    });

    slide.addText(buildLegend(m, group.groupName), {
      x: 0.86,
      y: 6.48,
      w: 11.62,
      h: 0.24,
      fontFace: 'Aptos',
      fontSize: 9.2,
      color: '24113F',
      bold: true,
      margin: 0,
      fit: 'shrink'
    });
  }

  const safeName = (els.fileName.value.trim() || 'Etiquetado_Fotos').replace(/[\\/:*?"<>|]/g, '_');
  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}

els.goStep2.addEventListener('click', () => {
  if (validateStep1()) setStep(2);
});
els.tabStep1.addEventListener('click', () => setStep(1));
els.tabStep2.addEventListener('click', () => {
  if (validateStep1()) setStep(2);
});
els.backStep1.addEventListener('click', () => setStep(1));

els.changeBg.addEventListener('click', () => els.bgInput.click());
els.resetBg.addEventListener('click', () => {
  state.backgroundSrc = DEFAULT_BACKGROUND_URL;
  state.backgroundIsDataUrl = false;
  els.backgroundPreview.src = DEFAULT_BACKGROUND_URL;
});
els.bgInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.backgroundSrc = await fileToDataUrl(file);
  state.backgroundIsDataUrl = true;
  els.backgroundPreview.src = state.backgroundSrc;
  event.target.value = '';
});

els.uploadPhotosBtn.addEventListener('click', () => els.photoInput.click());
els.photoInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []);
  const next = await Promise.all(files.map(async (file, index) => ({
    id: `${Date.now()}-${index}-${file.name}`,
    fileName: file.name,
    dataUrl: await fileToDataUrl(file),
    groupName: ''
  })));
  state.photos.push(...next);
  event.target.value = '';
  renderPhotoList();
});

els.photoList.addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset.action !== 'group') return;
  const photo = state.photos.find((p) => p.id === target.dataset.id);
  if (photo) photo.groupName = target.value;
  renderGroupPreview();
});
els.photoList.addEventListener('change', (event) => {
  const target = event.target;
  if (target.dataset.action !== 'group') return;
  const photo = state.photos.find((p) => p.id === target.dataset.id);
  if (photo) photo.groupName = target.value;
  renderGroupPreview();
});
els.photoList.addEventListener('click', (event) => {
  const target = event.target;
  if (target.dataset.action !== 'delete') return;
  state.photos = state.photos.filter((p) => p.id !== target.dataset.id);
  renderPhotoList();
});

els.autoAssignBtn.addEventListener('click', () => {
  const m = meta();
  const options = normalizeOptions(m.nombresGruposRaw);
  if (!options.length) {
    alert('Primero cargá la lista de tratamientos/parcelas en el Paso 1.');
    return;
  }
  state.photos = state.photos.map((photo, index) => ({
    ...photo,
    groupName: options[Math.floor(index / m.fotosPorGrupo)] || ''
  }));
  renderPhotoList();
});

els.fotosPorGrupo.addEventListener('change', renderGroupPreview);
els.nombresGrupos.addEventListener('change', renderPhotoList);
els.identificacionModo.addEventListener('change', renderPhotoList);
els.downloadPptx.addEventListener('click', generatePptx);

renderPhotoList();
