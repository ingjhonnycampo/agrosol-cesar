import { useState } from "react";
import { useIdioma } from "../i18n/IdiomaContext.jsx";
import { coma } from "../lib/num.js";
import { textoHoja } from "../lib/semaforo.js";

const ICONOS = ["📡", "📻", "☁️", "🛰️"];

// Los sensores del dibujo: se tocan para ver qué miden, cómo funcionan y su dato de ahora
const SENSORES = [
  { id: "viento", icono: "🌬️", pin: "P11", dato: (u) => (u.vientoKmh === null ? null : `${coma(u.vientoKmh, 1)} km/h`) },
  { id: "lluvia", icono: "🌧️", pin: "P12", dato: (u, r) => (r?.lluviaHoy === null || r?.lluviaHoy === undefined ? null : `${coma(r.lluviaHoy, 1)} mm`) },
  { id: "temp", icono: "🌡️", pin: "micro:bit", dato: (u) => (u.temp === null ? null : `${coma(u.temp, 1)} °C`) },
  { id: "luz", icono: "☀️", pin: "P1", dato: (u) => (u.luz === null ? null : `${u.luz} %`) },
  { id: "hoja", icono: "🍃", pin: "P10", dato: (u, r, t) => textoHoja(u.hojaEstado, t) },
  { id: "suelo10", icono: "💧", pin: "P0", dato: (u) => (u.suelo10 === null ? null : `${u.suelo10} %`) },
  { id: "suelo30", icono: "🌱", pin: "P4", dato: (u) => (u.suelo30 === null ? null : `${u.suelo30} %`) },
  { id: "tsuelo", icono: "🔥", pin: "P2 (LM35)", dato: (u) => (u.tsuelo === null ? null : `${coma(u.tsuelo, 1)} °C`) },
];

// Dibujo de la estación con sensores que se tocan, y los cuatro pasos del viaje del dato.
export default function ComoFunciona({ u, res }) {
  const { t } = useIdioma();
  const [sel, setSel] = useState(null);
  const s = SENSORES.find((x) => x.id === sel);
  const zona = (id, forma) => ({
    className: "sen-zona" + (sel === id ? " activa" : ""), role: "button", tabIndex: 0, "aria-label": t("sen." + id + ".n"),
    onClick: () => setSel(sel === id ? null : id), onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(sel === id ? null : id); } },
    ...forma,
  });

  return (
    <section className="como">
      <div className="titulo-seccion"><h2>{t("como.titulo")}</h2><p>{t("como.sub")}</p></div>
      <div className="como-caja">
        <div className="como-izq">
          <svg className="como-dibujo" viewBox="0 0 300 290" role="group" aria-label={t("como.aria")}>
            <rect x="0" y="212" width="300" height="78" fill="#8a5a3b" />
            <rect x="0" y="200" width="300" height="16" rx="8" fill="#5fae5a" />
            <rect x="146" y="70" width="8" height="150" rx="3" fill="#aeb7c2" />
            {/* anemómetro */}
            <g className="como-giro"><path d="M126 52h48" stroke="#2f7d43" strokeWidth="5" strokeLinecap="round" /><circle cx="126" cy="52" r="7" fill="#3fb86a" /><circle cx="174" cy="52" r="7" fill="#3fb86a" /></g>
            <rect x="146" y="52" width="8" height="20" fill="#2f7d43" />
            {/* pluviómetro */}
            <path d="M120 72h60l-12 22h-36z" fill="#3fb86a" />
            {/* caja de sensores */}
            <rect x="116" y="96" width="68" height="46" rx="4" fill="#fff" stroke="#cfd6e4" strokeWidth="2" />
            <path d="M122 106h56M122 114h56M122 122h56M122 130h56" stroke="#dfe6ef" strokeWidth="3" />
            {/* panel de luz / hoja */}
            <rect x="188" y="116" width="30" height="8" rx="2" fill="#f6b73c" transform="rotate(-12 188 116)" />
            <path d="M104 140l14 8-14 8z" fill="#3f9b52" />
            {/* sensores de suelo */}
            <rect x="136" y="214" width="5" height="26" rx="2" fill="#2e86ab" />
            <rect x="159" y="214" width="5" height="52" rx="2" fill="#1b5e87" />
            <rect x="186" y="214" width="5" height="34" rx="2" fill="#e8743a" />
            {/* etiquetas */}
            <g fontFamily="Nunito, sans-serif" fontSize="11" fontWeight="700" fill="#1d2a1f" pointerEvents="none">
              <text x="8" y="40">{t("como.viento")}</text><path d="M44 36l78 14" stroke="#9aa5a0" />
              <text x="8" y="84">{t("como.lluvia")}</text><path d="M42 80l74 2" stroke="#9aa5a0" />
              <text x="206" y="104">{t("como.tAire")}</text><path d="M184 112l20-6" stroke="#9aa5a0" />
              <text x="226" y="140">{t("como.luz")}</text><path d="M214 128l12 8" stroke="#9aa5a0" />
              <text x="6" y="150">{t("como.hoja")}</text><path d="M34 146l68 2" stroke="#9aa5a0" />
              <text x="8" y="236" fill="#fff">{t("como.h10")}</text><path d="M92 233l42 2" stroke="#fff" />
              <text x="176" y="262" fill="#fff">{t("como.h30")}</text><path d="M170 258l4-2" stroke="#fff" />
              <text x="198" y="240" fill="#fff">{t("como.tSuelo")}</text>
            </g>
            {/* zonas que se tocan */}
            <circle {...zona("viento", { cx: 150, cy: 52, r: 30 })} />
            <rect {...zona("lluvia", { x: 116, y: 70, width: 68, height: 26, rx: 6 })} />
            <rect {...zona("temp", { x: 114, y: 96, width: 72, height: 48, rx: 6 })} />
            <circle {...zona("luz", { cx: 203, cy: 120, r: 20 })} />
            <circle {...zona("hoja", { cx: 112, cy: 148, r: 16 })} />
            <rect {...zona("suelo10", { x: 130, y: 212, width: 17, height: 34, rx: 4 })} />
            <rect {...zona("suelo30", { x: 153, y: 212, width: 17, height: 58, rx: 4 })} />
            <rect {...zona("tsuelo", { x: 180, y: 212, width: 17, height: 40, rx: 4 })} />
          </svg>

          <div className="sen-panel" aria-live="polite">
            {s ? (
              <>
                <div className="sen-cabeza"><span aria-hidden="true">{s.icono}</span><b>{t("sen." + s.id + ".n")}</b>
                  <span className="sen-valor">{u ? (s.dato(u, res, t) ?? "—") : "—"}</span></div>
                <p><b>{t("sen.mide")}:</b> {t("sen." + s.id + ".m")}</p>
                <p><b>{t("sen.como")}:</b> {t("sen." + s.id + ".c")}</p>
                <p className="sen-pin">{t("sen.pin")}: {s.pin}</p>
              </>
            ) : <p className="sen-ayuda">{t("sen.toca")}</p>}
          </div>
          <div className="chips sen-chips">
            {SENSORES.map((x) => (
              <button key={x.id} type="button" className={"chip" + (sel === x.id ? " on" : "")} onClick={() => setSel(sel === x.id ? null : x.id)} aria-label={t("sen." + x.id + ".n")}>{x.icono}</button>
            ))}
          </div>
        </div>
        <ol className="como-pasos">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>
              <span className="como-icono" aria-hidden="true">{ICONOS[n - 1]}</span>
              <div><b>{t("como.p" + n)}</b><p>{t("como.p" + n + "t")}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
