import { useEffect, useRef, useState } from "react";

const REVISION = ["Sensores de suelo", "Pluviómetro", "Anemómetro", "Fotocelda y hoja", "Enlace con la NASA"];
const ESTRELLAS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 53) % 100, y: (i * 37) % 88, s: 1 + (i % 3), d: (i % 9) * 0.35,
}));
const ESPERA_MAX = 12000; // si los datos tardan demasiado, despega igual

// Pantalla de bienvenida: cuenta regresiva 5-4-3-2-1, ignición y despegue de un cohete, con sonido.
// Los navegadores no dejan sonar a una página recién abierta hasta que la persona toca algo:
// si el sonido está bloqueado, aparece "Toca para despegar" y con ese toque suena todo.
// No despega hasta que los datos de la estación estén listos. Tocar el cohete lo sacude.
export default function Intro({ listo, onTerminar }) {
  const [n, setN] = useState(5);                  // 5..1 cuenta, 0 = ignición
  const [fase, setFase] = useState("preparando"); // preparando | espera | cuenta | ignicion | despegue
  const [ignicionLista, setIgnicionLista] = useState(false);
  const [esperaAgotada, setEsperaAgotada] = useState(false);
  const [sale, setSale] = useState(false);
  const [sacudir, setSacudir] = useState(0);
  const [sonido, setSonido] = useState(true);
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

  // audio: si el navegador lo permite, la cuenta arranca sola; si no, pide un toque
  useEffect(() => {
    let ctx = null;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume?.();
    } catch { ctx = null; }
    audio.current = ctx;
    const t = setTimeout(() => setFase(!ctx || ctx.state === "running" ? "cuenta" : "espera"), 250);
    return () => { clearTimeout(t); try { ctx?.close(); } catch { /* ya cerrado */ } };
  }, []);

  function empezar() {
    const c = audio.current;
    try { c?.resume?.(); } catch { /* sin audio, igual despega */ }
    setFase("cuenta");
  }

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

  // ---------- sonido ----------
  const suena = () => sonido && audio.current && audio.current.state === "running";

  function pitar(freq, dur, tipo = "sine", vol = 0.12) {
    if (!suena()) return;
    const c = audio.current;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = tipo; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }

  // Motor de cohete: rugido de ruido filtrado que sube y baja, retumbo grave y chisporroteo
  function sonidoCohete() {
    if (!suena()) return;
    const c = audio.current; const t0 = c.currentTime; const D = 5;
    const ruido = (seg) => {
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * seg), c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const f = c.createBufferSource(); f.buffer = buf; return f;
    };
    const maestro = c.createGain(); maestro.gain.value = 0.9; maestro.connect(c.destination);

    // rugido principal
    const roar = ruido(D); const lp = c.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(250, t0);
    lp.frequency.linearRampToValueAtTime(900, t0 + 1.4);
    lp.frequency.linearRampToValueAtTime(2800, t0 + 3);
    lp.frequency.linearRampToValueAtTime(500, t0 + D);
    const gr = c.createGain();
    gr.gain.setValueAtTime(0.0001, t0);
    gr.gain.exponentialRampToValueAtTime(0.5, t0 + 0.7);
    gr.gain.setValueAtTime(0.55, t0 + 3);
    gr.gain.exponentialRampToValueAtTime(0.001, t0 + D);
    roar.connect(lp); lp.connect(gr); gr.connect(maestro); roar.start(t0);

    // retumbo grave
    const o = c.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(38, t0); o.frequency.linearRampToValueAtTime(70, t0 + 3);
    const lpo = c.createBiquadFilter(); lpo.type = "lowpass"; lpo.frequency.value = 140;
    const go = c.createGain();
    go.gain.setValueAtTime(0.0001, t0);
    go.gain.exponentialRampToValueAtTime(0.45, t0 + 1);
    go.gain.exponentialRampToValueAtTime(0.001, t0 + D);
    o.connect(lpo); lpo.connect(go); go.connect(maestro); o.start(t0); o.stop(t0 + D);

    // chisporroteo de la llama
    const chis = ruido(D); const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3500;
    const gc = c.createGain(); gc.gain.setValueAtTime(0, t0);
    for (let k = 0; k < 70; k++) {
      const t = t0 + 0.2 + Math.random() * (D - 1);
      gc.gain.setValueAtTime(Math.random() * 0.22, t);
      gc.gain.setValueAtTime(0, t + 0.02 + Math.random() * 0.03);
    }
    chis.connect(hp); hp.connect(gc); gc.connect(maestro); chis.start(t0);
  }

  useEffect(() => {
    if (fase === "cuenta") pitar(n === 1 ? 700 : 440, 0.2, "square", 0.05);
    if (fase === "ignicion") { pitar(1000, 0.25, "square", 0.06); sonidoCohete(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, fase]);

  const revisados = fase === "cuenta" ? 5 - n : fase === "ignicion" || fase === "despegue" ? 5 : 0;
  const despega = fase === "despegue";
  const fuego = fase === "ignicion" || despega;
  const cuentaActiva = fase === "cuenta" || fuego;

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
          <button type="button" onClick={() => setSonido((s) => !s)} aria-pressed={sonido}>{sonido ? "🔊 Sonido" : "🔇 Silencio"}</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onTerminar({ feria: true }); }}>📺 Modo feria</button>
          <button type="button" onClick={() => onTerminar()}>Saltar ▸</button>
        </span>
      </div>

      <div className="intro-centro">
        {fase === "espera" && (
          <button type="button" className="intro-iniciar" onClick={empezar}>
            <span>🚀</span><b>Toca para despegar</b><small>con sonido 🔊</small>
          </button>
        )}
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
          {fase === "espera" && "Cuando estés listo, toca el botón"}
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
        key={"c" + sacudir} onClick={(e) => { e.stopPropagation(); setSacudir((s) => s + 1); pitar(1200, 0.12, "triangle", 0.08); }}
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
      {cuentaActiva && fase === "cuenta" && <p className="intro-pista">Toca el cohete 👆</p>}
    </div>
  );
}
