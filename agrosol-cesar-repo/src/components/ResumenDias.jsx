import { useMemo } from "react";
import Grafica from "./Grafica.jsx";
import { coma, fechaCorta, fechaLarga, resumenRango } from "../lib/analisis.js";

function Dato({ icono, titulo, valor, nota }) {
  return (
    <div className="kpi">
      <span className="kpi-icono">{icono}</span>
      <span className="kpi-titulo">{titulo}</span>
      <strong className="kpi-valor">{valor}</strong>
      {nota && <span className="kpi-nota">{nota}</span>}
    </div>
  );
}

// Resumen del rango: cifras clave, gráfica diaria y tabla día por día.
export default function ResumenDias({ dias }) {
  const r = useMemo(() => resumenRango(dias), [dias]);

  const option = useMemo(() => ({
    animationDuration: 700,
    grid: { left: 46, right: 46, top: 36, bottom: 40 },
    legend: { top: 0, textStyle: { color: "#5d6b60" } },
    tooltip: { trigger: "axis", valueFormatter: (v) => (v === null || v === undefined ? "—" : String(v).replace(".", ",")) },
    xAxis: { type: "category", data: dias.map((d) => fechaCorta(d.dia)), axisLabel: { color: "#5d6b60" } },
    yAxis: [
      { type: "value", name: "°C", scale: true, splitLine: { lineStyle: { color: "rgba(120,140,120,.18)" } } },
      { type: "value", name: "mm", min: 0, splitLine: { show: false } },
    ],
    series: [
      { name: "Lluvia (mm)", type: "bar", yAxisIndex: 1, data: dias.map((d) => d.lluvia), itemStyle: { color: "#3d5af1", borderRadius: [6, 6, 0, 0] } },
      { name: "Máx °C", type: "line", smooth: true, data: dias.map((d) => d.tmax), lineStyle: { color: "#e4572e", width: 3 }, itemStyle: { color: "#e4572e" } },
      { name: "Mín °C", type: "line", smooth: true, data: dias.map((d) => d.tmin), lineStyle: { color: "#2e86ab", width: 3 }, itemStyle: { color: "#2e86ab" } },
    ],
  }), [dias]);

  if (!dias.length) return <p className="vacio">No hay mediciones en este rango.</p>;

  return (
    <div>
      <div className="kpis">
        <Dato icono="🌧️" titulo="Lluvia total" valor={`${coma(r.lluviaTotal)} mm`} nota={`${r.diasConLluvia} día(s) con lluvia`} />
        <Dato icono="🔥" titulo="Máxima del aire" valor={`${coma(r.tmax)} °C`} />
        <Dato icono="❄️" titulo="Mínima del aire" valor={`${coma(r.tmin)} °C`} />
        <Dato icono="🍃" titulo="Hoja húmeda" valor={`${coma(r.horasHoja)} h`} nota="Horas con rocío o lluvia" />
      </div>
      <Grafica option={option} alto={320} />
      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr><th>Día</th><th>Máx °C</th><th>Mín °C</th><th>Lluvia mm</th><th>Suelo 10 cm %</th><th>Suelo 30 cm %</th><th>Hoja húmeda h</th><th>Viento máx km/h</th></tr>
          </thead>
          <tbody>
            {[...dias].reverse().map((d) => (
              <tr key={d.dia}>
                <td>{fechaLarga(d.dia)}</td><td>{coma(d.tmax)}</td><td>{coma(d.tmin)}</td><td>{coma(d.lluvia)}</td>
                <td>{coma(d.suelo10, 0)}</td><td>{coma(d.suelo30, 0)}</td><td>{coma(d.horasHoja)}</td><td>{coma(d.vientoMax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
