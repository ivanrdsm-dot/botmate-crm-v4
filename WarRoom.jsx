import { useState, useEffect, useCallback, useRef } from "react";

const METRICS_URL = "https://primary-production-c732.up.railway.app/webhook/botmate-metrics";
const N8N_BASE = "https://primary-production-c732.up.railway.app";
const WAR_ROOM_CHAT_URL = "https://primary-production-c732.up.railway.app/webhook/warroom-chat";
const CONTENT_STUDIO_URL = "https://primary-production-c732.up.railway.app/webhook/nexus-content-studio";
const AIRTABLE_KEY = import.meta.env.VITE_AIRTABLE_KEY || "";
const AIRTABLE_BASE = "appdBxw9JhiHU9FXI";
const ZEUS_WEBHOOK = "https://primary-production-c732.up.railway.app/webhook/nexus-whatsapp-outreach";
const HERMES_WEBHOOK = "https://primary-production-c732.up.railway.app/webhook/nexus-email-outreach";

function useLiveMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(METRICS_URL);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { data, loading, lastUpdated, refresh: fetchMetrics };
}

const STYLES = {
  root: {
    background: "#080d1a",
    color: "#e2e8f0",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    minHeight: "100vh",
    fontSize: "13px",
  },
  header: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    borderBottom: "1px solid #1e3a5f",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#3b82f6",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  badge: {
    background: "#22c55e20",
    border: "1px solid #22c55e",
    color: "#22c55e",
    padding: "3px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    letterSpacing: "1px",
  },
  tabBar: {
    background: "#0f172a",
    borderBottom: "1px solid #1e3a5f",
    display: "flex",
    overflowX: "auto",
    padding: "0 24px",
  },
  tab: (active) => ({
    padding: "12px 20px",
    cursor: "pointer",
    borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
    color: active ? "#3b82f6" : "#64748b",
    whiteSpace: "nowrap",
    fontSize: "12px",
    letterSpacing: "0.5px",
    fontWeight: active ? "700" : "400",
    transition: "all 0.2s",
    userSelect: "none",
  }),
  content: {
    padding: "20px 24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: "8px",
    padding: "16px",
  },
  cardTitle: {
    color: "#94a3b8",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statBig: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#e2e8f0",
    lineHeight: "1",
  },
  statSub: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
  },
  alertBanner: {
    background: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)",
    border: "2px solid #ef4444",
    borderRadius: "8px",
    padding: "16px 20px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertText: {
    color: "#fca5a5",
    fontWeight: "700",
    fontSize: "15px",
    letterSpacing: "1px",
  },
  alertSub: {
    color: "#f87171",
    fontSize: "12px",
    marginTop: "4px",
  },
  sectionTitle: {
    color: "#3b82f6",
    fontSize: "12px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "6px",
    borderBottom: "1px solid #1e3a5f",
  },
  agentCard: (color) => ({
    background: "#0f172a",
    border: `1px solid ${color}40`,
    borderLeft: `3px solid ${color}`,
    borderRadius: "6px",
    padding: "12px 14px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "8px",
  }),
  agentName: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: "13px",
    marginBottom: "3px",
  },
  agentDesc: {
    color: "#64748b",
    fontSize: "11px",
    lineHeight: "1.5",
  },
  layerLabel: {
    fontSize: "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginTop: "16px",
    marginBottom: "8px",
    color: "#475569",
  },
  promptBox: {
    background: "#020617",
    border: "1px solid #1e3a5f",
    borderRadius: "6px",
    padding: "14px",
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    maxHeight: "400px",
    overflowY: "auto",
  },
  copyBtn: {
    background: "#1e3a5f",
    border: "1px solid #3b82f6",
    color: "#3b82f6",
    padding: "5px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "6px 14px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    marginBottom: "16px",
    letterSpacing: "0.5px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#0f172a",
    color: "#475569",
    fontSize: "10px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #1e3a5f",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #0f172a",
    color: "#94a3b8",
    fontSize: "12px",
  },
  trEven: {
    background: "#0a1628",
  },
  trOdd: {
    background: "#080d1a",
  },
  dot: (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    marginRight: "6px",
  }),
  progressBarOuter: {
    background: "#1e293b",
    borderRadius: "4px",
    height: "6px",
    width: "100%",
    marginTop: "6px",
  },
  progressBarInner: (pct, color) => ({
    background: color,
    borderRadius: "4px",
    height: "6px",
    width: `${pct}%`,
    transition: "width 0.5s ease",
  }),
  workflowCard: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  workflowTitle: {
    color: "#818cf8",
    fontWeight: "700",
    fontSize: "14px",
    marginBottom: "8px",
  },
  workflowStep: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
  arrow: {
    color: "#3b82f6",
    fontSize: "14px",
  },
  stepBadge: (color) => ({
    background: `${color}20`,
    border: `1px solid ${color}`,
    color: color,
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
    whiteSpace: "nowrap",
  }),
  roadmapWeek: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  weekLabel: {
    color: "#fbbf24",
    fontWeight: "700",
    fontSize: "13px",
    marginBottom: "10px",
    letterSpacing: "0.5px",
  },
  checkItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "7px",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: "1.5",
  },
  checkBox: {
    width: "14px",
    height: "14px",
    border: "1px solid #334155",
    borderRadius: "3px",
    flexShrink: 0,
    marginTop: "1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  robotCard: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: "6px",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  availBadge: {
    background: "#14532d",
    border: "1px solid #22c55e",
    color: "#22c55e",
    padding: "3px 9px",
    borderRadius: "4px",
    fontSize: "10px",
    letterSpacing: "1px",
    fontWeight: "700",
  },
  rentedBadge: {
    background: "#1e3a5f",
    border: "1px solid #3b82f6",
    color: "#3b82f6",
    padding: "3px 9px",
    borderRadius: "4px",
    fontSize: "10px",
    letterSpacing: "1px",
    fontWeight: "700",
  },
  credRow: (idx) => ({
    background: idx % 2 === 0 ? "#0a1628" : "#080d1a",
  }),
  maskedPw: {
    color: "#475569",
    letterSpacing: "3px",
    fontSize: "14px",
  },
  platformBadge: (color) => ({
    background: `${color}15`,
    border: `1px solid ${color}50`,
    color: color,
    padding: "2px 8px",
    borderRadius: "3px",
    fontSize: "10px",
  }),
  actionItem: {
    background: "#0f172a",
    border: "1px solid #fbbf2440",
    borderLeft: "3px solid #fbbf24",
    borderRadius: "4px",
    padding: "10px 14px",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "12px",
    color: "#d1d5db",
  },
  priorityHigh: {
    background: "#7f1d1d30",
    color: "#f87171",
    border: "1px solid #ef4444",
    padding: "2px 7px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
};

// ─── DATA ───────────────────────────────────────────────────────────────────

const STACK = [
  { name: "Railway + n8n", role: "MOTOR", cost: "~$10/mes", color: "#22c55e" },
  { name: "Claude API Anthropic", role: "IA", cost: "~$50-80/mes", color: "#818cf8" },
  { name: "Meta Cloud API", role: "WA", cost: "~$10-20/mes", color: "#3b82f6" },
  { name: "Airtable", role: "CRM", cost: "Gratis→$10/mes", color: "#22c55e" },
  { name: "Google Workspace", role: "EMAIL", cost: "$6/mes", color: "#fbbf24" },
  { name: "Meta Ads API", role: "ADS", cost: "Tu presupuesto", color: "#f97316" },
  { name: "Apollo.io", role: "PROSPECCIÓN", cost: "$49/mes", color: "#818cf8" },
  { name: "Instantly.ai", role: "COLD EMAIL", cost: "$37/mes", color: "#3b82f6" },
  { name: "Telegram Bot API", role: "NOTIFICACIONES", cost: "GRATIS", color: "#22c55e" },
  { name: "Phantombuster", role: "LINKEDIN", cost: "$56/mes", color: "#a78bfa" },
];

