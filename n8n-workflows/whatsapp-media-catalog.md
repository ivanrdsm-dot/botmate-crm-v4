# BotMate — Catálogo de Media para WhatsApp
# Copia estos bloques directo en los nodos de n8n

---

## URLS DE IMÁGENES (funcionan en WhatsApp como image link)

```
BellaBot    → https://botmate.mx/wp-content/uploads/2025/05/BellaBot-207x300.png
PuduBot 2   → https://botmate.mx/wp-content/uploads/2025/05/PuduBot2-231x300.png
CC1         → https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png
KettyBot    → https://botmate.mx/wp-content/uploads/2025/05/KettyBot-117x300.png
SwiftBot    → https://botmate.mx/wp-content/uploads/2025/05/PuduSwiftBot-129x300.png
```

## URLS DE PÁGINAS CON VIDEO

```
BellaBot    → https://botmate.mx/bellabot/
PuduBot 2   → https://botmate.mx/pudubot-2/
CC1         → https://botmate.mx/pudu-cc1/
KettyBot    → https://botmate.mx/kettybot/
SwiftBot    → https://botmate.mx/pudu-swiftbot/
Todos       → https://botmate.mx/robots/
```

## ONE-PAGER PDF (para mandar como documento)

```
PDF → https://botmate-war-room.vercel.app/assets/onepage-botmate.pdf
IMG → https://botmate-war-room.vercel.app/assets/onepage-botmate.jpg
```

---

## CASOS DE ÉXITO REALES POR SECTOR

### RESTAURANTE
**Cliente:** Cadena restaurantera 120 cubiertos, CDMX
**Robot:** BellaBot
**Antes:** 8 personas de servicio → rotación constante, ausencias lunes, IMSS caro
**Después:** 4 personas + 1 BellaBot
**Resultado:** Ahorro *$56,000 MXN/mes*. +28% reseñas positivas en Google.
**Tiempo implementación:** 3 días
**Clientes similares:** Alsea · Pollo Pepe · Grupo WOW · Grupo Trimex

### HOTEL
**Cliente:** Cadena hotelera, Cancún
**Robot:** CC1 (áreas comunes) + PuduBot 2 (room service)
**Antes:** 3 turnos de limpieza, ausentismo, costos variables
**Después:** 1 CC1 cubre los 3 turnos + PuduBot 2 para delivery a cuartos
**Resultado:** *−40% costo de limpieza* áreas comunes. ROI en *3 meses*.
**Clientes similares:** Hilton · Grupo Brisas · The Palace Company · Secrets Resorts

### HOSPITAL
**Cliente:** CHRISTUS MUGUERZA
**Robot:** CC1
**Antes:** Personal de higiene no podía sostener frecuencias en todos los turnos
**Después:** CC1 en zonas comunes + pasillos, genera reporte automático de cobertura
**Resultado:** *−31% incidentes nosocomiales* en zonas comunes. 6 meses de operación.
**Clientes similares:** Hospitales Puerta de Hierro · Hospitales MAC · CHRISTUS MUGUERZA

### RETAIL
**Cliente:** Tienda departamental, CDMX
**Robot:** CC1
**Antes:** Personal de limpieza visible interrumpía experiencia de compra
**Después:** CC1 opera en horario de apertura, invisible para el cliente
**Resultado:** *+$500,000 MXN en ventas* en las primeras 2 semanas. 0 interrupciones.
**Clientes similares:** Walmart · The Home Depot · HEB México · Shasa

### MANUFACTURA
**Cliente:** Planta Bayer México
**Robot:** CC1
**Antes:** Limpieza nocturna cubría solo 60% del área. Riesgo en auditorías ISO.
**Después:** Piloto 4 semanas → compraron 3 unidades CC1
**Resultado:** *Ahorro $94,000 MXN/mes*. Auditorías ISO sin observaciones.
**Clientes similares:** General Motors · Mubea · Bayer México

---

## NODO: Code — Robot Detector (pegar en n8n Code node)

Este nodo lee el sector del lead y devuelve imagen, URL, specs y caso de éxito.
Úsalo ANTES de los nodos de Claude y WhatsApp media.

