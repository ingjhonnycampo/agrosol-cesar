import { useMemo, useState } from "react";
import Grafica from "./Grafica.jsx";
import Fuentes from "./Fuentes.jsx";
import { CULTIVOS } from "../data/cultivos.js";
import { MESES, PRIORIDADES, RIESGOS, climaDesdeNasa } from "../lib/rotacion.js";
import { construirEstrategias } from "../lib/estrategias.js";

const PALETA = ["#2e86ab", "#e8a317", "#3f9b52", "#9b59b6", "#e4572e", "#16a085"];
const SECCIONES = [
  ["porQue", "🧭 Por qué se sugiere"], ["evidencia", "📊 Evidencia que la respalda"], ["beneficios", "✅ Beneficios"],
  ["vacios", "❓ Lo que no sabemos"], ["riesgos", "⚠️ Riesgos para revisar"],
];
const EJES = [["agua", "Agua"], ["suelo", "Suelo"], ["ingresos", "Ingresos"], ["seguridad", "Seguridad"], ["cobertura", "Cobertura"]];
const NIVELES = ["Nada", "Poco", "Algo", "Bastante", "Mucho", "Lo máximo"];
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Compara varias rotaciones de 12 meses: la que el agricultor ya hace y tres que el modelo propone.
export default function Estrategias({ estacion, suelo, consulta, onConsulta, modelo, ap }) {
  const [actual, setActual] = useState(["maiz", ""]);
  const [maquinaria, setMaquinaria] = useState(true);
  const [escenario, setEscenario] = useState({ lluviaPct: 0, tempMas: 0 });
  const cambiar = (parte) => onConsulta({ ...consulta, ...parte });
  const clima = useMemo(() => (modelo.reciente ? climaDesdeNasa(modelo.reciente) : null), [modelo.reciente]);
  const periodo = modelo.hist ? `${modelo.hist.inicio.slice(0, 4)}–${modelo.hist.fin.slice(0, 4)}` : "";

  const entrada = useMemo(() => (clima && modelo.hist ? {
    hist: modelo.hist, clima, aprendizaje: ap, suelo, riego: consulta.riego, riesgo: consulta.riesgo, maquinaria,
    pesos: consulta.pesos, actual, anterior: consulta.anterior, periodo,
  } : null), [clima, modelo.hist, ap, suelo, consulta, maquinaria, actual, periodo]);

  const neutro = useMemo(() => (entrada ? construirEstrategias(entrada) : null), [entrada]);
  const hayEscenario = escenario.lluviaPct !== 0 || escenario.tempMas !== 0;
  const conEscenario = useMemo(() => (entrada && hayEscenario ? construirEstrategias({ ...entrada, escenario }) : null), [entrada, escenario, hayEscenario]);
  const res = conEscenario || neutro;

  const radar = useMemo(() => res && {
    animationDuration: 600,
    legend: { bottom: 0, textStyle: { color: "#5d6b60" } },
    tooltip: {},
    radar: { indicator: EJES.map(([, n]) => ({ name: n, max: 100 })), radius: "62%", axisName: { color: "#1d2a1f", fontWeight: 700 } },
    series: [{
      type: "radar",
      data: res.estrategias.map((e) => ({
        name: e.est.nombre, value: EJES.map(([k]) => e.metricas[k]),
        lineStyle: { color: e.est.color, width: 2.6 }, itemStyle: { color: e.est.color }, areaStyle: { color: e.est.color, opacity: 0.1 },
      })),
    }],
  }, [res]);

  // cuánto pierde cada estrategia de seguridad con el escenario
  const cambios = useMemo(() => {
    if (!neutro || !conEscenario) return null;
    return conEscenario.estrategias.map((e) => {
      const antes = neutro.estrategias.find((x) => x.est.id === e.est.id);
      return { nombre: e.est.nombre, icono: e.est.icono, antes: antes.metricas.seguridad, ahora: e.metricas.seguridad, riego: Math.round(e.riegoTotal - antes.riegoTotal) };
    });
  }, [neutro, conEscenario]);
  const masAfectada = cambios && cambios.reduce((m, c) => (c.ahora - c.antes < m.ahora - m.antes ? c : m), cambios[0]);

  return (
    <div>
      <div className="nasa-intro">
        <b>🔀 Comparador de estrategias de rotación.</b> El modelo arma rotaciones de <b>12 meses</b> y las compara con la que ya haces: qué cultivo va cada mes, cuándo el suelo queda
        <b> desnudo</b>, en qué meses el cultivo es más <b>vulnerable</b> y qué tan seguro es cada plan. Usa el clima de la NASA ({periodo || "25 años"}) ajustado con tu estación.
        <b> Esta herramienta apoya, no reemplaza, la experiencia del agricultor:</b> revisa el resultado con un agrónomo antes de decidir.
      </div>

      <div className="rot-form">
        <div className="rot-pesos">
          <span>📍 ¿Qué cultivas hoy? (tu rotación actual)</span>
          <div className="est-actual">
            <select value={actual[0]} onChange={(e) => setActual([e.target.value, actual[1]])} aria-label="Cultivo principal">
              <option value="">— elige —</option>
              {CULTIVOS.filter((c) => !c.abono).map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
            </select>
            <select value={actual[1]} onChange={(e) => setActual([actual[0], e.target.value])} aria-label="Segundo cultivo">
              <option value="">Un solo cultivo (se repite)</option>
              {CULTIVOS.filter((c) => !c.abono).map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="rot-pesos">
          <span>Tus limitaciones</span>
          <div className="chips">
            <button type="button" className={"chip" + (!consulta.riego ? " on" : "")} onClick={() => cambiar({ riego: false })}>🌧️ Solo lluvia</button>
            <button type="button" className={"chip" + (consulta.riego ? " on" : "")} onClick={() => cambiar({ riego: true })}>🚿 Tengo riego</button>
            <button type="button" className={"chip" + (maquinaria ? " on" : "")} onClick={() => setMaquinaria(!maquinaria)}>🚜 {maquinaria ? "Tengo maquinaria" : "Sin maquinaria"}</button>
          </div>
        </div>
        <div className="rot-pesos">
          <span>¿Cuánto riesgo aceptas?</span>
          <div className="chips">
            {RIESGOS.map((r) => <button key={r.id} type="button" className={"chip" + (consulta.riesgo === r.id ? " on" : "")} onClick={() => cambiar({ riesgo: r.id })}>{r.nombre}</button>)}
          </div>
        </div>
        <div className="rot-pesos">
          <span>Tus prioridades</span>
          {PRIORIDADES.map((p) => (
            <label key={p.id} className="rot-peso" title={p.ayuda}>
              <span>{p.icono} {p.nombre}</span>
              <input type="range" min="0" max="5" step="1" value={consulta.pesos[p.id]} onChange={(e) => cambiar({ pesos: { ...consulta.pesos, [p.id]: Number(e.target.value) } })} />
              <b>{NIVELES[consulta.pesos[p.id]]}</b>
            </label>
          ))}
        </div>
        <div className="rot-pesos est-escenario">
          <span>🔮 ¿Y si el clima cambia? (escenario)</span>
          <label className="rot-peso"><span>🌧️ Lluvia</span>
            <input type="range" min="-30" max="30" step="5" value={escenario.lluviaPct} onChange={(e) => setEscenario({ ...escenario, lluviaPct: Number(e.target.value) })} />
            <b>{escenario.lluviaPct > 0 ? "+" : ""}{escenario.lluviaPct} %</b></label>
          <label className="rot-peso"><span>🌡️ Temperatura</span>
            <input type="range" min="0" max="2" step="0.5" value={escenario.tempMas} onChange={(e) => setEscenario({ ...escenario, tempMas: Number(e.target.value) })} />
            <b>+{escenario.tempMas.toString().replace(".", ",")} °C</b></label>
          {hayEscenario && <button type="button" className="chip" onClick={() => setEscenario({ lluviaPct: 0, tempMas: 0 })}>↩️ Volver al clima normal</button>}
        </div>
      </div>

      {!modelo.hist && !modelo.error && <div className="cargando">Consultando 25 años de clima de la NASA…</div>}
      {modelo.error && <div className="aviso">No se pudo traer el clima de la NASA: {modelo.error}</div>}

      {res && (
        <>
          {cambios && (
            <div className="rot-alerta">
              🔮 <b>Con {escenario.lluviaPct !== 0 ? `${escenario.lluviaPct > 0 ? "+" : ""}${escenario.lluviaPct} % de lluvia` : ""}{escenario.lluviaPct !== 0 && escenario.tempMas ? " y " : ""}{escenario.tempMas ? `+${escenario.tempMas.toString().replace(".", ",")} °C` : ""}</b>:{" "}
              {cambios.map((c) => `${c.icono} ${c.nombre}: seguridad ${c.antes} → ${c.ahora}`).join(" · ")}.
              {masAfectada && masAfectada.ahora < masAfectada.antes ? <> La más afectada es <b>{masAfectada.nombre}</b> ({masAfectada.ahora - masAfectada.antes} puntos).</> : <> Ninguna pierde seguridad con este cambio.</>}
            </div>
          )}

          <div className="titulo-seccion"><h2>Comparación</h2><p>{consulta.riego ? "Con riego" : "Solo lluvia"} · {hayEscenario ? "con escenario" : "clima normal"}</p></div>
          <div className="est-resumen">
            <Grafica option={radar} alto={330} />
            <div className="tabla-caja">
              <table className="tabla">
                <thead><tr><th>Estrategia</th><th>Puntaje</th><th>Meses desnudo</th><th>Riego en año seco</th><th>Seguridad</th></tr></thead>
                <tbody>
                  {res.estrategias.map((e) => (
                    <tr key={e.est.id}>
                      <td>{e.est.icono} {e.est.nombre}{res.mejorId === e.est.id ? " ⭐" : ""}</td>
                      <td><b>{e.total}</b></td><td>{e.desnudos.length}</td><td>{e.riegoTotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })} mm</td><td>{e.metricas.seguridad} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="filtro-nota">⭐ = la que mejor encaja con tus prioridades. Los ejes van de 0 a 100: <b>Agua</b> (menos riego, más puntos), <b>Suelo</b> (leguminosas, cobertura y rotación de familias), <b>Ingresos</b> (valor de mercado estimado), <b>Seguridad</b> (en cuántos años saldría bien) y <b>Cobertura</b> (meses con el suelo tapado).</p>

          <div className="est-lista">
            {res.estrategias.map((e) => <Tarjeta key={e.est.id} e={e} mejor={res.mejorId === e.est.id} />)}
          </div>
          <p className="calsiembra-detalle">
            <b>Nota importante.</b> Estos planes salen de un modelo con datos de referencia y {ap.dias} {ap.dias === 1 ? "día" : "días"} de la estación (confianza {ap.confianza}). Sirven para pensar y comparar, no para decidir solos.
            Dónde se necesita el criterio del agricultor: las fechas reales de siembra, el estado del suelo del lote, las plagas locales, el mercado y lo que ya se probó en el campo.
          </p>
        </>
      )}
      <Fuentes />
    </div>
  );
}

function Tarjeta({ e, mejor }) {
  const colores = new Map();
  const colorDe = (c) => { if (!colores.has(c.id)) colores.set(c.id, PALETA[colores.size % PALETA.length]); return colores.get(c.id); };
  const celdas = e.celdas.map((c) => ({ ...c, color: c.tipo === "cultivo" ? colorDe(c.cultivo) : null }));
  return (
    <article className={"est-card" + (mejor ? " mejor" : "")} style={{ "--c": e.est.color }}>
      <header>
        <span className="est-icono" aria-hidden="true">{e.est.icono}</span>
        <div><h3>{e.est.nombre}</h3><small>{e.est.objetivo}</small></div>
        <span className="rot-puntaje" style={{ "--c": e.est.color, "--p": e.total * 3.6 + "deg" }}><b>{e.total}</b></span>
      </header>
      {mejor && <p className="est-mejor">⭐ La que mejor encaja con tus prioridades</p>}

      <div className="est-calendario" role="img" aria-label="Calendario de 12 meses">
        {celdas.map((c) => (
          <div key={c.m} className={"est-mes" + (c.tipo === "desnudo" ? " desnudo" : "") + (c.erosion && c.tipo === "desnudo" ? " erosion" : "") + (c.vulnerable ? " vulnerable" : "")}
            style={c.color ? { background: c.color } : undefined}
            title={c.tipo === "cultivo" ? `${mayus(MESES[c.m])}: ${c.cultivo.nombre}${c.vulnerable ? " (poca lluvia: más vulnerable)" : ""}` : `${mayus(MESES[c.m])}: suelo desnudo${c.erosion ? " en mes de lluvia fuerte: riesgo de erosión" : ""}`}>
            <small>{mayus(MESES[c.m]).slice(0, 3)}</small>
            <span>{c.tipo === "cultivo" ? (c.primero ? c.cultivo.emoji : "·") : c.erosion ? "⛈️" : "🟫"}</span>
            {c.vulnerable && <i className="alerta" aria-hidden="true">!</i>}
          </div>
        ))}
      </div>
      <ul className="est-leyenda">
        {e.slots.map((s, i) => <li key={i}><i style={{ background: colorDe(s.cultivo) }} />{s.cultivo.emoji} {s.cultivo.nombre} · {mayus(MESES[s.inicio])} a {mayus(MESES[Math.min(11, s.inicio + s.meses - 1)])}</li>)}
        <li><i className="desnudo" />🟫 Suelo desnudo ({e.desnudos.length})</li>
        {e.desnudosErosion.length > 0 && <li>⛈️ Desnudo en lluvia fuerte ({e.desnudosErosion.length})</li>}
        {e.vulnerables.length > 0 && <li><i className="alerta-leyenda">!</i> Mes vulnerable por poca lluvia ({e.vulnerables.length})</li>}
      </ul>
      {!e.slots.length && <p className="vacio">Con estas condiciones no hay un cultivo viable en ningún mes. Prueba con riego o con otro escenario.</p>}

      <div className="est-metricas">
        {EJES.map(([k, n]) => <span key={k}><small>{n}</small><b>{e.metricas[k]}</b></span>)}
      </div>

      {SECCIONES.map(([clave, titulo], i) => (
        <details key={clave} className="est-seccion" open={i === 0}>
          <summary>{titulo}</summary>
          <ul>{e.texto[clave].map((t, k) => <li key={k}>{t}</li>)}</ul>
        </details>
      ))}
    </article>
  );
}
