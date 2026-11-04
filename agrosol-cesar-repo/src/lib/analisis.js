// Filtros por fecha y resúmenes sobre las filas ya limpias. Los días son "AAAA-MM-DD" en hora de Colombia.
import { CONFIG, diaLocal } from "./limpieza.js";

const r1 = (v) => Math.round(v * 10) / 10;
const validos = (filas, k) => filas.map((f) => f[k]).filter((v) => v !== null && v !== undefined);
const prom = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null);
const maximo = (a) => (a.length ? Math.max(...a) : null);
const minimo = (a) => (a.length ? Math.min(...a) : null);

export const hoyLocal = () => diaLocal(new Date());
export const msDia = (dia) => Date.parse(dia + "T00:00:00Z");

export function sumarDias(dia, n) {
  const d = new Date(msDia(dia));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const diasEntre = (desde, hasta) => Math.round((msDia(hasta) - msDia(desde)) / 86400000) + 1;

export const PRESETS = [
  { id: "hoy", nombre: "Hoy" },
  { id: "ayer", nombre: "Ayer" },
  { id: "7d", nombre: "7 días" },
  { id: "30d", nombre: "30 días" },
  { id: "todo", nombre: "Todo" },
];

// ctx = { hoy, min, max } (min y max: primer y último día con datos)
export function rangoPreset(id, ctx) {
  switch (id) {
    case "hoy": return { desde: ctx.hoy, hasta: ctx.hoy };
    case "ayer": return { desde: sumarDias(ctx.hoy, -1), hasta: sumarDias(ctx.hoy, -1) };
    case "7d": return { desde: sumarDias(ctx.hoy, -6), hasta: ctx.hoy };
    case "30d": return { desde: sumarDias(ctx.hoy, -29), hasta: ctx.hoy };
    default: return { desde: ctx.min, hasta: ctx.max };
  }
}

export const filtrar = (filas, desde, hasta) =>
  filas.filter((f) => {
    const d = diaLocal(f.t);
    return d >= desde && d <= hasta;
  });

// Una fila por día con máximos, mínimos, promedios y totales
export function porDia(filas) {
  const grupos = new Map();
  for (const f of filas) {
    const d = diaLocal(f.t);
    if (!grupos.has(d)) grupos.set(d, []);
    grupos.get(d).push(f);
  }
  return [...grupos.keys()].sort().map((dia) => {
    const g = grupos.get(dia);
    const hojaHumeda = g.filter((f) => f.hojaEstado !== "seca" && f.hojaEstado !== "sin dato").length;
    return {
      dia,
      n: g.length,
      tmax: maximo(validos(g, "temp")),
      tmin: minimo(validos(g, "temp")),
      tprom: prom(validos(g, "temp")),
      tsueloMax: maximo(validos(g, "tsuelo")),
      suelo10: prom(validos(g, "suelo10")),
      suelo30: prom(validos(g, "suelo30")),
      luz: prom(validos(g, "luz")),
      lluvia: r1(validos(g, "lluviaMm").reduce((a, v) => a + v, 0)),
      horasHoja: r1(hojaHumeda / 6), // una medición cada ~10 min
      vientoMax: maximo(validos(g, "vientoKmh")),
    };
  });
}

export function resumenRango(dias) {
  return {
    dias: dias.length,
    lluviaTotal: r1(dias.reduce((a, d) => a + d.lluvia, 0)),
    diasConLluvia: dias.filter((d) => d.lluvia >= 0.5).length,
    tmax: maximo(dias.map((d) => d.tmax).filter((v) => v !== null)),
    tmin: minimo(dias.map((d) => d.tmin).filter((v) => v !== null)),
    horasHoja: r1(dias.reduce((a, d) => a + d.horasHoja, 0)),
    mediciones: dias.reduce((a, d) => a + d.n, 0),
  };
}

// Hora de Colombia "escrita como si fuera UTC", para graficar con useUTC: true
export const xLocal = (iso) => new Date(iso).getTime() + CONFIG.zonaHoraria * 3600000;

export const coma = (v, dec = 1) => (v === null || v === undefined ? "—" : Number(v).toFixed(dec).replace(".", ","));

export const fechaCorta = (dia) =>
  new Date(msDia(dia)).toLocaleDateString("es-CO", { timeZone: "UTC", day: "numeric", month: "short" });

export const fechaLarga = (dia) =>
  new Date(msDia(dia)).toLocaleDateString("es-CO", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
