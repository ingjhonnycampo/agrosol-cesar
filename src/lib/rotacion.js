// Modelo de recomendación de cultivos: ¿qué sembrar, según los datos y lo que le importa al agricultor?
//
// 1. CLIMA REAL, AÑO POR AÑO: con el historial diario de la NASA (2001–2025) se simula qué habría pasado cada año
//    si se sembrara en el mes elegido: ¿alcanzó la lluvia?, ¿hubo una racha seca más larga de lo que aguanta el suelo?
//    El resultado es una PROBABILIDAD (en cuántos años habría salido bien).
// 2. AJUSTE LOCAL con la estación: la temperatura y la lluvia de la NASA se corrigen con lo que mide la estación,
//    y la reserva de agua del suelo sale de cómo se seca ESTE lote (ver local.js). Pesan más cuantos más días haya.
// 3. ROTACIÓN: lo que el cultivo anterior le hizo al suelo (familia, nitrógeno).
// 4. SUELO: pH y sales del estudio de suelo.
// 5. INTERESES del agricultor: agua, rapidez, suelo, mercado, riego disponible y tolerancia al riesgo.
import { CULTIVOS, cultivoPorId } from "../data/cultivos.js";
import { aNumero } from "./suelo.js";

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS_MES = 30.4;
const LLUVIA_UTIL = 0.75;   // parte de la lluvia que realmente aprovecha el cultivo
const COBERTURA_MIN = 0.6;  // un año "sale bien" si la lluvia útil cubre al menos esto del agua del cultivo (umbral por validar con un agrónomo)
const DIA_SECO = 1;         // mm: por debajo se cuenta como día seco
const FACTOR_SEQUIA = { alta: 1.6, media: 1.1, baja: 0.7 }; // cuánto aguanta el cultivo una racha seca

export const PRIORIDADES = [
  { id: "agua", nombre: "Ahorrar agua", icono: "💧", ayuda: "Cultivos que gastan poca agua" },
  { id: "rapidez", nombre: "Cosechar rápido", icono: "⏱️", ayuda: "Ciclos cortos" },
  { id: "suelo", nombre: "Cuidar el suelo", icono: "🌱", ayuda: "Que aporten nitrógeno o exijan poco" },
  { id: "mercado", nombre: "Mercado", icono: "💰", ayuda: "Mayor demanda (valor estimado)" },
];

export const RIESGOS = [
  { id: "seguro", nombre: "Prefiero lo seguro", exp: 1.6 },
  { id: "equilibrado", nombre: "Equilibrado", exp: 1 },
  { id: "arriesgado", nombre: "Acepto arriesgar", exp: 0.65 },
];

const media = (a) => (a[0] + a[1]) / 2;
const limitar = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const dentro = (v, [a, b]) => v >= a && v <= b;
const percentil = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// ---------- historial de la NASA ----------
const ms = (y, m, d) => Date.UTC(y, m, d);

// Para un cultivo y un mes de siembra, simula cada año del historial
function simularAnios(c, mes, hist, ap, riego) {
  const t0 = Date.parse(hist.inicio + "T00:00:00Z");
  const largo = hist.lluvia.length;
  const ciclo = Math.round(Math.min(365, media(c.ciclo)));
  const necesita = media(c.agua);
  const reserva = ap.reservaDias * FACTOR_SEQUIA[c.sequia];
  const anioIni = Number(hist.inicio.slice(0, 4));
  const anioFin = Number(hist.fin.slice(0, 4));
  const res = [];
  for (let y = anioIni; y <= anioFin; y++) {
    const i0 = Math.round((ms(y, mes, 15) - t0) / 86400000);
    if (i0 < 0 || i0 + ciclo > largo) continue; // ciclo que se sale del historial
    let lluvia = 0, racha = 0, maxRacha = 0, suma = 0, nt = 0;
    for (let i = i0; i < i0 + ciclo; i++) {
      const ll = (hist.lluvia[i] ?? 0) * ap.factorLluvia;
      lluvia += ll;
      if (ll < DIA_SECO) { racha++; if (racha > maxRacha) maxRacha = racha; } else racha = 0;
      if (hist.t2m[i] !== null) { suma += hist.t2m[i]; nt++; }
    }
    const tMedia = nt ? suma / nt + ap.tempAjuste : null;
    const util = lluvia * LLUVIA_UTIL;
    const cobertura = util / necesita;
    const tempBien = tMedia === null || dentro(tMedia, c.temp.tol);
    const aguaBien = cobertura >= COBERTURA_MIN;
    const rachaBien = maxRacha <= reserva;
    res.push({
      anio: y, cobertura, maxRacha, tMedia, riegoMm: Math.max(0, necesita - util), aguaBien, rachaBien, tempBien,
      exito: tempBien && (riego || (aguaBien && rachaBien)),
    });
  }
  return res;
}

