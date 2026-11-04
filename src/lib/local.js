// APRENDIZAJE LOCAL: lo que la estación le enseña al modelo sobre ESTE terreno.
// Idea: la NASA da el clima de la región (una celda de ~50 km); la estación mide el lote.
// Se comparan los días en que hay datos de las dos y se calculan ajustes locales. Mientras hay pocos días
// el ajuste pesa poco (se confía más en la NASA); al crecer los datos de la estación, pesa más.
// Una estación nueva empieza con 0 días: el modelo parte solo de la NASA y va aprendiendo.
import { UMBRALES } from "./semaforo.js";

const K_TEMPERATURA = 30; // días de datos para que el ajuste de temperatura pese la mitad
const K_LLUVIA = 60;      // la lluvia es más irregular: necesita más días
const DIAS_COMPLETOS = 110; // mediciones mínimas para tomar un día como completo (hay ~144 al día)
const TASA_SECADO_DEFECTO = 4; // % de humedad que pierde el suelo por día sin lluvia, si no hay datos
const CAPACIDAD_DEFECTO = 85;

const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const mediana = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const percentil = (a, p) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

// diasEst: salida de porDia() de la estación; diarioNasa: nasa.diario (últimos días con t2m, tmax, tmin, lluvia)
export function aprenderDeLaEstacion(diasEst, diarioNasa) {
  const nasa = new Map((diarioNasa || []).map((d) => [d.dia, d]));
  const completos = (diasEst || []).filter((d) => d.n >= DIAS_COMPLETOS);

  // 1. Comparación día a día con la NASA
  const pares = completos.map((d) => ({ e: d, n: nasa.get(d.dia) })).filter((p) => p.n && p.n.t2m !== null && p.e.tprom !== null);
  const n = pares.length;
  const sesgoTmed = media(pares.map((p) => p.e.tprom - p.n.t2m));
  const sesgoTmax = media(pares.filter((p) => p.e.tmax !== null && p.n.tmax !== null).map((p) => p.e.tmax - p.n.tmax));
  const sesgoTmin = media(pares.filter((p) => p.e.tmin !== null && p.n.tmin !== null).map((p) => p.e.tmin - p.n.tmin));
  const llE = pares.reduce((a, p) => a + (p.e.lluvia || 0), 0);
  const llN = pares.reduce((a, p) => a + (p.n.lluvia || 0), 0);
  const razonLluvia = llN >= 10 ? limitar(llE / llN, 0.5, 1.5) : 1;

  const wT = n / (n + K_TEMPERATURA);
  const wR = llN >= 10 ? n / (n + K_LLUVIA) : 0;
  const tempAjuste = sesgoTmed === null ? 0 : wT * sesgoTmed;
  const factorLluvia = 1 + wR * (razonLluvia - 1);

  // 2. Cómo se seca el suelo de este lote: días secos seguidos con la humedad a 10 cm bajando
  const porDia = new Map(completos.map((d) => [d.dia, d]));
  const bajadas = [];
  for (const d of completos) {
    const sig = porDia.get(siguienteDia(d.dia));
    if (!sig || d.suelo10 === null || sig.suelo10 === null) continue;
    if ((sig.lluvia || 0) >= 0.5 || (d.lluvia || 0) >= 2) continue;
    if (d.suelo10 < 30 || sig.suelo10 >= d.suelo10) continue;
    bajadas.push(d.suelo10 - sig.suelo10);
  }
  const tasaMedida = bajadas.length >= 3 ? mediana(bajadas) : null;
  const tasaSecado = limitar(tasaMedida ?? TASA_SECADO_DEFECTO, 1, 15);

  const humedades = completos.map((d) => d.suelo10).filter((v) => v !== null);
  const capacidad = humedades.length >= 7 ? Math.max(40, percentil(humedades, 0.9)) : CAPACIDAD_DEFECTO;
  const reservaDias = limitar((capacidad - UMBRALES.sueloSeco10) / tasaSecado, 2, 30);

  const confianza = n === 0 ? "sin datos" : n < 15 ? "baja" : n < 60 ? "media" : "alta";
  return {
    dias: n, confianza, wTemperatura: wT, wLluvia: wR,
    sesgoTmed, sesgoTmax, sesgoTmin, tempAjuste,
    razonLluvia, factorLluvia, lluviaEst: llE, lluviaNasa: llN,
    tasaSecado, tasaMedida: tasaMedida !== null, muestrasSecado: bajadas.length,
    capacidad, reservaDias,
  };
}

function siguienteDia(dia) {
  const d = new Date(Date.parse(dia + "T00:00:00Z") + 86400000);
  return d.toISOString().slice(0, 10);
}

export const aprendizajeVacio = () => aprenderDeLaEstacion([], []);
