import { PRESETS, diasEntre, fechaLarga } from "../lib/analisis.js";

// Botones rápidos + calendario "desde / hasta". `rango` = { preset, desde, hasta } ya calculado.
export default function FiltroFechas({ rango, limites, nMediciones, onPreset, onPersonalizado }) {
  const cambiar = (campo, valor) => {
    if (!valor) return;
    let { desde, hasta } = rango;
    if (campo === "desde") desde = valor; else hasta = valor;
    if (desde > hasta) { if (campo === "desde") hasta = desde; else desde = hasta; }
    onPersonalizado(desde, hasta);
  };

  return (
    <div className="filtro">
      <div className="chips">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" className={"chip" + (rango.preset === p.id ? " on" : "")} onClick={() => onPreset(p.id)}>
            {p.nombre}
          </button>
        ))}
        <span className={"chip chip-info" + (rango.preset === "custom" ? " on" : "")}>Personalizado</span>
      </div>
      <div className="filtro-fechas">
        <label>Desde
          <input type="date" value={rango.desde} min={limites.min} max={limites.max > rango.hasta ? limites.max : rango.hasta} onChange={(e) => cambiar("desde", e.target.value)} />
        </label>
        <label>Hasta
          <input type="date" value={rango.hasta} min={limites.min} max={limites.max > rango.hasta ? limites.max : rango.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
        </label>
      </div>
      <p className="filtro-nota">
        {fechaLarga(rango.desde)}{rango.desde !== rango.hasta && <> → {fechaLarga(rango.hasta)}</>}
        {" · "}{diasEntre(rango.desde, rango.hasta)} {diasEntre(rango.desde, rango.hasta) === 1 ? "día" : "días"}
        {" · "}{nMediciones} mediciones
      </p>
    </div>
  );
}