```javascript
// ── ROBOT DETECTOR — BotMate ──────────────────────────────────────────
const sector = ($input.item.json.sector || $input.item.json.industria || "corporativo")
  .toLowerCase()
  .normalize("NFD").replace(/[̀-ͯ]/g, ""); // quitar acentos

const CATALOG = {
  restaurante: {
    robot:    "BellaBot",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/BellaBot-207x300.png",
    url:      "https://botmate.mx/bellabot/",
    specs:    "Pantalla con expresiones · 4 bandejas · 40kg · interacción activa con comensales · autonomía 12h",
    uso:      "servicio a mesa, entrega de platillos y bebidas, experiencia premium al comensal",
    precio:   "$17,500/mes",
    caso:     "Restaurante 120 cubiertos CDMX: bajó de 8 a 4 meseros. Ahorro neto: $56,000 MXN/mes.",
    clientes: "Alsea · Pollo Pepe · Grupo WOW · Grupo Trimex",
    pain:     "El 87% de meseros rota cada año. Cada baja cuesta $8K–$15K MXN.",
  },
  hotel: {
    robot:    "PuduBot 2",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/PuduBot2-231x300.png",
    url:      "https://botmate.mx/pudubot-2/",
    specs:    "3 bandejas de inducción · pantalla interactiva · sensores 3D · hasta 30kg",
    uso:      "room service autónomo, delivery de pisos, amenities a cuartos",
    precio:   "$17,500/mes",
    caso:     "Cadena hotelera Cancún: −40% costo limpieza áreas comunes. ROI en 3 meses.",
    clientes: "Hilton · Grupo Brisas · The Palace Company · Secrets Resorts",
    pain:     "62% del costo operativo hotelero es personal. El room service falla primero con el ausentismo.",
  },
  hospital: {
    robot:    "CC1",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png",
    url:      "https://botmate.mx/pudu-cc1/",
    specs:    "Barre + friega + mopea + aspira · 500mm área limpieza · 18h autonomía · reporte automático de cobertura",
    uso:      "higiene autónoma de pasillos y zonas comunes hospitalarias, cumplimiento de protocolos",
    precio:   "$17,500/mes",
    caso:     "CHRISTUS MUGUERZA: −31% incidentes nosocomiales en zonas comunes. 6 meses operando.",
    clientes: "Hospitales Puerta de Hierro · Hospitales MAC · CHRISTUS MUGUERZA",
    pain:     "Los protocolos de higiene hospitalaria requieren frecuencias que el personal no puede sostener.",
  },
  manufactura: {
    robot:    "CC1",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png",
    url:      "https://botmate.mx/pudu-cc1/",
    specs:    "Industrial · pisos rugosos y rampas · 18h autonomía · 3 turnos cubiertos por 1 unidad",
    uso:      "limpieza industrial autónoma, 3 turnos sin personal nocturno, cumplimiento ISO",
    precio:   "$17,500/mes",
    caso:     "Bayer México: piloto 4 semanas → compraron 3 CC1. Ahorro documentado: $94,000 MXN/mes.",
    clientes: "Bayer México · General Motors · Mubea",
    pain:     "Limpieza nocturna cubre solo el 60% del área. Riesgo ISO, riesgo de auditorías fallidas.",
  },
  retail: {
    robot:    "CC1",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png",
    url:      "https://botmate.mx/pudu-cc1/",
    specs:    "Opera en pasillos de 80cm · detecta peatones · esquiva carritos · funciona en horario de apertura",
    uso:      "limpieza autónoma de piso de venta sin interrumpir al cliente",
    precio:   "$17,500/mes",
    caso:     "Tienda departamental CDMX: +$500,000 MXN en ventas en las primeras 2 semanas tras implementar.",
    clientes: "Walmart · The Home Depot · HEB México · Shasa",
    pain:     "Personal de limpieza visible interrumpe la experiencia de compra. Piso sucio = accidentes y reclamaciones.",
  },
  corporativo: {
    robot:    "CC1",
    img:      "https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png",
    url:      "https://botmate.mx/pudu-cc1/",
    specs:    "Silencioso · pasillos de oficina · genera reporte de cobertura · carga inalámbrica automática",
    uso:      "limpieza autónoma de oficinas, pasillos y áreas comunes corporativas",
    precio:   "$17,500/mes",
    caso:     "40+ empresas en México. ROI promedio documentado: 4–6 meses.",
    clientes: "Axtel · Dart Container · Teletón · voestalpine",
    pain:     "1 persona de limpieza cuesta $19K+ MXN/mes real (IMSS, aguinaldo, finiquitos). El robot: $17,500 fijos.",
  },
};

// Detect sector
let match = "corporativo";
for (const key of Object.keys(CATALOG)) {
  if (sector.includes(key) || 
      (key === "restaurante" && /restaur|cafet|cantina|bar|gastro|food|taqueria/.test(sector)) ||
      (key === "hotel" && /hotel|resort|hostal|hospedaje|spa/.test(sector)) ||
      (key === "hospital" && /hospital|clinica|salud|medic|dental|laboratorio/.test(sector)) ||
      (key === "manufactura" && /manufactur|fabrica|planta|industrial|logistica|almacen|bodega/.test(sector)) ||
      (key === "retail" && /retail|tienda|supermercado|comercio|departamental|mall/.test(sector))) {
    match = key;
    break;
  }
}

const bot = CATALOG[match];

return {
  sector:        match,
  robotNombre:   bot.robot,
  robotImg:      bot.img,
  robotUrl:      bot.url,
  robotSpecs:    bot.specs,
  robotUso:      bot.uso,
  robotPrecio:   bot.precio,
  casoExito:     bot.caso,
  clientesSector: bot.clientes,
  painSector:    bot.pain,
  // Pass through lead data
  nombre:        $input.item.json.nombre || $input.item.json.Name || "",
  empresa:       $input.item.json.empresa || $input.item.json.Empresa || "",
  telefono:      $input.item.json.telefono || $input.item.json.Telefono || "",
  leadId:        $input.item.json.id || $input.item.json.leadId || "",
};
```