function resumirSimulacion(c, anios, ap) {
  const n = anios.length;
  const p = (f) => (n ? anios.filter(f).length / n : 0);
  const rachas = anios.map((a) => a.maxRacha);
  return {
    anios: n,
    exito: p((a) => a.exito),
    pAgua: p((a) => a.aguaBien),
    pRacha: p((a) => a.rachaBien),
    pTemp: p((a) => a.tempBien),
    riegoP80: n ? percentil(anios.map((a) => a.riegoMm), 0.8) : 0,
    rachaTipica: n ? percentil(rachas, 0.5) : 0,
    rachaFuerte: n ? percentil(rachas, 0.8) : 0,
    reserva: ap.reservaDias * FACTOR_SEQUIA[c.sequia],
    tMedia: n ? anios.reduce((s, a) => s + (a.tMedia ?? 0), 0) / n : null,
  };
}

// ---------- plan B: clima promedio mensual (si no llegó el historial) ----------
function simulacionPromedio(c, mes, clima, ap, riego) {
  const n = Math.min(12, Math.max(1, Math.ceil(media(c.ciclo) / DIAS_MES)));
  const meses = Array.from({ length: n }, (_, i) => (mes + i) % 12);
  const lluvia = meses.reduce((a, m) => a + (clima.lluviaMes[m] ?? 0), 0) * ap.factorLluvia;
  const necesita = media(c.agua);
  const cobertura = (lluvia * LLUVIA_UTIL) / necesita;
  const temps = meses.map((m) => clima.tMes[m]).filter((t) => t !== null);
  const tMedia = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length + ap.tempAjuste : null;
  const tempBien = tMedia === null || dentro(tMedia, c.temp.tol);
  const exito = tempBien && (riego || cobertura >= COBERTURA_MIN) ? 1 : 0;
  return {
    anios: 0, exito: limitar(cobertura, 0, 1) * (tempBien ? 1 : 0.2), pAgua: limitar(cobertura, 0, 1), pRacha: 1, pTemp: tempBien ? 1 : 0,
    riegoP80: Math.max(0, necesita - lluvia * LLUVIA_UTIL), rachaTipica: 0, rachaFuerte: 0, reserva: 0, tMedia, aproximado: true, _exito: exito,
  };
}

function climaDe(c, mes, hist, clima, ap, riego) {
  const sim = hist ? resumirSimulacion(c, simularAnios(c, mes, hist, ap, riego), ap) : simulacionPromedio(c, mes, clima, ap, riego);
  let puntajeTemp = 70;
  if (sim.tMedia !== null) puntajeTemp = dentro(sim.tMedia, c.temp.opt) ? 100 : dentro(sim.tMedia, c.temp.tol) ? 65 : 15;
  return { ...sim, puntajeTemp };
}

// ---------- suelo, rotación, prioridades ----------
function evaluarSuelo(c, suelo) {
  const ph = aNumero(suelo?.ph);
  const ce = aNumero(suelo?.ce);
  let puntajePh = 70;
  if (ph !== null) puntajePh = dentro(ph, c.ph.opt) ? 100 : dentro(ph, c.ph.tol) ? 65 : 20;
  let puntajeSal = 100;
  if (ce !== null && ce > 2) {
    const fuerte = ce > 4;
    puntajeSal = c.sales === "tolerante" ? 90 : c.sales === "media" ? (fuerte ? 35 : 65) : fuerte ? 15 : 35;
  }
  return { ph, ce, puntajePh, puntajeSal, total: 0.7 * puntajePh + 0.3 * puntajeSal };
}

