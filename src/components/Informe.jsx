import { createPortal } from "react-dom";
import { FUENTES } from "../data/cultivos.js";
import { cultivoPorId } from "../data/cultivos.js";
import { PARAMETROS, TEXTURAS, aNumero, hayEstudio } from "../lib/suelo.js";
import { MESES, PRIORIDADES, RIESGOS } from "../lib/rotacion.js";
import { coma, fechaCorta, fechaLarga, hoyLocal, resumenRango } from "../lib/analisis.js";
import { Aprendizaje } from "./Rotacion.jsx";
import Logo from "./Logo.jsx";

const CAMPOS = [
  { id: "nombre", etiqueta: "Nombre del proyecto", ejemplo: "Estudio de terreno · Colegio Carlos Restrepo Araujo", linea: true },
  { id: "responsables", etiqueta: "Responsables", ejemplo: "Nombres de los estudiantes y del docente", linea: true },
  { id: "lote", etiqueta: "Terreno o lote estudiado", ejemplo: "Patio trasero del colegio, 200 m²", linea: true },
  { id: "objetivo", etiqueta: "Objetivo del estudio", ejemplo: "Decidir qué cultivo sembrar en la próxima temporada", linea: false },
  { id: "observaciones", etiqueta: "Observaciones", ejemplo: "Lo que se vio en el terreno: malezas, sombra, charcos…", linea: false },
];

const promedio = (a) => {
  const v = a.filter((x) => x !== null && x !== undefined);
  return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null;
};

// Pequeño gráfico para el papel: barras de lluvia y líneas de temperatura máxima y mínima
function MiniGrafica({ dias }) {
  if (dias.length < 2) return null;
  const W = 640, H = 170, mi = 34, md = 34, ms = 14, mb = 26;
  const iw = W - mi - md, ih = H - ms - mb;
  const t = dias.flatMap((d) => [d.tmax, d.tmin]).filter((v) => v !== null);
  const tmin = Math.floor(Math.min(...t)) - 1, tmax = Math.ceil(Math.max(...t)) + 1;
  const lmax = Math.max(5, ...dias.map((d) => d.lluvia));
  const x = (i) => mi + (iw * (i + 0.5)) / dias.length;
  const yT = (v) => ms + ih - ((v - tmin) / (tmax - tmin)) * ih;
  const yL = (v) => ms + ih - (v / lmax) * ih;
  const linea = (k) => dias.map((d, i) => (d[k] === null ? null : `${x(i)},${yT(d[k])}`)).filter(Boolean).join(" ");
  const bw = Math.max(3, (iw / dias.length) * 0.6);
  return (
    <svg className="inf-grafica" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Lluvia y temperaturas por día">
      <rect x={mi} y={ms} width={iw} height={ih} fill="#f6f9f3" stroke="#d8e1d3" />
      {dias.map((d, i) => <rect key={d.dia} x={x(i) - bw / 2} y={yL(d.lluvia)} width={bw} height={ih + ms - yL(d.lluvia)} fill="#7f96f5" />)}
      <polyline points={linea("tmax")} fill="none" stroke="#e4572e" strokeWidth="2.2" />
      <polyline points={linea("tmin")} fill="none" stroke="#2e86ab" strokeWidth="2.2" />
      <g fontSize="9" fill="#445" fontFamily="sans-serif">
        <text x={mi - 4} y={ms + 8} textAnchor="end">{tmax}°</text>
        <text x={mi - 4} y={ms + ih} textAnchor="end">{tmin}°</text>
        <text x={W - md + 4} y={ms + 8}>{coma(lmax, 0)} mm</text>
        <text x={mi} y={H - 8}>{fechaCorta(dias[0].dia)}</text>
        <text x={W - md} y={H - 8} textAnchor="end">{fechaCorta(dias[dias.length - 1].dia)}</text>
      </g>
      <g fontSize="9" fontFamily="sans-serif">
        <rect x={mi + 6} y={ms + 6} width="8" height="8" fill="#e4572e" /><text x={mi + 18} y={ms + 14} fill="#445">Máxima</text>
        <rect x={mi + 64} y={ms + 6} width="8" height="8" fill="#2e86ab" /><text x={mi + 76} y={ms + 14} fill="#445">Mínima</text>
        <rect x={mi + 120} y={ms + 6} width="8" height="8" fill="#7f96f5" /><text x={mi + 132} y={ms + 14} fill="#445">Lluvia</text>
      </g>
    </svg>
  );
}

