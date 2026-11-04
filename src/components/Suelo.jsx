import { PARAMETROS, TEXTURAS, aNumero, hayEstudio, SUELO_VACIO } from "../lib/suelo.js";
import { COLORES_NIVEL } from "../lib/semaforo.js";

// Estudio de suelo: lo que la estación no mide. Se escriben los resultados del laboratorio o del kit
// y la página los interpreta y los usa en la recomendación de rotación.
export default function Suelo({ suelo, onCambiar, estacion }) {
  const cambiar = (id, valor) => onCambiar({ ...suelo, [id]: valor });
  const textura = TEXTURAS.find((t) => t.id === suelo.textura);
  const tiene = hayEstudio(suelo);

  const lineas = PARAMETROS.filter((p) => aNumero(suelo[p.id]) !== null).map((p) => `${p.id}: ${aNumero(suelo[p.id])}`);
  if (suelo.textura) lineas.push(`textura: "${suelo.textura}"`);
  const codigo = `estudioSuelo: { ${lineas.join(", ")} },`;

  return (
    <div>
      <div className="nasa-intro">
        <b>🧪 Estudio de suelo.</b> La estación mide humedad y temperatura, pero <b>no el pH, los nutrientes ni las sales</b>:
        eso lo mide un laboratorio (o un kit de campo). Escribe aquí los resultados y la página los interpreta y los usa en la pestaña
        <b> Rotación</b>. Se guardan en este navegador.
      </div>

      <div className="suelo-rejilla">
        {PARAMETROS.map((p) => {
          const v = aNumero(suelo[p.id]);
          const ev = v === null ? null : p.evaluar(v);
          return (
            <label className="suelo-campo" key={p.id} style={{ "--c": ev ? COLORES_NIVEL[ev.nivel] : "#9aa5a0" }}>
              <span className="suelo-nombre">{p.nombre}{p.unidad && <small> ({p.unidad})</small>}</span>
              <input type="number" inputMode="decimal" step={p.paso} min={p.min} max={p.max} placeholder={`Ej. ${p.ejemplo}`}
                value={suelo[p.id]} onChange={(e) => cambiar(p.id, e.target.value)} />
              {ev ? <span className="suelo-nivel"><b>{ev.etiqueta}</b> · {ev.consejo}</span> : <span className="suelo-que">{p.que}</span>}
            </label>
          );
        })}
        <label className="suelo-campo" style={{ "--c": "#2e86ab" }}>
          <span className="suelo-nombre">Textura</span>
          <select value={suelo.textura} onChange={(e) => cambiar("textura", e.target.value)}>
            <option value="">— elige —</option>
            {TEXTURAS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <span className="suelo-que">{textura ? textura.info : "Qué tan arenoso o arcilloso es: define cuánta agua retiene."}</span>
        </label>
      </div>

      <div className="chips">
        {tiene && <button type="button" className="chip" onClick={() => onCambiar({ ...SUELO_VACIO })}>🗑️ Borrar valores</button>}
      </div>

      {tiene && (
        <details className="fuentes">
          <summary>📋 Dejar estos valores fijos para todos los visitantes</summary>
          <p className="fuentes-aviso">Lo que escribes aquí solo se guarda en este navegador. Para que lo vea cualquier visitante, copia esta línea
            dentro de la estación "{estacion.nombre}" en <code>src/data/estaciones.js</code>, reemplazando <code>estudioSuelo: null,</code>:</p>
          <pre className="cal-codigo">{codigo}</pre>
        </details>
      )}

      <details className="fuentes">
        <summary>🧑‍🔬 Cómo tomar la muestra de suelo</summary>
        <ol className="como-muestra">
          <li>Recorre el lote en zigzag y haz <b>10 a 15 huecos</b> pequeños, de 20 cm de profundidad (donde están las raíces).</li>
          <li>De cada hueco saca una tajada de tierra, sin hojas ni piedras, y échala en un balde limpio.</li>
          <li>Mézclalo todo y toma <b>1 kg</b> de esa mezcla en una bolsa limpia, marcada con el lote y la fecha.</li>
          <li>Llévala a un laboratorio de suelos (por ejemplo del IGAC, AGROSAVIA o una universidad de la región) o úsala con un kit de campo.</li>
          <li>Pide <b>pH, materia orgánica, fósforo, potasio, conductividad eléctrica y textura</b>, y copia aquí los resultados.</li>
        </ol>
      </details>
    </div>
  );
}
