import { useEffect } from "react";
import { IDIOMAS } from "../i18n/idiomas.js";
import { bloquearScroll } from "../lib/bloqueoScroll.js";
import { useIdioma } from "../i18n/IdiomaContext.jsx";

const ESTRELLAS = Array.from({ length: 50 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 37) % 100, s: 1 + (i % 3), d: (i % 9) * 0.35 }));

// Banderas dibujadas (Windows no muestra las banderas emoji)
function Bandera({ id }) {
  return (
    <svg className="idioma-bandera" viewBox="0 0 60 40" width="60" height="40" aria-hidden="true">
      <defs><clipPath id={"c-" + id}><rect width="60" height="40" rx="6" /></clipPath></defs>
      <g clipPath={"url(#c-" + id + ")"}>
        {id === "es" && <><rect width="60" height="20" fill="#fcd116" /><rect y="20" width="60" height="10" fill="#003893" /><rect y="30" width="60" height="10" fill="#ce1126" /></>}
        {id === "en" && <>
          <rect width="60" height="40" fill="#fff" />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} y="0" width="60" height={40 / 13} fill="#b22234" transform={`translate(0 ${k * 2 * 40 / 13})`} />)}
          <rect width="26" height={40 * 7 / 13} fill="#3c3b6e" />
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <circle key={r + "-" + c} cx={4 + c * 6} cy={4 + r * 6} r="1.4" fill="#fff" />))}
        </>}
        {id === "pt" && <><rect width="60" height="40" fill="#009c3b" /><path d="M30 5 55 20 30 35 5 20Z" fill="#ffdf00" /><circle cx="30" cy="20" r="8" fill="#002776" /><path d="M22.5 18.5c5-1.5 10.5-.5 15 3" stroke="#fff" strokeWidth="1.6" fill="none" /></>}
      </g>
      <rect width="60" height="40" rx="6" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
    </svg>
  );
}

// Pantalla que aparece después del cohete para elegir el idioma de la página.
export default function SelectorIdioma({ onElegir, onCerrar }) {
  const { lang, setLang, t } = useIdioma();

  useEffect(() => {
    const liberar = bloquearScroll();
    const tecla = (e) => { if (e.key === "Escape" && onCerrar) onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => { liberar(); window.removeEventListener("keydown", tecla); };
  }, [onCerrar]);

  return (
    <div className="idioma-pantalla" role="dialog" aria-modal="true" aria-label="Idioma · Language · Idioma">
      <div className="intro-estrellas" aria-hidden="true">
        {ESTRELLAS.map((e, i) => <i key={i} style={{ left: e.x + "%", top: e.y + "%", width: e.s + "px", height: e.s + "px", animationDelay: e.d + "s" }} />)}
      </div>
      <div className="idioma-caja">
        <span className="idioma-globo" aria-hidden="true">🌍</span>
        <h2>Elige tu idioma</h2>
        <p className="idioma-trio">Choose your language · Escolha seu idioma</p>
        <div className="idioma-botones">
          {IDIOMAS.map((i) => (
            <button key={i.id} type="button" className={"idioma-boton" + (i.id === lang ? " actual" : "")}
              onClick={() => { setLang(i.id); onElegir(i.id); }} lang={i.id}>
              <Bandera id={i.id} />
              <b>{i.nombre}</b>
              <small>{i.saludo}</small>
            </button>
          ))}
        </div>
        {onCerrar && <button type="button" className="idioma-cerrar" onClick={onCerrar}>✕ {t("gal.cerrar")}</button>}
      </div>
    </div>
  );
}
