// Datos del proyecto que aparecen en el informe (nombre, responsables, lote, objetivo, observaciones).
// Se guardan en este navegador, uno por estación.
export const PROYECTO_VACIO = { nombre: "", responsables: "", lote: "", objetivo: "", observaciones: "" };

const clave = (id) => "agrosol-proyecto-" + id;

export function cargarProyecto(estacion) {
  try {
    const g = localStorage.getItem(clave(estacion.id));
    if (g) return { ...PROYECTO_VACIO, ...JSON.parse(g) };
  } catch { /* sin almacenamiento */ }
  return { ...PROYECTO_VACIO };
}

export function guardarProyecto(id, proyecto) {
  try { localStorage.setItem(clave(id), JSON.stringify(proyecto)); } catch { /* no pasa nada */ }
}
