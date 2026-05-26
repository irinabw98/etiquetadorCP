async function maybeCompressImage(dataUrl, mode){
  const img = await loadImage(dataUrl);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  const maxSide =
    mode === "high" ? 2200 :
    mode === "light" ? 1400 :
    Math.max(srcW, srcH);

  const ratio = Math.min(1, maxSide / Math.max(srcW, srcH));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(srcW * ratio);
  canvas.height = Math.round(srcH * ratio);

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const quality =
    mode === "light" ? .78 :
    mode === "high" ? .92 :
    .95;

  return canvas.toDataURL("image/jpeg", quality);
}

function renderPhotoItem(photo, treatments){
  const rotation = Number(photo.rotation || 0);
  const previewStyle = rotation ? `style="transform:rotate(${rotation}deg);"` : "";
  return `
    <div class="photo-item">
      <img src="${photo.dataUrl}" alt="${escapeHtml(photo.fileName)}" ${previewStyle}>
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

async function makeLabeledImage(photo, meta){
  const img = await loadImage(photo.dataUrl);
  const rotation = ((Number(photo.rotation || 0) % 360) + 360) % 360;
  const rotated = rotation % 180 !== 0;

  const baseW = photo.width || img.naturalWidth || img.width;
  const baseH = photo.height || img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = rotated ? baseH : baseW;
  canvas.height = rotated ? baseW : baseH;

  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
  ctx.restore();

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

  const quality = meta.qualityMode === "light" ? .82 : .95;
  return canvas.toDataURL("image/jpeg", quality);
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
    const rotation = ((Number(photo.rotation || 0) % 360) + 360) % 360;
    const rotated = rotation % 180 !== 0;
    const fitW = rotated ? photo.height : photo.width;
    const fitH = rotated ? photo.width : photo.height;
    const fit = fitContain(fitW, fitH, cellW, imgH);

    slide.addShape("rect",{x,y:area.y,w:cellW,h:imgH,fill:{color:"FFFFFF",transparency:0},line:{color:"E7DEF5"}});

    slide.addImage({
      data:photo.dataUrl,
      x:x + fit.x,
      y:area.y + fit.y,
      w:fit.w,
      h:fit.h,
      rotate:rotation
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
