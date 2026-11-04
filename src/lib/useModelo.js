import { useEffect, useState } from "react";

async function pedirNasa(url) {
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "Error " + r.status);
  return j;
}

export const CONSULTA_INICIAL = () => ({
  anterior: "", mes: new Date().getMonth(), riego: false, riesgo: "equilibrado",
  pesos: { agua: 3, rapidez: 2, suelo: 3, mercado: 3 },
});

// Trae de la NASA el historial de 25 años y los últimos días (para compararlos con la estación).
// Solo pide los datos cuando `activo` es verdadero (una pestaña que los necesita está abierta) y los conserva.
export function useDatosModelo(estacionId, primerDia, activo) {
  const [modelo, setModelo] = useState({ hist: null, reciente: null, error: "", clave: "" });
  const clave = estacionId + "|" + (primerDia || "");

  useEffect(() => {
    if (!activo || modelo.clave === clave) return undefined;
    let vivo = true;
    const base = "/api/nasa?estacion=" + encodeURIComponent(estacionId);
    Promise.all([pedirNasa(base + "&historial=1"), pedirNasa(base + (primerDia ? `&desde=${primerDia}` : ""))])
      .then(([hist, reciente]) => vivo && setModelo({ hist, reciente, error: "", clave }))
      .catch((e) => vivo && setModelo({ hist: null, reciente: null, error: e.message, clave }));
    return () => { vivo = false; };
  }, [activo, clave, estacionId, primerDia, modelo.clave]);

  return modelo.clave === clave ? modelo : { hist: null, reciente: null, error: "", clave: "" };
}
