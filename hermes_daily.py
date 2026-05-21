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
import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
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
GMAIL_USER  = _e('GMAIL_USER', 'ventas@botmate.mx')
GMAIL_PASS  = _e('GMAIL_APP_PASSWORD', '')
CAL         = 'https://calendar.app.google/zq731y653cuoeu7m9'
UNSUB_URL   = 'https://primary-production-c732.up.railway.app/webhook/unsub'
LOGO        = 'https://botmate.mx/wp-content/uploads/2024/07/Botmate_color.svg'
ONEPAGE_IMG = 'https://botmate-war-room.vercel.app/assets/onepage-botmate.jpg'
ONEPAGE_PDF = 'https://botmate-war-room.vercel.app/assets/onepage-botmate.pdf'
FROM_EMAIL  = 'Ivan | BotMate <ventas@botmate.mx>'
BCC_EMAIL   = None  # Sin copia oculta
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
            'restaurante': '2 meseros cuestan $29,000 MXN/mes (IMSS + salario + prestaciones). El <strong>BellaBot</strong>: <strong>$17,500/mes fijos</strong> — y no falta los lunes ni pide aguinaldo.',
            'hotel':       '1 turno de limpieza de áreas comunes cuesta $19K–$22K MXN/mes. El <strong>CC1</strong>: <strong>$17,500/mes fijos</strong> — cubre los 3 turnos, 24/7, sin IMSS.',
            'hospital':    'Personal de higiene por turno nocturno: ~$22K MXN/mes + riesgo de rotación. El <strong>CC1</strong> cuesta <strong>$17,500/mes fijos</strong> — y genera reporte automático para auditorías.',
            'manufactura': '1 persona de limpieza nocturna: $18K–$20K MXN/mes + rotación alta. El <strong>CC1</strong>: <strong>$17,500/mes fijos</strong>, 3 turnos cubiertos, cero finiquitos.',
            'retail':      'Personal de limpieza en piso: $15K–$19K MXN/mes por persona. El <strong>CC1</strong>: <strong>$17,500/mes fijos</strong> — trabaja mientras tus clientes compran, sin interrupciones.',
            'corporativo': '1 persona de limpieza cuesta <strong>$19K+ MXN/mes</strong> (IMSS, aguinaldo, liquidaciones). Nuestro robot: <strong>$17,500/mes fijos</strong> — sin nada de eso, sin sorpresas.',
        },
        'subject_prefix': {
            'hook':    ['pregunta rápida, {nc}', 'el número de {empresa}', '¿cuánto gasta {empresa} en personal?'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'dato concreto para {empresa}'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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
            'hook':    ['una idea para {empresa}, {nc}', '¿esto aplica en {empresa}?', '{nc} — algo de su sector'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'dato que me quedé pensando'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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
            'hook':    ['un cliente muy parecido a {empresa}', 'resultado real — {nc}', '¿le cuento algo, {nc}?'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'el resultado que mencioné'],
            'breakup': ['última vez, {nc}', 'cerrando — {nc}'],
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
            'hook':    ['una pregunta, {nc}', 'algo sobre {empresa}', '¿cuántas bajas tuvo {empresa} este año?'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'solución concreta para {empresa}'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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
            'hook':    ['algo que vi sobre {empresa}', '{nc} — su competencia', 'pregunta directa, {nc}'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'lo que está pasando en su sector'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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
            'hook':    ['te muestro algo, {nc}', 'para {empresa}', '¿viste esto, {nc}?'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'el robot para {empresa}'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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
            'hook':    ['un favor, {nc}', 'pregunta diferente, {nc}', '¿conoce a alguien, {nc}?'],
            'prueba':  ['re: {empresa}', 'seguimiento, {nc}', 'favor rápido'],
            'breakup': ['última vez, {nc}', 'antes de cerrar — {nc}'],
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

def resolve_robot(sector):
    """Always derive robot from sector — never trust stored hint (gets polluted)"""
    return {
        'restaurante': 'BellaBot',
        'hotel':       'PuduBot 2',
        'hospital':    'CC1',
        'manufactura': 'CC1',
        'retail':      'CC1',
        'corporativo': 'CC1',
    }.get(sector, 'CC1')

FREE_DOMAINS = {'gmail','hotmail','yahoo','outlook','icloud','live','proton','me',
                'aol','msn','ymail','googlemail','zoho'}

def smart_empresa(empresa, email):
    """If empresa is generic, try to infer from email domain"""
    if empresa and empresa.strip().lower() not in ['su empresa', '', 'none', 'n/a']:
        return empresa.strip().title() if empresa.islower() else empresa.strip()
    domain = email.split('@')[-1].lower() if '@' in email else ''
    base   = domain.split('.')[0] if '.' in domain else ''
    # Skip free providers and single-word junk
    if not base or base in FREE_DOMAINS or len(base) < 4:
        return 'su empresa'
    # Clean up and title-case
    cleaned = base.replace('-', ' ').replace('_', ' ')
    return cleaned.title()

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
    'restaurante': {
        'pain':  'El 87% de meseros rota cada año. Cada baja cuesta $8K–$15K MXN entre finiquito, IMSS y capacitación.',
        'proof': 'Restaurante 120 cubiertos CDMX: bajó de 8 a 4 personas de servicio. Ahorro neto: <strong>$56K MXN/mes</strong>.',
        'cta_q': '¿Le funciona esta semana para 20 minutos de demo en vivo — sin costo?',
        'urgency':'Tenemos agenda disponible <strong>esta semana</strong>.',
    },
    'hotel': {
        'pain':  '62% del costo operativo hotelero es personal. Limpieza de áreas comunes falla primero con el ausentismo.',
        'proof': 'Cadena hotelera Cancún: −40% en costo de limpieza de áreas comunes. ROI en <strong>3 meses</strong>.',
        'cta_q': '¿Le quedan 20 minutos esta semana para ver el robot en operación?',
        'urgency':'Solo 3 demos disponibles esta semana en su zona.',
    },
    'hospital': {
        'pain':  'Los protocolos de higiene hospitalaria requieren frecuencias que el personal no puede sostener en todos los turnos.',
        'proof': 'CHRISTUS MUGUERZA: −31% en incidentes nosocomiales en zonas comunes. <strong>6 meses de operación.</strong>',
        'cta_q': '¿Tiene 20 minutos esta semana para una demo con datos de su institución?',
        'urgency':'Agenda disponible esta semana — sin costo.',
    },
    'manufactura': {
        'pain':  'Plantas de 3 turnos: la limpieza nocturna cubre solo el 60% del área. Riesgo ISO, riesgo de auditorías.',
        'proof': 'Piloto 4 semanas en planta Bayer México → compraron 3 unidades CC1. Ahorro: <strong>$94K MXN/mes</strong>.',
        'cta_q': '¿Le funciona esta semana para una demo de 20 minutos — con datos de su planta?',
        'urgency':'Podemos hacer el diagnóstico de cobertura sin costo esta semana.',
    },
    'retail': {
        'pain':  'Personal de limpieza visible en piso interrumpe la experiencia de compra. Piso sucio = accidentes y reclamaciones.',
        'proof': 'Tienda departamental CDMX: <strong>+$500K MXN en ventas</strong> en 2 semanas tras automatizar limpieza de piso.',
        'cta_q': '¿Le queda tiempo esta semana para ver el CC1 en operación — 20 minutos, sin compromiso?',
        'urgency':'Tenemos demo disponible esta semana en su zona.',
    },
    'corporativo': {
        'pain':  'Costo real de personal de limpieza: +$19K MXN/mes por persona (IMSS, aguinaldo, liquidaciones, reclutamiento).',
        'proof': '40+ empresas en México ya rentan robots BotMate. ROI promedio documentado: <strong>4–6 meses</strong>.',
        'cta_q': '¿Tiene 20 minutos esta semana para el diagnóstico de ahorro de {empresa}?',
        'urgency':'Demo gratuita disponible esta semana — agenda se llena rápido.',
    },
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

# ── SECTOR STATS (3 números para el stats bar) ────────────────────────────────
SECTOR_STATS = {
    'restaurante': [('87%', 'rotación anual de meseros'), ('$56K', 'ahorro/mes caso real'), ('$17,500', 'renta mensual fija')],
    'hotel':       [('40%', 'reducción en costo de limpieza'), ('3 meses', 'para recuperar inversión'), ('$17,500', 'renta mensual fija')],
    'hospital':    [('−31%', 'incidentes nosocomiales'), ('100%', 'cobertura en turnos'), ('$17,500', 'renta mensual fija')],
    'manufactura': [('$94K', 'ahorro mensual caso real'), ('3 turnos', 'cubiertos por 1 robot'), ('$17,500', 'renta mensual fija')],
    'retail':      [('+$500K', 'ventas caso real 2 semanas'), ('0', 'interrupciones al cliente'), ('$17,500', 'renta mensual fija')],
    'corporativo': [('$19K', 'costo real por persona/mes'), ('4–6 meses', 'ROI promedio'), ('$17,500', 'renta mensual fija')],
}

SECTOR_CLIENTS = {
    'restaurante': 'Alsea · Grupo Trimex · Pollo Pepe · Grupo WOW',
    'hotel':       'Hilton · Grupo Brisas · The Palace Company · Secrets Resorts',
    'hospital':    'Hospitales Puerta de Hierro · Hospitales MAC · CHRISTUS MUGUERZA',
    'manufactura': 'Bayer México · General Motors · Mubea · ABC Aluminum',
    'retail':      'HEB México · The Home Depot · Walmart · Shasa',
    'corporativo': 'Axtel · Dart Container · Teletón · voestalpine',
}

SECTOR_VIDEO = {
    'restaurante': 'https://botmate.mx/bellabot/',
    'hotel':       'https://botmate.mx/pudubot-2/',
    'hospital':    'https://botmate.mx/pudu-cc1/',
    'manufactura': 'https://botmate.mx/pudu-cc1/',
    'retail':      'https://botmate.mx/pudu-cc1/',
    'corporativo': 'https://botmate.mx/robots/',
}

BASE_STYLE = 'font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:0;line-height:1.6;background:#ffffff;'

def _header():
    return f'''<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px 8px 0 0;">
<tr><td style="padding:18px 28px;">
<img src="{LOGO}" alt="BotMate" height="32" style="display:block;">
</td></tr></table>'''

def _footer(lead_id):
    return f'''<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
<tr><td style="padding:20px 28px;">
<table cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:14px;vertical-align:middle;">
  <img src="{LOGO}" alt="BotMate" width="72" style="display:block;">
</td>
<td style="border-left:2px solid #e2e8f0;padding-left:14px;vertical-align:middle;">
  <strong style="color:#0f172a;font-size:14px;display:block;margin-bottom:2px;">Ivan Cadavieco</strong>
  <span style="color:#64748b;font-size:13px;">Fundador &amp; CEO · BotMate Mexico</span><br>
  <a href="mailto:ventas@botmate.mx" style="color:#2563eb;font-size:12px;text-decoration:none;">ventas@botmate.mx</a>
  &nbsp;·&nbsp;<a href="https://wa.me/5256466565658" style="color:#16a34a;font-size:12px;text-decoration:none;">WhatsApp</a>
  &nbsp;·&nbsp;<a href="https://botmate.mx" style="color:#2563eb;font-size:12px;text-decoration:none;">botmate.mx</a>
</td></tr></table>
<p style="font-size:11px;color:#94a3b8;margin:14px 0 0;text-align:center;">
BotMate Mexico · CDMX, México<br>
<a href="{UNSUB_URL}?id={lead_id}" style="color:#94a3b8;">Darme de baja de estos correos</a>
</p>
</td></tr></table>'''

def _stats_bar(sector):
    stats = SECTOR_STATS.get(sector, SECTOR_STATS['corporativo'])
    cells = ''
    for num, label in stats:
        cells += f'''<td style="width:33%;padding:14px 10px;text-align:center;border-right:1px solid #dbeafe;">
<strong style="font-size:22px;color:#2563eb;display:block;line-height:1.2;">{num}</strong>
<span style="font-size:11px;color:#64748b;">{label}</span>
</td>'''
    cells = cells.rstrip().removesuffix('border-right:1px solid #dbeafe;') # last no border - handled below
    # Simple approach: just use the 3 cells
    s = stats
    return f'''<table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin:20px 0;">
<tr>
<td style="width:33%;padding:14px 10px;text-align:center;border-right:1px solid #bfdbfe;">
  <strong style="font-size:20px;color:#2563eb;display:block;line-height:1.2;">{s[0][0]}</strong>
  <span style="font-size:11px;color:#475569;">{s[0][1]}</span>
</td>
<td style="width:33%;padding:14px 10px;text-align:center;border-right:1px solid #bfdbfe;">
  <strong style="font-size:20px;color:#2563eb;display:block;line-height:1.2;">{s[1][0]}</strong>
  <span style="font-size:11px;color:#475569;">{s[1][1]}</span>
</td>
<td style="width:33%;padding:14px 10px;text-align:center;">
  <strong style="font-size:20px;color:#2563eb;display:block;line-height:1.2;">{s[2][0]}</strong>
  <span style="font-size:11px;color:#475569;">{s[2][1]}</span>
</td>
</tr></table>'''

def _cta_button(text, url, color='#2563eb'):
    return f'''<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:{color};border-radius:8px;text-align:center;">
<a href="{url}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">{text}</a>
</td></tr></table>'''

def _robot_showcase(rname, rdata, sector):
    video_url = SECTOR_VIDEO.get(sector, rdata['url'])
    specs_list = rdata['specs'].split(' · ')
    specs_html = ''.join(f'<li style="margin:4px 0;font-size:13px;color:#475569;">{s}</li>' for s in specs_list)
    return f'''<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:20px 0;background:#f8fafc;">
<tr>
<td width="180" style="padding:20px;text-align:center;vertical-align:middle;background:#f1f5f9;border-right:1px solid #e2e8f0;">
  <a href="{rdata['url']}">
    <img src="{rdata['img']}" alt="{rname}" width="120" style="display:block;margin:0 auto 12px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15));">
  </a>
  <a href="{video_url}" style="display:inline-block;background:#2563eb;color:#fff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:6px;text-decoration:none;">▶ Ver en acción</a>
</td>
<td style="padding:20px;vertical-align:top;">
  <strong style="font-size:18px;color:#0f172a;display:block;margin-bottom:4px;">{rname}</strong>
  <span style="font-size:13px;color:#2563eb;font-weight:600;display:block;margin-bottom:12px;">{rdata['use']}</span>
  <ul style="margin:0;padding-left:18px;">
    {specs_html}
  </ul>
  <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e2e8f0;">
    <span style="font-size:12px;color:#64748b;">Renta mensual: <strong style="color:#0f172a;">$17,500/mes</strong> · instalación en 2 semanas · sin IMSS</span>
  </div>
</td>
</tr></table>'''

def build_hook(nc, empresa, sector, rname, rdata, intel, lead_id):
    """E1 — Email de apertura: personal, una imagen, stat bold, CTA directo."""
    hook_text = get_opening_hook(sector, empresa)
    cta_q     = intel['cta_q'].format(empresa=empresa)
    proof_clean = re.sub(r'<[^>]+>', '', intel['proof'])
    clients   = SECTOR_CLIENTS.get(sector, SECTOR_CLIENTS['corporativo'])
    stats     = SECTOR_STATS.get(sector, SECTOR_STATS['corporativo'])
    stat_num  = stats[0][0]
    stat_lbl  = stats[0][1]

    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>BotMate — {rname} para {empresa}</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="{BASE_STYLE}border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

{_header()}

<!-- BODY -->
<tr><td style="padding:32px 28px 0;">
<p style="margin:0 0 20px;font-size:16px;color:#1e293b;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">{hook_text}</p>

<!-- STAT HIGHLIGHT -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:8px;margin:20px 0;">
<tr><td style="padding:20px 24px;">
<table cellpadding="0" cellspacing="0" width="100%"><tr>
<td style="vertical-align:middle;">
  <strong style="font-size:36px;color:#3b82f6;display:block;line-height:1.1;">{stat_num}</strong>
  <span style="font-size:13px;color:#94a3b8;">{stat_lbl}</span>
</td>
<td style="vertical-align:middle;text-align:right;padding-left:20px;">
  <img src="{rdata['img']}" alt="{rname}" width="80" style="display:block;filter:drop-shadow(0 2px 8px rgba(59,130,246,0.4));">
</td>
</tr></table>
</td></tr></table>

<p style="margin:0 0 20px;font-size:15px;color:#334155;">{proof_clean}</p>
<p style="margin:0 0 20px;font-size:15px;color:#334155;font-weight:600;">{cta_q}</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 28px;">
{_cta_button(f'→ Reservar 20 min con Ivan — {rname}', CAL)}
</td></tr>

<!-- CLIENTS -->
<tr><td style="padding:0 28px 28px;">
<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
Ya confían en BotMate: <strong style="color:#64748b;">{clients}</strong>
</p>
</td></tr>

{_footer(lead_id)}
</table>
</td></tr></table>
</body></html>'''


def build_prueba(nc, empresa, sector, rname, rdata, intel, lead_id):
    """E2 — Showcase completo: robot, stats, caso, one-pager, CTA."""
    hook_text = get_opening_hook(sector, empresa)
    cta_q     = intel['cta_q'].format(empresa=empresa)
    clients   = SECTOR_CLIENTS.get(sector, SECTOR_CLIENTS['corporativo'])
    proof_html = intel['proof']

    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>BotMate — {rname} para {empresa}</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="{BASE_STYLE}border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

{_header()}

<!-- BODY -->
<tr><td style="padding:32px 28px 0;">
<p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 20px;font-size:15px;color:#475569;">Le escribí hace unos días sobre <strong>{empresa}</strong>. Antes de cerrar este caso, quiero mostrarle exactamente qué resolvemos.</p>

<!-- ROBOT SHOWCASE -->
{_robot_showcase(rname, rdata, sector)}

<!-- STATS BAR -->
{_stats_bar(sector)}

<!-- PROOF BLOCK -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin:0 0 20px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:1px;">📊 Resultado documentado</p>
<p style="margin:0 0 8px;font-size:14px;color:#0f172a;">{proof_html}</p>
<p style="margin:0;font-size:12px;color:#64748b;">Renta mensual fija · instalación en 2 semanas · sin IMSS · sin liquidaciones · sin rotación</p>
</td></tr></table>

<!-- HOOK -->
<p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">{hook_text}</p>
<p style="margin:0 0 8px;font-size:15px;color:#1e293b;font-weight:700;">{cta_q}</p>
<p style="margin:0 0 20px;font-size:13px;color:#64748b;">{intel['urgency']}</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 28px;">
{_cta_button(f'→ Agendar demo gratuita — {rname}', CAL)}
</td></tr>

<!-- ONE-PAGER -->
<tr><td style="padding:0 28px 20px;">
<p style="margin:0 0 10px;font-size:12px;color:#94a3b8;text-align:center;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Portafolio completo de robots BotMate</p>
<a href="{ONEPAGE_PDF}">
  <img src="{ONEPAGE_IMG}" alt="Robots BotMate" width="100%" style="display:block;border-radius:8px;border:1px solid #e2e8f0;max-width:544px;">
</a>
<p style="margin:10px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
  <a href="{ONEPAGE_PDF}" style="color:#2563eb;font-weight:600;">Descargar catálogo completo PDF →</a>
</p>
</td></tr>

<!-- CLIENTS -->
<tr><td style="padding:0 28px 28px;">
<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
Ya confían en BotMate: <strong style="color:#64748b;">{clients}</strong>
</p>
</td></tr>

{_footer(lead_id)}
</table>
</td></tr></table>
</body></html>'''


def build_breakup(nc, empresa, sector, rname, rdata, intel, lead_id):
    """E3 — Último intento: urgencia, oferta gratuita, P.S. con prueba social."""
    proof_clean = re.sub(r'<[^>]+>', '', intel['proof'])
    clients     = SECTOR_CLIENTS.get(sector, SECTOR_CLIENTS['corporativo'])
    stats       = SECTOR_STATS.get(sector, SECTOR_STATS['corporativo'])

    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>BotMate — Último mensaje para {empresa}</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="{BASE_STYLE}border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

{_header()}

<!-- BODY -->
<tr><td style="padding:32px 28px 0;">
<p style="margin:0 0 16px;font-size:16px;color:#1e293b;">Hola <strong>{nc}</strong>,</p>
<p style="margin:0 0 20px;font-size:15px;color:#334155;">Este es mi último mensaje — no quiero saturar su bandeja. Pero antes de cerrar el caso de <strong>{empresa}</strong>, quiero dejar esto sobre la mesa:</p>

<!-- PAIN BOX -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border:1px solid #fde047;border-radius:8px;margin:0 0 20px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#854d0e;text-transform:uppercase;letter-spacing:1px;">⚠️ El costo de no actuar</p>
<p style="margin:0;font-size:14px;color:#1e293b;line-height:1.7;">{intel['pain']}</p>
</td></tr></table>

<!-- OFERTA GRATUITA -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 20px;">
<tr><td style="padding:18px 20px;">
<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;">🎁 Oferta especial — sin costo</p>
<p style="margin:0 0 12px;font-size:15px;color:#0f172a;font-weight:600;">Diagnóstico gratuito de ahorro operativo para <strong>{empresa}</strong>:</p>
<ul style="margin:0;padding-left:20px;">
  <li style="margin:6px 0;font-size:14px;color:#1e293b;">Demo en vivo del <strong>{rname}</strong> adaptada a su operación</li>
  <li style="margin:6px 0;font-size:14px;color:#1e293b;">Estimado de ROI personalizado con datos de <strong>{empresa}</strong></li>
  <li style="margin:6px 0;font-size:14px;color:#1e293b;">Comparativa costo robot vs. costo actual de personal</li>
</ul>
<p style="margin:12px 0 0;font-size:13px;color:#64748b;">20 minutos · sin costo · sin compromiso · esta semana</p>
</td></tr></table>

<!-- STATS -->
{_stats_bar(sector)}

<p style="margin:0 0 8px;font-size:15px;color:#334155;">Si no es el momento, ¿hay alguien más en <strong>{empresa}</strong> que tome decisiones de operaciones? Me encantaría contactarle directamente.</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 28px;">
{_cta_button('→ Diagnóstico gratuito — Agendar ahora', CAL, '#16a34a')}
</td></tr>

<!-- PS -->
<tr><td style="padding:0 28px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px;">
<tr><td>
<p style="margin:0;font-size:13px;color:#64748b;font-style:italic;">
<strong>P.S.</strong> {proof_clean} Ya operamos en: <strong style="color:#475569;">{clients}</strong>. Si cambia de opinión en cualquier momento: <a href="{CAL}" style="color:#2563eb;">agenda aquí</a>.
</p>
</td></tr></table>
</td></tr>

{_footer(lead_id)}
</table>
</td></tr></table>
</body></html>'''

def build_plain_text(nc, empresa, sector, email_type, intel, rname):
    """Plain text version for anti-spam ratio"""
    cta_q = intel['cta_q'].format(empresa=empresa)
    # Strip HTML tags from proof
    proof_clean = re.sub(r'<[^>]+>', '', intel['proof'])
    if email_type == 'hook':
        return (f"Hola {nc},\n\n{intel['pain']}\n\n"
                f"Con el {rname}: {proof_clean}\n\n"
                f"{cta_q} {intel['urgency']}\n\n"
                f"→ Agendar demo: {CAL}\n\n"
                f"Ivan Cadavieco · Fundador & CEO · BotMate Mexico\n"
                f"ventas@botmate.mx | botmate.mx")
    elif email_type == 'prueba':
        return (f"Hola {nc},\n\nLe escribí hace unos días sobre automatización en {empresa}.\n\n"
                f"{proof_clean}\n\nRenta mensual fija. Instalación en 2 semanas. Sin IMSS.\n\n"
                f"{cta_q} {intel['urgency']}\n\n"
                f"→ Agendar: {CAL}\n\n"
                f"Ivan Cadavieco · Fundador & CEO · BotMate Mexico")
    else:
        return (f"Hola {nc},\n\nÚltimo mensaje — no quiero saturar su bandeja.\n\n"
                f"{intel['pain']}\n\n"
                f"Diagnóstico gratuito para {empresa}: demo del {rname} + estimado de ROI en 20 min.\n\n"
                f"→ Agendar: {CAL}\n\n"
                f"Ivan Cadavieco · Fundador & CEO · BotMate Mexico")

# ── EMAIL SEND ENGINE — Gmail SMTP primero, Resend como fallback ──────────────
def send_email(to_addr, subject, html_body, plain_body, lead_id):
    """
    Intenta Gmail SMTP primero (aparece en Enviados de Gmail).
    Si falla o no hay App Password → usa Resend como fallback.
    Retorna: (ok: bool, msg_id: str, method: str)
    """
    # ── Intento 1: Gmail SMTP ────────────────────────────────────────────────
    if GMAIL_PASS:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From']    = formataddr(('Ivan | BotMate', GMAIL_USER))
            msg['To']      = to_addr
            msg['Reply-To'] = GMAIL_USER
            msg['List-Unsubscribe'] = f'<{UNSUB_URL}?id={lead_id}>'
            msg.attach(MIMEText(plain_body, 'plain', 'utf-8'))
            msg.attach(MIMEText(html_body,  'html',  'utf-8'))
            ctx = ssl.create_default_context()
            with smtplib.SMTP('smtp.gmail.com', 587, timeout=30) as srv:
                srv.ehlo()
                srv.starttls(context=ctx)
                srv.login(GMAIL_USER, GMAIL_PASS)
                srv.sendmail(GMAIL_USER, [to_addr], msg.as_string())
            return True, f'gmail-{int(time.time())}', 'Gmail'
        except Exception as e:
            print(f'   ⚠️  Gmail SMTP falló ({e}) → usando Resend')

    # ── Fallback: Resend API ─────────────────────────────────────────────────
    payload = {
        'from':     FROM_EMAIL,
        'to':       [to_addr],
        'subject':  subject,
        'html':     html_body,
        'text':     plain_body,
        'reply_to': GMAIL_USER,
        'headers':  {
            'List-Unsubscribe': f'<{UNSUB_URL}?id={lead_id}>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        'tags': [
            {'name': 'lead_id', 'value': lead_id[:30]},
            {'name': 'concepto', 'value': CONCEPT['tag']},
        ]
    }
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); tmp = f.name
    r = subprocess.run(['curl', '-s', '--max-time', '60', '-X', 'POST',
                        'https://api.resend.com/emails',
                        '-H', f'Authorization: Bearer {RESEND_KEY}',
                        '-H', 'Content-Type: application/json',
                        '-d', f'@{tmp}'],
                       capture_output=True, text=True, timeout=70)
    os.unlink(tmp)
    try:
        d = json.loads(r.stdout)
        rid = d.get('id', '')
        if rid:
            return True, rid, 'Resend'
        return False, '', f'Resend-err:{d.get("message","?")[:60]}'
    except:
        return False, '', 'parse-error'

def curl_post(url, payload, headers={}):
    """Generic POST helper — used for Telegram only."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); tmp = f.name
    args = ['curl', '-s', '--max-time', '30', '-X', 'POST', url,
            '-H', 'Content-Type: application/json', '-d', f'@{tmp}']
    for k, v in headers.items(): args += ['-H', f'{k}: {v}']
    r = subprocess.run(args, capture_output=True, text=True, timeout=40)
    os.unlink(tmp)
    try: return json.loads(r.stdout)
    except: return {'error': r.stdout[:200]}

def curl_patch(url, payload, auth):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); tmp = f.name
    args = ['curl', '-s', '--max-time', '30', '-X', 'PATCH', url,
            '-H', 'Content-Type: application/json',
            '-H', f'Authorization: Bearer {auth}', '-d', f'@{tmp}']
    r = subprocess.run(args, capture_output=True, text=True, timeout=40)
    os.unlink(tmp)
    try:
        resp = json.loads(r.stdout)
        if 'error' in resp:
            print(f'   ⚠️  Airtable PATCH error: {resp["error"].get("message","?")}')
        return resp
    except:
        return {}

def curl_get_all_records():
    """Fetch all records with pagination"""
    records = []
    offset = None
    while True:
        url = f'https://api.airtable.com/v0/{BID}/{TBL}?pageSize=100'
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

    # Skip leads in terminal states (solo valores que existen en Airtable)
    state = f.get('Workflow_State', '')
    if state in ['wa_sent', 'replied']:
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
    empresa = smart_empresa(f.get('Empresa', ''), email)
    sector  = normalize_sector(f.get('Sector', ''))
    rname   = resolve_robot(sector)
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

    ok, resend_id, method = send_email(email, subject, html, plain_text, lid)
    if ok: sent_ok += 1
    else:  sent_fail += 1

    label = f'E{n_sent+1}({email_type})'
    icon  = '✅' if ok else '❌'
    print(f'{icon} [{i:02d}/{len(leads)}] {label} | {nombre} | {empresa} | {sector} | {rname} | via {method}')
    if not ok: print(f'   Error: {method}')

    if ok:
        followup_days = {'hook': 3, 'prueba': 5, 'breakup': 30}[email_type]
        next_date = (NOW + timedelta(days=followup_days)).strftime('%Y-%m-%d')
        new_state = 'email_sent'  # único valor válido en Airtable para emails
        curl_patch(
            f'https://api.airtable.com/v0/{BID}/{TBL}/{lid}',
            {'fields': {
                'Workflow_State':    new_state,
                'Emails_Enviados':   n_sent + 1,
                'Ultimo_Evento':     f'✉️ {label} [{CONCEPT["tag"]}] → "{subject[:50]}"',
                'Email_Asunto':      subject,
                'Resend_Email_ID':   resend_id,
                'Fecha_Seguimiento': next_date,
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