function evaluarRotacion(c, anterior) {
  if (!anterior) return { puntaje: 75, tipo: "info", texto: "No elegiste cultivo anterior: no se tuvo en cuenta la rotación." };
  if (anterior.id === c.id) return { puntaje: 0, tipo: "mal", texto: "Es el mismo cultivo que el anterior: se acumulan plagas y enfermedades." };
  if (anterior.familia === c.familia) return { puntaje: 25, tipo: "mal", texto: `Es de la misma familia que ${anterior.nombre} (${c.familia}): comparten plagas y enfermedades.` };
  if (c.fijaN && anterior.exigenciaN !== "baja") return { puntaje: 100, tipo: "bien", texto: `Fija nitrógeno y repone lo que gastó ${anterior.nombre}.` };
  if (anterior.fijaN && c.exigenciaN === "alta") return { puntaje: 95, tipo: "bien", texto: `Aprovecha el nitrógeno que dejó ${anterior.nombre}.` };
  if (anterior.fijaN) return { puntaje: 85, tipo: "bien", texto: `Viene después de ${anterior.nombre}, que mejora el suelo.` };
  if (anterior.exigenciaN === "alta" && c.exigenciaN === "alta") return { puntaje: 55, tipo: "aviso", texto: `Tanto ${anterior.nombre} como este cultivo gastan mucho nitrógeno: habrá que abonar bien.` };
  return { puntaje: 80, tipo: "bien", texto: `Familia distinta a ${anterior.nombre}: rompe el ciclo de plagas.` };
}

function evaluarPrioridades(c, pesos) {
  const agua = limitar(100 * (1 - (media(c.agua) - 300) / (2000 - 300)));
  const rapidez = limitar(100 * (1 - (media(c.ciclo) - 65) / (360 - 65)));
  const suelo = c.fijaN ? 100 : c.exigenciaN === "baja" ? 70 : c.exigenciaN === "media" ? 55 : 35;
  const mercado = c.mercado * 20;
  const valores = { agua, rapidez, suelo, mercado };
  const suma = Object.values(pesos).reduce((a, b) => a + b, 0);
  const total = suma > 0 ? PRIORIDADES.reduce((a, p) => a + (pesos[p.id] || 0) * valores[p.id], 0) / suma : 50;
  return { valores, total };
}

// Puntaje técnico del clima: probabilidad de éxito (con la tolerancia al riesgo) y temperatura
function puntajeClima(cl, riesgo) {
  const exp = RIESGOS.find((r) => r.id === riesgo)?.exp ?? 1;
  const p = Math.pow(limitar(cl.exito, 0, 1), exp);
  return 0.7 * 100 * p + 0.3 * cl.puntajeTemp;
}

export function mejorMes(c, ctx) {
  let mejor = 0, puntaje = -1;
  for (let m = 0; m < 12; m++) {
    const t = puntajeClima(climaDe(c, m, ctx.hist, ctx.clima, ctx.ap, ctx.riego), ctx.riesgo);
    if (t > puntaje) { puntaje = t; mejor = m; }
  }
  return { mes: mejor, puntaje: Math.round(puntaje) };
}

// Calendario de siembra: probabilidad de éxito de cada cultivo según el mes en que se siembre
export function calendarioSiembra({ hist, clima, aprendizaje: ap, riego = false, riesgo = "equilibrado" }) {
  return CULTIVOS.map((c) => {
    const meses = Array.from({ length: 12 }, (_, m) => {
      const cl = climaDe(c, m, hist, clima, ap, riego);
      return { cl, exito: cl.exito, puntaje: Math.round(puntajeClima(cl, riesgo)) };
    });
    const mejor = meses.reduce((b, x, m) => (x.puntaje > meses[b].puntaje ? m : b), 0);
    return { cultivo: c, meses, mejor };
  });
}

const f0 = (v) => Math.round(v).toLocaleString("es-CO");
const f1 = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");

