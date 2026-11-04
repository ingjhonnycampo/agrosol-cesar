import { useEffect, useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import ValidarNasa from "./ValidarNasa.jsx";
import { coma, fechaCorta, hoyLocal, porDia } from "../lib/analisis.js";

const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const NASA = "#e8731a";      // naranja = dato de la NASA
const NASA_OSC = "#9a3f0b";
const EJE = "#5d6b60";
const REJA = { lineStyle: { color: "rgba(120,140,120,.18)" } };
const valor = (v) => (v === null || v === undefined ? "—" : String(v).replace(".", ","));

const promedio = (a) => {
  const v = a.filter((x) => x !== null && x !== undefined);
  return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
};

const linea = (nombre, datos, color, discontinua) => ({
  name: nombre, type: "line", smooth: true, showSymbol: false, connectNulls: false, data: datos,
  lineStyle: { width: discontinua ? 2.4 : 2.8, color, type: discontinua ? "dashed" : "solid" }, itemStyle: { color },
});

export function Comparacion({ icono, titulo, estacion, normal, unidad, dec = 1, mas, menos }) {
  const hay = estacion !== null && normal !== null;
  const dif = hay ? estacion - normal : null;
  const cerca = hay && Math.abs(dif) < Math.max(0.5, Math.abs(normal) * 0.08);
  return (
    <div className="kpi">
      <span className="kpi-icono">{icono}</span>
      <span className="kpi-titulo">{titulo}</span>
      <strong className="kpi-valor">{coma(estacion, dec)} {unidad}</strong>
      <span className="kpi-nota">Normal del mes: {coma(normal, dec)} {unidad}</span>
      {hay && <span className="kpi-nota"><b>{cerca ? "Dentro de lo normal" : `${coma(Math.abs(dif), dec)} ${unidad} ${dif > 0 ? mas : menos}`}</b></span>}
    </div>
  );
}

// Tres tarjetas: lo que mide la estación este mes frente a lo normal de la NASA (2001–2025)
export function ComparacionesMes({ nasa, todas }) {
  const mes = Number(hoyLocal().slice(5, 7));
  const normal = nasa.meses[mes - 1];
  const diasMes = useMemo(
    () => porDia(todas).filter((d) => d.dia.slice(0, 7) === hoyLocal().slice(0, 7)),
    [todas],
  );
  if (!diasMes.length) return <p className="vacio">Aún no hay mediciones de la estación en este mes.</p>;
  const lluviaDia = diasMes.reduce((a, d) => a + d.lluvia, 0) / diasMes.length;
  return (
    <div className="kpis">
      <Comparacion icono="🌡️" titulo="Temperatura media" estacion={promedio(diasMes.map((d) => d.tprom))} normal={normal.t2m} unidad="°C" mas="más caliente" menos="más fresco" />
      <Comparacion icono="🌧️" titulo="Lluvia por día" estacion={lluviaDia} normal={normal.lluvia} unidad="mm" mas="más lluvioso" menos="más seco" />
      <Comparacion icono="💧" titulo="Humedad del suelo (10 cm)" estacion={promedio(diasMes.map((d) => d.suelo10))} normal={normal.sueloSup} unidad="%" dec={0} mas="más húmedo" menos="más seco" />
    </div>
  );
}

// Datos de la NASA (POWER) para el punto de la estación, comparados con lo que mide la estación.
export default function Nasa({ estacion, todas, rango, dias }) {
  const [nasa, setNasa] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError("");
    fetch(`/api/nasa?estacion=${encodeURIComponent(estacion.id)}&desde=${rango.desde}&hasta=${rango.hasta}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || j.error) throw new Error(j.error || "Error " + r.status);
        if (vivo) setNasa(j);
      })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [estacion.id, rango.desde, rango.hasta]);

  const porDiaEst = useMemo(() => new Map(dias.map((d) => [d.dia, d])), [dias]);
  const ejeDias = nasa?.diario.map((d) => d.dia) || [];
  const etiquetas = ejeDias.map(fechaCorta);
  const est = (k) => ejeDias.map((d) => porDiaEst.get(d)?.[k] ?? null);
  const nas = (k) => (nasa?.diario || []).map((d) => d[k]);

  const base = {
    animationDuration: 700,
    grid: { left: 46, right: 16, top: 44, bottom: 40 },
    legend: { top: 0, textStyle: { color: EJE } },
    tooltip: { trigger: "axis", valueFormatter: valor },
    xAxis: { type: "category", data: etiquetas, axisLabel: { color: EJE } },
  };

  const opHumedad = {
    ...base,
    yAxis: { type: "value", name: "%", min: 0, max: 100, splitLine: REJA },
    series: [
      linea("Estación · suelo 10 cm", est("suelo10"), "#2e86ab"),
      linea("Estación · suelo 30 cm", est("suelo30"), "#1b5e87"),
      linea("NASA · superficie", nas("sueloSup"), NASA, true),
      linea("NASA · zona de raíces", nas("sueloRaiz"), NASA_OSC, true),
    ],
  };
  const opLluvia = {
    ...base,
    yAxis: { type: "value", name: "mm", min: 0, splitLine: REJA },
    series: [
      { name: "Estación", type: "bar", data: est("lluvia"), itemStyle: { color: "#3d5af1", borderRadius: [5, 5, 0, 0] } },
      { name: "NASA", type: "bar", data: nas("lluvia"), itemStyle: { color: NASA, borderRadius: [5, 5, 0, 0] } },
    ],
  };
  const opTemp = {
    ...base,
    yAxis: { type: "value", name: "°C", scale: true, splitLine: REJA },
    series: [
      linea("Estación · máx", est("tmax"), "#e4572e"),
      linea("Estación · mín", est("tmin"), "#2e86ab"),
      linea("NASA · máx", nas("tmax"), NASA, true),
      linea("NASA · mín", nas("tmin"), NASA_OSC, true),
    ],
  };

  const mesActual = Number(hoyLocal().slice(5, 7));
  const opClima = nasa && {
    animationDuration: 700,
    grid: { left: 46, right: 46, top: 44, bottom: 30 },
    legend: { top: 0, textStyle: { color: EJE } },
    tooltip: { trigger: "axis", valueFormatter: valor },
    xAxis: { type: "category", data: MES_CORTO, axisLabel: { color: EJE } },
    yAxis: [
      { type: "value", name: "mm/mes", min: 0, splitLine: REJA },
      { type: "value", name: "°C", scale: true, splitLine: { show: false } },
    ],
    series: [
      {
        name: "Lluvia normal (mm/mes)", type: "bar",
        data: nasa.meses.map((m) => ({
          value: m.lluvia === null ? null : Math.round(m.lluvia * 30.4),
          itemStyle: { color: m.mes === mesActual ? "#3d5af1" : "#aab8f7", borderRadius: [6, 6, 0, 0] },
        })),
      },
      { ...linea("Temperatura media normal (°C)", nasa.meses.map((m) => m.t2m), "#e4572e"), yAxisIndex: 1 },
    ],
  };

  return (
    <div>
      <div className="nasa-intro">
        <b>🛰️ <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">NASA POWER</a></b> (modelo MERRA-2; <a href="https://power.larc.nasa.gov/data-access-viewer/" target="_blank" rel="noreferrer">visor de datos</a>) entrega clima y humedad del suelo para el punto de la estación
        ({coma(nasa?.lat ?? estacion.lat, 3)}, {coma(nasa?.lon ?? estacion.lon, 3)}). Es un dato de una celda de unos 50 km, no de tu terreno exacto:
        sirve como contexto regional. Las líneas <b style={{ color: NASA }}>naranjas punteadas</b> son de la NASA.
        {nasa?.altitudCelda != null && <> Altitud de la celda: {Math.round(nasa.altitudCelda)} m.</>}
      </div>

      {cargando && <div className="cargando">Consultando a la NASA…</div>}
      {error && <div className="aviso">No se pudo consultar la NASA: {error}</div>}

      {nasa && !cargando && (
        <>
          <div className="titulo-seccion"><h2>Este mes frente a lo normal</h2><p>{MES[mesActual - 1]}, promedio 2001–2025</p></div>
          <ComparacionesMes nasa={nasa} todas={todas} />
          <ValidarNasa estacion={estacion} parametros="T2M,PRECTOTCORR,GWETTOP" climatologia titulo="Validar los promedios (lo normal del mes)" />

          <div className="titulo-seccion"><h2>Humedad del suelo</h2><p>Estación frente a NASA (GWETTOP y GWETROOT)</p></div>
          <p className="ayuda">La estación mide un punto, la NASA promedia una celda. No tienen que ser iguales, pero deberían subir y bajar juntas cuando llueve.</p>
          <Grafica option={opHumedad} alto={320} />
          <ValidarNasa estacion={estacion} parametros="GWETTOP,GWETROOT" desde={nasa.desde} hasta={nasa.hasta} titulo="Validar la humedad del suelo de la NASA" />

          <div className="titulo-seccion"><h2>Lluvia diaria</h2><p>Pluviómetro frente a satélite</p></div>
          <Grafica option={opLluvia} alto={280} />
          <ValidarNasa estacion={estacion} parametros="PRECTOTCORR" desde={nasa.desde} hasta={nasa.hasta} titulo="Validar la lluvia de la NASA" />

          <div className="titulo-seccion"><h2>Temperatura</h2><p>Máximas y mínimas del día</p></div>
          <Grafica option={opTemp} alto={300} />
          <ValidarNasa estacion={estacion} parametros="T2M,T2M_MAX,T2M_MIN" desde={nasa.desde} hasta={nasa.hasta} titulo="Validar la temperatura de la NASA" />

          <div className="titulo-seccion"><h2>El clima de Bosconia en el año</h2><p>Promedio de 25 años (NASA)</p></div>
          <p className="ayuda">El mes actual está resaltado. Sirve para saber cuándo es época de lluvias y cuándo es seca al elegir cultivos.</p>
          <Grafica option={opClima} alto={300} />
          <ValidarNasa estacion={estacion} parametros="T2M,PRECTOTCORR,GWETTOP,GWETROOT" climatologia titulo="Validar el clima normal del año" />

          <p className="calidad">
            Fuente: NASA POWER (MERRA-2 / satélites). La NASA publica los datos diarios con unos días de retraso, por eso los últimos días del rango pueden salir vacíos.
          </p>
        </>
      )}
    </div>
  );
}