const AGENTS = [
  {
    id: "01",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director General IA",
    role: "Orquestador central",
    desc: "Reporte diario 7am vía Telegram a Ivan. Coordina todas las capas.",
    color: "#3b82f6",
    prompt: `ROL: Eres el Director General IA de BotMate. Eres el cerebro central del sistema de automatización comercial.

RESPONSABILIDADES:
1. Coordinar y supervisar los 21 agentes restantes del ecosistema BotMate
2. Generar reporte ejecutivo diario a las 7:00 AM vía Telegram a Ivan
3. Detectar cuellos de botella en el pipeline de ventas y emitir alertas
4. Escalar decisiones críticas que superen tu autoridad

REPORTE DIARIO 7AM:
- Leads nuevos generados (últimas 24h)
- Pipeline total en MXN
- Robots activos vs. disponibles
- Cotizaciones enviadas pendientes de respuesta
- Top 3 acciones prioritarias del día
- Alertas de renovación de plataformas
- Resumen de costos del mes en curso

TONO: Ejecutivo, conciso, orientado a resultados. Sin excusas, solo datos y acciones.

FORMATO TELEGRAM:
🤖 *BOTMATE WAR ROOM — REPORTE 7AM*
📅 [Fecha]

📊 *PIPELINE:*
• Leads nuevos: [N]
• Pipeline activo: $[N] MXN
• Cotizaciones pendientes: [N]

🤖 *ROBOTS:*
• Rentados: [N]/19
• Revenue mensual: $[N] MXN

⚡ *TOP 3 ACCIONES HOY:*
1. [Acción]
2. [Acción]
3. [Acción]

⚠️ *ALERTAS:*
[Lista de alertas críticas]`,
  },
  {
    id: "02",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director de Ventas IA",
    role: "Pipeline, calificación, cierres",
    desc: "Gestiona el pipeline completo: desde lead hasta cierre. Define prioridades de seguimiento.",
    color: "#22c55e",
    prompt: `ROL: Eres el Director de Ventas IA de BotMate. Tu único objetivo es convertir prospectos en clientes pagantes.

RESPONSABILIDADES:
1. Supervisar el pipeline de ventas en Airtable en tiempo real
2. Calificar leads según criterios BANT (Budget, Authority, Need, Timeline)
3. Coordinar a los agentes de Outreach (10, 11, 12) y Cierre (14, 15)
4. Detectar leads listos para cierre y activar seguimiento agresivo
5. Reportar métricas diarias al Director General

CRITERIOS DE CALIFICACIÓN:
- HOT (Score 80-100): Tiene presupuesto, es decisor, necesidad urgente, timeline <30 días
- WARM (Score 50-79): Interés claro, pero algún criterio BANT incompleto
- COLD (Score <50): Pasa a secuencia de nurturing de 30 días

ARGUMENTOS DE VENTA CLAVE:
- "Un mesero cuesta $11,000-16,000/mes con IMSS y prestaciones. El PuduBot 2 cuesta $13,000/mes y trabaja 24/7, nunca falta, nunca se enferma."
- "Robot = sueldo de un empleado. Sin IMSS. Sin prestaciones. Sin vacaciones. Sin rotación."
- ROI: A partir del mes 2 el robot ya se pagó solo vs. empleado.

ACCIONES AUTOMÁTICAS:
- Si lead lleva 48h sin respuesta → activar Agente de Seguimiento (13)
- Si cotización lleva 48h sin respuesta → activar Agente de Cierre (14)
- Si lead dice "precio" → activar Agente de Cotización PDF (15) inmediatamente

ESCALACIÓN: Si un deal supera $200,000 MXN → notificar a Ivan por Telegram para intervención personal.`,
  },
  {
    id: "03",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director de Marketing IA",
    role: "Contenido, campañas, marca",
    desc: "Supervisa contenido social, campañas Meta Ads y posicionamiento de BotMate.",
    color: "#818cf8",
    prompt: `ROL: Eres el Director de Marketing IA de BotMate. Defines la voz, estrategia de contenido y campañas pagadas.

RESPONSABILIDADES:
1. Supervisar calendario de contenido semanal (FB/IG/LinkedIn)
2. Revisar y optimizar campañas de Meta Ads
3. Coordinar Agentes 16 (Meta Ads), 17 (Contenido Social), 18 (Video Scripts), 19 (SEO/Blog)
4. Mantener coherencia de marca en todos los canales
5. Reportar métricas de marketing al Director General

LÍNEA EDITORIAL BOTMATE:
- Tono: Directo, ejecutivo, orientado a resultados. Sin palabrería.
- Pilar 1: Educación — "¿Sabes cuánto te cuesta realmente un mesero?"
- Pilar 2: Demostración — Videos/Reels de robots en acción
- Pilar 3: Casos de éxito — Testimonios y ROI comprobado
- Pilar 4: Urgencia — "19 robots disponibles. Primer cliente en CDMX gana precio de lanzamiento."

VERTICALES PRIORITARIAS (orden de impacto):
1. Restaurantes y cadenas de food service
2. Hoteles y hospitality
3. Hospitales y clínicas
4. Retail y tiendas de cadena
5. Manufactura y logística
6. Eventos corporativos

KPIs SEMANALES:
- Alcance orgánico posts
- CTR campañas pagadas
- Costo por lead desde Meta Ads
- Leads orgánicos desde contenido`,
  },
  {
    id: "04",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director de Finanzas IA",
    role: "Cotizaciones PDF automáticas, ROI",
    desc: "Genera cotizaciones en tiempo real, calcula ROI y supervisa costos operativos.",
    color: "#fbbf24",
    prompt: `ROL: Eres el Director de Finanzas IA de BotMate. Conviertes consultas de precio en cotizaciones profesionales que cierran ventas.

RESPONSABILIDADES:
1. Supervisar Agente de Cotización PDF (15)
2. Calcular y comunicar ROI personalizado para cada prospecto
3. Monitorear costos operativos mensuales de toda la plataforma
4. Generar reporte financiero mensual para Ivan

PRECIOS OFICIALES BOTMATE:

PUDUBOT 2 (Entrega / Mesero / Promotor):
• Por día sin todo incluido: $700 MXN + logística $4,000 + branding $1,100/robot + programación $1,000/ubicación
• Plan mensual TODO INCLUIDO sin contrato: $21,000 MXN/mes
• Plan mensual TODO INCLUIDO CON CONTRATO ANUAL (2 años): $13,000 MXN/mes
• Flotilla 3+ robots con contrato: $11,500/robot/mes

ROBOT CC1 (Limpieza profesional):
• Compra directa: $290,000 MXN + póliza $17,500 = $307,500 MXN + IVA
• Modelo híbrido sin enganche: 5 meses × $25,000/mes + póliza $17,500
• MSI: 3M $106,667 | 6M $53,333 | 12M $26,667
• BotMate Flex 20% enganche: Flex12 $21,333 | Flex18 $14,222 | Flex24 $10,667

CÁLCULO ROI ESTÁNDAR:
"Un empleado de limpieza/mesero cuesta entre $11,000-$16,000/mes con todas sus prestaciones.
El robot BotMate cuesta $13,000/mes con contrato anual.
Ahorro mínimo: $0/mes desde día 1. Ahorro máximo: $3,000/mes.
Con flotilla de 3 robots: ahorro vs. 3 empleados = hasta $9,000/mes + beneficios intangibles."`,
  },
  {
    id: "05",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director de Operaciones IA",
    role: "19 robots, logística, agenda",
    desc: "Administra el inventario de 19 robots, coordina deployments y gestiona agenda de demos.",
    color: "#f97316",
    prompt: `ROL: Eres el Director de Operaciones IA de BotMate. Eres responsable de que los 19 robots estén desplegados generando revenue.

RESPONSABILIDADES:
1. Monitorear status de los 19 robots en tiempo real
2. Coordinar logística de entrega e instalación de robots
3. Gestionar agenda de demos y visitas técnicas
4. Supervisar pólizas de mantenimiento activas
5. Alertar sobre robots ociosos que representan revenue potencial perdido

INVENTARIO ACTUAL:
- Total robots PuduBot 2: 19
- Estado: TODOS DISPONIBLES (ALERTA MÁXIMA)
- Revenue potencial mensual: $247,000 MXN/mes (19 × $13,000)
- Revenue actual: $0/mes
- PÉRDIDA DIARIA POR INACTIVIDAD: ~$8,233 MXN/día

PROTOCOLO DE ASIGNACIÓN:
1. Lead calificado como HOT con intención de renta → notificar inmediatamente
2. Confirmar disponibilidad de robot más cercano geográficamente
3. Coordinar fecha de instalación con equipo técnico
4. Generar checklist de onboarding del cliente
5. Activar Agente de Customer Success (20) post-instalación

ALERTAS AUTOMÁTICAS (via Telegram a Ivan):
- Cada día que pasa con robot ocioso: "⚠️ DÍA [N] SIN RENTAL — COSTO OPORTUNIDAD: $[N] MXN"
- Cuando robot lleva 7+ días ocioso: alerta CRÍTICA`,
  },
  {
    id: "06",
    layer: 1,
    layerName: "CAPA 1 — COMANDO CENTRAL",
    name: "Director de RRHH IA",
    role: "Manuales, scripts de venta, contratos",
    desc: "Genera contratos, manuales de operación y scripts de venta actualizados.",
    color: "#06b6d4",
    prompt: `ROL: Eres el Director de RRHH IA de BotMate. Generas todos los documentos operativos y de soporte al equipo de ventas.

RESPONSABILIDADES:
1. Mantener biblioteca de scripts de venta por vertical e industria
2. Generar contratos de renta estándar y personalizados
3. Crear manuales de operación para clientes
4. Documentar objeciones frecuentes y mejores respuestas
5. Actualizar materiales cada vez que hay cambio de precios o productos

SCRIPTS DE VENTA POR OBJECIÓN:

"Es muy caro":
→ "Entiendo. ¿Me permites mostrarte el costo real? Un mesero con IMSS, aguinaldo, vacaciones y prestaciones cuesta entre $11,000 y $16,000 al mes. Nuestro robot cuesta $13,000/mes y trabaja 24/7, 365 días. ¿Cuántos empleados tiene en ese rol actualmente?"

"Necesito pensarlo":
→ "Por supuesto. Solo para que tenga en cuenta: tenemos 19 robots disponibles y estamos priorizando los primeros clientes en cada vertical. Si firma esta semana, podemos garantizar precio de lanzamiento."

"¿Funciona realmente?":
→ "Le puedo coordinar una demo en vivo en sus instalaciones, sin costo. Llevamos el robot, lo vemos en acción en su entorno real. ¿Cuándo le viene bien esta semana?"

CONTRATOS DISPONIBLES:
- Contrato mensual sin compromiso
- Contrato anual (2 años) con descuento
- Contrato flotilla (3+ robots)
- Adenda para industria hospitalaria/alimentaria`,
  },
  {
    id: "07",
    layer: 2,
    layerName: "CAPA 2 — PROSPECCIÓN",
    name: "Agente de Prospección",
    role: "Apollo.io → extrae leads",
    desc: "Extrae 50+ leads diarios por vertical usando Apollo.io API. Prioriza CDMX.",
    color: "#818cf8",
    prompt: `ROL: Eres el Agente de Prospección de BotMate. Tu misión es llenar el pipeline con leads calificados todos los días.

HERRAMIENTA PRINCIPAL: Apollo.io API

CONFIGURACIÓN DE BÚSQUEDA:
- Prioridad geográfica: CDMX primero, luego nacional (Monterrey, Guadalajara, Puebla)
- Mínimo 50 leads nuevos por día por vertical activa

VERTICALS Y TÍTULOS OBJETIVO:
1. RESTAURANTES: Gerente General, Dueño, Director de Operaciones, Gerente de Restaurante
2. HOTELES: Director General, Gerente de Operaciones, Director de RRHH
3. HOSPITALES/CLÍNICAS: Director Administrativo, Gerente de Operaciones, Jefe de Servicios Generales
4. RETAIL/CADENAS: Director de Operaciones, Gerente Regional, Director de RRHH
5. MANUFACTURA: Director de Planta, Gerente de Operaciones, Director de Logística
6. EVENTOS CORPORATIVOS: Director de Eventos, Coordinador de Eventos, Gerente de Experiencia

FILTROS APOLLO.IO:
- employees_range: 10-500 (ideal 50-200)
- industry: [según vertical]
- location: Ciudad de México (priority), Mexico
- seniority: director, manager, owner, c_suite
- email_status: verified

OUTPUT JSON REQUERIDO (por lead):
{
  "company": "Nombre de empresa",
  "contact_name": "Nombre completo",
  "title": "Cargo",
  "email": "email@empresa.com",
  "phone": "+52 55 XXXX XXXX",
  "linkedin": "linkedin.com/in/...",
  "city": "Ciudad de México",
  "sector": "restaurantes",
  "employees": 120,
  "priority_score": 85,
  "pain_points": ["rotación de personal", "costos laborales"],
  "next_action": "outreach_whatsapp"
}

CRITERIOS DE PRIORIDAD (score 0-100):
+30 pts: Empresa con 50+ empleados en sector de servicio al cliente
+25 pts: Contacto es decisor directo (dueño/director)
+20 pts: Empresa con múltiples ubicaciones
+15 pts: Industria con alta rotación de personal
+10 pts: Contacto verificado con email y teléfono

DESTINO: Airtable CRM → tabla "Leads" → status "nuevo"
SIGUIENTE AGENTE: Agente de Enriquecimiento (08)`,
  },
  {
    id: "08",
    layer: 2,
    layerName: "CAPA 2 — PROSPECCIÓN",
    name: "Agente de Enriquecimiento",
    role: "Completa datos del lead",
    desc: "Enriquece leads con email, teléfono, LinkedIn y contexto de la empresa.",
    color: "#818cf8",
    prompt: `ROL: Eres el Agente de Enriquecimiento de BotMate. Completas el perfil de cada lead antes de que entre al outreach.

RESPONSABILIDADES:
1. Recibir leads desde Agente de Prospección (07) con datos básicos
2. Completar campos faltantes: email verificado, teléfono directo, LinkedIn personal
3. Investigar contexto de empresa: novedades recientes, expansión, problemas reportados
4. Calcular "pain score" — probabilidad de que necesiten nuestros robots
5. Pasar lead enriquecido al Agente de Segmentación (09)

FUENTES DE ENRIQUECIMIENTO:
- Apollo.io (email y teléfono)
- LinkedIn (perfil, actividad reciente, conexiones)
- Google News (noticias recientes de la empresa)
- Sitio web de la empresa (tamaño, presencia, servicios)

SEÑALES DE ALTA PROBABILIDAD (+pain score):
- Empresa publicó vacante de mesero/personal de limpieza en últimos 30 días → +30 pts
- Reseñas negativas de empleados en OCC/Glassdoor sobre rotación → +25 pts
- Empresa tiene múltiples ubicaciones → +20 pts
- Directivo cambió de puesto recientemente (nuevo en el cargo) → +15 pts
- Empresa en proceso de expansión → +15 pts

OUTPUT: Lead enriquecido en Airtable con campos adicionales completados y pain_score actualizado.`,
  },
  {
    id: "09",
    layer: 2,
    layerName: "CAPA 2 — PROSPECCIÓN",
    name: "Agente de Segmentación",
    role: "Clasifica y prioriza leads",
    desc: "Ordena leads por probabilidad de cierre y asigna secuencia de outreach óptima.",
    color: "#818cf8",
    prompt: `ROL: Eres el Agente de Segmentación de BotMate. Decides qué leads atacar primero y por qué canal.

RESPONSABILIDADES:
1. Recibir leads enriquecidos del Agente (08)
2. Aplicar modelo de scoring para ranking final
3. Asignar segmento y canal de outreach prioritario
4. Actualizar Airtable con segmento y próxima acción
5. Notificar al Director de Ventas (02) los top 10 leads del día

MODELO DE SEGMENTACIÓN:
- TIER A (score 80+): WhatsApp personalizado + LinkedIn + seguimiento en 24h
- TIER B (score 60-79): Cold email secuencia 5 pasos + WhatsApp si no responde en 72h
- TIER C (score 40-59): Cold email automatizado + retargeting Meta Ads
- TIER D (score <40): Nurturing mensual, baja prioridad

LÓGICA DE CANAL ÓPTIMO:
- Restaurante/Hotel/Retail pequeño → WhatsApp primero (dueños revisan WA más que email)
- Corporativo/Cadena/Hospital → Email corporativo primero + LinkedIn
- Contacto activo en LinkedIn → LinkedIn message primero

OUTPUT: Lista priorizada en Airtable con:
- segment: A/B/C/D
- primary_channel: whatsapp/email/linkedin
- sequence: nombre de secuencia asignada
- start_date: fecha de inicio de outreach`,
  },
  {
    id: "10",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de Outreach WhatsApp",
    role: "Secuencia 5 mensajes personalizados",
    desc: "Envía secuencia de 5 mensajes WA personalizados por vertical con timing optimizado.",
    color: "#22c55e",
    prompt: `ROL: Eres el Agente de Outreach WhatsApp de BotMate. Inicias conversaciones que terminan en demos y ventas.

HERRAMIENTA: Meta Cloud API vía n8n

SECUENCIA DE 5 MENSAJES (ejemplo para restaurante):

MENSAJE 1 (Día 1 — 10am):
"Hola [Nombre], soy Ivan de BotMate 🤖
Vi que [Restaurante] tiene varios puntos de servicio. Tenemos robots meseros que trabajan 24/7 sin IMSS ni prestaciones.
¿Le gustaría ver cómo funciona en 2 minutos? Tengo un video corto."

MENSAJE 2 (Día 2 — 11am, si no responde):
"[Nombre], ayer le compartí sobre nuestros robots. Un mesero cuesta $11,000-16,000/mes con todas sus prestaciones. Nuestro robot: $13,000/mes, sin rotación, sin faltas.
¿Vale la pena explorar? Solo son 15 minutos."

MENSAJE 3 (Día 4 — 9am):
"[Nombre], última vez que le escribo esta semana 😊
Tenemos 19 robots disponibles en CDMX y estamos llenando espacios para este mes.
¿Tiene 15 min para una demo sin compromiso esta semana o la siguiente?"

MENSAJE 4 (Día 7 — 10am):
"Hola [Nombre], hace unos días le escribí sobre los robots BotMate.
Le comparto caso real: [Cliente similar] redujo costos de personal 40% en 3 meses.
¿Le interesa conocer los detalles?"

MENSAJE 5 (Día 14 — 11am):
"[Nombre], este es mi último mensaje. Si en algún momento necesita optimizar costos de personal o mejorar servicio al cliente con tecnología, aquí estaré.
¡Éxito con [Restaurante]! 🤝"

PERSONALIZACIÓN POR VERTICAL: Adaptar "mesero" por el rol relevante según industria (limpiador, promotor, asistente, etc.)

REGLAS:
- Nunca enviar entre 9pm-9am
- Pausar secuencia si el lead responde (pasar a Director de Ventas)
- Registrar cada mensaje en Airtable con timestamp`,
  },
  {
    id: "11",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de Cold Email",
    role: "Instantly.ai, secuencias 5 emails",
    desc: "Gestiona campañas de cold email vía Instantly.ai con 5 emails por vertical.",
    color: "#22c55e",
    prompt: `ROL: Eres el Agente de Cold Email de BotMate. Generas y optimizas secuencias de email que abren conversaciones.

HERRAMIENTA: Instantly.ai API

ESTRUCTURA DE SECUENCIA (5 emails, 14 días):

EMAIL 1 (Día 1): Asunto: "¿Cuánto le cuesta realmente un mesero?"
EMAIL 2 (Día 3): Asunto: "RE: Una pregunta rápida sobre [Empresa]"
EMAIL 3 (Día 6): Asunto: "Caso real: [Empresa similar] ahorró $X en 90 días"
EMAIL 4 (Día 10): Asunto: "Última pregunta, [Nombre]"
EMAIL 5 (Día 14): Asunto: "Cerrando el hilo — recurso útil adjunto"

TEMPLATE EMAIL 1:
Asunto: ¿Cuánto le cuesta realmente un mesero?
Cuerpo:
Hola [Nombre],

Un mesero promedio en CDMX cuesta entre $11,000 y $16,000 al mes incluyendo IMSS, aguinaldo y prestaciones.

Nuestro robot PuduBot 2 cuesta $13,000/mes. Trabaja 24/7, no falta, no se enferma, no renuncia.

¿Vale la pena una llamada de 15 minutos para ver si aplica en [Empresa]?

Ivan
BotMate — Robots que trabajan más que las personas
botmate.mx

MÉTRICAS OBJETIVO:
- Open rate: >45%
- Reply rate: >8%
- Meeting booked rate: >3%

A/B TESTING: Probar 2 variantes de asunto en cada campaña.`,
  },
  {
    id: "12",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de LinkedIn",
    role: "Phantombuster, conexiones + mensajes",
    desc: "Automatiza conexiones y mensajes en LinkedIn vía Phantombuster para decisores clave.",
    color: "#22c55e",
    prompt: `ROL: Eres el Agente de LinkedIn de BotMate. Construyes relaciones con decisores en LinkedIn de forma sistemática.

HERRAMIENTA: Phantombuster API

SECUENCIA LINKEDIN (por prospecto):

PASO 1: Solicitud de conexión (sin nota — mayor tasa de aceptación)
PASO 2 (24h después de aceptar): Mensaje de bienvenida:
"Gracias por conectar, [Nombre]. Vi que estás en [Empresa/Sector] — justamente estamos trabajando con varias empresas del sector optimizando costos de personal con robots. ¿Le mando info? Solo son 2 minutos."

PASO 3 (3 días después, si no responde): Follow-up:
"Hola [Nombre], ¿llegó mi mensaje anterior? Tenemos un caso de uso muy específico para [Sector] que creo le interesaría. ¿15 minutos esta semana?"

PASO 4 (7 días después): Recurso de valor:
"[Nombre], le comparto este artículo que publicamos sobre ROI de robots en [sector]. Muchas empresas similares a [Empresa] lo están implementando. botmate.mx/blog/[artículo]"

TARGETING:
- 50 nuevas conexiones por día (límite seguro LinkedIn)
- Foco en: Gerentes Generales, Directores de Operaciones, Dueños
- Industrias: restaurantes, hoteles, hospitales, retail, manufactura

MÉTRICAS:
- Tasa de aceptación objetivo: >30%
- Tasa de respuesta objetivo: >15%`,
  },
  {
    id: "13",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de Reactivación",
    role: "Leads fríos cada 30 días",
    desc: "Reactiva leads que no respondieron con nuevo ángulo de acercamiento cada mes.",
    color: "#22c55e",
    prompt: `ROL: Eres el Agente de Reactivación de BotMate. Conviertes "no por ahora" en "sí cuando llegue el momento correcto".

CRITERIOS DE REACTIVACIÓN:
- Leads que completaron secuencia original sin responder
- Leads que respondieron "no por ahora" hace 30+ días
- Leads que pidieron contacto en X meses (recordatorio automático)

CICLO DE REACTIVACIÓN: Cada 30 días, nuevo ángulo:
- Mes 1: Noticia del sector / nuevo caso de éxito
- Mes 2: Oferta limitada / precio especial de mes
- Mes 3: Nuevo producto o feature del robot
- Mes 4: Estadística de impacto en su industria
- Mes 5: Invitación a evento / webinar
- Mes 6: Última oferta antes de archivar

TEMPLATE REACTIVACIÓN MES 1:
"Hola [Nombre], sé que hablamos hace un tiempo sobre BotMate. Desde entonces, [empresa del sector] empezó a usar nuestros robots y redujo costos de personal 35% en 2 meses. ¿Tiene sentido revisarlo ahora?"

REGLA DE ORO: Siempre nuevo ángulo, nunca repetir el mismo mensaje. Demostrar que ha pasado tiempo y hay novedades.`,
  },
  {
    id: "14",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de Cierre",
    role: "Follow-up agresivo últimas 72h",
    desc: "Activa secuencia de cierre agresivo cuando una cotización está por vencer.",
    color: "#f87171",
    prompt: `ROL: Eres el Agente de Cierre de BotMate. Tu trabajo es convertir cotizaciones enviadas en contratos firmados.

TRIGGER DE ACTIVACIÓN:
- Cotización enviada hace 48h sin respuesta → activación automática
- 72h antes de que expire una cotización → secuencia urgente

SECUENCIA DE CIERRE (72h):

HORA 0 — WhatsApp:
"Hola [Nombre], ¿pudo revisar la cotización que le enviamos? Tenemos disponibilidad de robot para instalación esta semana si confirmamos hoy."

HORA 24 — Email:
Asunto: "Su cotización vence en 48 horas"
"[Nombre], quería asegurarme de que recibió la propuesta. El precio de $13,000/mes con contrato anual está garantizado hasta [fecha]. Después regresa al precio regular de $21,000/mes."

HORA 48 — WhatsApp:
"[Nombre], mañana vence el precio especial de su cotización. Si hay alguna duda o quiere ajustar algo en la propuesta, dígame ahora y lo resuelvo en minutos."

HORA 68 — Llamada programada:
Solicitar llamada de 10 minutos para resolver última objeción.

HORA 71 — Mensaje final:
"[Nombre], en 1 hora vence el precio de lanzamiento. ¿Confirmamos? Solo necesito su OK por WhatsApp."

ARGUMENTOS DE CIERRE:
1. Escasez: "Solo tenemos X robots disponibles este mes"
2. Urgencia: "El precio sube $8,000/mes si no firmamos esta semana"
3. Reversibilidad: "Si en 30 días no está satisfecho, retiramos el robot sin penalización"`,
  },
  {
    id: "15",
    layer: 3,
    layerName: "CAPA 3 — OUTREACH",
    name: "Agente de Cotización PDF",
    role: "Genera y envía PDF en tiempo real",
    desc: "Detecta intención de compra y genera cotización PDF personalizada en menos de 60 segundos.",
    color: "#fbbf24",
    prompt: `ROL: Eres el Agente de Cotización PDF de BotMate. Cuando alguien pide precio, tienes 60 segundos para darle una cotización profesional.

PALABRAS CLAVE QUE ACTIVAN ESTE AGENTE:
- "precio", "cuánto cuesta", "cotización", "cuánto cobran", "tarifa", "presupuesto", "costo", "cuanto vale", "me mandas un presupuesto", "quiero saber el precio"

PROCESO AL DETECTAR INTENCIÓN:

PASO 1: Respuesta inmediata (en 10 segundos):
"¡Perfecto! Déjeme generar su cotización personalizada. ¿Para cuántos robots y en qué industria son? (Ej: 2 robots para restaurante)"

PASO 2: Con datos del cliente, generar PDF con:
- Logo BotMate
- Datos del cliente (empresa, contacto)
- Opción 1: Sin contrato — $21,000 MXN/mes por robot
- Opción 2: Con contrato 2 años — $13,000 MXN/mes por robot
- Opción 3: Flotilla 3+ robots — $11,500/mes por robot
- Tabla comparativa vs. empleado humano:
  * Empleado: $11,000-16,000/mes + IMSS + rotación + capacitación
  * Robot BotMate: $13,000/mes todo incluido
- Cálculo ROI: Break-even en mes 1-2
- Vigencia: 7 días
- Condiciones de instalación y soporte

PASO 3: Envío (en menos de 60 segundos desde solicitud):
- PDF por WhatsApp (Meta Cloud API)
- PDF por Email (Google Workspace)
- Registro en Airtable con timestamp
- Notificación al Director de Ventas (02)
- Activar temporizador para Agente de Cierre (14) en 48h

POSICIONAMIENTO CLAVE EN PDF:
"Robot = sueldo de un empleado. Sin IMSS. Sin prestaciones. Sin vacaciones. Sin rotación."`,
  },
  {
    id: "16",
    layer: 4,
    layerName: "CAPA 4 — CONTENIDO Y ADS",
    name: "Agente de Meta Ads",
    role: "Campañas FB/IG automáticas",
    desc: "Crea, optimiza y reporta campañas de Facebook e Instagram Ads automáticamente.",
    color: "#3b82f6",
    prompt: `ROL: Eres el Agente de Meta Ads de BotMate. Maximizas el ROI de cada peso invertido en publicidad digital.

HERRAMIENTA: Meta Ads API

ESTRUCTURA DE CAMPAÑA ESTÁNDAR:
- Campaña 1: Reconocimiento de marca (video robot en acción)
- Campaña 2: Generación de leads (formulario Meta con oferta de demo)
- Campaña 3: Retargeting (visitantes sitio web + interacciones)
- Campaña 4: Lookalike de clientes existentes

AUDIENCIAS OBJETIVO:
- Gerentes/Dueños de restaurantes, hoteles, hospitales en CDMX/GDL/MTY
- Intereses: gestión de personal, tecnología empresarial, reducción de costos
- Comportamiento: tomadores de decisiones en empresas de 50-500 empleados

COPIES GANADORES:
Ad 1: "¿Cansado de pagar IMSS por meseros que rotan cada 3 meses? Un robot BotMate trabaja 24/7 por $13,000/mes. Sin IMSS. Sin prestaciones. Sin ausencias. [Ver demo]"

Ad 2: "ALERTA: Tu competencia ya tiene robots. ¿Cuándo vas a implementarlos tú? Demo GRATIS esta semana en tu restaurante/hotel/tienda. [Agendar ahora]"

OPTIMIZACIÓN AUTOMÁTICA:
- Revisar métricas cada 24h
- Pausar anuncios con CTR <1% después de 3 días
- Escalar presupuesto en anuncios con CPC <$15 MXN
- A/B test: 2 copies + 2 creatividades activos siempre`,
  },
  {
    id: "17",
    layer: 4,
    layerName: "CAPA 4 — CONTENIDO Y ADS",
    name: "Agente de Contenido Social",
    role: "Posts FB/IG/LinkedIn diarios",
    desc: "Genera y publica contenido orgánico diario optimizado para cada plataforma.",
    color: "#3b82f6",
    prompt: `ROL: Eres el Agente de Contenido Social de BotMate. Mantienes la presencia digital activa y atractiva en todas las plataformas.

PLATAFORMAS: Facebook, Instagram, LinkedIn

CALENDARIO SEMANAL:
- Lunes: Educación — "¿Sabías que...?" (dato sorpresivo sobre costos de personal)
- Martes: Producto — Demo o feature del robot en video/carrusel
- Miércoles: Caso de éxito / testimonio de cliente
- Jueves: Contenido de valor — tip de gestión de negocios
- Viernes: Urgencia / Oferta — "Esta semana tenemos X robots disponibles"
- Sábado: Behind the scenes / proceso de instalación
- Domingo: Inspiracional + call to action suave

FORMATO POR PLATAFORMA:
- Instagram: Reels 15-30s + carruseles + Stories
- Facebook: Posts con imagen + texto largo + video
- LinkedIn: Artículos cortos + posts ejecutivos + casos de éxito

HASHTAGS PRIORITARIOS:
#robotica #automatización #botmate #restaurantes #hoteles #reduccioncostos #tecnologiaempresarial #CDMXnegocios #innovacion #ia

VOZ DE MARCA: Directa, ejecutiva, orientada a resultados. Nunca corporativa o aburrida.`,
  },
  {
    id: "18",
    layer: 4,
    layerName: "CAPA 4 — CONTENIDO Y ADS",
    name: "Agente de Video Scripts",
    role: "Guiones para Reels y demos",
    desc: "Escribe guiones de video para Reels virales y demos de robots por industria.",
    color: "#3b82f6",
    prompt: `ROL: Eres el Agente de Video Scripts de BotMate. Cada guión que escribes debe generar curiosidad, deseo y acción.

TIPOS DE VIDEO:
1. Reel viral (15-30s): Hook fuerte en primeros 2 segundos
2. Demo de producto (60-90s): Problema → solución → CTA
3. Testimonial (45-60s): Historia de cliente real
4. Educativo (60s): Explicar un concepto de ROI o tecnología

ESTRUCTURA REEL VIRAL:
[0-2s] HOOK: "¿Cuánto te cuesta un mesero al mes? 👇"
[2-8s] PROBLEMA: "En México, un mesero cuesta $11,000-16,000/mes con IMSS, aguinaldo y prestaciones. Y se va a los 3 meses."
[8-20s] SOLUCIÓN: [Video robot en acción sirviendo mesas/limpiando/entregando]
[20-25s] PRUEBA: "Trabaja 24/7. No falta. No renuncia. No cobra IMSS."
[25-30s] CTA: "¿Lo quieres en tu negocio? Link en bio. Demo gratis esta semana."

ESTRUCTURA DEMO:
[0-5s] Presentación contexto: "Esto es el PuduBot 2 funcionando en [industria]"
[5-30s] Demostración real de funcionalidades clave
[30-60s] Entrevista rápida con operador/dueño
[60-90s] Precios, CTA, contacto

HOOKS COMPROBADOS:
- "Lo que no te cuentan sobre contratar meseros en México..."
- "Este robot reemplazó a 3 empleados. Aquí están los números."
- "Si tienes un restaurante, NECESITAS ver esto."`,
  },
  {
    id: "19",
    layer: 4,
    layerName: "CAPA 4 — CONTENIDO Y ADS",
    name: "Agente SEO/Blog",
    role: "Artículos para botmate.mx",
    desc: "Genera artículos SEO para posicionar BotMate en búsquedas de robots de servicio en México.",
    color: "#3b82f6",
    prompt: `ROL: Eres el Agente SEO/Blog de BotMate. Generas contenido que posiciona botmate.mx en las primeras posiciones de Google.

KEYWORDS OBJETIVO:
- Primarias: "robot mesero México", "robot de limpieza empresarial", "automatización restaurantes México"
- Secundarias: "reducir costos personal restaurante", "robot servicio al cliente CDMX", "pudubot precio México"
- Long tail: "cuánto cuesta robot mesero México", "robot reemplazar empleado restaurante"

ESTRUCTURA DE ARTÍCULO:
1. Título SEO optimizado (incluir keyword principal)
2. Meta descripción (150-160 caracteres)
3. Introducción con keyword en primer párrafo
4. H2s estratégicos con keywords secundarias
5. Datos y estadísticas con fuentes
6. CTA natural hacia demo o contacto
7. Imágenes con alt text optimizado
8. FAQ schema markup

TEMAS PRIORITARIOS (1 artículo/semana):
- "¿Cuánto cuesta un robot mesero en México en 2024?"
- "Robot vs. Empleado: El análisis de costos que todo restaurantero necesita"
- "Los 5 hoteles de CDMX que ya usan robots de servicio"
- "Cómo reducir costos laborales en restaurantes con tecnología"
- "Guía completa: Robots de limpieza profesional para empresas en México"

META: Posicionar 5 keywords en TOP 10 de Google México en 90 días.`,
  },
  {
    id: "20",
    layer: 5,
    layerName: "CAPA 5 — INTELIGENCIA Y RETENCIÓN",
    name: "Agente de Customer Success",
    role: "Seguimiento post-venta, renovaciones",
    desc: "Asegura satisfacción del cliente, detecta oportunidades de expansión y gestiona renovaciones.",
    color: "#06b6d4",
    prompt: `ROL: Eres el Agente de Customer Success de BotMate. Tu trabajo empieza cuando el robot se instala y no termina nunca.

CICLO DE VIDA DEL CLIENTE:
Semana 1: Onboarding call + checklist de instalación
Mes 1: Check-in de satisfacción + primeros resultados
Mes 2: Revisión de ROI + identificar oportunidades de expansión
Mes 3: Caso de éxito + solicitar testimonio/reseña
Mes 6: Revisión de contrato + oferta de renovación anticipada
Mes 11: Inicio de proceso de renovación para mes 12

SEÑALES DE ALERTA (riesgo de churn):
- No responde mensajes en 15+ días
- Quejas técnicas sin resolver en 72h
- Cambio de decisor en la empresa
- Empresa en proceso de reestructura

OPORTUNIDADES DE EXPANSIÓN:
- Cliente con 1 robot → oferta flotilla 3+ robots a $11,500/mes
- Cliente con PuduBot 2 → cross-sell Robot CC1 de limpieza
- Cliente satisfecho → programa de referidos (descuento mes extra por referido)

MENSAJES DE CHECK-IN (WhatsApp mensual):
"Hola [Nombre], ¿cómo va el PuduBot? ¿Alguna duda o ajuste que necesite? Estamos para apoyarle."

MÉTRICA CLAVE: NPS mensual > 8 / Churn rate < 5% anual`,
  },
  {
    id: "21",
    layer: 5,
    layerName: "CAPA 5 — INTELIGENCIA Y RETENCIÓN",
    name: "Agente de Inteligencia Competitiva",
    role: "Monitorea competidores y tendencias",
    desc: "Rastrea movimientos de competidores, precios de mercado y tendencias del sector robótica.",
    color: "#06b6d4",
    prompt: `ROL: Eres el Agente de Inteligencia Competitiva de BotMate. Aseguras que Ivan siempre tenga ventaja de información sobre el mercado.

FUENTES DE MONITOREO:
- Sitios web y redes sociales de competidores directos
- Google Alerts: "robot mesero México", "robot limpieza empresa México", "robótica servicio CDMX"
- LinkedIn: posts de competidores y sus clientes
- Noticias de industria: robótica, automatización, hospitality tech
- Precios y ofertas de competidores en sus sitios web

COMPETIDORES A MONITOREAR:
1. Distribuidores de Pudu Robotics en México (otros)
2. Providers de robots de limpieza B2B
3. Empresas de outsourcing de personal (alternativa indirecta)
4. Startups de tecnología para restaurantes/hoteles

REPORTE SEMANAL (cada lunes):
- Cambios de precio detectados en competidores
- Nuevos clientes o contratos anunciados por competencia
- Noticias relevantes del sector
- Oportunidades detectadas (empresas que preguntan por robots en redes)
- Recomendación de ajuste de posicionamiento si aplica

ALERTA INMEDIATA si:
- Competidor lanza oferta agresiva de precio
- Competidor firma cliente que BotMate estaba prospectando
- Noticia viral sobre robots en México (oportunidad de contenido)`,
  },
  {
    id: "22",
    layer: 5,
    layerName: "CAPA 5 — INTELIGENCIA Y RETENCIÓN",
    name: "Agente de Sistemas",
    role: "Credenciales, suscripciones, costos",
    desc: "Gestiona todas las credenciales, costos y fechas de renovación de la infraestructura BotMate.",
    color: "#ef4444",
    prompt: `ROL: Eres el Agente de Sistemas de BotMate. Eres el guardián de toda la infraestructura tecnológica. Sin ti, nada funciona.

RESPONSABILIDADES:
1. Mantener registro cifrado de TODAS las credenciales de plataforma
2. Monitorear fechas de renovación y alertar 7 días antes
3. Generar reporte mensual de costos operativos para Ivan
4. Rastrear qué agente usa qué plataforma
5. NUNCA exponer contraseñas en texto plano en reportes

REGISTRO DE PLATAFORMAS (gestionar):
| Plataforma | Agentes que la usan | Costo/mes | Próxima renovación |
|---|---|---|---|
| Railway + n8n | TODOS (motor) | $10 | [fecha] |
| Claude API | TODOS los agentes IA | $50-80 | Por uso |
| Meta Cloud API | 10, 11, 15 | $10-20 | [fecha] |
| Airtable | 07-15, 20 (CRM) | $0-10 | [fecha] |
| Google Workspace | 11, 15 (email) | $6 | [fecha] |
| Meta Ads API | 16 | Presupuesto variable | [fecha] |
| Apollo.io | 07 (prospección) | $49 | [fecha] |
| Instantly.ai | 11 (cold email) | $37 | [fecha] |
| Telegram Bot | 01 (notificaciones) | $0 | N/A |
| Phantombuster | 12 (LinkedIn) | $56 | [fecha] |

COSTO OPERATIVO TOTAL ESTIMADO: $225-268/mes USD

ALERTA DE RENOVACIÓN (7 días antes, via Telegram a Ivan):
"⚠️ RENOVACIÓN PRÓXIMA — [Plataforma] vence en 7 días. Costo: $[X]. ¿Confirmo renovación automática?"

REPORTE MENSUAL (día 1 de cada mes):
- Costo total mes anterior
- Variaciones vs. mes anterior
- Plataformas en uso vs. subutilizadas
- Recomendaciones de optimización de costos
- Credenciales que deben rotarse por seguridad

PROTOCOLO DE SEGURIDAD:
- Contraseñas almacenadas con AES-256
- Rotación de API keys cada 90 días
- Acceso a credenciales solo bajo solicitud autenticada de Ivan
- Log de cada acceso a credenciales`,
  },
];

