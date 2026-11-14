import { useMemo } from "react";
import { calcularConfianza } from "../lib/confianza.js";
import { resumenSatelite, TEXTO_NIVEL } from "../lib/satelite.js";

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const NIVEL = { alta: { t: "alta", c: "#2f9e4f", i: "🟢" }, media: { t: "media", c: "#e8a317", i: "🟡" }, baja: { t: "baja", c: "#d9443a", i: "🔴" } };
const ICONO = { bien: "✅", aviso: "⚠️", mal: "⛔", info: "ℹ️" };
const f2 = (v) => (Math.round(v * 100) / 100).toString().replace(".", ",");

// ¿Qué tan segura es la recomendación? Resume cuánto coinciden la estación, la NASA y los satélites, y qué ve el satélite en el lote.
export default function Confianza({ ap, modelo, suelo }) {
  const sat = useMemo(() => resumenSatelite(), []);
  const c = useMemo(() => (modelo?.hist ? calcularConfianza({ ap, modelo, suelo, sat }) : null), [ap, modelo, suelo, sat]);
  if (!c) return null;
  const n = NIVEL[c.nivel];
  return (
    <div className="confianza" style={{ "--c": n.c }}>
      <div className="conf-cabeza">
        <span className="conf-nivel">{n.i} Confianza {n.t}</span>
        <span className="conf-punt">{c.puntaje} de 100</span>
      </div>
      <p className="conf-frase">
        {c.nivel === "alta" && "Los datos de la estación, la NASA y los satélites cuentan una historia parecida: puedes apoyarte en esta recomendación (siempre confirmándola con un agrónomo)."}
        {c.nivel === "media" && "Hay datos buenos, pero faltan o se separan algunos: toma la recomendación como una buena pista y revisa lo que limita la confianza."}
        {c.nivel === "baja" && "Todavía hay pocos datos que se puedan comparar: úsala solo como idea y confírmala con un agrónomo o la UMATA."}
      </p>
      {sat && sat.ndviActual !== null && (
        <p className="conf-sat">
          🛰️ <b>Lo que ve el satélite en el lote:</b> NDVI de {f2(sat.ndviActual)}, es decir, <b>{TEXTO_NIVEL[sat.nivel]}</b>
          {sat.antiguo ? ` (el último dato tiene ${sat.edadDias} días: puede haber cambiado)` : ""}.
          {sat.mesesVerdes.length > 0 && sat.mesesConDato >= 8 && <> En el año observado el terreno estuvo más verde en {sat.mesesVerdes.map((m) => MES[m]).join(", ")}.</>}
        </p>
      )}
      <details className="conf-detalle">
        <summary>¿De dónde sale esta confianza?</summary>
        <ul>
          {c.items.map((i) => <li key={i.id}><span aria-hidden="true">{ICONO[i.estado]}</span> <b>{i.nombre}.</b> {i.texto}</li>)}
        </ul>
        {c.limitantes.length > 0 && (
          <p className="conf-mejora"><b>Lo que más la mejoraría:</b> {c.limitantes.map((i) => i.mejora).join(" ")}</p>
        )}
        <p className="conf-nota">El puntaje es el promedio de estos puntos; los pesos son supuestos del equipo, no un cálculo estadístico validado.</p>
      </details>
    </div>
  );
}
