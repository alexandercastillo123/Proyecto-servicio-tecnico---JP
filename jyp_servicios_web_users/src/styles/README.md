# Estilos — JyP Servicios Técnicos

Este directorio concentra el CSS de la aplicación. El objetivo es que cada
archivo tenga una responsabilidad clara y que las utilidades de Tailwind sigan
teniendo prioridad sobre los componentes.

## Punto de entrada

`src/index.css` solo importa Tailwind, Leaflet y los módulos de este directorio.
No debe contener reglas de componentes.

## Orden de capas

```css
@layer theme, base, components, utilities, pages;
```

| Capa | Uso |
| --- | --- |
| `theme` | Variables generadas por `@theme` de Tailwind. |
| `base` | Documento y elementos nativos (`body`, `h1`, scrollbar, selección). |
| `components` | Clases reutilizables (`.jyp-card`, `.app-header`, `.btn-primary`, etc.). |
| `utilities` | Utilidades propias (`.no-scrollbar`, `.gradient-text`, fondos). |
| `pages` | CSS autocontenido de páginas concretas, como autenticación. |

Las utilidades de Tailwind viven en `utilities`, por lo que **siempre ganan** a
las clases de `components`. Eso permite escribir, por ejemplo:

```jsx
<div className="jyp-card p-8 rounded-3xl" />
```

sin que `.jyp-card` imponga su padding o radio.

La capa `pages` se reserva para diseños que deben conservar su apariencia exacta
aunque el JSX use utilidades. Actualmente la usa `pages/auth.css` (login,
registro y recuperación de contraseña).

## Archivos

- `tokens.css`: colores, superficies, texto, radios, sombras y tokens heredados.
- `base.css`: estilos globales del documento.
- `layout.css`: shell de la app (`app-*`) y contenedores de página (`jyp-*`).
- `utilities.css`: utilidades propias.
- `components/`: superficies, botones, formularios, badges, tablas, modales,
  feedback y animaciones.
- `third-party/leaflet.css`: overrides de mapas.
- `pages/auth.css`: estilos de las pantallas de autenticación.

## Reglas de mantenimiento

1. No usar resets universales (`* { margin: 0; padding: 0; }`). Tailwind
   Preflight ya normaliza los elementos; un reset fuera de capas anula las
   utilidades de espaciado.
2. Toda regla nueva debe ir dentro de `@layer base`, `components`,
   `utilities` o `pages`.
3. Los tokens nuevos van en `tokens.css`, no dispersos en componentes.
4. Evitar `!important`; solo se acepta en overrides de terceros (Leaflet).
5. Para nuevas páginas, preferir utilidades de Tailwind y las clases de
   `components/`. Usar la capa `pages` solo si el diseño es autocontenido.
6. No agregar colores hexadecimales nuevos en JSX; consumir tokens o clases
   semánticas.
