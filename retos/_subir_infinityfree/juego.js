"use strict";
const NOTAS = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 85, 90, 95, 100];
const LETRAS = ["A", "B", "C", "D"];
const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rint(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MODOS = { mixto: "Mixto", microbit: "micro:bit", arduino: "Arduino Uno" };

/* ================= API ================= */
async function api(accion, datos = {}) {
  const r = await fetch("api.php?accion=" + accion, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
  });
  const j = await r.json().catch(() => ({ ok: false, error: "Respuesta no válida del servidor" }));
  if (!r.ok || !j.ok) throw new Error(j.error || "Error " + r.status);
  return j;
}

/* ================= AUDIO (música de misterio + efectos, sin archivos) ================= */
const Sonido = (() => {
  let ctx, master, musica, eco, timer, paso = 0, prox = 0, nivel = 0, activo = true, corriendo = false;
  try { activo = localStorage.getItem("retos_musica") !== "off"; } catch (e) {}
  const ESCALA = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 415.3, 440, 493.88, 523.25]; // La menor armónica
  const BAJOS = [110, 87.31, 82.41, 110];
  const PATRON = [0, 4, 7, 4, 2, 4, 6, 4, 0, 3, 7, 9, 6, 4, 2, 4];

  function iniciarCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = activo ? 0.9 : 0; master.connect(ctx.destination);
    musica = ctx.createGain(); musica.gain.value = 0.55; musica.connect(master);
    eco = ctx.createDelay(1); eco.delayTime.value = 0.38;
    const fb = ctx.createGain(); fb.gain.value = 0.42; const lp = ctx.createBiquadFilter(); lp.frequency.value = 1400;
    eco.connect(lp); lp.connect(fb); fb.connect(eco); lp.connect(musica);
    // zumbido grave (drone) con vibrato lento
    [55, 55.4].forEach((f) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
      const flt = ctx.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 160;
      const g = ctx.createGain(); g.gain.value = 0.12; o.connect(flt); flt.connect(g); g.connect(musica); o.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12; const lg = ctx.createGain(); lg.gain.value = 70;
      lfo.connect(lg); lg.connect(flt.frequency); lfo.start();
    });
  }
  function nota(f, t, dur, tipo, vol, destino, cut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), flt = ctx.createBiquadFilter();
    o.type = tipo; o.frequency.setValueAtTime(f, t); flt.type = "lowpass"; flt.frequency.value = cut || 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(flt); flt.connect(g); g.connect(destino); o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  function programar() {
    const bpm = 66 + nivel * 3, dur = 60 / bpm / 2;
    while (prox < ctx.currentTime + 0.25) {
      const p = paso % 16, compas = Math.floor(paso / 16) % 4;
      if (p % 4 === 0) { nota(BAJOS[compas], prox, dur * 3.5, "triangle", 0.5, musica, 400); }           // bajo
      if (p === 0 || p === 8) { nota(48, prox, 0.25, "sine", 0.7, musica, 200); nota(48, prox + dur * 0.9, 0.2, "sine", 0.45, musica, 200); } // latido
      if (PATRON[p] !== undefined && (p % 2 === 0 || Math.random() < 0.55)) {
        const f = ESCALA[PATRON[p]] * (compas === 1 ? 0.794 : compas === 2 ? 0.75 : 1);
        const g = nota(f, prox, dur * 2.2, "triangle", 0.22, musica, 1800); g.connect(eco);                 // arpegio con eco
      }
      if (Math.random() < 0.04 + nivel * 0.004) nota(ESCALA[rint(6, 9)] * 2, prox, dur * 4, "sine", 0.06, eco); // destellos
      prox += dur; paso++;
    }
  }
  return {
    iniciar() {
      iniciarCtx(); if (ctx.state === "suspended") ctx.resume();
      if (!corriendo) { corriendo = true; prox = ctx.currentTime + 0.1; paso = 0; timer = setInterval(programar, 60); }
    },
    parar() { corriendo = false; clearInterval(timer); },
    nivel(n) { nivel = n; },
    tension(on) { if (!ctx) return; musica.gain.setTargetAtTime(on ? 0.3 : 0.55, ctx.currentTime, 0.2); },
    toggle() {
      activo = !activo; try { localStorage.setItem("retos_musica", activo ? "on" : "off"); } catch (e) {}
      if (ctx) master.gain.setTargetAtTime(activo ? 0.9 : 0, ctx.currentTime, 0.05); return activo;
    },
    activo: () => activo,
    sfx(tipo) {
      if (!ctx || !activo) return; const t = ctx.currentTime + 0.01;
      if (tipo === "tic") nota(1000, t, 0.05, "square", 0.08, master, 2000);
      if (tipo === "sel") nota(660, t, 0.12, "square", 0.12, master, 1500);
      if (tipo === "ayuda") { nota(520, t, 0.1, "sine", 0.25, master); nota(780, t + 0.1, 0.18, "sine", 0.25, master); }
      if (tipo === "ring") for (let i = 0; i < 4; i++) { nota(880, t + i * 0.5, 0.18, "sine", 0.2, master); nota(700, t + i * 0.5 + 0.2, 0.18, "sine", 0.2, master); }
      if (tipo === "ok") [523, 659, 784, 1047].forEach((f, i) => nota(f, t + i * 0.09, 0.35, "triangle", 0.3, master));
      if (tipo === "mal") { [220, 185, 147, 110].forEach((f, i) => nota(f, t + i * 0.18, 0.35, "sawtooth", 0.22, master, 700)); }
      if (tipo === "gana") [523, 523, 659, 784, 659, 784, 1047, 1047, 1319].forEach((f, i) => nota(f, t + i * 0.14, 0.45, "square", 0.16, master, 2500));
    },
  };
})();

