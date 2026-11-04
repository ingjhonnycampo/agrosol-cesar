import { useMemo, useState } from "react";
import { CULTIVOS } from "../data/cultivos.js";
import { MESES, PRIORIDADES, RIESGOS, calendarioSiembra, climaDesdeNasa, recomendar } from "../lib/rotacion.js";
import { aprenderDeLaEstacion } from "../lib/local.js";
import { hayEstudio } from "../lib/suelo.js";
import Fuentes from "./Fuentes.jsx";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const ICONO_RAZON = { bien: "✅", aviso: "⚠️", mal: "⛔", info: "ℹ️" };
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const colorPuntaje = (p) => (p >= 75 ? "#2f9e4f" : p >= 55 ? "#e8a317" : "#d9443a");
const coma = (v, d = 1) => (v === null || v === undefined ? "—" : Number(v).toFixed(d).replace(".", ","));
const CONFIANZA = { "sin datos": "#9aa5a0", baja: "#d9443a", media: "#e8a317", alta: "#2f9e4f" };

// Calcula el modelo completo a partir de la consulta del agricultor y los datos (se usa en Rotación y en el Informe)
export function useRecomendacion({ consulta, modelo, diasEst, suelo, humedadHoy }) {
  const clima = useMemo(() => (modelo.reciente ? climaDesdeNasa(modelo.reciente) : null), [modelo.reciente]);
  const ap = useMemo(() => aprenderDeLaEstacion(diasEst, modelo.reciente?.diario), [diasEst, modelo.reciente]);
  const resultados = useMemo(
    () => (clima ? recomendar({
      anterior: consulta.anterior, mesSiembra: consulta.mes, pesos: consulta.pesos, riego: consulta.riego, riesgo: consulta.riesgo,
      hist: modelo.hist, clima, aprendizaje: ap, suelo, humedadHoy,
    }) : []),
    [clima, modelo.hist, ap, consulta, suelo, humedadHoy],
  );
  return { ap, resultados };
}

