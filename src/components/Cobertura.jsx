import { useState } from "react";
import { CULTIVOS } from "../data/cultivos.js";
import Fuentes from "./Fuentes.jsx";

const SI = { alta: "Alta", media: "Media", baja: "Baja" };

const CONCEPTOS = [
  { icono: "🫘", titulo: "Fijadores de nitrógeno",
    que: "Las leguminosas (fríjol, canavalia, mucuna, guandú…) tienen bacterias en unos bultitos de sus raíces, llamados nódulos. Esas bacterias toman el nitrógeno del aire, que las plantas no pueden usar, y lo convierten en una forma que sí aprovechan.",
    suelo: "Dejan nitrógeno en el suelo: el cultivo que sigue lo aprovecha y se necesita menos abono. En un ensayo con maíz, la leguminosa anterior equivalió a unos 60 kg de nitrógeno por hectárea." },
  { icono: "🌿", titulo: "Cultivos de cobertura",
    que: "Plantas que se siembran para tapar el suelo, no para vender la cosecha. Después se cortan y se dejan sobre la tierra o se entierran: así se llaman también abonos verdes.",
    suelo: "El suelo tapado no se lava con la lluvia fuerte, no se endurece al sol, pierde menos agua por evaporación, tiene menos malezas y se mantiene más fresco. Sus restos alimentan a los microorganismos y suman materia orgánica." },
  { icono: "🌳", titulo: "Raíces profundas",
    que: "Algunas plantas (guandú, sorgo, canavalia, crotalaria) meten raíces que atraviesan capas duras y bajan mucho más que las raíces de un cultivo corriente.",
    suelo: "Rompen la compactación, abren canales por donde entra el agua, suben a la superficie nutrientes que estaban muy abajo y dejan materia orgánica en profundidad. Además llegan a agua que otras plantas no alcanzan." },
  { icono: "☀️", titulo: "Tolerantes a la sequía",
    que: "Las que aguantan días sin lluvia sin secarse: canavalia, guandú, caupí, sorgo, ajonjolí. Mantienen el suelo tapado justo cuando más lo necesita.",
    suelo: "En un clima como el de Bosconia, con meses secos y rachas sin lluvia, una cobertura que no se muere en la sequía protege el suelo todo el año y no depende del riego." },
];

const EFECTOS = [
  ["🧱 Estructura y compactación", "Raíces profundas y restos orgánicos hacen el suelo más suelto y con grumos.", "El agua se infiltra en vez de correr y las raíces del cultivo siguiente bajan más fácil."],
  ["💧 Agua en el suelo", "La cobertura frena la evaporación y las raíces abren canales.", "Se guarda más agua para la época seca: la reserva dura más días."],
  ["🌱 Materia orgánica", "Hojas, tallos y raíces que se descomponen.", "Es la despensa del suelo: guarda nutrientes y agua y alimenta la vida del suelo."],
  ["🧪 Nitrógeno", "Las leguminosas lo fijan del aire.", "Menos abono nitrogenado para el cultivo que sigue, sobre todo si es maíz u otro que lo gasta mucho."],
  ["🌧️ Erosión", "La cobertura amortigua el golpe de la gota y retiene la tierra.", "Menos pérdida de suelo fértil en los meses de lluvia fuerte (los ⛈️ del calendario de Estrategias)."],
  ["🐛 Plagas y malezas", "Alternar familias y tapar el suelo corta ciclos de plagas y apaga malezas.", "Menos problemas sin depender tanto de productos."],
  ["🪱 Vida del suelo", "Los restos y las raíces alimentan lombrices, hongos y bacterias.", "Un suelo vivo recicla mejor los nutrientes y se recupera solo."],
];

const OTROS = [
  ["Guandú (Cajanus cajan)", "Sí", "Muy profunda", "Alta", "Arbusto de raíz muy profunda; sirve en suelos pobres y secos."],
  ["Crotalaria (Crotalaria juncea)", "Sí", "Media a profunda", "Media a alta", "Crece rápido y da mucha masa verde para incorporar."],
  ["Caupí o fríjol cabecita negra (Vigna unguiculata)", "Sí", "Media", "Alta", "Leguminosa que también se cosecha para comer."],
  ["Lablab (Lablab purpureus)", "Sí", "Media a profunda", "Alta", "Trepadora de buena cobertura; sirve también de forraje."],
  ["Maní forrajero (Arachis pintoi)", "Sí", "Media", "Media", "Cobertura baja y permanente, útil bajo frutales o plátano."],
  ["Sorgo (cobertura y grano)", "No", "Profunda", "Alta", "Gramínea de raíces muy profundas; aporta mucha materia orgánica."],
];

