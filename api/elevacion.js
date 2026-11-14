// Altura del terreno y pendiente en el punto de la estación, con SRTM (NASA) a 30 m.
// Se toma el punto y cuatro vecinos a ~280 m para estimar la pendiente. Uso: /api/elevacion?estacion=colegio
import { ESTACIONES, buscarEstacion } from "../src/data/estaciones.js";

const PASO = 0.0025; // grados (~277 m)

export default async function handler(req, res) {
  try {
    const id = new URL(req.url, "http://x").searchParams.get("estacion") || ESTACIONES[0].id;
    const est = buscarEstacion(id);
    if (!est) return res.status(404).json({ error: "Estación desconocida" });
    const pts = [[est.lat, est.lon], [est.lat + PASO, est.lon], [est.lat - PASO, est.lon], [est.lat, est.lon + PASO], [est.lat, est.lon - PASO]];
    const url = "https://api.opentopodata.org/v1/srtm30m?locations=" + pts.map((p) => p.join(",")).join("|");
    const r = await fetch(url);
    if (!r.ok) throw new Error("OpenTopoData respondió " + r.status);
    const j = await r.json();
    const z = (j.results || []).map((x) => x.elevation);
    if (z.length !== 5 || z.some((v) => typeof v !== "number")) throw new Error("No llegó la elevación");
    const distLat = PASO * 111320;
    const distLon = PASO * 111320 * Math.cos((est.lat * Math.PI) / 180);
    const pend = [Math.abs(z[1] - z[2]) / (2 * distLat), Math.abs(z[3] - z[4]) / (2 * distLon)];
    const pendiente = Math.round(Math.hypot(...pend) * 1000) / 10; // en %
    res.setHeader("Cache-Control", "s-maxage=2592000, stale-while-revalidate=7776000");
    res.status(200).json({
      estacion: id, elevacion: z[0], vecinos: { norte: z[1], sur: z[2], este: z[3], oeste: z[4] },
      pendiente, desnivel: Math.max(...z) - Math.min(...z), distancia: Math.round(distLat), fuente: url,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
