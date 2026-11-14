import { useMemo } from "react";
import Grafica from "./Grafica.jsx";
import datos from "../data/earthdata.json";
import sat from "../data/satelites.json";
import mod from "../data/modis.json";

const VERDE = "#2f9e4f";
const AZUL = "#1b5e87";
const EJE = "#5d6b60";
const REJA = { lineStyle: { color: "rgba(120,140,120,.18)" } };
const coma = (v, d = 2) => (v === null || v === undefined ? "—" : Number(v).toFixed(d).replace(".", ","));
const fechaLarga = (s) => { const [a, m, d] = s.split("-"); return `${d}/${m}/${a}`; };

// Qué significa un valor de NDVI en palabras simples
function leerNdvi(v) {
  if (v === null || v === undefined) return { icono: "❔", texto: "Sin dato", color: "#9aa5a0" };
  if (v < 0.2) return { icono: "🟫", texto: "Suelo casi desnudo o muy seco", color: "#a06b3c" };
  if (v < 0.4) return { icono: "🌱", texto: "Poca vegetación o cultivo joven", color: "#c9a227" };
  if (v < 0.6) return { icono: "🌿", texto: "Vegetación moderada", color: "#6aa84f" };
  return { icono: "🌳", texto: "Vegetación densa y vigorosa", color: VERDE };
}

const ultimo = (serie) => { for (let i = serie.length - 1; i >= 0; i--) if (serie[i][1] !== null) return serie[i]; return null; };

// NDVI (MODIS) y humedad del suelo (SMAP) del punto de la estación, bajados de la NASA con una cuenta del equipo
// (AppEEARS) y guardados en src/data/earthdata.json: quien visita la página no necesita ninguna cuenta.
export default function Satelites() {
  return <><Modis />{mod.disponible && <Temperatura />}{sat.disponible && <Imagenes />}</>;
}

function Modis() {
  if (!datos.disponible) return null;
  const { ndvi, smSuperficie, smZonaRaiz } = datos;
  const u = ultimo(ndvi);
  const lectura = leerNdvi(u?.[1]);
  const us = ultimo(smSuperficie), ur = ultimo(smZonaRaiz);

  const opNdvi = useMemo(() => ({
    grid: { left: 46, right: 18, top: 24, bottom: 42 },
    tooltip: { trigger: "axis", valueFormatter: (v) => coma(v) },
    xAxis: { type: "category", data: ndvi.map((p) => p[0]), axisLabel: { color: EJE, formatter: (v) => v.slice(5, 7) + "/" + v.slice(2, 4) }, boundaryGap: false },
    yAxis: { type: "value", min: 0, max: 1, name: "NDVI", nameTextStyle: { color: EJE }, axisLabel: { color: EJE }, splitLine: REJA },
    series: [{
      name: "NDVI", type: "line", smooth: true, showSymbol: true, symbolSize: 5, data: ndvi.map((p) => p[1]), connectNulls: true,
      lineStyle: { width: 2.8, color: VERDE }, itemStyle: { color: VERDE }, areaStyle: { color: "rgba(47,158,79,.14)" },
      markLine: { symbol: "none", silent: true, label: { color: EJE, formatter: (p) => p.name }, lineStyle: { color: "#9aa5a0", type: "dashed" },
        data: [{ yAxis: 0.2, name: "suelo desnudo" }, { yAxis: 0.6, name: "vegetación densa" }] },
    }],
  }), [ndvi]);

  const opHum = useMemo(() => {
    const fechas = smSuperficie.map((p) => p[0]);
    const mapa = new Map(smZonaRaiz.map((p) => [p[0], p[1]]));
    const pct = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 10);
    return {
      grid: { left: 46, right: 18, top: 34, bottom: 42 },
      legend: { top: 0, textStyle: { color: EJE } },
      tooltip: { trigger: "axis", valueFormatter: (v) => (v === null || v === undefined ? "—" : coma(v, 1) + " %") },
      xAxis: { type: "category", data: fechas, axisLabel: { color: EJE, formatter: (v) => v.slice(5, 7) + "/" + v.slice(2, 4) }, boundaryGap: false },
      yAxis: { type: "value", name: "% del volumen", nameTextStyle: { color: EJE }, axisLabel: { color: EJE }, splitLine: REJA },
      series: [
        { name: "Superficie (0–5 cm)", type: "line", showSymbol: false, data: smSuperficie.map((p) => pct(p[1])), lineStyle: { width: 2, color: AZUL }, itemStyle: { color: AZUL } },
        { name: "Zona de raíces (0–100 cm)", type: "line", showSymbol: false, data: fechas.map((f) => pct(mapa.get(f))), lineStyle: { width: 2.4, color: "#e8731a" }, itemStyle: { color: "#e8731a" } },
      ],
    };
  }, [smSuperficie, smZonaRaiz]);

  return (
    <div>
      <div className="titulo-seccion"><h2>🌿 La vegetación vista desde el espacio (NDVI)</h2><p>MODIS, un valor cada 16 días</p></div>
      <div className="nasa-intro">
        El <b>NDVI</b> mide qué tan verde y vigorosa está la vegetación: cerca de 0 es suelo desnudo y cerca de 1 es vegetación muy densa.
        Es un dato <b>numérico de satélite</b> del punto de la estación (píxel de 250 m), bajado de la NASA. Para ver el mapa completo usa la pestaña de mapas.
      </div>
      {u && (
        <div className="kpis">
          <div className="kpi">
            <span className="kpi-icono">{lectura.icono}</span>
            <span className="kpi-titulo">NDVI más reciente ({fechaLarga(u[0])})</span>
            <strong className="kpi-valor" style={{ color: lectura.color }}>{coma(u[1])}</strong>
            <span className="kpi-nota"><b>{lectura.texto}</b></span>
          </div>
          {us && <div className="kpi"><span className="kpi-icono">💧</span><span className="kpi-titulo">Humedad superficial SMAP ({fechaLarga(us[0])})</span><strong className="kpi-valor">{coma(us[1] * 100, 1)} %</strong><span className="kpi-nota">Capa de 0 a 5 cm</span></div>}
          {ur && <div className="kpi"><span className="kpi-icono">🌱</span><span className="kpi-titulo">Humedad en zona de raíces ({fechaLarga(ur[0])})</span><strong className="kpi-valor">{coma(ur[1] * 100, 1)} %</strong><span className="kpi-nota">Capa de 0 a 100 cm</span></div>}
        </div>
      )}
      <Grafica option={opNdvi} alto={300} />

      <div className="titulo-seccion"><h2>💧 Humedad del suelo según SMAP</h2><p>Superficie y zona de raíces</p></div>
      <p className="ayuda">SMAP promedia un cuadro de unos 9 km, así que no tiene que coincidir con el sensor de la estación; lo que importa es que suba cuando llueve y baje en la época seca. Los porcentajes son de agua por volumen de suelo (no son el 0–100 % del sensor de la estación).</p>
      <Grafica option={opHum} alto={300} />

      <p className="calidad">
        Fuente: NASA, MODIS MOD13Q1 v061 (NDVI) y SMAP L4 SPL4SMGP v008 (humedad), bajados con AppEEARS ({fechaLarga(datos.periodo[0])} a {fechaLarga(datos.periodo[1])}),
        punto {coma(datos.lat, 4)}, {coma(datos.lon, 4)}. Datos guardados el {fechaLarga(datos.generado)}: no se actualizan solos.
      </p>
    </div>
  );
}

