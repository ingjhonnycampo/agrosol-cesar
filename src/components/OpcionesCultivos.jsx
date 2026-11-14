import { CULTIVOS, CULTIVOS_MUNDO } from "../data/cultivos.js";

// Opciones de un <select> con los cultivos del Cesar y, aparte, los del mundo (para no perderse en una lista larga)
export default function OpcionesCultivos({ filtro = () => true, prefijo = "" }) {
  const op = (c) => <option key={c.id} value={c.id}>{prefijo}{c.emoji} {c.nombre}</option>;
  return (
    <>
      <optgroup label="📍 Del Cesar">{CULTIVOS.filter(filtro).map(op)}</optgroup>
      <optgroup label="🌍 Del mundo">{CULTIVOS_MUNDO.filter(filtro).map(op)}</optgroup>
    </>
  );
}
