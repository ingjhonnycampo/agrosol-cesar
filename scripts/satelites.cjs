// NDVI de Landsat (30 m) y Sentinel-2 (10 m) en el punto de la estación, leído de Microsoft Planetary Computer
// (catálogo público, sin cuenta). Guarda src/data/satelites.json. Uso: node scripts/satelites.cjs
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
  let body = { collections: [col], intersects: { type: "Point", coordinates: [LON, LAT] }, datetime: `${ini}/${fin}`, limit: 100, query: { "eo:cloud_cover": { lt: nubes } }, sortby: [{ field: "datetime", direction: "asc" }] };
  const r = await (await fetch(STAC, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
  out.push(...(r.features || []));
  return out;
}
const epsgUtm = (epsg) => { const n = Number(epsg); return n >= 32700 ? `+proj=utm +zone=${n - 32700} +south +datum=WGS84 +units=m` : `+proj=utm +zone=${n - 32600} +datum=WGS84 +units=m`; };

// lee una ventana de n×n píxeles alrededor del punto
async function leer(href, col, epsg, n) {
  const tif = await fromUrl(href + "?" + (await token(col)));
  const img = await tif.getImage();
  const [x, y] = proj4("EPSG:4326", epsgUtm(epsg), [LON, LAT]);
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

async function landsat(f) {
  const a = f.assets, ep = f.properties["proj:epsg"];
  const [qa, red, nir] = await Promise.all([leer(a.qa_pixel.href, "landsat-c2-l2", ep, 1), leer(a.red.href, "landsat-c2-l2", ep, 3), leer(a.nir08.href, "landsat-c2-l2", ep, 3)]);
  if (!qa || !red || !nir) return null;
  if (qa[0] & 0b11110) return { fecha: f.properties.datetime.slice(0, 10), nube: true };
  const r = media(red.filter((v) => v > 0).map((v) => v * 0.0000275 - 0.2)), n = media(nir.filter((v) => v > 0).map((v) => v * 0.0000275 - 0.2));
  if (r === null || n === null || n + r === 0) return null;
  return { fecha: f.properties.datetime.slice(0, 10), ndvi: (n - r) / (n + r) };
}
async function sentinel(f) {
  const a = f.assets, ep = f.properties["proj:epsg"] || (f.properties["proj:code"] || "").replace("EPSG:", "");
  const base = parseFloat(f.properties["s2:processing_baseline"] || "5");
  const off = base >= 4 ? 1000 : 0;
  const [scl, red, nir] = await Promise.all([leer(a.SCL.href, "sentinel-2-l2a", ep, 1), leer(a.B04.href, "sentinel-2-l2a", ep, 3), leer(a.B08.href, "sentinel-2-l2a", ep, 3)]);
  if (!scl || !red || !nir) return null;
  if ([0, 1, 3, 8, 9, 10].includes(scl[0])) return { fecha: f.properties.datetime.slice(0, 10), nube: true };
  const r = media(red.filter((v) => v > 0).map((v) => (v - off) / 10000)), n = media(nir.filter((v) => v > 0).map((v) => (v - off) / 10000));
  if (r === null || n === null || n + r === 0) return null;
  return { fecha: f.properties.datetime.slice(0, 10), ndvi: (n - r) / (n + r) };
}

async function procesar(nombre, col, nubes, fn) {
  const items = await buscar(col, nubes);
  log(nombre, "escenas encontradas:", items.length);
  const res = [];
  for (let i = 0; i < items.length; i += 4) {
    const lote = await Promise.all(items.slice(i, i + 4).map((f) => fn(f).catch((e) => { log(nombre, "error en", f.id, e.message.slice(0, 80)); return null; })));
    res.push(...lote.filter(Boolean));
  }
  const buenos = res.filter((x) => x.ndvi !== undefined);
  log(nombre, "con dato:", buenos.length, "· con nube sobre el punto:", res.filter((x) => x.nube).length);
  return { serie: buenos.map((x) => [x.fecha, Math.round(x.ndvi * 1000) / 1000]), escenas: items.length, conNube: res.filter((x) => x.nube).length };
}

(async () => {
  const l = await procesar("Landsat", "landsat-c2-l2", 70, landsat);
  const s = await procesar("Sentinel-2", "sentinel-2-l2a", 70, sentinel);
  const salida = { disponible: true, generado: fin, lat: LAT, lon: LON, periodo: [ini, fin], landsat: l, sentinel2: s };
  fs.writeFileSync(path.join(RAIZ, "src", "data", "satelites.json"), JSON.stringify(salida));
  log("guardado src/data/satelites.json");
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
