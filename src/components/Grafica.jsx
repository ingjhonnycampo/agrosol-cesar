import { useEffect, useRef } from "react";
import * as echarts from "echarts";

// Envoltura mínima de ECharts: le pasas las opciones y ella se encarga de crear, redimensionar y limpiar.
export default function Grafica({ option, alto = 340 }) {
  const ref = useRef(null);
  const chart = useRef(null);

  useEffect(() => {
    chart.current = echarts.init(ref.current, null, { renderer: "canvas" });
    const ro = new ResizeObserver(() => chart.current && chart.current.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.current.dispose(); chart.current = null; };
  }, []);

  useEffect(() => {
    if (chart.current) chart.current.setOption({ textStyle: { fontFamily: "Nunito, sans-serif" }, ...option }, true);
  }, [option]);

  return <div className="grafica" ref={ref} style={{ height: alto }} />;
}
