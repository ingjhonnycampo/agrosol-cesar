// Bloquea el desplazamiento de la página mientras haya alguna pantalla encima (cohete, selector de idioma).
// Cuenta cuántas lo piden: solo se libera cuando ya ninguna lo necesita (si dos se superponen, la última no deja la página trabada).
let usos = 0;
export function bloquearScroll() {
  usos += 1;
  document.body.style.overflow = "hidden";
  let liberado = false;
  return () => {
    if (liberado) return;
    liberado = true;
    usos = Math.max(0, usos - 1);
    if (usos === 0) document.body.style.overflow = "";
  };
}
