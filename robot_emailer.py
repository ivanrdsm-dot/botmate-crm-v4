#!/usr/bin/env python3
"""
BotMate Robot Catalog Emailer
─────────────────────────────
Flask HTTP service que n8n llama cuando un cliente pide información de un robot.
Detecta el robot, genera un HTML de lujo y lo manda por Gmail SMTP.

Deploy en Railway: ya estás en Railway con n8n, agrega este como servicio separado.

POST /send-robot-catalog
  Body: { "robot": "cc1|pudubot2|bellabot|kettybot", "email": "...", "nombre": "...", "empresa": "..." }

GET /health → 200 OK (Railway health check)
"""

from flask import Flask, request, jsonify
import smtplib, ssl, os, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from datetime import datetime

app = Flask(__name__)

# ── CREDENCIALES ──────────────────────────────────────────────────────────────
def _load_env():
    env = {}
    p = Path(__file__).parent / '.env'
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

_env = _load_env()
def _e(k, d=''): return os.environ.get(k) or _env.get(k) or d

GMAIL_USER   = _e('GMAIL_USER', 'ventas@botmate.mx')
GMAIL_PASS   = _e('GMAIL_APP_PASSWORD')
WEBHOOK_KEY  = _e('EMAILER_SECRET', 'botmate2025')  # agrega EMAILER_SECRET en Railway
CAL_LINK     = 'https://calendar.app.google/zq731y653cuoeu7m9'
LOGO         = 'https://botmate.mx/wp-content/uploads/2024/07/Botmate_color.svg'
BASE_STYLE   = 'font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:620px;margin:0 auto;background:#ffffff;'