/* ================= GRÁFICOS (SVG) ================= */
function graficoBarras(cont, detalle, clave, maxVal, sufijo) {
  const W = 280, H = 120, base = 100, n = 14, bw = W / n;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de desempeño"><line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#5b57a8"/>`;
  [0.5, 1].forEach((m) => { const y = base - m * 90; s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff22" stroke-dasharray="3 3"/><text x="2" y="${y - 2}">${Math.round(maxVal * m)}${sufijo || ""}</text>`; });
  for (let i = 0; i < n; i++) {
    const d = detalle[i], x = i * bw + 2;
    if (d) {
      const h = Math.max(2, (d[clave] / maxVal) * 90);
      s += `<rect x="${x}" y="${base - h}" width="${bw - 4}" height="${h}" rx="2" fill="${d.ok ? "#1fbf6b" : "#e5384f"}"><title>P${i + 1}: ${d[clave]}${sufijo || ""}</title></rect>`;
    } else s += `<rect x="${x}" y="${base - 3}" width="${bw - 4}" height="3" fill="#ffffff22"/>`;
    s += `<text x="${x + (bw - 4) / 2}" y="${base + 11}" text-anchor="middle">${i + 1}</text>`;
  }
  cont.innerHTML = s + "</svg>";
}

/* ================= CRONÓMETRO (60 s por pregunta) ================= */
const TIEMPO = 60;
const Reloj = (() => {
  let tmr = null, fin = 0, resto = TIEMPO, ultimo = TIEMPO;
  function pintar() {
    const n = Math.ceil(resto), el = $("reloj");
    $("reloj-n").textContent = n;
    el.style.setProperty("--p", (resto / TIEMPO) * 100 + "%");
    el.classList.toggle("alerta", resto <= 10);
    el.classList.toggle("pausa", !tmr);
    if (n !== ultimo && resto <= 10 && resto > 0 && tmr) Sonido.sfx("tic");
    ultimo = n;
  }
  return {
    iniciar() { resto = TIEMPO; ultimo = TIEMPO; this.reanudar(); },
    reanudar() {
      clearInterval(tmr); fin = Date.now() + resto * 1000;
      tmr = setInterval(() => { resto = Math.max(0, (fin - Date.now()) / 1000); pintar(); if (resto <= 0) { clearInterval(tmr); tmr = null; tiempoAgotado(); } }, 200);
      pintar();
    },
    parar() { if (tmr) resto = Math.max(0, (fin - Date.now()) / 1000); clearInterval(tmr); tmr = null; pintar(); },
    usado: () => Math.round(TIEMPO - resto),
  };
})();

/* ================= ESTADO ================= */
let E = null; // estado de la partida

function armarPartida(modo) {
  const usados = new Set();
  const sacar = (banco, tier) => {
    const pool = BANCO[banco].filter((q) => q[0] === tier && !usados.has(q));
    const q = pool[rint(0, pool.length - 1)]; usados.add(q); return { q, banco };
  };
  const lista = [];
  for (let pos = 0; pos < 14; pos++) {
    let banco = modo, tier = pos + 1;
    if (modo === "mixto") { banco = pos < 7 ? "microbit" : "arduino"; tier = 2 * (pos % 7) + 1 + rint(0, 1); }
    const { q } = sacar(banco, tier);
    const opts = shuffle([{ t: q[2], ok: true }, { t: q[3] }, { t: q[4] }, { t: q[5] }]);
    lista.push({ texto: q[1], opts, correcta: opts.findIndex((o) => o.ok), tier, banco });
  }
  return lista;
}

