// Función de Vercel: lee ThingSpeak (escondido) y entrega los datos YA LIMPIOS a la página.
// Uso: /api/datos?estacion=colegio   (sin parámetro usa la primera estación)
// La clave de LECTURA de cada estación se guarda en Vercel como variable de entorno
// (el nombre está en `claveEnv` de src/data/estaciones.js). Nunca va en el código.
import { CONFIG, procesar } from "../src/lib/limpieza.js";
import { ESTACIONES, buscarEstacion } from "../src/data/estaciones.js";

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, "http://x").searchParams.get("estacion") || ESTACIONES[0].id;
    const est = buscarEstacion(id);
    if (!est) return res.status(404).json({ error: "Estación desconocida: " + id });

    const clave = process.env[est.claveEnv];
    const url = `https://api.thingspeak.com/channels/${est.canal}/feeds.json?results=8000` +
      (clave ? `&api_key=${clave}` : "");
    const r = await fetch(url);
    if (!r.ok) throw new Error("ThingSpeak respondió " + r.status);
    const j = await r.json();
    if (!Array.isArray(j.feeds)) throw new Error("ThingSpeak no envió datos (¿clave de lectura correcta?)");
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({ estacion: id, ...procesar(j.feeds, { ...CONFIG, ...est.calibracion }) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
