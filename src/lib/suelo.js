// Estudio de suelo: lo que NO mide la estación (pH, materia orgánica, fósforo, potasio, salinidad, textura).
// Se obtiene con una muestra enviada a un laboratorio o con un kit de campo.
// Los rangos son referencias generales para suelos tropicales; el laboratorio puede usar otros.

export const TEXTURAS = [
  { id: "arenoso", nombre: "Arenoso", info: "Drena rápido y retiene poca agua y nutrientes: hay que regar y abonar más seguido." },
  { id: "franco-arenoso", nombre: "Franco-arenoso", info: "Suelto y de buen drenaje. Muy bueno para yuca, patilla y ajonjolí." },
  { id: "franco", nombre: "Franco", info: "El equilibrio ideal entre drenaje y retención. Sirve para casi todo." },
  { id: "franco-arcilloso", nombre: "Franco-arcilloso", info: "Retiene bien el agua y los nutrientes. Bueno para maíz, algodón y arroz." },
  { id: "arcilloso", nombre: "Arcilloso", info: "Retiene mucha agua y se encharca: bueno para arroz, malo para yuca y patilla." },
];

// Cada parámetro devuelve { nivel: "verde"|"amarillo"|"rojo", etiqueta, consejo }
export const PARAMETROS = [
  {
    id: "ph", nombre: "pH", unidad: "", paso: 0.1, min: 3, max: 10, ejemplo: 6.5,
    que: "Qué tan ácido o alcalino es el suelo. Entre 5,5 y 7,3 la mayoría de cultivos aprovecha bien los nutrientes.",
    evaluar: (v) =>
      v < 5.0 ? { nivel: "rojo", etiqueta: "Muy ácido", consejo: "Conviene encalar (cal agrícola) según recomendación del laboratorio." }
      : v < 5.5 ? { nivel: "amarillo", etiqueta: "Ácido", consejo: "Puede faltar calcio y magnesio; valorar encalado." }
      : v <= 7.3 ? { nivel: "verde", etiqueta: "Adecuado", consejo: "Rango bueno para casi todos los cultivos." }
      : v <= 8.0 ? { nivel: "amarillo", etiqueta: "Alcalino", consejo: "Puede bloquear hierro y zinc; añadir materia orgánica." }
      : { nivel: "rojo", etiqueta: "Muy alcalino", consejo: "Revisar salinidad y consultar un agrónomo." },
  },
  {
    id: "mo", nombre: "Materia orgánica", unidad: "%", paso: 0.1, min: 0, max: 15, ejemplo: 2.5,
    que: "Es la reserva de nutrientes y de agua del suelo. Cuanta más tenga, mejor responde el cultivo.",
    evaluar: (v) =>
      v < 2 ? { nivel: "rojo", etiqueta: "Baja", consejo: "Aplicar compost o abonos verdes, y rotar con leguminosas." }
      : v < 3.5 ? { nivel: "amarillo", etiqueta: "Media", consejo: "Mantenerla con rastrojos y compost." }
      : { nivel: "verde", etiqueta: "Alta", consejo: "Buena reserva de nutrientes." },
  },
  {
    id: "p", nombre: "Fósforo (Bray II)", unidad: "ppm", paso: 1, min: 0, max: 200, ejemplo: 20,
    que: "Nutriente clave para raíces y floración.",
    evaluar: (v) =>
      v < 15 ? { nivel: "rojo", etiqueta: "Bajo", consejo: "Probable respuesta a fertilizante fosfatado." }
      : v < 30 ? { nivel: "amarillo", etiqueta: "Medio", consejo: "Mantenimiento según el cultivo." }
      : { nivel: "verde", etiqueta: "Alto", consejo: "No hace falta abonar con fósforo por ahora." },
  },
  {
    id: "k", nombre: "Potasio", unidad: "cmol/kg", paso: 0.01, min: 0, max: 3, ejemplo: 0.3,
    que: "Da firmeza y calidad al fruto. Muy importante en plátano.",
    evaluar: (v) =>
      v < 0.2 ? { nivel: "rojo", etiqueta: "Bajo", consejo: "Probable respuesta a fertilizante potásico." }
      : v < 0.4 ? { nivel: "amarillo", etiqueta: "Medio", consejo: "Cuidar la reposición, sobre todo en plátano." }
      : { nivel: "verde", etiqueta: "Alto", consejo: "Buena disponibilidad." },
  },
  {
    id: "ce", nombre: "Conductividad eléctrica (sales)", unidad: "dS/m", paso: 0.1, min: 0, max: 16, ejemplo: 0.8,
    que: "Mide las sales del suelo. Demasiadas queman las raíces, sobre todo en riego.",
    evaluar: (v) =>
      v < 2 ? { nivel: "verde", etiqueta: "Normal", consejo: "Sin problema de sales." }
      : v <= 4 ? { nivel: "amarillo", etiqueta: "Salinidad ligera", consejo: "Afecta cultivos sensibles como fríjol, ají y patilla." }
      : { nivel: "rojo", etiqueta: "Salino", consejo: "Elegir cultivos tolerantes (sorgo, algodón) y mejorar el drenaje." },
  },
];

export const SUELO_VACIO = { ph: "", mo: "", p: "", k: "", ce: "", textura: "" };

// Pasa texto o número de un campo a número, o null si está vacío
export function aNumero(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function hayEstudio(suelo) {
  return !!suelo && PARAMETROS.some((p) => aNumero(suelo[p.id]) !== null);
}

const clave = (id) => "agrosol-suelo-" + id;

// Estudio de suelo de una estación: primero lo guardado en este navegador, si no el de estaciones.js
export function cargarSuelo(estacion) {
  try {
    const guardado = localStorage.getItem(clave(estacion.id));
    if (guardado) return { ...SUELO_VACIO, ...JSON.parse(guardado) };
  } catch { /* sin almacenamiento: se usa el de la estación */ }
  return { ...SUELO_VACIO, ...(estacion.estudioSuelo || {}) };
}

export function guardarSuelo(id, suelo) {
  try { localStorage.setItem(clave(id), JSON.stringify(suelo)); } catch { /* no pasa nada */ }
}
