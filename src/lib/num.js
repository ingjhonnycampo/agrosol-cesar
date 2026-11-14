// Separador decimal según el idioma: coma en español y portugués, punto en inglés.
let separador = ",";
export const fijarSeparador = (s) => { separador = s; };
export const sepDecimal = () => separador;

// Pone el número con el separador del idioma. Con `dec` fija los decimales.
export const coma = (v, dec) => {
  if (v === null || v === undefined) return "—";
  const s = dec === undefined ? String(v) : Number(v).toFixed(dec);
  return s.replace(".", separador);
};
