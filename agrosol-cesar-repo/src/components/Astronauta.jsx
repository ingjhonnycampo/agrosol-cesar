import { useEffect, useRef, useState } from "react";

const ESTRELLAS = 8;

// Estado de ánimo según lo que pasa en el cultivo (la lluvia manda sobre el calor y el calor sobre la sed)
export function animoDe(ambiente) {
  if (!ambiente) return "feliz";
  if (ambiente.lluvia) return "lluvia";
  if (ambiente.calor === "rojo" || ambiente.calor === "amarillo") return "calor";
  if (ambiente.riego === "rojo" || ambiente.riego === "amarillo") return "sed";
  return "feliz";
}

// Astronauta mascota: flota en el cielo, parpadea y saluda. Al tocarlo da una vuelta,
// suelta estrellitas y dice algo. Duerme de noche, y reacciona: paraguas con lluvia,
// sudando con calor, preocupado cuando hay que regar.
export default function Astronauta({ mensajes, dormido, animo = "feliz" }) {
  const [n, setN] = useState(0);        // cuántas veces lo han tocado
  const [frase, setFrase] = useState("");
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function tocar() {
    const siguiente = n + 1;
    setN(siguiente);
    setFrase(mensajes[(siguiente - 1) % mensajes.length]);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setFrase(""), 5000);
  }

  const triste = animo === "sed" || animo === "calor";

  return (
    <div className="astronauta-zona">
      <button type="button" className={"astronauta animo-" + animo + (dormido ? " dormido" : "")} onClick={tocar} aria-label="Toca al astronauta">
        <span className="astronauta-flota">
          <span key={n} className={"astronauta-giro" + (n ? " giro" : "")}>
            <svg viewBox="0 -26 100 150" width="100%" aria-hidden="true">
              <rect x="20" y="52" width="60" height="42" rx="11" fill="#b9c3d8" />
              <rect x="33" y="88" width="15" height="24" rx="7" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
              <rect x="52" y="88" width="15" height="24" rx="7" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
              <rect x="31" y="105" width="19" height="11" rx="5" fill="#e4572e" />
              <rect x="50" y="105" width="19" height="11" rx="5" fill="#e4572e" />
              <rect x="27" y="48" width="46" height="46" rx="19" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
              <rect x="39" y="65" width="22" height="13" rx="3" fill="#dfe6ef" />
              <circle cx="45" cy="71.5" r="2.6" fill="#e4572e" />
              <circle cx="55" cy="71.5" r="2.6" fill="#3fb86a" />
              <rect x="11" y="58" width="19" height="12" rx="6" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
              <g className="astro-brazo">
                <rect x="70" y="56" width="19" height="12" rx="6" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
                <circle cx="88" cy="62" r="5.5" fill="#e4572e" />
              </g>
              <circle cx="50" cy="34" r="27" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
              <ellipse className="visor" cx="50" cy="35" rx="20" ry="16" fill="#1b2a5c" />
              <ellipse cx="42" cy="28" rx="7" ry="3" fill="#fff" opacity=".45" transform="rotate(-25 42 28)" />
              <g className="astro-ojos">
                <circle cx="43.5" cy="37" r="2.6" fill="#ffe9a8" />
                <circle cx="56.5" cy="37" r="2.6" fill="#ffe9a8" />
              </g>
              {triste && (
                <g stroke="#ffe9a8" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M39 31 L47 33.5" /><path d="M61 31 L53 33.5" />
                </g>
              )}
              <path d={triste ? "M44 46.5 Q50 41.5 56 46.5" : animo === "lluvia" ? "M44 42 Q50 49 56 42" : "M44 43 Q50 48 56 43"}
                stroke="#ffe9a8" strokeWidth="2" fill="none" strokeLinecap="round" />
              <rect x="47" y="2" width="6" height="9" rx="3" fill="#cfd6e4" />
              <circle cx="50" cy="3" r="3.5" fill="#e4572e" />

              {animo === "lluvia" && (
                <g className="paraguas">
                  <path d="M8 -4 Q50 -42 92 -4 Q80 -12 69 -4 Q59 -12 50 -4 Q41 -12 31 -4 Q20 -12 8 -4Z" fill="#3d5af1" stroke="#2b3fb8" strokeWidth="1.5" />
                  <path d="M50 -4 L50 4" stroke="#2b3fb8" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              )}
              {animo === "calor" && (
                <g className="sudor" fill="#7cc4f2" stroke="#fff" strokeWidth="1">
                  <path d="M20 22 Q16 30 20 33 Q24 30 20 22Z" />
                  <path d="M80 28 Q76 36 80 39 Q84 36 80 28Z" />
                </g>
              )}
              {animo === "sed" && (
                <path className="gota-preocupada" d="M78 14 Q73 24 78 27 Q83 24 78 14Z" fill="#7cc4f2" stroke="#fff" strokeWidth="1" />
              )}
            </svg>
          </span>
        </span>
        {n > 0 && (
          <span key={"e" + n} className="chispas" aria-hidden="true">
            {Array.from({ length: ESTRELLAS }).map((_, i) => (
              <i key={i} style={{ "--a": (360 / ESTRELLAS) * i + "deg" }}>⭐</i>
            ))}
          </span>
        )}
        {dormido && <span className="zzz" aria-hidden="true">z<b>z</b><em>Z</em></span>}
      </button>
      {frase && <div className="burbuja" role="status" key={"b" + n}>{frase}</div>}
    </div>
  );
}
