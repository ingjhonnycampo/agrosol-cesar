// ESTRATEGIAS DE ROTACIÓN DE 12 MESES
// Arma varias rotaciones para un año (enero a diciembre) y las compara:
//   · "Tu rotación actual": lo que el agricultor ya hace (hasta dos cultivos), puesto en su mejor mes.
//   · "Ahorro de agua", "Suelo vivo" y "Más ingresos": rotaciones que el modelo busca solo (programación dinámica)
//     eligiendo qué cultivo va cada mes para maximizar su objetivo, sin repetir familia y evitando el suelo desnudo.
// Usa el clima de 25 años de la NASA (año por año), el ajuste con la estación, el estudio de suelo y las prioridades.
// Todo es explicable: cada decisión sale de un dato que se puede mostrar.
import { CULTIVOS_TODOS as CULTIVOS, cultivoPorId } from "../data/cultivos.js";
import { MESES, climaDe, puntajeClima, evaluarSuelo, evaluarRotacion } from "./rotacion.js";

const DIAS_MES = 30.4;
const LLUVIA_UTIL = 0.75;
const LLUVIA_FUERTE = 100; // mm al mes: desde aquí un suelo sin cubrir se erosiona
const EXITO_MIN = 0.2;     // sin riego, no se siembra si menos del 20 % de los años habría salido bien

const media = (a) => (a[0] + a[1]) / 2;
const limitar = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const COBERTURA = { alta: 1, media: 0.6, baja: 0.3 };
const cobertura = (c) => COBERTURA[c.cobertura || "media"];
const mesesDe = (c) => limitar(Math.round(media(c.ciclo) / DIAS_MES), 1, 12);
const f0 = (v) => Math.round(v).toLocaleString("es-CO");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const ESTRATEGIAS = [
  { id: "actual", nombre: "Tu rotación actual", icono: "📍", color: "#8a96a8", objetivo: "Lo que haces hoy, para tener con qué comparar." },
  {
    id: "agua", nombre: "Ahorro de agua", icono: "💧", color: "#2e86ab", abonos: false, bare: 0.2, maxAgua: 600,
    pesos: { clima: 0.4, agua: 0.5, rot: 0.1, suelo: 0, ingreso: 0, cob: 0 },
    objetivo: "Solo cultivos de poca agua (hasta unos 600 mm por ciclo), sembrados cuando más llueve.",
  },
  {
    id: "suelo", nombre: "Suelo vivo", icono: "🌱", color: "#3f9b52", abonos: true, bare: 0.5, bonoLeguminosa: 0.35,
    pesos: { clima: 0.25, agua: 0.05, rot: 0.25, suelo: 0.3, ingreso: 0.05, cob: 0.1 },
    objetivo: "Leguminosas y cobertura para recuperar el suelo y no dejarlo desnudo.",
  },
  {
    id: "ingresos", nombre: "Más ingresos", icono: "💰", color: "#e8a317", abonos: false, bare: 0.25, minMercado: 3,
    pesos: { clima: 0.25, agua: 0, rot: 0.1, suelo: 0, ingreso: 0.65, cob: 0 },
    objetivo: "Solo cultivos con mercado medio o alto (valor estimado) y buena probabilidad de salir bien.",
  },
];

// ---------- contexto: caché del clima por cultivo y mes ----------
function crearContexto({ hist, clima, aprendizaje, suelo, riego, riesgo, maquinaria, escenario }) {
  const esc = escenario || { lluviaPct: 0, tempMas: 0 };
  const ap = { ...aprendizaje, factorLluvia: aprendizaje.factorLluvia * (1 + esc.lluviaPct / 100), tempAjuste: aprendizaje.tempAjuste + esc.tempMas };
  const cache = new Map();
  const lluviaMes = clima.lluviaMes.map((v) => v * ap.factorLluvia);
  return {
    hist, clima, ap, suelo, riego, riesgo, maquinaria, lluviaMes,
    cl(c, m) {
      const k = c.id + ":" + m;
      if (!cache.has(k)) cache.set(k, climaDe(c, m, hist, clima, ap, riego));
      return cache.get(k);
    },
  };
}

