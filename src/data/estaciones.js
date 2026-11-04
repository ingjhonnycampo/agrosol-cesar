// ===== AGROSOL · ESTACIONES =====
// Una entrada por lugar de estudio. Para agregar una estación nueva basta copiar un bloque.
// La clave de LECTURA de ThingSpeak NO va aquí: se guarda como variable de entorno
// con el nombre que diga `claveEnv` (en .env.local y en Vercel).

export const ESTACIONES = [
  {
    id: "colegio",
    nombre: "Colegio · Bosconia",
    lugar: "Bosconia, Cesar, Colombia",
    lat: 9.977571,     // tomada con Google Maps el 3-nov-2026 junto a la estación (Cl. 23 #6-1)
    lon: -73.893476,
    altitud: null,     // metros sobre el nivel del mar (opcional)
    canal: 3535105,    // canal de ThingSpeak
    claveEnv: "THINGSPEAK_READ_KEY",
    cultivo: "",       // cultivo en estudio (opcional)
    instalada: "2026-10-01", // fecha aproximada de instalación
    // Fotos: archivos en public/estaciones/<id>/ (se sirven desde /estaciones/<id>/...)
    fotos: [
      { src: "/estaciones/colegio/Estacion2.jpeg", titulo: "La estación frente al muro del colegio" },
      { src: "/estaciones/colegio/Estacion1.jpeg", titulo: "La estación junto a la cancha, al atardecer" },
      { src: "/estaciones/colegio/estacion-1.jpg", titulo: "Ubicación georreferenciada de la estación", fecha: "3 de noviembre de 2026" },
    ],
    // Humedad del suelo calibrada el 3-nov-2026: lectura cruda con el sensor seco al aire y en agua
    calibracion: {
      suelo10: { seco: 0, humedo: 591 },
      suelo30: { seco: 54, humedo: 600 }, // sensor nuevo (3-nov-2026). Seco medido al aire; 312 en un vaso de agua, pero enterrado en suelo mojado llega a ~590, así que el tope se tomó del suelo. Afinar con más días.
    },   // ajustes propios de esta estación (sobrescriben CONFIG de limpieza.js)
  },
];

export const ESTACION_INICIAL = ESTACIONES[0].id;

export const buscarEstacion = (id) => ESTACIONES.find((e) => e.id === id) || null;