/* ================= NAVEGACIÓN ================= */
function mostrar(id) {
  document.querySelectorAll(".pantalla").forEach((p) => p.classList.toggle("activa", p.id === id));
  window.scrollTo(0, 0);
}
function modal(titulo, html) { $("modal-titulo").textContent = titulo; $("modal-cuerpo").innerHTML = html; $("modal").hidden = false; }
function cerrarModal() {
  $("modal").hidden = true;
  if (E && E.pausado) { E.pausado = false; if (!E.bloqueado) Reloj.reanudar(); }
  if (E && E.cierreCb) { const cb = E.cierreCb; E.cierreCb = null; cb(); } }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ================= REGISTRO E INICIO ================= */
$("form-registro").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nombre = $("nombre").value.trim().replace(/\s+/g, " ");
  const modo = document.querySelector('input[name="modo"]:checked').value;
  if (nombre.length < 2) return;
  Sonido.iniciar(); // el navegador exige un clic para permitir audio
  $("btn-comenzar").disabled = true; $("msg-registro").hidden = true;
  let id = null, offline = false;
  try { id = (await api("registrar", { nombre, modo })).id; }
  catch (e) { offline = true; $("msg-registro").hidden = false; $("msg-registro").textContent = "No se pudo registrar en la BD (" + e.message + "). Jugarás sin guardar."; await new Promise((r) => setTimeout(r, 1800)); }
  $("btn-comenzar").disabled = false;
  E = { id, offline, nombre, modo, preguntas: armarPartida(modo), pos: 0, nota: 0, aciertos: 0, detalle: [], ayudas: {}, bloqueado: false, t0: Date.now(), tq: 0 };
  $("j-nombre").textContent = nombre; $("j-modo").textContent = "· " + MODOS[modo]; $("chip-offline").hidden = !offline;
  construirEscalera();
  ["5050", "publico", "llamada"].forEach((k) => $("ay-" + k).disabled = false);
  mostrar("pantalla-juego"); mostrarPregunta();
});

function construirEscalera() {
  $("escalera").innerHTML = NOTAS.map((n, i) => `<li data-i="${i}" class="${n === 100 ? "cien" : ""}"><span>${i + 1}</span><span>${n}</span></li>`).join("");
}
function pintarEscalera() {
  document.querySelectorAll("#escalera li").forEach((li) => {
    const i = +li.dataset.i; li.classList.toggle("hecho", i < E.pos || (i === E.pos && E.bloqueado === "ok")); li.classList.toggle("actual", i === E.pos && E.bloqueado !== "ok");
  });
}

/* ================= PREGUNTAS ================= */
function mostrarPregunta() {
  const q = E.preguntas[E.pos]; E.bloqueado = false; E.elim = new Set(); E.tq = Date.now();
  Sonido.nivel(E.pos); Sonido.tension(false);
  $("q-num").textContent = `Pregunta ${E.pos + 1} / 14`;
  $("q-tema").textContent = q.banco === "microbit" ? "micro:bit" : "Arduino Uno";
  $("q-nota").textContent = `Nota en juego: ${NOTAS[E.pos]}`;
  $("q-texto").textContent = q.texto;
  $("respuestas").innerHTML = q.opts.map((o, i) => `<button class="resp" data-i="${i}"><b>${LETRAS[i]}:</b><span></span></button>`).join("");
  document.querySelectorAll(".resp").forEach((b, i) => { b.lastChild.textContent = q.opts[i].t; b.addEventListener("click", () => responder(i)); });
  pintarEscalera(); graficoBarras($("grafico-vivo"), E.detalle, "nota", 100);
  Reloj.iniciar();
}

function tiempoAgotado() {
  if (E.bloqueado) return; E.bloqueado = true; E.timeout = true;
  const q = E.preguntas[E.pos], btns = document.querySelectorAll(".resp");
  btns.forEach((b) => b.disabled = true); btns[q.correcta].classList.add("ok");
  Sonido.sfx("mal"); E.detalle.push({ ok: 0, nota: E.nota, t: TIEMPO });
  pintarEscalera(); graficoBarras($("grafico-vivo"), E.detalle, "nota", 100); guardar(true);
  setTimeout(() => terminar(false), 3000);
}