// Qué hacen los cultivos de cobertura y fijadores de nitrógeno, y cómo cuidan la salud del suelo.
export default function Cobertura() {
  const [filtro, setFiltro] = useState({ fija: false, cobertura: false, sequia: false });
  const alternar = (k) => setFiltro((f) => ({ ...f, [k]: !f[k] }));
  const fila = (c) => ({ c, fija: !!c.fijaN, cob: c.cobertura || "media", seq: c.sequia });
  const filas = CULTIVOS.map(fila).filter((f) => (!filtro.fija || f.fija) && (!filtro.cobertura || f.cob === "alta") && (!filtro.sequia || f.seq === "alta"));
  const ideales = CULTIVOS.map(fila).filter((f) => f.fija && f.cob === "alta" && f.seq === "alta");

  return (
    <div>
      <div className="nasa-intro">
        <b>🌿 Cultivos de cobertura y fijadores de nitrógeno.</b> Un suelo sano es un suelo <b>vivo</b>: con materia orgánica, agua guardada, nutrientes y raíces que lo abren.
        Estas plantas lo cuidan <b>sin gastar en abonos</b> y son la base de la estrategia <b>🌱 Suelo vivo</b> de la pestaña Estrategias.
        Es una explicación general: la elección de la especie y las fechas deben revisarse con un agrónomo o la UMATA.
      </div>

      <div className="cob-conceptos">
        {CONCEPTOS.map((c) => (
          <article key={c.titulo} className="cob-card">
            <span className="cob-icono" aria-hidden="true">{c.icono}</span>
            <h3>{c.titulo}</h3>
            <p>{c.que}</p>
            <p className="cob-suelo"><b>Para el suelo:</b> {c.suelo}</p>
          </article>
        ))}
      </div>

      <div className="titulo-seccion"><h2>Las raíces, por dentro</h2><p>Por qué importan las profundas y las que fijan nitrógeno</p></div>
      <div className="cob-dibujo">
        <svg viewBox="0 0 520 250" role="img" aria-label="Raíz superficial frente a raíz profunda con nódulos">
          <rect width="520" height="250" fill="#e6f3fb" />
          <rect y="50" width="520" height="200" fill="#9a6a45" />
          <rect y="50" width="520" height="52" fill="#7d5233" />
          <rect y="110" width="520" height="16" fill="#5d3f28" />
          <path d="M0 118h520" stroke="#3d2a1a" strokeDasharray="6 5" strokeWidth="1.5" />
          <rect y="215" width="520" height="35" fill="#3d86b8" opacity=".85" />
          <g fontFamily="Nunito, sans-serif" fontSize="11" fontWeight="700" fill="#fff">
            <text x="8" y="68">Capa de arriba</text><text x="8" y="124" fill="#f4dfc8">Capa dura (compactada)</text><text x="8" y="236">Agua profunda</text>
          </g>
          {/* planta de raíz superficial */}
          <g>
            <path d="M120 50V10" stroke="#3f9b52" strokeWidth="5" strokeLinecap="round" /><path d="M120 28q-26-4-30-22M120 24q26-4 30-22" stroke="#3f9b52" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M120 50q-26 18-44 44M120 50q22 20 40 48M120 52v40" stroke="#e8cf9d" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          {/* leguminosa de raíz profunda con nódulos */}
          <g>
            <path d="M370 50V8" stroke="#2f7d43" strokeWidth="6" strokeLinecap="round" /><path d="M370 26q-30-4-36-24M370 22q30-4 36-24" stroke="#2f7d43" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M370 50V228" stroke="#f0dcae" strokeWidth="4" strokeLinecap="round" />
            <path d="M370 74q-34 10-52 30M370 78q36 10 56 34M370 150q-26 8-40 24M370 160q28 6 42 24" stroke="#f0dcae" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <g fill="#f6b73c" stroke="#a96f00" strokeWidth="1"><circle cx="338" cy="94" r="5" /><circle cx="324" cy="102" r="4.5" /><circle cx="404" cy="96" r="5" /><circle cx="418" cy="108" r="4.5" /><circle cx="356" cy="84" r="3.8" /></g>
          </g>
          <g fontFamily="Nunito, sans-serif" fontSize="11.5" fontWeight="800" fill="#1d2a1f">
            <text x="30" y="30" fill="#1d2a1f">Raíz superficial</text>
            <text x="424" y="60">Raíz profunda</text>
          </g>
          <g fontFamily="Nunito, sans-serif" fontSize="10.5" fontWeight="700" fill="#fff">
            <text x="196" y="94">Se queda arriba y sufre</text><text x="196" y="106">cuando se seca</text>
            <text x="436" y="86" fill="#ffe9a8">● Nódulos: aquí viven</text><text x="436" y="98" fill="#ffe9a8">las bacterias que</text><text x="436" y="110" fill="#ffe9a8">fijan nitrógeno</text>
            <text x="268" y="170" fill="#f4dfc8">Atraviesa la capa dura,</text><text x="268" y="183" fill="#f4dfc8">abre canales y llega</text><text x="268" y="196" fill="#f4dfc8">al agua de abajo</text>
          </g>
        </svg>
      </div>

      <div className="titulo-seccion"><h2>Cómo influyen en la salud del suelo</h2><p>Siete efectos</p></div>
      <div className="tabla-caja">
        <table className="tabla cob-tabla">
          <thead><tr><th>Efecto</th><th>Qué hace la planta</th><th>Qué se gana</th></tr></thead>
          <tbody>{EFECTOS.map(([e, a, b]) => <tr key={e}><th>{e}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="titulo-seccion"><h2>¿Cuáles de nuestros cultivos hacen qué?</h2><p>Sale de la tabla de cultivos de AgroSol</p></div>
      <div className="chips">
        <button type="button" className={"chip" + (filtro.fija ? " on" : "")} onClick={() => alternar("fija")}>🫘 Fijan nitrógeno</button>
        <button type="button" className={"chip" + (filtro.cobertura ? " on" : "")} onClick={() => alternar("cobertura")}>🌿 Cubren muy bien el suelo</button>
        <button type="button" className={"chip" + (filtro.sequia ? " on" : "")} onClick={() => alternar("sequia")}>☀️ Aguantan mucho la sequía</button>
      </div>
      <div className="tabla-caja">
        <table className="tabla cob-tabla">
          <thead><tr><th>Cultivo</th><th>Fija nitrógeno</th><th>Cubre el suelo</th><th>Aguanta la sequía</th><th>Gasta nitrógeno</th></tr></thead>
          <tbody>
            {filas.map(({ c, fija, cob, seq }) => (
              <tr key={c.id} className={fija && cob === "alta" && seq === "alta" ? "cob-ideal" : ""}>
                <th>{c.emoji} {c.nombre}</th>
                <td>{fija ? "✅ Sí" : "—"}</td><td>{SI[cob]}</td><td>{SI[seq]}</td><td>{SI[c.exigenciaN]}</td>
              </tr>
            ))}
            {!filas.length && <tr><td colSpan="5">Ningún cultivo de la tabla cumple todo eso a la vez.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="filtro-nota">
        {ideales.length
          ? <>⭐ <b>Cumple las tres a la vez</b> (fija nitrógeno, cubre muy bien y aguanta la sequía): <b>{ideales.map((f) => f.c.nombre).join(", ")}</b>. Es la que más usa la estrategia “Suelo vivo”.</>
          : "Ninguno cumple las tres a la vez."}
        {" "}Las marcas de cobertura y sequía son valores de referencia por verificar con un agrónomo.
      </p>

      <div className="titulo-seccion"><h2>Otras plantas de cobertura del trópico seco</h2><p>Aún no están en la tabla de AgroSol</p></div>
      <div className="tabla-caja">
        <table className="tabla cob-tabla">
          <thead><tr><th>Planta</th><th>Fija N</th><th>Raíz</th><th>Aguanta sequía</th><th>Para qué sirve</th></tr></thead>
          <tbody>{OTROS.map((o) => <tr key={o[0]}><th>{o[0]}</th><td>{o[1]}</td><td>{o[2]}</td><td>{o[3]}</td><td>{o[4]}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="titulo-seccion"><h2>Cómo se maneja, en la práctica</h2><p>Orientación general</p></div>
      <ol className="cob-pasos">
        <li><b>Siembra</b> la cobertura al empezar las lluvias, o después de cosechar, para que el suelo no pase meses desnudo (sobre todo en los meses de lluvia fuerte).</li>
        <li><b>Déjala crecer</b> hasta que empiece a florecer: ahí tiene más masa verde y más nitrógeno en las hojas.</li>
        <li><b>Córtala</b> y deja los restos sobre el suelo como cobija (mulch), o entiérralos poco profundo. No la quemes: se pierde el nitrógeno y la materia orgánica.</li>
        <li><b>Siembra después</b> un cultivo que gaste mucho nitrógeno (maíz, por ejemplo) para aprovechar lo que dejó la leguminosa.</li>
        <li><b>Repite cada año</b> alternando cultivos de familias distintas: el suelo mejora de forma gradual.</li>
      </ol>

      <div className="titulo-seccion"><h2>Cómo lo usa AgroSol</h2><p>En el modelo</p></div>
      <ul className="cob-pasos">
        <li>En <b>Estrategias</b>, el plan <b>🌱 Suelo vivo</b> es el único que puede usar abonos verdes, y premia a las leguminosas y a las plantas que tapan bien el suelo.</li>
        <li>El eje <b>Suelo</b> suma puntos por llevar una leguminosa o un abono verde, por alternar familias y por tener el suelo cubierto; resta si se repite la misma familia.</li>
        <li>Los meses <b>🟫 sin cultivo</b> cuestan más cuando llueve fuerte (⛈️, 100 mm o más al mes): ahí una cobertura evitaría la erosión.</li>
        <li>En <b>Rotación</b>, sembrar una leguminosa después de un cultivo que gasta mucho nitrógeno recibe el mejor puntaje de rotación.</li>
      </ul>

      <div className="rot-alerta">
        <b>Lo que debe confirmarse en el terreno:</b> qué especie se adapta mejor al suelo y a la lluvia de Bosconia, si hay semilla disponible, cuánto nitrógeno aporta realmente cada una en este lote, si compite o no con el cultivo y qué plagas atrae. AgroSol <b>apoya la decisión, no la reemplaza</b>.
      </div>
      <Fuentes />
    </div>
  );
}
