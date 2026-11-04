const PASOS = [
  { icono: "📡", titulo: "1. Los sensores miden", texto: "Humedad del suelo a 10 y 30 cm, lluvia, viento, luz, temperatura y mojado de la hoja." },
  { icono: "📻", titulo: "2. La micro:bit lo envía", texto: "Cada 10 minutos manda los datos por radio a la receptora del colegio." },
  { icono: "☁️", titulo: "3. Suben a internet", texto: "Un NodeMCU con WiFi los guarda en ThingSpeak, gratis y abierto." },
  { icono: "🛰️", titulo: "4. Se limpian y se comparan", texto: "La página corrige errores, los cruza con datos de la NASA y le dice al agricultor qué hacer." },
];

// Dibujo de la estación con sus sensores y los cuatro pasos del viaje del dato.
export default function ComoFunciona() {
  return (
    <section className="como">
      <div className="titulo-seccion"><h2>¿Cómo funciona?</h2><p>Del suelo del colegio a tu celular</p></div>
      <div className="como-caja">
        <svg className="como-dibujo" viewBox="0 0 300 290" role="img" aria-label="Dibujo de la estación con sus sensores">
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
          {/* etiquetas */}
          <g fontFamily="Nunito, sans-serif" fontSize="11" fontWeight="700" fill="#1d2a1f">
            <text x="8" y="40">Viento</text><path d="M44 36l78 14" stroke="#9aa5a0" />
            <text x="8" y="84">Lluvia</text><path d="M42 80l74 2" stroke="#9aa5a0" />
            <text x="206" y="104">Temp. del aire</text><path d="M184 112l20-6" stroke="#9aa5a0" />
            <text x="226" y="140">Luz</text><path d="M214 128l12 8" stroke="#9aa5a0" />
            <text x="6" y="150">Hoja</text><path d="M34 146l68 2" stroke="#9aa5a0" />
            <text x="8" y="236" fill="#fff">Humedad 10 cm</text><path d="M92 233l42 2" stroke="#fff" />
            <text x="176" y="262" fill="#fff">Humedad 30 cm</text><path d="M170 258l4-2" stroke="#fff" />
          </g>
        </svg>
        <ol className="como-pasos">
          {PASOS.map((p) => (
            <li key={p.titulo}>
              <span className="como-icono" aria-hidden="true">{p.icono}</span>
              <div><b>{p.titulo}</b><p>{p.texto}</p></div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