// ---------- valor de sembrar un cultivo en un mes ----------
function valorSlot(c, m, n, previo, ctx, est) {
  const cl = ctx.cl(c, m);
  if (ctx.riego ? cl.pTemp < 0.5 : cl.exito < EXITO_MIN) return null;
  const w = est.pesos;
  const rot = evaluarRotacion(c, previo);
  const su = evaluarSuelo(c, ctx.suelo).total / 100;
  const clim = puntajeClima(cl, ctx.riesgo) / 100;
  const agua = 1 - limitar((media(c.agua) - 300) / 700, 0, 1);
  const ing = (c.mercado / 5) * (0.4 + 0.6 * (ctx.riego ? cl.pTemp : cl.exito));
  let porMes = w.clima * clim + w.agua * agua + w.rot * (rot.puntaje / 100) + w.suelo * (0.5 * su + 0.5 * (c.fijaN ? 1 : 0)) + w.ingreso * ing + w.cob * cobertura(c);
  if (rot.puntaje <= 25) porMes *= 0.25; // misma familia o mismo cultivo seguido: casi nunca conviene
  return n * porMes + (c.fijaN ? (est.bonoLeguminosa || 0) : 0);
}

// ---------- búsqueda de la mejor rotación del año (programación dinámica) ----------
function mejorRotacion(est, ctx, previoInicial) {
  const candidatos = CULTIVOS.filter((c) => (est.abonos ? true : !c.abono) && (ctx.maquinaria ? true : !c.mecanizado)
    && (!est.maxAgua || media(c.agua) <= est.maxAgua) && (!est.minMercado || c.mercado >= est.minMercado));
  const memo = new Map();
  const costoDesnudo = (m) => est.bare * (1 + (ctx.lluviaMes[m] >= LLUVIA_FUERTE ? 0.8 : 0));

  function f(m, previoId) {
    if (m >= 12) return { v: 0, plan: [] };
    const k = m + ":" + previoId;
    if (memo.has(k)) return memo.get(k);
    const previo = previoId ? cultivoPorId(previoId) : null;
    let mejor = (() => { const s = f(m + 1, previoId); return { v: s.v - costoDesnudo(m), plan: s.plan }; })();
    for (const c of candidatos) {
      const n = mesesDe(c);
      if (m + n > 12) continue;
      const val = valorSlot(c, m, n, previo, ctx, est);
      if (val === null) continue;
      const s = f(m + n, c.id);
      if (val + s.v > mejor.v) mejor = { v: val + s.v, plan: [{ cultivo: c, inicio: m, meses: n }, ...s.plan] };
    }
    memo.set(k, mejor);
    return mejor;
  }
  return f(0, previoInicial || "").plan;
}

// ---------- la rotación que el agricultor ya hace ----------
function rotacionActual(cultivos, ctx) {
  const slots = [];
  const libre = (m, n) => m + n <= 12 && slots.every((s) => m >= s.inicio + s.meses || m + n <= s.inicio);
  const mejorMesLibre = (c) => {
    const n = mesesDe(c);
    let mejor = -1, punt = -1;
    for (let m = 0; m + n <= 12; m++) {
      if (!libre(m, n)) continue;
      const p = puntajeClima(ctx.cl(c, m), ctx.riesgo);
      if (p > punt) { punt = p; mejor = m; }
    }
    return mejor >= 0 ? { cultivo: c, inicio: mejor, meses: n } : null;
  };
  const lista = cultivos.length >= 2 ? cultivos : [cultivos[0], cultivos[0]]; // un solo cultivo: lo repite en su segunda mejor época
  for (const c of lista) {
    if (!c) continue;
    const s = mejorMesLibre(c);
    if (s) slots.push(s);
  }
  return slots.sort((a, b) => a.inicio - b.inicio);
}

// ---------- evaluación de una estrategia ----------
function evaluar(est, slotsBase, ctx, anteriorId) {
  const slots = slotsBase.map((s, i) => {
    const previo = i === 0 ? (anteriorId ? cultivoPorId(anteriorId) : null) : slotsBase[i - 1].cultivo;
    return { ...s, cl: ctx.cl(s.cultivo, s.inicio), rot: evaluarRotacion(s.cultivo, previo) };
  });

  // calendario de 12 meses
  const celdas = Array.from({ length: 12 }, (_, m) => ({ m, tipo: "desnudo", erosion: ctx.lluviaMes[m] >= LLUVIA_FUERTE, lluvia: ctx.lluviaMes[m] }));
  slots.forEach((s, i) => {
    const necesidadMes = media(s.cultivo.agua) / s.meses;
    for (let k = 0; k < s.meses; k++) {
      const m = s.inicio + k;
      const lluviaUtil = ctx.lluviaMes[m] * LLUVIA_UTIL;
      celdas[m] = { ...celdas[m], tipo: "cultivo", cultivo: s.cultivo, slot: i, primero: k === 0, ultimo: k === s.meses - 1, vulnerable: !ctx.riego && lluviaUtil < 0.5 * necesidadMes };
    }
  });
  const desnudos = celdas.filter((c) => c.tipo === "desnudo");
  const desnudosErosion = desnudos.filter((c) => c.erosion);
  const vulnerables = celdas.filter((c) => c.vulnerable);

  // métricas de 0 a 100
  const riegoTotal = slots.reduce((a, s) => a + s.cl.riegoP80, 0);
  const total = slots.reduce((a, s) => a + s.meses, 0) || 1;
  const exitoMedio = slots.length ? slots.reduce((a, s) => a + (ctx.riego ? s.cl.pTemp : s.cl.exito) * s.meses, 0) / total : 0;
  const hayLeg = slots.some((s) => s.cultivo.fijaN);
  const hayAbono = slots.some((s) => s.cultivo.abono);
  const mono = slots.some((s, i) => i > 0 && s.rot.puntaje <= 25);
  const ingresoBruto = slots.reduce((a, s) => a + (s.cultivo.mercado / 5) * (0.4 + 0.6 * (ctx.riego ? s.cl.pTemp : s.cl.exito)) * (s.meses / 6), 0);
  const metricas = {
    agua: Math.round(100 * (1 - limitar(riegoTotal / 1500, 0, 1))),
    suelo: Math.round(limitar(35 + (hayLeg ? 25 : 0) + (hayAbono ? 15 : 0) + 25 * (1 - desnudos.length / 12) - (mono ? 20 : 0))),
    ingresos: Math.round(limitar((100 * ingresoBruto) / 1.2)),
    seguridad: Math.round(100 * exitoMedio),
    cobertura: Math.round(100 * (1 - desnudos.length / 12)),
  };
  return { est, slots, celdas, desnudos, desnudosErosion, vulnerables, riegoTotal, hayLeg, hayAbono, mono, metricas };
}

