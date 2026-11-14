// ¿QUÉ TAN SEGURA ES LA RECOMENDACIÓN?
// Mide cuánto se apoyan las recomendaciones en datos que coinciden entre sí. No dice si el cultivo es bueno: dice
// cuánta confianza darle a lo que el modelo calculó. Cada punto sale de un dato que se puede mostrar.
import { hayEstudio } from "./suelo.js";
import { climaDesdeNasa } from "./rotacion.js";

const estadoDe = (v) => (v >= 0.8 ? "bien" : v >= 0.55 ? "aviso" : "mal");
const f1 = (v) => (Math.round(v * 10) / 10).toString().replace(".", ",");
const f2 = (v) => (Math.round(v * 100) / 100).toString().replace(".", ",");

// entrada: { ap (aprendizaje de la estación), modelo ({hist, reciente, relieve}), suelo, sat (resumenSatelite()) }
export function calcularConfianza({ ap, modelo, suelo, sat }) {
  const items = [];
  const agregar = (id, icono, nombre, valor, texto, mejora) => items.push({ id, icono, nombre, valor, estado: valor === null ? "info" : estadoDe(valor), texto, mejora });

  // 1. clima histórico
  agregar("historial", "🌦️", "Clima de 25 años de la NASA", modelo.hist ? 1 : 0,
    modelo.hist ? "Llegó el historial completo y las recomendaciones se simularon año por año." : "No llegó el historial de la NASA: se usó un promedio mensual, menos preciso.",
    "Volver a cargar la página cuando haya conexión.");

  // 2. cuántos días de la estación se pudieron comparar
  const d = ap?.dias ?? 0;
  agregar("estacion", "📡", "Días de la estación comparados", d >= 60 ? 1 : d >= 15 ? 0.65 : d > 0 ? 0.35 : 0,
    d >= 60 ? `Hay ${d} días medidos y comparados con la NASA: el ajuste local es firme.` : d > 0 ? `Solo hay ${d} días comparables con la NASA: el ajuste local pesa poco todavía.` : "Aún no hay días de la estación para comparar con la NASA.",
    "Dejar la estación midiendo más semanas.");

  // 3. temperatura: ¿estación y NASA se parecen?
  if (d > 0 && ap.sesgoTmed !== null && ap.sesgoTmed !== undefined) {
    const s = Math.abs(ap.sesgoTmed);
    agregar("temperatura", "🌡️", "Temperatura: estación frente a NASA", s <= 1 ? 1 : s <= 2.5 ? 0.65 : 0.35,
      `La estación y la NASA se separan en promedio ${f1(s)} °C${s <= 1 ? ": coinciden bien." : " : el modelo corrige esa diferencia, pero queda incertidumbre."}`,
      "Revisar la calibración del sensor de temperatura.");
  }

  // 4. lluvia: ¿pluviómetro y satélite cuentan lo mismo?
  if (d > 0 && ap.lluviaNasa >= 10) {
    const r = ap.razonLluvia;
    agregar("lluvia", "🌧️", "Lluvia: pluviómetro frente a NASA", r >= 0.75 && r <= 1.25 ? 1 : r >= 0.5 && r <= 1.5 ? 0.6 : 0.35,
      `El pluviómetro midió ${f2(r)} veces lo que estimó la NASA (${f1(ap.lluviaEst)} frente a ${f1(ap.lluviaNasa)} mm en los días comparados).`,
      "Esperar más días de lluvia para comparar con más datos.");
  } else if (d > 0) {
    agregar("lluvia", "🌧️", "Lluvia: pluviómetro frente a NASA", null, "Ha llovido muy poco en los días comparados: todavía no se puede juzgar el pluviómetro.", "");
  }

  // 5. satélites entre sí
  if (sat && sat.coinciden !== null) {
    const s = sat.separacion;
    agregar("satelites", "🛰️", "Los satélites entre sí", s <= 0.15 ? 1 : s <= 0.25 ? 0.6 : 0.35,
      `En los últimos dos meses, MODIS, Landsat y Sentinel-2 se separan ${f2(s)} de NDVI${s <= 0.15 ? ": cuentan una historia parecida." : ": ven el lote de forma distinta (cada uno promedia un píxel de otro tamaño)."}`,
      "Mirar la tendencia y no el número exacto.");
  }

  // 6. ¿la vegetación del satélite responde a la lluvia que usa el modelo?
  if (sat && modelo.reciente) {
    const clima = climaDesdeNasa(modelo.reciente);
    const c = sat.correlacionLluvia(clima.lluviaMes);
    if (c) {
      const poca = sat.mesesConDato < 10;
      const v = c.r >= 0.5 ? 1 : c.r >= 0.2 ? 0.65 : 0.35;
      agregar("verdor", "🌿", "Verdor del satélite frente a la lluvia", poca ? Math.min(v, 0.65) : v,
        `En ${c.meses} meses con dato, el verdor del satélite ${c.r >= 0.5 ? "sube claramente" : c.r >= 0.2 ? "sube algo" : c.r > -0.2 ? "casi no cambia" : "baja"} cuando llueve más${c.lag ? " (mes anterior)" : ""} (relación ${f2(c.r)}).${c.r < 0.2 ? " O sea, el verdor no sigue a la lluvia normal: puede haber riego o cultivos permanentes en el cuadro del satélite, o un desfase mayor de un mes." : ""}${poca ? " Es solo un año de satélite: tómalo como pista." : ""}`,
        "Guardar más meses de NDVI para ver varios años.");
    }
  }

  // 7. suelo y relieve
  agregar("suelo", "🧪", "Estudio de suelo", hayEstudio(suelo) ? 1 : 0.4,
    hayEstudio(suelo) ? "Hay resultados de laboratorio (pH, sales…): se usan para puntuar cada cultivo." : "No hay estudio de suelo: no se pudo considerar el pH ni las sales.",
    "Cargar un análisis de laboratorio en la pestaña Suelo.");
  if (modelo.relieve) {
    agregar("relieve", "⛰️", "Relieve del terreno", 1, `Se conoce la pendiente (${f1(modelo.relieve.pendiente)} %), y se tiene en cuenta en el riesgo de erosión.`, "");
  }

  const con = items.filter((i) => i.valor !== null);
  const promedio = con.length ? con.reduce((a, i) => a + i.valor, 0) / con.length : 0;
  const nivel = promedio >= 0.75 ? "alta" : promedio >= 0.5 ? "media" : "baja";
  const limitantes = con.filter((i) => i.valor < 0.7 && i.mejora).sort((a, b) => a.valor - b.valor).slice(0, 3);
  return { nivel, puntaje: Math.round(promedio * 100), items, limitantes };
}
