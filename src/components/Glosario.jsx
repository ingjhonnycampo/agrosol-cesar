import { useState } from "react";
import { coma } from "../lib/num.js";

const TERMINOS = [
  { id: "et", icono: "🌬️💧", nombre: "Evapotranspiración", simple: "El agua que el suelo y las plantas devuelven al aire: una parte se evapora del suelo y otra sale por las hojas.",
    clave: "Es el gasto real de agua de un cultivo. Si la lluvia es menor que la evapotranspiración, hay déficit y la planta sufre.",
    agrosol: "No medimos evapotranspiración en el lote. El modelo usa el agua que necesita cada cultivo en su ciclo (valores de referencia tipo FAO) y la compara con la lluvia. La NASA la mide con ECOSTRESS y la ofrece OpenET (solo EE. UU.)." },
  { id: "ndvi", icono: "🌿🛰️", nombre: "NDVI (índice de vegetación)", simple: "Un número de −1 a 1 que dice qué tan verde y vigorosa se ve la vegetación desde el satélite.",
    clave: "Cerca de 0,6 a 0,9 = plantas sanas y densas; cerca de 0,1 = suelo desnudo o seco; negativo = agua o nubes.",
    agrosol: "Se ve como capa en la pestaña Reto (MODIS, cada 8 días). Sirve para detectar épocas de suelo desnudo y de estrés del cultivo; todavía no lo convertimos en cifra por lote." },
  { id: "anomalia", icono: "📉💧", nombre: "Anomalía de humedad del suelo", simple: "Cuánto más seco o más húmedo está el suelo hoy comparado con lo normal para esta época.",
    clave: "Una anomalía negativa mantenida avisa de sequía antes de que se vea en la planta.",
    agrosol: "Comparamos la humedad del suelo de la estación con la de la NASA (GWETTOP y GWETROOT) y con SMAP. La estación da el valor del lote; el satélite, lo normal de la región." },
  { id: "balance", icono: "⚖️🌧️", nombre: "Balance hídrico", simple: "La cuenta del agua: lo que entra (lluvia y riego) menos lo que sale (evaporación, plantas, escurrimiento).",
    clave: "Si sobra, el suelo guarda reserva; si falta, hay que regar o esperar. Se hace por meses y por ciclo de cultivo.",
    agrosol: "El calendario de siembra y las estrategias hacen este balance cada mes: lluvia útil de la NASA frente a la necesidad de cada cultivo, y de ahí sale cuánto riego haría falta en un año seco." },
  { id: "heladas", icono: "❄️🌱", nombre: "Riesgo de heladas", simple: "La probabilidad de que la temperatura baje a 0 °C o menos y queme los cultivos.",
    clave: "Importa en zonas frías o de montaña, no en el Caribe cálido.",
    agrosol: "No aplica a Bosconia: aquí la mínima del aire rara vez baja de 22 °C. Lo que preocupa en este lugar es el calor fuerte (más de 37 °C) y las rachas sin lluvia." },
  { id: "nitrogeno", icono: "🫘➕", nombre: "Fijación de nitrógeno", simple: "Las leguminosas (fríjol, mucuna, canavalia) toman nitrógeno del aire con ayuda de bacterias de sus raíces y lo dejan en el suelo.",
    clave: "El cultivo que sigue aprovecha ese nitrógeno: en un ensayo con maíz equivalió a unos 60 kg de N por hectárea.",
    agrosol: "Por eso el modelo premia sembrar una leguminosa después de un cereal o de un cultivo que gasta mucho nitrógeno." },
  { id: "cobertura", icono: "🌿🟫", nombre: "Cultivo de cobertura y abono verde", simple: "Una planta que se siembra para tapar el suelo, no para vender la cosecha; luego se corta o se entierra.",
    clave: "Frena la erosión, conserva la humedad, apaga las malezas y aporta materia orgánica.",
    agrosol: "La estrategia “Suelo vivo” usa canavalia y mucuna para no dejar el suelo desnudo, sobre todo en los meses de lluvia fuerte." },
  { id: "rotacion", icono: "🔄🌽", nombre: "Rotación de cultivos", simple: "Sembrar cultivos distintos, uno después de otro, en el mismo lote.",
    clave: "Cortar el ciclo de plagas y enfermedades, repartir el uso de nutrientes y mantener el suelo tapado. Se evita repetir plantas de la misma familia seguidas.",
    agrosol: "Todo el comparador de estrategias gira en torno a esto: cada plan de 12 meses se arma alternando familias." },
  { id: "desnudo", icono: "🟫⛈️", nombre: "Suelo desnudo", simple: "Los meses en que el lote no tiene ningún cultivo ni cobertura.",
    clave: "Con lluvia fuerte el agua arrastra la tierra (erosión) y se pierden nutrientes; en época seca el suelo se calienta y se endurece.",
    agrosol: "El calendario de cada estrategia marca los meses desnudos 🟫 y los que además caen en lluvia fuerte ⛈️ (100 mm o más)." },
  { id: "racha", icono: "☀️📆", nombre: "Racha seca", simple: "Días seguidos sin lluvia útil (menos de 1 mm al día).",
    clave: "Un cultivo aguanta cierto número de días sin agua. Si la racha es más larga, se estresa aunque el total del año sea bueno.",
    agrosol: "Con los 25 años de la NASA calculamos la racha seca típica de cada mes y la comparamos con lo que aguanta el suelo del lote (se mide con los sensores de humedad)." },
  { id: "prob", icono: "🎲📊", nombre: "“Agua suficiente en X % de los años”", simple: "El modelo repite cada año del pasado (2001 a 2025) como si se sembrara hoy y cuenta en cuántos habría alcanzado el agua.",
    clave: "No es una predicción del clima: es la frecuencia histórica. Un 40 % significa que en 4 de cada 10 años salió bien.",
    agrosol: "Es la base del puntaje de “Seguridad” de cada estrategia." },
];

