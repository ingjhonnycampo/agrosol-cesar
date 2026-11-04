import { useEffect, useMemo, useState } from "react";
import Cielo from "./components/Cielo.jsx";
import Medidores from "./components/Medidores.jsx";
import Resumen from "./components/Resumen.jsx";
import ModoFeria from "./components/ModoFeria.jsx";
import ComoFunciona from "./components/ComoFunciona.jsx";
import Logo from "./components/Logo.jsx";
import Semaforo from "./components/Semaforo.jsx";
import PanelEstacion from "./components/PanelEstacion.jsx";
import FiltroFechas from "./components/FiltroFechas.jsx";
import Graficas from "./components/Graficas.jsx";
import ResumenDias from "./components/ResumenDias.jsx";
import Comparar from "./components/Comparar.jsx";
import Nasa from "./components/Nasa.jsx";
import Calendario from "./components/Calendario.jsx";
import Tabla from "./components/Tabla.jsx";
import { ESTACIONES, ESTACION_INICIAL, buscarEstacion } from "./data/estaciones.js";
import { diaLocal } from "./lib/limpieza.js";
import { resumenDia } from "./lib/semaforo.js";
import { filtrar, hoyLocal, porDia, rangoPreset } from "./lib/analisis.js";

const CADA = 120000; // vuelve a pedir datos cada 2 minutos

const VISTAS = [
  { id: "ahora", nombre: "Ahora", icono: "⏱️" },
  { id: "graficas", nombre: "Gráficas", icono: "📈" },
  { id: "dias", nombre: "Por día", icono: "📊" },
  { id: "nasa", nombre: "NASA", icono: "🛰️" },
  { id: "comparar", nombre: "Comparar", icono: "⚖️" },
  { id: "calendario", nombre: "Calendario", icono: "🗓️" },
  { id: "tabla", nombre: "Datos", icono: "📋" },
];

function haceCuanto(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h ${min % 60} min`;
  return `hace ${Math.floor(h / 24)} días`;
}

const coma = (v) => String(v).replace(".", ",");

function horaLocal(iso) {
  return new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
}

export default function App() {
  const [estacionId, setEstacionId] = useState(ESTACION_INICIAL);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [, setTic] = useState(0);
  const [vista, setVista] = useState("ahora");
  const [preset, setPreset] = useState("7d");
  const [custom, setCustom] = useState(null);
  const [feria, setFeria] = useState(() => new URLSearchParams(window.location.search).has("feria"));

  const estacion = buscarEstacion(estacionId);

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
    const b = setInterval(() => setTic((t) => t + 1), 30000); // refresca el "hace X min"
    return () => { vivo = false; clearInterval(a); clearInterval(b); };
  }, [estacionId]);

  const u = datos?.ultimo;
  const res = datos?.resumen;
  const minutos = u ? (Date.now() - new Date(u.t).getTime()) / 60000 : Infinity;
  const enLinea = minutos < 25;

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

  // Frases del astronauta: primero lo que mide la estación, luego datos curiosos
  const mensajes = useMemo(() => {
    const m = [];
    if (u) {
      if (u.temp !== null) m.push(`Ahora el aire está a ${coma(u.temp)} °C 🌡️`);
      if (u.suelo10 !== null) m.push(`La humedad del suelo a 10 cm va en ${u.suelo10} % 💧`);
      if (res?.lluviaHoy > 0) m.push(`Hoy ya cayeron ${coma(res.lluviaHoy)} mm de lluvia 🌧️`);
      else m.push("Hoy no ha llovido en la estación ☀️");
      if (u.hojaEstado === "seca") m.push("La hoja del cultivo está seca: buen día contra los hongos 🍃");
      else if (u.hojaEstado !== "sin dato") m.push("La hoja tiene humedad: ojo con los hongos 🍄");
    }
    m.push("Los satélites de la NASA miden la humedad del suelo desde el espacio 🛰️");
    m.push("Con datos de la NASA y esta estación ayudamos a decidir qué sembrar 🌱");
    m.push("¡Los estudiantes del colegio construyeron esta estación! 🛠️");
    return m;
  }, [u, res]);

  const resumenHoy = datos ? resumenDia(datos, estacion.lugar.split(",")[0]) : null;

  function abrirFeria() {
    setFeria(true);
    try { document.documentElement.requestFullscreen?.(); } catch { /* sin pantalla completa, igual funciona */ }
  }
  function cerrarFeria() {
    setFeria(false);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* nada */ }
  }

  return (
    <>
      <Cielo luz={u?.luz} mensajes={mensajes} ambiente={resumenHoy?.ambiente}>
        <p className="marca">NASA Space Apps 2026 · {estacion.lugar}</p>
        <h1><Logo tam={44} /> AgroSol Cesar</h1>
        <p className="lema">La estación que escucha al suelo y al cielo</p>
        {u && (
          <div className={"pastilla " + (enLinea ? "ok" : "off")}>
            <span className="punto" />
            {enLinea ? "Estación en línea" : "Sin datos recientes"} · último dato {haceCuanto(u.t)}
          </div>
        )}
        {u && <button type="button" className="boton-feria" onClick={abrirFeria}>📺 Modo feria</button>}
      </Cielo>

      <main>
        <Resumen resumen={resumenHoy} />

        <section>
          <PanelEstacion estaciones={ESTACIONES} activa={estacionId} onElegir={setEstacionId} />
        </section>

        {error && !datos && <div className="aviso">No se pudieron traer los datos: {error}</div>}
        {!datos && !error && <div className="cargando">Conectando con la estación…</div>}

        {u && (
          <section>
            <nav className="pestanas" role="tablist">
              {VISTAS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={vista === v.id}
                  className={"pestana" + (vista === v.id ? " on" : "")} onClick={() => setVista(v.id)}>
                  <span aria-hidden="true">{v.icono}</span> {v.nombre}
                </button>
              ))}
            </nav>

            {vista !== "ahora" && (
              <FiltroFechas
                rango={rango} limites={limites} nMediciones={filasRango.length}
                onPreset={(p) => setPreset(p)}
                onPersonalizado={(desde, hasta) => { setCustom({ desde, hasta }); setPreset("custom"); }}
              />
            )}

            {vista === "ahora" && (
              <>
                <div className="titulo-seccion">
                  <h2>¿Qué necesita el cultivo?</h2>
                  <p>Toca una tarjeta para ver por qué</p>
                </div>
                <Semaforo datos={datos} />

                <div className="titulo-seccion">
                  <h2>Ahora mismo</h2>
                  <p>{horaLocal(u.t)}</p>
                </div>
                <Medidores u={u} res={res} />
                <p className="calidad">
                  {res.totalDatos} mediciones desde el {new Date(res.desde).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}
                </p>
              </>
            )}

            {vista === "graficas" && <Graficas filas={filasRango} />}
            {vista === "dias" && <ResumenDias dias={dias} />}
            {vista === "nasa" && <Nasa estacion={estacion} todas={todas} rango={rango} dias={dias} />}
            {vista === "comparar" && <Comparar todas={todas} rango={rango} />}
            {vista === "calendario" && <Calendario dias={dias} rango={rango} />}
            {vista === "tabla" && <Tabla filas={filasRango} />}
          </section>
        )}
        <ComoFunciona />
      </main>

      {feria && u && (
        <ModoFeria datos={datos} estacion={estacion} resumen={resumenHoy} todas={todas} onSalir={cerrarFeria} />
      )}

      <footer>
        Proyecto AgroSol Cesar · Estación micro:bit con sensores de suelo, lluvia, luz y viento · {estacion.lugar}
      </footer>
    </>
  );
}
