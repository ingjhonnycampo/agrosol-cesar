import { useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import Fuentes from "./Fuentes.jsx";
import OpcionesCultivos from "./OpcionesCultivos.jsx";
import { MESES, climaDesdeNasa } from "../lib/rotacion.js";
import { construirEstrategias } from "../lib/estrategias.js";
import Confianza from "./Confianza.jsx";
import { resumenSatelite } from "../lib/satelite.js";

const SAT = resumenSatelite();

const PALETA = ["#2e86ab", "#e8a317", "#3f9b52", "#9b59b6", "#e4572e", "#16a085"];
const EJES = [["agua", "Agua"], ["suelo", "Suelo"], ["ingresos", "Ingresos"], ["seguridad", "Seguridad"], ["cobertura", "Cobertura"]];
const SECCIONES = [
  ["porQue", "🧭 Por qué se sugiere"], ["evidencia", "📊 Evidencia que la respalda"], ["beneficios", "✅ Beneficios"],
  ["vacios", "❓ Lo que no sabemos"], ["riesgos", "⚠️ Riesgos para revisar"],
];
// Una sola cosa que le importa al agricultor: se traduce en prioridades y tolerancia al riesgo
const ENFOQUES = [
  { id: "seguridad", icono: "🛡️", nombre: "Que no se pierda la cosecha", pesos: { agua: 2, rapidez: 1, suelo: 2, mercado: 2 }, riesgo: "seguro" },
  { id: "agua", icono: "💧", nombre: "Gastar poca agua", pesos: { agua: 5, rapidez: 1, suelo: 2, mercado: 1 }, riesgo: "equilibrado" },
  { id: "suelo", icono: "🌱", nombre: "Cuidar la tierra", pesos: { agua: 2, rapidez: 3, suelo: 5, mercado: 1 }, riesgo: "equilibrado" },
  { id: "ingresos", icono: "💰", nombre: "Ganar más plata", pesos: { agua: 1, rapidez: 2, suelo: 1, mercado: 5 }, riesgo: "arriesgado" },
];
const CLIMAS = [
  { id: "normal", icono: "🌤️", nombre: "Clima normal", lluviaPct: 0, tempMas: 0 },
  { id: "seco", icono: "🏜️", nombre: "Año seco", lluviaPct: -30, tempMas: 0 },
  { id: "lluvioso", icono: "🌧️", nombre: "Año lluvioso", lluviaPct: 30, tempMas: 0 },
  { id: "caliente", icono: "🔥", nombre: "Año más caliente", lluviaPct: 0, tempMas: 2 },
  { id: "ambos", icono: "☀️", nombre: "Seco y caliente", lluviaPct: -30, tempMas: 2 },
];
const NIVELES = ["Nada", "Poco", "Algo", "Bastante", "Mucho", "Lo máximo"];
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nivelDe = (v) => (v >= 66 ? ["Alto", "alto"] : v >= 40 ? ["Medio", "medio"] : ["Bajo", "bajo"]);
const f0 = (v) => Math.round(v).toLocaleString("es-CO");

// "En una frase": qué siembra el plan y cuánto queda la tierra sin cultivo
function frase(e) {
  if (!e.slots.length) return "Con estas condiciones no hay un cultivo viable en ningún mes.";
  const partes = e.slots.map((s, i) => `${i ? "luego " : ""}${s.cultivo.nombre.replace(" (abono verde)", "")} en ${MESES[s.inicio]}`);
  return `Siembra ${partes.join(", ")}.` + (e.desnudos.length ? ` La tierra queda sin cultivo ${e.desnudos.length} ${e.desnudos.length === 1 ? "mes" : "meses"}.` : " La tierra queda cubierta todo el año.");
}

// Qué cambia frente a lo que el agricultor hace hoy
function frente(e, base) {
  if (!base || e.est.id === "actual") return [];
  const d = (k) => e.metricas[k] - base.metricas[k];
  const l = [];
  if (d("seguridad") >= 8) l.push(["✅", `Más seguro: sale bien en unos ${Math.round(e.metricas.seguridad / 10)} de cada 10 años (hoy, ${Math.round(base.metricas.seguridad / 10)})`]);
  else if (d("seguridad") <= -8) l.push(["⚠️", `Menos seguro: unos ${Math.round(e.metricas.seguridad / 10)} de cada 10 años (hoy, ${Math.round(base.metricas.seguridad / 10)})`]);
  if (d("suelo") >= 10) l.push(["✅", "Cuida más la tierra"]); else if (d("suelo") <= -10) l.push(["⚠️", "Cuida menos la tierra"]);
  if (d("agua") >= 10) l.push(["✅", `Necesita menos riego (unos ${f0(Math.max(0, base.riegoTotal - e.riegoTotal))} mm menos en un año seco)`]);
  else if (d("agua") <= -10) l.push(["⚠️", "Necesita más riego"]);
  if (d("ingresos") >= 10) l.push(["✅", "Deja más plata (estimado)"]); else if (d("ingresos") <= -10) l.push(["⚠️", "Deja menos plata (estimado)"]);
  if (d("cobertura") >= 10) l.push(["✅", "La tierra queda más tapada"]); else if (d("cobertura") <= -10) l.push(["⚠️", "La tierra queda más desnuda"]);
  return l.length ? l : [["ℹ️", "Es parecido a lo que haces hoy"]];
}

// Compara el rotación elegida con 3 propuestas de 12 meses
export default function Estrategias({ estacion, suelo, consulta, onConsulta, modelo, ap }) {
  const [actual, setActual] = useState(["maiz", ""]);
  const [maquinaria, setMaquinaria] = useState(true);
  const [escenario, setEscenario] = useState({ lluviaPct: 0, tempMas: 0 });
  const [enfoque, setEnfoque] = useState(null);
  const cambiar = (parte) => onConsulta({ ...consulta, ...parte });
  const clima = useMemo(() => (modelo.reciente ? climaDesdeNasa(modelo.reciente) : null), [modelo.reciente]);
  const periodo = modelo.hist ? `${modelo.hist.inicio.slice(0, 4)}–${modelo.hist.fin.slice(0, 4)}` : "";

  const entrada = useMemo(() => (clima && modelo.hist ? {
    hist: modelo.hist, clima, aprendizaje: ap, suelo, riego: consulta.riego, riesgo: consulta.riesgo, maquinaria,
    pesos: consulta.pesos, actual, anterior: consulta.anterior, periodo, relieve: modelo.relieve, satelite: SAT,
  } : null), [clima, modelo.hist, modelo.relieve, ap, suelo, consulta, maquinaria, actual, periodo]);

  const neutro = useMemo(() => (entrada ? construirEstrategias(entrada) : null), [entrada]);
  const hayEscenario = escenario.lluviaPct !== 0 || escenario.tempMas !== 0;
  const conEscenario = useMemo(() => (entrada && hayEscenario ? construirEstrategias({ ...entrada, escenario }) : null), [entrada, escenario, hayEscenario]);
  const res = conEscenario || neutro;
  const climaActivo = CLIMAS.find((c) => c.lluviaPct === escenario.lluviaPct && c.tempMas === escenario.tempMas)?.id;

  const elegirEnfoque = (e) => { setEnfoque(e.id); cambiar({ pesos: e.pesos, riesgo: e.riesgo }); };

  const radar = useMemo(() => res && {
    animationDuration: 600,
    legend: { bottom: 0, textStyle: { color: "#5d6b60" } }, tooltip: {},
    radar: { indicator: EJES.map(([, n]) => ({ name: n, max: 100 })), radius: "62%", axisName: { color: "#1d2a1f", fontWeight: 700 } },
    series: [{
      type: "radar",
      data: res.estrategias.map((e) => ({
        name: e.est.nombre, value: EJES.map(([k]) => e.metricas[k]),
        lineStyle: { color: e.est.color, width: 2.6 }, itemStyle: { color: e.est.color }, areaStyle: { color: e.est.color, opacity: 0.1 },
      })),
    }],
  }, [res]);

  const cambios = useMemo(() => {
    if (!neutro || !conEscenario) return null;
    return conEscenario.estrategias.map((e) => {
      const antes = neutro.estrategias.find((x) => x.est.id === e.est.id);
      return { nombre: e.est.nombre, icono: e.est.icono, antes: Math.round(antes.metricas.seguridad / 10), ahora: Math.round(e.metricas.seguridad / 10) };
    });
  }, [neutro, conEscenario]);
  const masAfectada = cambios && cambios.reduce((m, c) => (c.ahora - c.antes < m.ahora - m.antes ? c : m), cambios[0]);

  const mejor = res?.estrategias.find((e) => e.est.id === res.mejorId);
  const base = res?.estrategias.find((e) => e.est.id === "actual");

  return (
    <div>
      <div className="nasa-intro">
        <b>🔀 ¿Qué te conviene sembrar este año?</b> Contesta tres preguntas y la página compara <b>cuatro formas de usar tu lote durante 12 meses</b>, usando el clima real de los últimos {periodo ? periodo : "25 años"} y los datos de tu estación.
        <b> Es una guía, no una orden:</b> la decisión es del agricultor, con un agrónomo.
      </div>

      <div className="rot-form">
        <div className="rot-pesos">
          <span>1️⃣ ¿Qué cultivas hoy?</span>
          <div className="est-actual">
            <select value={actual[0]} onChange={(e) => setActual([e.target.value, actual[1]])} aria-label="Cultivo principal">
              <option value="">— elige —</option>
              <OpcionesCultivos filtro={(c) => !c.abono} />
            </select>
            <select value={actual[1]} onChange={(e) => setActual([actual[0], e.target.value])} aria-label="Segundo cultivo">
              <option value="">Y después, el mismo</option>
              <OpcionesCultivos filtro={(c) => !c.abono} prefijo="Y después, " />
            </select>
          </div>
        </div>
        <div className="rot-pesos">
          <span>2️⃣ ¿Tienes riego?</span>
          <div className="chips">
            <button type="button" className={"chip" + (!consulta.riego ? " on" : "")} onClick={() => cambiar({ riego: false })}>🌧️ No, solo la lluvia</button>
            <button type="button" className={"chip" + (consulta.riego ? " on" : "")} onClick={() => cambiar({ riego: true })}>🚿 Sí, tengo riego</button>
          </div>
        </div>
        <div className="rot-pesos">
          <span>3️⃣ ¿Qué es lo que más te importa?</span>
          <div className="enfoques">
            {ENFOQUES.map((e) => (
              <button key={e.id} type="button" className={"enfoque" + (enfoque === e.id ? " on" : "")} onClick={() => elegirEnfoque(e)}>
                <span aria-hidden="true">{e.icono}</span>{e.nombre}
              </button>
            ))}
          </div>
        </div>
        <div className="rot-pesos">
          <span>🔮 ¿Y si el año sale distinto?</span>
          <div className="chips">
            {CLIMAS.map((c) => (
              <button key={c.id} type="button" className={"chip" + (climaActivo === c.id ? " on" : "")} onClick={() => setEscenario({ lluviaPct: c.lluviaPct, tempMas: c.tempMas })}>{c.icono} {c.nombre}</button>
            ))}
          </div>
        </div>

        <details className="est-avanzado">
          <summary>⚙️ Ajustes avanzados</summary>
          <div className="rot-pesos">
            <span>🚜 Maquinaria</span>
            <div className="chips">
              <button type="button" className={"chip" + (maquinaria ? " on" : "")} onClick={() => setMaquinaria(true)}>Tengo maquinaria</button>
              <button type="button" className={"chip" + (!maquinaria ? " on" : "")} onClick={() => setMaquinaria(false)}>Sin maquinaria (sin arroz ni algodón)</button>
            </div>
          </div>
          <div className="rot-pesos">
            <span>Cuánto pesa cada cosa (de 0 a 5)</span>
            {[["agua", "💧 Ahorrar agua"], ["rapidez", "⏱️ Cosechar rápido"], ["suelo", "🌱 Cuidar el suelo"], ["mercado", "💰 Mercado"]].map(([id, nombre]) => (
              <label key={id} className="rot-peso">
                <span>{nombre}</span>
                <input type="range" min="0" max="5" step="1" value={consulta.pesos[id]} onChange={(e) => { setEnfoque(null); cambiar({ pesos: { ...consulta.pesos, [id]: Number(e.target.value) } }); }} />
                <b>{NIVELES[consulta.pesos[id]]}</b>
              </label>
            ))}
          </div>
          <div className="rot-pesos">
            <span>Escenario a mano</span>
            <label className="rot-peso"><span>🌧️ Lluvia</span>
              <input type="range" min="-30" max="30" step="5" value={escenario.lluviaPct} onChange={(e) => setEscenario({ ...escenario, lluviaPct: Number(e.target.value) })} />
              <b>{escenario.lluviaPct > 0 ? "+" : ""}{escenario.lluviaPct} %</b></label>
            <label className="rot-peso"><span>🌡️ Calor</span>
              <input type="range" min="0" max="2" step="0.5" value={escenario.tempMas} onChange={(e) => setEscenario({ ...escenario, tempMas: Number(e.target.value) })} />
              <b>+{escenario.tempMas.toString().replace(".", ",")} °C</b></label>
          </div>
        </details>
      </div>

      {!modelo.hist && !modelo.error && <div className="cargando">Consultando 25 años de clima de la NASA…</div>}
      {modelo.error && <div className="aviso">No se pudo traer el clima de la NASA: {modelo.error}</div>}

      {res && mejor && (
        <>
          <Confianza ap={ap} modelo={modelo} suelo={suelo} />
          <div className="est-veredicto" style={{ "--c": mejor.est.color }}>
            <span className="est-ver-icono" aria-hidden="true">{mejor.est.icono}</span>
            <div>
              <small>{enfoque ? "Según lo que más te importa, te conviene:" : "El plan que mejor encaja ahora es:"}</small>
              <h2>{mejor.est.nombre}</h2>
              <p>{frase(mejor)}</p>
              {mejor.est.id === "actual"
                ? <p><b>Tu rotación actual ya es la que mejor encaja:</b> ninguna de las propuestas la supera con estas condiciones.</p>
                : <ul className="est-frente">{frente(mejor, base).map(([i, t], k) => <li key={k}><span aria-hidden="true">{i}</span> {t}</li>)}</ul>}
              {!consulta.riego && <p className="est-ojo">💡 Sin riego, casi todos los planes dependen mucho de que llueva. Prueba “Sí, tengo riego” y mira cómo cambia.</p>}
            </div>
          </div>

          {cambios && (
            <div className="rot-alerta">
              🔮 <b>Si el año sale {CLIMAS.find((c) => c.id === climaActivo)?.nombre.toLowerCase() || "distinto"}:</b>{" "}
              {cambios.map((c) => `${c.icono} ${c.nombre}: ${c.antes} → ${c.ahora} de cada 10 años`).join(" · ")}.
              {masAfectada && masAfectada.ahora < masAfectada.antes ? <> El plan más afectado es <b>{masAfectada.nombre}</b>.</> : <> Ningún plan pierde seguridad con este cambio.</>}
            </div>
          )}

          <div className="titulo-seccion"><h2>Los cuatro planes</h2><p>{consulta.riego ? "Con riego" : "Solo lluvia"} · {hayEscenario ? CLIMAS.find((c) => c.id === climaActivo)?.nombre || "con escenario" : "clima normal"}</p></div>
          <div className="est-lista">
            {res.estrategias.map((e) => <Tarjeta key={e.est.id} e={e} mejor={res.mejorId === e.est.id} base={base} />)}
          </div>

          <details className="est-tecnico">
            <summary>📊 Comparación técnica: radar y tabla (para quien quiera ver los números)</summary>
            <div className="est-resumen">
              <Grafica option={radar} alto={330} />
              <div className="tabla-caja">
                <table className="tabla">
                  <thead><tr><th>Plan</th><th>Nota</th><th>Meses sin cultivo</th><th>Riego en año seco</th><th>Seguridad</th></tr></thead>
                  <tbody>
                    {res.estrategias.map((e) => (
                      <tr key={e.est.id}>
                        <td>{e.est.icono} {e.est.nombre}{res.mejorId === e.est.id ? " ⭐" : ""}</td>
                        <td><b>{e.total}</b></td><td>{e.desnudos.length}</td><td>{f0(e.riegoTotal)} mm</td><td>{e.metricas.seguridad} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="filtro-nota">Los ejes van de 0 a 100 y en todos <b>más es mejor</b>: <b>Agua</b> (menos riego, más puntos), <b>Suelo</b> (leguminosas, cobertura y rotación de familias), <b>Ingresos</b> (valor de mercado estimado), <b>Seguridad</b> (en qué porcentaje de los años saldría bien) y <b>Cobertura</b> (meses con el suelo tapado). La nota mezcla los cinco según lo que te importa y solo sirve para comparar los planes entre sí.</p>
          </details>

          <p className="calsiembra-detalle">
            <b>Importante.</b> Estos planes salen de un modelo con datos de referencia y {ap.dias} {ap.dias === 1 ? "día" : "días"} de la estación (confianza {ap.confianza}). Sirven para pensar y comparar, no para decidir solos.
            Dónde manda el criterio del agricultor: la fecha real de siembra, el estado del lote, las plagas locales, el mercado y lo que ya se probó en el campo.
          </p>
        </>
      )}
      <Fuentes />
    </div>
  );
}

function Puntos({ valor }) {
  const n = Math.max(1, Math.min(5, Math.round(valor / 20)));
  return <span className="pts" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>;
}

function Tarjeta({ e, mejor, base }) {
  const colores = new Map();
  const colorDe = (c) => { if (!colores.has(c.id)) colores.set(c.id, PALETA[colores.size % PALETA.length]); return colores.get(c.id); };
  const celdas = e.celdas.map((c) => ({ ...c, color: c.tipo === "cultivo" ? colorDe(c.cultivo) : null }));
  const m = e.metricas;
  const preguntas = [
    ["🛡️", "¿Funciona sin que se pierda la cosecha?", m.seguridad, `Sale bien en unos ${Math.round(m.seguridad / 10)} de cada 10 años`],
    ["🌱", "¿Cuida la tierra?", m.suelo, nivelDe(m.suelo)[0]],
    ["💧", "¿Gasta poco riego?", m.agua, nivelDe(m.agua)[0]],
    ["💰", "¿Deja plata?", m.ingresos, nivelDe(m.ingresos)[0] + " (estimado)"],
  ];
  const cambios = frente(e, base);
  return (
    <article className={"est-card" + (mejor ? " mejor" : "")} style={{ "--c": e.est.color }}>
      <header>
        <span className="est-icono" aria-hidden="true">{e.est.icono}</span>
        <div><h3>{e.est.nombre}</h3><small>{e.est.objetivo}</small></div>
      </header>
      {mejor && <p className="est-mejor">⭐ La que mejor encaja con lo que te importa</p>}
      <p className="est-frase">{frase(e)}</p>

      <ul className="est-preguntas">
        {preguntas.map(([icono, pregunta, valor, texto]) => (
          <li key={pregunta}>
            <span className="q"><span aria-hidden="true">{icono}</span> {pregunta}</span>
            <Puntos valor={valor} />
            <b className={"niv-" + nivelDe(valor)[1]}>{texto}</b>
          </li>
        ))}
      </ul>

      {e.est.id !== "actual" && (
        <div className="est-vs">
          <b>Frente a lo que haces hoy:</b>
          <ul>{cambios.map(([i, t], k) => <li key={k}><span aria-hidden="true">{i}</span> {t}</li>)}</ul>
        </div>
      )}

      <div className="est-meses">
        <b>Mes a mes</b>
        <div className="est-calendario" role="img" aria-label="Calendario de 12 meses">
          {celdas.map((c) => (
            <div key={c.m} className={"est-mes" + (c.tipo === "desnudo" ? " desnudo" : "") + (c.erosion && c.tipo === "desnudo" ? " erosion" : "") + (c.vulnerable ? " vulnerable" : "")}
              style={c.color ? { background: c.color } : undefined}
              title={c.tipo === "cultivo" ? `${mayus(MESES[c.m])}: ${c.cultivo.nombre}${c.vulnerable ? " (poca lluvia)" : ""}` : `${mayus(MESES[c.m])}: sin cultivo${c.erosion ? " en mes de lluvia fuerte" : ""}`}>
              <small>{mayus(MESES[c.m]).slice(0, 3)}</small>
              <span>{c.tipo === "cultivo" ? (c.primero ? c.cultivo.emoji : "·") : c.erosion ? "⛈️" : "🟫"}</span>
              {c.vulnerable && <i className="alerta" aria-hidden="true">!</i>}
            </div>
          ))}
        </div>
        <ul className="est-leyenda">
          {e.slots.map((s, i) => <li key={i}><i style={{ background: colorDe(s.cultivo) }} />{s.cultivo.emoji} {s.cultivo.nombre} · {mayus(MESES[s.inicio])} a {mayus(MESES[Math.min(11, s.inicio + s.meses - 1)])}</li>)}
          <li><i className="desnudo" />🟫 Sin cultivo: {e.desnudos.length} meses</li>
          {e.desnudosErosion.length > 0 && <li>⛈️ Sin cultivo y con lluvia fuerte: {e.desnudosErosion.length} (la tierra se lava)</li>}
          {e.vulnerables.length > 0 && <li><i className="alerta-leyenda">!</i> Poca lluvia para el cultivo: {e.vulnerables.length} meses</li>}
        </ul>
      </div>

      <details className="est-seccion est-detalle">
        <summary>📋 Por qué · Evidencia · Beneficios · Lo que no sabemos · Riesgos</summary>
        {SECCIONES.map(([clave, titulo]) => (
          <div key={clave} className="est-sub">
            <h4>{titulo}</h4>
            <ul>{e.texto[clave].map((t, k) => <li key={k}>{t}</li>)}</ul>
          </div>
        ))}
      </details>
    </article>
  );
}
