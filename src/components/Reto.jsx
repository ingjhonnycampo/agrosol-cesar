import { useState } from "react";
import { ESTADOS, RECURSOS, URL_EARTHDATA, URL_RETO, URL_WORLDVIEW } from "../data/recursosReto.js";
import MapaNasa from "./MapaNasa.jsx";
import DatosVivos from "./DatosVivos.jsx";

// Los recursos que la NASA entrega para el reto: cuáles se leen en vivo en la página, cuáles ya usa el modelo,
// cuáles necesitan cuenta y cuáles solo cubren Estados Unidos (con la alternativa para Colombia).
export default function Reto({ estacion, diasEst }) {
  const [filtro, setFiltro] = useState("todos");
  const cuenta = (e) => RECURSOS.filter((r) => r.estado === e).length;
  const lista = RECURSOS.filter((r) => filtro === "todos" || r.estado === filtro);

  return (
    <div>
      <div className="nasa-intro">
        <b>🎯 Nuestro reto:</b> <a href={URL_RETO} target="_blank" rel="noreferrer">Field Shift: Adapting Farms with NASA Data</a> (NASA Space Apps Challenge 2026).
        El reto pide una herramienta que ayude a decidir <b>rotaciones de cultivos</b> con observaciones de la Tierra de la NASA, información local del suelo,
        características de los cultivos y las prioridades del agricultor. Esta pestaña reúne los <b>{RECURSOS.length} recursos</b> que la NASA propone y muestra,
        sin esconder nada, cuáles <b>se leen en vivo</b> en la página, cuáles ya usa el modelo y cuáles no se pueden usar en Colombia.
      </div>

      <div className="titulo-seccion"><h2>Mapa de la NASA sobre Bosconia</h2><p>Capas satelitales en vivo</p></div>
      <MapaNasa estacion={estacion} />

      <DatosVivos estacion={estacion} diasEst={diasEst} />

      <div className="titulo-seccion"><h2>Los recursos del reto, uno por uno</h2><p>{RECURSOS.length} recursos</p></div>
      <div className="chips">
        <button type="button" className={"chip" + (filtro === "todos" ? " on" : "")} onClick={() => setFiltro("todos")}>Todos ({RECURSOS.length})</button>
        {Object.entries(ESTADOS).map(([id, e]) => (
          <button key={id} type="button" className={"chip" + (filtro === id ? " on" : "")} style={{ "--c": e.color }} onClick={() => setFiltro(id)}>
            <i className="punto-chip" />{e.nombre} ({cuenta(id)})
          </button>
        ))}
      </div>
      <div className="reto-lista">
        {lista.map((r) => {
          const e = ESTADOS[r.estado];
          return (
            <article className="reto-card" key={r.id} style={{ "--c": e.color }}>
              <header>
                <span className="reto-estado">{e.nombre}</span>
                <small>{r.org}</small>
              </header>
              <h3><a href={r.url} target="_blank" rel="noreferrer">{r.nombre} ↗</a></h3>
              <p>{r.que}</p>
              <p className="reto-uso"><b>En AgroSol:</b> {r.uso}</p>
              {r.alternativa && <p className="reto-alt"><b>Alternativa para Colombia:</b> <a href={r.altUrl} target="_blank" rel="noreferrer">{r.alternativa} ↗</a></p>}
            </article>
          );
        })}
      </div>

      <p className="validar">
        <b>🔎 Dónde bajar los datos de la NASA:</b> <a href={URL_EARTHDATA} target="_blank" rel="noreferrer">Earthdata Search</a> (cuenta gratuita) ·{" "}
        <a href={URL_WORLDVIEW} target="_blank" rel="noreferrer">Worldview</a> (ver capas sin cuenta).
        <span className="validar-detalle"> La NASA no respalda las páginas de otras entidades; cada una tiene sus propias condiciones de uso.</span>
      </p>
    </div>
  );
}
