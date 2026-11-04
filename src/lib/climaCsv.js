// Enlaces a los datos de la NASA POWER que usa la página, para poder comprobarlos en la fuente.
const aNasa = (isoDia) => isoDia.replace(/-/g, "");

export function aniosDe(hist) {
  return { desde: Number(hist.inicio.slice(0, 4)), hasta: Number(hist.fin.slice(0, 4)) };
}

export function descripcionPeriodo(hist) {
  const { desde, hasta } = aniosDe(hist);
  const n = hasta - desde + 1;
  const periodo = desde === hasta ? String(desde) : `${desde}–${hasta}`;
  return { desde, hasta, n, periodo, texto: `${periodo} (${n} ${n === 1 ? "año" : "años"})` };
}

export const URL_NASA = "https://power.larc.nasa.gov/";
export const URL_VISOR_NASA = "https://power.larc.nasa.gov/data-access-viewer/";

// Dirección de la API de la NASA que entrega exactamente esos datos para el punto de la estación.
// formato "JSON" se ve directo en el navegador; "CSV" se descarga para abrir en Excel.
export function urlNasa(est, { parametros, desde, hasta, formato = "JSON", climatologia = false }) {
  const punto = `community=AG&longitude=${est.lon}&latitude=${est.lat}&format=${formato}`;
  if (climatologia) return `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${parametros}&${punto}`;
  return `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parametros}&${punto}&start=${aNasa(desde)}&end=${aNasa(hasta)}`;
}
