# Landing JyP Servicios Técnicos

Landing informativa y promocional, creada como una aplicación independiente con React y Vite. No utiliza el backend, las rutas ni las dependencias del portal `jyp_servicios_web_users`.

## Requisitos

- Node.js 18 o superior
- npm

## Ejecutar en desarrollo

Desde esta carpeta:

```bash
npm install
npm run dev
```

Vite mostrará la dirección local para abrir la landing en el navegador.

## Compilar para publicar

```bash
npm run build
npm run preview
```

Los archivos listos para publicar se generan en `dist/`. La landing es estática y los botones de contacto abren WhatsApp.

## Enlace de WhatsApp

El enlace provisional está definido en `src/App.jsx` como `https://wa.me/51xxxxxxxxx`. Antes de publicar, reemplaza `51xxxxxxxxx` por el código de país y el número real, solo con dígitos y sin `+`, espacios ni guiones. Por ejemplo, Perú usa el prefijo `51`.

## Fotografías

Las fotos que se muestran están guardadas localmente en `public/assets`, así que no requieren una conexión externa:

- Técnico trabajando en un taller: [Unsplash](https://images.unsplash.com/photo-1581092160607-ee22621dd758)
- Reparación electrónica: [Unsplash](https://images.unsplash.com/photo-1581092921461-eab62e97a780)
- Planificación técnica: [Unsplash](https://images.unsplash.com/photo-1581092160562-40aa08e78837)
- Coordinación de servicios: [Unsplash](https://images.unsplash.com/photo-1519389950473-47ba0277781c)
- Componentes electrónicos: [Unsplash](https://images.unsplash.com/photo-1518770660439-4636190af475)
- Equipos de cómputo: [Unsplash](https://images.unsplash.com/photo-1587202372775-e229f172b9d7)
- Servidores y redes: [Unsplash](https://images.unsplash.com/photo-1558494949-ef010cbdcc31)
- Accesorios tecnológicos: [Unsplash](https://images.unsplash.com/photo-1498049794561-7780e7231661)
- Productos tecnológicos: [Unsplash](https://images.unsplash.com/photo-1496181133206-80ce9b88a853)

La landing incluye secciones de soluciones, plataforma, pasos, públicos y preguntas frecuentes. El carrusel de “Cómo funciona” avanza cada 4 segundos mientras está visible, se detiene al llegar al último paso y se pausa durante la interacción. También permite usar los controles o deslizar en pantallas táctiles, y respeta la preferencia de movimiento reducido del dispositivo.
