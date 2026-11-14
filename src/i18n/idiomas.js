import es from "./es.js";
import en from "./en.js";
import pt from "./pt.js";

// Idiomas de la página. `sep` es el separador decimal; `locale` da el formato de fechas.
export const IDIOMAS = [
  { id: "es", nombre: "Español", bandera: "🇨🇴", locale: "es-CO", sep: ",", saludo: "Ver la página en español", dic: es },
  { id: "en", nombre: "English", bandera: "🇺🇸", locale: "en-US", sep: ".", saludo: "View the page in English", dic: en },
  { id: "pt", nombre: "Português", bandera: "🇧🇷", locale: "pt-BR", sep: ",", saludo: "Ver a página em português", dic: pt },
];

export const idiomaPorId = (id) => IDIOMAS.find((i) => i.id === id) || IDIOMAS[0];