const WORKFLOWS = [
  {
    id: 1,
    name: "Prospección Automática",
    trigger: "Cron diario 6am",
    color: "#818cf8",
    steps: [
      { label: "Apollo.io API", color: "#818cf8" },
      { label: "Agente Enriquecimiento", color: "#818cf8" },
      { label: "Agente Segmentación", color: "#818cf8" },
      { label: "Airtable CRM", color: "#22c55e" },
    ],
    desc: "Genera 50+ leads diarios por vertical, enriquece datos y los prioriza automáticamente en el CRM.",
  },
  {
    id: 2,
    name: "Captura y Calificación",
    trigger: "Lead Ad Meta / Formulario web",
    color: "#3b82f6",
    steps: [
      { label: "Lead Ad / Web Form", color: "#3b82f6" },
      { label: "Airtable CRM", color: "#22c55e" },
      { label: "Claude Ventas IA", color: "#818cf8" },
      { label: "WhatsApp + Email", color: "#22c55e" },
    ],
    desc: "Captura leads de ads y web, los califica con IA en segundos y dispara respuesta inmediata.",
  },
  {
    id: 3,
    name: "Seguimiento Automático",
    trigger: "Cron cada 48h",
    color: "#fbbf24",
    steps: [
      { label: "Cron 48h checker", color: "#fbbf24" },
      { label: "Leads sin respuesta", color: "#64748b" },
      { label: "Outreach WA + Email", color: "#22c55e" },
      { label: "Registro Airtable", color: "#22c55e" },
    ],
    desc: "Detecta automáticamente leads sin respuesta y activa follow-up multicanal sin intervención humana.",
  },
  {
    id: 4,
    name: "Cotización en Tiempo Real",
    trigger: "Intent detection (palabras clave precio)",
    color: "#22c55e",
    steps: [
      { label: "Detección intención", color: "#ef4444" },
      { label: "Claude Finanzas IA", color: "#818cf8" },
      { label: "Genera PDF", color: "#fbbf24" },
      { label: "Gmail + WhatsApp", color: "#22c55e" },
    ],
    desc: "Desde detección de intención hasta cotización PDF enviada: menos de 60 segundos.",
  },
  {
    id: 5,
    name: "Contenido Semanal",
    trigger: "Cron lunes 8am",
    color: "#f97316",
    steps: [
      { label: "Cron semanal", color: "#f97316" },
      { label: "Claude Marketing IA", color: "#818cf8" },
      { label: "7 posts generados", color: "#94a3b8" },
      { label: "FB / IG / LinkedIn", color: "#3b82f6" },
    ],
    desc: "Genera y programa automáticamente el contenido de la semana completa en todos los canales.",
  },
  {
    id: 6,
    name: "Reactivación Mensual",
    trigger: "Cron día 1 de cada mes",
    color: "#06b6d4",
    steps: [
      { label: "Cron mensual", color: "#06b6d4" },
      { label: "Leads fríos 30d+", color: "#64748b" },
      { label: "Nuevo ángulo IA", color: "#818cf8" },
      { label: "Secuencia nueva", color: "#22c55e" },
    ],
    desc: "Reactiva toda la base de leads fríos con un ángulo diferente cada mes. Ningún lead se pierde.",
  },
];

