import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { IDIOMAS, idiomaPorId } from "./idiomas.js";
import es from "./es.js";
import { fijarSeparador } from "../lib/num.js";

const CLAVE = "agrosol-idioma";
const Contexto = createContext(null);

function idiomaGuardado() {
  // ?idioma=en abre la página directamente en ese idioma
  try {
    const p = new URLSearchParams(window.location.search).get("idioma");
    if (p) return idiomaPorId(p).id;
  } catch { /* nada */ }
  try {
    const g = localStorage.getItem(CLAVE);
    if (g) return idiomaPorId(g).id;
  } catch { /* sin almacenamiento */ }
  return "es";
}

// Da `t("clave", { variable })` a toda la página. Si falta una traducción se usa el español.
export function IdiomaProvider({ children }) {
  const [lang, setLangEstado] = useState(idiomaGuardado);
  const idioma = idiomaPorId(lang);
  fijarSeparador(idioma.sep); // antes de dibujar, para que los números salgan bien

  const setLang = useCallback((id) => {
    setLangEstado(id);
    try { localStorage.setItem(CLAVE, id); } catch { /* no pasa nada */ }
    try { document.documentElement.lang = id; } catch { /* nada */ }
  }, []);

  const valor = useMemo(() => {
    const t = (clave, vars) => {
      const texto = idioma.dic[clave] ?? es[clave] ?? clave;
      return vars ? texto.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "")) : texto;
    };
    return { lang, t, setLang, locale: idioma.locale, idiomas: IDIOMAS };
  }, [lang, idioma, setLang]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useIdioma = () => useContext(Contexto);
