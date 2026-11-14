import { useEffect, useState } from "react";
import { useIdioma } from "../i18n/IdiomaContext.jsx";

// Ventana con las fotos de una estación: flechas, teclado y cierre tocando fuera.
export default function Galeria({ estacion, onCerrar }) {
  const { t } = useIdioma();
  const fotos = estacion.fotos || [];
  const [i, setI] = useState(0);
  const mover = (d) => setI((x) => (x + d + fotos.length) % fotos.length);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onCerrar();
      else if (e.key === "ArrowRight") mover(1);
      else if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  if (!fotos.length) return null;
  const f = fotos[i];

  return (
    <div className="galeria" role="dialog" aria-modal="true" aria-label={t("gal.aria", { n: estacion.nombre })} onClick={onCerrar}>
      <div className="galeria-caja" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="galeria-cerrar" onClick={onCerrar} aria-label={t("gal.cerrar")}>✕</button>
        <img src={f.src} alt={f.titulo} />
        <div className="galeria-pie">
          {fotos.length > 1 && <button type="button" className="boton" onClick={() => mover(-1)} aria-label={t("gal.anterior")}>←</button>}
          <div className="galeria-texto">
            <strong>{f.titulo}</strong>
            <span>{estacion.nombre}{f.fecha ? " · " + f.fecha : ""}{fotos.length > 1 ? " · " + t("gal.de", { i: i + 1, n: fotos.length }) : ""}</span>
          </div>
          {fotos.length > 1 && <button type="button" className="boton" onClick={() => mover(1)} aria-label={t("gal.siguiente")}>→</button>}
        </div>
      </div>
    </div>
  );
}