const ROADMAP = [
  {
    week: "SEMANA 1 — FUNDAMENTOS",
    color: "#3b82f6",
    items: [
      "Configurar Railway + n8n con credenciales de todas las plataformas",
      "Activar Agente de Sistemas (22) — registro completo de plataformas",
      "Configurar Agente de Prospección (07) con Apollo.io — primera corrida de 50 leads",
      "Conectar Airtable CRM con estructura de datos definida",
      "Activar Agente Director General (01) — reporte 7am Telegram",
      "Probar flujo completo: prospección → enriquecimiento → segmentación",
    ],
  },
  {
    week: "SEMANA 2 — OUTREACH",
    color: "#22c55e",
    items: [
      "Activar Agente WhatsApp (10) con secuencia de 5 mensajes por vertical",
      "Configurar Instantly.ai — primera campaña de cold email (100 contactos)",
      "Activar Phantombuster — 50 conexiones diarias LinkedIn",
      "Configurar Meta Ads API — primera campaña de generación de leads",
      "Activar Agente de Cotización PDF (15) — prueba end-to-end",
      "Meta: 500 prospectos en pipeline, 50 conversaciones activas",
    ],
  },
  {
    week: "SEMANA 3 — CONTENIDO Y ADS",
    color: "#818cf8",
    items: [
      "Activar calendario de contenido social — 7 posts/semana automatizados",
      "Lanzar campaña Meta Ads con $5,000 MXN de presupuesto inicial",
      "Publicar primer artículo SEO en botmate.mx",
      "Activar Agente de Reactivación (13) para leads de semanas anteriores",
      "Configurar Agente de Cierre (14) con secuencia de 72h",
      "Meta: 1,000 leads en CRM, 10 demos agendadas",
    ],
  },
  {
    week: "SEMANA 4 — PRIMER CIERRE",
    color: "#fbbf24",
    items: [
      "Revisar métricas de todas las campañas — optimizar lo que no convierte",
      "Activar Agente de Customer Success (20) para primer cliente",
      "Lanzar Agente de Inteligencia Competitiva (21) — primer reporte",
      "Optimizar secuencias de outreach con datos reales de respuesta",
      "OBJETIVO: Primer robot rentado — $13,000 MXN/mes en revenue",
      "Reportar ROI del sistema completo al mes: inversión vs. revenue generado",
    ],
  },
];

const ROBOTS = Array.from({ length: 19 }, (_, i) => ({
  id: `PB2-${String(i + 1).padStart(3, "0")}`,
  model: "PuduBot 2",
  status: "DISPONIBLE",
  location: "Bodega CDMX",
  revenue: "$13,000/mes",
  rented: false,
}));

const CREDENTIALS = [
  { platform: "Railway + n8n", user: "ivan@botmate.mx", cost: "~$10/mes", renewal: "2026-04-15", status: "ACTIVO", color: "#22c55e" },
  { platform: "Claude API Anthropic", user: "ivan@botmate.mx", cost: "~$50-80/mes", renewal: "Por uso", status: "ACTIVO", color: "#818cf8" },
  { platform: "Meta Cloud API", user: "BotMate Business", cost: "~$10-20/mes", renewal: "2026-04-30", status: "ACTIVO", color: "#3b82f6" },
  { platform: "Airtable", user: "ivan@botmate.mx", cost: "$0-10/mes", renewal: "2026-05-01", status: "ACTIVO", color: "#22c55e" },
  { platform: "Google Workspace", user: "ivan@botmate.mx", cost: "$6/mes", renewal: "2026-04-20", status: "ACTIVO", color: "#fbbf24" },
  { platform: "Meta Ads API", user: "BotMate Business", cost: "Variable", renewal: "Continuo", status: "ACTIVO", color: "#f97316" },
  { platform: "Apollo.io", user: "ivan@botmate.mx", cost: "$49/mes", renewal: "2026-04-18", status: "ACTIVO", color: "#818cf8" },
  { platform: "Instantly.ai", user: "ivan@botmate.mx", cost: "$37/mes", renewal: "2026-04-22", status: "ACTIVO", color: "#3b82f6" },
  { platform: "Telegram Bot API", user: "@botmate_bot", cost: "GRATIS", renewal: "N/A", status: "ACTIVO", color: "#22c55e" },
  { platform: "Phantombuster", user: "ivan@botmate.mx", cost: "$56/mes", renewal: "2026-04-25", status: "ACTIVO", color: "#a78bfa" },
];

const LAYER_COLORS = {
  1: "#3b82f6",
  2: "#818cf8",
  3: "#22c55e",
  4: "#f97316",
  5: "#06b6d4",
};

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button style={STYLES.copyBtn} onClick={handleCopy}>
      {copied ? "✓ COPIADO" : "COPIAR PROMPT"}
    </button>
  );
}

