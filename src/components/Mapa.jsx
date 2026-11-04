import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const estilo = (activa) => ({
  radius: activa ? 12 : 8, weight: 3, color: "#fff",
  fillColor: activa ? "#e4572e" : "#2f7d43", fillOpacity: 1,
});

// Mapa con un punto por estación (OpenStreetMap, gratis). Tocar un punto elige la estación.
export default function Mapa({ estaciones, activa, onElegir }) {
  const ref = useRef(null);
  const mapa = useRef(null);
  const marcas = useRef({});
  const elegir = useRef(onElegir);
  elegir.current = onElegir;

  useEffect(() => {
    const m = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap",
    }).addTo(m);
    estaciones.forEach((e) => {
      const c = L.circleMarker([e.lat, e.lon], estilo(false)).addTo(m)
        .bindTooltip(e.nombre + (e.fotos?.length ? " · 📷 toca para ver fotos" : ""));
      c.on("click", () => elegir.current(e.id));
      marcas.current[e.id] = c;
    });
    const a = estaciones[0];
    m.setView([a.lat, a.lon], 13);
    if (estaciones.length > 1) m.fitBounds(estaciones.map((e) => [e.lat, e.lon]), { padding: [40, 40] });
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; marcas.current = {}; };
  }, [estaciones]);

  useEffect(() => {
    Object.entries(marcas.current).forEach(([id, c]) => {
      c.setStyle(estilo(id === activa));
      if (id === activa) c.bringToFront();
    });
    const e = estaciones.find((x) => x.id === activa);
    if (e && mapa.current) mapa.current.flyTo([e.lat, e.lon], Math.max(mapa.current.getZoom(), 13), { duration: 0.8 });
  }, [activa, estaciones]);

  return <div className="mapa" ref={ref} />;
}
