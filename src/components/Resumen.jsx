import { COLORES_NIVEL } from "../lib/semaforo.js";

// Portada del día: una frase grande, una carita y una puntuación de 0 a 100 para la salud del cultivo.
export default function Resumen({ resumen }) {
  if (!resumen) return null;
  const { frase, puntos, nivel, carita, etiqueta } = resumen;
  const color = COLORES_NIVEL[nivel] || COLORES_NIVEL.gris;
  return (
    <section className="resumen" style={{ "--c": color }}>
      <div className="resumen-puntos" style={{ "--p": (puntos ?? 0) * 3.6 + "deg" }}>
        <div className="resumen-centro">
          <span className="resumen-carita" aria-hidden="true">{carita}</span>
          <b>{puntos === null ? "—" : puntos}</b>
        </div>
      </div>
      <div className="resumen-texto">
        <span className="resumen-etiqueta">{etiqueta}</span>
        <p>{frase}</p>
      </div>
    </section>
  );
}
