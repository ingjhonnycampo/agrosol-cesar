import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cielo from "./components/Cielo.jsx";
import Medidores from "./components/Medidores.jsx";
import Resumen from "./components/Resumen.jsx";
import ModoFeria from "./components/ModoFeria.jsx";
import ComoFunciona from "./components/ComoFunciona.jsx";
import Logo from "./components/Logo.jsx";
import Intro from "./components/Intro.jsx";
import SelectorIdioma from "./components/SelectorIdioma.jsx";
import Semaforo from "./components/Semaforo.jsx";
import PanelEstacion from "./components/PanelEstacion.jsx";
import FiltroFechas from "./components/FiltroFechas.jsx";
import Graficas from "./components/Graficas.jsx";
import ResumenDias from "./components/ResumenDias.jsx";
import Comparar from "./components/Comparar.jsx";
import Nasa from "./components/Nasa.jsx";
import Rotacion, { useRecomendacion } from "./components/Rotacion.jsx";
import Reto from "./components/Reto.jsx";
import Estrategias from "./components/Estrategias.jsx";
import Glosario from "./components/Glosario.jsx";
import Cobertura from "./components/Cobertura.jsx";
import Informe from "./components/Informe.jsx";
import { useDatosModelo, CONSULTA_INICIAL } from "./lib/useModelo.js";
import { descripcionPeriodo, urlNasa } from "./lib/climaCsv.js";
import { ValidarEstacion } from "./components/ValidarNasa.jsx";
import { cargarProyecto, guardarProyecto } from "./lib/proyecto.js";
import Cultivos from "./components/Cultivos.jsx";
import Suelo from "./components/Suelo.jsx";
import { cargarSuelo, guardarSuelo } from "./lib/suelo.js";
import Calendario from "./components/Calendario.jsx";
import Tabla from "./components/Tabla.jsx";
import { ESTACIONES, ESTACION_INICIAL, buscarEstacion } from "./data/estaciones.js";
import { diaLocal } from "./lib/limpieza.js";
import { resumenDia } from "./lib/semaforo.js";
import { filtrar, hoyLocal, porDia, rangoPreset } from "./lib/analisis.js";
import { coma } from "./lib/num.js";
import { useIdioma } from "./i18n/IdiomaContext.jsx";

const CON_FECHAS = ["graficas", "dias", "nasa", "comparar", "calendario", "tabla"]; // vistas que usan el filtro de fechas
const CADA = 120000; // vuelve a pedir datos cada 2 minutos

const VISTAS = [
  { id: "ahora", icono: "⏱️" },
  { id: "graficas", icono: "📈" },
  { id: "dias", icono: "📊" },
  { id: "nasa", icono: "🛰️" },
  { id: "reto", icono: "🎯" },
  { id: "rotacion", icono: "🌱" },
  { id: "estrategias", icono: "🔀" },
  { id: "cultivos", icono: "🌽" },
  { id: "cobertura", icono: "🌿" },
  { id: "glosario", icono: "📖" },
  { id: "informe", icono: "📄" },
  { id: "suelo", icono: "🧪" },
  { id: "comparar", icono: "⚖️" },
  { id: "calendario", icono: "🗓️" },
  { id: "tabla", icono: "📋" },
];

