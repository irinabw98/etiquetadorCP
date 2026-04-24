# Etiquetador CP

Aplicación web estática para etiquetar fotos de ensayos y generar un PowerPoint descargable usando un fondo institucional por default.

## Archivos del repo

Subí estos archivos a la raíz del repositorio:

```txt
index.html
styles.css
app.js
pptxgen.bundle.js
fondo-default.jpg
README.md
```

## Uso

1. Abrí la app publicada en GitHub Pages.
2. Completá Protocolo, Trial y Localidad.
3. Elegí si vas a cargar un solo momento o varios momentos.
4. Si cargás varios momentos, escribilos uno por línea. Podés usar este formato:

```txt
A1 | 2026-04-20
A2 | 2026-05-05
A3 | 2026-05-18
```

5. Cargá los tratamientos o parcelas.
6. Elegí cuántas slides querés por tratamiento/parcela. Por default es 1.
7. Subí las fotos.
8. Asigná tratamiento/parcela y, si corresponde, momento.
9. Descargá el PowerPoint.

## Lógica de slides

- Si usás un solo momento, agrupa por tratamiento/parcela.
- Si usás varios momentos, agrupa por momento + tratamiento/parcela.
- Si elegís 2 slides y un tratamiento tiene 4 fotos, divide 2 fotos en cada slide.
- Si elegís 3 slides y un tratamiento tiene 7 fotos, reparte las fotos lo más parejo posible.

## Nombre sugerido del PowerPoint

- Un solo momento: `Protocolo-Trial-Momento`
- Varios momentos: `Protocolo-Trial`

## Fondo por default

El fondo fijo es:

```txt
fondo-default.jpg
```

Para cambiarlo, reemplazá ese archivo por otra imagen 16:9 con el mismo nombre. Desde la app también podés cargar otro fondo para una exportación puntual.

## GitHub Pages

En GitHub:

1. Entrá al repositorio.
2. Andá a **Settings > Pages**.
3. En **Source**, elegí `Deploy from a branch`.
4. Seleccioná la rama `main` y carpeta `/root`.
5. Guardá.



## Cambios v3

- El texto de la etiqueta inferior del PowerPoint queda centrado y con mayor tamaño, sin agrandar la banda.
- El botón **Autoasignar por bloques** ahora toma las fotos en orden consecutivo por tratamiento/parcela. Ejemplo: si hay 3 tratamientos y 9 fotos, asigna fotos 1-3 al tratamiento 1, 4-6 al tratamiento 2 y 7-9 al tratamiento 3.
- Si se trabaja con varios momentos, primero divide las fotos por momento en bloques consecutivos y dentro de cada momento reparte por tratamiento/parcela en bloques consecutivos.
