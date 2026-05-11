#!/usr/bin/env python3
"""
HERMES v8 — BotMate Daily Email Outreach
─────────────────────────────────────────
• Concepto rotativo por día de la semana (7 ángulos distintos)
• Filtro por Fecha_Seguimiento <= hoy (drip timing correcto)
• Anti-spam: List-Unsubscribe, plain-text version, headers limpios
• Tracking: Resend_Email_ID + Concepto_Dia guardados en Airtable
• Telegram: reporte al final con concepto del día y stats

Cron (8AM L-V):  0 8 * * 1-5 python3 /Users/ivancadavieeco/BOTMATE/hermes_daily.py >> /Users/ivancadavieeco/BOTMATE/hermes.log 2>&1
"""

import subprocess, json, time, re, tempfile, os, random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── LOAD CREDENTIALS from .env (never hardcode secrets) ───────────────────────
def _load_env(path=None):
    """Load key=value from .env file next to this script"""
    if path is None:
        path = Path(__file__).parent / '.env'
    env = {}
    try:
        for line in Path(path).read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env

_env = _load_env()
def _e(key, default=''):
    return os.environ.get(key) or _env.get(key) or default

# ── CONSTANTS ─────────────────────────────────────────────────────────────────
AK          = _e('AIRTABLE_KEY')
BID         = _e('AIRTABLE_BASE_ID', 'appdBxw9JhiHU9FXI')
TBL         = _e('AIRTABLE_TABLE_ID', 'tblO571b5ojGbLHnX')
RESEND_KEY  = _e('RESEND_KEY')
TG_BOT      = _e('TG_BOT_TOKEN')
TG_CHAT     = _e('TG_CHAT_ID', '5922170884')
CAL         = 'https://calendar.app.google/zq731y653cuoeu7m9'
UNSUB_URL   = 'https://primary-production-c732.up.railway.app/webhook/unsub'
LOGO        = 'https://botmate.mx/wp-content/uploads/2024/07/Botmate_color.svg'
ONEPAGE_IMG = 'https://botmate-war-room.vercel.app/assets/onepage-botmate.jpg'
ONEPAGE_PDF = 'https://botmate-war-room.vercel.app/assets/onepage-botmate.pdf'
FROM_EMAIL  = 'BotMate <ventas@botmate.mx>'
BCC_EMAIL   = 'ivan.cadavieco@botmate.mx'
DELAY_SECS  = 4   # seconds between sends (anti-spam pacing)

NOW         = datetime.now(timezone.utc)
TODAY       = NOW.date()
DOW         = NOW.weekday()  # 0=Mon, 6=Sun

