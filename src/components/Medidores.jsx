import Medidor from "./Medidor.jsx";
import { nivelesMedidores, textoHoja } from "../lib/semaforo.js";
import { useIdioma } from "../i18n/IdiomaContext.jsx";
import { coma } from "../lib/num.js";

// Los 8 medidores de "Ahora mismo". Cuatro de ellos cambian de color según el estado del cultivo.
export default function Medidores({ u, res }) {
  const { t } = useIdioma();
  const n = nivelesMedidores(u);
  return (
    <div className="rejilla">
      <Medidor titulo={t("med.tAire")} valor={u.temp} unidad="°C" min={15} max={45} color="#e4572e" nivel={n.temp} decimales={1}
        nota={res.tmaxHoy !== null ? t("med.tAireNota", { min: coma(res.tminHoy), max: coma(res.tmaxHoy) }) : ""} />
      <Medidor titulo={t("med.tSuelo")} valor={u.tsuelo} unidad="°C" min={15} max={50} color="#a0522d" nivel={n.tsuelo} decimales={1}
        nota={t("med.tSueloNota")} />
      <Medidor titulo={t("med.h10")} valor={u.suelo10} unidad="%" color="#2e86ab" nivel={n.suelo10}
        nota={t("med.h10Nota")} />
      <Medidor titulo={t("med.h30")} valor={u.suelo30} unidad="%" color="#1b5e87" nivel={n.suelo30}
        nota={t("med.h30Nota")} />
      <Medidor titulo={t("med.lluviaHoy")} valor={res.lluviaHoy} unidad="mm" max={50} color="#3d5af1" decimales={1}
        nota={t("med.lluvia24", { mm: coma(res.lluvia24h) })} />
      <Medidor titulo={t("med.luz")} valor={u.luz} unidad="%" color="#f6b73c"
        nota={u.luz >= 60 ? t("med.luzDia") : u.luz >= 8 ? t("med.luzTarde") : t("med.luzNoche")} />
      <Medidor titulo={t("med.hoja")} valor={u.hoja} unidad="%" color="#3f9b52" nivel={n.hoja}
        nota={t("med.hojaEstado", { e: textoHoja(u.hojaEstado, t) })} />
      <Medidor titulo={t("med.viento")} valor={u.vientoKmh} unidad="km/h" max={30} color="#7b6cd9" decimales={1}
        nota={u.vientoKmh === 0 ? t("med.calma") : ""} />
    </div>
  );
}
