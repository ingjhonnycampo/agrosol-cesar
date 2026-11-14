// ===== AGROSOL · SEMÁFORO DEL CULTIVO =====
// Convierte los datos limpios en tres alertas sencillas: riego, hongos y calor.
// Los umbrales son un punto de partida: se ajustan aquí, con el tiempo y con lo que se vea en el terreno.
// Los textos salen de `t` (traducción); sin `t` se muestran las claves.
import { coma } from "./num.js";

export const UMBRALES = {
  // Humedad del suelo (índice % de 1023, sensor resistivo sin calibrar)
  sueloSeco10: 25,     // por debajo de esto en 10 cm = seco
  sueloSeco30: 35,     // por debajo de esto en 30 cm = sin reserva
  sueloJusto10: 40,    // por debajo de esto = empieza a faltar agua
  lluviaAyuda: 5,      // mm en 24 h que cuentan como un buen riego natural
  // Hongos: horas seguidas con la hoja húmeda o mojada
  horasHongoAlto: 6,
  horasHongoMedio: 3,
  tempHongoMin: 18,    // rango de temperatura donde prosperan los hongos
  tempHongoMax: 32,
  // Calor
  aireCalor: 33,
  aireCalorFuerte: 37,
  sueloCalor: 38,
  sueloCalorFuerte: 42,
};

const NIVELES = { gris: 0, verde: 1, amarillo: 2, rojo: 3 };
const peor = (a, b) => (NIVELES[a] >= NIVELES[b] ? a : b);
const claveHoja = { seca: "hoja.seca", "húmeda (rocío)": "hoja.humeda", mojada: "hoja.mojada", "sin dato": "hoja.sinDato" };
// Nombre (traducido) del estado de la hoja, para mostrarlo en pantalla
export const textoHoja = (estado, t) => t(claveHoja[estado] || "hoja.sinDato");

function riego(u, res, U, t) {
  const { suelo10, suelo30 } = u;
  if (suelo10 === null || suelo30 === null) {
    const falla = u.avisos?.some((a) => a.startsWith("suelo"));
    return { nivel: "gris", mensaje: t("riego.sinDatos"), detalle: falla ? t("riego.sinDatosFalla") : t("riego.sinDatosNo") };
  }
  const llovio = res.lluvia24h >= U.lluviaAyuda;
  if (suelo10 < U.sueloSeco10 && suelo30 < U.sueloSeco30) {
    return { nivel: "rojo", mensaje: t("riego.rojo"), detalle: t("riego.rojoDet", { a: suelo10, b: suelo30 }) };
  }
  if (suelo10 < U.sueloSeco10) {
    return { nivel: "amarillo", mensaje: t("riego.amarillo1"), detalle: t("riego.amarillo1Det", { a: suelo10, b: suelo30 }) };
  }
  if (suelo10 < U.sueloJusto10 && !llovio) {
    return { nivel: "amarillo", mensaje: t("riego.amarillo2"), detalle: t("riego.amarillo2Det", { a: suelo10 }) };
  }
  return llovio
    ? { nivel: "verde", mensaje: t("riego.verdeLluvia"), detalle: t("riego.verdeLluviaDet", { mm: coma(res.lluvia24h), a: suelo10 }) }
    : { nivel: "verde", mensaje: t("riego.verde"), detalle: t("riego.verdeDet", { a: suelo10, b: suelo30 }) };
}

// horas seguidas, hasta el último dato, con la hoja húmeda o mojada
function horasHojaHumeda(filas) {
  if (!filas?.length) return 0;
  const fin = new Date(filas[filas.length - 1].t).getTime();
  let inicio = fin;
  for (let i = filas.length - 1; i >= 0; i--) {
    if (filas[i].hojaEstado === "seca" || filas[i].hojaEstado === "sin dato") break;
    inicio = new Date(filas[i].t).getTime();
  }
  return (fin - inicio) / 3600000;
}

function hongos(u, filas, U, t) {
  if (u.hojaEstado === "sin dato") {
    const falla = u.avisos?.some((a) => a.startsWith("hoja"));
    return { nivel: "gris", mensaje: t("hongos.sinDatos"), detalle: falla ? t("hongos.sinDatosFalla") : t("hongos.sinDatosNo") };
  }
  const horas = horasHojaHumeda(filas);
  const h = coma(Math.round(horas * 10) / 10);
  const tibio = u.temp !== null && u.temp >= U.tempHongoMin && u.temp <= U.tempHongoMax;
  if (u.hojaEstado === "seca") {
    return { nivel: "verde", mensaje: t("hongos.seca"), detalle: t("hongos.secaDet") };
  }
  if (horas >= U.horasHongoAlto && tibio) {
    return { nivel: "rojo", mensaje: t("hongos.rojo"), detalle: t("hongos.rojoDet", { h, t: coma(u.temp) }) };
  }
  if (horas >= U.horasHongoMedio || (u.hojaEstado === "mojada" && tibio)) {
    const estado = u.hojaEstado === "mojada" ? t("hoja.mojada") : t("hoja.humeda").replace(/\s*\(.*\)/, "");
    return { nivel: "amarillo", mensaje: t("hongos.amarillo"), detalle: t("hongos.amarilloDet", { estado, h }) };
  }
  return { nivel: "verde", mensaje: t("hongos.verde"), detalle: t("hongos.verdeDet") };
}