function Hoja({ estacion, diasEst, suelo, consulta, modelo, ap, resultados, proyecto, climaInfo }) {
  const hoy = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const dias = diasEst;
  const r = dias.length ? resumenRango(dias) : null;
  const ultimos = dias.slice(-14);
  const mesNum = Number(hoyLocal().slice(5, 7));
  const normal = modelo.reciente?.meses?.[mesNum - 1];
  const diasMes = dias.filter((d) => d.dia.slice(0, 7) === hoyLocal().slice(0, 7));
  const tMes = promedio(diasMes.map((d) => d.tprom));
  const llMes = diasMes.length ? diasMes.reduce((a, d) => a + d.lluvia, 0) / diasMes.length : null;
  const sMes = promedio(diasMes.map((d) => d.suelo10));
  const top = resultados.slice(0, 5);
  const ant = consulta.anterior ? cultivoPorId(consulta.anterior) : null;
  const riesgo = RIESGOS.find((x) => x.id === consulta.riesgo)?.nombre;
  const niveles = ["Nada", "Poco", "Algo", "Bastante", "Mucho", "Lo máximo"];

  return (
    <article className="informe-hoja">
      <header className="inf-portada">
        <Logo tam={56} />
        <div>
          <p className="inf-marca">AgroSol Cesar · NASA Space Apps Challenge 2026</p>
          <h1>{proyecto.nombre || `Estudio de terreno · ${estacion.nombre}`}</h1>
          <p className="inf-sub">Informe de estudio de terreno y recomendación de cultivos</p>
        </div>
      </header>

      <table className="inf-ficha">
        <tbody>
          <tr><th>Fecha del informe</th><td>{hoy}</td><th>Estación</th><td>{estacion.nombre}</td></tr>
          <tr><th>Ubicación</th><td>{estacion.lugar} · {coma(estacion.lat, 5)}° N, {coma(Math.abs(estacion.lon), 5)}° O</td><th>Terreno / lote</th><td>{proyecto.lote || "—"}</td></tr>
          <tr><th>Responsables</th><td colSpan="3">{proyecto.responsables || "—"}</td></tr>
          {proyecto.objetivo && <tr><th>Objetivo</th><td colSpan="3">{proyecto.objetivo}</td></tr>}
        </tbody>
      </table>

      <section className="inf-seccion">
        <h2>1. Resumen</h2>
        {top.length ? (
          <p>
            Con los datos de la estación, {climaInfo ? `${climaInfo.n} años de clima (${climaInfo.periodo})` : "el clima histórico"} y el estudio de suelo, para sembrar en <b>{MESES[consulta.mes]}</b> ({consulta.riego ? "con riego" : "solo con lluvia"}) el
            cultivo mejor puntuado es <b>{top[0].cultivo.emoji} {top[0].cultivo.nombre}</b>
            {top[0].clima.anios ? <> (con agua suficiente en el <b>{Math.round(top[0].clima.exito * 100)} %</b> de los {top[0].clima.anios} años analizados)</> : null}
            , seguido de {top.slice(1, 3).map((x) => x.cultivo.nombre).join(" y ")}.
            La confianza del ajuste con la estación es <b>{ap.confianza}</b> ({ap.dias} {ap.dias === 1 ? "día" : "días"} de datos comparados).
          </p>
        ) : <p>Aún no se calculó la recomendación: abre la pestaña <b>Rotación</b> para que el modelo consulte el clima.</p>}
        {top.length > 0 && !consulta.riego && top[0].clima.anios > 0 && top[0].clima.exito < 0.3 && (
          <p className="inf-aviso">⚠️ Sembrando en {MESES[consulta.mes]} y solo con lluvia, ningún cultivo tiene buena probabilidad según el clima de {climaInfo?.periodo}. Conviene <b>contar con riego</b> o esperar a <b>{MESES[top[0].mejor.mes]}</b>, el mejor mes para {top[0].cultivo.nombre.toLowerCase()}.</p>
        )}
      </section>

      <section className="inf-seccion">
        <h2>2. Datos de la estación</h2>
        {r ? (
          <>
            <p>Período medido: <b>{fechaLarga(dias[0].dia)}</b> a <b>{fechaLarga(dias[dias.length - 1].dia)}</b> · {r.mediciones} mediciones en {r.dias} días.</p>
            <table className="inf-tabla">
              <tbody>
                <tr><th>Temperatura del aire</th><td>máxima {coma(r.tmax)} °C · mínima {coma(r.tmin)} °C · media {coma(promedio(dias.map((d) => d.tprom)))} °C</td></tr>
                <tr><th>Lluvia</th><td>{coma(r.lluviaTotal)} mm en total · {r.diasConLluvia} días con lluvia</td></tr>
                <tr><th>Humedad del suelo (índice)</th><td>10 cm: {coma(promedio(dias.map((d) => d.suelo10)), 0)} % · 30 cm: {coma(promedio(dias.map((d) => d.suelo30)), 0)} % (promedio)</td></tr>
                <tr><th>Hoja húmeda</th><td>{coma(r.horasHoja)} horas con rocío o lluvia</td></tr>
              </tbody>
            </table>
            <MiniGrafica dias={ultimos} />
            <p className="inf-nota">Últimos {ultimos.length} días. La humedad del suelo es un índice calibrado con el sensor seco y en agua; no es un porcentaje volumétrico.</p>
          </>
        ) : <p>La estación todavía no tiene datos.</p>}
      </section>

      <section className="inf-seccion">
        <h2>3. La estación frente a la NASA</h2>
        {normal && diasMes.length ? (
          <table className="inf-tabla">
            <thead><tr><th></th><th>Estación ({MESES[mesNum - 1]})</th><th>Normal NASA 2001–2025</th></tr></thead>
            <tbody>
              <tr><th>Temperatura media</th><td>{coma(tMes)} °C</td><td>{coma(normal.t2m)} °C</td></tr>
              <tr><th>Lluvia por día</th><td>{coma(llMes)} mm</td><td>{coma(normal.lluvia)} mm</td></tr>
              <tr><th>Humedad del suelo (superficie)</th><td>{coma(sMes, 0)} %</td><td>{coma(normal.sueloSup, 0)} %</td></tr>
            </tbody>
          </table>
        ) : <p>No hay datos suficientes del mes en curso para comparar.</p>}
        <p className="inf-nota">La NASA entrega el promedio de una celda de unos 50 km; la estación mide un punto. No se espera que coincidan exactamente.</p>
        <Aprendizaje ap={ap} estacion={estacion} />
      </section>

      <section className="inf-seccion">
        <h2>4. Estudio de suelo</h2>
        {hayEstudio(suelo) || suelo.textura ? (
          <table className="inf-tabla">
            <thead><tr><th>Parámetro</th><th>Resultado</th><th>Interpretación</th></tr></thead>
            <tbody>
              {PARAMETROS.filter((p) => aNumero(suelo[p.id]) !== null).map((p) => {
                const ev = p.evaluar(aNumero(suelo[p.id]));
                return <tr key={p.id}><th>{p.nombre}</th><td>{coma(aNumero(suelo[p.id]), p.paso < 0.1 ? 2 : p.paso < 1 ? 1 : 0)} {p.unidad}</td><td><b>{ev.etiqueta}.</b> {ev.consejo}</td></tr>;
              })}
              {suelo.textura && <tr><th>Textura</th><td>{TEXTURAS.find((t) => t.id === suelo.textura)?.nombre}</td><td>{TEXTURAS.find((t) => t.id === suelo.textura)?.info}</td></tr>}
            </tbody>
          </table>
        ) : <p>No se cargó un estudio de suelo. La recomendación no pudo considerar el pH ni las sales del terreno.</p>}
      </section>

      <section className="inf-seccion inf-saltar">
        <h2>5. Recomendación de cultivos</h2>
        <p className="inf-nota">
          Condiciones consultadas: cultivo anterior <b>{ant ? ant.nombre : "ninguno / no se sabe"}</b> · siembra en <b>{MESES[consulta.mes]}</b> ·
          {" "}<b>{consulta.riego ? "con riego" : "solo lluvia"}</b> · riesgo: <b>{riesgo}</b> ·
          {" "}prioridades: {PRIORIDADES.map((p) => `${p.nombre.toLowerCase()} (${niveles[consulta.pesos[p.id]].toLowerCase()})`).join(", ")}.
        </p>
        {top.length ? top.map((x, i) => (
          <div className="inf-cultivo" key={x.cultivo.id}>
            <h3>{i + 1}. {x.cultivo.emoji} {x.cultivo.nombre} <small>puntaje {x.total}/100{x.clima.anios ? ` · agua suficiente en el ${Math.round(x.clima.exito * 100)} % de los años` : ""} · mejor época: {MESES[x.mejor.mes]}</small></h3>
            <ul>{x.razones.slice(0, 5).map((z, k) => <li key={k}>{z.texto}</li>)}</ul>
          </div>
        )) : <p>Sin resultados.</p>}
      </section>

      {proyecto.observaciones && (
        <section className="inf-seccion">
          <h2>6. Observaciones del equipo</h2>
          <p>{proyecto.observaciones}</p>
        </section>
      )}

      <section className="inf-seccion">
        <h2>{proyecto.observaciones ? "7" : "6"}. Fuentes y limitaciones</h2>
        <p className="inf-nota">
          Esta es una <b>guía educativa</b>: los rangos de cada cultivo son valores de referencia generales, no verificados uno por uno, y el valor de mercado es una
          estimación. Debe confirmarse con un agrónomo, la UMATA o AGROSAVIA antes de decidir. El modelo es explicable y se apoya en datos reales de la estación,
          pero con pocos días de datos su ajuste local es limitado.
        </p>
        <ul className="inf-fuentes">
          {FUENTES.map((f) => <li key={f.id}>{f.texto}{f.url ? <> — <span>{f.url}</span></> : null}{f.nota ? <em> ({f.nota})</em> : null}</li>)}
          <li>
            Clima usado por el modelo: {climaInfo ? (climaInfo.origen === "archivo" ? `archivo propio "${climaInfo.archivo}"` : "NASA POWER (MERRA-2)") : "NASA POWER (MERRA-2)"}
            {climaInfo ? `, ${climaInfo.texto}` : ""}, punto {coma(estacion.lat, 4)}° N, {coma(Math.abs(estacion.lon), 4)}° O. Fuente: https://power.larc.nasa.gov
            {climaInfo?.urlCsv ? <> · mismos datos en CSV: <span>{climaInfo.urlCsv}</span></> : null}
          </li>
          <li>Normales mensuales de la NASA (promedio 2001–2025) para comparar con la estación: https://power.larc.nasa.gov</li>
        </ul>
      </section>

      <footer className="inf-pie">
        Informe generado por AgroSol Cesar · agrosol-cesar.vercel.app · Colegio Carlos Restrepo Araujo (INSTECREA), Bosconia, Cesar · {hoy}
      </footer>
    </article>
  );
}