# ── CONCEPT OF THE DAY (7 ángulos, uno por día) ────────────────────────────────
# Cada concepto define: nombre, ángulo principal, frases de apertura, subjects
CONCEPTS = {
    0: {  # LUNES — ROI / Números
        'name':  'ROI Monday 💰',
        'angle': 'roi',
        'tag':   'ROI',
        'opening_hook': {
            'restaurante': 'Un mesero cuesta $14,500 MXN/mes (IMSS + salario + prestaciones). El <strong>PuduBot 2</strong> cuesta menos de la mitad — y no falta los lunes.',
            'hotel':       'El costo real de un recepcionista de turno nocturno supera $16K MXN/mes. El robot: fracción del costo, 24/7.',
            'hospital':    'Protocolo de higiene hospitalaria completo con personal: ~$22K MXN/mes por turno. Con CC1: $0 de IMSS, 0 rotación.',
            'manufactura': 'Turno nocturno de limpieza: $18K MXN/mes + rotación alta. CC1 cubre los 3 turnos por menos del costo de 1 persona.',
            'retail':      'Personal de limpieza visible en piso cuesta ~$15K MXN/mes. CC1 lo reemplaza — y trabaja mientras tus clientes compran.',
            'corporativo': 'El costo real de un trabajador de limpieza supera <strong>$19K MXN/mes</strong> (IMSS, aguinaldo, liquidaciones, reclutamiento). Nuestro robot: renta fija mensual, sin nada de eso.',
        },
        'subject_prefix': {
            'hook':    ['{nc}, ¿cuánto cuesta el ausentismo en {empresa}?', 'El ROI de automatizar en {empresa}'],
            'prueba':  ['Re: los números de {empresa} — un dato que me quedé pensando', 'Un cálculo rápido para {empresa}'],
            'breakup': ['Último mensaje — {nc}', 'Cerrando el caso de {empresa}'],
        }
    },
    1: {  # MARTES — Evento / Urgencia temporal
        'name':  'Evento Martes 📅',
        'angle': 'evento',
        'tag':   'EVENTO',
        'opening_hook': {
            'restaurante': 'El <strong>10 de mayo</strong> es el día de mayor venta del año — y también el de mayor ausentismo de meseros. ¿Cómo está cubierto el servicio en {empresa}?',
            'hotel':       'El puente del <strong>10 de mayo</strong> registra ocupaciones de 95%+. La pregunta no es si habrá demanda — es si la operación aguanta.',
            'hospital':    'Mayo arranca con festivos. Las <strong>auditorías de higiene</strong> no toman días de descanso — sus robots tampoco.',
            'manufactura': 'Verano = rotación al tope. <strong>2 meses críticos</strong> en manufactura donde el turno nocturno siempre sufre primero.',
            'retail':      'El <strong>10 de mayo</strong> mueve más tráfico que cualquier otro fin de semana del año. Piso sucio + tráfico alto = riesgo.',
            'corporativo': 'Presupuestos Q2 están aprobados. <strong>Mayo</strong> es la ventana ideal para arrancar un proyecto de automatización — antes de que el Q3 los absorba.',
        },
        'subject_prefix': {
            'hook':    ['{nc}, el 10 de mayo y la operación de {empresa}', '{empresa}: ¿lista para el puente de mayo?'],
            'prueba':  ['Re: {empresa} y la temporada de mayo', '{nc} — datos sobre el 10 de mayo'],
            'breakup': ['Último mensaje antes del 10 de mayo — {nc}', 'Cerrando el caso de {empresa}'],
        }
    },
    2: {  # MIÉRCOLES — Caso de éxito / Social proof
        'name':  'Prueba Social Miércoles 🏆',
        'angle': 'caso',
        'tag':   'CASO',
        'opening_hook': {
            'restaurante': '<strong>Resultado real:</strong> Restaurante de 120 cubiertos en CDMX pasó de 8 a 4 personas de servicio. Ahorro: $56K MXN/mes. Robot en operación desde enero 2025.',
            'hotel':       '<strong>Resultado real:</strong> Cadena hotelera en Cancún redujo 40% el costo de limpieza de áreas comunes. ROI en 3 meses. Sin cambiar al equipo de habitaciones.',
            'hospital':    '<strong>Resultado real:</strong> CHRISTUS MUGUERZA documentó -31% en incidentes nosocomiales en zonas comunes. 6 meses de operación del CC1.',
            'manufactura': '<strong>Resultado real:</strong> Piloto 4 semanas en planta Bayer México → adquirieron 3 unidades CC1. Ahorro documentado: $94K MXN/mes.',
            'retail':      '<strong>Resultado real:</strong> Tienda departamental CDMX reportó +$500K MXN en ventas en las primeras 2 semanas. La razón: experiencia de piso transformada.',
            'corporativo': '<strong>40+ empresas en México</strong> ya rentan robots BotMate. ROI promedio documentado: 4-6 meses. ¿Quiere ver el caso más parecido a {empresa}?',
        },
        'subject_prefix': {
            'hook':    ['El caso que más se parece a {empresa}', '{nc} — un resultado que creo aplica en {empresa}'],
            'prueba':  ['Re: {empresa} — el caso de éxito que le mencioné', '{nc}, el número que cambió todo'],
            'breakup': ['Último mensaje — {nc}', '{empresa}: cerrando el expediente'],
        }
    },
    3: {  # JUEVES — Dolor sectorial / Pain point
        'name':  'Pain Thursday 🔥',
        'angle': 'dolor',
        'tag':   'DOLOR',
        'opening_hook': {
            'restaurante': 'El <strong>87% de meseros rota cada año</strong> en México. Cada baja cuesta entre $8K y $15K MXN entre reclutamiento, capacitación y tiempo perdido. ¿Cuántas bajas tuvo {empresa} en los últimos 6 meses?',
            'hotel':       '<strong>62% del costo operativo hotelero</strong> es personal. Limpieza de áreas comunes falla primero con el ausentismo — y es lo que el huésped ve al entrar.',
            'hospital':    'Protocolos de higiene hospitalaria requieren frecuencias que el personal <strong>no puede sostener</strong> en todos los turnos. No es falla del equipo — es matemática.',
            'manufactura': 'Plantas 3 turnos: limpieza nocturna cubre solo el <strong>60% del área</strong> en promedio. Riesgo ISO, riesgo de seguridad, auditorías fallidas.',
            'retail':      'Piso sucio = accidentes, reclamaciones legales y pérdida de ventas. Personal visible en piso <strong>interrumpe la experiencia de compra</strong>.',
            'corporativo': 'El costo oculto de rotación de personal de limpieza: cada baja cuesta $9K-$14K MXN entre finiquito, IMSS, reclutamiento y capacitación. <strong>¿Cuántas tuvo {empresa} este año?</strong>',
        },
        'subject_prefix': {
            'hook':    ['{nc}, ¿cuánto cuesta la rotación en {empresa}?', '{empresa}: el costo oculto que nadie calcula'],
            'prueba':  ['Re: el dolor que mencioné — y la solución', '{nc} — un dato sobre {empresa} que no había visto'],
            'breakup': ['Último mensaje, {nc}', 'Cerrando el expediente de {empresa}'],
        }
    },
    4: {  # VIERNES — FOMO / Competencia
        'name':  'FOMO Friday 🚀',
        'angle': 'fomo',
        'tag':   'FOMO',
        'opening_hook': {
            'restaurante': 'Tres cadenas de restaurantes en CDMX ya instalaron robots de servicio este Q1. Sus reseñas en Google mencionan el robot como diferenciador. La pregunta es: ¿{empresa} va a ser de los primeros o de los que reaccionan después?',
            'hotel':       'Hoteles que ya automatizaron áreas comunes tienen un diferenciador claro en redes sociales. Los huéspedes publican el robot. ¿{empresa} quiere ser esa historia?',
            'hospital':    'En compliance hospitalario, quien automatiza primero establece el estándar. Institutos que ya usan CC1 lo mencionan en sus auditorías como "best practice".',
            'manufactura': 'Sus competidores están mirando la misma matemática: robot vs. turno nocturno. Los que instalan primero capturan el ahorro — y el argumento ante clientes de certificación.',
            'retail':      'Cadenas que ya tienen robots de limpieza en operación los usan como asset de marketing. Videos virales, notas en prensa, diferenciación inmediata.',
            'corporativo': '<strong>¿Qué pasaría si su competidor directo instalara un robot mañana?</strong> En 40+ empresas en México ya existe. La ventana de "early adopter" todavía está abierta — pero se cierra.',
        },
        'subject_prefix': {
            'hook':    ['{nc}: sus competidores ya están mirando esto', '{empresa} vs. la competencia — 2025 es el año'],
            'prueba':  ['Re: lo que está pasando en su sector', '{nc} — la ventana que se está cerrando'],
            'breakup': ['Último mensaje — {nc}', 'Antes de cerrar el expediente de {empresa}'],
        }
    },
    5: {  # SÁBADO — Educacional / Robot showcase
        'name':  'Sábado Showcase 🤖',
        'angle': 'showcase',
        'tag':   'SHOWCASE',
        'opening_hook': {
            'restaurante': '¿Cómo funciona exactamente un robot de servicio? El <strong>BellaBot</strong> navega en mapas predefinidos, detecta obstáculos en 3D, carga hasta 40kg distribuidos en 4 bandejas y puede hablar con los comensales.',
            'hotel':       'El <strong>CC1</strong> no solo barre — friega, mopea y aspira simultáneamente. Cubre 500mm de área de limpieza por pasada, carga inalámbrica automática, genera reportes de cobertura.',
            'hospital':    'El <strong>CC1</strong> ejecuta rutas con precisión ±2cm. Genera reportes automáticos de cobertura para auditorías. Compatible con productos de limpieza hospitalaria estándar.',
            'manufactura': 'El <strong>CC1 industrial</strong> opera en pisos rugosos, rampes y zonas de carga. Resistente a entornos de manufactura. Funciona 18h continuas antes de recarga.',
            'retail':      'El <strong>CC1</strong> opera mientras tus clientes compran — no interrumpe. Detecta peatones, esquiva carritos, funciona en pasillos de 80cm. Resultado: piso impecable sin cerrar áreas.',
            'corporativo': 'BotMate renta 5 robots distintos — cada uno diseñado para un problema específico. ¿Cuál aplica en {empresa}? Le envío el catálogo completo con specs y precios de renta.',
        },
        'subject_prefix': {
            'hook':    ['¿Cómo funciona el robot de {sector} en {empresa}?', '{nc} — fichas técnicas de robots para {empresa}'],
            'prueba':  ['Re: las specs del robot que te mencioné', '{nc} — el robot específico para {empresa}'],
            'breakup': ['Último mensaje — {nc}', '{empresa}: cerrando expediente'],
        }
    },
    6: {  # DOMINGO — Referral / Partner
        'name':  'Domingo Referral 🤝',
        'angle': 'referral',
        'tag':   'REFERRAL',
        'opening_hook': {
            'restaurante': '¿Conoce a otro gerente o dueño de restaurante que esté teniendo problemas con rotación de meseros? Le podemos ofrecer una demo conjunta — dos empresas, una sola presentación de 30 minutos.',
            'hotel':       '¿Conoce a otro director hotelero que esté evaluando automatización? Demo conjunta disponible — compartimos el tiempo y el conocimiento.',
            'hospital':    '¿Hay otras instituciones de salud en su red que también busquen mejorar sus protocolos de higiene? Podemos agendar una sesión grupal de 45 minutos.',
            'manufactura': '¿Su empresa tiene proveedores o clientes en manufactura que estén evaluando eficiencia operativa? Referidos bienvenidos — hay beneficio mutuo.',
            'retail':      '¿Conoce a otros gerentes de retail que estén evaluando tecnología para sus pisos? Demo grupal disponible.',
            'corporativo': '¿Conoce a alguien en {empresa} o en otra empresa que tome decisiones de operaciones o tecnología? Un referido suyo tiene prioridad en agenda y condiciones especiales.',
        },
        'subject_prefix': {
            'hook':    ['{nc}, ¿conoce a alguien más en su red?', 'Una pregunta diferente para {nc}'],
            'prueba':  ['Re: {empresa} — ¿hay alguien más que deba conocer esto?', '{nc} — propuesta de referido'],
            'breakup': ['Último mensaje — {nc}', '{empresa}: cerrando expediente'],
        }
    },
}

