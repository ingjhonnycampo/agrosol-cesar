import { useMemo, useState } from "react";
import { coma } from "../lib/analisis.js";
import { diaLocal } from "../lib/limpieza.js";

const COLUMNAS = [
  { k: "t", nombre: "Fecha y hora", fmt: (f) => new Date(f.t).toLocaleString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) },
  { k: "temp", nombre: "Aire °C", dec: 1 },
  { k: "tsuelo", nombre: "Suelo °C", dec: 1 },
  { k: "suelo10", nombre: "Suelo 10 cm %", dec: 0 },
  { k: "suelo30", nombre: "Suelo 30 cm %", dec: 0 },
  { k: "luz", nombre: "Luz %", dec: 0 },
  { k: "hojaEstado", nombre: "Hoja", fmt: (f) => f.hojaEstado },
  { k: "lluviaMm", nombre: "Lluvia mm", dec: 1 },
  { k: "vientoKmh", nombre: "Viento km/h", dec: 1 },
];
const POR_PAGINA = 50;

function descargarCsv(filas) {
  const enc = ["fecha_hora_colombia", ...COLUMNAS.slice(1).map((c) => c.nombre)].join(";");
  const lineas = filas.map((f) => {
    const hora = new Date(new Date(f.t).getTime() - 5 * 3600000).toISOString().slice(0, 19).replace("T", " ");
    return [hora, ...COLUMNAS.slice(1).map((c) => (c.fmt ? c.fmt(f) : coma(f[c.k], c.dec)))].join(";");
  });
  const blob = new Blob(["﻿" + [enc, ...lineas].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `agrosol_${diaLocal(filas[0].t)}_a_${diaLocal(filas[filas.length - 1].t)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Todas las mediciones del rango: se ordenan tocando el encabezado y se descargan en CSV (abre en Excel).
export default function Tabla({ filas }) {
  const [orden, setOrden] = useState({ k: "t", asc: false });
  const [pagina, setPagina] = useState(0);

  const ordenadas = useMemo(() => {
    const v = (f) => f[orden.k];
    return [...filas].sort((a, b) => {
      const x = v(a), y = v(b);
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * (orden.asc ? 1 : -1);
    });
  }, [filas, orden]);

  const paginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  const p = Math.min(pagina, paginas - 1);
  const visibles = ordenadas.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);

  if (!filas.length) return <p className="vacio">No hay mediciones en este rango.</p>;

  const clic = (k) => { setOrden((o) => ({ k, asc: o.k === k ? !o.asc : false })); setPagina(0); };

  return (
    <div>
      <div className="tabla-barra">
        <span>{filas.length} mediciones</span>
        <button type="button" className="boton" onClick={() => descargarCsv(filas)}>⬇️ Descargar CSV</button>
      </div>
      <div className="tabla-caja">
        <table className="tabla">
          <thead>
            <tr>
              {COLUMNAS.map((c) => (
                <th key={c.k} onClick={() => clic(c.k)} className="ordenable">
                  {c.nombre}{orden.k === c.k ? (orden.asc ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.t}>{COLUMNAS.map((c) => <td key={c.k}>{c.fmt ? c.fmt(f) : coma(f[c.k], c.dec)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="paginacion">
        <button type="button" className="boton" disabled={p === 0} onClick={() => setPagina(p - 1)}>← Anterior</button>
        <span>Página {p + 1} de {paginas}</span>
        <button type="button" className="boton" disabled={p >= paginas - 1} onClick={() => setPagina(p + 1)}>Siguiente →</button>
      </div>
    </div>
  );
}
