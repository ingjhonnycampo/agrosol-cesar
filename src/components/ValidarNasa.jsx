import { URL_NASA, urlNasa } from "../lib/climaCsv.js";

const coma = (v) => Number(v).toFixed(4).replace(".", ",");

// Enlace directo a los datos de la NASA que se están usando en esa sección, para validarlos en la fuente.
// "Ver los datos" abre la respuesta de la NASA en el navegador; "CSV" la descarga para Excel.
export default function ValidarNasa({ estacion, parametros, desde, hasta, climatologia = false, titulo = "Validar en la NASA" }) {
  if (!climatologia && (!desde || !hasta)) return null;
  const ver = urlNasa(estacion, { parametros, desde, hasta, formato: "JSON", climatologia });
  const csv = urlNasa(estacion, { parametros, desde, hasta, formato: "CSV", climatologia });
  return (
    <p className="validar">
      <b>🔎 {titulo}:</b>{" "}
      <a href={ver} target="_blank" rel="noreferrer">ver los datos</a> · <a href={csv} target="_blank" rel="noreferrer">descargar CSV</a>
      {" · "}<a href={URL_NASA} target="_blank" rel="noreferrer">NASA POWER</a>
      <span className="validar-detalle">
        {" "}Variables: {parametros.replaceAll(",", ", ")} · punto {coma(estacion.lat)}° N, {coma(Math.abs(estacion.lon))}° O
        {climatologia ? " · promedios de 2001 a 2025" : ` · del ${desde} al ${hasta}`}
      </span>
    </p>
  );
}

// Enlace a los datos originales de la estación en ThingSpeak
export function ValidarEstacion({ estacion }) {
  return (
    <p className="validar">
      <b>🔎 Datos originales de la estación:</b>{" "}
      <a href={`https://thingspeak.com/channels/${estacion.canal}`} target="_blank" rel="noreferrer">canal {estacion.canal} en ThingSpeak</a>
      <span className="validar-detalle"> (los valores ahí están sin limpiar ni calibrar; si el canal es privado, hay que iniciar sesión)</span>
    </p>
  );
}
