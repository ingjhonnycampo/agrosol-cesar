import { useState } from "react";
import { CULTIVOS, GRUPOS } from "../data/cultivos.js";
import Fuentes from "./Fuentes.jsx";

const rango = ([a, b], u = "") => `${a.toString().replace(".", ",")} a ${b.toString().replace(".", ",")}${u}`;
const NIVEL = { alta: "Alta", media: "Media", baja: "Baja", sensible: "Sensible", tolerante: "Tolerante" };

// Fichas de los cultivos del Cesar con lo que necesita cada uno.
export default function Cultivos() {
  const [grupo, setGrupo] = useState("todos");
  const lista = CULTIVOS.filter((c) => grupo === "todos" || c.grupo === grupo);
  const grupos = ["todos", ...new Set(CULTIVOS.map((c) => c.grupo))];

  return (
    <div>
      <p className="ayuda">Cultivos del Cesar y lo que necesita cada uno. Toca una ficha para ver más detalles.</p>
      <div className="chips">
        {grupos.map((g) => (
          <button key={g} type="button" className={"chip" + (grupo === g ? " on" : "")} onClick={() => setGrupo(g)}>
            {g === "todos" ? "Todos" : GRUPOS[g]}
          </button>
        ))}
      </div>
      <div className="cultivos-rejilla">
        {lista.map((c) => <Ficha key={c.id} c={c} />)}
      </div>
      <Fuentes />
    </div>
  );
}

function Ficha({ c }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <button type="button" className={"ficha" + (abierta ? " abierta" : "")} onClick={() => setAbierta(!abierta)} aria-expanded={abierta}>
      <span className="ficha-emoji" aria-hidden="true">{c.emoji}</span>
      <span className="ficha-titulo">
        <b>{c.nombre}</b>
        <small>{c.familia}</small>
      </span>
      <span className={"ficha-etiqueta " + (c.enCesar === "confirmado" ? "ok" : "por")}>
        {c.enCesar === "confirmado" ? "Se cultiva en el Cesar" : "Por confirmar en el Cesar"}
      </span>
      <ul className="ficha-datos">
        <li>⏱️ Ciclo: <b>{rango(c.ciclo, " días")}</b></li>
        <li>🌡️ Temperatura ideal: <b>{rango(c.temp.opt, " °C")}</b></li>
        <li>💧 Agua: <b>{rango(c.agua, " mm")}</b></li>
        <li>🧪 pH ideal: <b>{rango(c.ph.opt)}</b></li>
      </ul>
      <span className="ficha-mas">
        <span>🪱 Suelo: {c.suelo}</span>
        <span>🍽️ Gasta nitrógeno: {NIVEL[c.exigenciaN]}{c.fijaN ? " · ✅ Fija nitrógeno" : ""}</span>
        <span>☀️ Resistencia a sequía: {NIVEL[c.sequia]} · 🧂 Sales: {NIVEL[c.sales] || "Media"}</span>
        <span>💰 Mercado (estimado): {"★".repeat(c.mercado)}{"☆".repeat(5 - c.mercado)}</span>
        <span className="ficha-nota">{c.nota}</span>
      </span>
    </button>
  );
}
