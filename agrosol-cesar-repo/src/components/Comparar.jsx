import { useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import { SENSORES, sensorPorId } from "../lib/sensores.js";
import { diasEntre, fechaCorta, filtrar, msDia, sumarDias, xLocal } from "../lib/analisis.js";

// Pone el rango elegido junto al periodo anterior de la misma duración, para ver si cambió algo.
export default function Comparar({ todas, rango }) {
  const [id, setId] = useState("temp");
  const s = sensorPorId(id);

  const n = diasEntre(rango.desde, rango.hasta);
  const antHasta = sumarDias(rango.desde, -1);
  const antDesde = sumarDias(rango.desde, -n);

  const { actual, anterior } = useMemo(() => ({
    actual: filtrar(todas, rango.desde, rango.hasta),
    anterior: filtrar(todas, antDesde, antHasta),
  }), [todas, rango.desde, rango.hasta, antDesde, antHasta]);

  const option = useMemo(() => {
    const corte = msDia(rango.desde) - msDia(antDesde); // lleva el periodo anterior encima del actual
    const serie = (nombre, filas, color, desplazar, ancho) => ({
      name: nombre, type: s.barras ? "bar" : "line", showSymbol: false, sampling: "lttb", smooth: !s.barras,
      lineStyle: { width: ancho, color, type: desplazar ? "dashed" : "solid" }, itemStyle: { color },
      data: filas.map((f) => [xLocal(f.t) + (desplazar ? corte : 0), f[id]]),
    });
    return {
      useUTC: true, animationDuration: 700,
      grid: { left: 46, right: 16, top: 40, bottom: 70 },
      legend: { top: 0, textStyle: { color: "#5d6b60" } },
      tooltip: { trigger: "axis", valueFormatter: (v) => (v === null || v === undefined ? "—" : String(v).replace(".", ",") + " " + s.unidad) },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 22, bottom: 14 }],
      xAxis: { type: "time" },
      yAxis: { type: "value", name: s.unidad, scale: s.unidad !== "mm" && s.unidad !== "km/h", min: s.barras ? 0 : undefined, splitLine: { lineStyle: { color: "rgba(120,140,120,.18)" } } },
      series: [
        serie(`Periodo anterior (${fechaCorta(antDesde)} → ${fechaCorta(antHasta)})`, anterior, "#9aa5a0", true, 2),
        serie(`Periodo elegido (${fechaCorta(rango.desde)} → ${fechaCorta(rango.hasta)})`, actual, s.color, false, 2.6),
      ],
    };
  }, [actual, anterior, s, id, rango, antDesde, antHasta]);

  return (
    <div>
      <p className="ayuda">Compara el rango elegido con los {n} {n === 1 ? "día" : "días"} anteriores (línea punteada gris).</p>
      <div className="chips">
        {SENSORES.map((x) => (
          <button key={x.id} type="button" className={"chip" + (id === x.id ? " on" : "")} style={{ "--c": x.color }} onClick={() => setId(x.id)}>
            <i className="punto-chip" />{x.corto}
          </button>
        ))}
      </div>
      {anterior.length === 0
        ? <p className="vacio">No hay datos del periodo anterior ({fechaCorta(antDesde)} → {fechaCorta(antHasta)}). Prueba un rango más reciente.</p>
        : <Grafica option={option} alto={400} />}
    </div>
  );
}
