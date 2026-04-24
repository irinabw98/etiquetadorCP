# Etiquetador de Fotos para PowerPoint

Aplicación web simple para generar un PowerPoint con fotos etiquetadas por tratamiento o parcela.

## Qué hace

- Usa una imagen de fondo por default (`fondo-default.jpg`).
- Permite cambiar el fondo desde la interfaz.
- Carga fotos en lote.
- Permite asignar cada foto a un tratamiento o parcela.
- Permite elegir 1, 2 o 3 fotos por tratamiento/parcela.
- Genera un archivo `.pptx` descargable.
- Crea una slide por cada tratamiento/parcela.

## Archivos que debe tener el repositorio

Subí estos archivos en la raíz del repo:

```txt
index.html
styles.css
app.js
fondo-default.jpg
README.md
```

No hace falta instalar Node, Vite ni React. Es una app estática.

## Cómo publicarla en GitHub Pages

1. Crear un repositorio nuevo en GitHub.
2. Subir todos los archivos de este proyecto a la raíz del repositorio.
3. Ir a **Settings**.
4. Entrar a **Pages**.
5. En **Build and deployment**, elegir:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
6. Guardar.
7. Esperar unos minutos.
8. Abrir el link que te da GitHub Pages.

## Cómo cambiar el fondo default

Reemplazá el archivo:

```txt
fondo-default.jpg
```

por otra imagen con el mismo nombre.

Recomendación: usar una imagen 16:9, por ejemplo 1366 x 768 px o 1920 x 1080 px.

## Uso de la app

1. Completar:
   - Protocolo
   - Trial
   - Localidad
   - Momento
   - Fecha
2. Elegir si se identifica por tratamiento o parcela.
3. Elegir si cada grupo tendrá 1, 2 o 3 fotos.
4. Cargar los nombres de tratamientos/parcelas.
5. Pasar a la pantalla de fotos.
6. Cargar las imágenes.
7. Asignar cada imagen a un tratamiento/parcela.
8. Descargar PowerPoint.

## Nota importante

La generación del PowerPoint usa la librería `pptxgenjs` desde CDN:

```html
https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js
```

Por eso, para generar el PowerPoint hace falta conexión a internet. La interfaz puede verse igual, pero la descarga del PPTX necesita que esa librería cargue correctamente.