// Pestaña "Informe": datos del proyecto, vista previa y botón para guardar como PDF
export default function Informe(props) {
  const { proyecto, onProyecto } = props;
  return (
    <div>
      <div className="nasa-intro">
        <b>📄 Informe del estudio.</b> Junta en un solo documento los datos de la estación, la comparación con la NASA, el estudio de suelo y la recomendación
        de cultivos. Completa los datos del proyecto, revisa la vista previa y pulsa el botón: en la ventana de impresión elige
        <b> "Guardar como PDF"</b> (y apaga "Encabezados y pies de página" para que quede limpio).
      </div>

      <div className="informe-form">
        {CAMPOS.map((c) => (
          <label key={c.id} className={c.linea ? "" : "ancho"}>
            <span>{c.etiqueta}</span>
            {c.linea
              ? <input type="text" value={proyecto[c.id]} placeholder={c.ejemplo} onChange={(e) => onProyecto({ ...proyecto, [c.id]: e.target.value })} />
              : <textarea rows="2" value={proyecto[c.id]} placeholder={c.ejemplo} onChange={(e) => onProyecto({ ...proyecto, [c.id]: e.target.value })} />}
          </label>
        ))}
        <button type="button" className="boton boton-informe" onClick={() => window.print()}>📄 Descargar informe (PDF)</button>
        {!props.modelo.hist && !props.modelo.error && <p className="filtro-nota">Consultando el clima de la NASA para completar el informe…</p>}
        {props.modelo.error && <p className="cal-alerta">No se pudo traer el clima de la NASA: {props.modelo.error}. El informe saldrá sin esa parte.</p>}
      </div>

      <div className="informe-vista"><Hoja {...props} /></div>
      {createPortal(<div id="informe-impresion"><Hoja {...props} /></div>, document.body)}
    </div>
  );
}
