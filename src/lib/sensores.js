// Lista de magnitudes que la página sabe graficar. Cada id es un campo de las filas limpias.
export const SENSORES = [
  { id: "temp", nombre: "Temperatura del aire", corto: "Temp. aire", unidad: "°C", color: "#e4572e", dec: 1 },
  { id: "tsuelo", nombre: "Temperatura del suelo", corto: "Temp. suelo", unidad: "°C", color: "#a0522d", dec: 1 },
  { id: "suelo10", nombre: "Humedad del suelo 10 cm", corto: "Suelo 10 cm", unidad: "%", color: "#2e86ab", dec: 0 },
  { id: "suelo30", nombre: "Humedad del suelo 30 cm", corto: "Suelo 30 cm", unidad: "%", color: "#1b5e87", dec: 0 },
  { id: "lluviaMm", nombre: "Lluvia", corto: "Lluvia", unidad: "mm", color: "#3d5af1", dec: 1, barras: true },
  { id: "luz", nombre: "Luz del sol", corto: "Luz", unidad: "%", color: "#f6b73c", dec: 0 },
  { id: "hoja", nombre: "Hoja del cultivo", corto: "Hoja", unidad: "%", color: "#3f9b52", dec: 0 },
  { id: "vientoKmh", nombre: "Viento", corto: "Viento", unidad: "km/h", color: "#7b6cd9", dec: 1 },
];

export const sensorPorId = (id) => SENSORES.find((s) => s.id === id);
