// Función de Vercel: pide a NASA POWER el clima y la humedad del suelo para la estación elegida.
// Uso: /api/nasa?estacion=colegio&desde=2026-10-01&hasta=2026-11-03
// NASA POWER es gratis y no necesita clave. Los datos diarios llegan con unos 3 a 7 días de retraso.
import { ESTACIONES, buscarEstacion } from "../src/data/estaciones.js";

const BASE = "https://power.larc.nasa.gov/api/temporal";
const MESES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const limpio = (v) => (typeof v === "number" && v > -900 ? Math.round(v * 100) / 100 : null);
const pct = (v) => (limpio(v) === null ? null : Math.round(limpio(v) * 100));
const yyyymmdd = (iso) => iso.replace(/-/g, "");
const iso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

async function pedir(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("NASA POWER respondió " + r.status);
  const j = await r.json();
  if (!j?.properties?.parameter) throw new Error("NASA POWER no envió datos");
  return j;
}

export default async function handler(req, res) {
  try {
    const q = new URL(req.url, "http://x").searchParams;
    const est = buscarEstacion(q.get("estacion") || ESTACIONES[0].id);
    if (!est) return res.status(404).json({ error: "Estación desconocida" });

    const punto0 = `community=AG&longitude=${est.lon}&latitude=${est.lat}&format=JSON`;

    // Historial diario 2001–2025 (clima de 25 años) en arreglos compactos, para simular qué habría pasado cada año
    if (q.get("historial")) {
      const h = await pedir(`${BASE}/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR&${punto0}&start=20010101&end=20251231`);
      const hp = h.properties.parameter;
      const dias = Object.keys(hp.T2M);
      const col = (nombre) => dias.map((k) => limpio(hp[nombre][k]));
      res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate=2592000");
      return res.status(200).json({
        estacion: est.id, inicio: iso(dias[0]), fin: iso(dias[dias.length - 1]),
        t2m: col("T2M"), tmax: col("T2M_MAX"), tmin: col("T2M_MIN"), lluvia: col("PRECTOTCORR"),
      });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    let hasta = FECHA.test(q.get("hasta") || "") ? q.get("hasta") : hoy;
    if (hasta > hoy) hasta = hoy;
    let desde = FECHA.test(q.get("desde") || "") ? q.get("desde") : new Date(Date.parse(hasta) - 59 * 86400000).toISOString().slice(0, 10);
    const minimo = new Date(Date.parse(hasta) - 365 * 86400000).toISOString().slice(0, 10); // máximo un año por pedido
    if (desde < minimo) desde = minimo;
    if (desde > hasta) desde = hasta;

    const punto = `community=AG&longitude=${est.lon}&latitude=${est.lat}&format=JSON`;
    const [d, c] = await Promise.all([
      pedir(`${BASE}/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,GWETTOP,GWETROOT&${punto}&start=${yyyymmdd(desde)}&end=${yyyymmdd(hasta)}`),
      pedir(`${BASE}/climatology/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,GWETTOP,GWETROOT&${punto}`),
    ]);

    const p = d.properties.parameter;
    const diario = Object.keys(p.T2M).map((k) => ({
      dia: iso(k),
      t2m: limpio(p.T2M[k]),
      tmax: limpio(p.T2M_MAX[k]),
      tmin: limpio(p.T2M_MIN[k]),
      lluvia: limpio(p.PRECTOTCORR[k]),
      sueloSup: pct(p.GWETTOP[k]),
      sueloRaiz: pct(p.GWETROOT[k]),
    }));

    const cp = c.properties.parameter;
    const meses = MESES.map((m, i) => ({
      mes: i + 1,
      t2m: limpio(cp.T2M[m]),
      tmax: limpio(cp.T2M_MAX?.[m]),
      tmin: limpio(cp.T2M_MIN?.[m]),
      lluvia: limpio(cp.PRECTOTCORR[m]), // mm por día, en promedio
      sueloSup: pct(cp.GWETTOP[m]),
      sueloRaiz: pct(cp.GWETROOT[m]),
    }));

    res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=86400");
    res.status(200).json({
      estacion: est.id, lat: est.lat, lon: est.lon,
      altitudCelda: d.geometry?.coordinates?.[2] ?? null,
      desde, hasta,
      periodoClima: c.header?.range || "",
      diario, meses,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
