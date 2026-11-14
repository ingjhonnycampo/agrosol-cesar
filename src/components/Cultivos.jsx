import { useMemo, useState } from "react";
import { CULTIVOS, GRUPOS } from "../data/cultivos.js";
import { CATALOGO, GRUPOS_MUNDO } from "../data/catalogoMundial.js";
import { climaDesdeNasa, mejorMes, MESES } from "../lib/rotacion.js";
import Fuentes from "./Fuentes.jsx";

const rango = ([a, b], u = "") => `${a.toString().replace(".", ",")} a ${b.toString().replace(".", ",")}${u}`;
const NIVEL = { alta: "Alta", media: "Media", baja: "Baja", sensible: "Sensible", tolerante: "Tolerante" };
const NOMBRE_GRUPO = { ...GRUPOS, ...GRUPOS_MUNDO };
// quita tildes y mayúsculas para que "pina" encuentre "Piña"
const limpiar = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const TODOS = [...CULTIVOS, ...CATALOGO];

// Fichas de los cultivos del Cesar y del mundo, con buscador y la prueba "¿sirve en Bosconia?".
export default function Cultivos({ modelo, ap, consulta }) {
  const [grupo, setGrupo] = useState("todos");
  const [origen, setOrigen] = useState("todos");
  const [texto, setTexto] = useState("");
  const q = limpiar(texto.trim());

  const base = TODOS.filter((c) => origen === "todos" || (origen === "cesar" ? c.enCesar !== "mundo" : c.enCesar === "mundo"));
  const grupos = ["todos", ...new Set(base.map((c) => c.grupo))];
  // al buscar, primero van los que EMPIEZAN con lo escrito (piña antes que espinaca), luego los que lo contienen
  const puntos = (c) => {
    const nombre = limpiar(c.nombre), alias = limpiar(c.alias || "");
    if (nombre.startsWith(q)) return 3;
    if (nombre.split(/[^a-z0-9]+/).some((p) => p.startsWith(q)) || alias.split(/[^a-z0-9]+/).some((p) => p.startsWith(q))) return 2;
    return limpiar([c.nombre, c.alias || "", c.familia, NOMBRE_GRUPO[c.grupo] || "", c.region || ""].join(" ")).includes(q) ? 1 : 0;
  };
  const lista = base.filter((c) => (grupo === "todos" || c.grupo === grupo) && (!q || puntos(c) > 0));
  if (q) lista.sort((x, y) => puntos(y) - puntos(x));

  const cambiarOrigen = (o) => { setOrigen(o); setGrupo("todos"); };

  return (
    <div>
      <p className="ayuda">
        {TODOS.length} cultivos: los del Cesar y otros de todo el mundo. <b>Escribe el nombre</b> (en español o en inglés) para buscarlo y
        <b> toca una ficha</b> para ver si le serviría el clima de Bosconia.
      </p>
      <div className="cult-buscar">
        <label htmlFor="buscar-cultivo" className="cult-lupa" aria-hidden="true">🔎</label>
        <input id="buscar-cultivo" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca un cultivo: tomate, coffee, quinua, mango…" autoComplete="off" />
        {texto && <button type="button" className="cult-borrar" onClick={() => setTexto("")} aria-label="Borrar búsqueda">✕</button>}
      </div>
      <div className="chips">
        {[["todos", "🌎 Todos"], ["cesar", "📍 Del Cesar"], ["mundo", "🌍 Del mundo"]].map(([id, nombre]) => (
          <button key={id} type="button" className={"chip" + (origen === id ? " on" : "")} onClick={() => cambiarOrigen(id)}>{nombre}</button>
        ))}
      </div>
      <div className="chips">
        {grupos.map((g) => (
          <button key={g} type="button" className={"chip" + (grupo === g ? " on" : "")} onClick={() => setGrupo(g)}>
            {g === "todos" ? "Todos los tipos" : NOMBRE_GRUPO[g]}
          </button>
        ))}
      </div>
      <p className="cult-cuenta">{lista.length === 1 ? "1 cultivo" : `${lista.length} cultivos`}{q ? ` para “${texto.trim()}”` : ""}</p>
      {lista.length ? (
        <div className="cultivos-rejilla">
          {lista.map((c) => <Ficha key={c.id} c={c} modelo={modelo} ap={ap} consulta={consulta} />)}
        </div>
      ) : (
        <div className="rot-alerta">
          No encontramos “{texto.trim()}”. Prueba con otra palabra, con el nombre en inglés o quita los filtros. El catálogo no tiene todos los cultivos del mundo:
          si falta uno que les interesa, se puede agregar con sus datos de clima, agua y suelo.
        </div>
      )}
      <Fuentes />
    </div>
  );
}

