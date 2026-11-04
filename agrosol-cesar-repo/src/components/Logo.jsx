// Logo de AgroSol: un sol que se levanta sobre un brote, con una onda de señal.
export default function Logo({ tam = 48 }) {
  return (
    <svg className="logo" width={tam} height={tam} viewBox="0 0 64 64" role="img" aria-label="AgroSol Cesar">
      <defs>
        <radialGradient id="logo-sol" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff3b0" /><stop offset="1" stopColor="#f6a623" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#2f7d43" />
      <circle cx="32" cy="27" r="13" fill="url(#logo-sol)" />
      <g stroke="#fff3b0" strokeWidth="2.4" strokeLinecap="round">
        <path d="M32 6v4M12 15l3 3M52 15l-3 3M7 30h4M57 30h-4" />
      </g>
      <path d="M2 46c10-8 18-4 30-4s20-4 30 4v6c-8 8-52 8-60 0z" fill="#1f5c30" />
      <path d="M32 54V40" stroke="#b9f3c2" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 44c-6 0-10-4-10-9 6 0 10 3 10 9zM32 41c0-6 4-9 10-9 0 5-4 9-10 9z" fill="#7be08a" />
    </svg>
  );
}