CONCEPT = CONCEPTS[DOW]

# ── ROBOT CATALOG ─────────────────────────────────────────────────────────────
ROBOTS = {
    'BellaBot':  {'img':'https://botmate.mx/wp-content/uploads/2025/05/BellaBot-207x300.png',  'url':'https://botmate.mx/bellabot/',    'use':'servicio a mesa y experiencia premium al comensal',    'specs':'Pantalla con expresiones · entrega elegante · interacción activa con comensales'},
    'PuduBot 2': {'img':'https://botmate.mx/wp-content/uploads/2025/05/PuduBot2-231x300.png',  'url':'https://botmate.mx/pudubot-2/',   'use':'entrega de platillos y bebidas mesa a mesa',           'specs':'3 bandejas de inducción · pantalla interactiva · sensores 3D'},
    'KettyBot':  {'img':'https://botmate.mx/wp-content/uploads/2025/05/KettyBot-117x300.png',  'url':'https://botmate.mx/kettybot/',    'use':'entrega y promoción de productos en sala',             'specs':'Ágil · compacto · pantalla interactiva · múltiples modos'},
    'SwiftBot':  {'img':'https://botmate.mx/wp-content/uploads/2025/05/PuduSwiftBot-129x300.png','url':'https://botmate.mx/pudu-swiftbot/','use':'reparto autónomo de productos, comida y artículos',  'specs':'Puerta eléctrica automática · detecta peatones · modo guía'},
    'CC1':       {'img':'https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png',   'url':'https://botmate.mx/pudu-cc1/',    'use':'limpieza autónoma de grado industrial',                'specs':'Barre · friega · mopea · aspira · 500mm de área · carga inalámbrica'},
}