# ── CATÁLOGO DE ROBOTS ────────────────────────────────────────────────────────
ROBOTS = {
    'kettybot': {
        'nombre':   'KettyBot',
        'tag':      'Robot de Publicidad y Pantalla',
        'color':    '#7c3aed',
        'img':      'https://botmate.mx/wp-content/uploads/2025/05/KettyBot.png',
        'img_cut':  'https://botmate.mx/wp-content/uploads/2025/05/KettyBot-117x300.png',
        'url':      'https://botmate.mx/kettybot/',
        'tagline':  'Tu marca en movimiento — publicidad en punto de venta con robot autónomo',
        'specs': [
            ('📺', 'Pantalla de 18.5"', 'Display de alta resolución para anuncios, videos y contenido de marca'),
            ('🔊', 'Audio integrado', 'Reproduce anuncios sonoros, música de marca o mensajes de producto'),
            ('🧭', 'Navegación autónoma', 'SLAM Láser + Visual — recorre el piso de tienda o evento sin guía'),
            ('🛍️', '2 charolas de entrega', 'También puede entregar muestras, cupones o productos pequeños'),
            ('🗣️', 'Interacción por voz', 'IA conversacional — responde preguntas básicas del cliente'),
            ('📐', 'Pasillo mínimo 55cm', 'Compacto — funciona en tiendas, centros comerciales, eventos'),
        ],
        'use_cases': [
            'Publicidad en punto de venta (retail, supermercados, plazas)',
            'Lanzamiento de productos — recorre la tienda mostrando el nuevo producto',
            'Eventos y expos — atrae atención, genera fotos para redes sociales',
            'Hospitales y clínicas — informa sobre servicios o promociones',
            'Bancos y financieras — comunica productos mientras el cliente espera',
        ],
        'caso': {
            'cliente': 'Cadena de retail, CDMX',
            'resultado': 'El KettyBot recorrió el piso de venta durante 8 horas diarias promocionando el lanzamiento de un producto. En 2 semanas: +340% en awareness de producto vs. señalización estática.',
            'dato': '+340% awareness en 2 semanas',
        },
        'roi': {
            'costo': '$17,500/mes (renta con contrato)',
            'vs': 'Una campaña de displays digitales estáticos: $25,000–$40,000/mes en costos de instalación y espacio.',
            'ventaja': 'El robot se MUEVE, atrae al cliente, interactúa y está donde más se necesita en cada momento.',
        },
        'sectores': 'Retail · Supermercados · Centros comerciales · Eventos · Hospitales · Bancos',
        'clientes': 'Walmart · The Home Depot · Alsea · Grupo Brisas',
    },
    'pudubot2': {
        'nombre':   'PuduBot 2',
        'tag':      'Robot de Charolas y Delivery Autónomo',
        'color':    '#0284c7',
        'img':      'https://botmate.mx/wp-content/uploads/2025/05/PuduBot2.png',
        'img_cut':  'https://botmate.mx/wp-content/uploads/2025/05/PuduBot2-231x300.png',
        'url':      'https://botmate.mx/pudubot-2/',
        'tagline':  'Delivery de platillos y bebidas — preciso, silencioso, incansable',
        'specs': [
            ('🍽️', '3 charolas de inducción', 'Infrarrojo — detecta cuando el cliente tomó el pedido y sigue su ruta'),
            ('📱', 'Pantalla interactiva', 'El comensal confirma su pedido, ve el menú, interactúa con el robot'),
            ('🔭', 'Sensores 3D', 'Detecta obstáculos en tiempo real — personas, sillas, carritos'),
            ('🗺️', 'VSLAM + Laser SLAM', 'Doble sistema de navegación — nunca se pierde, siempre llega'),
            ('🔋', 'Batería intercambiable', 'Cambio en segundos — cero tiempo fuera de operación'),
            ('📦', 'Hasta 30kg total', 'Carga distribuida en 3 charolas — platillos, bebidas, suministros'),
        ],
        'use_cases': [
            'Restaurantes — entrega de platillos y bebidas mesa a mesa',
            'Hoteles — room service autónomo, delivery a pisos y cuartos',
            'Hospitales — entrega de medicamentos, alimentos y suministros a pacientes',
            'Corporativos — delivery interno entre pisos, documentos, café',
            'Dark kitchens — manejo de pedidos sin espera de personal',
        ],
        'caso': {
            'cliente': 'Restaurante 120 cubiertos, CDMX',
            'resultado': 'El PuduBot 2 reemplazó 4 de los 8 meseros en la sección de delivery. La atención personalizada quedó en manos del equipo humano. Resultado en 60 días: ahorro neto de $56,000 MXN/mes y 0% de errores en pedidos.',
            'dato': '$56,000 MXN/mes de ahorro neto',
        },
        'roi': {
            'costo': '$17,500/mes (renta con contrato)',
            'vs': 'Un mesero en México: $19,000–$24,000/mes real (sueldo + IMSS + prestaciones + rotación).',
            'ventaja': 'El robot trabaja 16h/día, 7 días, nunca falta, nunca se queja. El equipo humano se enfoca en la experiencia del cliente.',
        },
        'sectores': 'Restaurantes · Hoteles · Hospitales · Corporativos · Dark Kitchens',
        'clientes': 'Alsea · Hilton · Grupo Brisas · The Palace Company · Hospitales MAC',
    },
    'cc1': {
        'nombre':   'CC1',
        'tag':      'Robot de Limpieza Autónomo Industrial',
        'color':    '#059669',
        'img':      'https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png',
        'img_cut':  'https://botmate.mx/wp-content/uploads/2025/05/PuduCC1-250x300.png',
        'url':      'https://botmate.mx/pudu-cc1/',
        'tagline':  '4-en-1: barre, friega, mopea y aspira — sin parar, sin quejarse',
        'specs': [
            ('🧹', '4-en-1 simultáneo', 'Barre, friega, mopea y aspira al mismo tiempo en una sola pasada'),
            ('📏', '500mm de ancho de limpieza', 'Cubre más área por pasada que cualquier mopa o aspiradora manual'),
            ('⚡', 'Carga inalámbrica automática', 'Regresa solo a su base cuando necesita cargarse — sin intervención'),
            ('🕐', '18h de autonomía', 'Opera los 3 turnos sin parar — limpieza nocturna sin personal'),
            ('📊', 'Reporte de cobertura', 'Genera reporte automático de áreas limpiadas — para auditorías ISO y certificaciones'),
            ('🚧', 'Detección de obstáculos', 'Personas, carritos, muebles — los esquiva sin problema en tiempo real'),
        ],
        'use_cases': [
            'Retail y supermercados — limpieza de piso de venta sin interrumpir al cliente',
            'Hospitales y clínicas — cumplimiento de protocolos de higiene en todos los turnos',
            'Manufactura y plantas — limpieza nocturna de 3 turnos con 1 robot',
            'Corporativos y oficinas — pasillos y áreas comunes impecables 24/7',
            'Hoteles — áreas comunes, lobby y pasillos en los 3 turnos',
        ],
        'caso': {
            'cliente': 'Planta Bayer México',
            'resultado': 'Piloto de 4 semanas en planta industrial. El CC1 cubrió el 100% del área que antes solo alcanzaba un 60% con personal nocturno. Al finalizar el piloto, Bayer adquirió 3 unidades. Ahorro documentado: $94,000 MXN/mes.',
            'dato': '$94,000 MXN/mes de ahorro — Bayer México',
        },
        'roi': {
            'costo': '$17,500/mes (renta con contrato)',
            'vs': 'Personal de limpieza en México: $19,000–$24,000/mes por persona. Con 3 turnos: necesitas 3 personas = $57,000–$72,000/mes.',
            'ventaja': '1 CC1 cubre los 3 turnos. El robot trabaja 18h continuas, genera reporte de cobertura para auditorías y nunca falta.',
        },
        'sectores': 'Retail · Manufactura · Hospitales · Hoteles · Corporativos',
        'clientes': 'Walmart · The Home Depot · CHRISTUS MUGUERZA · Hospitales MAC · Bayer México',
    },
    'bellabot': {
        'nombre':   'BellaBot',
        'tag':      'Robot Mesero con IA y Expresiones',
        'color':    '#dc2626',
        'img':      'https://botmate.mx/wp-content/uploads/2025/05/BellaBot.png',
        'img_cut':  'https://botmate.mx/wp-content/uploads/2025/05/BellaBot-207x300.png',
        'url':      'https://botmate.mx/bellabot/',
        'tagline':  'El mesero que nunca falta — experiencia premium que los clientes fotografían',
        'specs': [
            ('🤖', 'Expresiones LED animadas', 'Cara interactiva — sonríe, parpadea, reacciona. Los comensales lo fotografían para redes.'),
            ('🍽️', '4 charolas de inducción', 'Infrarrojo — detecta cuando tomaron el pedido y continúa su ruta automáticamente'),
            ('🗣️', 'Voz con IA', 'Saluda, responde preguntas, anuncia el platillo al llegar a la mesa'),
            ('🔭', 'Sensores 3D', 'Navega entre mesas, sillas y personas sin golpear nada'),
            ('🗺️', 'VSLAM + Laser SLAM', 'Doble navegación — aprende el mapa del restaurante en minutos'),
            ('🔋', 'Batería intercambiable', 'Cambio en segundos — cero tiempo fuera de operación en hora pico'),
        ],
        'use_cases': [
            'Restaurantes — servicio a mesa de platillos y bebidas',
            'Hoteles — room service de amenities y snacks',
            'Eventos y bodas — robot de servicio como elemento diferenciador',
            'Ferias y exposiciones — atrae atención, genera contenido viral',
            'Dark kitchens y fast casual — delivery en sitio sin esperar a un mesero',
        ],
        'caso': {
            'cliente': 'Cadena de restaurantes, CDMX (Grupo Alsea)',
            'resultado': '1 BellaBot reemplazó 2 posiciones en hora pico. En 3 meses: 87% reducción en tiempos de espera, 0 errores de pedido en delivery, y +300 publicaciones en Instagram de clientes con el robot.',
            'dato': '+300 posts orgánicos en Instagram en 3 meses',
        },
        'roi': {
            'costo': '$17,500/mes (renta con contrato)',
            'vs': '2 meseros en México: $38,000–$48,000/mes real (sueldos + IMSS + prestaciones + rotación).',
            'ventaja': 'El BellaBot no falta los lunes, no llega tarde, no pide aumento. Y genera contenido viral que ningún mesero genera.',
        },
        'sectores': 'Restaurantes · Hoteles · Eventos · Dark Kitchens · Cafeterías',
        'clientes': 'Alsea · Pollo Pepe · Grupo WOW · Grupo Trimex · Santa Salitas',
    },
}