---

## NODO: WhatsApp — Enviar IMAGEN del Robot (HTTP Request)

Reemplaza el nodo de texto del D2 por ESTO para mandar imagen + caption:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{ $json.telefono }}",
  "type": "image",
  "image": {
    "link": "{{ $json.robotImg }}",
    "caption": "Este es el {{ $json.robotNombre }} — el robot para {{ $json.sector }}.\n\n✅ {{ $json.robotSpecs }}\n\n💡 Caso real: {{ $json.casoExito }}\n\n👉 Ver más: {{ $json.robotUrl }}"
  }
}
```

---

## NODO: WhatsApp — Enviar ONE-PAGER como Documento

Para el D5 o cuando piden información completa:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{ $json.telefono }}",
  "type": "document",
  "document": {
    "link": "https://botmate-war-room.vercel.app/assets/onepage-botmate.pdf",
    "caption": "📋 BotMate — Catálogo completo de robots y casos de éxito",
    "filename": "BotMate-Robots-2025.pdf"
  }
}
```

---

## PROMPTS ACTUALIZADOS PARA CLAUDE — PEGAR EN n8n

### MENSAJE 1 — D1 (Hook personalizado)

**System prompt:**
```
Eres Ivan Cadavieco, Fundador de BotMate Mexico. Escribes el PRIMER mensaje de WhatsApp a un prospecto. 

REGLAS ABSOLUTAS:
- Máximo 100 palabras
- NO menciones links todavía
- Termina con UNA sola pregunta abierta
- Tono conversacional, como si lo conocieras de vista
- NO suenes a spam ni a mensaje masivo
- Firma: "— Ivan, BotMate.mx"

DATOS DEL ROBOT PARA SU SECTOR (úsalos en el contexto):
Robot: {{$json.robotNombre}}
Uso: {{$json.robotUso}}
Pain del sector: {{$json.painSector}}
Clientes similares: {{$json.clientesSector}}

CONTEXTO EMPRESA:
BotMate Mexico renta robots autónomos. Precio: $17,500/mes todo incluido (mantenimiento, soporte 24/7, capacitación).
Demo gratis: https://calendar.app.google/zq731y653cuoeu7m9
```

**User message:**
```
Escribe el Mensaje 1 para:
Nombre: {{$json.nombre}}
Empresa: {{$json.empresa}}
Sector: {{$json.sector}}
Robot recomendado: {{$json.robotNombre}}
Pain principal del sector: {{$json.painSector}}
```

---

### MENSAJE 2 — D2 (Caso de éxito en texto, ANTES de mandar imagen)