def resolve_robot(hint, sector):
    h = (hint or '').lower().replace(' ', '')
    if 'bella'  in h: return 'BellaBot'
    if 'pudubot' in h or 'bot2' in h or 'delivery' in h: return 'PuduBot 2'
    if 'ketty'  in h: return 'KettyBot'
    if 'swift'  in h: return 'SwiftBot'
    if 'cc1'    in h or 'limpieza' in h: return 'CC1'
    defaults = {'restaurante':'BellaBot','hotel':'PuduBot 2','hospital':'CC1','manufactura':'CC1','retail':'CC1','corporativo':'CC1'}
    return defaults.get(sector, 'CC1')

def normalize_sector(raw):
    s = (raw or '').lower()
    for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u')]: s = s.replace(a,b)
    if re.search(r'restaur|cafeter|cantina|bar|cocina|food|gastro|taqueria', s): return 'restaurante'
    if re.search(r'hotel|hostal|resort|spa|hospedaje', s): return 'hotel'
    if re.search(r'hospital|clinica|salud|dental|laboratorio|medic', s): return 'hospital'
    if re.search(r'manufactur|fabrica|planta|industrial|logistica|almacen|bodega|maquila', s): return 'manufactura'
    if re.search(r'retail|tienda|supermercado|comercio|plaza|departamental|mall', s): return 'retail'
    return 'corporativo'