# Alias para detección flexible
ROBOT_ALIASES = {
    'kettybot':   ['ketty', 'publicidad', 'pantalla', 'anuncio', 'display', 'marketing', 'promo'],
    'pudubot2':   ['pudu', 'pudubot', 'charola', 'delivery', 'mesero de delivery', 'room service', 'entrega'],
    'cc1':        ['cc1', 'limpieza', 'limpiar', 'barrer', 'fregar', 'limpiador'],
    'bellabot':   ['bella', 'bellabot', 'mesero', 'restaurante', 'servicio a mesa'],
}

def detect_robot(text):
    """Detecta el robot desde texto libre (para casos donde n8n manda descripción)"""
    t = (text or '').lower()
    for robot_key, aliases in ROBOT_ALIASES.items():
        for alias in aliases:
            if alias in t:
                return robot_key
    return 'cc1'  # default

# ── HTML EMAIL BUILDER ────────────────────────────────────────────────────────
def build_robot_email(robot_key, nombre, empresa):
    r = ROBOTS.get(robot_key, ROBOTS['cc1'])
    nc = nombre.split()[0].title() if nombre else 'Estimado/a'
    emp = empresa.title() if empresa else 'su empresa'
    fecha = datetime.now().strftime('%B %Y')
    color = r['color']
    specs_html = ''.join(f'''
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="font-size:22px;padding-right:14px;vertical-align:middle;">{s[0]}</td>
              <td style="vertical-align:top;">
                <strong style="color:#0f172a;font-size:13px;display:block;">{s[1]}</strong>
                <span style="color:#64748b;font-size:12px;">{s[2]}</span>
              </td>
            </tr></table>
          </td>
        </tr>''' for s in r['specs'])

    use_cases_html = ''.join(f'<li style="margin:6px 0;font-size:13px;color:#334155;">{u}</li>' for u in r['use_cases'])

    return f'''<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BotMate — {r["nombre"]} para {emp}</title>
</head>
<body style="margin:0;padding:20px;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="{BASE_STYLE}border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <tr><td style="background:#0f172a;padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><img src="{LOGO}" alt="BotMate" height="28" style="display:block;"></td>
      <td style="text-align:right;color:#94a3b8;font-size:11px;">{fecha} · botmate.mx</td>
    </tr></table>
  </td></tr>

  <!-- HERO — Robot color bar -->
  <tr><td style="background:{color};padding:28px 28px 0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:bottom;padding-bottom:0;">
        <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:4px 10px;border-radius:20px;display:inline-block;margin-bottom:10px;">{r["tag"].upper()}</span>
        <h1 style="margin:0 0 8px;color:#ffffff;font-size:32px;line-height:1.1;">{r["nombre"]}</h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.5;max-width:380px;">{r["tagline"]}</p>
      </td>
      <td style="text-align:right;vertical-align:bottom;width:180px;">
        <img src="{r["img_cut"]}" alt="{r["nombre"]}" width="150"
          style="display:block;margin-left:auto;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.3));">
      </td>
    </tr></table>
  </td></tr>

  <!-- SALUDO -->
  <tr><td style="padding:28px 28px 0;">
    <p style="margin:0 0 10px;font-size:16px;color:#1e293b;">Hola <strong>{nc}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
      Gracias por su interés en el <strong>{r["nombre"]}</strong>. Aquí tiene toda la información que necesita para evaluar si es la solución correcta para <strong>{emp}</strong>.
    </p>
  </td></tr>

  <!-- SPECS TABLE -->
  <tr><td style="padding:0 28px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;letter-spacing:0.5px;text-transform:uppercase;">Especificaciones técnicas</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      {specs_html}
    </table>
  </td></tr>

  <!-- USE CASES -->
  <tr><td style="padding:20px 28px 0;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:18px 20px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1e40af;letter-spacing:0.5px;text-transform:uppercase;">¿Dónde funciona el {r["nombre"]}?</p>
      <ul style="margin:0;padding-left:18px;">
        {use_cases_html}
      </ul>
      <p style="margin:10px 0 0;font-size:12px;color:#64748b;">Sectores: <strong>{r["sectores"]}</strong></p>
    </div>
  </td></tr>

  <!-- CASO DE ÉXITO -->
  <tr><td style="padding:20px 28px 0;">
    <div style="background:#0f172a;border-radius:8px;padding:22px 24px;">
      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1px;text-transform:uppercase;">📊 Caso de éxito real</p>
      <p style="margin:0 0 12px;font-size:22px;color:{color};font-weight:900;">{r["caso"]["dato"]}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#e2e8f0;line-height:1.6;">{r["caso"]["resultado"]}</p>
      <p style="margin:0;font-size:11px;color:#64748b;">Cliente: {r["caso"]["cliente"]}</p>
    </div>
  </td></tr>

  <!-- ROI -->
  <tr><td style="padding:20px 28px 0;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;letter-spacing:0.5px;text-transform:uppercase;">Análisis de inversión</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 18px;vertical-align:top;">
          <span style="font-size:11px;color:#16a34a;font-weight:700;display:block;margin-bottom:6px;">✅ RENTA {r["nombre"].upper()}</span>
          <strong style="font-size:20px;color:#15803d;display:block;">{r["roi"]["costo"]}</strong>
          <span style="font-size:11px;color:#166534;">Todo incluido: mantenimiento, soporte 24/7, actualizaciones, capacitación</span>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 18px;vertical-align:top;">
          <span style="font-size:11px;color:#dc2626;font-weight:700;display:block;margin-bottom:6px;">❌ COSTO ACTUAL</span>
          <strong style="font-size:13px;color:#991b1b;display:block;line-height:1.4;">{r["roi"]["vs"]}</strong>
        </td>
      </tr>
    </table>
    <div style="margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;">
      <strong style="font-size:13px;color:#92400e;">💡 La ventaja: </strong>
      <span style="font-size:13px;color:#78350f;">{r["roi"]["ventaja"]}</span>
    </div>
  </td></tr>

  <!-- CLIENTES -->
  <tr><td style="padding:20px 28px 0;">
    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
      Ya confían en BotMate: <strong style="color:#475569;">{r["clientes"]}</strong>
    </p>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:20px 28px 28px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
      <tr><td style="background:{color};border-radius:8px;">
        <a href="{CAL_LINK}" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
          → Agendar demo gratuita en 30 min
        </a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:12px;color:#94a3b8;">Sin compromiso · el robot viene a su ubicación · instalación en 2–3 días</p>
    <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">
      O escríbanos directamente:
      <a href="https://wa.me/5256466565718" style="color:{color};">WhatsApp</a> ·
      <a href="mailto:ventas@botmate.mx" style="color:{color};">ventas@botmate.mx</a>
    </p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:14px;vertical-align:middle;">
        <img src="{LOGO}" alt="BotMate" width="72" style="display:block;">
      </td>
      <td style="border-left:2px solid #e2e8f0;padding-left:14px;vertical-align:middle;">
        <strong style="color:#0f172a;font-size:13px;display:block;">Ivan Cadavieco</strong>
        <span style="color:#64748b;font-size:12px;">Fundador &amp; CEO · BotMate Mexico</span><br>
        <a href="mailto:ventas@botmate.mx" style="color:#2563eb;font-size:12px;text-decoration:none;">ventas@botmate.mx</a>
        &nbsp;·&nbsp;<a href="https://wa.me/5256466565718" style="color:#16a34a;font-size:12px;text-decoration:none;">+52 56 4666 5718</a>
      </td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>'''