**System prompt:**
```
Eres Ivan Cadavieco de BotMate Mexico. Escribes el SEGUNDO mensaje de WhatsApp (Día 2). Ya le enviaste una imagen del robot — ahora amplías con el caso de éxito.

REGLAS:
- Máximo 120 palabras
- Menciona el caso de éxito real de su sector con números concretos
- Ofrece agendar 20 minutos de demo
- Incluye el link: https://calendar.app.google/zq731y653cuoeu7m9
- Firma: "— Ivan, BotMate.mx"
```

**User message:**
```
Mensaje 2 para:
Nombre: {{$json.nombre}}
Empresa: {{$json.empresa}}
Sector: {{$json.sector}}
Robot: {{$json.robotNombre}}
Caso de éxito real: {{$json.casoExito}}
Clientes similares: {{$json.clientesSector}}
```

---

### MENSAJE 3 — D5 (ROI + PDF)

**System prompt:**
```
Eres Ivan Cadavieco de BotMate Mexico. Escribes el TERCER mensaje (Día 5). Ya recibieron la imagen del robot y el caso de éxito. Ahora vas al ROI concreto.

REGLAS:
- Máximo 130 palabras
- Compara costo robot ($17,500/mes) vs costo real de personal del sector
- Da los números de AHORRO mensual
- Menciona que adjuntaste el one-pager con todos los casos y precios
- CTA claro: agendar 20 minutos
- Link: https://calendar.app.google/zq731y653cuoeu7m9
- Firma: "— Ivan, BotMate.mx"

DATOS DE ROI:
Robot: {{$json.robotNombre}} = $17,500/mes todo incluido
Personal equivalente en México: $19,000–$24,000/mes real (IMSS + salario + prestaciones + rotación)
El robot trabaja 16h/día, 7 días. El empleado: 8h/día, 5-6 días.
```

**User message:**
```
Mensaje 3 ROI para:
Nombre: {{$json.nombre}}
Empresa: {{$json.empresa}}
Sector: {{$json.sector}}
Robot: {{$json.robotNombre}}
Caso de éxito: {{$json.casoExito}}
Pain del sector: {{$json.painSector}}
```

---

### MENSAJE 4 — D8 (Urgencia real)

**System prompt:**
```
Eres Ivan Cadavieco de BotMate Mexico. Escribes el CUARTO mensaje (Día 8). Creas urgencia genuina.

REGLAS:
- Máximo 110 palabras
- Menciona que hay demanda alta de robots en su sector específico
- Ofrece cotización personalizada SIN costo
- Pide 15 minutos de llamada o propón 2 opciones de día/hora
- Link: https://calendar.app.google/zq731y653cuoeu7m9
- NUNCA seas agresivo ni presiones — urgencia sutil y real
- Firma: "— Ivan, BotMate.mx"
```

**User message:**
```
Mensaje 4 urgencia para:
Nombre: {{$json.nombre}}
Empresa: {{$json.empresa}}
Sector: {{$json.sector}}
Robot: {{$json.robotNombre}}
```

---

### MENSAJE 5 — D12 (Breakup elegante)

**System prompt:**
```
Eres Ivan Cadavieco de BotMate Mexico. Este es el ÚLTIMO mensaje (Día 12). Es el breakup — sales con gracia y dejas la puerta abierta.

REGLAS:
- Máximo 90 palabras
- Reconoce que no has recibido respuesta — sin presión ni resentimiento
- Deja en claro que la puerta está abierta para cuando lo necesiten
- Un último CTA muy suave
- Link final: https://calendar.app.google/zq731y653cuoeu7m9
- Tono: cálido, humano, sin drama
- Firma: "— Ivan, BotMate.mx"
```

**User message:**
```
Último mensaje (breakup) para:
Nombre: {{$json.nombre}}
Empresa: {{$json.empresa}}
Sector: {{$json.sector}}
```

---

## FLUJO ACTUALIZADO DEL WORKFLOW 3

```
Webhook → Airtable (obtener lead) → Set Contexto
    ↓
[NUEVO] Code: Robot Detector ← agrega este nodo aquí
    ↓
Claude D1: Generar texto personalizado
    ↓
WhatsApp: Enviar texto D1
    ↓
Airtable: Actualizar D1
    ↓
Wait 2 días
    ↓
[NUEVO] WhatsApp: Enviar IMAGEN del robot ← tipo: image, no text
    ↓
Claude D2: Generar texto caso de éxito
    ↓
WhatsApp: Enviar texto D2
    ↓
Airtable: Actualizar D2
    ↓
Wait 3 días
    ↓
[NUEVO] WhatsApp: Enviar PDF one-pager ← tipo: document
    ↓
Claude D5: Generar texto ROI
    ↓
WhatsApp: Enviar texto D5
    ↓
...resto igual (D8, D12)
```