// NDVI de Landsat (30 m) y Sentinel-2 (10 m) en el punto de la estación: se ven los detalles que MODIS (250 m) no alcanza.
function Imagenes() {
  const { landsat, sentinel2 } = sat;
  const opciones = useMemo(() => {
    const serie = (nombre, d, color, simbolo) => ({ name: nombre, type: "line", showSymbol: true, symbol: simbolo, symbolSize: 7, connectNulls: true, data: d.serie.map((p) => [p[0], p[1]]), lineStyle: { width: 2, color }, itemStyle: { color } });
    return {
      grid: { left: 46, right: 18, top: 34, bottom: 42 },
      legend: { top: 0, textStyle: { color: EJE } },
      tooltip: { trigger: "axis", valueFormatter: (v) => coma(v) },
      xAxis: { type: "time", axisLabel: { color: EJE, formatter: (v) => { const d = new Date(v); return String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + String(d.getUTCFullYear()).slice(2); } } },
      yAxis: { type: "value", min: 0, max: 0.8, name: "NDVI", nameTextStyle: { color: EJE }, axisLabel: { color: EJE }, splitLine: REJA },
      series: [
        ...(mod.disponible ? [serie("MODIS (250 m)", mod.ndvi, "#e8731a", "rect")] : []),
        serie("Landsat (30 m)", landsat, "#8e44ad", "diamond"), serie("Sentinel-2 (10 m)", sentinel2, "#16a085", "circle"),
      ],
    };
  }, [landsat, sentinel2]);
  const ul = ultimo(landsat.serie), us = ultimo(sentinel2.serie);
  return (
    <div>
      <div className="titulo-seccion"><h2>🛰️ Tres satélites, un mismo punto: NDVI</h2><p>MODIS 250 m · Landsat 30 m · Sentinel-2 10 m</p></div>
      <div className="nasa-intro">
        <b>MODIS</b> (NASA) mira cuadros de 250 m. <b>Landsat</b> (NASA) mira de 30 m y <b>Sentinel-2</b> (ESA) de 10 m, así que ven el terreno de la estación con mucho más detalle.
        Se descartaron las fechas con nubes sobre el punto: de {landsat.escenas} imágenes de Landsat quedaron {landsat.serie.length}, y de {sentinel2.escenas} de Sentinel-2, {sentinel2.serie.length}.
      </div>
      <div className="kpis">
        {ul && <div className="kpi"><span className="kpi-icono">🛰️</span><span className="kpi-titulo">Landsat · {fechaLarga(ul[0])}</span><strong className="kpi-valor">{coma(ul[1])}</strong><span className="kpi-nota"><b>{leerNdvi(ul[1]).texto}</b></span></div>}
        {mod.disponible && ultimo(mod.ndvi.serie) && <div className="kpi"><span className="kpi-icono">🛰️</span><span className="kpi-titulo">MODIS · {fechaLarga(ultimo(mod.ndvi.serie)[0])}</span><strong className="kpi-valor">{coma(ultimo(mod.ndvi.serie)[1])}</strong><span className="kpi-nota"><b>{leerNdvi(ultimo(mod.ndvi.serie)[1]).texto}</b></span></div>}
        {us && <div className="kpi"><span className="kpi-icono">🛰️</span><span className="kpi-titulo">Sentinel-2 · {fechaLarga(us[0])}</span><strong className="kpi-valor">{coma(us[1])}</strong><span className="kpi-nota"><b>{leerNdvi(us[1]).texto}</b></span></div>}
      </div>
      <Grafica option={opciones} alto={300} />
      <p className="ayuda">Los dos satélites no tienen que dar el mismo número: cada uno promedia un tamaño de píxel distinto (aquí, 3×3 píxeles alrededor del punto) y ve el terreno con otro ángulo y otra fecha. Si el lote es pequeño o tiene suelo descubierto, el de 10 m suele dar valores más bajos que el de 30 m. Lo importante es la tendencia: sube cuando hay cultivo o pasto verde y baja con el suelo seco.</p>
      <p className="calidad">
        Fuente: MODIS MOD13Q1/MYD13Q1 (NASA), Landsat Collection 2 Level-2 (NASA/USGS) y Sentinel-2 L2A (ESA/Copernicus), leídos del catálogo público de Microsoft Planetary Computer, sin cuenta.
        Periodo {fechaLarga(sat.periodo[0])} a {fechaLarga(sat.periodo[1])}. Datos guardados el {fechaLarga(sat.generado)}: no se actualizan solos.
      </p>
    </div>
  );
}

