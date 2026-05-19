# Etiquetador de fotos

Aplicación web estática para cargar fotos por momento, asignar tratamientos y generar resultados descargables.

## Funciones principales

- Carga de fotos por momento mediante cajas de arrastrar y soltar.
- Autoasignación de tratamientos por bloques consecutivos dentro de cada momento.
- Persistencia local automática en el navegador mediante IndexedDB.
- Selector de calidad de imagen:
  - Calidad original
  - Alta calidad
  - Liviano
- Etiqueta técnica por defecto.
- Descarga de fotos etiquetadas en ZIP.
- Descarga de PowerPoint en formato 16:9.
- Descarga completa con fotos + PowerPoint.
- PowerPoint con dos sectores:
  - Sector 1: ordenado por momento.
  - Sector 2: ordenado por tratamiento.
- Soporte para JPG, PNG, WebP y HEIC/HEIF si la librería `heic2any` carga correctamente.

## Estructura del repositorio

Subir estos archivos a la raíz del repo:

```text
index.html
styles.css
app.js
README.md
fondo-default.jpg
```

## Publicación en GitHub Pages

1. Crear o abrir el repositorio en GitHub.
2. Subir todos los archivos a la raíz.
3. Ir a `Settings > Pages`.
4. En `Branch`, elegir `main`.
5. En carpeta, elegir `/root`.
6. Guardar.
7. Abrir la URL publicada por GitHub Pages.

## Uso recomendado

1. Completar protocolo, trial y localidad.
2. Cargar tratamientos, uno por línea.
3. Cargar momentos, uno por línea. Para agregar fecha usar:

```text
14 DAA | 2026-05-20
28 DAA | 2026-06-03
```

4. Continuar a la pantalla de fotos.
5. Arrastrar las fotos dentro de la caja correspondiente a cada momento.
6. Presionar `Autoasignar tratamientos`.
7. Revisar o corregir manualmente las asignaciones.
8. Descargar fotos, PPT o descarga completa.

## Lógica de autoasignación

Si un momento tiene 9 fotos y hay 3 tratamientos:

```text
Fotos 1 a 3   -> Tratamiento 1
Fotos 4 a 6   -> Tratamiento 2
Fotos 7 a 9   -> Tratamiento 3
```

La asignación se hace de forma independiente dentro de cada momento.

## Nota sobre iPhone y HEIC

Si las fotos del iPhone están en formato `.HEIC`, la app intenta convertirlas en el navegador usando `heic2any` desde CDN. Para evitar problemas, en iPhone se recomienda:

```text
Ajustes > Cámara > Formatos > Más compatible
```

Así las nuevas fotos se guardan como JPG.

## Recomendaciones

- Para PowerPoint liviano, usar la calidad `Alta calidad` o `Liviano`.
- Para conservar máxima resolución, usar `Calidad original`.
- Para ensayos grandes, cargar las fotos por carpetas/momentos y luego autoasignar tratamientos.