// puntaje total según lo que le importa al agricultor
function puntajeTotal(e, pesos, riesgo) {
  const wSeg = riesgo === "seguro" ? 3 : riesgo === "arriesgado" ? 1 : 2;
  const w = { agua: pesos.agua, suelo: pesos.suelo, ingresos: pesos.mercado, cobertura: pesos.rapidez, seguridad: wSeg };
  const suma = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return Math.round(Object.entries(w).reduce((a, [k, p]) => a + p * e.metricas[k], 0) / suma);
}

// ---------- textos: por qué, evidencia, beneficios, vacíos, riesgos ----------
function textos(e, ctx, ref, periodo, anios) {
  const { slots, desnudos, desnudosErosion, vulnerables } = e;
  const lista = slots.map((s) => `${s.cultivo.emoji} ${s.cultivo.nombre} (${MESES[s.inicio]})`).join(" → ") || "ningún cultivo viable";

  const porQue = [];
  if (e.est.id === "actual") porQue.push(`Es lo que haces hoy: ${lista}. Sirve como punto de comparación para las otras estrategias.`);
  else porQue.push(`${e.est.objetivo} El modelo eligió mes a mes: ${lista}.`);
  if (e.est.id !== "actual") porQue.push("Cada cultivo se escogió porque tiene buena probabilidad de salir bien en ese mes con el clima de la NASA, sin repetir familia botánica seguida.");

  const evidencia = slots.map((s) => {
    const cl = s.cl;
    return ctx.riego
      ? `${s.cultivo.nombre} en ${MESES[s.inicio]}: la temperatura permitió el cultivo en ${Math.round(cl.pTemp * cl.anios)} de ${cl.anios} años (NASA POWER ${periodo}).`
      : `${s.cultivo.nombre} en ${MESES[s.inicio]}: agua suficiente en ${Math.round(cl.exito * cl.anios)} de ${cl.anios} años (NASA POWER ${periodo}). Racha seca típica de ${f0(cl.rachaTipica)} días frente a ${f0(cl.reserva)} que aguanta.`;
  });
  const meses = [...new Set(slots.flatMap((s) => Array.from({ length: s.meses }, (_, k) => s.inicio + k)))].sort((a, b) => a - b);
  if (meses.length) evidencia.push(`Lluvia normal en los meses cultivados: ${meses.map((m) => `${MESES[m].slice(0, 3)} ${f0(ctx.lluviaMes[m])} mm`).join(", ")}.`);
  evidencia.push(ref.dias > 0
    ? `Ajuste con tu estación: ${ref.dias} días comparados con la NASA (confianza ${ref.confianza}), temperatura ${ref.tempAjuste >= 0 ? "+" : ""}${ref.tempAjuste.toFixed(1)} °C y lluvia ×${ref.factorLluvia.toFixed(2)}.`
    : "Todavía no hay días de la estación para ajustar: se usa solo el clima de la NASA.");

  const beneficios = [];
  if (e.hayLeg) beneficios.push("Incluye una leguminosa: deja nitrógeno para el cultivo siguiente (en un ensayo con maíz equivalió a unos 60 kg de N por hectárea).");
  if (e.hayAbono) beneficios.push("Incluye un abono verde: tapa el suelo, frena las malezas y aporta materia orgánica.");
  if (slots.length > 1 && !e.mono) beneficios.push("Alterna familias botánicas: ayuda a cortar el ciclo de las plagas y enfermedades de cada cultivo.");
  if (desnudos.length <= 2) beneficios.push(`Mantiene el suelo cubierto casi todo el año (${12 - desnudos.length} de 12 meses): menos erosión y mejor infiltración.`);
  if (ref !== null && e.est.id !== "actual" && ref.base) beneficios.push(`Necesita unos ${f0(Math.max(0, ref.base - e.riegoTotal))} mm menos de riego que tu rotación actual en un año seco.`);
  if (!beneficios.length) beneficios.push("Es la referencia: no promete mejoras sobre lo que ya haces.");

  const vacios = [];
  if (ref.dias < 60) vacios.push(`La estación lleva solo ${ref.dias} días de datos comparables con la NASA: el ajuste local pesa poco todavía.`);
  if (!ctx.sueloConEstudio) vacios.push("No hay estudio de suelo cargado: no se pudo considerar el pH ni las sales.");
  vacios.push("Los rangos de agua, temperatura y pH de cada cultivo son valores de referencia generales, no medidos en Bosconia.");
  vacios.push("El valor de mercado es una estimación del equipo, no precios reales.");
  vacios.push("No se mide evapotranspiración ni NDVI numérico en el lote; tampoco se conocen las plagas locales de cada ciclo.");

  const riesgos = [];
  slots.filter((s) => (ctx.riego ? s.cl.pTemp : s.cl.exito) < 0.5).forEach((s) => riesgos.push(`${s.cultivo.nombre} en ${MESES[s.inicio]} solo habría salido bien en el ${Math.round((ctx.riego ? s.cl.pTemp : s.cl.exito) * 100)} % de los años: depende mucho de que llueva.`));
  if (desnudosErosion.length) riesgos.push(`Suelo desnudo en meses de lluvia fuerte (${desnudosErosion.map((c) => MESES[c.m].slice(0, 3)).join(", ")}): riesgo de erosión y pérdida de nutrientes.`);
  else if (desnudos.length) riesgos.push(`Quedan ${desnudos.length} meses sin cultivo (${desnudos.map((c) => MESES[c.m].slice(0, 3)).join(", ")}), aunque no son de lluvia fuerte.`);
  if (vulnerables.length) riesgos.push(`Meses de más vulnerabilidad del cultivo por falta de lluvia: ${[...new Set(vulnerables.map((c) => MESES[c.m].slice(0, 3)))].join(", ")}.`);
  if (e.mono) riesgos.push("Repite la misma familia botánica seguida: se acumulan plagas y enfermedades.");
  if (!riesgos.length) riesgos.push("No se encontraron riesgos grandes con estos datos, pero conviene revisarlo con un agrónomo.");

  return { porQue, evidencia, beneficios, vacios, riesgos };
}