// Explicaciones del reto: términos, satélite frente a medición en tierra, e incertidumbre.
export default function Glosario({ ap }) {
  const [abierto, setAbierto] = useState(null);
  return (
    <div>
      <div className="nasa-intro">
        <b>📖 ¿Qué significa?</b> Las ideas que usa el reto de la NASA, explicadas en palabras sencillas y con lo que hace AgroSol con cada una. Toca una tarjeta para ver más.
      </div>

      <div className="glosario">
        {TERMINOS.map((t) => (
          <button key={t.id} type="button" className={"glo-card" + (abierto === t.id ? " abierta" : "")} onClick={() => setAbierto(abierto === t.id ? null : t.id)} aria-expanded={abierto === t.id}>
            <span className="glo-icono" aria-hidden="true">{t.icono}</span>
            <b>{t.nombre}</b>
            <span className="glo-simple">{t.simple}</span>
            <span className="glo-mas">
              <span><b>Para entenderlo:</b> {t.clave}</span>
              <span className="glo-agrosol"><b>En AgroSol:</b> {t.agrosol}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="titulo-seccion"><h2>Satélite o medición en tierra</h2><p>Por qué usamos las dos</p></div>
      <div className="tabla-caja">
        <table className="tabla glo-tabla">
          <thead><tr><th></th><th>🛰️ Satélite (NASA)</th><th>📡 Estación en tierra (AgroSol)</th></tr></thead>
          <tbody>
            <tr><th>Qué ve</th><td>Una celda grande (de 50 km en NASA POWER; de 9 a 36 km en SMAP).</td><td>Un punto: el lote del colegio.</td></tr>
            <tr><th>Cobertura</th><td>Todo el planeta, hacia atrás 25 años o más.</td><td>Solo donde está instalada y desde que se encendió.</td></tr>
            <tr><th>Frecuencia</th><td>Diaria o cada pocos días, con unos días de retraso.</td><td>Cada 10 minutos, en tiempo casi real.</td></tr>
            <tr><th>Suelo</th><td>Humedad de la capa superficial, modelada o estimada.</td><td>Humedad real a 10 y a 30 cm, justo donde están las raíces.</td></tr>
            <tr><th>Fortaleza</th><td>Contexto regional, historia larga y lugares sin sensores.</td><td>El detalle local que el satélite promedia: calor del patio, lluvia que cae solo ahí.</td></tr>
            <tr><th>Límite</th><td>No distingue un lote del vecino ni mide el suelo profundo con precisión.</td><td>Un solo punto y poco tiempo de datos; un sensor puede dañarse.</td></tr>
          </tbody>
        </table>
      </div>
      <p className="calsiembra-detalle">
        <b>Por qué se combinan:</b> el satélite dice cómo es el clima de la región y qué es “normal”; la estación dice qué pasa de verdad en el lote. Con los dos se corrige uno con el otro.
        {ap && ap.dias > 0
          ? <> <b>Con tus datos:</b> la estación marca {ap.sesgoTmed >= 0 ? "+" : ""}{coma(ap.sesgoTmed)} °C frente a la NASA y su pluviómetro registra ×{coma(ap.razonLluvia, 2)} la lluvia que dice el satélite en los {ap.dias} días comparados. Ese ajuste entra al modelo con más peso cuantos más días haya.</>
          : <> Cuando la estación acumule días, el modelo compara sus medidas con la NASA y corrige el clima de la región con lo que pasa en el lote.</>}
      </p>

      <div className="titulo-seccion"><h2>Incertidumbre y criterio local</h2><p>Lo que el modelo no puede saber</p></div>
      <div className="glo-incert">
        <div>
          <h3>❓ De dónde viene la duda</h3>
          <ul>
            <li><b>Pocos días de estación:</b> el ajuste local pesa poco al principio (confianza {ap?.confianza || "baja"}).</li>
            <li><b>Datos de cultivos de referencia:</b> los rangos de agua, temperatura y pH son generales, no medidos en Bosconia.</li>
            <li><b>Lluvia del satélite:</b> puede subestimar la lluvia local; el pluviómetro la irá corrigiendo.</li>
            <li><b>Mercado:</b> el valor de cada cultivo es una estimación, no precios reales.</li>
            <li><b>Sin estudio de suelo</b> (si no se cargó): no se conoce el pH, las sales ni la textura del lote.</li>
            <li><b>Lo que no medimos:</b> plagas locales, malezas, estado real del lote y evapotranspiración.</li>
          </ul>
        </div>
        <div>
          <h3>🧑‍🌾 Dónde manda el criterio del agricultor</h3>
          <ul>
            <li>La <b>fecha real de siembra</b>, según cómo estén las primeras lluvias.</li>
            <li>Lo que ya se probó y funcionó <b>en ese lote</b>.</li>
            <li>La <b>mano de obra, la maquinaria y las semillas</b> disponibles.</li>
            <li>El <b>mercado y los compradores</b> reales de la zona.</li>
            <li>Un <b>agrónomo o la UMATA</b> para revisar el plan antes de decidir.</li>
          </ul>
        </div>
      </div>
      <p className="vacio">AgroSol apoya la decisión: <b>no reemplaza</b> la experiencia del agricultor.</p>
    </div>
  );
}