# ── SECTOR INTEL (pain + proof base) ──────────────────────────────────────────
INTEL = {
    'restaurante': {'pain':'El 87% de meseros rota cada año. Cada baja: $8K–$15K MXN en costo real.',
                    'proof':'120 cubiertos CDMX: de 8 a 4 personas de servicio. Ahorro: $56K MXN/mes.',
                    'cta_q':'¿Tiene 20 minutos para verlo en acción en {empresa}?'},
    'hotel':       {'pain':'62% del costo operativo hotelero es personal. Áreas comunes fallan primero.',
                    'proof':'Cadena Cancún: −40% en costo de limpieza de áreas comunes. ROI en 3 meses.',
                    'cta_q':'¿Tiene 20 minutos para verlo en operación en {empresa}?'},
    'hospital':    {'pain':'Protocolos de higiene requieren frecuencias que el personal no puede sostener en todos los turnos.',
                    'proof':'CHRISTUS MUGUERZA: −31% en incidentes nosocomiales. 6 meses de operación.',
                    'cta_q':'¿Tiene 20 minutos para una demo enfocada en {empresa}?'},
    'manufactura': {'pain':'Plantas 3 turnos: limpieza nocturna cubre solo 60% del área. Riesgo ISO y auditorías.',
                    'proof':'Bayer México: piloto 4 semanas → 3 unidades CC1. Ahorro: $94K MXN/mes.',
                    'cta_q':'¿Tiene 20 minutos para verlo en operación?'},
    'retail':      {'pain':'Piso sucio = accidentes + reclamaciones + pérdida de ventas.',
                    'proof':'Tienda CDMX: +$500K MXN en ventas en 2 semanas por mejora en experiencia de piso.',
                    'cta_q':'¿Tiene 20 minutos para verlo en su tienda?'},
    'corporativo': {'pain':'Costo real de personal de limpieza: +$19K MXN/mes (IMSS + aguinaldo + liquidaciones).',
                    'proof':'40+ empresas en México. ROI promedio: 4–6 meses.',
                    'cta_q':'¿Tiene 20 minutos para una demo en {empresa}?'},
}

def get_opening_hook(sector, empresa):
    """Get today's concept opening, filled with empresa"""
    template = CONCEPT['opening_hook'].get(sector, CONCEPT['opening_hook']['corporativo'])
    return template.replace('{empresa}', empresa).replace('{sector}', sector)

def get_subject(email_type, sector, nc, empresa):
    emp = empresa or 'su empresa'
    subjects = CONCEPT['subject_prefix'].get(email_type, CONCEPT['subject_prefix']['breakup'])
    tmpl = random.choice(subjects)
    return tmpl.format(nc=nc, empresa=emp, sector=sector)

# ── HTML BUILDERS ─────────────────────────────────────────────────────────────
def robot_card(rname, rdata):
    return f'''<table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
<tr>
<td width="76" style="padding:12px 0 12px 14px;vertical-align:middle;">
  <a href="{rdata['url']}"><img src="{rdata['img']}" alt="{rname}" width="60" style="display:block;border-radius:6px;"></a>
</td>
<td style="padding:12px;vertical-align:middle;">
  <strong style="font-size:15px;color:#0f172a;display:block;margin-bottom:3px;">{rname}</strong>
  <span style="font-size:13px;color:#475569;display:block;margin-bottom:4px;">{rdata['use']}</span>
  <span style="font-size:12px;color:#64748b;">{rdata['specs']}</span>
</td>
<td width="80" style="padding:12px;vertical-align:middle;text-align:right;">
  <a href="{rdata['url']}" style="font-size:12px;color:#2563eb;text-decoration:none;font-weight:600;white-space:nowrap;">Ver ficha →</a>
</td>
</tr></table>'''

def signature():
    return f'''<hr style="border:none;border-top:1px solid #e2e8f0;margin:22px 0 16px;">
<table cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;vertical-align:middle;"><img src="{LOGO}" alt="BotMate" width="80" style="display:block;"></td>
<td style="border-left:2px solid #e2e8f0;padding-left:12px;vertical-align:middle;">
<strong style="color:#0f172a;font-size:14px;display:block;">Ivan Cadavieco</strong>
<span style="color:#64748b;font-size:13px;">Fundador &amp; CEO · BotMate Mexico</span><br>
<a href="mailto:ventas@botmate.mx" style="color:#2563eb;font-size:13px;text-decoration:none;">ventas@botmate.mx</a>
&nbsp;·&nbsp;<a href="https://botmate.mx" style="color:#2563eb;font-size:13px;text-decoration:none;">botmate.mx</a>
</td></tr></table>'''

def unsub_footer(lead_id):
    return f'''<p style="font-size:11px;color:#94a3b8;margin:16px 0 0;text-align:center;">
Si no deseas recibir más correos de BotMate, <a href="{UNSUB_URL}?id={lead_id}" style="color:#94a3b8;">haz clic aquí para darte de baja</a>.
</p>'''

