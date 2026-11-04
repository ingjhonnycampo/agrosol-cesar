import { useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import { coma } from "../lib/analisis.js";

const METRICAS = [
  { id: "lluvia", nombre: "Lluvia", unidad: "mm", dec: 1, colores: ["#eef3ff", "#9db4ff", "#3d5af1", "#16257a"], min0: true },
  { id: "tmax", nombre: "Temp. máxima", unidad: "°C", dec: 1, colores: ["#fff3d6", "#f6b73c", "#e4572e", "#8c1d12"] },
  { id: "tmin", nombre: "Temp. mínima", unidad: "°C", dec: 1, colores: ["#e3f2fb", "#7cc4f2", "#2e86ab", "#14425c"] },
  { id: "suelo10", nombre: "Humedad suelo 10 cm", unidad: "%", dec: 0, colores: ["#fbf3e4", "#d9b98a", "#2e86ab", "#123c5a"] },
  { id: "horasHoja", nombre: "Hoja húmeda", unidad: "h", dec: 1, colores: ["#f0f8ee", "#9bd39a", "#3f9b52", "#17502a"], min0: true },
];

// Cuadrícula de días coloreada: se ve de un vistazo qué días llovió, hizo calor o hubo rocío.
export default function Calendario({ dias, rango }) {
  const [id, setId] = useState("lluvia");
  const m = METRICAS.find((x) => x.id === id);

  const option = useMemo(() => {
    const datos = dias.filter((d) => d[id] !== null && d[id] !== undefined).map((d) => [d.dia, d[id]]);
    const vals = datos.map((x) => x[1]);
    const min = m.min0 ? 0 : vals.length ? Math.floor(Math.min(...vals)) : 0;
    const max = vals.length ? Math.max(Math.ceil(Math.max(...vals)), min + 1) : 1;
    return {
      tooltip: { formatter: (p) => `${p.value[0]}<br/><b>${coma(p.value[1], m.dec)} ${m.unidad}</b>` },
      visualMap: { min, max, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: m.colores }, text: [`${max} ${m.unidad}`, `${min}`] },
      calendar: {
        top: 36, left: 40, right: 16, bottom: 56, cellSize: ["auto", 26],
        range: [rango.desde, rango.hasta],
        itemStyle: { borderWidth: 3, borderColor: "#fff", color: "rgba(120,140,120,.12)" },
        splitLine: { show: false }, yearLabel: { show: false },
        dayLabel: { firstDay: 1, nameMap: ["D", "L", "M", "M", "J", "V", "S"] },
        monthLabel: { nameMap: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] },
      },
      series: [{ type: "heatmap", coordinateSystem: "calendar", data: datos, itemStyle: { borderRadius: 6 } }],
    };
  }, [dias, id, m, rango]);

  return (
    <div>
      <p className="ayuda">Cada cuadro es un día. Pasa el dedo o el mouse por encima para ver el valor.</p>
      <div className="chips">
        {METRICAS.map((x) => (
          <button key={x.id} type="button" className={"chip" + (id === x.id ? " on" : "")} onClick={() => setId(x.id)}>{x.nombre}</button>
        ))}
      </div>
      {dias.length ? <Grafica option={option} alto={280} /> : <p className="vacio">No hay mediciones en este rango.</p>}
    </div>
  );
}
