import { useState } from "react";
import Mapa from "./Mapa.jsx";
import Galeria from "./Galeria.jsx";
import { useIdioma } from "../i18n/IdiomaContext.jsx";
import { sepDecimal } from "../lib/num.js";

// Elige la estación y muestra dónde está. Tocar el punto del mapa (o el botón) abre sus fotos.
export default function PanelEstacion({ estaciones, activa, onElegir }) {
  const { t, locale } = useIdioma();
  const [verFotos, setVerFotos] = useState(false);
  const e = estaciones.find((x) => x.id === activa) || estaciones[0];
  const nFotos = e.fotos?.length || 0;
  const grados = (v, pos, neg) => `${Math.abs(v).toFixed(4).replace(".", sepDecimal())}° ${t(v >= 0 ? pos : neg)}`;

  const elegirDesdeMapa = (id) => {
    onElegir(id);
    if (estaciones.find((x) => x.id === id)?.fotos?.length) setVerFotos(true);
  };

  return (
    <div className="panel-estacion">
      <div className="panel-info">
        {estaciones.length > 1 && (
          <div className="chips">
            {estaciones.map((x) => (
              <button key={x.id} type="button" className={"chip" + (x.id === e.id ? " on" : "")} onClick={() => onElegir(x.id)}>
                {x.nombre}
              </button>
            ))}
          </div>
        )}
        <h3>📍 {e.nombre}</h3>
        <p>{e.lugar}</p>
        <ul>
          <li><b>{t("est.lat")}:</b> {grados(e.lat, "est.N", "est.S")}</li>
          <li><b>{t("est.lon")}:</b> {grados(e.lon, "est.E", "est.O")}</li>
          {e.altitud !== null && <li><b>{t("est.alt")}:</b> {e.altitud} m</li>}
          {e.cultivo && <li><b>{t("est.cultivo")}:</b> {e.cultivo}</li>}
          <li><b>{t("est.instalada")}:</b> {new Date(e.instalada + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}</li>
        </ul>
        {nFotos > 0 && (
          <button type="button" className="boton boton-fotos" onClick={() => setVerFotos(true)}>
            {t("est.verFotos", { n: nFotos })}
          </button>
        )}
      </div>
      <Mapa estaciones={estaciones} activa={e.id} onElegir={elegirDesdeMapa} />
      {verFotos && <Galeria estacion={e} onCerrar={() => setVerFotos(false)} />}
    </div>
  );
}