// ¿Qué sembrar? Modelo que combina: 25 años de clima de la NASA (año por año), lo que la estación aprendió
// de este lote, el cultivo anterior, el estudio de suelo y lo que le importa al agricultor.
export default function Rotacion({ estacion, suelo, consulta, onConsulta, modelo, ap, resultados }) {
  const [verTodos, setVerTodos] = useState(false);
  const cambiar = (parte) => onConsulta({ ...consulta, ...parte });
  const conSuelo = hayEstudio(suelo);
  const { anterior, mes, riego, riesgo, pesos } = consulta;

  return (
    <div>
      <div className="nasa-intro">
        <b>🌱 ¿Qué sembrar?</b> El modelo simula, <b>año por año desde 2001</b>, qué habría pasado si sembraras cada cultivo en el mes que elijas, y lo
        ajusta con los datos de <b>tu estación</b>, el cultivo anterior, el estudio de suelo y lo que te importa.
        <b> Es una guía educativa:</b> confírmala con un agrónomo o la UMATA. Cuando termines, la pestaña <b>Informe</b> la convierte en un documento.
      </div>

      <Aprendizaje ap={ap} estacion={estacion} />

      <div className="rot-form">
        <label>
          <span>¿Qué se cultivó antes en el lote?</span>
          <select value={anterior} onChange={(e) => cambiar({ anterior: e.target.value })}>
            <option value="">Nada / no sé</option>
            {CULTIVOS.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
          </select>
        </label>
        <label>
          <span>¿En qué mes piensas sembrar?</span>
          <select value={mes} onChange={(e) => cambiar({ mes: Number(e.target.value) })}>
            {MESES.map((m, i) => <option key={m} value={i}>{mayus(m)}</option>)}
          </select>
        </label>
        <div className="rot-pesos">
          <span>¿Tienes riego?</span>
          <div className="chips">
            <button type="button" className={"chip" + (!riego ? " on" : "")} onClick={() => cambiar({ riego: false })}>🌧️ Solo lluvia</button>
            <button type="button" className={"chip" + (riego ? " on" : "")} onClick={() => cambiar({ riego: true })}>🚿 Tengo riego</button>
          </div>
        </div>
        <div className="rot-pesos">
          <span>¿Cuánto riesgo aceptas?</span>
          <div className="chips">
            {RIESGOS.map((r) => (
              <button key={r.id} type="button" className={"chip" + (riesgo === r.id ? " on" : "")} onClick={() => cambiar({ riesgo: r.id })}>{r.nombre}</button>
            ))}
          </div>
        </div>
        <div className="rot-pesos">
          <span>¿Qué es lo más importante para ti?</span>
          {PRIORIDADES.map((p) => (
            <label key={p.id} className="rot-peso" title={p.ayuda}>
              <span>{p.icono} {p.nombre}</span>
              <input type="range" min="0" max="5" step="1" value={pesos[p.id]} onChange={(e) => cambiar({ pesos: { ...pesos, [p.id]: Number(e.target.value) } })} />
              <b>{["Nada", "Poco", "Algo", "Bastante", "Mucho", "Lo máximo"][pesos[p.id]]}</b>
            </label>
          ))}
        </div>
        <p className="filtro-nota">
          {conSuelo ? "✅ Se usa el estudio de suelo que cargaste." : "⚠️ Sin estudio de suelo: no se considera el pH. Cárgalo en la pestaña Suelo."}
        </p>
      </div>

      {!modelo.hist && !modelo.error && <div className="cargando">Consultando 25 años de clima de la NASA…</div>}
      {modelo.error && <div className="aviso">No se pudo traer el clima de la NASA: {modelo.error}</div>}

      {resultados.length > 0 && (
        <>
          <div className="titulo-seccion"><h2>Lo que más conviene sembrar</h2><p>Siembra en {MESES[mes]} · {riego ? "con riego" : "solo lluvia"}</p></div>
          {!riego && resultados[0].clima.anios > 0 && resultados[0].clima.exito < 0.3 && (
            <div className="rot-alerta">
              ⚠️ <b>En {MESES[mes]} y solo con lluvia, ningún cultivo tiene buena probabilidad</b> (el mejor llega a {Math.round(resultados[0].clima.exito * 100)} %).
              Las opciones de abajo son simplemente las menos malas. Conviene <b>contar con riego</b> o esperar a <b>{MESES[resultados[0].mejor.mes]}</b>,
              el mejor mes para {resultados[0].cultivo.nombre.toLowerCase()}. Mira el calendario de siembra al final.
            </div>
          )}
          <ol className="rot-lista">
            {resultados.slice(0, 5).map((r, i) => <Tarjeta key={r.cultivo.id} r={r} puesto={i} mes={mes} />)}
          </ol>
          <button type="button" className="chip" onClick={() => setVerTodos(!verTodos)}>
            {verTodos ? "Ocultar los demás" : `Ver los otros ${resultados.length - 5} cultivos`}
          </button>
          {verTodos && (
            <ol className="rot-lista" start={6}>
              {resultados.slice(5).map((r, i) => <Tarjeta key={r.cultivo.id} r={r} puesto={i + 5} mes={mes} />)}
            </ol>
          )}
        </>
      )}
      <CalendarioSiembra modelo={modelo} ap={ap} consulta={consulta} onConsulta={onConsulta} />
      <Fuentes />
    </div>
  );
}

const colorCelda = (p) => (p >= 0.75 ? "#2f9e4f" : p >= 0.5 ? "#9bc53d" : p >= 0.25 ? "#e8a317" : p > 0 ? "#e8743a" : "#d9443a");

// Tabla de 12 meses: en qué mes conviene sembrar cada cultivo. Tocar una celda elige ese mes y explica el porqué.
function CalendarioSiembra({ modelo, ap, consulta, onConsulta }) {
  const [sel, setSel] = useState(null);
  const clima = useMemo(() => (modelo.reciente ? climaDesdeNasa(modelo.reciente) : null), [modelo.reciente]);
  const filas = useMemo(
    () => (clima ? calendarioSiembra({ hist: modelo.hist, clima, aprendizaje: ap, riego: consulta.riego, riesgo: consulta.riesgo }) : []),
    [clima, modelo.hist, ap, consulta.riego, consulta.riesgo],
  );
  if (!filas.length) return null;
  const fila = sel ? filas.find((f) => f.cultivo.id === sel.id) : null;
  const detalle = fila ? fila.meses[sel.mes] : null;

  return (
    <section className="calsiembra">
      <div className="titulo-seccion"><h2>Calendario de siembra</h2><p>{consulta.riego ? "Con riego" : "Solo lluvia"} · porcentaje de años con agua suficiente</p></div>
      <p className="ayuda">Verde = buen mes, rojo = mala época. Toca una celda para ver el porqué y usar ese mes en el cálculo de arriba.</p>
      <div className="calsiembra-caja">
        <table className="calsiembra-tabla">
          <thead>
            <tr><th>Cultivo</th>{MESES.map((m, i) => <th key={m} className={i === consulta.mes ? "elegido" : ""}>{mayus(m).slice(0, 3)}</th>)}</tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.cultivo.id}>
                <th>{f.cultivo.emoji} {f.cultivo.nombre}</th>
                {f.meses.map((x, m) => (
                  <td key={m} className={(m === consulta.mes ? "elegido " : "") + (m === f.mejor ? "mejor" : "")}>
                    <button type="button" style={{ background: colorCelda(x.exito) }} onClick={() => { setSel({ id: f.cultivo.id, mes: m }); onConsulta({ ...consulta, mes: m }); }}
                      aria-label={`${f.cultivo.nombre} en ${MESES[m]}: ${Math.round(x.exito * 100)} %`}>
                      {Math.round(x.exito * 100)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="filtro-nota">El borde grueso marca el mejor mes de cada cultivo.</p>
      {detalle && (
        <div className="calsiembra-detalle">
          <b>{fila.cultivo.emoji} {fila.cultivo.nombre}, sembrado en {MESES[sel.mes]}:</b>{" "}
          {detalle.cl.anios
            ? <>con agua suficiente en <b>{Math.round(detalle.exito * detalle.cl.anios)} de {detalle.cl.anios} años</b>. La racha seca más larga suele ser de {Math.round(detalle.cl.rachaTipica)} días
              (hasta {Math.round(detalle.cl.rachaFuerte)} en años secos) y el suelo aguanta ~{Math.round(detalle.cl.reserva)}. En un año seco harían falta unos {Math.round(detalle.cl.riegoP80).toLocaleString("es-CO")} mm de riego.</>
            : "Sin el historial de la NASA, el cálculo es aproximado."}
        </div>
      )}
    </section>
  );
}

// Lo que el modelo aprendió de la estación: cuántos días hay y cuánto cambian los números por eso
export function Aprendizaje({ ap, estacion }) {
  const color = CONFIANZA[ap.confianza];
  return (
    <div className="aprende" style={{ "--c": color }}>
      <div className="aprende-cabeza">
        <b>📡 Lo que el modelo aprendió de tu estación</b>
        <span className="aprende-nivel">Confianza local: {ap.confianza}</span>
      </div>
      {ap.dias === 0 ? (
        <p>Todavía no hay días completos de la estación para comparar con la NASA. El modelo usa solo el clima de la región y se irá
          ajustando solo conforme "{estacion.nombre}" acumule datos. <b>Una estación nueva siempre arranca así, desde cero.</b></p>
      ) : (
        <>
          <p>Se compararon <b>{ap.dias} {ap.dias === 1 ? "día completo" : "días completos"}</b> de la estación con la NASA. Con pocos días, el ajuste pesa poco; crece con cada semana de datos.</p>
          <ul>
            <li>🌡️ La estación marca <b>{ap.sesgoTmed >= 0 ? "+" : ""}{coma(ap.sesgoTmed)} °C</b> frente a la NASA. Se aplica un ajuste de <b>{ap.tempAjuste >= 0 ? "+" : ""}{coma(ap.tempAjuste)} °C</b> ({Math.round(ap.wTemperatura * 100)} % de confianza).</li>
            <li>🌧️ Lluvia medida / NASA: <b>×{coma(ap.razonLluvia, 2)}</b> ({coma(ap.lluviaEst)} mm frente a {coma(ap.lluviaNasa)} mm). Ajuste aplicado: <b>×{coma(ap.factorLluvia, 2)}</b> ({Math.round(ap.wLluvia * 100)} % de confianza).</li>
            <li>💧 Reserva de agua del suelo: <b>~{Math.round(ap.reservaDias)} días</b> sin lluvia ({ap.tasaMedida ? `el suelo pierde ${coma(ap.tasaSecado)} % por día, medido en el lote` : "valor por defecto, aún faltan días secos medidos"}).</li>
          </ul>
        </>
      )}
    </div>
  );
}

function Tarjeta({ r, puesto, mes }) {
  const [abierta, setAbierta] = useState(puesto === 0);
  const c = r.cultivo;
  const buenMes = r.mejor.mes === mes;
  const prob = r.clima.anios ? Math.round(r.clima.exito * 100) : null;
  return (
    <li className={"rot-tarjeta" + (abierta ? " abierta" : "")}>
      <button type="button" className="rot-cabeza" onClick={() => setAbierta(!abierta)} aria-expanded={abierta}>
        <span className="rot-puesto">{MEDALLAS[puesto] || puesto + 1}</span>
        <span className="rot-emoji" aria-hidden="true">{c.emoji}</span>
        <span className="rot-nombre">
          <b>{c.nombre}</b>
          <small>
            {prob !== null && <>Agua suficiente en <b className="rot-prob" style={{ color: colorPuntaje(prob) }}>{prob} %</b> de los años · </>}
            {buenMes ? "Buen mes para sembrarlo" : `Mejor época: ${MESES[r.mejor.mes]}`}
          </small>
        </span>
        <span className="rot-puntaje" style={{ "--c": colorPuntaje(r.total), "--p": r.total * 3.6 + "deg" }}><b>{r.total}</b></span>
      </button>
      {abierta && (
        <ul className="rot-razones">
          {r.razones.map((x, i) => <li key={i} className={"r-" + x.tipo}><span aria-hidden="true">{ICONO_RAZON[x.tipo]}</span> {x.texto}</li>)}
        </ul>
      )}
    </li>
  );
}
