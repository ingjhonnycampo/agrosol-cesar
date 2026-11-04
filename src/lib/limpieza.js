// ===== AGROSOL · LIMPIEZA E INTERPRETACIÓN DE LOS DATOS DE LA ESTACIÓN =====
// Aquí están TODAS las reglas. Si algo hay que ajustar (calibración, límites), se cambia solo aquí.

export const CONFIG = {
  canal: 3535105,
  // Hasta esta fecha la estación tenía la corrección vieja de -9 °C.
  // Desde aquí (v3.8) la temperatura ya llega corregida desde la estación.
  inicioV38: "2026-11-03T17:30:00Z",
  corrNoche: 2.5,      // °C que el sensor marca de más de noche
  corrSol: 1.5,        // °C extra que marca a pleno sol (la caja se calienta)
  luzMax: 950,         // lectura de la fotocelda a pleno sol
  mmPorVolteo: 0.51,   // calibrado: 100 mL = 25 volteos, embudo de 10 cm
  maxVolteos: 60,      // más de 60 volteos en 10 min es imposible (falso)
  volteosSinHoja: 10,  // 10 o más volteos con la hoja seca = sospechoso
  hojaSeca: 20,        // sensor de hoja por debajo de esto = seco
  hojaMojada: 100,     // por encima de esto = mojada (lluvia o rocío fuerte)
  kmhPorPulso: 0.40,
  zonaHoraria: -5,     // Colombia
  // Calibración de la humedad del suelo: lectura con el sensor seco al aire y saturado en agua.
  // Con 0 y 1023 el % es solo un índice. Se ajusta con el panel "Calibrar" de la página.
  suelo10: { seco: 0, humedo: 1023 },
  suelo30: { seco: 0, humedo: 1023 },
  // Sensores pegados: tantas lecturas idénticas seguidas (una cada ~10 min) = sensor sin respuesta
  pegadoMin: 12,       // 12 lecturas = 2 horas
  sueloTope: 1020,     // desde aquí el sensor está en su tope (suelo saturado): no cuenta como pegado
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};
const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
const pct = (v, max) => (v === null ? null : Math.max(0, Math.min(100, Math.round((v / max) * 100))));

// % de humedad según la calibración { seco, humedo } (lecturas crudas de 0 a 1023)
export function pctCal(raw, cal) {
  if (raw === null) return null;
  const rango = cal.humedo - cal.seco;
  if (!(Math.abs(rango) > 0)) return null;
  return Math.max(0, Math.min(100, Math.round(((raw - cal.seco) / rango) * 100)));
}

// fecha local de Colombia "AAAA-MM-DD"
export function diaLocal(fecha, cfg = CONFIG) {
  return new Date(new Date(fecha).getTime() + cfg.zonaHoraria * 3600000).toISOString().slice(0, 10);
}

export function estadoHoja(raw, cfg = CONFIG) {
  if (raw === null) return "sin dato";
  if (raw < cfg.hojaSeca) return "seca";
  if (raw < cfg.hojaMojada) return "húmeda (rocío)";
  return "mojada";
}

