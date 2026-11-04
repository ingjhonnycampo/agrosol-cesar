import Medidor from "./Medidor.jsx";
import { nivelesMedidores } from "../lib/semaforo.js";

const coma = (v) => String(v).replace(".", ",");

// Los 8 medidores de "Ahora mismo". Cuatro de ellos cambian de color según el estado del cultivo.
export default function Medidores({ u, res }) {
  const n = nivelesMedidores(u);
  return (
    <div className="rejilla">
      <Medidor titulo="Temperatura del aire" valor={u.temp} unidad="°C" min={15} max={45} color="#e4572e" nivel={n.temp} decimales={1}
        nota={res.tmaxHoy !== null ? `Hoy: mín ${coma(res.tminHoy)} · máx ${coma(res.tmaxHoy)} °C` : ""} />
      <Medidor titulo="Temperatura del suelo" valor={u.tsuelo} unidad="°C" min={15} max={50} color="#a0522d" nivel={n.tsuelo} decimales={1}
        nota="A 10 cm de profundidad" />
      <Medidor titulo="Humedad del suelo 10 cm" valor={u.suelo10} unidad="%" color="#2e86ab" nivel={n.suelo10}
        nota="Donde están las raíces jóvenes" />
      <Medidor titulo="Humedad del suelo 30 cm" valor={u.suelo30} unidad="%" color="#1b5e87" nivel={n.suelo30}
        nota="Reserva de agua profunda" />
      <Medidor titulo="Lluvia de hoy" valor={res.lluviaHoy} unidad="mm" max={50} color="#3d5af1" decimales={1}
        nota={`Últimas 24 h: ${coma(res.lluvia24h)} mm`} />
      <Medidor titulo="Luz del sol" valor={u.luz} unidad="%" color="#f6b73c"
        nota={u.luz >= 60 ? "Pleno día" : u.luz >= 8 ? "Amanecer / atardecer" : "Noche"} />
      <Medidor titulo="Hoja del cultivo" valor={u.hoja} unidad="%" color="#3f9b52" nivel={n.hoja}
        nota={"Estado: " + u.hojaEstado} />
      <Medidor titulo="Viento" valor={u.vientoKmh} unidad="km/h" max={30} color="#7b6cd9" decimales={1}
        nota={u.vientoKmh === 0 ? "Calma (o brisa muy suave)" : ""} />
    </div>
  );
}
