# BotMate Robot Emailer — Setup Completo
# Conecta el bot de WhatsApp con el emailer de catálogos

---

## ARQUITECTURA COMPLETA

```
Cliente en WhatsApp:
"¿me puedes mandar info del robot de limpieza?"
        ↓
WhatsApp Webhook (n8n)
        ↓
Robot Detector (Code Node) — detecta: cc1
        ↓
Claude Agente — responde: "¿A qué correo te lo mando?"
        ↓
Cliente: "gerencia@empresa.com"
        ↓
Robot Detector — detecta: email capturado
        ↓
Claude Agente — accion: "ENVIAR_CATALOGO", robot: "cc1", email: "gerencia@empresa.com"
        ↓
IF node — accion === "ENVIAR_CATALOGO"
        ↓
HTTP Request → robot_emailer (Railway) → manda email HTML de lujo del CC1
        ↓
WhatsApp: "✅ Listo! Te mandé el catálogo del CC1 a gerencia@empresa.com 📧..."
        ↓
Airtable: guarda email, actualiza Ultimo_Evento
```

---

## PASO 1 — ✅ DEPLOY COMPLETADO EN RAILWAY

**URL en producción:** `https://robot-emailer-production.up.railway.app`
**Service ID:** `2da3c658-442d-4526-b660-0b925d397d21`
**Proyecto:** `responsible-quietude`

### Env vars configuradas en Railway:
```
RESEND_KEY=re_9fe3g26b_KF1EdoW8djjiL7MnwHnf1deq
EMAILER_SECRET=botmate2025seguro
PORT=8080
```

> ⚠️ Nota técnica: Railway bloquea SMTP (puerto 587). Se usa Resend API via `requests` library.
> Cloudflare también bloquea Python urllib; `requests` tiene TLS fingerprint diferente que pasa.

### Test del deploy (PROBADO ✅):
```bash
# CC1 - limpieza
curl -X POST https://robot-emailer-production.up.railway.app/send-robot-catalog \
  -H "Content-Type: application/json" \
  -H "X-Botmate-Key: botmate2025seguro" \
  -d '{"robot":"cc1","email":"ivan.cadavieco@botmate.mx","nombre":"Ivan","empresa":"BotMate"}'

# Health check
curl https://robot-emailer-production.up.railway.app/health
```

---

## PASO 2 — Nodo n8n: IF — Detectar accion = ENVIAR_CATALOGO

Después del Code Parser (que extrae el JSON de Claude), agrega un **IF node**:

```
Condition: {{ $json.accion }} equals ENVIAR_CATALOGO
AND: {{ $json.emailDestino }} is not empty
```

→ **Branch TRUE**: HTTP Request → Robot Emailer
→ **Branch FALSE**: Solo manda el mensaje WA normal

---

## PASO 3 — Nodo n8n: HTTP Request → Robot Emailer

**Nombre del nodo:** "Robot Emailer — Mandar Catálogo"

```yaml
Method: POST
URL: https://robot-emailer-production.up.railway.app/send-robot-catalog
Headers:
  Content-Type: application/json
  X-Botmate-Key: botmate2025seguro
Body (JSON):
  {
    "robot":   "{{ $json.robotCatalogo }}",
    "email":   "{{ $json.emailDestino }}",
    "nombre":  "{{ $('Code: Robot Detector').item.json.nombre }}",
    "empresa": "{{ $('Code: Robot Detector').item.json.empresa }}"
  }
```

El emailer devuelve:
```json
{
  "ok": true,
  "robot": "CC1",
  "to": "gerencia@empresa.com",
  "msg_wa": "✅ Listo! Te mandé el catálogo completo del CC1 a gerencia@empresa.com 📧..."
}
```

---

## PASO 4 — Nodo n8n: WhatsApp — Confirmar envío

Usa `$json.msg_wa` del emailer como el mensaje de WhatsApp de confirmación:

```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $('Code: Robot Detector').item.json.telefono }}",
  "type": "text",
  "text": {
    "body": "{{ $json.msg_wa }}"
  }
}
```

---

## PASO 5 — Nodo n8n: Airtable — Actualizar Lead

Después de mandar el email, actualiza Airtable:

```yaml
Table: tblO571b5ojGbLHnX
Operation: Update Record
Record ID: {{ $('Code: Robot Detector').item.json.leadId }}
Fields:
  Email: "{{ $json.to }}"  (si no lo tenían)
  Ultimo_Evento: "📧 Catálogo {{ $json.robot }} enviado a {{ $json.to }}"
  Workflow_State: "email_sent"
```

---

## FLUJO COMPLETO DEL INBOUND HANDLER (actualizado)

```
[Webhook WA entrada]
        ↓
[Airtable: buscar lead por teléfono]
        ↓
[Code: Robot Detector + detección de email en mensaje]
        ↓
[Claude: Agente vendedor]
        ↓
[Code: Parser JSON de Claude]
        ↓
[IF: accion = ENVIAR_CATALOGO AND emailDestino not empty]
   ↓ TRUE                          ↓ FALSE
[HTTP: Robot Emailer]        [skip email]
   ↓                               ↓
[IF: enviarMedia = true]     [IF: enviarMedia = true]
   ↓ TRUE    ↓ FALSE             ↓ TRUE    ↓ FALSE
[WA imagen] [skip]           [WA imagen]  [skip]
        ↓                            ↓
[WA: Enviar mensaje texto (msg_wa o mensaje de Claude)]
        ↓
[IF: accion = ESCALAR_IVAN]
        ↓ TRUE
[Telegram: Alerta a Ivan]
        ↓
[Airtable: Actualizar lead]
```

---

## DETECCIÓN DE ROBOTS — Palabras clave en WhatsApp

El Code Node detecta automáticamente:

| Cliente dice... | Robot detectado |
|---|---|
| "robot de limpieza", "CC1", "barrer", "fregar" | `cc1` |
| "robot de publicidad", "pantalla", "KettyBot", "display", "anuncio" | `kettybot` |
| "robot de charolas", "PuduBot", "delivery", "room service" | `pudubot2` |
| "BellaBot", "mesero", "restaurante", "servicio a mesa" | `bellabot` |

---

## PRUEBA RÁPIDA (CLI) — Sin n8n

```bash
cd /Users/ivancadavieeco/BOTMATE

# CC1 (limpieza)
python3 robot_emailer.py cc1 ivan.cadavieco@botmate.mx "Ivan Cadavieco" "BotMate"

# KettyBot (publicidad)
python3 robot_emailer.py kettybot ivan.cadavieco@botmate.mx "Ivan Cadavieco" "BotMate"

# PuduBot 2 (charolas)
python3 robot_emailer.py pudubot2 ivan.cadavieco@botmate.mx "Ivan Cadavieco" "BotMate"

# BellaBot (mesero)
python3 robot_emailer.py bellabot ivan.cadavieco@botmate.mx "Ivan Cadavieco" "BotMate"
```

---

## VARIABLES EN RAILWAY (robot_emailer service) ✅ CONFIGURADAS

| Variable | Valor |
|---|---|
| `RESEND_KEY` | `re_9fe3g26b_KF1EdoW8djjiL7MnwHnf1deq` |
| `EMAILER_SECRET` | `botmate2025seguro` |
| `PORT` | `8080` |

> SMTP descartado — Railway lo bloquea en puerto 587. Se usa Resend API.