def onepager_block():
    return f'''<div style="margin:24px 0 0;">
<p style="font-size:11px;color:#94a3b8;text-align:center;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Portafolio de robots BotMate</p>
<a href="{ONEPAGE_PDF}"><img src="{ONEPAGE_IMG}" alt="Robots BotMate" width="100%" style="display:block;border-radius:8px;border:1px solid #e2e8f0;max-width:496px;"></a>
</div>'''

BASE_STYLE = 'font-family:system-ui,-apple-system,Arial,sans-serif;color:#1e293b;max-width:580px;margin:0 auto;padding:24px 20px;line-height:1.75;'

def build_hook(nc, empresa, sector, rname, rdata, intel, lead_id):
    hook_text  = get_opening_hook(sector, empresa)
    cta_q      = intel['cta_q'].format(empresa=empresa)
    return f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{BASE_STYLE}">
<p style="margin:0 0 16px;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 16px;">{hook_text}</p>
{robot_card(rname, rdata)}
<p style="margin:0 0 18px;">{cta_q}</p>
<p style="margin:0 0 26px;"><a href="{CAL}" style="background:#2563eb;color:#fff;padding:13px 26px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">→ Agendar demo gratuita (20 min)</a></p>
<p style="font-size:13px;color:#64748b;margin:0 0 0;font-style:italic;">P.S. {intel['proof']}</p>
{signature()}
{unsub_footer(lead_id)}
</body></html>'''

def build_prueba(nc, empresa, sector, rname, rdata, intel, lead_id):
    hook_text = get_opening_hook(sector, empresa)
    return f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{BASE_STYLE}">
<p style="margin:0 0 16px;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 16px;">Le escribí hace unos días — le comparto este dato concreto antes de cerrar su caso.</p>
{robot_card(rname, rdata)}
<p style="margin:0 0 16px;">{hook_text}</p>
<p style="margin:0 0 18px;"><strong>{intel['proof']}</strong><br>Implementación: 2 semanas. Renta mensual fija. Sin IMSS, sin rotación.</p>
<p style="margin:0 0 26px;">¿15 minutos esta semana para ver si aplica en <strong>{empresa}</strong>?</p>
<p style="margin:0 0 18px;"><a href="{CAL}" style="background:#2563eb;color:#fff;padding:13px 26px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">→ Agendar 15 min (sin compromiso)</a></p>
{onepager_block()}
{signature()}
{unsub_footer(lead_id)}
</body></html>'''

def build_breakup(nc, empresa, sector, rname, rdata, intel, lead_id):
    return f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{BASE_STYLE}">
