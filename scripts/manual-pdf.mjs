// Genera public/manual-agrosol.pdf a partir del mismo texto que la pestaña "Manual" (src/data/manual.js).
// Usa Chrome sin ventana. Uso: node scripts/manual-pdf.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { SECCIONES, MANUAL_VERSION, URL_PLATAFORMA } = await import(pathToFileURL(path.join(RAIZ, "src", "data", "manual.js")).href);
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error("No encontré Chrome ni Edge");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const marcar = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
const b64 = (f) => fs.readFileSync(path.join(RAIZ, "public", f)).toString("base64");

function bloque(b) {
  if (b.t === "p") return `<p>${marcar(b.x)}</p>`;
  if (b.t === "ul") return `<ul>${b.x.map((x) => `<li>${marcar(x)}</li>`).join("")}</ul>`;
  if (b.t === "ol") return `<ol>${b.x.map((x) => `<li>${marcar(x)}</li>`).join("")}</ol>`;
  if (b.t === "aviso") return `<div class="aviso">${marcar(b.x)}</div>`;
  if (b.t === "tabla") {
    return `<table><thead><tr>${b.cab.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.filas.map((f) => `<tr>${f.map((c) => `<td>${marcar(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  if (b.t === "ficha") {
    return `<div class="ficha"><h3>${b.icono} ${esc(b.nombre)}</h3><p><b>Qué es:</b> ${marcar(b.que)}</p><p><b>Cómo se usa:</b> ${marcar(b.como)}</p>${b.tip ? `<p class="tip">💡 ${marcar(b.tip)}</p>` : ""}</div>`;
  }
  return "";
}

const indice = SECCIONES.map((s, i) => `<li><span>${i + 1}.</span> ${s.icono} ${esc(s.titulo)}</li>`).join("");
const cuerpo = SECCIONES.map((s, i) => `<section><h2>${i + 1}. ${s.icono} ${esc(s.titulo)}</h2>${s.bloques.map(bloque).join("")}</section>`).join("");

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Manual de uso · AgroSol Cesar</title><style>
@page { size: A4; margin: 18mm 15mm 18mm 15mm;
  @bottom-center { content: "AgroSol Cesar · Manual de uso · página " counter(page); font: 9pt "Segoe UI", Arial, sans-serif; color: #5d6b60; } }
@page :first { margin: 0; @bottom-center { content: none; } }
* { box-sizing: border-box; }
body { font: 10.5pt/1.5 "Segoe UI", Arial, sans-serif; color: #1d2a1f; margin: 0; }
.portada { height: 297mm; padding: 28mm 22mm; color: #fff; background: radial-gradient(ellipse at 50% 100%, #2a3f86 0%, #101a45 50%, #05081c 100%); display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
.portada .marca { letter-spacing: .18em; font-size: 9.5pt; opacity: .85; text-transform: uppercase; }
.portada h1 { font-size: 40pt; line-height: 1.05; margin: 14mm 0 6mm; }
.portada h1 small { display: block; font-size: 17pt; font-weight: 400; margin-top: 5mm; color: #cfe3ff; }
.portada .pie { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; font-size: 10.5pt; }
.portada img.qr { width: 34mm; height: 34mm; background: #fff; padding: 2mm; border-radius: 3mm; }
.portada .logo { width: 30mm; height: 30mm; }
h2 { font-size: 16pt; color: #2f7d43; border-bottom: 2px solid #cfe5d2; padding-bottom: 2mm; margin: 0 0 4mm; page-break-after: avoid; }
section { margin-bottom: 8mm; }
h3 { font-size: 11.5pt; margin: 0 0 1.5mm; color: #1b5e87; }
p { margin: 2mm 0; } ul, ol { margin: 2mm 0 3mm; padding-left: 6mm; } li { margin: 1mm 0; }
code { background: #eef3ee; padding: 0 1.2mm; border-radius: 1mm; font-size: 9.5pt; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9.5pt; }
th, td { border: 1px solid #d3dccf; padding: 1.6mm 2.2mm; text-align: left; vertical-align: top; }
thead th { background: #e6f2e8; } tr { page-break-inside: avoid; }
.ficha { border: 1px solid #d3dccf; border-left: 1.6mm solid #3f9b52; border-radius: 2mm; padding: 2.5mm 4mm; margin: 3mm 0; page-break-inside: avoid; }
.aviso { background: #fff1d6; border-left: 1.6mm solid #e8a317; padding: 2.5mm 4mm; margin: 3mm 0; border-radius: 2mm; }
.tip { background: #fff8e1; padding: 1.2mm 2.5mm; border-radius: 1.5mm; }
.indice h2 { margin-top: 0; } .indice ol { list-style: none; padding: 0; columns: 2; font-size: 11pt; } .indice li { margin: 2mm 0; } .indice li span { color: #2f7d43; font-weight: 700; display: inline-block; width: 6mm; }
.fin { color: #5d6b60; font-size: 9pt; margin-top: 8mm; }
</style></head><body>
<div class="portada">
  <div><div class="marca">NASA Space Apps Challenge 2026 · Bosconia, Cesar, Colombia</div>
  <h1>AgroSol Cesar<small>Manual de uso de la plataforma</small></h1>
  <p style="font-size:12pt;max-width:120mm;color:#dbe7ff">La estación que escucha el suelo y el cielo: qué hace cada apartado, cómo leerlo y cómo resolver las dudas más comunes.</p></div>
  <div class="pie">
    <div><b>Equipo Galactic Devs</b><br>Colegio Carlos Restrepo Araujo (INSTECREA)<br>Reto “Field Shift: Adapting Farms with NASA Data”<br><br>${esc(URL_PLATAFORMA)}<br>Versión: ${esc(MANUAL_VERSION)}</div>
    <img class="qr" src="data:image/png;base64,${b64("qr-agrosol.png")}" alt="Código QR de la plataforma">
  </div>
</div>
<div class="indice"><section><h2>Contenido</h2><ol>${indice}</ol></section></div>
${cuerpo}
<p class="fin">AgroSol Cesar es una guía educativa que apoya la decisión del agricultor; no la reemplaza. Confirma las recomendaciones con un agrónomo o la UMATA. · ${esc(URL_PLATAFORMA)}</p>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "manual-"));
const archivo = path.join(tmp, "manual.html");
fs.writeFileSync(archivo, html);
const salida = path.join(RAIZ, "public", "manual-agrosol.pdf");
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${salida}`, pathToFileURL(archivo).href], { stdio: "ignore", timeout: 120000 });
fs.copyFileSync(archivo, path.join(tmp, "manual-copia.html"));
console.log("PDF generado:", salida, Math.round(fs.statSync(salida).size / 1024) + " KB");
