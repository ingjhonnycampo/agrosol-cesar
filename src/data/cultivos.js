// ===== AGROSOL · CULTIVOS DE REFERENCIA PARA EL CESAR =====
// IMPORTANTE: los rangos de clima, agua, pH y ciclo son VALORES DE REFERENCIA GENERALES de agronomía
// (del orden de lo que publican FAO y AGROSAVIA). No se pudieron verificar uno por uno contra la fuente
// original, y varían con la variedad y el manejo. Deben ser revisados por un agrónomo o la UMATA de
// Bosconia antes de presentarse como recomendación técnica.
// `mercado` (1 a 5) es una ESTIMACIÓN del equipo para poder priorizar: debe validarse con comerciantes locales.
// `enCesar` indica si el cultivo aparece en las fuentes consultadas como presente en el departamento.

export const FUENTES = [
  {
    id: "upra",
    texto: "UPRA, Microanálisis Evaluaciones Agropecuarias (EVA) 2023, Cesar: palma de aceite, maíz, café, arroz, yuca, cacao y plátano como cultivos de mayor área.",
    url: "https://upra.gov.co/Kit_Territorial/2-%20Informaci%C3%B3n%20por%20Departamentos/CESAR/3-%20Microan%C3%A1lisis%20Evaluaciones%20agropecuarias%202023-Cesar.pdf",
    nota: "Las cifras salieron de un resumen de búsqueda: el PDF no se pudo abrir en esta revisión.",
  },
  {
    id: "silla",
    texto: "La Silla Vacía, sobre la agricultura del Cesar: yuca, plátano, caña panelera y cítricos; entre los transitorios, arroz, maíz, ahuyama y patilla.",
    url: "https://www.lasillavacia.com/?p=51048",
  },
  {
    id: "icbf",
    texto: "ICBF, Recetario del Cesar: maíz, arroz, sorgo, café, caña, yuca, algodón, cacao, ajonjolí y plátano como cultivos del departamento.",
    url: "https://m.icbf.gov.co/sites/default/files/recetario_cesar_print.pdf",
  },
  {
    id: "frijol",
    texto: "AGROSAVIA y CIAT sobre fríjol adaptado al calor del Caribe colombiano: ciclo de unos 65 días y humedad cercana a capacidad de campo al inicio.",
    url: "https://www.agronegocios.co/agricultura/investigan-una-variedad-de-frijol-resistente-al-calor-del-caribe-colombiano-3031630",
  },
  {
    id: "rotacion",
    texto: "Rotación gramíneas–leguminosas: las leguminosas dejan nitrógeno disponible para el cultivo siguiente (en un ensayo con maíz, equivalió a unos 60 kg de N por hectárea).",
    url: "https://dialnet.unirioja.es/descarga/articulo/8990951.pdf",
  },
  {
    id: "general",
    texto: "Rangos de temperatura, agua, pH y ciclo de cada cultivo: valores de referencia generales de agronomía (tipo FAO EcoCrop y FAO-56). No verificados uno por uno en esta revisión.",
    url: null,
    nota: "El sitio de la FAO no se pudo consultar. Validar con AGROSAVIA o la UMATA.",
  },
];

export const GRUPOS = {
  cereal: "Cereales",
  leguminosa: "Leguminosas",
  raiz: "Raíces y tubérculos",
  cucurbitacea: "Cucurbitáceas",
  hortaliza: "Hortalizas",
  fibra: "Fibra y semillas",
  musacea: "Plátano",
};

