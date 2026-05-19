# Generador de PowerPoint · Etiquetador de fotos

Aplicación web estática y personal para cargar fotos por momento, asignar tratamientos y generar resultados descargables.

## Mensaje de la herramienta

> Si llegaste a esta página, quiero que sepas que es un desarrollo personal hecho con mucho aprendizaje. Espero que te sea útil. ¡Gracias!

## Archivos del repositorio

Subir todos estos archivos a la raíz del repositorio:

```text
index.html
styles.css
app.js
pptxgen.bundle.js
fondo-default.jpg
README.md
```

## Funciones principales

- Estilo visual violeta.
- Instrucciones de uso desplegables.
- Carga de fotos por momento mediante cajas de arrastrar y soltar.
- Autoasignación de tratamientos por bloques consecutivos dentro de cada momento.
- Paso único de fotos y exportación.
- Persistencia local automática en el navegador.
- Selector de calidad:
  - Calidad original, seleccionada por defecto.
  - Alta calidad.
  - Liviano.
- Etiqueta técnica por defecto.
- Descarga de fotos etiquetadas en ZIP.
- Descarga de PowerPoint en formato 16:9.
- Descarga completa con fotos + PowerPoint.
- PowerPoint con dos sectores:
  - Ordenado por momento.
  - Ordenado por tratamiento.

## Uso recomendado

1. Completar protocolo, trial y localidad.
2. Cargar tratamientos, uno por línea.
3. Cargar momentos, uno por línea. Para agregar fecha usar:

```text
14 DAA | 2026-05-20
28 DAA | 2026-06-03
```

4. Continuar a fotos y exportación.
5. Arrastrar las fotos dentro de la caja correspondiente a cada momento.
6. Presionar `Autoasignar tratamientos`.
7. Revisar o corregir manualmente las asignaciones.
8. Descargar fotos, PPT o descarga completa.

## Importante sobre PptxGenJS

Este paquete incluye `pptxgen.bundle.js` de forma local para evitar el error de carga desde CDN:

```text
No se cargó PptxGenJS
```

No borrar ese archivo del repositorio.

## Publicación en GitHub Pages

1. Crear o abrir el repositorio.
2. Subir todos los archivos a la raíz.
3. Ir a `Settings > Pages`.
4. En `Branch`, elegir `main`.
5. En carpeta, elegir `/root`.
6. Guardar.
7. Abrir la URL publicada por GitHub Pages.

## Nota sobre iPhone y HEIC

Si las fotos están en `.HEIC`, la app intenta convertirlas con `heic2any` desde CDN. Para evitar problemas, en iPhone conviene configurar:

```text
Ajustes > Cámara > Formatos > Más compatible
```

Así las nuevas fotos se guardan como JPG.


## Cambios de la versión v3

- Los tratamientos se separan únicamente por salto de línea, no por coma.
- El fondo `fondo-default.jpg` se convierte internamente a base64 antes de insertarlo en el PowerPoint.
- Las fotos descargadas tienen etiqueta técnica fina en la parte inferior.
- Los nombres de las fotos ya no llevan numeración inicial.
- El nombre sugerido del archivo usa `protocolo_trial_localidad_momento`; si hay más de un momento, usa `protocolo_trial_localidad_momentos`.


## Cambios de la versión v4

- El PowerPoint mantiene una sola carátula inicial.
- Cada sector tiene una visión/portada simple.
- Se eliminaron las subcarátulas por momento y por tratamiento.
- En las slides, el nombre de tratamiento o momento aparece debajo de cada foto, no arriba.
- Se corrigió el nombre automático del archivo: `protocolo_trial_localidad_momento` o `protocolo_trial_localidad_momentos`.
