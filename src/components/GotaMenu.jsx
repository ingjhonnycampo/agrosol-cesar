import { useEffect, useRef, useState } from "react";

// Menú de apartados dentro de una gota de agua que queda fija en la esquina (baja con la pantalla).
// Al tocar la gota se despliegan las opciones; la gota muestra el icono del apartado en el que se está.
export default function GotaMenu({ vistas, vista, onElegir, nombre }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const actual = vistas.find((v) => v.id === vista) || vistas[0];

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    const tecla = (e) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("pointerdown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);

  const elegir = (id) => { onElegir(id); setAbierto(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="gota-fija" ref={caja}>
      {abierto && (
        <div className="gota-panel" role="menu" aria-label="Apartados">
          <p className="gota-titulo">💧 ¿A dónde quieres ir?</p>
          <div className="gota-opciones">
            {vistas.map((v) => (
              <button key={v.id} type="button" role="menuitem" className={"gota-op" + (vista === v.id ? " on" : "")} onClick={() => elegir(v.id)}>
                <span aria-hidden="true">{v.icono}</span> {nombre(v.id)}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className={"gota" + (abierto ? " abierta" : "")} onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-haspopup="menu"
        aria-label={`Menú de apartados. Estás en ${nombre(actual.id)}`} title="Menú de apartados">
        <svg viewBox="0 0 64 80" aria-hidden="true">
          <defs>
            <linearGradient id="gota-agua" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7fd3ff" /><stop offset="1" stopColor="#1b78c2" />
            </linearGradient>
          </defs>
          <path d="M32 3C32 3 6 33 6 52a26 26 0 0 0 52 0C58 33 32 3 32 3Z" fill="url(#gota-agua)" stroke="#fff" strokeWidth="3" />
          <path d="M18 50c0-8 5-15 9-20" stroke="#fff" strokeOpacity=".75" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
        <span className="gota-icono" aria-hidden="true">{abierto ? "✕" : actual.icono}</span>
      </button>
    </div>
  );
}