// agua: mm por ciclo (lluvia + riego). ciclo: días. temp: media del ciclo, °C. ph.opt: ideal, ph.tol: tolera.
export const CULTIVOS = [
  {
    id: "maiz", nombre: "Maíz", emoji: "🌽", grupo: "cereal", familia: "Poaceae (gramíneas)",
    ciclo: [100, 130], temp: { opt: [20, 30], tol: [15, 35] }, agua: [500, 800],
    ph: { opt: [5.8, 7.0], tol: [5.5, 7.8] }, suelo: "Franco, profundo y con buen drenaje",
    exigenciaN: "alta", fijaN: false, sequia: "media", sales: "media", mercado: 3, enCesar: "confirmado",
    nota: "Muy sensible a la falta de agua en la floración. Gasta mucho nitrógeno: va bien después de una leguminosa.",
  },
  {
    id: "arroz", nombre: "Arroz (secano)", emoji: "🍚", grupo: "cereal", familia: "Poaceae (gramíneas)",
    ciclo: [110, 140], temp: { opt: [22, 32], tol: [20, 35] }, agua: [800, 1500],
    ph: { opt: [5.5, 7.0], tol: [5.0, 7.5] }, suelo: "Arcilloso o franco-arcilloso, que retenga agua",
    exigenciaN: "alta", fijaN: false, sequia: "baja", sales: "sensible", mercado: 3, enCesar: "confirmado",
    nota: "Necesita mucha agua. Con riego sube el requerimiento. No conviene repetirlo en el mismo lote.",
  },
  {
    id: "sorgo", nombre: "Sorgo", emoji: "🌾", grupo: "cereal", familia: "Poaceae (gramíneas)",
    ciclo: [90, 120], temp: { opt: [24, 32], tol: [18, 38] }, agua: [400, 600],
    ph: { opt: [5.5, 7.5], tol: [5.0, 8.5] }, suelo: "Casi cualquier suelo con drenaje",
    exigenciaN: "media", fijaN: false, sequia: "alta", sales: "tolerante", mercado: 2, enCesar: "confirmado",
    nota: "Aguanta calor y sequía mejor que el maíz. Buena opción para temporadas secas.",
  },
  {
    id: "algodon", nombre: "Algodón", emoji: "☁️", grupo: "fibra", familia: "Malvaceae",
    ciclo: [150, 180], temp: { opt: [22, 32], tol: [18, 36] }, agua: [700, 1300],
    ph: { opt: [6.0, 7.5], tol: [5.5, 8.0] }, suelo: "Franco a franco-arcilloso, profundo",
    exigenciaN: "media", fijaN: false, sequia: "media", sales: "tolerante", mercado: 2, enCesar: "confirmado",
    nota: "Ciclo largo y muy atacado por plagas. En el Cesar fue muy importante y ha bajado.",
  },
  {
    id: "yuca", nombre: "Yuca", emoji: "🥔", grupo: "raiz", familia: "Euphorbiaceae",
    ciclo: [240, 360], temp: { opt: [22, 29], tol: [18, 35] }, agua: [800, 1500],
    ph: { opt: [5.5, 6.5], tol: [4.5, 7.5] }, suelo: "Suelto, franco-arenoso, sin encharcamiento",
    exigenciaN: "baja", fijaN: false, sequia: "alta", sales: "sensible", mercado: 4, enCesar: "confirmado",
    nota: "Resiste la sequía, pero se pudre si el suelo se encharca. Sirve en suelos pobres.",
  },
  {
    id: "platano", nombre: "Plátano", emoji: "🍌", grupo: "musacea", familia: "Musaceae",
    ciclo: [300, 420], temp: { opt: [24, 30], tol: [20, 35] }, agua: [1200, 2200],
    ph: { opt: [5.5, 7.0], tol: [5.0, 7.5] }, suelo: "Franco, profundo y bien drenado",
    exigenciaN: "alta", fijaN: false, sequia: "baja", sales: "sensible", mercado: 4, enCesar: "confirmado",
    nota: "Cultivo casi permanente. Necesita agua constante y potasio; el viento fuerte lo tumba.",
  },
  {
    id: "name", nombre: "Ñame", emoji: "🍠", grupo: "raiz", familia: "Dioscoreaceae",
    ciclo: [240, 300], temp: { opt: [25, 30], tol: [20, 35] }, agua: [1000, 1500],
    ph: { opt: [5.5, 6.5], tol: [5.0, 7.0] }, suelo: "Franco suelto y profundo, con buen drenaje",
    exigenciaN: "media", fijaN: false, sequia: "media", sales: "sensible", mercado: 4, enCesar: "por confirmar",
    nota: "Típico del Caribe colombiano. Pide tutores y suelo suelto. No confirmado en las fuentes del Cesar consultadas.",
  },
  {
    id: "ahuyama", nombre: "Ahuyama", emoji: "🎃", grupo: "cucurbitacea", familia: "Cucurbitaceae",
    ciclo: [90, 120], temp: { opt: [20, 30], tol: [15, 35] }, agua: [400, 600],
    ph: { opt: [6.0, 7.0], tol: [5.5, 7.5] }, suelo: "Franco, rico en materia orgánica",
    exigenciaN: "media", fijaN: false, sequia: "media", sales: "media", mercado: 3, enCesar: "confirmado",
    nota: "Ciclo corto y rústico. Sus hojas grandes cubren el suelo y reducen malezas.",
  },
  {
    id: "patilla", nombre: "Patilla", emoji: "🍉", grupo: "cucurbitacea", familia: "Cucurbitaceae",
    ciclo: [75, 100], temp: { opt: [22, 32], tol: [18, 35] }, agua: [400, 600],
    ph: { opt: [6.0, 7.0], tol: [5.5, 7.5] }, suelo: "Franco-arenoso, bien drenado",
    exigenciaN: "media", fijaN: false, sequia: "media", sales: "sensible", mercado: 4, enCesar: "confirmado",
    nota: "Ciclo corto. No tolera encharcamiento y sufre con exceso de lluvia en la cosecha.",
  },
  {
    id: "frijol", nombre: "Fríjol", emoji: "🫘", grupo: "leguminosa", familia: "Fabaceae (leguminosas)",
    ciclo: [65, 90], temp: { opt: [18, 28], tol: [15, 32] }, agua: [300, 500],
    ph: { opt: [6.0, 7.0], tol: [5.5, 7.5] }, suelo: "Franco, suelto y bien drenado",
    exigenciaN: "baja", fijaN: true, sequia: "media", sales: "sensible", mercado: 4, enCesar: "por confirmar",
    nota: "Fija nitrógeno y deja el suelo mejor para el cultivo siguiente. Sufre con calor fuerte en la floración.",
  },
  {
    id: "aji", nombre: "Ají", emoji: "🌶️", grupo: "hortaliza", familia: "Solanaceae",
    ciclo: [120, 180], temp: { opt: [20, 30], tol: [15, 35] }, agua: [600, 900],
    ph: { opt: [6.0, 7.0], tol: [5.5, 7.5] }, suelo: "Franco, rico en materia orgánica, con drenaje",
    exigenciaN: "alta", fijaN: false, sequia: "baja", sales: "sensible", mercado: 5, enCesar: "por confirmar",
    nota: "Mejor con riego. No sembrar después de tomate, berenjena o papa (misma familia). No confirmado en las fuentes del Cesar.",
  },
  {
    id: "ajonjoli", nombre: "Ajonjolí", emoji: "🌱", grupo: "fibra", familia: "Pedaliaceae",
    ciclo: [90, 110], temp: { opt: [25, 30], tol: [20, 35] }, agua: [300, 500],
    ph: { opt: [5.5, 7.5], tol: [5.0, 8.0] }, suelo: "Franco, bien drenado",
    exigenciaN: "baja", fijaN: false, sequia: "alta", sales: "media", mercado: 3, enCesar: "confirmado",
    nota: "Muy resistente a la sequía. Se cosecha en época seca; no aguanta encharcamiento.",
  },
];

export const cultivoPorId = (id) => CULTIVOS.find((c) => c.id === id) || null;
