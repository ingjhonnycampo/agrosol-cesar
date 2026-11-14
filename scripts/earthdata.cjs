// Baja de la NASA (AppEEARS) el NDVI de MODIS y la humedad del suelo de SMAP para el punto de la estación
// y los guarda en src/data/earthdata.json. Las credenciales se leen de .env (EARTHDATA_USER / EARTHDATA_PASS):
// nunca se escriben en ningún archivo ni se muestran. Uso: node scripts/earthdata.cjs
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..");
const env = Object.fromEntries(fs.readFileSync(path.join(RAIZ, ".env"), "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]));
const API = "https://appeears.earthdatacloud.nasa.gov/api";
const LAT = 9.977571, LON = -73.893476;
const hoy = new Date();
const fin = new Date(hoy.getTime() - 20 * 864e5); // la NASA publica con unos días de retraso
const ini = new Date(fin.getTime() - 730 * 864e5);
const f = (d) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}-${d.getFullYear()}`;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function json(url, opts) {
  const r = await fetch(url, opts);
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${url.replace(API, "")}: ${t.slice(0, 200)}`);
  return JSON.parse(t);
}

(async () => {
  const basic = Buffer.from(`${env.EARTHDATA_USER}:${env.EARTHDATA_PASS}`).toString("base64");
  const { token } = await json(`${API}/login`, { method: "POST", headers: { Authorization: `Basic ${basic}` } });
  const H = { Authorization: `Bearer ${token}` };
  log("sesión iniciada");
  const tarea = {
    task_type: "point", task_name: "agrosol-bosconia-" + Date.now(),
    params: {
      dates: [{ startDate: f(ini), endDate: f(fin) }],
      layers: [
        { product: "MOD13Q1.061", layer: "_250m_16_days_NDVI" },
        { product: "MOD13Q1.061", layer: "_250m_16_days_pixel_reliability" },
        { product: "SPL4SMGP.008", layer: "Geophysical_Data_sm_surface" },
        { product: "SPL4SMGP.008", layer: "Geophysical_Data_sm_rootzone" },
      ],
      coordinates: [{ id: "estacion", category: "Bosconia", latitude: LAT, longitude: LON }],
    },
  };
  const { task_id } = await json(`${API}/task`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(tarea) });
  log("tarea enviada", task_id);
  for (let i = 0; i < 180; i++) {
    await espera(20000);
    const s = await json(`${API}/task/${task_id}`, { headers: H });
    log("estado:", s.status);
    if (s.status === "done") break;
    if (s.status === "error" || s.status === "deleted") throw new Error("la tarea falló: " + JSON.stringify(s).slice(0, 300));
    if (i === 179) throw new Error("tiempo agotado");
  }
  const b = await json(`${API}/bundle/${task_id}`, { headers: H });
  const csv = b.files.find((x) => /results\.csv$/i.test(x.file_name));
  const r = await fetch(`${API}/bundle/${task_id}/${csv.file_id}`, { headers: H, redirect: "follow" });
  const texto = await r.text();
  fs.writeFileSync(path.join(RAIZ, "scripts", "earthdata-crudo.csv"), texto);
  log("CSV descargado:", texto.split("\n").length, "líneas");
})().catch((e) => { console.error("ERROR:", e.message.replace(/Basic [A-Za-z0-9+/=]+|Bearer [A-Za-z0-9._-]+/g, "<oculto>")); process.exit(1); });