function calor(u, res, U, t) {
  const aire = u.temp;
  const suelo = u.tsuelo;
  if (aire === null && suelo === null) {
    return { nivel: "gris", mensaje: t("calor.sinDatos"), detalle: t("calor.sinDatosDet") };
  }
  let nivel = "verde";
  const partes = [];
  if (aire !== null) {
    if (aire >= U.aireCalorFuerte) nivel = peor(nivel, "rojo");
    else if (aire >= U.aireCalor) nivel = peor(nivel, "amarillo");
    partes.push(t("calor.aire", { t: coma(aire) }));
  }
  if (suelo !== null) {
    if (suelo >= U.sueloCalorFuerte) nivel = peor(nivel, "rojo");
    else if (suelo >= U.sueloCalor) nivel = peor(nivel, "amarillo");
    partes.push(t("calor.suelo", { t: coma(suelo) }));
  }
  const base = partes.join(" · ");
  return { nivel, mensaje: t("calor." + nivel), detalle: t("calor." + nivel + "Det", { base }) };
}

const sinTraducir = (k) => k;

export function evaluarSemaforo(datos, U = UMBRALES, t = sinTraducir) {
  const u = datos?.ultimo;
  if (!u) return [];
  const res = datos.resumen;
  return [
    { id: "riego", titulo: t("sem.riego"), icono: "💧", ...riego(u, res, U, t) },
    { id: "hongos", titulo: t("sem.hongos"), icono: "🍄", ...hongos(u, datos.filas, U, t) },
    { id: "calor", titulo: t("sem.calor"), icono: "🌡️", ...calor(u, res, U, t) },
  ];
}

export const COLORES_NIVEL = { verde: "#2f9e4f", amarillo: "#e8a317", rojo: "#d9443a", gris: "#9aa5a0" };

const alto = (v, amarillo, rojo) => (v === null || v === undefined ? undefined : v >= rojo ? "rojo" : v >= amarillo ? "amarillo" : "verde");
const bajo = (v, rojo, amarillo) => (v === null || v === undefined ? undefined : v < rojo ? "rojo" : v < amarillo ? "amarillo" : "verde");

// Color de cada medidor según el estado del cultivo (undefined = el medidor conserva su color)
export function nivelesMedidores(u, U = UMBRALES) {
  return {
    temp: alto(u.temp, U.aireCalor, U.aireCalorFuerte),
    tsuelo: alto(u.tsuelo, U.sueloCalor, U.sueloCalorFuerte),
    suelo10: bajo(u.suelo10, U.sueloSeco10, U.sueloJusto10),
    suelo30: bajo(u.suelo30, U.sueloSeco30, 50),
    hoja: u.hojaEstado === "seca" ? "verde" : u.hojaEstado === "sin dato" ? undefined : "amarillo",
  };
}

const PUNTOS = { verde: 100, amarillo: 60, rojo: 20 };
const ORDEN = ["gris", "verde", "amarillo", "rojo"];

// Frase del día, puntuación de 0 a 100 y carita de la salud del cultivo
export function resumenDia(datos, lugar, t = sinTraducir) {
  const u = datos?.ultimo;
  if (!u) return null;
  const [riegoA, hongosA, calorA] = evaluarSemaforo(datos, UMBRALES, t);
  const validos = [riegoA, hongosA, calorA].filter((a) => a.nivel !== "gris");
  const puntos = validos.length ? Math.round(validos.reduce((s, a) => s + PUNTOS[a.nivel], 0) / validos.length) : null;
  const nivel = validos.reduce((m, a) => (ORDEN.indexOf(a.nivel) > ORDEN.indexOf(m) ? a.nivel : m), "verde");

  const partes = [
    t("res.riego." + riegoA.nivel),
    hongosA.nivel !== "gris" ? t("res.hongos." + hongosA.nivel) : null,
    calorA.nivel === "rojo" || calorA.nivel === "amarillo" ? t("res.calor." + calorA.nivel) : null,
  ].filter(Boolean);
  const lista = partes.length > 1 ? partes.slice(0, -1).join(", ") + t("res.y") + partes[partes.length - 1] : partes[0] || "";
  const lluviaHoy = datos.resumen?.lluviaHoy || 0;
  const frase = (u.temp !== null
    ? t("res.frase", { lugar, t: coma(u.temp), lista })
    : t("res.fraseSinTemp", { lugar, lista })) + (lluviaHoy > 0 ? t("res.lluviaHoy", { mm: coma(lluviaHoy) }) : "");

  const [carita, etiqueta] =
    puntos === null ? ["🤔", t("res.et.sinDatos")]
    : puntos >= 85 ? ["😄", t("res.et.feliz")]
    : puntos >= 60 ? ["🙂", t("res.et.tranquilo")]
    : puntos >= 40 ? ["😟", t("res.et.estres")]
    : ["😰", t("res.et.apuros")];

  const minutos = (Date.now() - new Date(u.t).getTime()) / 60000;
  return {
    frase, puntos, nivel, carita, etiqueta,
    // lo que necesita el astronauta para reaccionar y el cielo para llover
    ambiente: { lluvia: (u.lluviaMm || 0) > 0 && minutos < 30, calor: calorA.nivel, riego: riegoA.nivel },
  };
}
