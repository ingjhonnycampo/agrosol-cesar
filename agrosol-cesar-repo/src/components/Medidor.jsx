import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { COLORES_NIVEL } from "../lib/semaforo.js";

// Medidor animado tipo reloj. La aguja y el arco se llenan solos cuando cambia el valor.
export default function Medidor({ titulo, valor, unidad, min = 0, max = 100, color: colorBase, nivel, nota, decimales = 0 }) {
  const color = nivel ? COLORES_NIVEL[nivel] : colorBase; // el color cambia con el estado del cultivo
  const ref = useRef(null);
  const chart = useRef(null);

  useEffect(() => {
    chart.current = echarts.init(ref.current, null, { renderer: "svg" });
    const ro = new ResizeObserver(() => chart.current && chart.current.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.current.dispose(); };
  }, []);

  useEffect(() => {
    const sinDato = valor === null || valor === undefined;
    const letra = Math.round(Math.min(26, Math.max(16, ref.current.clientWidth / 7)));
    chart.current.setOption({
      series: [{
        type: "gauge",
        min, max,
        startAngle: 210, endAngle: -30,
        radius: "95%",
        center: ["50%", "58%"],
        animationDuration: 1600,
        animationEasingUpdate: "cubicOut",
        progress: { show: true, roundCap: true, width: 14, itemStyle: { color } },
        axisLine: { roundCap: true, lineStyle: { width: 14, color: [[1, "rgba(120,140,120,.18)"]] } },
        pointer: { show: true, length: "55%", width: 5, itemStyle: { color } },
        anchor: { show: true, size: 12, itemStyle: { color: "#fff", borderColor: color, borderWidth: 3 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "62%"],
          fontSize: letra,
          fontWeight: 800,
          fontFamily: "Baloo 2, sans-serif",
          color: "#1d2a1f",
          formatter: (v) => (sinDato ? "—" : v.toFixed(decimales).replace(".", ",") + " " + unidad),
        },
        data: [{ value: sinDato ? min : Math.max(min, Math.min(max, valor)) }],
      }],
    });
  }, [valor, min, max, color, unidad, decimales]);

  return (
    <div className="medidor">
      <h3 style={{ color }}>{titulo}</h3>
      <div className="medidor-grafica" ref={ref} />
      {nota && <p className="medidor-nota">{nota}</p>}
    </div>
  );
}