export function limpiarFila(f, cfg = CONFIG) {
  const t = new Date(f.created_at);
  const avisos = [];
  let temp = num(f.field1);
  const luzRaw = num(f.field2);
  const s10 = num(f.field3);
  const s30 = num(f.field4);
  const hoja = num(f.field5);
  const volteos = num(f.field6);
  let tsuelo = num(f.field7);
  const pps = num(f.field8);

  // 1. Temperatura del aire: datos viejos -> quitar el -9 y aplicar la fórmula según el sol
  if (temp !== null && t < new Date(cfg.inicioV38)) {
    const cruda = temp + 9;
    temp = cruda - cfg.corrNoche - (cfg.corrSol * Math.min(luzRaw ?? 0, cfg.luzMax)) / cfg.luzMax;
  }
  if (temp !== null && (temp < 10 || temp > 50)) { avisos.push("temperatura imposible"); temp = null; }

  // 2. Temperatura del suelo (LM35)
  if (tsuelo !== null && (tsuelo < 5 || tsuelo > 70)) { avisos.push("temp. suelo imposible"); tsuelo = null; }

  // 3. Lluvia: descartar volteos falsos
  let lluvia = volteos;
  if (lluvia !== null) {
    if (lluvia > cfg.maxVolteos) { avisos.push("lluvia imposible"); lluvia = 0; }
    else if (lluvia >= cfg.volteosSinHoja && (hoja ?? 0) < cfg.hojaSeca) { avisos.push("lluvia con hoja seca"); lluvia = 0; }
  }

  return {
    t: t.toISOString(),
    temp: r1(temp),
    tsuelo: r1(tsuelo),
    suelo10: pctCal(s10, cfg.suelo10),
    suelo30: pctCal(s30, cfg.suelo30),
    suelo10Raw: s10,
    suelo30Raw: s30,
    _luz: luzRaw,
    _hoja: hoja,
    luz: pct(luzRaw, cfg.luzMax),
    hoja: pct(hoja, 700),
    hojaEstado: estadoHoja(hoja, cfg),
    lluviaMm: lluvia === null ? null : r1(lluvia * cfg.mmPorVolteo),
    vientoKmh: pps === null ? null : r1(pps * cfg.kmhPorPulso),
    avisos,
  };
}

// Sensores que dejaron de responder: mismo valor exacto muchas veces seguidas.
// Se marcan como sin dato (null) para que el semáforo no aconseje con un sensor dañado.
// Un 0 sostenido es normal (noche, hoja seca, suelo muy seco), así que no cuenta como pegado.
const SENSORES_PEGABLES = [
  { raw: "suelo10Raw", campos: ["suelo10"], nombre: "suelo 10 cm" },
  { raw: "suelo30Raw", campos: ["suelo30"], nombre: "suelo 30 cm" },
  { raw: "_luz", campos: ["luz"], nombre: "luz" },
  { raw: "_hoja", campos: ["hoja"], nombre: "hoja", estado: "hojaEstado" },
];

function marcarPegados(filas, cfg) {
  for (const s of SENSORES_PEGABLES) {
    const anular = (f, motivo) => {
      s.campos.forEach((c) => { f[c] = null; });
      if (s.estado) f[s.estado] = "sin dato";
      if (!f.avisos.includes(motivo)) f.avisos.push(motivo);
    };
    let i = 0;
    while (i < filas.length) {
      const v = filas[i][s.raw];
      let j = i;
      while (j + 1 < filas.length && filas[j + 1][s.raw] === v) j++;
      // 1020 o más es el tope del sensor (suelo saturado): puede repetirse horas sin ser una falla
      if (v !== null && v !== 0 && v < cfg.sueloTope && j - i + 1 >= cfg.pegadoMin) {
        for (let k = i; k <= j; k++) anular(filas[k], s.nombre + " pegado");
      }
      i = j + 1;
    }
  }
  for (const f of filas) { delete f._luz; delete f._hoja; }
}

export function procesar(feeds, cfg = CONFIG) {
  const filas = feeds
    .filter((f) => f && f.created_at)
    .map((f) => limpiarFila(f, cfg))
    .sort((a, b) => a.t.localeCompare(b.t));
  marcarPegados(filas, cfg);

  const ultimo = filas[filas.length - 1] || null;
  const hoy = ultimo ? diaLocal(ultimo.t, cfg) : null;
  const deHoy = filas.filter((f) => diaLocal(f.t, cfg) === hoy);
  const hace24 = ultimo ? new Date(ultimo.t).getTime() - 86400000 : 0;
  const sumar = (lista) => r1(lista.reduce((a, f) => a + (f.lluviaMm || 0), 0));
  const temps = deHoy.map((f) => f.temp).filter((v) => v !== null);

  return {
    generado: new Date().toISOString(),
    ultimo,
    resumen: {
      lluviaHoy: sumar(deHoy),
      lluvia24h: sumar(filas.filter((f) => new Date(f.t).getTime() > hace24)),
      tmaxHoy: temps.length ? Math.max(...temps) : null,
      tminHoy: temps.length ? Math.min(...temps) : null,
      totalDatos: filas.length,
      corregidos: filas.filter((f) => f.avisos.length).length,
      desde: filas[0]?.t || null,
    },
    filas,
  };
}