<p style="margin:0 0 16px;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 16px;">Este es mi último mensaje — no quiero saturar su bandeja.</p>
<p style="margin:0 0 18px;">{intel['pain']} Tenemos un diagnóstico gratuito de ahorro operativo para <strong>{empresa}</strong>: demo del <strong>{rname}</strong> + estimado de ROI en 20 minutos.</p>
<p style="margin:0 0 18px;">Si no es el momento, ¿podría indicarme quién en {empresa} toma decisiones de operaciones o tecnología?</p>
<p style="margin:0 0 26px;"><a href="{CAL}" style="background:#2563eb;color:#fff;padding:13px 26px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">→ Diagnóstico gratuito</a></p>
<p style="font-size:13px;color:#64748b;margin:0 0 0;font-style:italic;">P.S. BotMate trabaja con 40+ empresas en México. Si cambia de opinión: <a href="{CAL}" style="color:#2563eb;">agenda aquí</a>.</p>
{signature()}
{unsub_footer(lead_id)}
</body></html>'''

def build_plain_text(nc, empresa, sector, email_type, intel, rname):
    """Plain text version for anti-spam ratio"""
    cta_q = intel['cta_q'].format(empresa=empresa)
    if email_type == 'hook':
        return f"Hola {nc},\n\n{intel['pain']}\n\nCon el {rname}: {intel['proof']}\n\n{cta_q}\n\n→ Agendar demo: {CAL}\n\nIvan Cadavieco\nFundador & CEO · BotMate Mexico\nventas@botmate.mx | botmate.mx"
    elif email_type == 'prueba':
        return f"Hola {nc},\n\nLe escribí hace unos días. {intel['proof']}\n\nImplementación: 2 semanas. Renta mensual fija. Sin IMSS.\n\n¿15 minutos para ver si aplica en {empresa}?\n\n→ Agendar: {CAL}\n\nIvan Cadavieco\nFundador & CEO · BotMate Mexico"
    else:
        return f"Hola {nc},\n\nEste es mi último mensaje. {intel['pain']}\n\nDiagnóstico gratuito para {empresa}: demo del {rname} + estimado de ROI en 20 min.\n\n→ Agendar: {CAL}\n\nIvan Cadavieco\nFundador & CEO · BotMate Mexico"

# ── CURL HELPERS ──────────────────────────────────────────────────────────────
def curl_post(url, payload, headers={}):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); tmp = f.name
    args = ['curl', '-s', '--max-time', '60', '-X', 'POST', url,
            '-H', 'Content-Type: application/json', '-d', f'@{tmp}']
    for k, v in headers.items(): args += ['-H', f'{k}: {v}']
    r = subprocess.run(args, capture_output=True, text=True, timeout=70)
    os.unlink(tmp)
    try: return json.loads(r.stdout)
    except: return {'error': r.stdout[:200]}

def curl_patch(url, payload, auth):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); tmp = f.name
    args = ['curl', '-s', '--max-time', '30', '-X', 'PATCH', url,
            '-H', 'Content-Type: application/json',
            '-H', f'Authorization: Bearer {auth}', '-d', f'@{tmp}']
    subprocess.run(args, capture_output=True, text=True, timeout=40)
    os.unlink(tmp)

def curl_get_all_records():
    """Fetch all records with pagination"""
    records = []
    offset = None
    while True:
        url = f'https://api.airtable.com/v0/{BID}/{TBL}?maxRecords=100&pageSize=100'
        if offset: url += f'&offset={offset}'
        r = subprocess.run(['curl', '-s', '--max-time', '30', url,
                           '-H', f'Authorization: Bearer {AK}'],
                          capture_output=True, text=True, timeout=40)
        data = json.loads(r.stdout)
        records.extend(data.get('records', []))
        offset = data.get('offset')
        if not offset: break
        time.sleep(0.5)
    return records

def send_telegram(msg):
    curl_post(f'https://api.telegram.org/bot{TG_BOT}/sendMessage',
              {'chat_id': TG_CHAT, 'text': msg, 'parse_mode': 'Markdown'})

# ── MAIN ──────────────────────────────────────────────────────────────────────
day_names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
print(f"{'='*60}")
print(f"  HERMES v8 — {day_names[DOW]} {TODAY}")
print(f"  Concepto del día: {CONCEPT['name']}")
print(f"{'='*60}")
print(f"📡 Fetching leads... (today = {TODAY})")

all_records = curl_get_all_records()

leads = []
skipped_date = 0
skipped_state = 0
skipped_no_email = 0

for rec in all_records:
    f = rec['fields']
    email = f.get('Email', '').strip()
    if not email:
        skipped_no_email += 1
        continue

    # Only WARM leads
    if f.get('Clasificacion') != 'WARM':
        continue

    # Max 3 emails per lead
    emails_sent = int(f.get('Emails_Enviados') or 0)
    if emails_sent >= 3:
        continue

    # Skip leads in terminal states
    state = f.get('Workflow_State', '')
    if state in ['email_breakup_sent', 'whatsapp_sent', 'converted', 'unsubscribed']:
        skipped_state += 1
        continue

    # Date filter: only send if Fecha_Seguimiento <= today (or not set = first email)
    fecha_str = f.get('Fecha_Seguimiento', '')
    if fecha_str:
        try:
            fecha = datetime.strptime(fecha_str[:10], '%Y-%m-%d').date()
            if fecha > TODAY:
                skipped_date += 1
                continue
        except:
            pass  # Bad format → include anyway

    leads.append({'id': rec['id'], 'fields': f, 'emails_sent': emails_sent})

print(f"✅ {len(leads)} leads pendientes")
print(f"   Skipped: {skipped_date} (fecha futura) | {skipped_state} (estado terminal) | {skipped_no_email} (sin email)\n")

# ── SEND LOOP ─────────────────────────────────────────────────────────────────
sent_ok = 0; sent_fail = 0; results = []

for i, lead in enumerate(leads, 1):
    f       = lead['fields']
    lid     = lead['id']
    n_sent  = lead['emails_sent']
    email   = f.get('Email', '').strip()
    nombre  = f.get('Name', '')
    nc      = nombre.split()[0] if nombre else 'Estimado'
    empresa = f.get('Empresa') or 'su empresa'
    sector  = normalize_sector(f.get('Sector', ''))
    rname   = resolve_robot(f.get('Robot_Recomendado', ''), sector)
    rdata   = ROBOTS.get(rname, ROBOTS['CC1'])
    intel   = INTEL.get(sector, INTEL['corporativo'])

    email_type = ['hook', 'prueba', 'breakup'][min(n_sent, 2)]
    subject    = get_subject(email_type, sector, nc, empresa)
    plain_text = build_plain_text(nc, empresa, sector, email_type, intel, rname)

    if email_type == 'hook':
        html = build_hook(nc, empresa, sector, rname, rdata, intel, lid)
    elif email_type == 'prueba':
        html = build_prueba(nc, empresa, sector, rname, rdata, intel, lid)
    else:
        html = build_breakup(nc, empresa, sector, rname, rdata, intel, lid)

    # Build Resend payload with anti-spam headers
    resend_payload = {
        'from':     FROM_EMAIL,
        'to':       [email],
        'bcc':      [BCC_EMAIL],
        'subject':  subject,
        'html':     html,
        'text':     plain_text,
        'reply_to': 'ventas@botmate.mx',
        'headers':  {
            'List-Unsubscribe': f'<{UNSUB_URL}?id={lid}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Concepto': CONCEPT['tag'],
            'X-Mailer': 'BotMate-HERMES-v8',
        },
        'tags': [
            {'name': 'email_type', 'value': email_type},
            {'name': 'sector',     'value': sector},
            {'name': 'concepto',   'value': CONCEPT['tag']},
            {'name': 'lead_id',    'value': lid[:30]},
        ]
    }

    send_result = curl_post('https://api.resend.com/emails', resend_payload,
                            headers={'Authorization': f'Bearer {RESEND_KEY}'})

    resend_id = send_result.get('id', '')
    ok = bool(resend_id)
    if ok: sent_ok += 1
    else:  sent_fail += 1

    label = f'E{n_sent+1}({email_type})'
    icon  = '✅' if ok else '❌'
    print(f'{icon} [{i:02d}/{len(leads)}] {label} | {nombre} | {empresa} | {sector} | {rname}')
    if not ok: print(f'   Error: {send_result}')

    if ok:
        followup_days = {'hook': 3, 'prueba': 5, 'breakup': 30}[email_type]
        next_date = (NOW + timedelta(days=followup_days)).strftime('%Y-%m-%d')
        new_state = 'email_breakup_sent' if email_type == 'breakup' else 'email_sent'
        curl_patch(
            f'https://api.airtable.com/v0/{BID}/{TBL}/{lid}',
            {'fields': {
                'Workflow_State':    new_state,
                'Emails_Enviados':   n_sent + 1,
                'Ultimo_Evento':     f'✉️ {label} [{CONCEPT["tag"]}] → "{subject[:50]}"',
                'Email_Asunto':      subject,
                'Resend_Email_ID':   resend_id,
                'Fecha_Seguimiento': next_date,
                'Robot_Recomendado': rname,
            }}, auth=AK)

    results.append({'name': nombre, 'email': email, 'subject': subject, 'ok': ok,
                    'type': email_type, 'sector': sector})

    if i < len(leads):
        time.sleep(DELAY_SECS)

# ── SUMMARY ───────────────────────────────────────────────────────────────────
print(f'\n{"="*60}')
print(f'  BATCH COMPLETADO: ✅ {sent_ok} enviados | ❌ {sent_fail} fallidos')
print(f'  Concepto: {CONCEPT["name"]}')
print(f'  Hook: {sum(1 for r in results if r["ok"] and r["type"]=="hook")} | '
      f'Prueba: {sum(1 for r in results if r["ok"] and r["type"]=="prueba")} | '
      f'Breakup: {sum(1 for r in results if r["ok"] and r["type"]=="breakup")}')
print(f'{"="*60}')

# Sector breakdown
sectors_sent = {}
for r in results:
    if r['ok']:
        sectors_sent[r['sector']] = sectors_sent.get(r['sector'], 0) + 1
if sectors_sent:
    print(f'  Sectores: {" | ".join(f"{k}: {v}" for k,v in sorted(sectors_sent.items()))}')

tg_lines = [
    f'*🚀 HERMES v8 — {day_names[DOW]} {TODAY}*',
    f'Concepto: _{CONCEPT["name"]}_',
    f'',
    f'✅ *{sent_ok} enviados* | ❌ {sent_fail} fallidos',
    f'Hook: {sum(1 for r in results if r["ok"] and r["type"]=="hook")} · '
    f'Prueba: {sum(1 for r in results if r["ok"] and r["type"]=="prueba")} · '
    f'Breakup: {sum(1 for r in results if r["ok"] and r["type"]=="breakup")}',
]
if sectors_sent:
    tg_lines.append('Sectores: ' + ' · '.join(f'{k}({v})' for k,v in sorted(sectors_sent.items())))
if sent_fail > 0:
    tg_lines.append(f'⚠️ {sent_fail} fallidos — revisar límite Resend o errores')
send_telegram('\n'.join(tg_lines))
print('📱 Telegram notificado')
