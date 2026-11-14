import { useEffect, useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import { coma, fechaCorta, hoyLocal, sumarDias } from "../lib/analisis.js";

const media = (a) => { const v = a.filter((x) => x !== null && x !== undefined); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
const suma = (a) => a.reduce((x, y) => x + (y || 0), 0);
const REJA = { lineStyle: { color: "rgba(120,140,120,.18)" } };

// Datos que se leen en vivo: ERA5 (clima del ECMWF, vía Open-Meteo) y SRTM (altura y pendiente del terreno).
export default function DatosVivos({ estacion, diasEst }) {
  const [era, setEra] = useState(null);
  const [errEra, setErrEra] = useState("");
  const [srtm, setSrtm] = useState(null);
  const [errSrtm, setErrSrtm] = useState("");
  const [nasaAlt, setNasaAlt] = useState(null);

  // ERA5: desde el primer día de la estación (máx. 45 días) hasta hace 5 días, que es cuando ya está listo
  const hasta = sumarDias(hoyLocal(), -5);
  const primero = diasEst[0]?.dia;
  const desde = primero && primero > sumarDias(hasta, -44) ? primero : sumarDias(hasta, -44);
  const urlEra = `https://archive-api.open-meteo.com/v1/archive?latitude=${estacion.lat}&longitude=${estacion.lon}&start_date=${desde}&end_date=${hasta}`
    + "&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=soil_moisture_0_to_7cm&timezone=America%2FBogota";

  useEffect(() => {
    let vivo = true;
    fetch(urlEra).then((r) => r.json()).then((j) => { if (!vivo) return; if (j.error) throw new Error(j.reason || "error"); setEra(j); })
      .catch((e) => vivo && setErrEra(e.message));
    return () => { vivo = false; };
  }, [urlEra]);

  useEffect(() => {
    let vivo = true;
    fetch("/api/elevacion?estacion=" + encodeURIComponent(estacion.id)).then(async (r) => { const j = await r.json(); if (!r.ok || j.error) throw new Error(j.error || "Error " + r.status); return j; })
      .then((j) => vivo && setSrtm(j)).catch((e) => vivo && setErrSrtm(e.message));
    fetch("/api/nasa?estacion=" + encodeURIComponent(estacion.id)).then((r) => r.json()).then((j) => vivo && setNasaAlt(j.altitudCelda ?? null)).catch(() => {});
    return () => { vivo = false; };
  }, [estacion.id]);

  const serie = useMemo(() => {
    if (!era) return null;
    const dias = era.daily.time;
    const humPorDia = dias.map((d) => media(era.hourly.time.map((t, i) => (t.slice(0, 10) === d ? era.hourly.soil_moisture_0_to_7cm[i] : null)).filter((v) => v !== null)));
    const est = new Map(diasEst.map((d) => [d.dia, d]));
    return {
      dias,
      eraT: era.daily.temperature_2m_mean, eraLluvia: era.daily.precipitation_sum, eraHum: humPorDia.map((v) => (v === null ? null : Math.round(v * 1000) / 10)),
      estT: dias.map((d) => est.get(d)?.tprom ?? null), estLluvia: dias.map((d) => (est.get(d) && est.get(d).n >= 100 ? est.get(d).lluvia : null)),
      estHum: dias.map((d) => est.get(d)?.suelo10 ?? null),
    };
  }, [era, diasEst]);

  const comunes = serie ? serie.dias.map((_, i) => i).filter((i) => serie.estLluvia[i] !== null) : [];
  const base = { animationDuration: 600, grid: { left: 46, right: 46, top: 44, bottom: 36 }, legend: { top: 0, textStyle: { color: "#5d6b60" } },
    tooltip: { trigger: "axis" }, xAxis: serie && { type: "category", data: serie.dias.map(fechaCorta), axisLabel: { color: "#5d6b60" } } };

  const opLluvia = serie && { ...base, yAxis: { type: "value", name: "mm", min: 0, splitLine: REJA },
    series: [
      { name: "ERA5 (ECMWF)", type: "bar", data: serie.eraLluvia, itemStyle: { color: "#7b6cd9", borderRadius: [4, 4, 0, 0] } },
      { name: "Estación", type: "bar", data: serie.estLluvia, itemStyle: { color: "#3d5af1", borderRadius: [4, 4, 0, 0] } }] };
  const opTemp = serie && { ...base, yAxis: { type: "value", name: "°C", scale: true, splitLine: REJA },
    series: [
      { name: "ERA5 · media", type: "line", smooth: true, showSymbol: false, data: serie.eraT, lineStyle: { color: "#7b6cd9", width: 2.6, type: "dashed" }, itemStyle: { color: "#7b6cd9" } },
      { name: "Estación · media", type: "line", smooth: true, showSymbol: false, data: serie.estT, lineStyle: { color: "#e4572e", width: 2.8 }, itemStyle: { color: "#e4572e" } }] };
  const opHum = serie && { ...base, yAxis: [{ type: "value", name: "Estación (índice %)", min: 0, max: 100, splitLine: REJA }, { type: "value", name: "ERA5 (% de volumen)", min: 0, splitLine: { show: false } }],
    series: [
      { name: "Estación · suelo 10 cm", type: "line", smooth: true, showSymbol: false, data: serie.estHum, lineStyle: { color: "#2e86ab", width: 2.8 }, itemStyle: { color: "#2e86ab" } },
      { name: "ERA5 · suelo 0–7 cm", type: "line", smooth: true, showSymbol: false, yAxisIndex: 1, data: serie.eraHum, lineStyle: { color: "#7b6cd9", width: 2.6, type: "dashed" }, itemStyle: { color: "#7b6cd9" } }] };

  return (
    <div className="vivos">
      <div className="titulo-seccion"><h2>Altura y pendiente del terreno (SRTM)</h2><p>NASA · se lee en vivo</p></div>
      {errSrtm && <div className="aviso">No se pudo leer la elevación: {errSrtm}</div>}
      {!srtm && !errSrtm && <div className="cargando">Consultando SRTM…</div>}
      {srtm && (
        <div className="kpis">
          <div className="kpi"><span className="kpi-icono">⛰️</span><span className="kpi-titulo">Altura de tu punto</span><strong className="kpi-valor">{coma(srtm.elevacion, 0)} m</strong><span className="kpi-nota">sobre el nivel del mar (SRTM, 30 m)</span></div>
          <div className="kpi"><span className="kpi-icono">📐</span><span className="kpi-titulo">Pendiente</span><strong className="kpi-valor">{coma(srtm.pendiente)} %</strong>
            <span className="kpi-nota">{srtm.pendiente < 3 ? "Terreno plano: poco riesgo de erosión" : srtm.pendiente < 8 ? "Pendiente suave: vigilar la erosión" : "Pendiente fuerte: riesgo de erosión"}</span></div>
          <div className="kpi"><span className="kpi-icono">↕️</span><span className="kpi-titulo">Desnivel a {srtm.distancia} m</span><strong className="kpi-valor">{coma(srtm.desnivel, 0)} m</strong><span className="kpi-nota">entre el punto y sus cuatro vecinos</span></div>
        </div>
      )}
      {srtm && nasaAlt !== null && (
        <p className="ayuda">
          💡 NASA POWER promedia una celda de ~50 km cuya altura media es <b>{coma(nasaAlt, 0)} m</b>, y tu punto está a <b>{coma(srtm.elevacion, 0)} m</b>. Por cada 100 m menos de altura el aire es
          ~0,65 °C más cálido, así que parte de la diferencia de temperatura entre la estación y la NASA (≈ {coma(((nasaAlt - srtm.elevacion) * 0.65) / 100)} °C) se explica solo por la altura.
        </p>
      )}
      {srtm && (
        <p className="validar"><b>🔎 Validar:</b> <a href={srtm.fuente} target="_blank" rel="noreferrer">ver la elevación SRTM de estos puntos</a>
          <span className="validar-detalle"> · servicio OpenTopoData con el modelo srtm30m (NASA)</span></p>
      )}

      <div className="titulo-seccion"><h2>ERA5 frente a tu estación</h2><p>ECMWF / ESA · se lee en vivo</p></div>
      <p className="ayuda">ERA5 es el reanálisis climático europeo que el reto incluye como recurso aliado. Aquí se compara, día a día, con lo que mide tu estación.</p>
      {errEra && <div className="aviso">No se pudo leer ERA5: {errEra}</div>}
      {!era && !errEra && <div className="cargando">Consultando ERA5…</div>}
      {serie && (
        <>
          <div className="kpis">
            <div className="kpi"><span className="kpi-icono">🌧️</span><span className="kpi-titulo">Lluvia (días completos en común)</span>
              <strong className="kpi-valor">{comunes.length ? `${coma(suma(comunes.map((i) => serie.estLluvia[i])))} mm` : "—"}</strong>
              <span className="kpi-nota">ERA5: {comunes.length ? coma(suma(comunes.map((i) => serie.eraLluvia[i]))) : "—"} mm en esos {comunes.length} días</span></div>
            <div className="kpi"><span className="kpi-icono">🌡️</span><span className="kpi-titulo">Temperatura media</span>
              <strong className="kpi-valor">{comunes.length ? `${coma(media(comunes.map((i) => serie.estT[i])))} °C` : "—"}</strong>
              <span className="kpi-nota">ERA5: {comunes.length ? coma(media(comunes.map((i) => serie.eraT[i]))) : "—"} °C (celda de 9 km)</span></div>
          </div>
          <Grafica option={opLluvia} alto={260} />
          <Grafica option={opTemp} alto={260} />
          <Grafica option={opHum} alto={260} />
          <p className="filtro-nota">La humedad del suelo no es comparable en valor: la estación mide un índice calibrado y ERA5 el porcentaje de agua por volumen. Lo que debe coincidir es la forma: ambas suben con la lluvia y bajan al secarse.</p>
          <p className="validar"><b>🔎 Validar ERA5:</b> <a href={urlEra} target="_blank" rel="noreferrer">ver los datos en Open-Meteo (ERA5)</a>
            <span className="validar-detalle"> · punto {coma(estacion.lat, 4)}, {coma(estacion.lon, 4)} · del {desde} al {hasta} · ERA5 llega con unos 5 días de retraso</span></p>
        </>
      )}
    </div>
  );
}
