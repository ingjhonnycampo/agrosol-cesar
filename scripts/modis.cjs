// MODIS (NDVI 250 m, temperatura de la superficie 1 km, índice de hojas 500 m) en el punto de la estación, leído de
// Microsoft Planetary Computer (catálogo público, sin cuenta). Guarda src/data/modis.json. Uso: node scripts/modis.cjs
const fs = require("fs");
const path = require("path");
const { fromUrl } = require("geotiff");
const proj4 = require("proj4");
const RAIZ = path.join(__dirname, "..");
const LAT = 9.977571, LON = -73.893476;
const STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
const TOKEN = "https://planetarycomputer.microsoft.com/api/sas/v1/token/";
const hoy = new Date();
const fin = hoy.toISOString().slice(0, 10);
const ini = new Date(hoy.getTime() - 400 * 864e5).toISOString().slice(0, 10);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const tokens = {};

const pendientes = {};
async function token(col) {
  if (tokens[col] && tokens[col].exp > Date.now() + 120000) return tokens[col].t;
  if (!pendientes[col]) {
    pendientes[col] = (async () => {
      for (let i = 0; i < 6; i++) {
        const resp = await fetch(TOKEN + col);
        if (resp.status === 429) { await new Promise((r) => setTimeout(r, 65000)); continue; }
        const r = await resp.json();
        tokens[col] = { t: r.token, exp: new Date(r["msft:expiry"]).getTime() };
        return;
      }
      throw new Error("límite de consultas de Planetary Computer");
    })().finally(() => { delete pendientes[col]; });
  }
  await pendientes[col];
  return tokens[col].t;
}
async function buscar(col, nubes) {
  const out = [];
  let body = { collections: [col], intersects: { type: "Point", coordinates: [LON, LAT] }, datetime: `${ini}/${fin}`, limit: 100, sortby: [{ field: "datetime", direction: "asc" }] };
  const r = await (await fetch(STAC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
  out.push(...(r.features || []));
  return out;
}
const SINU = "+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +R=6371007.181 +units=m +no_defs";
// lee una ventana de n×n píxeles alrededor del punto (proyección sinusoidal de MODIS)
async function leer(href, col, n) {
  const u = new URL(href); // el permiso se pide por almacén: cuenta/contenedor
  const tif = await fromUrl(href + "?" + (await token(u.hostname.split(".")[0] + "/" + u.pathname.split("/")[1])));
  const img = await tif.getImage();
  const [x, y] = proj4("EPSG:4326", SINU, [LON, LAT]);
  const [ox, oy] = img.getOrigin();
  const [rx, ry] = img.getResolution();
  const px = Math.floor((x - ox) / rx), py = Math.floor((y - oy) / ry);
  if (px < 0 || py < 0 || px >= img.getWidth() || py >= img.getHeight()) return null;
  const h = Math.floor(n / 2);
  const x0 = Math.max(0, px - h), y0 = Math.max(0, py - h);
  const r = await img.readRasters({ window: [x0, y0, Math.min(img.getWidth(), px + h + 1), Math.min(img.getHeight(), py + h + 1)] });
  return Array.from(r[0]);
}
const media = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

const fechaItem = (f) => {
  const a = new Date(f.properties.start_datetime), b = new Date(f.properties.end_datetime);
  return new Date((a.getTime() + b.getTime()) / 2).toISOString().slice(0, 10);
};
const redondea = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

async function ndvi(f) {
  const a = f.assets;
  const [v, q] = await Promise.all([leer(a["250m_16_days_NDVI"].href, "modis-13Q1-061", 1), leer(a["250m_16_days_pixel_reliability"].href, "modis-13Q1-061", 1)]);
  if (!v || !q || v[0] === -3000) return null;
  if (q[0] > 1) return { fecha: fechaItem(f), nube: true }; // 2 nieve, 3 nubes
  return { fecha: fechaItem(f), ndvi: redondea(v[0] * 0.0001, 3) };
}
async function lst(f) {
  const a = f.assets;
  const [d, n] = await Promise.all([leer(a.LST_Day_1km.href, "modis-11A2-061", 1), leer(a.LST_Night_1km.href, "modis-11A2-061", 1)]);
  const c = (v) => (v && v[0] > 0 ? redondea(v[0] * 0.02 - 273.15, 1) : null);
  if (c(d) === null && c(n) === null) return { fecha: fechaItem(f), nube: true };
  return { fecha: fechaItem(f), dia: c(d), noche: c(n) };
}
async function lai(f) {
  const a = f.assets;
  const v = await leer(a.Lai_500m.href, "modis-15A2H-061", 1);
  if (!v || v[0] > 100) return null;
  return { fecha: fechaItem(f), lai: redondea(v[0] * 0.1, 2) };
}

async function procesar(nombre, col, fn) {
  const items = (await buscar(col, 101)).sort((x, y) => fechaItem(x).localeCompare(fechaItem(y)));
  log(nombre, "imágenes encontradas:", items.length);
  const res = [];
  for (let i = 0; i < items.length; i += 4) {
    const lote = await Promise.all(items.slice(i, i + 4).map((f) => fn(f).catch((e) => { log(nombre, "error en", f.id, e.message.slice(0, 80)); return null; })));
    res.push(...lote.filter(Boolean));
  }
  const buenos = res.filter((x) => !x.nube);
  log(nombre, "con dato:", buenos.length, "· con nube:", res.filter((x) => x.nube).length);
  return { buenos, imagenes: items.length, conNube: res.filter((x) => x.nube).length };
}

(async () => {
  const n = await procesar("NDVI", "modis-13Q1-061", ndvi);
  const l = await procesar("Temperatura", "modis-11A2-061", lst);
  const h = await procesar("Hojas", "modis-15A2H-061", lai);
  const serie = (arr, k) => arr.filter((x) => x[k] !== null && x[k] !== undefined).map((x) => [x.fecha, x[k]]);
  const salida = {
    disponible: true, generado: fin, lat: LAT, lon: LON, periodo: [ini, fin],
    ndvi: { serie: serie(n.buenos, "ndvi"), imagenes: n.imagenes, conNube: n.conNube },
    lstDia: { serie: serie(l.buenos, "dia"), imagenes: l.imagenes, conNube: l.conNube },
    lstNoche: { serie: serie(l.buenos, "noche") },
    lai: { serie: serie(h.buenos, "lai"), imagenes: h.imagenes },
  };
  fs.writeFileSync(path.join(RAIZ, "src", "data", "modis.json"), JSON.stringify(salida));
  log("guardado src/data/modis.json");
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