// entrada: { anterior, mesSiembra, pesos, riego, riesgo, hist, clima, aprendizaje, suelo, humedadHoy }
export function recomendar({ anterior, mesSiembra, pesos, riego = false, riesgo = "equilibrado", hist, clima, aprendizaje, suelo, humedadHoy = null }) {
  const ap = aprendizaje;
  const ant = anterior ? cultivoPorId(anterior) : null;
  const ctx = { hist, clima, ap, riego, riesgo };
  const periodo = hist ? `${hist.inicio.slice(0, 4)}–${hist.fin.slice(0, 4)}` : "";
  const hoy = new Date().getMonth();

  return CULTIVOS.filter((c) => c.id !== anterior).map((c) => {
    const cl = climaDe(c, mesSiembra, hist, clima, ap, riego);
    const su = evaluarSuelo(c, suelo);
    const ro = evaluarRotacion(c, ant);
    const pr = evaluarPrioridades(c, pesos);
    const tecnico = 0.4 * puntajeClima(cl, riesgo) + 0.3 * ro.puntaje + 0.3 * su.total;
    const total = Math.round(0.65 * tecnico + 0.35 * pr.total);

    const razones = [];
    razones.push({ tipo: ro.tipo, texto: ro.texto });

    if (cl.anios) {
      const pc = Math.round(cl.exito * cl.anios);
      razones.push({
        tipo: cl.exito >= 0.75 ? "bien" : cl.exito >= 0.45 ? "aviso" : "mal",
        texto: riego
          ? `Con riego, en ${pc} de los ${cl.anios} años (${periodo}) la temperatura habría permitido el cultivo.`
          : `Sembrado en ${MESES[mesSiembra]}, en ${pc} de los ${cl.anios} años (${periodo}) habría tenido agua suficiente: la lluvia alcanzó y no hubo una racha seca que el cultivo no aguantara.`,
      });
      if (!riego) {
        razones.push({
          tipo: cl.pRacha >= 0.75 ? "info" : "aviso",
          texto: `La racha seca más larga suele ser de unos ${f0(cl.rachaTipica)} días (hasta ${f0(cl.rachaFuerte)} en años secos). ${ap.tasaMedida ? "El suelo de tu lote" : "Un suelo típico (aún sin medir el de tu lote)"} aguanta ~${f0(cl.reserva)} días para este cultivo.`,
        });
      }
      razones.push({ tipo: "info", texto: `Si hiciera falta regar, en un año seco serían unos ${f0(cl.riegoP80)} mm (lámina de riego).` });
    } else {
      razones.push({ tipo: "info", texto: "No llegó el historial de la NASA: se usó el clima promedio mensual (menos preciso)." });
    }
    if (cl.tMedia !== null) {
      razones.push({
        tipo: cl.puntajeTemp >= 100 ? "bien" : cl.puntajeTemp >= 65 ? "aviso" : "mal",
        texto: `Temperatura media esperada ${f1(cl.tMedia)} °C${ap.dias ? " (ya ajustada con tu estación)" : ""}; lo ideal es de ${c.temp.opt[0]} a ${c.temp.opt[1]} °C.`,
      });
    }
    if (su.ph !== null) {
      razones.push({
        tipo: su.puntajePh >= 100 ? "bien" : su.puntajePh >= 65 ? "aviso" : "mal",
        texto: `pH del suelo ${f1(su.ph)}: ${su.puntajePh >= 100 ? "está en el rango ideal" : su.puntajePh >= 65 ? "tolera, pero no es lo ideal" : "fuera de lo que tolera"} (ideal ${f1(c.ph.opt[0])} a ${f1(c.ph.opt[1])}).`,
      });
    } else razones.push({ tipo: "info", texto: "Sin estudio de suelo: el pH no se pudo comprobar." });
    if (su.ce !== null && su.ce > 2 && su.puntajeSal < 65) razones.push({ tipo: "mal", texto: `Las sales del suelo (${f1(su.ce)} dS/m) perjudican a este cultivo.` });
    if (humedadHoy !== null && mesSiembra === hoy && humedadHoy < 25 && !riego) {
      razones.push({ tipo: "aviso", texto: `Hoy el suelo de tu lote está seco (${humedadHoy} %): para germinar habría que regar primero.` });
    }
    razones.push({ tipo: "info", texto: `Ciclo de unos ${c.ciclo[0]} a ${c.ciclo[1]} días. ${c.nota}` });

    return { cultivo: c, total, clima: cl, suelo: su, rotacion: ro, prioridades: pr, razones, mejor: mejorMes(c, ctx) };
  }).sort((a, b) => b.total - a.total);
}

// Clima promedio por mes desde /api/nasa (plan B y para mostrar)
export function climaDesdeNasa(nasa) {
  const tMes = Array(12).fill(null);
  const lluviaMes = Array(12).fill(0);
  (nasa?.meses || []).forEach((m) => {
    tMes[m.mes - 1] = m.t2m;
    lluviaMes[m.mes - 1] = m.lluvia === null ? 0 : m.lluvia * DIAS_MES;
  });
  return { tMes, lluviaMes };
}
