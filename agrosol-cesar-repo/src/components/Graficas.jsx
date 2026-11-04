import { useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import { SENSORES, sensorPorId } from "../lib/sensores.js";
import { xLocal } from "../lib/analisis.js";

// Línea de tiempo: se eligen uno o varios sensores; cada unidad (°C, %, mm, km/h) tiene su propio eje.
export default function Graficas({ filas }) {
  const [sel, setSel] = useState(["temp", "suelo10", "lluviaMm"]);

  const alternar = (id) => setSel((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]));

  const option = useMemo(() => {
    const sensores = sel.map(sensorPorId);
    const unidades = [...new Set(sensores.map((s) => s.unidad))];
    return {
      useUTC: true,
      animationDuration: 700,
      grid: { left: 46, right: 16 + Math.max(0, unidades.length - 1) * 44, top: 30, bottom: 70 },
      tooltip: { trigger: "axis", valueFormatter: (v) => (v === null || v === undefined ? "—" : String(v).replace(".", ",")) },
      toolbox: { right: 6, feature: { saveAsImage: { title: "Guardar imagen", name: "agrosol" } } },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 22, bottom: 14 }],
      xAxis: { type: "time" },
      yAxis: unidades.map((u, i) => ({
        type: "value", name: u, position: i === 0 ? "left" : "right", offset: i > 1 ? (i - 1) * 44 : 0,
        splitLine: { show: i === 0, lineStyle: { color: "rgba(120,140,120,.18)" } },
        axisLabel: { color: "#5d6b60" }, nameTextStyle: { color: "#5d6b60" },
        scale: u !== "mm" && u !== "km/h",
        min: u === "mm" || u === "km/h" ? 0 : undefined,
      })),
      series: sensores.map((s) => ({
        name: s.nombre, type: s.barras ? "bar" : "line", yAxisIndex: unidades.indexOf(s.unidad),
        showSymbol: false, smooth: !s.barras, sampling: "lttb", connectNulls: false,
        lineStyle: { width: 2.2, color: s.color }, itemStyle: { color: s.color },
        areaStyle: s.barras ? undefined : { color: s.color, opacity: 0.06 },
        data: filas.map((f) => [xLocal(f.t), f[s.id]]),
      })),
    };
  }, [filas, sel]);

  return (
    <div>
      <p className="ayuda">Elige qué sensores ver. Arrastra o usa la rueda para acercar un momento del día.</p>
      <div className="chips">
        {SENSORES.map((s) => (
          <button key={s.id} type="button" className={"chip" + (sel.includes(s.id) ? " on" : "")}
            style={{ "--c": s.color }} onClick={() => alternar(s.id)}>
            <i className="punto-chip" />{s.corto}
          </button>
        ))}
      </div>
      {filas.length ? <Grafica option={option} alto={400} /> : <p className="vacio">No hay mediciones en este rango.</p>}
    </div>
  );
}