function AgentDetail({ agent, onBack }) {
  return (
    <div>
      <button style={STYLES.backBtn} onClick={onBack}>← VOLVER A AGENTES</button>
      <div style={{ ...STYLES.card, borderLeft: `3px solid ${agent.color}`, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div>
            <span style={{ color: agent.color, fontWeight: "700", fontSize: "18px", marginRight: "10px" }}>
              [{agent.id}]
            </span>
            <span style={{ color: "#e2e8f0", fontWeight: "700", fontSize: "15px" }}>{agent.name}</span>
          </div>
          <span style={STYLES.platformBadge(agent.color)}>{agent.layerName}</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>{agent.role}</div>
        <div style={{ color: "#64748b", fontSize: "12px" }}>{agent.desc}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={STYLES.sectionTitle}>SYSTEM PROMPT</div>
        <CopyButton text={agent.prompt} />
      </div>
      <div style={STYLES.promptBox}>{agent.prompt}</div>
    </div>
  );
}

function OverviewTab() {
  const { data, loading, lastUpdated, refresh } = useLiveMetrics();
  const totalCostMin = 10 + 50 + 10 + 0 + 6 + 49 + 37 + 0 + 56;
  const totalCostMax = 10 + 80 + 20 + 10 + 6 + 49 + 37 + 0 + 56;

  const m = data || {};
  const leads = m.leads || {};
  const robots = m.robots || {};
  const revenue = m.revenue || {};
  const wfs = m.workflows || {};

  const robotsActivos = robots.activos ?? 0;
  const robotsDisponibles = robots.disponibles ?? 19;
  const ingresoActual = revenue.ingresosActuales ?? 0;
  const potencialPerdido = revenue.potencialPerdido ?? 247000;
  const leadsTotal = leads.total ?? 0;
  const leadsHoy = leads.hoy ?? 0;
  const pipeline = leads.pipeline || {};

  const PIPELINE_COLORS = {
    "Nuevo": "#3b82f6", "Contactado": "#f59e0b", "Calificado": "#8b5cf6",
    "Propuesta": "#f97316", "Negociación": "#ec4899", "Cerrado Ganado": "#22c55e",
    "Cerrado Perdido": "#ef4444", "Seguimiento": "#06b6d4"
  };

  return (
    <div>
      {/* LIVE INDICATOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#f59e0b" : "#22c55e", display: "inline-block", boxShadow: `0 0 6px ${loading ? "#f59e0b" : "#22c55e"}` }} />
          <span style={{ color: "#64748b", fontSize: "11px", letterSpacing: "1px" }}>
            {loading ? "CARGANDO DATOS..." : `DATOS EN VIVO · ${lastUpdated ? lastUpdated.toLocaleTimeString("es-MX") : ""}`}
          </span>
        </div>
        <button onClick={refresh} style={{ background: "#1e3a5f", border: "1px solid #3b82f6", color: "#3b82f6", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* ALERT BANNER */}
      <div style={STYLES.alertBanner}>
        <div>
          <div style={STYLES.alertText}>
            ⚠ {robotsDisponibles} ROBOTS PARADOS = ${(robotsDisponibles * 13000).toLocaleString("es-MX")} MXN/MES POTENCIAL
          </div>
          <div style={STYLES.alertSub}>
            {robotsActivos > 0
              ? `${robotsActivos} robot(s) activo(s) generando $${ingresoActual.toLocaleString("es-MX")} MXN/mes`
              : `Cada día sin rentar = $${Math.round(robotsDisponibles * 13000 / 30).toLocaleString("es-MX")} MXN de costo de oportunidad`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: ingresoActual > 0 ? "#22c55e" : "#ef4444", fontSize: "28px", fontWeight: "700" }}>
            ${ingresoActual > 0 ? (ingresoActual / 1000).toFixed(0) + "K" : "0"}
          </div>
          <div style={{ color: "#f87171", fontSize: "11px" }}>MXN/mes actual</div>
        </div>
      </div>

      {/* LIVE KPI GRID */}
      <div style={STYLES.sectionTitle}>📊 KPIs EN TIEMPO REAL</div>
      <div style={{ ...STYLES.grid3, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "LEADS TOTALES", value: leadsTotal, sub: `${leadsHoy} hoy`, color: "#3b82f6" },
          { label: "ROBOTS ACTIVOS", value: `${robotsActivos}/${robots.total ?? 19}`, sub: `${robotsDisponibles} disponibles`, color: robotsActivos > 0 ? "#22c55e" : "#ef4444" },
          { label: "REVENUE ACTUAL", value: ingresoActual > 0 ? `$${(ingresoActual/1000).toFixed(0)}K` : "$0", sub: "MXN/mes", color: ingresoActual > 0 ? "#22c55e" : "#ef4444" },
          { label: "POTENCIAL", value: `$${Math.round(potencialPerdido / 1000)}K`, sub: "MXN/mes por capturar", color: "#f59e0b" },
          { label: "WORKFLOWS n8n", value: `${wfs.activos ?? 8}`, sub: `${wfs.total ?? 8} activos`, color: "#22c55e" },
          { label: "SCORE PROMEDIO", value: leads.scorePromedio ?? "—", sub: "IA de calificación", color: "#8b5cf6" },
        ].map((kpi, i) => (
          <div key={i} style={{ ...STYLES.card, borderTop: `2px solid ${kpi.color}` }}>
            <div style={STYLES.cardTitle}>{kpi.label}</div>
            <div style={{ ...STYLES.statBig, color: kpi.color }}>{kpi.value}</div>
            <div style={STYLES.statSub}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* PIPELINE FUNNEL */}
      {Object.keys(pipeline).length > 0 && (
        <>
          <div style={STYLES.sectionTitle}>🔻 PIPELINE POR ETAPA</div>
          <div style={STYLES.card}>
            {Object.entries(pipeline).map(([etapa, count]) => {
              const pct = Math.round((count / leadsTotal) * 100) || 1;
              const color = PIPELINE_COLORS[etapa] || "#64748b";
              return (
                <div key={etapa} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>{etapa}</span>
                    <span style={{ color, fontWeight: "700", fontSize: "12px" }}>{count} leads</span>
                  </div>
                  <div style={STYLES.progressBarOuter}>
                    <div style={STYLES.progressBarInner(pct, color)} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* AGENTS STATUS */}
      <div style={STYLES.sectionTitle}>🤖 ESTADO DE AGENTES</div>
      <div style={{ ...STYLES.grid3, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {[
          { id: "01", name: "Prospección Apollo", status: "ACTIVO", next: "6:00 AM", color: "#22c55e" },
          { id: "02", name: "Calificación IA", status: "ACTIVO", next: "Cada 5 min", color: "#22c55e" },
          { id: "03", name: "WhatsApp Outreach", status: "ACTIVO", next: "Webhook", color: "#22c55e" },
          { id: "04", name: "Cotización PDF", status: "ACTIVO", next: "Webhook", color: "#22c55e" },
          { id: "05", name: "Contenido Social", status: "ACTIVO", next: "Lun 7:00 AM", color: "#22c55e" },
          { id: "06", name: "Reporte Diario", status: "ACTIVO", next: "7:00 AM", color: "#22c55e" },
          { id: "07", name: "Seguimiento Leads", status: "ACTIVO", next: "Cada hora", color: "#22c55e" },
          { id: "08", name: "Monitor Pipeline", status: "ACTIVO", next: "Lun 8:00 AM", color: "#22c55e" },
          { id: "TG", name: "Telegram Notif.", status: "PENDIENTE", next: "Token requerido", color: "#f59e0b" },
        ].map((ag) => (
          <div key={ag.id} style={{ ...STYLES.card, borderLeft: `3px solid ${ag.color}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: "700", fontSize: "12px" }}>AG-{ag.id} {ag.name}</div>
              <div style={{ color: "#64748b", fontSize: "10px", marginTop: "2px" }}>Próx: {ag.next}</div>
            </div>
            <span style={{ ...STYLES.stepBadge(ag.color), fontSize: "10px" }}>{ag.status}</span>
          </div>
        ))}
      </div>

      {/* STACK */}
      <div style={STYLES.sectionTitle}>STACK TECNOLÓGICO</div>
      <div style={STYLES.grid3}>
        {STACK.map((s, i) => (
          <div key={i} style={{ ...STYLES.card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#e2e8f0", fontWeight: "700", fontSize: "12px" }}>{s.name}</div>
                <div style={{ color: "#64748b", fontSize: "10px", marginTop: "3px", letterSpacing: "1px" }}>{s.role}</div>
              </div>
              <div style={{ ...STYLES.platformBadge(s.color), fontSize: "11px" }}>{s.cost}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentsTab() {
  const [selected, setSelected] = useState(null);
  if (selected) return <AgentDetail agent={selected} onBack={() => setSelected(null)} />;

  const layers = [1, 2, 3, 4, 5];
  return (
    <div>
      <div style={{ ...STYLES.grid3, marginBottom: "16px" }}>
        {layers.map((l) => {
          const layerAgents = AGENTS.filter((a) => a.layer === l);
          return (
            <div key={l} style={{ ...STYLES.card, borderTop: `2px solid ${LAYER_COLORS[l]}` }}>
              <div style={{ color: LAYER_COLORS[l], fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700" }}>
                CAPA {l}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
                {layerAgents[0]?.layerName.replace(`CAPA ${l} — `, "")}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: "700", marginTop: "6px" }}>
                {layerAgents.length}
              </div>
              <div style={{ color: "#475569", fontSize: "10px" }}>agentes</div>
            </div>
          );
        })}
      </div>

      {layers.map((l) => (
        <div key={l}>
          <div style={STYLES.layerLabel}>
            — CAPA {l}: {AGENTS.find((a) => a.layer === l)?.layerName.replace(`CAPA ${l} — `, "")} —
          </div>
          {AGENTS.filter((a) => a.layer === l).map((agent) => (
            <div
              key={agent.id}
              style={STYLES.agentCard(agent.color)}
              onClick={() => setSelected(agent)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#172033")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: agent.color, fontSize: "11px", marginRight: "8px", fontWeight: "700" }}>
                    [{agent.id}]
                  </span>
                  <span style={STYLES.agentName}>{agent.name}</span>
                  <div style={STYLES.agentDesc}>{agent.role} — {agent.desc}</div>
                </div>
                <span style={{ color: "#334155", fontSize: "16px", marginLeft: "12px" }}>→</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function WorkflowsTab() {
  return (
    <div>
      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "20px" }}>
        6 flujos de automatización orquestados por n8n en Railway. Click para ver detalles.
      </div>
      {WORKFLOWS.map((wf) => (
        <div key={wf.id} style={{ ...STYLES.workflowCard, borderLeft: `3px solid ${wf.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              <span style={{ color: "#475569", fontSize: "11px", marginRight: "8px" }}>FLUJO {wf.id}</span>
              <span style={STYLES.workflowTitle}>{wf.name}</span>
            </div>
            <span style={STYLES.platformBadge(wf.color)}>{wf.trigger}</span>
          </div>
          <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "12px" }}>{wf.desc}</div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            {wf.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={STYLES.stepBadge(step.color)}>{step.label}</span>
                {i < wf.steps.length - 1 && <span style={STYLES.arrow}>→</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoadmapTab() {
  return (
    <div>
      <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "20px" }}>
        Plan de implementación en 4 semanas para activar el sistema completo.
      </div>
      {ROADMAP.map((week, wi) => (
        <div key={wi} style={{ ...STYLES.roadmapWeek, borderLeft: `3px solid ${week.color}` }}>
          <div style={{ ...STYLES.weekLabel, color: week.color }}>{week.week}</div>
          {week.items.map((item, i) => (
            <div key={i} style={STYLES.checkItem}>
              <div style={STYLES.checkBox}>
                <span style={{ color: "#1e293b", fontSize: "8px" }}>✓</span>
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function RobotsTab() {
  const { data, loading, lastUpdated, refresh } = useLiveMetrics();
  const liveRobots = data?.robots?.lista || [];
  const robotsActivos = data?.robots?.activos ?? 0;
  const robotsTotal = data?.robots?.total ?? 19;
  const ingresoActual = data?.revenue?.ingresosActuales ?? 0;
  const potential = robotsTotal * 13000;

  const STATUS_COLORS = {
    "Desplegado": "#22c55e", "disponible": "#3b82f6",
    "Disponible": "#3b82f6", "mantenimiento": "#f59e0b", "demo": "#8b5cf6"
  };

  return (
    <div>
      {/* LIVE INDICATOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ color: "#64748b", fontSize: "11px" }}>
          {loading ? "⏳ Cargando datos de Airtable..." : `✅ Datos en vivo · ${lastUpdated?.toLocaleTimeString("es-MX") || ""}`}
        </span>
        <button onClick={refresh} style={{ background: "#1e3a5f", border: "1px solid #3b82f6", color: "#3b82f6", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>↻</button>
      </div>

      <div style={STYLES.alertBanner}>
        <div>
          <div style={STYLES.alertText}>
            {robotsActivos === 0
              ? `⚠ ${robotsTotal} ROBOTS PARADOS = $${potential.toLocaleString("es-MX")} MXN/MES POTENCIAL`
              : `⚡ ${robotsActivos} ROBOT${robotsActivos > 1 ? "S" : ""} ACTIVO${robotsActivos > 1 ? "S" : ""} — ACTIVA MÁS`}
          </div>
          <div style={STYLES.alertSub}>
            Revenue actual: ${ingresoActual.toLocaleString("es-MX")} MXN/mes | Potencial libre: ${(potential - ingresoActual).toLocaleString("es-MX")} MXN/mes
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: robotsActivos > 0 ? "#22c55e" : "#ef4444", fontSize: "28px", fontWeight: "700" }}>
            {robotsActivos}/{robotsTotal}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "11px" }}>robots activos</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #22c55e" }}>
          <div style={STYLES.cardTitle}>REVENUE ACTUAL</div>
          <div style={{ ...STYLES.statBig, color: ingresoActual > 0 ? "#22c55e" : "#ef4444" }}>
            ${ingresoActual.toLocaleString("es-MX")} MXN
          </div>
          <div style={STYLES.statSub}>por mes</div>
        </div>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #fbbf24" }}>
          <div style={STYLES.cardTitle}>POTENCIAL TOTAL</div>
          <div style={{ ...STYLES.statBig, color: "#fbbf24" }}>${potential.toLocaleString("es-MX")} MXN</div>
          <div style={STYLES.statSub}>si todos activos</div>
        </div>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #3b82f6" }}>
          <div style={STYLES.cardTitle}>PRECIO/ROBOT/MES</div>
          <div style={{ ...STYLES.statBig, color: "#3b82f6" }}>$13,000</div>
          <div style={STYLES.statSub}>con contrato anual</div>
        </div>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "11px", marginBottom: "6px" }}>
          <span>Progreso de renta</span>
          <span>{robotsActivos}/{robotsTotal} robots</span>
        </div>
        <div style={STYLES.progressBarOuter}>
          <div style={STYLES.progressBarInner(Math.round((robotsActivos / robotsTotal) * 100), "#22c55e")} />
        </div>
      </div>

      <div style={STYLES.sectionTitle}>INVENTARIO EN VIVO — AIRTABLE ({robotsTotal} UNIDADES)</div>

      {liveRobots.length > 0 ? liveRobots.map((robot, i) => {
        const statusColor = STATUS_COLORS[robot.estado] || "#64748b";
        const isActive = robot.estado === "Desplegado";
        return (
          <div key={i} style={{ ...STYLES.robotCard, borderColor: isActive ? "#22c55e40" : "#1e3a5f" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#3b82f6", fontFamily: "monospace", fontSize: "12px", fontWeight: "700" }}>
                #{String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: "13px", fontWeight: "600" }}>{robot.nombre} · {robot.modelo}</div>
                <div style={{ color: "#475569", fontSize: "11px" }}>{robot.cliente || "Sin cliente asignado"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#22c55e", fontSize: "12px", fontWeight: "700" }}>${(robot.precio || 13000).toLocaleString("es-MX")} MXN</div>
                <div style={{ color: "#475569", fontSize: "10px" }}>con contrato</div>
              </div>
              <span style={{ background: `${statusColor}20`, border: `1px solid ${statusColor}`, color: statusColor, padding: "3px 9px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px" }}>
                {robot.estado?.toUpperCase()}
              </span>
            </div>
          </div>
        );
      }) : (
        <div style={{ ...STYLES.card, textAlign: "center", color: "#64748b", padding: "30px" }}>
          {loading ? "⏳ Cargando inventario desde Airtable..." : "No se encontraron robots. Verifica la conexión."}
        </div>
      )}

      <div style={{ ...STYLES.card, marginTop: "20px", borderTop: "2px solid #818cf8" }}>
        <div style={STYLES.sectionTitle}>PRECIOS DE REFERENCIA</div>
        <div style={STYLES.grid2}>
          <div>
            <div style={{ color: "#818cf8", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>
              PUDUBOT 2 — MESERO / ENTREGA / PROMOTOR
            </div>
            {[
              ["Por día sin todo incluido", "$700 MXN + logística $4,000 + branding $1,100/robot + prog. $1,000/ubi"],
              ["Mensual sin contrato", "$21,000 MXN/mes (equivale a $700/día × 30)"],
              ["Contrato anual 2 años", "$13,000 MXN/mes TODO INCLUIDO"],
              ["Flotilla 3+ robots con contrato", "$11,500/robot/mes"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", fontSize: "12px" }}>
                <span style={{ color: "#475569", minWidth: "180px" }}>{k}:</span>
                <span style={{ color: "#94a3b8" }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>
              ROBOT CC1 — LIMPIEZA PROFESIONAL
            </div>
            {[
              ["Compra directa", "$290,000 MXN + póliza $17,500 = $307,500 MXN + IVA"],
              ["Híbrido sin enganche", "5 meses × $25,000/mes + póliza $17,500"],
              ["MSI 3M / 6M / 12M", "$106,667 / $53,333 / $26,667"],
              ["BotMate Flex 20% enganche", "Flex12 $21,333 | Flex18 $14,222 | Flex24 $10,667"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", fontSize: "12px" }}>
                <span style={{ color: "#475569", minWidth: "180px" }}>{k}:</span>
                <span style={{ color: "#94a3b8" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          background: "#172033",
          border: "1px solid #3b82f640",
          borderRadius: "6px",
          padding: "12px 16px",
          marginTop: "12px",
          color: "#93c5fd",
          fontSize: "13px",
          fontStyle: "italic",
          textAlign: "center",
        }}>
          "Robot = sueldo de un empleado. Sin IMSS. Sin prestaciones. Sin vacaciones. Sin rotación."
        </div>
      </div>
    </div>
  );
}

function SistemasTab() {
  const [revealed, setRevealed] = useState({});
  const totalCost = "$218-268 USD/mes (~$4,100-5,000 MXN)";

  const toggleReveal = (i) => {
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #ef4444" }}>
          <div style={STYLES.cardTitle}>COSTO TOTAL/MES</div>
          <div style={{ ...STYLES.statBig, color: "#f87171", fontSize: "18px" }}>{totalCost}</div>
          <div style={STYLES.statSub}>infraestructura completa</div>
        </div>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #22c55e" }}>
          <div style={STYLES.cardTitle}>PLATAFORMAS ACTIVAS</div>
          <div style={{ ...STYLES.statBig, color: "#22c55e" }}>10</div>
          <div style={STYLES.statSub}>todas operativas</div>
        </div>
        <div style={{ ...STYLES.card, flex: 1, borderTop: "2px solid #fbbf24" }}>
          <div style={STYLES.cardTitle}>PRÓXIMA RENOVACIÓN</div>
          <div style={{ ...STYLES.statBig, color: "#fbbf24", fontSize: "16px" }}>Apr 15, 2026</div>
          <div style={STYLES.statSub}>Railway + n8n</div>
        </div>
      </div>

      <div style={STYLES.sectionTitle}>GESTIÓN DE CREDENCIALES</div>
      <div style={{ color: "#475569", fontSize: "11px", marginBottom: "12px" }}>
        Las contraseñas se muestran enmascaradas por seguridad. El Agente de Sistemas (22) gestiona acceso completo.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={STYLES.table}>
          <thead>
            <tr>
              {["PLATAFORMA", "USUARIO / EMAIL", "CONTRASEÑA", "COSTO/MES", "RENOVACIÓN", "STATUS"].map((h) => (
                <th key={h} style={STYLES.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((cred, i) => (
              <tr key={i} style={STYLES.credRow(i)}>
                <td style={STYLES.td}>
                  <span style={STYLES.dot(cred.color)} />
                  <span style={{ color: "#e2e8f0", fontWeight: "600" }}>{cred.platform}</span>
                </td>
                <td style={STYLES.td}>{cred.user}</td>
                <td style={STYLES.td}>
                  <span
                    style={{ ...STYLES.maskedPw, cursor: "pointer" }}
                    onClick={() => toggleReveal(i)}
                    title="Click para simular revelado"
                  >
                    {revealed[i] ? "••••••••[PROTEGIDO]" : "••••••••••••"}
                  </span>
                </td>
                <td style={STYLES.td}>
                  <span style={STYLES.platformBadge(cred.color)}>{cred.cost}</span>
                </td>
                <td style={STYLES.td}>{cred.renewal}</td>
                <td style={STYLES.td}>
                  <span style={{ ...STYLES.availBadge, fontSize: "10px" }}>{cred.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...STYLES.card, marginTop: "20px" }}>
        <div style={STYLES.sectionTitle}>SISTEMA PROMPT — AGENTE 22</div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <CopyButton text={AGENTS.find((a) => a.id === "22").prompt} />
        </div>
        <div style={STYLES.promptBox}>{AGENTS.find((a) => a.id === "22").prompt}</div>
      </div>

      <div style={{ ...STYLES.card, marginTop: "16px", borderLeft: "3px solid #fbbf24" }}>
        <div style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", marginBottom: "10px" }}>
          PROTOCOLO DE SEGURIDAD
        </div>
        {[
          "Contraseñas almacenadas con cifrado AES-256",
          "Rotación de API keys cada 90 días",
          "Alerta automática 7 días antes de cualquier renovación",
          "Log de acceso a cada credencial con timestamp",
          "Acceso solo bajo solicitud autenticada de Ivan vía Telegram",
          "Reporte mensual de costos sin exposición de passwords",
        ].map((item, i) => (
          <div key={i} style={STYLES.checkItem}>
            <span style={{ color: "#22c55e", fontSize: "14px" }}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AGENT MONITOR (LIVE STATUS) ─────────────────────────────────────────────

const MONITOR_URL = "https://primary-production-c732.up.railway.app/webhook/agent-monitor";
const RUN_NOW_URL = "https://primary-production-c732.up.railway.app/webhook/nexus-run-agent";

// Map workflow names to agent identities
const WF_META = {
  "01 Prospección":   { agent: "APOLO",   icon: "🎯", color: "#f59e0b", layer: "CAPTACION" },
  "09 Apollo":        { agent: "APOLO",   icon: "🎯", color: "#f59e0b", layer: "CAPTACION" },
  "NEXUS Orchestrat": { agent: "NEXUS",   icon: "🧠", color: "#06b6d4", layer: "CEREBRO" },
  "NEXUS-CALIFICAR":  { agent: "NEXUS",   icon: "🧠", color: "#06b6d4", layer: "CEREBRO" },
  "NEXUS-AGENT-MONI": { agent: "NEXUS",   icon: "🧠", color: "#06b6d4", layer: "CEREBRO" },
  "NEXUS-TELEGRAM":   { agent: "NEXUS",   icon: "🧠", color: "#06b6d4", layer: "CEREBRO" },
  "NEXUS-EMAIL":      { agent: "HERMES",  icon: "📧", color: "#10b981", layer: "CONTACTO" },
  "NEXUS-MERCURY":    { agent: "MERCURY", icon: "💬", color: "#f97316", layer: "CONTACTO" },
  "03 WhatsApp":      { agent: "MERCURY", icon: "💬", color: "#f97316", layer: "CONTACTO" },
  "10 WhatsApp":      { agent: "MERCURY", icon: "💬", color: "#f97316", layer: "CONTACTO" },
  "19 Cotización":    { agent: "MERCURY", icon: "💬", color: "#f97316", layer: "CONTACTO" },
  "NEXUS-PROPUESTA":  { agent: "SIGMA",   icon: "📝", color: "#8b5cf6", layer: "CIERRE" },
  "04 Cotización":    { agent: "SIGMA",   icon: "📝", color: "#8b5cf6", layer: "CIERRE" },
  "12 Confirmación":  { agent: "SIGMA",   icon: "📝", color: "#8b5cf6", layer: "CIERRE" },
  "07 TRACKER":       { agent: "TRACKER", icon: "📡", color: "#ef4444", layer: "SEGUIMIENTO" },
  "13 Nutrición":     { agent: "TRACKER", icon: "📡", color: "#ef4444", layer: "SEGUIMIENTO" },
  "NEXUS-RESCATE":    { agent: "TRACKER", icon: "📡", color: "#ef4444", layer: "SEGUIMIENTO" },
  "06 Reporte":       { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "15 Reporte":       { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "18 Resumen":       { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "08 Monitor":       { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "17 Alerta":        { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "METRICS API":      { agent: "ATLAS",   icon: "📊", color: "#3b82f6", layer: "REPORTES" },
  "21 Score":         { agent: "ORACLE",  icon: "🔮", color: "#a855f7", layer: "INTELIGENCIA" },
  "22 Monitor Robots":{ agent: "ONYX",    icon: "⚙️", color: "#64748b", layer: "OPERACIONES" },
  "14 Onboarding":    { agent: "ONYX",    icon: "⚙️", color: "#64748b", layer: "OPERACIONES" },
  "05 Generación":    { agent: "CONTENT", icon: "🎬", color: "#ec4899", layer: "MARKETING" },
  "WAR ROOM":         { agent: "NEXUS",   icon: "🧠", color: "#06b6d4", layer: "CEREBRO" },
};

function getWfMeta(name) {
  for (const [key, val] of Object.entries(WF_META)) {
    if (name.includes(key)) return val;
  }
  return { agent: "OTHER", icon: "⚡", color: "#475569", layer: "OTROS" };
}

function timeAgo(iso) {
  if (!iso) return "nunca";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "hace " + Math.round(diff) + "s";
  if (diff < 3600) return "hace " + Math.round(diff / 60) + "m";
  if (diff < 86400) return "hace " + Math.round(diff / 3600) + "h";
  return "hace " + Math.round(diff / 86400) + "d";
}

function AgentMonitorTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [runningAgents, setRunningAgents] = useState(new Set());
  const [filter, setFilter] = useState("all");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(MONITOR_URL);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdate(new Date());
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const triggerAgent = async (agentName, wfId) => {
    setRunningAgents(prev => new Set([...prev, wfId]));
    try {
      await fetch(RUN_NOW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentName, workflow_id: wfId }),
      });
      setTimeout(() => {
        fetchStatus();
        setRunningAgents(prev => { const s = new Set(prev); s.delete(wfId); return s; });
      }, 3000);
    } catch (_) {
      setRunningAgents(prev => { const s = new Set(prev); s.delete(wfId); return s; });
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
      Cargando estado del sistema...
    </div>
  );

  const agents = data?.agents || [];
  const summary = data?.summary || {};

  const LAYERS = ["CEREBRO", "CAPTACION", "CONTACTO", "CIERRE", "SEGUIMIENTO", "REPORTES", "INTELIGENCIA", "OPERACIONES", "MARKETING", "OTROS"];
  const LAYER_COLORS = {
    CEREBRO: "#06b6d4", CAPTACION: "#f59e0b", CONTACTO: "#f97316",
    CIERRE: "#8b5cf6", SEGUIMIENTO: "#ef4444", REPORTES: "#3b82f6",
    INTELIGENCIA: "#a855f7", OPERACIONES: "#64748b", MARKETING: "#ec4899", OTROS: "#475569",
  };

  const filtered = filter === "all" ? agents
    : filter === "never" ? agents.filter(a => a.lastStatus === "never")
    : filter === "error" ? agents.filter(a => a.lastStatus === "error")
    : agents.filter(a => a.lastStatus === "success");

  const grouped = {};
  for (const a of filtered) {
    const meta = getWfMeta(a.name);
    const layer = meta.layer;
    if (!grouped[layer]) grouped[layer] = [];
    grouped[layer].push({ ...a, meta });
  }

  const statusColor = (s) => s === "success" ? "#22c55e" : s === "error" ? "#ef4444" : s === "never" ? "#f59e0b" : "#475569";
  const statusLabel = (s) => s === "success" ? "OK" : s === "error" ? "ERROR" : s === "never" ? "PENDIENTE" : "?";

  return (
    <div>
      {/* Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL WORKFLOWS", value: summary.total || 0, color: "#3b82f6" },
          { label: "ACTIVOS", value: summary.active || 0, color: "#22c55e" },
          { label: "SALUDABLES", value: summary.healthy || 0, color: "#22c55e" },
          { label: "CON ERRORES", value: summary.withErrors || 0, color: "#ef4444" },
          { label: "PENDIENTES", value: summary.neverRun || 0, color: "#f59e0b" },
        ].map(s => (
          <div key={s.label} style={{ ...STYLES.card, textAlign: "center", borderTop: "2px solid " + s.color }}>
            <div style={{ fontSize: "28px", fontWeight: "700", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "1px", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* NEXUS Orchestra Diagram */}
      <div style={{ ...STYLES.card, marginBottom: "20px", borderTop: "2px solid #06b6d4" }}>
        <div style={{ fontSize: "11px", color: "#06b6d4", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "16px" }}>
          NEXUS ORCHESTRA — FLUJO DE COMUNICACION ENTRE AGENTES
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", padding: "8px 0" }}>
          {[
            { name: "APOLO", icon: "🎯", color: "#f59e0b", desc: "Prospecta" },
            { arrow: "→" },
            { name: "NEXUS", icon: "🧠", color: "#06b6d4", desc: "Orquesta" },
            { arrow: "→" },
            { name: "CALIFICAR", icon: "⭐", color: "#06b6d4", desc: "Puntúa" },
            { arrow: "→" },
            { name: "NEXUS", icon: "🧠", color: "#06b6d4", desc: "Decide" },
          ].map((item, i) => item.arrow ? (
            <div key={i} style={{ color: "#334155", fontSize: "20px", margin: "0 4px" }}>{item.arrow}</div>
          ) : (
            <div key={i} style={{
              background: "#0f172a", border: "1px solid " + item.color + "40",
              borderRadius: "8px", padding: "8px 14px", textAlign: "center", minWidth: "80px"
            }}>
              <div style={{ fontSize: "18px" }}>{item.icon}</div>
              <div style={{ color: item.color, fontSize: "10px", fontWeight: "700" }}>{item.name}</div>
              <div style={{ color: "#475569", fontSize: "9px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", padding: "8px 0" }}>
          <div style={{ color: "#334155", fontSize: "11px", marginRight: "8px" }}>Score ≥80 →</div>
          {[
            { name: "MERCURY", icon: "💬", color: "#f97316", desc: "WhatsApp" },
            { arrow: "→" },
            { name: "TRACKER", icon: "📡", color: "#ef4444", desc: "Follow-up" },
            { arrow: "→" },
            { name: "SIGMA", icon: "📝", color: "#8b5cf6", desc: "Propuesta" },
            { arrow: "→" },
            { name: "ATLAS", icon: "📊", color: "#3b82f6", desc: "Reporta" },
          ].map((item, i) => item.arrow ? (
            <div key={i} style={{ color: "#334155", fontSize: "20px" }}>{item.arrow}</div>
          ) : (
            <div key={i} style={{
              background: "#0f172a", border: "1px solid " + item.color + "40",
              borderRadius: "8px", padding: "8px 14px", textAlign: "center", minWidth: "80px"
            }}>
              <div style={{ fontSize: "18px" }}>{item.icon}</div>
              <div style={{ color: item.color, fontSize: "10px", fontWeight: "700" }}>{item.name}</div>
              <div style={{ color: "#475569", fontSize: "9px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", padding: "4px 0" }}>
          <div style={{ color: "#334155", fontSize: "11px", marginRight: "8px" }}>Score 50-79 →</div>
          {[
            { name: "HERMES", icon: "📧", color: "#10b981", desc: "Email frío" },
            { arrow: "→" },
            { name: "TRACKER", icon: "📡", color: "#ef4444", desc: "Monitorea" },
          ].map((item, i) => item.arrow ? (
            <div key={i} style={{ color: "#334155", fontSize: "20px" }}>{item.arrow}</div>
          ) : (
            <div key={i} style={{
              background: "#0f172a", border: "1px solid " + item.color + "40",
              borderRadius: "8px", padding: "8px 14px", textAlign: "center", minWidth: "80px"
            }}>
              <div style={{ fontSize: "18px" }}>{item.icon}</div>
              <div style={{ color: item.color, fontSize: "10px", fontWeight: "700" }}>{item.name}</div>
              <div style={{ color: "#475569", fontSize: "9px" }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px", padding: "8px 12px", background: "#0f172a", borderRadius: "6px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <span style={{ color: "#475569", fontSize: "10px" }}>🔒 AUTORIZACIÓN HUMANA REQUERIDA:</span>
          <span style={{ color: "#f59e0b", fontSize: "10px" }}>Propuestas &gt;$150k MXN</span>
          <span style={{ color: "#f59e0b", fontSize: "10px" }}>Deal ganado</span>
          <span style={{ color: "#f59e0b", fontSize: "10px" }}>Meeting confirmado</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { id: "all", label: "Todos (" + agents.length + ")" },
          { id: "success", label: "✓ Saludables (" + agents.filter(a => a.lastStatus === "success").length + ")" },
          { id: "never", label: "⚡ Pendientes (" + agents.filter(a => a.lastStatus === "never").length + ")" },
          { id: "error", label: "✗ Errores (" + agents.filter(a => a.lastStatus === "error").length + ")" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            background: filter === f.id ? "#1e3a5f" : "transparent",
            border: "1px solid " + (filter === f.id ? "#3b82f6" : "#1e3a5f"),
            color: filter === f.id ? "#3b82f6" : "#475569",
            padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
            fontSize: "11px", letterSpacing: "0.5px",
          }}>{f.label}</button>
        ))}
        <div style={{ marginLeft: "auto", color: "#334155", fontSize: "10px", paddingTop: "8px" }}>
          {lastUpdate ? "Actualizado " + timeAgo(lastUpdate.toISOString()) : "Cargando..."}
          <button onClick={fetchStatus} style={{
            marginLeft: "8px", background: "transparent", border: "1px solid #1e3a5f",
            color: "#475569", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "10px"
          }}>↺ Refresh</button>
        </div>
      </div>

      {/* Workflow Cards by Layer */}
      {LAYERS.filter(layer => grouped[layer]?.length > 0).map(layer => (
        <div key={layer} style={{ marginBottom: "20px" }}>
          <div style={{
            fontSize: "10px", letterSpacing: "2px", color: LAYER_COLORS[layer] || "#475569",
            fontWeight: "700", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <span style={{ display: "inline-block", width: "30px", height: "1px", background: LAYER_COLORS[layer] }}></span>
            {layer}
            <span style={{ display: "inline-block", flex: 1, height: "1px", background: "#0f172a" }}></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {grouped[layer].map(wf => {
              const sColor = statusColor(wf.lastStatus);
              const isRunning = runningAgents.has(wf.id);
              return (
                <div key={wf.id} style={{
                  background: "#0f172a",
                  border: "1px solid " + sColor + "30",
                  borderLeft: "3px solid " + sColor,
                  borderRadius: "6px",
                  padding: "12px 14px",
                  position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px" }}>{wf.meta.icon}</span>
                        <span style={{
                          fontSize: "10px", fontWeight: "700",
                          color: wf.meta.color, letterSpacing: "0.5px"
                        }}>{wf.meta.agent}</span>
                        <span style={{
                          fontSize: "9px", background: sColor + "20", color: sColor,
                          border: "1px solid " + sColor + "60", borderRadius: "3px",
                          padding: "1px 5px", letterSpacing: "0.5px"
                        }}>{statusLabel(wf.lastStatus)}</span>
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {wf.name.replace("BotMate — ", "")}
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <span style={{ color: "#334155", fontSize: "10px" }}>
                          {wf.lastRun ? timeAgo(wf.lastRun) : "Nunca ejecutado"}
                        </span>
                        {wf.totalRuns > 0 && (
                          <span style={{ color: "#22c55e40", fontSize: "10px" }}>
                            {wf.successCount}✓ {wf.errorCount > 0 ? wf.errorCount + "✗" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    {isRunning ? (
                      <div style={{ color: "#f59e0b", fontSize: "11px", padding: "4px 8px" }}>⟳</div>
                    ) : (
                      <button
                        onClick={() => triggerAgent(wf.meta.agent, wf.id)}
                        title="Ejecutar ahora"
                        style={{
                          background: "transparent", border: "1px solid #1e3a5f",
                          color: "#475569", padding: "4px 8px", borderRadius: "4px",
                          cursor: "pointer", fontSize: "11px",
                          transition: "all 0.2s", flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = wf.meta.color; e.currentTarget.style.color = wf.meta.color; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a5f"; e.currentTarget.style.color = "#475569"; }}
                      >▶</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMMAND CENTER (CHAT) ───────────────────────────────────────────────────

const CHAT_AGENTS = [
  { id: "all",       name: "Todo el Equipo",  role: "Todos los agentes juntos",         color: "#6366f1", icon: "⚡" },
  { id: "APOLO",     name: "APOLO",           role: "Prospección y leads fríos",         color: "#f59e0b", icon: "🎯" },
  { id: "NEXUS",     name: "NEXUS",           role: "Calificación y CRM",               color: "#06b6d4", icon: "🔗" },
  { id: "HERMES",    name: "HERMES",          role: "Email y comunicación",             color: "#10b981", icon: "📧" },
  { id: "SIGMA",     name: "SIGMA",           role: "Contratos y cierres",              color: "#8b5cf6", icon: "📝" },
  { id: "MERCURY",   name: "MERCURY",         role: "WhatsApp y respuestas rápidas",    color: "#f97316", icon: "💬" },
  { id: "TRACKER",   name: "TRACKER",         role: "Seguimiento y follow-ups",         color: "#ef4444", icon: "📡" },
  { id: "ATLAS",     name: "ATLAS",           role: "Reportes y métricas",              color: "#3b82f6", icon: "📊" },
  { id: "ORACLE",    name: "ORACLE",          role: "Estrategia e insights",            color: "#a855f7", icon: "🔮" },
  { id: "ONYX",      name: "ONYX",            role: "Operaciones y sistemas",           color: "#64748b", icon: "⚙️" },
];

function CommandCenterTab() {
  const [selectedAgent, setSelectedAgent] = useState(CHAT_AGENTS[0]);
  const [messages, setMessages] = useState([
    {
      role: "agent",
      agent: CHAT_AGENTS[0],
      text: "Sistemas en línea. Soy el equipo completo de BotMate AI. Tengo acceso al pipeline, robots, métricas y toda la operación. ¿Qué necesitas saber?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { role: "user", text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    const history = updatedMessages
      .slice(-12)
      .map(m => m.role === "user" ? `Ivan: ${m.text}` : `${m.agent?.name || "Agente"}: ${m.text}`)
      .join("\n");

    try {
      const res = await fetch(WAR_ROOM_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          agent: selectedAgent.id === "all" ? "EQUIPO" : selectedAgent.id,
          history,
        }),
      });
      const data = await res.json();
      const responseText = data.response || "Sin respuesta del sistema.";
      const agentName = data.agent || selectedAgent.name;
      const agentInfo = CHAT_AGENTS.find(a => a.id === agentName) || selectedAgent;

      setMessages(prev => [...prev, {
        role: "agent",
        agent: agentInfo,
        text: responseText,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "agent",
        agent: selectedAgent,
        text: "Error de conexión con los sistemas. Verifica que n8n esté activo.",
        timestamp: new Date().toISOString(),
        error: true,
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchAgent = (agent) => {
    setSelectedAgent(agent);
    setMessages([{
      role: "agent",
      agent,
      text: agent.id === "all"
        ? "Equipo completo en línea. Tengo visibilidad de todo: pipeline, robots, emails, WhatsApp. ¿Qué resolvemos?"
        : `${agent.name} conectado. ${agent.role}. ¿En qué te ayudo?`,
      timestamp: new Date().toISOString(),
    }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 160px)", gap: "0", background: "#070d1a" }}>
      {/* LEFT PANEL — Agent List */}
      <div style={{
        width: "260px",
        borderRight: "1px solid #0f172a",
        display: "flex",
        flexDirection: "column",
        background: "#080f1e",
        flexShrink: 0,
      }}>
        <div style={{
          padding: "16px",
          borderBottom: "1px solid #0f172a",
          fontSize: "10px",
          color: "#334155",
          letterSpacing: "1px",
          fontWeight: "700",
        }}>
          EQUIPO DE AGENTES
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {CHAT_AGENTS.map(agent => {
            const isActive = selectedAgent.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => switchAgent(agent)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: isActive ? "#0f172a" : "transparent",
                  borderLeft: isActive ? `3px solid ${agent.color}` : "3px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `${agent.color}20`,
                  border: `1px solid ${agent.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                }}>
                  {agent.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: isActive ? agent.color : "#94a3b8",
                    letterSpacing: "0.5px",
                  }}>
                    {agent.name}
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#334155",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {agent.role}
                  </div>
                </div>
                {isActive && (
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: agent.color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${agent.color}`,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div style={{ padding: "12px", borderTop: "1px solid #0f172a" }}>
          <div style={{ fontSize: "10px", color: "#334155", marginBottom: "8px", letterSpacing: "0.5px" }}>
            PREGUNTAS RÁPIDAS
          </div>
          {[
            "¿Cuántos leads activos?",
            "Dame el reporte del día",
            "busca leads nuevos en restaurantes",
            "¿Pipeline esta semana?",
            "genera video script robots",
            "crea calendario editorial",
            "genera manual de ventas",
            "secuencia emails hoteles",
          ].map((q, i) => (
            <div
              key={i}
              onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
              style={{
                padding: "6px 8px",
                background: "#0f172a",
                border: "1px solid #1e3a5f",
                borderRadius: "6px",
                fontSize: "10px",
                color: "#64748b",
                cursor: "pointer",
                marginBottom: "4px",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
              onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
            >
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Chat Header */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #0f172a",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#080f1e",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: `${selectedAgent.color}20`,
            border: `1px solid ${selectedAgent.color}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}>
            {selectedAgent.icon}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: selectedAgent.color, letterSpacing: "1px" }}>
              {selectedAgent.name}
            </div>
            <div style={{ fontSize: "10px", color: "#334155", marginTop: "2px" }}>
              {selectedAgent.role} · En línea
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: "10px", color: "#22c55e" }}>ACTIVO</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: "10px",
            }}>
              {msg.role === "agent" && (
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: `${msg.agent?.color || "#6366f1"}20`,
                  border: `1px solid ${msg.agent?.color || "#6366f1"}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                }}>
                  {msg.agent?.icon || "⚡"}
                </div>
              )}
              <div style={{
                maxWidth: "70%",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {msg.role === "agent" && (
                  <span style={{ fontSize: "10px", color: msg.agent?.color || "#6366f1", letterSpacing: "0.5px", fontWeight: "700" }}>
                    {msg.agent?.name || "AGENTE"}
                  </span>
                )}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "#1e3a5f"
                    : msg.error ? "#1a0a0a" : "#0f172a",
                  border: msg.role === "user"
                    ? "1px solid #2563eb40"
                    : msg.error ? "1px solid #ef444440" : "1px solid #1e293b",
                  fontSize: "13px",
                  color: msg.error ? "#f87171" : "#cbd5e1",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: "10px", color: "#1e3a5f" }}>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `${selectedAgent.color}20`,
                border: `1px solid ${selectedAgent.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
              }}>
                {selectedAgent.icon}
              </div>
              <div style={{
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 4px",
                background: "#0f172a",
                border: "1px solid #1e293b",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}>
                {[0, 0.2, 0.4].map((delay, j) => (
                  <div key={j} style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: selectedAgent.color,
                    animation: "typing-dot 1.2s infinite",
                    animationDelay: `${delay}s`,
                    opacity: 0.5,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #0f172a",
          background: "#080f1e",
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Pregúntale a ${selectedAgent.name}...`}
            rows={1}
            style={{
              flex: 1,
              background: "#0f172a",
              border: "1px solid #1e3a5f",
              borderRadius: "12px",
              padding: "10px 14px",
              color: "#cbd5e1",
              fontSize: "13px",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              lineHeight: "1.4",
              maxHeight: "120px",
              overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: !input.trim() || isTyping ? "#0f172a" : selectedAgent.color,
              border: `1px solid ${!input.trim() || isTyping ? "#1e293b" : selectedAgent.color}`,
              color: !input.trim() || isTyping ? "#334155" : "#000",
              cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─── AIRTABLE HOOKS ──────────────────────────────────────────────────────────

function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const fields = ["Name","Empresa","Cargo","Sector","Email","Telefono","Score_IA","Clasificacion","Temperatura","Tipo_Negocio","Robot_Recomendado","Workflow_State","Cadencia_Estado","Cadencia_Dia","Fecha_Seguimiento","Ultimo_Contacto","Es_VIP","Agente_Actual","Ultimo_Evento","WhatsApp_Enviados","Emails_Enviados"];
      const qs = fields.map(f=>`fields[]=${encodeURIComponent(f)}`).join("&");
      const res = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/tblO571b5ojGbLHnX?maxRecords=200&${qs}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setLeads(data.records || []);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    const t = setInterval(fetchLeads, 30000);
    return () => clearInterval(t);
  }, [fetchLeads]);

  return { leads, loading, refresh: fetchLeads };
}

function useClientes() {
  const [clientes, setClientes] = useState([]);
  useEffect(() => {
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/tblPJgobJiZyY2zvh?maxRecords=50`,
      { headers: { Authorization: `Bearer ${AIRTABLE_KEY}` } })
      .then(r => r.json()).then(d => setClientes(d.records || [])).catch(() => {});
  }, []);
  return clientes;
}

// ─── PIPELINE TAB ────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { id: "new",            label: "Nuevos",         color: "#64748b", icon: "📥" },
  { id: "scoring",        label: "Calificando",     color: "#6366f1", icon: "🧠" },
  { id: "wa_queued",      label: "WA Programado",   color: "#f59e0b", icon: "📱" },
  { id: "email_queued",   label: "Email Programado",color: "#f59e0b", icon: "📧" },
  { id: "wa_sent",        label: "Contactado",      color: "#3b82f6", icon: "✉️" },
  { id: "email_sent",     label: "Email Enviado",   color: "#3b82f6", icon: "📨" },
  { id: "replied",        label: "Respondió",       color: "#10b981", icon: "💬" },
  { id: "wa_replied",     label: "Respondió WA",    color: "#10b981", icon: "💬" },
  { id: "email_opened",   label: "Abrió Email",     color: "#06b6d4", icon: "👁" },
  { id: "proposal_sent",  label: "Propuesta",       color: "#8b5cf6", icon: "📋" },
  { id: "meeting_scheduled","label":"Demo Agendada",color: "#a855f7", icon: "📅" },
  { id: "won",            label: "Ganados",         color: "#22c55e", icon: "🏆" },
  { id: "paused",         label: "En Pausa",        color: "#475569", icon: "⏸" },
  { id: "rescate",        label: "Rescate",         color: "#f97316", icon: "🚨" },
];

const TEMP_COLORS = { hot: "#ef4444", warm: "#f59e0b", cold: "#3b82f6", HOT: "#ef4444", WARM: "#f59e0b", COLD: "#3b82f6" };
const TEMP_LABELS = { hot: "🔴 HOT", warm: "🟡 WARM", cold: "🔵 COLD", HOT: "🔴 HOT", WARM: "🟡 WARM", COLD: "🔵 COLD" };

function LeadCard({ lead, onTrigger }) {
  const f = lead.fields || {};
  const temp = f.Clasificacion || f.Temperatura || "cold";
  const color = TEMP_COLORS[temp] || "#64748b";
  const robot = (f.Robot_Recomendado || "").replace("PuduBot 2 ", "PuduBot ").replace(" Limpieza","").replace(" Delivery","");
  const diasSinContacto = f.Ultimo_Contacto
    ? Math.floor((Date.now() - new Date(f.Ultimo_Contacto)) / 86400000) : null;
  const urgente = diasSinContacto > 7;

  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${urgente ? "#ef4444" : color + "40"}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "6px",
      padding: "10px",
      marginBottom: "8px",
      fontSize: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "700", color: "#e2e8f0", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {f.Empresa || f.Name || "—"}
            {f.Es_VIP && <span style={{ marginLeft: "4px", color: "#f59e0b", fontSize: "11px" }}>★VIP</span>}
          </div>
          <div style={{ color: "#64748b", fontSize: "11px" }}>
            {(f.Name||"").split(" ")[0]}{f.Cargo ? ` · ${f.Cargo.slice(0,20)}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px", marginLeft: "8px" }}>
          <span style={{ background: color+"20", color, border: `1px solid ${color}40`, borderRadius: "4px", padding: "1px 5px", fontSize: "10px", fontWeight: "700" }}>
            {f.Score_IA || "—"}
          </span>
          {urgente && <span style={{ color: "#ef4444", fontSize: "10px" }}>⚠ {diasSinContacto}d</span>}
        </div>
      </div>
      <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {robot && <span style={{ background: "#1e293b", color: "#94a3b8", borderRadius: "3px", padding: "1px 5px", fontSize: "10px" }}>{robot}</span>}
          {f.Tipo_Negocio && <span style={{ background: "#1e3a5f", color: "#60a5fa", borderRadius: "3px", padding: "1px 5px", fontSize: "10px" }}>{f.Tipo_Negocio.replace("A-","").replace("B-","")}</span>}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {f.Email && <button onClick={() => onTrigger("email", lead.id, f)} style={{ background: "#10b98120", border: "1px solid #10b98140", color: "#34d399", borderRadius: "3px", padding: "2px 6px", fontSize: "10px", cursor: "pointer" }}>📧</button>}
          {(f.Telefono || f["Teléfono"]) && <button onClick={() => onTrigger("wa", lead.id, f)} style={{ background: "#22c55e20", border: "1px solid #22c55e40", color: "#4ade80", borderRadius: "3px", padding: "2px 6px", fontSize: "10px", cursor: "pointer" }}>💬</button>}
        </div>
      </div>
      {f.Ultimo_Evento && (
        <div style={{ marginTop: "5px", color: "#475569", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.Ultimo_Evento.slice(0, 60)}
        </div>
      )}
    </div>
  );
}

function PipelineTab() {
  const { leads, loading, refresh } = useLeads();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [triggering, setTriggering] = useState(null);
  const [view, setView] = useState("kanban"); // kanban | table | funnel

  const filtered = leads.filter(l => {
    const f = l.fields || {};
    const temp = (f.Clasificacion || f.Temperatura || "").toLowerCase();
    if (filter === "hot" && temp !== "hot") return false;
    if (filter === "warm" && temp !== "warm") return false;
    if (filter === "cold" && temp !== "cold") return false;
    if (filter === "vip" && !f.Es_VIP) return false;
    if (search) {
      const s = search.toLowerCase();
      return (f.Empresa||"").toLowerCase().includes(s) || (f.Name||"").toLowerCase().includes(s);
    }
    return true;
  });

  const byStage = {};
  PIPELINE_STAGES.forEach(s => { byStage[s.id] = []; });
  filtered.forEach(l => {
    const state = l.fields?.Workflow_State || "new";
    if (!byStage[state]) byStage[state] = [];
    byStage[state].push(l);
  });

  const totalHot = leads.filter(l => (l.fields?.Clasificacion||l.fields?.Temperatura||"").toLowerCase() === "hot").length;
  const totalWarm = leads.filter(l => (l.fields?.Clasificacion||l.fields?.Temperatura||"").toLowerCase() === "warm").length;
  const totalWon = leads.filter(l => l.fields?.Workflow_State === "won").length;
  const today = new Date().toISOString().split("T")[0];
  const followupHoy = leads.filter(l => l.fields?.Fecha_Seguimiento === today).length;
  const atascados = leads.filter(l => {
    const lc = l.fields?.Ultimo_Contacto;
    if (!lc) return false;
    const d = (Date.now() - new Date(lc)) / 86400000;
    return d > 7 && !["won","lost","paused","rescate"].includes(l.fields?.Workflow_State || "");
  }).length;

  async function triggerAgent(type, leadId, fields) {
    setTriggering(leadId + type);
    try {
      const url = type === "wa" ? ZEUS_WEBHOOK : HERMES_WEBHOOK;
      await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, score: fields.Score_IA || 50, robot: fields.Robot_Recomendado || "" })
      });
      setTimeout(refresh, 3000);
    } catch (_) {}
    setTriggering(null);
  }

  const stagesWithLeads = PIPELINE_STAGES.filter(s => (byStage[s.id]||[]).length > 0 || ["new","wa_queued","replied","proposal_sent","won"].includes(s.id));

  return (
    <div style={{ padding: "20px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      {/* Top KPIs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { label: "TOTAL LEADS", value: leads.length, color: "#3b82f6" },
          { label: "🔴 HOT", value: totalHot, color: "#ef4444" },
          { label: "🟡 WARM", value: totalWarm, color: "#f59e0b" },
          { label: "🏆 GANADOS", value: totalWon, color: "#22c55e" },
          { label: "HOY", value: followupHoy, color: "#a855f7", sub: "seguimientos" },
          { label: "ATASCADOS", value: atascados, color: atascados > 0 ? "#ef4444" : "#22c55e", sub: ">7 días" },
        ].map(k => (
          <div key={k.label} style={{ background: "#0f172a", border: `1px solid ${k.color}30`, borderRadius: "8px", padding: "12px 18px", flex: "1", minWidth: "120px" }}>
            <div style={{ color: "#475569", fontSize: "10px", letterSpacing: "1px" }}>{k.label}</div>
            <div style={{ color: k.color, fontSize: "28px", fontWeight: "700", lineHeight: "1" }}>{k.value}</div>
            {k.sub && <div style={{ color: "#475569", fontSize: "10px" }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa o contacto..."
          style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#e2e8f0", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", flex: "1", minWidth: "200px" }}
        />
        {["all","hot","warm","cold","vip"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? "#3b82f6" : "#0f172a",
            border: "1px solid " + (filter === f ? "#3b82f6" : "#1e3a5f"),
            color: filter === f ? "#fff" : "#64748b",
            borderRadius: "6px", padding: "6px 12px", fontSize: "11px", cursor: "pointer",
          }}>{f === "all" ? "Todos" : f === "vip" ? "★ VIP" : f.toUpperCase()}</button>
        ))}
        {["kanban","table"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? "#1e293b" : "#0f172a",
            border: "1px solid #1e3a5f", color: view === v ? "#e2e8f0" : "#475569",
            borderRadius: "6px", padding: "6px 10px", fontSize: "11px", cursor: "pointer",
          }}>{v === "kanban" ? "🗂 Kanban" : "📋 Tabla"}</button>
        ))}
        <button onClick={refresh} style={{ background: "#0f172a", border: "1px solid #1e3a5f", color: "#3b82f6", borderRadius: "6px", padding: "6px 10px", fontSize: "11px", cursor: "pointer" }}>↺ Actualizar</button>
      </div>

      {loading ? (
        <div style={{ color: "#475569", textAlign: "center", padding: "40px" }}>Cargando pipeline desde Airtable...</div>
      ) : view === "kanban" ? (
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "20px", alignItems: "flex-start" }}>
          {stagesWithLeads.map(stage => {
            const stageLeads = byStage[stage.id] || [];
            return (
              <div key={stage.id} style={{ minWidth: "220px", maxWidth: "240px", flex: "0 0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: stage.color, fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px" }}>
                    {stage.icon} {stage.label.toUpperCase()}
                  </span>
                  <span style={{ background: stage.color+"20", color: stage.color, borderRadius: "10px", padding: "1px 7px", fontSize: "11px", fontWeight: "700" }}>
                    {stageLeads.length}
                  </span>
                </div>
                <div style={{ background: "#080d1a", borderRadius: "8px", padding: "8px", minHeight: "80px", border: `1px solid ${stage.color}15` }}>
                  {stageLeads.length === 0
                    ? <div style={{ color: "#1e293b", fontSize: "11px", textAlign: "center", padding: "20px 0" }}>—</div>
                    : stageLeads.sort((a,b) => (b.fields?.Score_IA||0) - (a.fields?.Score_IA||0)).map(lead => (
                        <LeadCard key={lead.id} lead={lead} onTrigger={triggerAgent} />
                      ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b", color: "#475569" }}>
                {["Empresa","Contacto","Sector","Robot","Score","Estado","Temperatura","Agente","Próx. Contacto","Evento"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: "10px", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a,b) => (b.fields?.Score_IA||0) - (a.fields?.Score_IA||0)).map(lead => {
                const f = lead.fields || {};
                const temp = f.Clasificacion || f.Temperatura || "cold";
                const tc = TEMP_COLORS[temp] || "#64748b";
                return (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "7px 10px", color: "#e2e8f0", fontWeight: "600" }}>{f.Empresa||"—"}{f.Es_VIP&&<span style={{color:"#f59e0b",marginLeft:"4px"}}>★</span>}</td>
                    <td style={{ padding: "7px 10px", color: "#94a3b8" }}>{(f.Name||"").split(" ")[0]||"—"}</td>
                    <td style={{ padding: "7px 10px", color: "#64748b" }}>{f.Sector||"—"}</td>
                    <td style={{ padding: "7px 10px", color: "#60a5fa", fontSize: "11px" }}>{(f.Robot_Recomendado||"—").replace(" Limpieza","").replace(" Delivery","")}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ color: tc, fontWeight: "700" }}>{f.Score_IA||"—"}</span></td>
                    <td style={{ padding: "7px 10px", color: "#94a3b8", fontSize: "11px" }}>{f.Workflow_State||"—"}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ color: tc, fontSize: "11px", fontWeight: "700" }}>{TEMP_LABELS[temp]||"—"}</span></td>
                    <td style={{ padding: "7px 10px", color: "#8b5cf6", fontSize: "11px" }}>{f.Agente_Actual||"—"}</td>
                    <td style={{ padding: "7px 10px", color: "#475569", fontSize: "11px" }}>{f.Fecha_Seguimiento||"—"}</td>
                    <td style={{ padding: "7px 10px", color: "#334155", fontSize: "10px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.Ultimo_Evento||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── AGENT TEAM MAP ──────────────────────────────────────────────────────────

function AgentTeamMapTab() {
  const { leads } = useLeads();
  const clientes = useClientes();
  const [selected, setSelected] = useState(null);

  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => (l.fields?.Clasificacion||l.fields?.Temperatura||"").toLowerCase()==="hot").length;
  const waSent = leads.filter(l => ["wa_sent","wa_replied"].includes(l.fields?.Workflow_State||"")).length;
  const emailSent = leads.filter(l => ["email_sent","email_opened","replied"].includes(l.fields?.Workflow_State||"")).length;
  const proposals = leads.filter(l => ["proposal_sent","meeting_scheduled"].includes(l.fields?.Workflow_State||"")).length;
  const won = leads.filter(l => l.fields?.Workflow_State==="won").length;

  const AGENTS = [
    {
      id: "APOLO", name: "APOLO", icon: "🎯", color: "#f59e0b",
      role: "Prospección Diaria", schedule: "6AM Lun-Vie",
      desc: "Busca 50-100 leads/día en Apollo.io. 5 verticales: restaurantes, hoteles, retail, hospitales, corporativos CDMX.",
      stats: [`${totalLeads} leads generados`, "5 verticales activas"],
      status: "ACTIVO",
      outputs: ["ZEUS"],
    },
    {
      id: "ZEUS", name: "ZEUS", icon: "🧠", color: "#6366f1",
      role: "Scoring + Clasificación", schedule: "Cada 15 min",
      desc: "Califica leads 0-100. Clasifica HOT/WARM/COLD. Detecta empresas VIP. Enruta a MERCURY (HOT) o HERMES (WARM).",
      stats: [`${hotLeads} HOT activos`, "VIP → alerta Iván"],
      status: "ACTIVO",
      inputs: ["APOLO"],
      outputs: ["MERCURY","HERMES","MORNING"],
    },
    {
      id: "MERCURY", name: "MERCURY", icon: "💬", color: "#22c55e",
      role: "WhatsApp + Cadencias", schedule: "Cada hora",
      desc: "Cadencia A (activaciones, 3 días) y B (corporativos, 90 días). Template primer contacto. Follow-ups personalizados con Claude.",
      stats: [`${waSent} WA enviados`, "Cadencia A: 3 días | B: 90 días"],
      status: "ACTIVO",
      inputs: ["ZEUS"],
      outputs: ["ATLAS","NEXUS"],
    },
    {
      id: "HERMES", name: "HERMES", icon: "📧", color: "#3b82f6",
      role: "Email Outreach", schedule: "Webhook (ZEUS)",
      desc: "Emails personalizados con Claude por industria. Calcula ROI específico. Casos de éxito por sector. Requiere DNS botmate.mx (lunes).",
      stats: [`${emailSent} emails enviados`, "ROI calc automático"],
      status: "ACTIVO",
      inputs: ["ZEUS"],
      outputs: ["ATLAS","NEXUS"],
    },
    {
      id: "ATLAS", name: "ATLAS", icon: "📋", color: "#a855f7",
      role: "Propuestas + Contratos", schedule: "Webhook",
      desc: "Genera propuestas PDF personalizadas. Calcula ROI con datos reales del cliente. Prepara contratos. Alertas de cotizaciones vencidas.",
      stats: [`${proposals} propuestas activas`, "PDF automático"],
      status: "ACTIVO",
      inputs: ["MERCURY","HERMES"],
      outputs: ["ARES"],
    },
    {
      id: "ARES", name: "ARES", icon: "🤝", color: "#f97316",
      role: "Post-Venta + Renovaciones", schedule: "9AM diario",
      desc: "Check-in día 2, 7, 14, 30 post-instalación. Alerta renovación 30 días antes. Programa referidos día 30.",
      stats: [`${clientes.length} clientes activos`, "Renovaciones monitoreadas"],
      status: "ACTIVO",
      inputs: ["ATLAS"],
      outputs: [],
    },
    {
      id: "MORNING", name: "ZEUS REPORT", icon: "☀️", color: "#06b6d4",
      role: "Reporte Matutino", schedule: "7AM Lun-Vie",
      desc: "Resumen diario a Telegram. Pipeline por etapa, HOT leads, seguimientos del día, deals atascados >7 días.",
      stats: ["Telegram 7AM L-V", "Pipeline en tiempo real"],
      status: "ACTIVO",
      inputs: ["ZEUS"],
      outputs: [],
    },
  ];

  const sel = selected ? AGENTS.find(a => a.id === selected) : null;

  return (
    <div style={{ padding: "20px", height: "calc(100vh - 120px)", overflowY: "auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ color: "#e2e8f0", fontSize: "16px", fontWeight: "700", letterSpacing: "1px" }}>EQUIPO DE AGENTES — FLUJO DE VENTAS</div>
        <div style={{ color: "#475569", fontSize: "12px", marginTop: "4px" }}>Click en un agente para ver detalles. Los agentes trabajan 24/7 en Railway.</div>
      </div>

      {/* Flow diagram */}
      <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "12px", padding: "24px", marginBottom: "20px", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0", minWidth: "800px" }}>
          {/* APOLO */}
          <div onClick={() => setSelected("APOLO")} style={{ cursor: "pointer", textAlign: "center", flex: "1" }}>
            <div style={{ background: "#f59e0b15", border: `2px solid ${selected==="APOLO"?"#f59e0b":"#f59e0b40"}`, borderRadius: "12px", padding: "16px 12px" }}>
              <div style={{ fontSize: "28px" }}>🎯</div>
              <div style={{ color: "#f59e0b", fontWeight: "700", fontSize: "13px", marginTop: "4px" }}>APOLO</div>
              <div style={{ color: "#64748b", fontSize: "10px" }}>Prospección</div>
              <div style={{ color: "#f59e0b", fontSize: "11px", marginTop: "4px" }}>{totalLeads} leads</div>
            </div>
          </div>
          {/* Arrow */}
          <div style={{ color: "#1e3a5f", fontSize: "20px", padding: "0 8px" }}>→</div>
          {/* ZEUS */}
          <div onClick={() => setSelected("ZEUS")} style={{ cursor: "pointer", textAlign: "center", flex: "1" }}>
            <div style={{ background: "#6366f115", border: `2px solid ${selected==="ZEUS"?"#6366f1":"#6366f140"}`, borderRadius: "12px", padding: "16px 12px" }}>
              <div style={{ fontSize: "28px" }}>🧠</div>
              <div style={{ color: "#6366f1", fontWeight: "700", fontSize: "13px", marginTop: "4px" }}>ZEUS</div>
              <div style={{ color: "#64748b", fontSize: "10px" }}>Scoring + Routing</div>
              <div style={{ color: "#6366f1", fontSize: "11px", marginTop: "4px" }}>{hotLeads} HOT</div>
            </div>
          </div>
          {/* Double arrow to MERCURY + HERMES */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px", gap: "8px" }}>
            <div style={{ color: "#22c55e", fontSize: "14px" }}>→ WA</div>
            <div style={{ color: "#3b82f6", fontSize: "14px" }}>→ Email</div>
          </div>
          {/* MERCURY + HERMES stacked */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div onClick={() => setSelected("MERCURY")} style={{ cursor: "pointer", background: "#22c55e15", border: `2px solid ${selected==="MERCURY"?"#22c55e":"#22c55e40"}`, borderRadius: "10px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>💬</span>
              <div>
                <div style={{ color: "#22c55e", fontWeight: "700", fontSize: "12px" }}>MERCURY</div>
                <div style={{ color: "#64748b", fontSize: "10px" }}>WhatsApp · {waSent} enviados</div>
              </div>
            </div>
            <div onClick={() => setSelected("HERMES")} style={{ cursor: "pointer", background: "#3b82f615", border: `2px solid ${selected==="HERMES"?"#3b82f6":"#3b82f640"}`, borderRadius: "10px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📧</span>
              <div>
                <div style={{ color: "#3b82f6", fontWeight: "700", fontSize: "12px" }}>HERMES</div>
                <div style={{ color: "#64748b", fontSize: "10px" }}>Email · {emailSent} enviados</div>
              </div>
            </div>
          </div>
          <div style={{ color: "#1e3a5f", fontSize: "20px", padding: "0 8px" }}>→</div>
          {/* ATLAS */}
          <div onClick={() => setSelected("ATLAS")} style={{ cursor: "pointer", textAlign: "center", flex: "1" }}>
            <div style={{ background: "#a855f715", border: `2px solid ${selected==="ATLAS"?"#a855f7":"#a855f740"}`, borderRadius: "12px", padding: "16px 12px" }}>
              <div style={{ fontSize: "28px" }}>📋</div>
              <div style={{ color: "#a855f7", fontWeight: "700", fontSize: "13px", marginTop: "4px" }}>ATLAS</div>
              <div style={{ color: "#64748b", fontSize: "10px" }}>Propuestas</div>
              <div style={{ color: "#a855f7", fontSize: "11px", marginTop: "4px" }}>{proposals} activas</div>
            </div>
          </div>
          <div style={{ color: "#1e3a5f", fontSize: "20px", padding: "0 8px" }}>→</div>
          {/* WIN + ARES */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ background: "#22c55e15", border: "2px solid #22c55e40", borderRadius: "10px", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "20px" }}>🏆</div>
              <div style={{ color: "#22c55e", fontWeight: "700", fontSize: "12px" }}>GANADOS</div>
              <div style={{ color: "#22c55e", fontSize: "20px", fontWeight: "700" }}>{won}</div>
            </div>
            <div onClick={() => setSelected("ARES")} style={{ cursor: "pointer", background: "#f9731615", border: `2px solid ${selected==="ARES"?"#f97316":"#f9731640"}`, borderRadius: "10px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🤝</span>
              <div>
                <div style={{ color: "#f97316", fontWeight: "700", fontSize: "12px" }}>ARES</div>
                <div style={{ color: "#64748b", fontSize: "10px" }}>Post-venta · {clientes.length} clientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent detail card */}
      {sel && (
        <div style={{ background: "#0f172a", border: `1px solid ${sel.color}40`, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "36px" }}>{sel.icon}</span>
              <div>
                <div style={{ color: sel.color, fontWeight: "700", fontSize: "18px" }}>{sel.name}</div>
                <div style={{ color: "#64748b", fontSize: "12px" }}>{sel.role} · {sel.schedule}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ background: "#22c55e20", color: "#22c55e", border: "1px solid #22c55e40", borderRadius: "6px", padding: "4px 10px", fontSize: "11px" }}>{sel.status}</span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>
          </div>
          <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: "1.6", marginBottom: "16px" }}>{sel.desc}</p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {sel.stats.map(s => (
              <div key={s} style={{ background: "#0a0f1e", border: `1px solid ${sel.color}20`, borderRadius: "6px", padding: "8px 14px" }}>
                <span style={{ color: sel.color, fontSize: "12px", fontWeight: "600" }}>{s}</span>
              </div>
            ))}
            {sel.inputs && sel.inputs.length > 0 && (
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px 14px" }}>
                <span style={{ color: "#475569", fontSize: "11px" }}>Recibe de: </span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{sel.inputs.join(", ")}</span>
              </div>
            )}
            {sel.outputs && sel.outputs.length > 0 && (
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px 14px" }}>
                <span style={{ color: "#475569", fontSize: "11px" }}>Envía a: </span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>{sel.outputs.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cadence reference */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "#0f172a", border: "1px solid #f59e0b30", borderRadius: "10px", padding: "16px" }}>
          <div style={{ color: "#f59e0b", fontWeight: "700", marginBottom: "12px", fontSize: "13px" }}>CADENCIA A — ACTIVACIONES</div>
          {[
            { d: "H0", t: "WA template intro", canal: "💬" },
            { d: "D1", t: "WA follow-up", canal: "💬" },
            { d: "D2", t: "WA urgencia + disponibilidad", canal: "💬" },
            { d: "D3", t: "⚡ IVÁN interviene directamente", canal: "👤" },
          ].map(s => (
            <div key={s.d} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ background: "#f59e0b20", color: "#f59e0b", borderRadius: "4px", padding: "1px 6px", fontSize: "10px", minWidth: "28px", textAlign: "center" }}>{s.d}</span>
              <span style={{ color: "#64748b" }}>{s.canal}</span>
              <span style={{ color: "#94a3b8" }}>{s.t}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#0f172a", border: "1px solid #3b82f630", borderRadius: "10px", padding: "16px" }}>
          <div style={{ color: "#3b82f6", fontWeight: "700", marginBottom: "12px", fontSize: "13px" }}>CADENCIA B — CORPORATIVO</div>
          {[
            { d: "D0", t: "WA template intro breve", canal: "💬" },
            { d: "D2", t: "Email propuesta formal + ROI", canal: "📧" },
            { d: "D2", t: "WA confirma email", canal: "💬" },
            { d: "D5", t: "WA caso de éxito sector", canal: "💬" },
            { d: "D9", t: "Email manejo de objeción", canal: "📧" },
            { d: "D14", t: "⚡ IVÁN contacto directo", canal: "👤" },
            { d: "D30", t: "WA reactivación", canal: "💬" },
            { d: "D90", t: "WA último intento → nurturing", canal: "💬" },
          ].map(s => (
            <div key={s.d+s.t} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ background: "#3b82f620", color: "#3b82f6", borderRadius: "4px", padding: "1px 6px", fontSize: "10px", minWidth: "28px", textAlign: "center" }}>{s.d}</span>
              <span style={{ color: "#64748b" }}>{s.canal}</span>
              <span style={{ color: "#94a3b8" }}>{s.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const TABS = [
  { id: "pipeline", label: "🔻 Pipeline" },
  { id: "team", label: "⚡ Agentes" },
  { id: "chat", label: "Command Center" },
  { id: "monitor", label: "🔴 Live Monitor" },
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Flujos n8n" },
  { id: "workflows", label: "Workflows" },
  { id: "roadmap", label: "Roadmap" },
  { id: "robots", label: "Robots" },
  { id: "sistemas", label: "Sistemas" },
];

export default function WarRoom() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const { leads } = useLeads();

  const hotCount = leads.filter(l => (l.fields?.Clasificacion||l.fields?.Temperatura||"").toLowerCase()==="hot").length;
  const today = new Date().toISOString().split("T")[0];
  const followupHoy = leads.filter(l => l.fields?.Fecha_Seguimiento === today).length;

  const renderTab = () => {
    switch (activeTab) {
      case "pipeline": return <PipelineTab />;
      case "team": return <AgentTeamMapTab />;
      case "chat": return <CommandCenterTab />;
      case "monitor": return <AgentMonitorTab />;
      case "overview": return <OverviewTab />;
      case "agents": return <AgentsTab />;
      case "workflows": return <WorkflowsTab />;
      case "roadmap": return <RoadmapTab />;
      case "robots": return <RobotsTab />;
      case "sistemas": return <SistemasTab />;
      default: return <PipelineTab />;
    }
  };

  return (
    <div style={STYLES.root}>
      <div style={STYLES.header}>
        <div>
          <div style={STYLES.logo}>BotMate ⚡ War Room</div>
          <div style={{ color: "#475569", fontSize: "11px", marginTop: "3px", letterSpacing: "0.5px" }}>
            APOLO · ZEUS · MERCURY · HERMES · ATLAS · ARES — {leads.length} leads activos
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {hotCount > 0 && (
            <span style={{ ...STYLES.badge, background: "#ef444420", border: "1px solid #ef4444", color: "#f87171" }}>
              🔴 {hotCount} HOT
            </span>
          )}
          {followupHoy > 0 && (
            <span style={{ ...STYLES.badge, background: "#f59e0b20", border: "1px solid #f59e0b", color: "#fbbf24" }}>
              ⚡ {followupHoy} HOY
            </span>
          )}
          <span style={STYLES.badge}>● AGENTES ACTIVOS</span>
        </div>
      </div>

      <div style={STYLES.tabBar}>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            style={STYLES.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "robots" && (
              <span style={{
                background: "#ef444430",
                color: "#f87171",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "10px",
                marginLeft: "6px",
                fontWeight: "700",
              }}>
                19
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={STYLES.content}>{renderTab()}</div>

      <div style={{
        borderTop: "1px solid #0f172a",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        color: "#1e3a5f",
        fontSize: "10px",
        letterSpacing: "0.5px",
      }}>
        <span>BOTMATE WAR ROOM v2.0 — Sistema IA de Ventas B2B</span>
        <span>APOLO · ZEUS · MERCURY · HERMES · ATLAS · ARES</span>
        <span>botmate.mx</span>
      </div>
    </div>
  );
}