# ── SMTP SENDER ───────────────────────────────────────────────────────────────
def send_robot_email(to_email, robot_key, nombre='', empresa=''):
    r = ROBOTS.get(robot_key, ROBOTS['cc1'])
    nc = nombre.split()[0].title() if nombre else 'Estimado/a'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"📋 {r['nombre']} — Información completa para {empresa or 'su empresa'} | BotMate"
    msg['From']    = f'Ivan | BotMate <{GMAIL_USER}>'
    msg['To']      = to_email

    plain = f"""Hola {nc},

Gracias por su interés en el {r['nombre']} — {r['tag']}.

{r['tagline']}

ESPECIFICACIONES:
{''.join(f"• {s[1]}: {s[2]}" + chr(10) for s in r['specs'])}

CASO DE ÉXITO: {r['caso']['dato']}
{r['caso']['resultado']}

PRECIO: {r['roi']['costo']}

Agende una demo gratuita de 30 minutos:
{CAL_LINK}

Ivan Cadavieco · Fundador & CEO · BotMate Mexico
ventas@botmate.mx · +52 56 4666 5718 · botmate.mx
"""
    html = build_robot_email(robot_key, nombre, empresa)

    msg.attach(MIMEText(plain, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    ctx = ssl.create_default_context()
    with smtplib.SMTP('smtp.gmail.com', 587) as srv:
        srv.ehlo()
        srv.starttls(context=ctx)
        srv.login(GMAIL_USER, GMAIL_PASS)
        srv.sendmail(GMAIL_USER, to_email, msg.as_string())

# ── FLASK ENDPOINTS ───────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'BotMate Robot Emailer'}), 200

@app.route('/send-robot-catalog', methods=['POST'])
def send_catalog():
    # Auth check
    key = request.headers.get('X-Botmate-Key') or request.json.get('secret', '')
    if key != WEBHOOK_KEY:
        return jsonify({'error': 'Unauthorized'}), 401

    data     = request.json or {}
    to_email = data.get('email', '').strip().lower()
    nombre   = data.get('nombre', '').strip()
    empresa  = data.get('empresa', '').strip()
    robot    = data.get('robot', '').strip().lower()

    if not to_email or '@' not in to_email:
        return jsonify({'error': 'Email inválido'}), 400

    # Detectar robot si viene como texto libre
    if robot not in ROBOTS:
        robot = detect_robot(robot)

    try:
        send_robot_email(to_email, robot, nombre, empresa)
        r = ROBOTS[robot]
        return jsonify({
            'ok':     True,
            'robot':  r['nombre'],
            'to':     to_email,
            'msg_wa': f"✅ Listo {nombre.split()[0].title() if nombre else ''}! Te mandé el catálogo completo del *{r['nombre']}* a {to_email} 📧\n\nIncluye specs técnicas, casos de éxito reales y precios de renta.\n\n¿Quieres también agendar una demo en vivo de 30 minutos? → {CAL_LINK}"
        }), 200
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/robots', methods=['GET'])
def list_robots():
    """Endpoint de diagnóstico — lista todos los robots disponibles"""
    return jsonify({k: {'nombre': v['nombre'], 'tag': v['tag']} for k, v in ROBOTS.items()})

# ── CLI PARA PRUEBAS ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    if len(sys.argv) >= 4:
        # python3 robot_emailer.py cc1 ivan@email.com "Ivan Cadavieco" "BotMate"
        robot_arg  = sys.argv[1]
        email_arg  = sys.argv[2]
        nombre_arg = sys.argv[3] if len(sys.argv) > 3 else ''
        empresa_arg= sys.argv[4] if len(sys.argv) > 4 else ''
        print(f"Enviando catálogo de {robot_arg} a {email_arg}...")
        send_robot_email(email_arg, robot_arg, nombre_arg, empresa_arg)
        print("✅ Email enviado!")
    else:
        # Arrancar Flask
        port = int(os.environ.get('PORT', 5001))
        print(f"🤖 BotMate Robot Emailer corriendo en puerto {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
