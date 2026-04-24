import { useMemo, useRef, useState } from 'react'
import pptxgen from 'pptxgenjs'

const DEFAULT_BACKGROUND_URL = '/fondo-default.jpg'

const INITIAL_META = {
  protocolo: '',
  trial: '',
  localidad: '',
  momento: '',
  fecha: '',
  identificacionModo: 'tratamiento',
  fotosPorGrupo: '1',
  nombresGruposRaw: '',
  fondoDataUrl: DEFAULT_BACKGROUND_URL
}

const LAYOUTS = {
  1: [{ x: 0.78, y: 1.25, w: 11.78, h: 4.95 }],
  2: [
    { x: 0.72, y: 1.25, w: 5.75, h: 4.95 },
    { x: 6.86, y: 1.25, w: 5.75, h: 4.95 }
  ],
  3: [
    { x: 0.62, y: 1.25, w: 3.95, h: 4.95 },
    { x: 4.69, y: 1.25, w: 3.95, h: 4.95 },
    { x: 8.76, y: 1.25, w: 3.95, h: 4.95 }
  ]
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function normalizeOptions(raw) {
  return raw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function groupPhotosByName(items) {
  const map = new Map()
  items.forEach((item) => {
    const key = item.groupName?.trim() || 'Sin asignar'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map.entries()).map(([groupName, photos]) => ({ groupName, photos }))
}

function fitContain(imgW, imgH, boxW, boxH) {
  const imgRatio = imgW / imgH
  const boxRatio = boxW / boxH
  let w = boxW
  let h = boxH

  if (imgRatio > boxRatio) {
    h = boxW / imgRatio
  } else {
    w = boxH * imgRatio
  }

  return {
    w,
    h,
    xOffset: (boxW - w) / 2,
    yOffset: (boxH - h) / 2
  }
}

function getImageSize(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = dataUrl
  })
}

function buildLegend(meta, groupName) {
  const label = meta.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela'
  return [
    `Protocolo: ${meta.protocolo || '-'}`,
    `Trial: ${meta.trial || '-'}`,
    `Localidad: ${meta.localidad || '-'}`,
    `Momento: ${meta.momento || '-'}`,
    `Fecha: ${meta.fecha || '-'}`,
    `${label}: ${groupName || '-'}`
  ]
}

export default function App() {
  const [step, setStep] = useState(1)
  const [meta, setMeta] = useState(INITIAL_META)
  const [photos, setPhotos] = useState([])
  const [exportName, setExportName] = useState('Etiquetado_Fotos')
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState('')

  const bgInputRef = useRef(null)
  const photosInputRef = useRef(null)

  const options = useMemo(() => normalizeOptions(meta.nombresGruposRaw), [meta.nombresGruposRaw])
  const groupedPhotos = useMemo(() => groupPhotosByName(photos), [photos])

  const canContinue = useMemo(() => {
    return [meta.protocolo, meta.trial, meta.localidad, meta.momento, meta.fecha].every(Boolean)
  }, [meta])

  function updateMeta(field, value) {
    setMeta((prev) => ({ ...prev, [field]: value }))
  }

  async function handleBackgroundUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setMeta((prev) => ({ ...prev, fondoDataUrl: dataUrl }))
  }

  async function handlePhotoUpload(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const loaded = await Promise.all(
      files.map(async (file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        fileName: file.name,
        dataUrl: await fileToDataUrl(file),
        groupName: ''
      }))
    )

    setPhotos((prev) => [...prev, ...loaded])
    event.target.value = ''
  }

  function updatePhoto(id, patch) {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)))
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))
  }

  function autoAssignByBlocks() {
    const amount = Number(meta.fotosPorGrupo || 1)
    const label = meta.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela'
    const catalog = options.length ? options : []

    setPhotos((prev) =>
      prev.map((photo, index) => {
        const groupIndex = Math.floor(index / amount)
        return {
          ...photo,
          groupName: catalog[groupIndex] || `${label} ${groupIndex + 1}`
        }
      })
    )
  }

  async function generatePowerPoint() {
    if (!photos.length) {
      setMessage('Primero cargá fotos para generar el PowerPoint.')
      return
    }

    setIsExporting(true)
    setMessage('Generando PowerPoint...')

    try {
      const pptx = new pptxgen()
      pptx.layout = 'LAYOUT_WIDE'
      pptx.author = 'Irina + ChatGPT'
      pptx.company = 'Uso interno'
      pptx.subject = 'Etiquetado de fotos'
      pptx.title = exportName || 'Etiquetado_Fotos'
      pptx.lang = 'es-AR'
      pptx.theme = {
        headFontFace: 'Aptos Display',
        bodyFontFace: 'Aptos',
        lang: 'es-AR'
      }

      const slots = LAYOUTS[Number(meta.fotosPorGrupo)] || LAYOUTS[1]

      for (const group of groupedPhotos) {
        const slide = pptx.addSlide()

        if (meta.fondoDataUrl) {
          slide.addImage({ data: meta.fondoDataUrl, x: 0, y: 0, w: 13.333, h: 7.5 })
        } else {
          slide.background = { color: 'F8F6FF' }
        }

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.62,
          y: 0.22,
          w: 4.15,
          h: 0.48,
          rectRadius: 0.05,
          line: { color: '7248D1', transparency: 100 },
          fill: { color: '7248D1', transparency: 14 }
        })

        slide.addText(group.groupName, {
          x: 0.82,
          y: 0.31,
          w: 4.1,
          h: 0.22,
          fontFace: 'Aptos',
          bold: true,
          fontSize: 16,
          color: '4A2F9A',
          margin: 0,
          fit: 'shrink'
        })

        for (let i = 0; i < Math.min(group.photos.length, slots.length); i += 1) {
          const photo = group.photos[i]
          const box = slots[i]
          const imgSize = await getImageSize(photo.dataUrl)
          const fitted = fitContain(imgSize.width, imgSize.height, box.w, box.h)

          slide.addShape(pptx.ShapeType.roundRect, {
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
            rectRadius: 0.08,
            line: { color: 'C9B8F2', pt: 1.1 },
            fill: { color: 'FFFFFF' },
            shadow: {
              type: 'outer',
              color: '8572B2',
              blur: 1,
              angle: 45,
              distance: 1,
              opacity: 0.12
            }
          })

          slide.addImage({
            data: photo.dataUrl,
            x: box.x + fitted.xOffset,
            y: box.y + fitted.yOffset,
            w: fitted.w,
            h: fitted.h
          })
        }

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.55,
          y: 6.34,
          w: 12.22,
          h: 0.76,
          rectRadius: 0.05,
          line: { color: 'D8CEF4', pt: 0.8 },
          fill: { color: 'FFFFFF', transparency: 16 }
        })

        const legendRuns = buildLegend(meta, group.groupName).map((line, index, arr) => ({
          text: line,
          options: {
            breakLine: index < arr.length - 1
          }
        }))

        slide.addText(legendRuns, {
          x: 0.8,
          y: 6.5,
          w: 11.8,
          h: 0.46,
          fontFace: 'Aptos',
          fontSize: 10,
          color: '43306B',
          margin: 0,
          fit: 'shrink'
        })
      }

      await pptx.writeFile({ fileName: `${exportName || 'Etiquetado_Fotos'}.pptx` })
      setMessage('PowerPoint generado correctamente.')
    } catch (error) {
      console.error(error)
      setMessage('Hubo un problema al generar el archivo. Revisá la consola del navegador.')
    } finally {
      setIsExporting(false)
    }
  }

  function resetApp() {
    setMeta(INITIAL_META)
    setPhotos([])
    setExportName('Etiquetado_Fotos')
    setMessage('')
    setStep(1)
  }

  return (
    <div className="app-shell">
      <div className="background-orb background-orb-a"></div>
      <div className="background-orb background-orb-b"></div>

      <div className="container">
        <header className="hero">
          <div>
            <span className="eyebrow">PowerPoint builder</span>
            <h1>Etiquetador de fotos</h1>
            <p>
              Generá una presentación con una slide por tratamiento o parcela, usando tu fondo por default y el texto completo en cada slide.
            </p>
          </div>
          <div className="hero-badges">
            <span className="pill">Violeta</span>
            <span className="pill pill-outline">1, 2 o 3 fotos</span>
            <span className="pill pill-outline">PPTX descargable</span>
          </div>
        </header>

        <section className="stepper">
          <button className={`step ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1. Configuración</button>
          <button className={`step ${step === 2 ? 'active' : ''} ${!canContinue ? 'disabled' : ''}`} onClick={() => canContinue && setStep(2)}>2. Fotos y exportación</button>
        </section>

        {step === 1 && (
          <div className="grid two-cols">
            <section className="card">
              <div className="card-header">
                <h2>Datos generales</h2>
                <p>Estos datos se repiten en todas las slides.</p>
              </div>

              <div className="form-grid">
                <label>
                  <span>Protocolo</span>
                  <input value={meta.protocolo} onChange={(e) => updateMeta('protocolo', e.target.value)} placeholder="Ej: SP26ARGB02" />
                </label>

                <label>
                  <span>Trial</span>
                  <input value={meta.trial} onChange={(e) => updateMeta('trial', e.target.value)} placeholder="Ej: 240315" />
                </label>

                <label>
                  <span>Localidad</span>
                  <input value={meta.localidad} onChange={(e) => updateMeta('localidad', e.target.value)} placeholder="Ej: Pergamino" />
                </label>

                <label>
                  <span>Momento</span>
                  <input value={meta.momento} onChange={(e) => updateMeta('momento', e.target.value)} placeholder="Ej: 14 DAA" />
                </label>

                <label>
                  <span>Fecha</span>
                  <input type="date" value={meta.fecha} onChange={(e) => updateMeta('fecha', e.target.value)} />
                </label>

                <label>
                  <span>Identificar por</span>
                  <select value={meta.identificacionModo} onChange={(e) => updateMeta('identificacionModo', e.target.value)}>
                    <option value="tratamiento">Tratamiento</option>
                    <option value="parcela">Parcela</option>
                  </select>
                </label>

                <label>
                  <span>Fotos por grupo</span>
                  <select value={meta.fotosPorGrupo} onChange={(e) => updateMeta('fotosPorGrupo', e.target.value)}>
                    <option value="1">1 foto</option>
                    <option value="2">2 fotos</option>
                    <option value="3">3 fotos</option>
                  </select>
                </label>
              </div>

              <label className="textarea-wrap">
                <span>Nombres de tratamientos o parcelas</span>
                <textarea
                  value={meta.nombresGruposRaw}
                  onChange={(e) => updateMeta('nombresGruposRaw', e.target.value)}
                  placeholder={meta.identificacionModo === 'tratamiento' ? 'Ejemplo:\nTestigo\nT1\nT2\nT3' : 'Ejemplo:\nP1\nP2\nP3'}
                />
              </label>

              <div className="actions-row">
                <button className="button secondary" onClick={() => bgInputRef.current?.click()}>Cambiar fondo</button>
                <button className="button ghost" onClick={() => setMeta((prev) => ({ ...prev, fondoDataUrl: DEFAULT_BACKGROUND_URL }))}>Usar fondo por default</button>
                <input ref={bgInputRef} type="file" accept="image/*" hidden onChange={handleBackgroundUpload} />
              </div>

              <div className="actions-row">
                <button className="button primary" disabled={!canContinue} onClick={() => setStep(2)}>
                  Continuar a fotos
                </button>
                <button className="button ghost" onClick={resetApp}>Reiniciar</button>
              </div>
            </section>

            <section className="card preview-card">
              <div className="card-header">
                <h2>Vista del fondo</h2>
                <p>La app arranca con tu imagen de fondo por default.</p>
              </div>

              <div className="slide-preview">
                <img src={meta.fondoDataUrl} alt="Fondo default" />
                <div className="preview-title">{meta.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela'} ejemplo</div>
                <div className="preview-caption">
                  Protocolo · Trial · Localidad · Momento · Fecha · {meta.identificacionModo === 'tratamiento' ? 'Tratamiento' : 'Parcela'}
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="grid two-cols second-step">
            <section className="card tall-card">
              <div className="card-header">
                <h2>Fotos</h2>
                <p>Cargá las imágenes y asignales tratamiento o parcela.</p>
              </div>

              <div className="actions-row wrap">
                <button className="button primary" onClick={() => photosInputRef.current?.click()}>Cargar fotos</button>
                <button className="button secondary" onClick={autoAssignByBlocks}>Autoasignar por bloques</button>
                <input ref={photosInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
              </div>

              <div className="hint-box">
                Si las fotos ya están ordenadas, la autoasignación reparte cada bloque según la cantidad de fotos por tratamiento/parcela que elegiste.
              </div>

              <div className="photo-list">
                {photos.length === 0 ? (
                  <div className="empty-state">Todavía no cargaste fotos.</div>
                ) : (
                  photos.map((photo, index) => (
                    <div className="photo-row" key={photo.id}>
                      <div className="thumb-wrap">
                        <img src={photo.dataUrl} alt={photo.fileName} className="thumb" />
                      </div>

                      <div className="photo-fields">
                        <strong>Foto {index + 1}</strong>
                        <small>{photo.fileName}</small>

                        {options.length > 0 ? (
                          <select value={photo.groupName} onChange={(e) => updatePhoto(photo.id, { groupName: e.target.value })}>
                            <option value="">Seleccionar {meta.identificacionModo}</option>
                            {options.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={photo.groupName}
                            onChange={(e) => updatePhoto(photo.id, { groupName: e.target.value })}
                            placeholder={`Escribí ${meta.identificacionModo}`}
                          />
                        )}
                      </div>

                      <button className="icon-button" onClick={() => removePhoto(photo.id)} title="Eliminar">×</button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card tall-card right-column">
              <div className="card-header">
                <h2>Exportación</h2>
                <p>Se genera una slide por tratamiento/parcela.</p>
              </div>

              <label>
                <span>Nombre del archivo</span>
                <input value={exportName} onChange={(e) => setExportName(e.target.value)} placeholder="Etiquetado_Fotos" />
              </label>

              <div className="stats-grid">
                <div className="stat-box">
                  <span>Slides</span>
                  <strong>{groupedPhotos.length}</strong>
                </div>
                <div className="stat-box">
                  <span>Fotos</span>
                  <strong>{photos.length}</strong>
                </div>
              </div>

              <div className="hint-box">
                El diseño usa tonos violetas, tarjetas suaves y una leyenda inferior elegante para que quede prolijo aun cuando lo compartas más adelante.
              </div>

              <div className="actions-row wrap">
                <button className="button ghost" onClick={() => setStep(1)}>Volver</button>
                <button className="button primary" disabled={isExporting} onClick={generatePowerPoint}>
                  {isExporting ? 'Generando...' : 'Descargar PowerPoint'}
                </button>
              </div>

              {message && <div className="status-box">{message}</div>}

              <div className="group-preview-list">
                {groupedPhotos.length === 0 ? (
                  <div className="empty-state small">Cuando asignes las fotos, acá vas a ver el resumen de slides.</div>
                ) : (
                  groupedPhotos.map((group) => (
                    <div className="group-preview" key={group.groupName}>
                      <div className="group-preview-head">
                        <strong>{group.groupName}</strong>
                        <span>{group.photos.length} foto(s)</span>
                      </div>
                      <div className={`mini-grid cols-${Math.min(Number(meta.fotosPorGrupo), 3)}`}>
                        {group.photos.slice(0, Number(meta.fotosPorGrupo)).map((photo) => (
                          <img key={photo.id} src={photo.dataUrl} alt={photo.fileName} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
