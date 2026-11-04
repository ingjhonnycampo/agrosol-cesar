import { FUENTES } from "../data/cultivos.js";

// De dónde salen los datos de los cultivos y qué tan confiables son. Va visible, no escondido.
export default function Fuentes({ abierto = false }) {
  return (
    <details className="fuentes" open={abierto}>
      <summary>📚 De dónde salen estos datos y sus límites</summary>
      <p className="fuentes-aviso">
        Los rangos de cada cultivo (temperatura, agua, pH y ciclo) son <b>valores de referencia generales</b>, no medidos en Bosconia.
        Varían con la variedad y el manejo. Esta guía es educativa: antes de decidir qué sembrar, hay que confirmarla con un agrónomo,
        la UMATA o AGROSAVIA. El valor de mercado es una estimación del equipo.
      </p>
      <ul>
        {FUENTES.map((f) => (
          <li key={f.id}>
            {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.texto}</a> : f.texto}
            {f.nota && <em> ({f.nota})</em>}
          </li>
        ))}
      </ul>
    </details>
  );
}
