# Etiquetador CP

Aplicación web estática para etiquetar fotos y generar un PowerPoint descargable.

## Archivos del repo

Subir todos estos archivos a la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `pptxgen.bundle.js`
- `fondo-default.jpg`
- `README.md`

## Funciones principales

- Fondo institucional por default.
- Opción para cambiar el fondo.
- Opción **sin fondo**, donde la etiqueta se coloca sobre cada foto.
- Carga manual o por arrastrar y soltar.
- Carga de un momento o varios momentos.
- Cajas de carga separadas por momento.
- Autoasignación de tratamientos por bloques consecutivos.
- Exportación a PowerPoint `.pptx`.
- Compatibilidad con fotos comunes de iPhone en JPG/PNG.
- Soporte para HEIC/HEIF mediante la librería `heic2any` cargada desde CDN.

## Importante sobre fotos de iPhone

Si las fotos del iPhone están en formato `.HEIC`, la app intenta convertirlas a JPG en el navegador. Para eso necesita conexión a internet porque usa `heic2any` desde CDN.

Si alguna foto HEIC no carga, la alternativa más estable es configurar el iPhone en:

**Ajustes > Cámara > Formatos > Más compatible**

Así las nuevas fotos se guardan como JPG y la app las toma sin conversión.

## Publicación en GitHub Pages

1. Crear o abrir el repositorio.
2. Subir todos los archivos a la raíz.
3. Ir a **Settings > Pages**.
4. En **Branch**, elegir `main` y carpeta `/root`.
5. Guardar.
6. Abrir la URL publicada por GitHub Pages.