export default function App() {
  const { t, lang, locale } = useIdioma();
  const [estacionId, setEstacionId] = useState(ESTACION_INICIAL);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [, setTic] = useState(0);
  // ?vista=informe (u otra pestaña) abre directamente esa vista
  const [vista, setVista] = useState(() => {
    const v = new URLSearchParams(window.location.search).get("vista");
    return VISTAS.some((x) => x.id === v) ? v : "ahora";
  });
  const [preset, setPreset] = useState("7d");
  const [custom, setCustom] = useState(null);
  // La cuenta regresiva del cohete sale cada vez que se abre la dirección. ?sinintro o ?feria la saltan.
  const [intro, setIntro] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("feria") || q.has("sinintro")) return false;
    return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  });
  const [feria, setFeria] = useState(() => new URLSearchParams(window.location.search).has("feria"));
  // Después del cohete se elige el idioma; el botón 🌐 del encabezado lo vuelve a abrir
  const [eligiendo, setEligiendo] = useState(false);
  const pendienteFeria = useRef(false);
  const abrirFeria = useCallback(() => {
    setFeria(true);
    try { document.documentElement.requestFullscreen?.(); } catch { /* sin pantalla completa, igual funciona */ }
  }, []);
  // opciones.feria = la persona eligió "Modo feria" desde la intro
  const terminarIntro = useCallback((opciones) => {
    setIntro(false);
    pendienteFeria.current = !!opciones?.feria;
    setEligiendo(true);
  }, []);
  const cerrarSelector = useCallback(() => {
    setEligiendo(false);
    if (pendienteFeria.current) { pendienteFeria.current = false; abrirFeria(); }
  }, [abrirFeria]);

  const estacion = buscarEstacion(estacionId);

  // estudio de suelo: lo escribe el equipo y se guarda en este navegador
  const [suelo, setSuelo] = useState(() => cargarSuelo(estacion));
  useEffect(() => { setSuelo(cargarSuelo(buscarEstacion(estacionId))); }, [estacionId]);
  // consulta del agricultor, datos del proyecto y datos del modelo (se piden solo si una pestaña los usa)
  const [consulta, setConsulta] = useState(CONSULTA_INICIAL);
  const [proyecto, setProyecto] = useState(() => cargarProyecto(estacion));
  useEffect(() => { setProyecto(cargarProyecto(buscarEstacion(estacionId))); }, [estacionId]);
  const cambiarProyecto = useCallback((p) => { setProyecto(p); guardarProyecto(estacionId, p); }, [estacionId]);
  const cambiarSuelo = useCallback((nuevo) => { setSuelo(nuevo); guardarSuelo(estacionId, nuevo); }, [estacionId]);

  useEffect(() => {
    let vivo = true;
    setDatos(null);
    setError("");
    async function cargar() {
      try {
        const r = await fetch("/api/datos?estacion=" + encodeURIComponent(estacionId));
        const j = await r.json();
        if (!r.ok || j.error) throw new Error(j.error || "Error " + r.status);
        if (vivo) { setDatos(j); setError(""); }
      } catch (e) {
        if (vivo) setError(e.message);
      }
    }
    cargar();
    const a = setInterval(cargar, CADA);
    const b = setInterval(() => setTic((n) => n + 1), 30000); // refresca el "hace X min"
    return () => { vivo = false; clearInterval(a); clearInterval(b); };
  }, [estacionId]);

  const u = datos?.ultimo;
  const res = datos?.resumen;
  const minutos = u ? (Date.now() - new Date(u.t).getTime()) / 60000 : Infinity;
  const enLinea = minutos < 25;

  const haceCuanto = (iso) => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return t("tiempo.momento");
    if (min < 60) return t("tiempo.min", { n: min });
    const h = Math.floor(min / 60);
    if (h < 24) return t("tiempo.horas", { h, m: min % 60 });
    return t("tiempo.dias", { d: Math.floor(h / 24) });
  };
  const horaLocal = (iso) =>
    new Date(iso).toLocaleString(locale, { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

  const todas = datos?.filas;
  const limites = useMemo(() => {
    const hoy = hoyLocal();
    return todas?.length ? { min: diaLocal(todas[0].t), max: diaLocal(todas[todas.length - 1].t) } : { min: hoy, max: hoy };
  }, [todas]);

  const rango = preset === "custom" && custom
    ? { preset, ...custom }
    : { preset, ...rangoPreset(preset, { hoy: hoyLocal(), ...limites }) };

  const filasRango = useMemo(() => (todas ? filtrar(todas, rango.desde, rango.hasta) : []), [todas, rango.desde, rango.hasta]);
  const dias = useMemo(() => porDia(filasRango), [filasRango]);
  const diasTodos = useMemo(() => (todas ? porDia(todas) : []), [todas]);
  const modelo = useDatosModelo(estacionId, diasTodos[0]?.dia, vista === "rotacion" || vista === "informe" || vista === "estrategias");
  // período del clima histórico de la NASA que usa el modelo, y el enlace a esos mismos datos
  const climaInfo = modelo.hist
    ? { ...descripcionPeriodo(modelo.hist), urlCsv: urlNasa(estacion, { parametros: "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR", desde: modelo.hist.inicio, hasta: modelo.hist.fin, formato: "CSV" }) }
    : null;
  const { ap, resultados } = useRecomendacion({ consulta, modelo, diasEst: diasTodos, suelo, humedadHoy: u?.suelo10 ?? null });

  // Frases del astronauta: primero lo que mide la estación, luego datos curiosos
  const mensajes = useMemo(() => {
    const m = [];
    if (u) {
      if (u.temp !== null) m.push(t("astro.temp", { t: coma(u.temp) }));
      if (u.suelo10 !== null) m.push(t("astro.suelo", { v: u.suelo10 }));
      if (res?.lluviaHoy > 0) m.push(t("astro.lluvia", { mm: coma(res.lluviaHoy) }));
      else m.push(t("astro.sinLluvia"));
      if (u.hojaEstado === "seca") m.push(t("astro.hojaSeca"));
      else if (u.hojaEstado !== "sin dato") m.push(t("astro.hojaHumeda"));
    }
    m.push(t("astro.nasa"));
    m.push(t("astro.siembra"));
    m.push(t("astro.estudiantes"));
    return m;
  }, [u, res, t]);

  const resumenHoy = datos ? resumenDia(datos, estacion.lugar.split(",")[0], t) : null;

  function cerrarFeria() {
    setFeria(false);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* nada */ }
  }

  return (
    <>
      {intro && <Intro listo={!!datos || !!error} onTerminar={terminarIntro} />}
      {eligiendo && <SelectorIdioma onElegir={cerrarSelector} onCerrar={cerrarSelector} />}
      <Cielo luz={u?.luz} mensajes={mensajes} ambiente={resumenHoy?.ambiente}>
        <p className="marca">{t("app.marca", { lugar: estacion.lugar })}</p>
        <h1><Logo tam={44} /> AgroSol Cesar</h1>
        <p className="lema">{t("app.lema")}</p>
        {u && (
          <div className={"pastilla " + (enLinea ? "ok" : "off")}>
            <span className="punto" />
            {enLinea ? t("app.enLinea") : t("app.sinDatos")} · {t("app.ultimoDato", { cuando: haceCuanto(u.t) })}
          </div>
        )}
        <div className="cielo-botones">
          {u && <button type="button" className="boton-feria" onClick={abrirFeria}>{t("app.feria")}</button>}
          <button type="button" className="boton-feria boton-idioma" onClick={() => setEligiendo(true)} aria-label={t("idioma.cambiar")} title={t("idioma.cambiar")}>🌐 {lang.toUpperCase()}</button>
        </div>
      </Cielo>

      <main>
        <Resumen resumen={resumenHoy} />

        <section>
          <PanelEstacion estaciones={ESTACIONES} activa={estacionId} onElegir={setEstacionId} />
        </section>

        {error && !datos && <div className="aviso">{t("app.errorDatos", { e: error })}</div>}
        {!datos && !error && <div className="cargando">{t("app.cargando")}</div>}

        {u && (
          <section>
            <nav className="pestanas" role="tablist">
              {VISTAS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={vista === v.id}
                  className={"pestana" + (vista === v.id ? " on" : "")} onClick={() => setVista(v.id)}>
                  <span aria-hidden="true">{v.icono}</span> {t("v." + v.id)}
                </button>
              ))}
            </nav>

            {CON_FECHAS.includes(vista) && (
              <FiltroFechas
                rango={rango} limites={limites} nMediciones={filasRango.length}
                onPreset={(p) => setPreset(p)}
                onPersonalizado={(desde, hasta) => { setCustom({ desde, hasta }); setPreset("custom"); }}
              />
            )}

            {vista === "ahora" && (
              <>
                <div className="titulo-seccion">
                  <h2>{t("app.tituloNecesita")}</h2>
                  <p>{t("app.tocaTarjeta")}</p>
                </div>
                <Semaforo datos={datos} />

                <div className="titulo-seccion">
                  <h2>{t("app.ahoraMismo")}</h2>
                  <p>{horaLocal(u.t)}</p>
                </div>
                <Medidores u={u} res={res} />
                <p className="calidad">
                  {t("app.mediciones", { n: res.totalDatos, fecha: new Date(res.desde).toLocaleDateString(locale, { timeZone: "America/Bogota" }) })}
                </p>
              </>
            )}

            {vista === "graficas" && <Graficas filas={filasRango} />}
            {vista === "dias" && <ResumenDias dias={dias} />}
            {vista === "nasa" && <Nasa estacion={estacion} todas={todas} rango={rango} dias={dias} />}
            {vista === "reto" && <Reto estacion={estacion} diasEst={diasTodos} />}
            {vista === "rotacion" && <Rotacion estacion={estacion} suelo={suelo} consulta={consulta} onConsulta={setConsulta} modelo={modelo} ap={ap} resultados={resultados} climaInfo={climaInfo} />}
            {vista === "estrategias" && <Estrategias estacion={estacion} suelo={suelo} consulta={consulta} onConsulta={setConsulta} modelo={modelo} ap={ap} />}
            {vista === "cultivos" && <Cultivos />}
            {vista === "cobertura" && <Cobertura />}
            {vista === "glosario" && <Glosario ap={ap} />}
            {vista === "informe" && <Informe estacion={estacion} diasEst={diasTodos} suelo={suelo} consulta={consulta} modelo={modelo} ap={ap} resultados={resultados} proyecto={proyecto} onProyecto={cambiarProyecto} climaInfo={climaInfo} />}
            {vista === "suelo" && <Suelo suelo={suelo} onCambiar={cambiarSuelo} estacion={estacion} />}
            {vista === "comparar" && <Comparar todas={todas} rango={rango} />}
            {vista === "calendario" && <Calendario dias={dias} rango={rango} />}
            {vista === "tabla" && <><ValidarEstacion estacion={estacion} /><Tabla filas={filasRango} /></>}
          </section>
        )}
        <ComoFunciona u={u} res={res} />
      </main>

      {feria && u && (
        <ModoFeria datos={datos} estacion={estacion} resumen={resumenHoy} todas={todas} onSalir={cerrarFeria} />
      )}

      <footer>{t("app.footer", { lugar: estacion.lugar })}</footer>
    </>
  );
}
