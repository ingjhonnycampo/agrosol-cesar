import Astronauta, { animoDe } from "./Astronauta.jsx";

const SALUDO = {
  dia: "¡Buen día desde la órbita! 🚀 Toca otra vez y te cuento más.",
  tarde: "¡Mira qué atardecer! 🌅 Toca otra vez para más datos.",
  noche: "Shhh… la huerta duerme 🌙 Toca otra vez y te cuento algo.",
};

const FRASE_ANIMO = {
  lluvia: "¡Está lloviendo! ☔ Saqué mi paraguas espacial.",
  calor: "¡Uf, qué calor! 🥵 Hasta mi traje espacial suda.",
  sed: "El suelo tiene sed… 💧 ¡Hay que regar!",
};

// Hora de Colombia como número decimal (por ejemplo 14,5 = 2:30 p. m.)
function horaColombia() {
  const d = new Date(Date.now() - 5 * 3600000);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

// Encabezado con un cielo que cambia según la luz que mide la fotocelda.
// El sol (de día) y la luna (de noche) recorren el cielo siguiendo la hora real.
// Si el pluviómetro acaba de registrar agua, llueve. `ambiente` hace reaccionar al astronauta.
export default function Cielo({ luz, mensajes = [], ambiente, children }) {
  let fase = "noche";
  if (luz !== null && luz !== undefined) {
    if (luz >= 60) fase = "dia";
    else if (luz >= 8) fase = "tarde";
  }

  const h = horaColombia();
  const esDia = h >= 6 && h < 18;
  const p = esDia ? (h - 6) / 12 : ((h + 6) % 24) / 12; // 0 al salir, 1 al ponerse
  const astro = { left: 6 + 88 * p + "%", top: 118 - 92 * Math.sin(Math.PI * p) };

  const animo = animoDe(ambiente);
  const lluvia = !!ambiente?.lluvia;
  const primeras = [SALUDO[fase]];
  if (FRASE_ANIMO[animo]) primeras.unshift(FRASE_ANIMO[animo]);

  return (
    <header className={"cielo cielo-" + fase + (lluvia ? " cielo-lluvia" : "")}>
      <div className="astro" style={astro} aria-hidden="true" />
      {fase !== "noche" && (
        <div className="nubes" aria-hidden="true">
          <span style={{ top: "12%", animationDuration: "70s", animationDelay: "-10s" }} />
          <span style={{ top: "38%", animationDuration: "95s", animationDelay: "-60s", transform: "scale(.7)" }} />
          <span style={{ top: "22%", animationDuration: "120s", animationDelay: "-35s", transform: "scale(1.2)" }} />
        </div>
      )}
      {fase === "noche" && (
        <div className="estrellas" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ left: (i * 37) % 100 + "%", top: (i * 53) % 70 + "%", animationDelay: (i % 7) * 0.4 + "s" }} />
          ))}
        </div>
      )}
      {lluvia && (
        <div className="lluvia" aria-hidden="true">
          {Array.from({ length: 46 }).map((_, i) => (
            <i key={i} style={{ left: (i * 37) % 100 + "%", animationDelay: -((i * 7) % 10) * 0.12 + "s", animationDuration: 0.6 + (i % 5) * 0.1 + "s" }} />
          ))}
        </div>
      )}
      <Astronauta mensajes={[...primeras, ...mensajes]} dormido={fase === "noche" && animo === "feliz"} animo={animo} />
      <svg className="colinas" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 C200 30 350 110 600 70 S1000 30 1200 75 V120 H0Z" fill="var(--colina1)" />
        <path d="M0 100 C250 70 450 120 700 95 S1050 80 1200 100 V120 H0Z" fill="var(--colina2)" />
      </svg>
      <div className="cielo-contenido">{children}</div>
    </header>
  );
}
