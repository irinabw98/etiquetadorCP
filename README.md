# Etiquetador CP

Aplicación web estática para etiquetar fotos y generar un PowerPoint descargable con fondo institucional.

## Archivos que deben estar en la raíz del repo

- `index.html`
- `styles.css`
- `app.js`
- `pptxgen.bundle.js`
- `fondo-default.jpg`
- `README.md`

## Cómo usar

1. Completá Protocolo, Trial y Localidad.
2. Elegí si vas a trabajar con un solo momento o con varios momentos.
   - Para varios momentos, escribí un momento por línea.
   - Podés agregar fecha usando este formato: `Momento | 2026-04-20`.
3. Cargá los tratamientos o parcelas, uno por línea o separados por coma.
4. Indicá cuántas slides querés por tratamiento/parcela.
5. En la pantalla de fotos, arrastrá las imágenes a la caja correspondiente.
   - Si hay varios momentos, aparece una caja por cada momento.
   - Al soltar fotos en una caja, quedan asociadas automáticamente a ese momento.
6. Usá **Autoasignar tratamientos** para repartir las fotos en bloques consecutivos.
   - Ejemplo: 3 tratamientos y 9 fotos en un momento → fotos 1-3 Tratamiento 1, 4-6 Tratamiento 2, 7-9 Tratamiento 3.
7. Descargá el PowerPoint.

## Publicar en GitHub Pages

1. Subí todos los archivos a la raíz del repositorio.
2. Entrá a **Settings > Pages**.
3. En **Build and deployment**, elegí:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Guardá y esperá a que GitHub publique la página.

## Cambiar el fondo default

Reemplazá `fondo-default.jpg` por otra imagen con el mismo nombre. Recomendado: formato 16:9.