function guardar(terminado) {
  if (!E || !E.id) return;
  api("progreso", { id: E.id, nota: E.nota, aciertos: E.aciertos, terminado: terminado ? 1 : 0, segundos: Math.round((Date.now() - E.t0) / 1000),
    ayudas: Object.keys(E.ayudas).join(","), detalle: E.detalle }).catch(() => { E.offline = true; $("chip-offline").hidden = false; });
}

function responder(i) {
  if (E.bloqueado) return; E.bloqueado = true;
  Reloj.parar();
  const q = E.preguntas[E.pos], btns = document.querySelectorAll(".resp"), seg = Reloj.usado();
  btns.forEach((b) => b.disabled = true); btns[i].classList.add("sel"); Sonido.sfx("sel"); Sonido.tension(true);
  setTimeout(() => {
    const ok = i === q.correcta;
    btns[q.correcta].classList.remove("sel"); btns[q.correcta].classList.add("ok");
    if (!ok) { btns[i].classList.remove("sel"); btns[i].classList.add("mal"); }
    Sonido.sfx(ok ? "ok" : "mal"); Sonido.tension(false);
    if (ok) { E.nota = NOTAS[E.pos]; E.aciertos++; E.bloqueado = "ok"; }
    E.detalle.push({ ok: ok ? 1 : 0, nota: E.nota, t: seg });
    pintarEscalera(); graficoBarras($("grafico-vivo"), E.detalle, "nota", 100);
    const fin = !ok || E.pos === 13; guardar(fin);
    setTimeout(() => { if (fin) terminar(ok); else { E.pos++; mostrarPregunta(); } }, ok ? 2200 : 3000);
  }, 2200);
}

/* ================= AYUDAS ================= */
function usar(k) { E.ayudas[k] = 1; $("ay-" + k).disabled = true; Sonido.sfx("ayuda"); }
const vivas = () => { const q = E.preguntas[E.pos]; return [0, 1, 2, 3].filter((i) => !E.elim.has(i)); };

$("ay-5050").addEventListener("click", () => {
  if (E.bloqueado) return; usar("5050");
  const q = E.preguntas[E.pos], malas = shuffle(vivas().filter((i) => i !== q.correcta)).slice(0, 2);
  malas.forEach((i) => { E.elim.add(i); document.querySelectorAll(".resp")[i].classList.add("elim"); });
  guardar(false);
});

$("ay-publico").addEventListener("click", () => {
  if (E.bloqueado) return; usar("publico"); Reloj.parar(); E.pausado = true;
  const q = E.preguntas[E.pos], v = vivas();
  const fuerza = clamp(0.9 - q.tier * 0.045 + rnd(-0.08, 0.08), 0.3, 0.92); // más difícil = público menos seguro
  const pesos = {}; let suma = 0;
  v.forEach((i) => { pesos[i] = i === q.correcta ? fuerza : rnd(0.1, 1) * (1 - fuerza); suma += pesos[i]; });
  const pct = [0, 0, 0, 0]; let tot = 0;
  v.forEach((i) => { pct[i] = Math.round((pesos[i] / suma) * 100); tot += pct[i]; });
  pct[q.correcta] += 100 - tot;
  modal("👥 El público opina", `<div class="barras">${[0, 1, 2, 3].map((i) => `<div class="col"><div class="pct">${pct[i]}%</div><div class="bar" data-h="${pct[i]}"></div><div class="let">${LETRAS[i]}</div></div>`).join("")}</div><small>Recuerda: el público también se equivoca.</small>`);
  requestAnimationFrame(() => setTimeout(() => document.querySelectorAll(".barras .bar").forEach((b) => b.style.height = (b.dataset.h * 1.5) + "px"), 50));
  guardar(false);
});

