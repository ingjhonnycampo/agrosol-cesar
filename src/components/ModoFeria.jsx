import { useEffect, useState } from "react";
import Semaforo from "./Semaforo.jsx";
import Medidores from "./Medidores.jsx";
import Mapa from "./Mapa.jsx";
import { ComparacionesMes } from "./Nasa.jsx";
import { COLORES_NIVEL } from "../lib/semaforo.js";
import { useIdioma } from "../i18n/IdiomaContext.jsx";

const SEGUNDOS = 12;
const TOTAL = 6;

// Pantalla completa que cambia sola cada 12 segundos, para dejarla corriendo en la feria.
// Tocar la pantalla pasa a la siguiente; la ✕ o Esc la cierran.
export default function ModoFeria({ datos, estacion, resumen, todas, onSalir }) {
  const { t } = useIdioma();
  const [i, setI] = useState(0);
  const [nasa, setNasa] = useState(null);
  const u = datos.ultimo;

  useEffect(() => {
    const id = setTimeout(() => setI((x) => (x + 1) % TOTAL), SEGUNDOS * 1000);
    return () => clearTimeout(id); // al cambiar de diapositiva (sola o a mano) el reloj vuelve a empezar
  }, [i]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onSalir();
      else if (e.key === "ArrowRight") setI((x) => (x + 1) % TOTAL);
      else if (e.key === "ArrowLeft") setI((x) => (x - 1 + TOTAL) % TOTAL);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onSalir]);

  useEffect(() => {
    let vivo = true;
    fetch("/api/nasa?estacion=" + encodeURIComponent(estacion.id))
      .then((r) => r.json())
      .then((j) => vivo && !j.error && setNasa(j))
      .catch(() => {});
    return () => { vivo = false; };
  }, [estacion.id]);

  const color = COLORES_NIVEL[resumen?.nivel] || COLORES_NIVEL.gris;

  return (
    <div className="feria" onClick={() => setI((x) => (x + 1) % TOTAL)}>
      <button type="button" className="feria-salir" onClick={(e) => { e.stopPropagation(); onSalir(); }} aria-label={t("feria.salir")}>✕</button>
      <p className="feria-marca">{t("feria.marca", { lugar: estacion.lugar })}</p>
      <h2 className="feria-titulo">{t("feria.t" + i)}</h2>

      <div className="feria-cuerpo" key={i}>
        {i === 0 && resumen && (
          <div className="feria-resumen" style={{ "--c": color }}>
            <span className="feria-carita">{resumen.carita}</span>
            <strong className="feria-puntos">{resumen.puntos ?? "—"}<small>/100</small></strong>
            <span className="resumen-etiqueta">{resumen.etiqueta}</span>
            <p>{resumen.frase}</p>
          </div>
        )}
        {i === 1 && <Semaforo datos={datos} abiertas />}
        {i === 2 && <Medidores u={u} res={datos.resumen} />}
        {i === 3 && (
          <div className="feria-estacion">
            {estacion.fotos?.[0] && <img src={estacion.fotos[0].src} alt={estacion.fotos[0].titulo} />}
            <Mapa estaciones={[estacion]} activa={estacion.id} onElegir={() => {}} />
          </div>
        )}
        {i === 4 && (nasa ? <ComparacionesMes nasa={nasa} todas={todas} /> : <p className="vacio">{t("feria.nasa")}</p>)}
        {i === 5 && (
          <div className="feria-qr">
            <img src="/qr-agrosol.svg" alt={t("feria.qrAlt")} />
            <p>{t("feria.qr")}</p>
            <b>agrosol-cesar.vercel.app</b>
          </div>
        )}
      </div>

      <div className="feria-pie">
        {Array.from({ length: TOTAL }).map((_, k) => <span key={k} className={"feria-punto" + (k === i ? " on" : "")} />)}
        <div className="feria-barra"><i key={i} style={{ animationDuration: SEGUNDOS + "s" }} /></div>
      </div>
    </div>
  );
}
