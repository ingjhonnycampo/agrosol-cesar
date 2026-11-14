import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { URL_WORLDVIEW } from "../data/recursosReto.js";

// Capas públicas de la NASA (servicio GIBS / Worldview): no necesitan cuenta ni clave.
const CAPAS = [
  { id: "ndvi", capa: "MODIS_Terra_NDVI_8Day", nivel: 9, ext: "png", icono: "🌿", nombre: "Vegetación (NDVI) · MODIS",
    info: "Verde intenso = plantas vigorosas; amarillo o marrón = suelo desnudo, seco o con poca vegetación. Se actualiza cada 8 días." },
  { id: "lluvia", capa: "IMERG_Precipitation_Rate", nivel: 6, ext: "png", icono: "🌧️", nombre: "Lluvia · GPM IMERG",
    info: "Intensidad de la lluvia estimada por satélite (mm por hora). Los colores aparecen solo donde está lloviendo." },
  { id: "suelo", capa: "SMAP_L4_Analyzed_Surface_Soil_Moisture", nivel: 6, ext: "png", icono: "💧", nombre: "Humedad del suelo (superficie) · SMAP",
    info: "Humedad de los primeros centímetros del suelo. Más azul = más húmedo. Llega con unos 3 a 4 días de retraso." },
  { id: "raiz", capa: "SMAP_L4_Analyzed_Root_Zone_Soil_Moisture", nivel: 6, ext: "png", icono: "🌱", nombre: "Humedad en la zona de raíces · SMAP",
    info: "Humedad del suelo más profunda, donde están las raíces. Llega con unos 3 a 4 días de retraso." },
  { id: "lst", capa: "MODIS_Terra_Land_Surface_Temp_Day", nivel: 7, ext: "png", icono: "🌡️", nombre: "Temperatura de la superficie · MODIS",
    info: "Qué tan caliente está el suelo visto desde el espacio durante el día. Las nubes dejan huecos sin dato." },
  { id: "color", capa: "MODIS_Terra_CorrectedReflectance_TrueColor", nivel: 9, ext: "jpg", icono: "🛰️", nombre: "Imagen real · MODIS Terra",
    info: "Cómo se ve la zona desde el satélite, con nubes y todo." },
];

const hoyIso = () => new Date().toISOString().slice(0, 10);

// Mapa con las capas de la NASA encima de OpenStreetMap, centrado en la estación.
export default function MapaNasa({ estacion }) {
  const ref = useRef(null);
  const mapa = useRef(null);
  const capa = useRef(null);
  const [id, setId] = useState("ndvi");
  const [fecha, setFecha] = useState(""); // vacío = lo más reciente que tenga la NASA
  const [opacidad, setOpacidad] = useState(0.75);
  const def = CAPAS.find((c) => c.id === id);

  useEffect(() => {
    const m = L.map(ref.current, { scrollWheelZoom: false }).setView([estacion.lat, estacion.lon], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    L.circleMarker([estacion.lat, estacion.lon], { radius: 9, weight: 3, color: "#fff", fillColor: "#e4572e", fillOpacity: 1 })
      .addTo(m).bindTooltip(estacion.nombre, { permanent: false });
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; capa.current = null; };
  }, [estacion]);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    if (capa.current) m.removeLayer(capa.current);
    const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${def.capa}/default/${fecha || "default"}/GoogleMapsCompatible_Level${def.nivel}/{z}/{y}/{x}.${def.ext}`;
    capa.current = L.tileLayer(url, { maxNativeZoom: def.nivel, maxZoom: 14, opacity: opacidad, attribution: "NASA GIBS / Worldview" }).addTo(m);
    capa.current.bringToFront();
  }, [def, fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { capa.current?.setOpacity(opacidad); }, [opacidad]);

  const d = 1.4;
  const worldview = `${URL_WORLDVIEW}?v=${estacion.lon - d},${estacion.lat - d * 0.8},${estacion.lon + d},${estacion.lat + d * 0.8}&l=${def.capa},Reference_Labels_15m${fecha ? "&t=" + fecha : ""}`;

  return (
    <div className="mapanasa">
      <div className="chips">
        {CAPAS.map((c) => (
          <button key={c.id} type="button" className={"chip" + (id === c.id ? " on" : "")} onClick={() => setId(c.id)}>{c.icono} {c.nombre.split(" · ")[0]}</button>
        ))}
      </div>
      <p className="ayuda"><b>{def.nombre}.</b> {def.info}</p>
      <div className="mapanasa-controles">
        <label>Fecha
          <input type="date" value={fecha} max={hoyIso()} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <button type="button" className="chip" onClick={() => setFecha("")}>Lo más reciente</button>
        <label>Transparencia
          <input type="range" min="0.2" max="1" step="0.05" value={opacidad} onChange={(e) => setOpacidad(Number(e.target.value))} />
        </label>
      </div>
      <div className="mapanasa-mapa" ref={ref} />
      <p className="validar">
        <b>🔎 Validar en la NASA:</b> <a href={worldview} target="_blank" rel="noreferrer">abrir esta misma capa en Worldview</a>
        <span className="validar-detalle"> · capa {def.capa} · servicio GIBS (sin cuenta). Si la fecha elegida no tiene datos, el mapa se ve vacío: prueba con "Lo más reciente".</span>
      </p>
    </div>
  );
}