---

---

## NODO: Code — Parsear Respuesta Claude (INBOUND)

Este nodo va DESPUÉS del HTTP Request de Claude y ANTES del nodo de WhatsApp.
Extrae el JSON que devuelve Claude y lo estructura para los nodos siguientes.

```javascript
// Parsear respuesta de Claude — extrae JSON del content
const rawContent = $input.item.json.content?.[0]?.text || 
                   $input.item.json.choices?.[0]?.message?.content || 
                   $input.item.json.content || "";

let parsed = {};
try {
  // Extraer JSON del texto (puede venir con texto extra)
  const match = rawContent.match(/\{[\s\S]*\}/);
  if (match) {
    parsed = JSON.parse(match[0]);
  }
} catch (e) {
  // Si Claude no devolvió JSON válido, usar el texto como mensaje
  parsed = {
    mensaje: rawContent.slice(0, 500),
    enviarMedia: false,
    tipoMedia: null,
    mediaUrl: null,
    mediaCaption: null,
    accion: "SEGUIMIENTO",
    notaInterna: "Claude no devolvió JSON válido — revisar prompt"
  };
}

return {
  // Del contexto del lead (pasa por aquí también)
  telefono:     $('Code: Robot Detector').item.json.telefono,
  nombre:       $('Code: Robot Detector').item.json.nombre,
  empresa:      $('Code: Robot Detector').item.json.empresa,
  leadId:       $('Code: Robot Detector').item.json.leadId,
  // De Claude
  mensajeWA:    parsed.mensaje || "",
  enviarMedia:  parsed.enviarMedia === true,
  tipoMedia:    parsed.tipoMedia || null,
  mediaUrl:     parsed.mediaUrl || null,
  mediaCaption: parsed.mediaCaption || "",
  accion:       parsed.accion || "SEGUIMIENTO",
  notaInterna:  parsed.notaInterna || "",
};
```

---

## NODO: WhatsApp — Enviar Media (Condicional)

Este nodo SOLO se ejecuta si `enviarMedia = true` (usa un IF node antes).

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{{ $json.telefono }}",
  "type": "{{ $json.tipoMedia }}",
  "{{ $json.tipoMedia }}": {
    "link": "{{ $json.mediaUrl }}",
    "caption": "{{ $json.mediaCaption }}"
  }
}
```

Para documentos, agrega también `"filename": "BotMate-Robots-2025.pdf"` dentro del objeto document.

---

## NODO: Code — Robot Detector para INBOUND (respuestas entrantes)

Cuando el prospecto responde y menciona un robot específico:

```javascript
// Detecta robot mencionado en el mensaje del prospecto
const msg = ($input.item.json.mensaje || "").toLowerCase();

let robotDetectado = null;

if (/bella|mesero|mesa|restaur|camarero|comida|platillo|bandeja/.test(msg)) {
  robotDetectado = "BellaBot";
} else if (/pudu|room service|cuarto|hotel|delivery|habitacion|piso/.test(msg)) {
  robotDetectado = "PuduBot 2";
} else if (/cc1|limpieza|limpiar|piso|barrer|fregar|hospital|manufactur|retail|tienda/.test(msg)) {
  robotDetectado = "CC1";
} else if (/ketty|promocion|sala de espera|evento/.test(msg)) {
  robotDetectado = "KettyBot";
} else if (/swift|entrega|documento|medicamento|puerta/.test(msg)) {
  robotDetectado = "SwiftBot";
}

// Si pregunta por precio
const preguntaPrecio = /precio|costo|cuanto|cuánto|renta|mensual|cobran|valor/.test(msg);

// Si pide foto/video
const pideFoto = /foto|imagen|video|ver|muestra|como se ve|cómo se ve/.test(msg);

// Si pide caso de éxito
const pideCaso = /caso|ejemplo|quien usa|quién usa|resultado|funciona|experiencia|referencia/.test(msg);

return {
  ...$input.item.json,
  robotDetectado,
  preguntaPrecio,
  pideFoto,
  pideCaso,
};
```
