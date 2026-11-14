import { Fragment } from "react";
import { SECCIONES, MANUAL_VERSION, URL_PDF, URL_PLATAFORMA } from "../data/manual.js";

// **negrita** y `código` dentro de un texto
function marcar(texto) {
  return texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
    if (p.startsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Bloque({ b }) {
  if (b.t === "p") return <p className="man-p">{marcar(b.x)}</p>;
  if (b.t === "ul") return <ul className="man-lista">{b.x.map((x, i) => <li key={i}>{marcar(x)}</li>)}</ul>;
  if (b.t === "ol") return <ol className="man-lista">{b.x.map((x, i) => <li key={i}>{marcar(x)}</li>)}</ol>;
  if (b.t === "aviso") return <div className="rot-alerta">{marcar(b.x)}</div>;
  if (b.t === "tabla") {
    return (
      <div className="tabla-caja">
        <table className="tabla cob-tabla">
          <thead><tr>{b.cab.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{b.filas.map((f, i) => <tr key={i}>{f.map((c, j) => (j === 0 ? <th key={j}>{marcar(c)}</th> : <td key={j}>{marcar(c)}</td>))}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  if (b.t === "ficha") {
    return (
      <details className="man-ficha">
        <summary><span aria-hidden="true">{b.icono}</span> {b.nombre}</summary>
        <p><b>Qué es:</b> {marcar(b.que)}</p>
        <p><b>Cómo se usa:</b> {marcar(b.como)}</p>
        {b.tip && <p className="man-tip">💡 {marcar(b.tip)}</p>}
      </details>
    );
  }
  return null;
}

// Manual de uso de la plataforma (el mismo texto sale en el PDF)
export default function Manual() {
  return (
    <div className="manual">
      <div className="nasa-intro">
        <b>📘 Manual de uso de AgroSol Cesar.</b> Explica qué hace cada apartado, cómo leerlo y cómo resolver las dudas más comunes.
        Toca un tema del índice para ir a él, o toca cada apartado para abrir su explicación. Versión: {MANUAL_VERSION}.
      </div>
      <div className="man-pdf">
        <a className="boton" href={URL_PDF} download="Manual-AgroSol-Cesar.pdf">📥 Descargar el manual en PDF</a>
        <span>Para leerlo sin conexión o imprimirlo.</span>
      </div>

      <nav className="man-indice" aria-label="Índice del manual">
        {SECCIONES.map((s) => <a key={s.id} href={"#man-" + s.id}><span aria-hidden="true">{s.icono}</span> {s.titulo}</a>)}
      </nav>

      {SECCIONES.map((s) => (
        <section key={s.id} id={"man-" + s.id} className="man-seccion">
          <div className="titulo-seccion"><h2>{s.icono} {s.titulo}</h2></div>
          {s.bloques.map((b, i) => <Bloque key={i} b={b} />)}
        </section>
      ))}
      <p className="calidad">Plataforma: {URL_PLATAFORMA} · Equipo Galactic Devs · NASA Space Apps 2026.</p>
    </div>
  );
}