// Temperatura de la superficie (MODIS, 1 km): cómo se calienta el suelo, no el aire
function Temperatura() {
  const dia = mod.lstDia.serie, noche = mod.lstNoche.serie;
  const ud = ultimo(dia), un = ultimo(noche);
  const op = useMemo(() => ({
    grid: { left: 46, right: 18, top: 34, bottom: 42 },
    legend: { top: 0, textStyle: { color: EJE } },
    tooltip: { trigger: "axis", valueFormatter: (v) => coma(v, 1) + " °C" },
    xAxis: { type: "time", axisLabel: { color: EJE, formatter: (v) => { const d = new Date(v); return String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + String(d.getUTCFullYear()).slice(2); } } },
    yAxis: { type: "value", name: "°C", nameTextStyle: { color: EJE }, axisLabel: { color: EJE }, scale: true, splitLine: REJA },
    series: [
      { name: "Día", type: "line", showSymbol: false, smooth: true, data: dia, lineStyle: { width: 2.4, color: "#d9443a" }, itemStyle: { color: "#d9443a" } },
      { name: "Noche", type: "line", showSymbol: false, smooth: true, data: noche, lineStyle: { width: 2.4, color: "#1b5e87" }, itemStyle: { color: "#1b5e87" } },
    ],
  }), [dia, noche]);
  return (
    <div>
      <div className="titulo-seccion"><h2>🌡️ La temperatura del suelo vista desde el espacio</h2><p>MODIS, un valor cada 8 días</p></div>
      <div className="nasa-intro">
        MODIS también mide qué tan caliente está la <b>superficie</b> (el suelo y las hojas), de día y de noche, en cuadros de 1 km.
        <b> No es la temperatura del aire:</b> de día el suelo se calienta mucho más que el aire, y por eso estos valores son más altos que los de la estación.
      </div>
      <div className="kpis">
        {ud && <div className="kpi"><span className="kpi-icono">☀️</span><span className="kpi-titulo">Superficie de día ({fechaLarga(ud[0])})</span><strong className="kpi-valor">{coma(ud[1], 1)} °C</strong><span className="kpi-nota">Suelo y plantas al sol</span></div>}
        {un && <div className="kpi"><span className="kpi-icono">🌙</span><span className="kpi-titulo">Superficie de noche ({fechaLarga(un[0])})</span><strong className="kpi-valor">{coma(un[1], 1)} °C</strong><span className="kpi-nota">Cuánto se enfría</span></div>}
      </div>
      <Grafica option={op} alto={300} />
      <p className="calidad">Fuente: MODIS MOD11A2/MYD11A2 v061 (NASA), leído de Microsoft Planetary Computer sin cuenta. Los 8 días son un promedio de los días despejados; las fechas con nube se descartaron. Datos guardados el {fechaLarga(mod.generado)}.</p>
    </div>
  );
}
