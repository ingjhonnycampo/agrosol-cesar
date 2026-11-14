// Lo que los satélites ven en el lote: NDVI de MODIS (250 m), Landsat (30 m) y Sentinel-2 (10 m), ya guardados en
// src/data/modis.json y src/data/satelites.json. Aquí se resume para usarlo en las recomendaciones y en la confianza.
import modis from "../data/modis.json";
import sat from "../data/satelites.json";

const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
const dia = (f) => Date.parse(f + "T00:00:00Z");

export function nivelNdvi(v) {
  if (v === null || v === undefined) return "sin dato";
  if (v < 0.2) return "desnudo";
  if (v < 0.4) return "escaso";
  if (v < 0.6) return "moderado";
  return "denso";
}
export const TEXTO_NIVEL = {
  desnudo: "suelo casi desnudo o muy seco",
  escaso: "poca vegetación o cultivo joven",
  moderado: "vegetación moderada",
  denso: "vegetación densa y vigorosa",
};

function pearson(x, y) {
  const n = x.length;
  if (n < 6) return null;
  const mx = media(x), my = media(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

// Devuelve null si no hay datos de satélite guardados.
export function resumenSatelite(ahora = new Date()) {
  const sensores = [];
  if (modis.disponible) sensores.push({ id: "modis", nombre: "MODIS (250 m)", pts: modis.ndvi.serie });
  if (sat.disponible) {
    sensores.push({ id: "landsat", nombre: "Landsat (30 m)", pts: sat.landsat.serie });
    sensores.push({ id: "sentinel2", nombre: "Sentinel-2 (10 m)", pts: sat.sentinel2.serie });
  }
  const conDatos = sensores.filter((s) => s.pts.length);
  if (!conDatos.length) return null;

  const ultima = Math.max(...conDatos.map((s) => dia(s.pts[s.pts.length - 1][0])));
  const desde = ultima - 60 * 864e5;
  const porSensor = conDatos
    .map((s) => ({ id: s.id, nombre: s.nombre, ultimo: s.pts[s.pts.length - 1], reciente: media(s.pts.filter((p) => dia(p[0]) >= desde).map((p) => p[1])) }))
    .filter((s) => s.reciente !== null);
  const valores = porSensor.map((s) => s.reciente);
  const ndviActual = mediana(valores);
  const separacion = valores.length > 1 ? Math.max(...valores) - Math.min(...valores) : null;
  const edadDias = Math.round((ahora.getTime() - ultima) / 864e5);

  // curva del año: MODIS, el sensor con más lecturas regulares
  const meses = Array.from({ length: 12 }, () => []);
  (modis.disponible ? modis.ndvi.serie : []).forEach((p) => meses[Number(p[0].slice(5, 7)) - 1].push(p[1]));
  const mensual = meses.map((v) => media(v));
  const promedioAnual = media(mensual.filter((v) => v !== null));

  return {
    ndviActual, nivel: nivelNdvi(ndviActual), porSensor, separacion, coinciden: separacion === null ? null : separacion <= 0.15,
    ultimaFecha: new Date(ultima).toISOString().slice(0, 10), edadDias, antiguo: edadDias > 75,
    mensual, promedioAnual,
    // ¿la vegetación sube cuando llueve? correlación entre el NDVI de cada mes y la lluvia normal de ese mes (o del anterior)
    correlacionLluvia(lluviaMes) {
      let mejor = null;
      for (const lag of [0, 1]) {
        const xs = [], ys = [];
        mensual.forEach((v, m) => { if (v !== null) { xs.push(lluviaMes[(m - lag + 12) % 12]); ys.push(v); } });
        const r = pearson(xs, ys);
        if (r !== null && (mejor === null || r > mejor.r)) mejor = { r, lag, meses: xs.length };
      }
      return mejor;
    },
    // meses del año en que la vegetación observada estuvo por encima del promedio
    mesesVerdes: mensual.map((v, m) => (v !== null && promedioAnual !== null && v > promedioAnual + 0.01 ? m : -1)).filter((m) => m >= 0),
    mesesConDato: mensual.filter((v) => v !== null).length,
  };
}
