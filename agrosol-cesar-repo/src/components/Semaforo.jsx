import { useState } from "react";
import { evaluarSemaforo } from "../lib/semaforo.js";

const ETIQUETA = { verde: "Todo bien", amarillo: "Atención", rojo: "Actuar", gris: "Sin datos" };

// Tres tarjetas con luz de semáforo. Se tocan para ver el porqué.
export default function Semaforo({ datos, abiertas = false }) {
  const [abierta, setAbierta] = useState(null);
  const alertas = evaluarSemaforo(datos);
  if (!alertas.length) return null;

  return (
    <div className="semaforo">
      {alertas.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`luz-tarjeta nivel-${a.nivel}` + (abiertas || abierta === a.id ? " abierta" : "")}
          onClick={() => setAbierta(abierta === a.id ? null : a.id)}
          aria-expanded={abierta === a.id}
        >
          <span className="luz" aria-hidden="true">{a.icono}</span>
          <span className="luz-texto">
            <span className="luz-pregunta">{a.titulo}</span>
            <strong className="luz-mensaje">{a.mensaje}</strong>
            <span className="luz-etiqueta">{ETIQUETA[a.nivel]}</span>
          </span>
          <span className="luz-detalle">{a.detalle}</span>
        </button>
      ))}
    </div>
  );
}
