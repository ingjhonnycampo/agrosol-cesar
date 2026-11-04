// ===== AGROSOL · SEMÁFORO DEL CULTIVO =====
// Convierte los datos limpios en tres alertas sencillas: riego, hongos y calor.
// Los umbrales son un punto de partida: se ajustan aquí, con el tiempo y con lo que se vea en el terreno.

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
const coma = (v) => String(v).replace(".", ",");

function riego(u, res, U) {
  const { suelo10, suelo30 } = u;
  if (suelo10 === null || suelo30 === null) {
    const falla = u.avisos?.some((a) => a.startsWith("suelo"));
    return { nivel: "gris", mensaje: "Sin datos del suelo",
      detalle: falla
        ? "El sensor de humedad parece desconectado o dañado: manda siempre el mismo valor. Revisa el cable."
        : "El sensor de humedad no está enviando datos." };
  }
  const llovio = res.lluvia24h >= U.lluviaAyuda;
  if (suelo10 < U.sueloSeco10 && suelo30 < U.sueloSeco30) {
    return { nivel: "rojo", mensaje: "Hay que regar hoy",
      detalle: `El suelo está seco arriba (${suelo10} %) y abajo (${suelo30} %): las raíces no tienen reserva.` };
  }
  if (suelo10 < U.sueloSeco10) {
    return { nivel: "amarillo", mensaje: "Riego ligero pronto",
      detalle: `La capa de 10 cm está seca (${suelo10} %) pero abajo aún hay reserva (${suelo30} %). Un riego ligero alcanza.` };
  }
  if (suelo10 < U.sueloJusto10 && !llovio) {
    return { nivel: "amarillo", mensaje: "Vigila el agua",
      detalle: `El suelo empieza a secarse (${suelo10} % a 10 cm). Si no llueve, mañana habrá que regar.` };
  }
  return { nivel: "verde", mensaje: llovio ? "La lluvia ayudó" : "Suelo con buena humedad",
    detalle: llovio
      ? `Cayeron ${coma(res.lluvia24h)} mm en 24 h y el suelo tiene ${suelo10} % a 10 cm. No hace falta regar.`
      : `Humedad de ${suelo10} % a 10 cm y ${suelo30} % a 30 cm. No hace falta regar.` };
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

function hongos(u, filas, U) {
  if (u.hojaEstado === "sin dato") {
    const falla = u.avisos?.some((a) => a.startsWith("hoja"));
    return { nivel: "gris", mensaje: "Sin datos de la hoja",
      detalle: falla
        ? "El sensor de hoja parece pegado: manda siempre el mismo valor. Revisa el cable."
        : "El sensor de mojado de hoja no está enviando datos." };
  }
  const horas = horasHojaHumeda(filas);
  const h = Math.round(horas * 10) / 10;
  const tibio = u.temp !== null && u.temp >= U.tempHongoMin && u.temp <= U.tempHongoMax;
  if (u.hojaEstado === "seca") {
    return { nivel: "verde", mensaje: "Hoja seca, riesgo bajo",
      detalle: "Los hongos necesitan hoja mojada por varias horas. Ahora está seca." };
  }
  if (horas >= U.horasHongoAlto && tibio) {
    return { nivel: "rojo", mensaje: "Riesgo alto de hongos",
      detalle: `La hoja lleva ${coma(h)} h húmeda con temperatura templada (${coma(u.temp)} °C). Conviene revisar el cultivo y ventilar.` };
  }
  if (horas >= U.horasHongoMedio || (u.hojaEstado === "mojada" && tibio)) {
    return { nivel: "amarillo", mensaje: "Atento a los hongos",
      detalle: `La hoja está ${u.hojaEstado.replace(" (rocío)", "")} desde hace ${coma(h)} h. Si sigue así, sube el riesgo.` };
  }
  return { nivel: "verde", mensaje: "Riesgo bajo de hongos",
    detalle: "Hay algo de rocío, pero por poco tiempo. Todavía no es preocupante." };
}

function calor(u, res, U) {
  const aire = u.temp;
  const suelo = u.tsuelo;
  if (aire === null && suelo === null) {
    return { nivel: "gris", mensaje: "Sin datos de temperatura", detalle: "Los sensores de temperatura no están enviando datos." };
  }
  let nivel = "verde";
  const partes = [];
  if (aire !== null) {
    if (aire >= U.aireCalorFuerte) nivel = peor(nivel, "rojo");
    else if (aire >= U.aireCalor) nivel = peor(nivel, "amarillo");
    partes.push(`aire ${coma(aire)} °C`);
  }
  if (suelo !== null) {
    if (suelo >= U.sueloCalorFuerte) nivel = peor(nivel, "rojo");
    else if (suelo >= U.sueloCalor) nivel = peor(nivel, "amarillo");
    partes.push(`suelo ${coma(suelo)} °C`);
  }
  const base = partes.join(" · ");
  if (nivel === "rojo") {
    return { nivel, mensaje: "Calor fuerte", detalle: `${base}. Las plantas sufren: riega temprano o tarde y, si se puede, da sombra.` };
  }
  if (nivel === "amarillo") {
    return { nivel, mensaje: "Hace calor", detalle: `${base}. Evita regar al mediodía: el agua se evapora.` };
  }
  return { nivel, mensaje: "Temperatura agradable", detalle: `${base}. Sin estrés por calor.` };
}

export function evaluarSemaforo(datos, U = UMBRALES) {
  const u = datos?.ultimo;
  if (!u) return [];
  const res = datos.resumen;
  return [
    { id: "riego", titulo: "¿Hay que regar?", icono: "💧", ...riego(u, res, U) },
    { id: "hongos", titulo: "¿Riesgo de hongos?", icono: "🍄", ...hongos(u, datos.filas, U) },
    { id: "calor", titulo: "¿Demasiado calor?", icono: "🌡️", ...calor(u, res, U) },
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
const unir = (p) => (p.length > 1 ? p.slice(0, -1).join(", ") + " y " + p[p.length - 1] : p[0] || "");

// Frase del día, puntuación de 0 a 100 y carita de la salud del cultivo
export function resumenDia(datos, lugar = "la estación") {
  const u = datos?.ultimo;
  if (!u) return null;
  const [riego, hongos, calor] = evaluarSemaforo(datos);
  const validos = [riego, hongos, calor].filter((a) => a.nivel !== "gris");
  const puntos = validos.length ? Math.round(validos.reduce((s, a) => s + PUNTOS[a.nivel], 0) / validos.length) : null;
  const nivel = validos.reduce((m, a) => (ORDEN.indexOf(a.nivel) > ORDEN.indexOf(m) ? a.nivel : m), "verde");

  const partes = [
    { rojo: "hay que regar hoy", amarillo: "conviene vigilar el agua", verde: "no hace falta regar", gris: "no tengo datos del suelo" }[riego.nivel],
    { rojo: "hay riesgo alto de hongos", amarillo: "hay que estar atentos a los hongos", verde: "el riesgo de hongos es bajo" }[hongos.nivel],
    { rojo: "el calor es fuerte", amarillo: "hace calor" }[calor.nivel],
  ].filter(Boolean);
  const lluviaHoy = datos.resumen?.lluviaHoy || 0;
  const frase = `En ${lugar} ${u.temp !== null ? `estamos a ${coma(u.temp)} °C: ` : ": "}${unir(partes)}.` +
    (lluviaHoy > 0 ? ` Hoy ya cayeron ${coma(lluviaHoy)} mm de lluvia.` : "");

  const [carita, etiqueta] =
    puntos === null ? ["🤔", "Sin datos suficientes"]
    : puntos >= 85 ? ["😄", "Cultivo feliz"]
    : puntos >= 60 ? ["🙂", "Cultivo tranquilo"]
    : puntos >= 40 ? ["😟", "Cultivo con estrés"]
    : ["😰", "Cultivo en apuros"];

  const minutos = (Date.now() - new Date(u.t).getTime()) / 60000;
  return {
    frase, puntos, nivel, carita, etiqueta,
    // lo que necesita el astronauta para reaccionar y el cielo para llover
    ambiente: { lluvia: (u.lluviaMm || 0) > 0 && minutos < 30, calor: calor.nivel, riego: riego.nivel },
  };
}