$("ay-llamada").addEventListener("click", () => {
  if (E.bloqueado) return; usar("llamada"); Reloj.parar(); E.pausado = true;
  const q = E.preguntas[E.pos], v = vivas();
  const amigo = ["Profe Camilo", "Ing. Sofía", "Tu compañero Juan", "Laura (club de robótica)"][rint(0, 3)];
  const acierta = Math.random() < clamp(0.93 - q.tier * 0.035, 0.45, 0.93);
  const eleg = acierta ? q.correcta : v.filter((i) => i !== q.correcta)[rint(0, v.length - 2)];
  const conf = acierta ? rint(70, 95) : rint(45, 70);
  const L = LETRAS[eleg], txt = q.opts[eleg].t;
  const frases = conf >= 80
    ? [`¡Ah, esa me la sé! Es la ${L}: «${txt}». Estoy seguro.`, `Sin duda la ${L}. Lo vimos en clase.`]
    : conf >= 60 ? [`Mmm… déjame pensar… yo iría por la ${L}, como un ${conf}% de seguridad.`, `Creo que es la ${L}, «${txt}». No estoy 100% seguro.`]
    : [`Uy, difícil… me inclino por la ${L}, pero solo un ${conf}% seguro.`, `No lo recuerdo bien… yo marcaría la ${L}, pero ojo.`];
  const frase = frases[rint(0, frases.length - 1)];
  modal("📞 Llamada a un amigo", `<div class="llamada"><div class="avatar ring" id="av">📞</div><b>${esc(amigo)}</b><div class="burbuja" id="burbuja">Llamando…</div><div class="cuenta"><i id="cuenta"></i></div></div>`);
  Sonido.sfx("ring");
  let cancelado = false; E.cierreCb = () => { cancelado = true; };
  setTimeout(() => {
    if (cancelado) return; $("av").classList.remove("ring"); $("av").textContent = "🙂";
    let i = 0; const b = $("burbuja"); b.textContent = "";
    const t = setInterval(() => { if (cancelado) return clearInterval(t); b.textContent = frase.slice(0, ++i); if (i >= frase.length) clearInterval(t); }, 35);
    const c = $("cuenta"); c.style.transition = "width 20s linear"; requestAnimationFrame(() => c.style.width = "0%");
  }, 2100);
  guardar(false);
});

/* ================= FIN ================= */
function terminar(gano) {
  Sonido.tension(false); if (gano) Sonido.sfx("gana");
  const total = Math.round((Date.now() - E.t0) / 1000), nota = E.nota;
  $("fin-emoji").textContent = nota === 100 ? "🏆" : nota >= 70 ? "🎉" : nota >= 40 ? "👍" : "📘";
  $("fin-titulo").textContent = nota === 100 ? `¡Increíble, ${E.nombre}! ¡Lo lograste!` : `Buen intento, ${E.nombre}`;
  $("fin-msg").textContent = E.timeout ? `⏰ Se acabó el tiempo (${TIEMPO} s). Tu nota asegurada es ${nota}.` : nota === 100 ? "Respondiste las 14 preguntas sin fallar." : nota === 0 ? "Esta vez no se aseguró nota. ¡Repasa e inténtalo de nuevo!" : `Te quedaste asegurando la nota de la pregunta ${E.aciertos}. ¡Sigue practicando!`;
  $("fin-nota").textContent = nota;
  const min = Math.floor(total / 60), s = total % 60, usadas = Object.keys(E.ayudas).length;
  $("fin-stats").innerHTML = `<div><b>${E.aciertos}/14</b>aciertos</div><div><b>${min}:${String(s).padStart(2, "0")}</b>tiempo total</div><div><b>${usadas}/3</b>ayudas usadas</div><div><b>${MODOS[E.modo]}</b>reto</div>`;
  graficoBarras($("grafico-fin-nota"), E.detalle, "nota", 100);
  graficoBarras($("grafico-fin-tiempo"), E.detalle, "t", Math.max(30, ...E.detalle.map((d) => d.t)), "s");
  mostrar("pantalla-fin");
}

/* ================= RANKING ================= */
async function verRanking() {
  modal("🏆 Ranking", "<p>Cargando…</p>");
  try {
    const { ranking } = await api("ranking");
    $("modal-cuerpo").innerHTML = ranking.length
      ? `<table class="rank"><tr><th>#</th><th>Nombre</th><th>Nota</th><th>Reto</th></tr>${ranking.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.nombre)}</td><td>${r.nota}</td><td>${esc(MODOS[r.modo] || r.modo)}</td></tr>`).join("")}</table>`
      : "<p>Aún no hay partidas registradas.</p>";
  } catch (e) { $("modal-cuerpo").innerHTML = `<p>No se pudo leer la base de datos.<br><small>${esc(e.message)}</small></p>`; }
}
$("btn-ver-ranking").addEventListener("click", verRanking);
$("btn-ranking-fin").addEventListener("click", verRanking);
$("modal-cerrar").addEventListener("click", cerrarModal);
$("modal").addEventListener("click", (e) => { if (e.target === $("modal")) cerrarModal(); });
$("btn-otra").addEventListener("click", () => { Sonido.nivel(0); $("nombre").value = E ? E.nombre : ""; mostrar("pantalla-inicio"); });

/* ================= MÚSICA ON/OFF ================= */
function pintarMusica() { $("btn-musica").textContent = Sonido.activo() ? "🔊" : "🔇"; }
$("btn-musica").addEventListener("click", () => { Sonido.iniciar(); Sonido.toggle(); pintarMusica(); });
pintarMusica();
