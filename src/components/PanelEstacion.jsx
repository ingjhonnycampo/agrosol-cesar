import { useState } from "react";
import Mapa from "./Mapa.jsx";
import Galeria from "./Galeria.jsx";

const grados = (v, pos, neg) => `${Math.abs(v).toFixed(4).replace(".", ",")}° ${v >= 0 ? pos : neg}`;

// Elige la estación y muestra dónde está. Tocar el punto del mapa (o el botón) abre sus fotos.
export default function PanelEstacion({ estaciones, activa, onElegir }) {
  const [verFotos, setVerFotos] = useState(false);
  const e = estaciones.find((x) => x.id === activa) || estaciones[0];
  const nFotos = e.fotos?.length || 0;

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
          <li><b>Latitud:</b> {grados(e.lat, "N", "S")}</li>
          <li><b>Longitud:</b> {grados(e.lon, "E", "O")}</li>
          {e.altitud !== null && <li><b>Altitud:</b> {e.altitud} m</li>}
          {e.cultivo && <li><b>Cultivo:</b> {e.cultivo}</li>}
          <li><b>Instalada:</b> {new Date(e.instalada + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</li>
        </ul>
        {nFotos > 0 && (
          <button type="button" className="boton boton-fotos" onClick={() => setVerFotos(true)}>
            📷 Ver fotos de la estación ({nFotos})
          </button>
        )}
      </div>
      <Mapa estaciones={estaciones} activa={e.id} onElegir={elegirDesdeMapa} />
      {verFotos && <Galeria estacion={e} onCerrar={() => setVerFotos(false)} />}
    </div>
  );
}