// ---------- todo junto ----------
// entrada: { hist, clima, aprendizaje, suelo, riego, riesgo, maquinaria, pesos, actual:[id,id?], anterior, escenario, periodo }
export function construirEstrategias(entrada) {
  const ctx = crearContexto(entrada);
  ctx.sueloConEstudio = ["ph", "ce"].some((k) => entrada.suelo && entrada.suelo[k] !== "" && entrada.suelo[k] != null);
  const cultivosActual = (entrada.actual || []).filter(Boolean).map(cultivoPorId).filter(Boolean);
  const anterior = entrada.anterior || (cultivosActual.length ? cultivosActual[cultivosActual.length - 1].id : "");
  const anios = entrada.hist ? Number(entrada.hist.fin.slice(0, 4)) - Number(entrada.hist.inicio.slice(0, 4)) + 1 : 0;

  const brutas = ESTRATEGIAS.map((est) => {
    if (est.id === "actual") return cultivosActual.length ? evaluar(est, rotacionActual(cultivosActual, ctx), ctx, anterior) : null;
    return evaluar(est, mejorRotacion(est, ctx, anterior), ctx, anterior);
  }).filter(Boolean);

  const base = brutas.find((e) => e.est.id === "actual")?.riegoTotal ?? null;
  const referencia = { ...entrada.aprendizaje, base };
  const resultado = brutas.map((e) => ({
    ...e,
    total: puntajeTotal(e, entrada.pesos, entrada.riesgo),
    texto: textos(e, ctx, referencia, entrada.periodo || "", anios),
  }));
  const mejor = resultado.reduce((b, e) => (e.total > b.total ? e : b), resultado[0]);
  return { estrategias: resultado, mejorId: mejor?.est.id, lluviaMes: ctx.lluviaMes };
}
