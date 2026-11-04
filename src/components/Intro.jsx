import { useEffect, useRef, useState } from "react";

const REVISION = ["Sensores de suelo", "Pluviómetro", "Anemómetro", "Fotocelda y hoja", "Enlace con la NASA"];
const ESTRELLAS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 53) % 100, y: (i * 37) % 88, s: 1 + (i % 3), d: (i % 9) * 0.35,
}));
const ESPERA_MAX = 12000; // si los datos tardan demasiado, despega igual

// Pantalla de bienvenida: cuenta regresiva 5-4-3-2-1, ignición y despegue de un cohete.
// Se queda al menos ~6 s y no despega hasta que los datos de la estación estén listos.
// Tocar el cohete lo sacude; "Saltar" la cierra; el botón de sonido activa los pitidos.
export default function Intro({ listo, onTerminar }) {
  const [n, setN] = useState(5);                 // 5..1 cuenta, 0 = ignición
  const [fase, setFase] = useState("cuenta");    // cuenta | ignicion | despegue
  const [ignicionLista, setIgnicionLista] = useState(false);
  const [esperaAgotada, setEsperaAgotada] = useState(false);
  const [sale, setSale] = useState(false);
  const [sacudir, setSacudir] = useState(0);
  const [sonido, setSonido] = useState(false);
  const audio = useRef(null);

  // el cuerpo de la página no se desplaza mientras dura la intro
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = antes; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEsperaAgotada(true), ESPERA_MAX);
    return () => clearTimeout(t);
  }, []);

  // la cuenta: un número por segundo
  useEffect(() => {
    if (fase !== "cuenta") return;
    const t = setTimeout(() => {
      if (n > 1) setN(n - 1);
      else { setN(0); setFase("ignicion"); }
    }, 1000);
    return () => clearTimeout(t);
  }, [n, fase]);

  // ignición: 1,4 s de fuego y temblor
  useEffect(() => {
    if (fase !== "ignicion") return;
    const t = setTimeout(() => setIgnicionLista(true), 1400);
    return () => clearTimeout(t);
  }, [fase]);

  // despegue: cuando terminó la ignición y los datos están listos
  useEffect(() => {
    if (fase === "ignicion" && ignicionLista && (listo || esperaAgotada)) setFase("despegue");
  }, [fase, ignicionLista, listo, esperaAgotada]);

  useEffect(() => {
    if (fase !== "despegue") return;
    const a = setTimeout(() => setSale(true), 1300);
    const b = setTimeout(() => onTerminar(), 2200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [fase, onTerminar]);

  // sonido (solo si la persona lo activa: los navegadores no dejan sonar solos)
  function pitar(freq, dur, tipo = "sine", vol = 0.12) {
    const c = audio.current;
    if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function rugido() {
    const c = audio.current;
    if (!c) return;
    const largo = c.sampleRate * 2.2;
    const buf = c.createBuffer(1, largo, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) d[i] = Math.random() * 2 - 1;
    const fuente = c.createBufferSource(); fuente.buffer = buf;
    const filtro = c.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 500;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, c.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.2);
    fuente.connect(filtro); filtro.connect(g); g.connect(c.destination); fuente.start();
  }
  useEffect(() => {
    if (!sonido) return;
    if (fase === "cuenta") pitar(n === 1 ? 660 : 440, 0.18, "square", 0.06);
    if (fase === "ignicion") { pitar(880, 0.5, "sawtooth", 0.08); rugido(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, fase, sonido]);

  function alternarSonido(e) {
    e.stopPropagation();
    try {
      if (!audio.current) audio.current = new (window.AudioContext || window.webkitAudioContext)();
      audio.current.resume?.();
      setSonido((s) => !s);
    } catch { /* sin audio, la intro sigue igual */ }
  }

  const revisados = fase === "cuenta" ? 5 - n : 5;
  const despega = fase === "despegue";
  const fuego = fase === "ignicion" || despega;

  return (
    <div className={"intro" + (sale ? " intro-sale" : "") + (fase === "ignicion" ? " intro-tiembla" : "")} role="dialog" aria-label="Cuenta regresiva de despegue">
      {fase === "ignicion" && <div className="intro-flash" key="flash" />}
      <div className="intro-estrellas" aria-hidden="true">
        {ESTRELLAS.map((e, i) => (
          <i key={i} style={{ left: e.x + "%", top: e.y + "%", width: e.s + "px", height: e.s + "px", animationDelay: e.d + "s" }} />
        ))}
      </div>

      <div className="intro-barra">
        <span>🌱 AgroSol Cesar · Galactic Devs</span>
        <span className="intro-botones">
          <button type="button" onClick={alternarSonido} aria-pressed={sonido}>{sonido ? "🔊" : "🔇"} Sonido</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onTerminar({ feria: true }); }}>📺 Modo feria</button>
          <button type="button" onClick={() => onTerminar()}>Saltar ▸</button>
        </span>
      </div>

      <div className="intro-centro">
        {fase === "cuenta" && (
          <div className={"intro-cuenta n" + n} key={n}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className="anillo-fondo" cx="60" cy="60" r="54" />
              <circle className="anillo" cx="60" cy="60" r="54" />
            </svg>
            <b>{n}</b>
          </div>
        )}
        {fase === "ignicion" && <div className="intro-ignicion">¡IGNICIÓN!</div>}
        {despega && <div className="intro-ignicion intro-adios">¡DESPEGUE! 🚀</div>}
        <p className="intro-estado">
          {fase === "cuenta" && (n > 1 ? "Revisando los sistemas de la estación…" : "Todo listo. Encendiendo motores…")}
          {fase === "ignicion" && (listo || esperaAgotada || !ignicionLista ? "Motores encendidos" : "Esperando los datos de la estación…")}
          {despega && "¡Rumbo a la huerta!"}
        </p>
        <ul className="intro-lista">
          {REVISION.map((r, i) => <li key={r} className={i < revisados ? "ok" : ""}>{i < revisados ? "✓" : "·"} {r}</li>)}
        </ul>
      </div>

      <div className="intro-suelo" aria-hidden="true">
        <svg viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0 40 C80 10 140 60 220 36 S350 10 400 34 V100 H0Z" fill="#1d5a30" />
          <path d="M0 62 C100 40 180 80 260 60 S360 48 400 60 V100 H0Z" fill="#14401f" />
        </svg>
      </div>

      <button type="button" className={"intro-cohete" + (despega ? " vuela" : "") + (fuego ? " fuego" : "") + (sacudir ? " sacude" : "")}
        key={"c" + sacudir} onClick={(e) => { e.stopPropagation(); setSacudir((s) => s + 1); if (sonido) pitar(1200, 0.12, "triangle", 0.08); }}
        aria-label="Toca el cohete">
        <svg viewBox="0 0 100 190" aria-hidden="true">
          <g className="llama">
            <path d="M36 128 Q50 196 64 128 Z" fill="#ff7a1a" />
            <path d="M42 128 Q50 176 58 128 Z" fill="#ffd23c" />
            <path d="M46 128 Q50 156 54 128 Z" fill="#fff6c9" />
          </g>
          <path d="M28 108 L8 138 L8 156 L36 130 Z" fill="#e4572e" />
          <path d="M72 108 L92 138 L92 156 L64 130 Z" fill="#e4572e" />
          <path d="M50 4 C76 30 78 80 72 128 L28 128 C22 80 24 30 50 4 Z" fill="#f4f7fb" stroke="#cfd6e4" strokeWidth="2" />
          <path d="M50 4 C62 16 70 30 73 46 L27 46 C30 30 38 16 50 4 Z" fill="#e4572e" />
          <circle cx="50" cy="74" r="12" fill="#2b5cff" stroke="#cfd6e4" strokeWidth="4" />
          <ellipse cx="46" cy="70" rx="4" ry="2.5" fill="#fff" opacity=".6" />
          <rect x="28" y="108" width="44" height="6" fill="#cfd6e4" />
          <rect x="38" y="128" width="24" height="8" rx="2" fill="#8a96a8" />
        </svg>
        {fuego && (
          <span className="humo" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ "--dx": (i - 4) * 14 + "px", animationDelay: i * 0.08 + "s" }} />)}
          </span>
        )}
      </button>
      {fase === "cuenta" && n > 0 && <p className="intro-pista">Toca el cohete 👆</p>}
    </div>
  );
}
