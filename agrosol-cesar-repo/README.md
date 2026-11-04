# AgroSol Cesar · Página pública

Página web (React + Vite) que muestra los datos de la estación **ya limpios e interpretados**.
ThingSpeak queda escondido: la función `api/datos.js` lo lee y aplica las reglas de `src/lib/limpieza.js`.

## Probar en el computador

1. Instalar **Node.js LTS** (https://nodejs.org) — una sola vez.
2. Copiar `.env.example` como `.env.local` y pegar la **Read API Key** de ThingSpeak.
3. En esta carpeta, abrir una terminal y escribir:
   ```
   npm install
   npm run dev
   ```
4. Abrir en el navegador la dirección que aparece (http://localhost:5173).

## Publicar en Vercel

1. Subir esta carpeta a un repositorio de GitHub (sin `node_modules` ni `.env.local`).
2. En vercel.com → Add New → Project → elegir el repositorio (Vercel detecta Vite solo).
3. En Settings → Environment Variables agregar `THINGSPEAK_READ_KEY` con la clave de lectura.
4. Deploy.

## Dónde está cada cosa

| Archivo | Qué hace |
|---|---|
| `api/datos.js` | Lee ThingSpeak y entrega los datos limpios |
| `src/lib/limpieza.js` | **Todas las reglas de limpieza y calibración** |
| `src/App.jsx` | La página |
| `src/components/Medidor.jsx` | Medidores animados |
| `src/components/Cielo.jsx` | Encabezado con cielo de día / atardecer / noche según la fotocelda |