// ¿Sirve en Bosconia? Usa los 25 años de clima de la NASA y lo que aprendió la estación (el mismo modelo de Rotación).
function PruebaBosconia({ c, modelo, ap, consulta }) {
  const r = useMemo(() => {
    if (!modelo?.reciente) return null;
    const clima = climaDesdeNasa(modelo.reciente);
    const ctx = { hist: modelo.hist, clima, ap, riesgo: consulta?.riesgo };
    const seco = mejorMes(c, { ...ctx, riego: false });
    const riego = mejorMes(c, { ...ctx, riego: true });
    const temps = clima.tMes.filter((t) => t !== null);
    const tLocal = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length + (ap?.tempAjuste || 0) : null;
    return { seco, riego, tLocal };
  }, [c, modelo, ap, consulta]);

  if (!r) return <span className="cult-prueba espera">⏳ Cargando el clima de Bosconia para compararlo…</span>;
  const [tmin, tmax] = c.temp.tol;
  const tTxt = r.tLocal === null ? "" : r.tLocal > tmax
    ? ` Aquí la temperatura media (${r.tLocal.toFixed(1).replace(".", ",")} °C) pasa del máximo que tolera (${tmax} °C).`
    : r.tLocal < tmin ? ` Aquí la temperatura media (${r.tLocal.toFixed(1).replace(".", ",")} °C) queda por debajo del mínimo que tolera (${tmin} °C).` : "";
  let nivel, texto;
  if (r.seco.puntaje >= 70) { nivel = "ok"; texto = `✅ Puede darse en Bosconia sin riego. Mejor mes para sembrar: ${MESES[r.seco.mes]}.`; }
  else if (r.riego.puntaje >= 70) { nivel = "riego"; texto = `💧 Solo con riego: sin riego la lluvia no le alcanza. Mejor mes: ${MESES[r.riego.mes]}.`; }
  else { nivel = "no"; texto = `⛔ El clima de Bosconia no le conviene.${tTxt || " La temperatura o el agua se salen de lo que tolera."}`; }
  return (
    <span className={"cult-prueba " + nivel}>
      <b>¿Sirve en Bosconia?</b>
      <span>{texto}</span>
      <small>Cálculo del modelo con el clima de la NASA (valores de referencia del cultivo, sin estudio de suelo).</small>
    </span>
  );
}

function Ficha({ c, modelo, ap, consulta }) {
  const [abierta, setAbierta] = useState(false);
  const mundo = c.enCesar === "mundo";
  return (
    <button type="button" className={"ficha" + (abierta ? " abierta" : "")} onClick={() => setAbierta(!abierta)} aria-expanded={abierta}>
      <span className="ficha-emoji" aria-hidden="true">{c.emoji}</span>
      <span className="ficha-titulo">
        <b>{c.nombre}</b>
        <small>{c.familia}</small>
      </span>
      <span className={"ficha-etiqueta " + (c.enCesar === "confirmado" ? "ok" : mundo ? "mundo" : "por")}>
        {c.enCesar === "confirmado" ? "Se cultiva en el Cesar" : mundo ? "Cultivo del mundo" : "Por confirmar en el Cesar"}
      </span>
      <ul className="ficha-datos">
        <li>⏱️ {c.perenne ? <>Cultivo de varios años: <b>{c.perenne.charAt(0).toLowerCase() + c.perenne.slice(1)}</b></> : <>Ciclo: <b>{rango(c.ciclo, " días")}</b></>}</li>
        <li>🌡️ Temperatura ideal: <b>{rango(c.temp.opt, " °C")}</b></li>
        <li>💧 Agua: <b>{rango(c.agua, " mm")}</b>{c.perenne ? " al año" : ""}</li>
        <li>🧪 pH ideal: <b>{rango(c.ph.opt)}</b></li>
      </ul>
      <span className="ficha-mas">
        {abierta && <PruebaBosconia c={c} modelo={modelo} ap={ap} consulta={consulta} />}
        {mundo && <span>🌍 Dónde se cultiva: {c.region}</span>}
        {c.alias && <span>🔤 Otros nombres: {c.alias}</span>}
        <span>🪱 Suelo: {c.suelo}</span>
        <span>🍽️ Gasta nitrógeno: {NIVEL[c.exigenciaN]}{c.fijaN ? " · ✅ Fija nitrógeno" : ""}</span>
        <span>☀️ Resistencia a sequía: {NIVEL[c.sequia]} · 🧂 Sales: {NIVEL[c.sales] || "Media"}</span>
        {!mundo && <span>💰 Mercado (estimado): {"★".repeat(c.mercado)}{"☆".repeat(5 - c.mercado)}</span>}
        <span className="ficha-nota">{c.nota}</span>
      </span>
    </button>
  );
}
