# Etiquetador de fotos para PowerPoint

Aplicación web hecha con **React + Vite + PptxGenJS** para generar un PowerPoint descargable con una slide por tratamiento o parcela.

## Qué hace

- Usa una **imagen de fondo por default**.
- Permite **cambiar el fondo** si lo necesitás.
- Te pide estos datos generales:
  - Protocolo
  - Trial
  - Localidad
  - Momento
  - Fecha
- Te deja elegir si las fotos se identifican por **tratamiento** o por **parcela**.
- Te deja definir si cada slide tendrá **1, 2 o 3 fotos**.
- Podés cargar una lista de nombres de tratamientos/parcelas para usarlos como desplegable.
- Genera un **archivo `.pptx` descargable**.

## Estructura del proyecto

```bash
etiquetador-fotos-app/
├── public/
│   └── fondo-default.jpg
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Instalación local

1. Abrí una terminal en la carpeta del proyecto.
2. Instalá dependencias:

```bash
npm install
```

3. Levantá la app:

```bash
npm run dev
```

4. Para compilar:

```bash
npm run build
```

## Cómo subirlo a GitHub

1. Creá un repositorio nuevo.
2. Subí todos estos archivos respetando la estructura.
3. Verificá que la imagen por default quede en:

```bash
public/fondo-default.jpg
```

4. Si querés publicar con GitHub Pages, podés usar el contenido de la carpeta `dist` después de correr:

```bash
npm run build
```

## Personalizaciones rápidas

### 1. Cambiar el fondo por default
Reemplazá este archivo:

```bash
public/fondo-default.jpg
```

### 2. Cambiar colores violetas
Editá las variables al inicio de:

```bash
src/styles.css
```

Buscá este bloque:

```css
:root {
  --primary: #7a4de8;
  --primary-dark: #5f33c8;
  --primary-soft: #efe6ff;
}
```

### 3. Ajustar posiciones de fotos en el PowerPoint
En `src/App.jsx`, modificá este objeto:

```js
const LAYOUTS = {
  1: [...],
  2: [...],
  3: [...]
}
```

## Flujo de uso

1. Completás los datos generales.
2. Elegís si trabajás por tratamiento o parcela.
3. Indicás si querés 1, 2 o 3 fotos por slide.
4. Cargás la lista de nombres.
5. Pasás a la segunda pantalla.
6. Subís las fotos.
7. Asignás a cada foto su tratamiento/parcela.
8. Descargás el PowerPoint.

## Notas

- Si cargás más fotos de las permitidas para un grupo, en la exportación se usan las primeras según el layout seleccionado.
- La app está pensada para uso interno, pero ya queda con una base linda para compartir más adelante.
- El fondo por default ya está incluido en este proyecto.

## Próximas mejoras posibles

- Arrastrar y soltar fotos.
- Reordenar fotos dentro de cada tratamiento.
- Vista previa más fiel al PPT final.
- Exportar también PDF.
- Guardar configuraciones frecuentes.
