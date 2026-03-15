import { useState, useEffect, useRef } from "react";
import {
  supabase,
  fetchClients as sbFetchClients, addClient as sbAddClient, updateClient as sbUpdateClient, deleteClient as sbDeleteClient,
  fetchProspects as sbFetchProspects, addProspect as sbAddProspect, deleteProspect as sbDeleteProspect,
  fetchRobots as sbFetchRobots, addRobot as sbAddRobot, updateRobot as sbUpdateRobot, deleteRobot as sbDeleteRobot,
  fetchRentals as sbFetchRentals, addRental as sbAddRental, updateRental as sbUpdateRental,
  fetchInvoices as sbFetchInvoices, addInvoice as sbAddInvoice, updateInvoice as sbUpdateInvoice, deleteInvoice as sbDeleteInvoice,
  mapInvoicesFromDB,
  fetchConversations as sbFetchConversations,
} from "./supabaseClient.js";
import {
  Users, TrendingUp, MessageCircle, Mail, Plus, Search, Edit2, Trash2,
  X, BarChart3, Home, Send, ChevronRight, CheckCircle, ExternalLink,
  ArrowRight, Target, Zap, Check, Award, Clock, Bot, FileText,
  DollarSign, Package, Calendar, Download, Upload, Sparkles,
  Building2, Factory, Hotel, ShoppingBag, Stethoscope, GraduationCap,
  Plane, Landmark, Settings, Eye, EyeOff, ChevronDown, RotateCcw,
  AlertCircle, Printer, Filter, MapPin, Phone, Globe, Star
} from "lucide-react";
import { generateInvoiceExcel, generateInvoiceExcelMultiItem } from "./invoiceExcel.js";

// ─── Database: Supabase ──────────────────────────────────────────────────────

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGES = ["Lead","Contactado","Propuesta","Negociación","Ganado","Perdido"];
const STAGE_META = {
  Lead:        { color:"#6366f1", bg:"#eef2ff", badge:"bg-indigo-100 text-indigo-700"  },
  Contactado:  { color:"#0ea5e9", bg:"#e0f2fe", badge:"bg-sky-100 text-sky-700"        },
  Propuesta:   { color:"#f59e0b", bg:"#fef3c7", badge:"bg-amber-100 text-amber-700"    },
  Negociación: { color:"#f97316", bg:"#fff7ed", badge:"bg-orange-100 text-orange-700"  },
  Ganado:      { color:"#10b981", bg:"#d1fae5", badge:"bg-emerald-100 text-emerald-700"},
  Perdido:     { color:"#ef4444", bg:"#fee2e2", badge:"bg-red-100 text-red-700"        },
};

const BOTMATE_PRICING = {
  venta_cc1:   { label:"Venta Robot CC1",           price:290000 },
  venta_cc2:   { label:"Venta Robot CC2",           price:350000 },
  renta_diaria:{ label:"Renta Diaria Robot",        price:3500   },
  renta_finde: { label:"Renta Fin de Semana",       price:8000   },
  renta_mens:  { label:"Renta Mensual Robot",       price:25000  },
  poliza:      { label:"Póliza de Mantenimiento",   price:17500  },
  instalacion: { label:"Instalación y Configuración",price:5000  },
  capacitacion:{ label:"Capacitación (1 día)",      price:3000   },
  soporte:     { label:"Soporte Técnico Mensual",   price:4500   },
};

const PLANS = [
  { id:"renta_diaria",  label:"Renta Diaria",           price:3500,   period:"día"    },
  { id:"renta_finde",   label:"Renta Fin de Semana",    price:8000,   period:"evento" },
  { id:"renta_mens",    label:"Renta Mensual",          price:25000,  period:"mes"    },
  { id:"venta_cc1",     label:"Venta Robot CC1",        price:290000, period:"única"  },
  { id:"venta_cc2",     label:"Venta Robot CC2",        price:350000, period:"única"  },
  { id:"poliza",        label:"Póliza de Mantenimiento",price:17500,  period:"año"    },
  { id:"soporte",       label:"Soporte Técnico Mensual",price:4500,   period:"mes"    },
  { id:"custom",        label:"Plan Personalizado",     price:0,      period:"custom" },
];

const IVA_RATE = 0.16;

const ROBOT_MODELS = ["BotMate CC1","BotMate CC2","BotMate Mini"];
const ROBOT_STATUS = ["Disponible","Rentado","Mantenimiento","Baja"];
const RENTAL_TYPES = [
  { id:"diaria",  label:"Diaria",          days:1,   price:3500  },
  { id:"finde",   label:"Fin de Semana",   days:3,   price:8000  },
  { id:"mensual", label:"Mensual",         days:30,  price:25000 },
  { id:"custom",  label:"Personalizado",   days:null,price:null  },
];

const SECTORS = [
  { id:"hospital",  label:"Hospitales / Clínicas",    icon:Stethoscope,  color:"bg-red-100 text-red-700"     },
  { id:"mall",      label:"Centros Comerciales",       icon:ShoppingBag,  color:"bg-purple-100 text-purple-700"},
  { id:"hotel",     label:"Hoteles / Resorts",         icon:Hotel,        color:"bg-sky-100 text-sky-700"     },
  { id:"corp",      label:"Corporativos",              icon:Building2,    color:"bg-indigo-100 text-indigo-700"},
  { id:"factory",   label:"Manufactura / Industria",   icon:Factory,      color:"bg-orange-100 text-orange-700"},
  { id:"airport",   label:"Aeropuertos / Transporte",  icon:Plane,        color:"bg-cyan-100 text-cyan-700"   },
  { id:"bank",      label:"Bancos / Financieras",      icon:Landmark,     color:"bg-emerald-100 text-emerald-700"},
  { id:"edu",       label:"Educación",                 icon:GraduationCap,color:"bg-yellow-100 text-yellow-700"},
  { id:"restaurant",label:"Restaurantes / Cadenas",    icon:Star,         color:"bg-pink-100 text-pink-700"   },
  { id:"gobierno",  label:"Gobierno / Municipios",     icon:MapPin,       color:"bg-gray-100 text-gray-700"   },
];

const WA_TEMPLATES = [
  { id:1, name:"Saludo inicial",     icon:"👋", text:"Hola {nombre}, soy {vendedor} de BotMate. Te contacto para presentarte nuestros robots autónomos de servicio. ¿Tienes unos minutos para platicar esta semana?" },
  { id:2, name:"Demo Robot",        icon:"🤖", text:"Hola {nombre}, ¿sabías que el BotMate CC1 puede reducir hasta 40% los costos de atención al cliente? Me gustaría mostrarte una demo en {empresa}. ¿Cuándo te vendría bien?" },
  { id:3, name:"Seguimiento",       icon:"🔄", text:"Hola {nombre}, espero que estés muy bien. Quería hacer seguimiento a nuestra conversación sobre el robot BotMate. ¿Has tenido oportunidad de revisar la propuesta?" },
  { id:4, name:"Propuesta enviada", icon:"📄", text:"Hola {nombre}, acabo de enviarte la propuesta personalizada para {empresa}. ¿La pudiste revisar? Con gusto te explico cualquier detalle o coordinamos una visita técnica." },
  { id:5, name:"Oferta especial",   icon:"⚡", text:"Hola {nombre}, tenemos una promoción especial en renta del BotMate CC1 disponible solo esta semana. Me gustaría compartirte los detalles. ¿Cuándo podemos hablar?" },
  { id:6, name:"Cierre",            icon:"🎯", text:"Hola {nombre}, estamos listos para instalar el robot en {empresa} cuando tú lo decidas. El proceso es rápido: 1 día de instalación y 1 de capacitación. ¡Arrancamos cuando digas!" },
];

const EMAIL_TEMPLATES = [
  { id:1, name:"Presentación BotMate", icon:"🤖", subject:"Presentamos BotMate – El Robot Autónomo para {empresa}",
    body:`Estimado/a {nombre},\n\nEspero que se encuentre muy bien. Mi nombre es {vendedor} y me permito contactarle para presentarle BotMate, el robot autónomo de servicio al cliente que está transformando las operaciones en empresas como la suya.\n\nNuestros robots BotMate CC1 pueden:\n• Atender clientes 24/7 sin descanso\n• Reducir costos operativos hasta 40%\n• Integrarse con su sistema actual\n• Ofrecer información, guiar visitantes y procesar solicitudes\n\n¿Le gustaría agendar una demo sin costo en sus instalaciones?\n\nQuedo a sus órdenes,\n{vendedor}\nBotMate` },
  { id:2, name:"Propuesta de Renta",   icon:"📋", subject:"Propuesta de Renta Robot BotMate para {empresa}",
    body:`Estimado/a {nombre},\n\nAdjunto encontrará nuestra propuesta de renta personalizada para {empresa}.\n\nModalidades disponibles:\n• Renta Diaria: $3,500 MXN\n• Renta Fin de Semana: $8,000 MXN\n• Renta Mensual: $25,000 MXN\n\nTodos incluyen: instalación, configuración, soporte técnico y capacitación de su equipo.\n\n¿Cuándo le vendría bien agendar una reunión para revisar los detalles?\n\nSaludos cordiales,\n{vendedor}\nBotMate` },
  { id:3, name:"Propuesta de Venta",   icon:"💰", subject:"Propuesta de Adquisición Robot BotMate CC1 – {empresa}",
    body:`Estimado/a {nombre},\n\nA continuación le comparto la propuesta de adquisición del Robot BotMate CC1 para {empresa}.\n\nInversión: $290,000 MXN\nIncluye:\n• Robot BotMate CC1 completo\n• Instalación y configuración\n• Capacitación de 2 días\n• Póliza de mantenimiento 1 año\n• Soporte técnico prioritario\n\nFinanciamiento disponible. ROI estimado en 8-12 meses.\n\n¿Le gustaría agendar una demo antes de decidir?\n\nSaludos,\n{vendedor}\nBotMate` },
  { id:4, name:"Seguimiento",         icon:"🔁", subject:"Seguimiento – Propuesta BotMate para {empresa}",
    body:`Estimado/a {nombre},\n\nMe pongo en contacto para hacer seguimiento a la propuesta que le compartimos hace unos días para {empresa}.\n\n¿Ha tenido oportunidad de revisarla con su equipo?\n\nEstoy disponible para resolver cualquier duda o coordinar una visita técnica sin compromiso.\n\nQuedo en espera de sus comentarios.\n\nSaludos cordiales,\n{vendedor}\nBotMate` },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
function fmx(n) { return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:0}).format(n||0); }
function fdate(d) { if(!d) return "—"; return new Date(d).toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}); }

function Badge({ stage }) {
  const m = STAGE_META[stage]||{badge:"bg-gray-100 text-gray-700"};
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.badge}`}>{stage}</span>;
}

function Avatar({ name="?", size=8 }) {
  const colors=["bg-indigo-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-violet-500","bg-teal-500"];
  const i=(name||"A").charCodeAt(0)%colors.length;
  const init=(name||"A").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();
  return <div className={`w-${size} h-${size} rounded-full ${colors[i]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{init}</div>;
}

function Modal({ title, onClose, children, wide, extraWide }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${extraWide?"w-full max-w-4xl":wide?"w-full max-w-2xl":"w-full max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X size={18}/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type="text", placeholder, required, className="" }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
  );
}

function Select({ label, value, onChange, options, className="" }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
        {options.map(o => typeof o==="string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );
}

// ─── CLIENT MODAL ─────────────────────────────────────────────────────────────
function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client||{name:"",phone:"",email:"",company:"",sector:"",stage:"Lead",value:"",notes:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title={client?"Editar Cliente":"Agregar Cliente"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre completo" required value={form.name} onChange={v=>set("name",v)} placeholder="Juan Pérez" className="col-span-2"/>
        <Input label="Teléfono / WhatsApp" value={form.phone} onChange={v=>set("phone",v)} placeholder="8112345678"/>
        <Input label="Correo electrónico" type="email" value={form.email} onChange={v=>set("email",v)} placeholder="juan@empresa.com"/>
        <Input label="Empresa" value={form.company} onChange={v=>set("company",v)} placeholder="Mi Empresa SA"/>
        <Input label="Valor potencial (MXN)" type="number" value={form.value} onChange={v=>set("value",v)} placeholder="25000"/>
        <Select label="Sector" value={form.sector||""} onChange={v=>set("sector",v)} className="col-span-2"
          options={[{value:"",label:"— Sin sector —"},...SECTORS.map(s=>({value:s.id,label:s.label}))]}/>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Etapa</label>
          <div className="grid grid-cols-3 gap-2">
            {STAGES.map(s=>(
              <button key={s} type="button" onClick={()=>set("stage",s)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${form.stage===s?"border-indigo-500 bg-indigo-50 text-indigo-700":"border-gray-200 text-gray-600"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Información adicional..."/>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button type="button" onClick={()=>{if(!form.name.trim()){alert("El nombre es requerido");return;}onSave({...form,value:parseFloat(form.value)||0});}}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700">
          {client?"Guardar cambios":"Agregar cliente"}
        </button>
      </div>
    </Modal>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ clients, robots, rentals, invoices, setView }) {
  const won       = clients.filter(c=>c.stage==="Ganado");
  const active    = clients.filter(c=>!["Ganado","Perdido"].includes(c.stage));
  const pipeline  = active.reduce((s,c)=>s+(c.value||0),0);
  const rate      = clients.length?Math.round((won.length/clients.length)*100):0;
  const robotsOk  = robots.filter(r=>r.status==="Rentado").length;
  const pendInv   = invoices.filter(i=>i.status==="Pendiente").reduce((s,i)=>s+(i.total||0),0);
  const paidInv   = invoices.filter(i=>i.status==="Pagada").reduce((s,i)=>s+(i.total||0),0);
  const recent    = [...clients].sort((a,b)=>new Date(b.created)-new Date(a.created)).slice(0,5);
  const stageCounts=STAGES.map(s=>({stage:s,count:clients.filter(c=>c.stage===s).length}));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Centro de control BotMate Sales</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-4 gap-5 mb-5">
        {[
          {label:"Total Clientes",  value:clients.length,              icon:Users,      color:"bg-indigo-500", sub:"registrados"},
          {label:"En Pipeline",     value:active.length,               icon:TrendingUp, color:"bg-sky-500",    sub:"oportunidades activas"},
          {label:"Pipeline Valor",  value:fmx(pipeline),               icon:Target,     color:"bg-amber-500",  sub:"potencial estimado"},
          {label:"Tasa de Cierre",  value:`${rate}%`,                  icon:Award,      color:"bg-emerald-500",sub:"de ganados"},
        ].map(({label,value,icon:Icon,color,sub})=>(
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}><Icon size={20} className="text-white"/></div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {[
          {label:"Robots Activos",      value:`${robotsOk}/${robots.length}`, icon:Bot,         color:"bg-violet-500", sub:"en renta ahora"},
          {label:"Facturas Pendientes", value:fmx(pendInv),                   icon:AlertCircle, color:"bg-red-500",    sub:"por cobrar"},
          {label:"Facturación Cobrada", value:fmx(paidInv),                   icon:DollarSign,  color:"bg-teal-500",   sub:"ingreso confirmado"},
          {label:"Total Facturas",      value:invoices.length,                 icon:FileText,    color:"bg-orange-500", sub:"emitidas"},
        ].map(({label,value,icon:Icon,color,sub})=>(
          <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}><Icon size={20} className="text-white"/></div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Pipeline chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500"/>Pipeline</h3>
          <div className="space-y-3">
            {stageCounts.map(({stage,count})=>(
              <div key={stage} className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600 font-medium truncate">{stage}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{width:`${clients.length?(count/clients.length)*100:0}%`,backgroundColor:STAGE_META[stage]?.color}}/>
                </div>
                <div className="w-5 text-xs font-bold text-gray-700">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent clients */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock size={18} className="text-indigo-500"/>Clientes Recientes</h3>
            <button onClick={()=>setView("clients")} className="text-xs text-indigo-600 font-medium flex items-center gap-1">Ver todos <ChevronRight size={14}/></button>
          </div>
          <div className="space-y-2">
            {recent.map(c=>(
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                <Avatar name={c.name}/>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400 truncate">{c.company}</div>
                </div>
                <Badge stage={c.stage}/>
                <div className="text-sm font-bold text-gray-700">{fmx(c.value)}</div>
              </div>
            ))}
            {recent.length===0&&<div className="text-center py-8 text-gray-400 text-sm">Aún no hay clientes.</div>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:"Prospectos",  sub:"Buscar por sector",       icon:Search,    view:"prospectos",  color:"bg-purple-50 text-purple-700 border-purple-200"},
          {label:"Agente IA",   sub:"Redactar con inteligencia",icon:Sparkles,  view:"agente",      color:"bg-indigo-50 text-indigo-700 border-indigo-200"},
          {label:"Robots",      sub:"Control de unidades",     icon:Bot,       view:"robots",      color:"bg-violet-50 text-violet-700 border-violet-200"},
          {label:"Facturación", sub:"Facturas y cobros",       icon:FileText,  view:"facturacion", color:"bg-teal-50 text-teal-700 border-teal-200"},
        ].map(({label,sub,icon:Icon,view:v,color})=>(
          <button key={v} onClick={()=>setView(v)} className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${color} hover:shadow-md transition-all text-left`}>
            <Icon size={22}/>
            <div><div className="font-semibold text-sm">{label}</div><div className="text-xs opacity-70">{sub}</div></div>
            <ArrowRight size={15} className="ml-auto opacity-40"/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CLIENTS VIEW ─────────────────────────────────────────────────────────────
function ClientsView({ clients, onAdd, onEdit, onDelete, onMove }) {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("Todos");
  const filtered=clients.filter(c=>{
    const q=search.toLowerCase();
    return((c.name||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)||(c.company||"").toLowerCase().includes(q)||(c.phone||"").includes(q))
      &&(filter==="Todos"||c.stage===filter);
  });
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">Clientes</h1><p className="text-gray-500 mt-1">{clients.length} contactos</p></div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm"><Plus size={18}/>Agregar cliente</button>
      </div>
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-4 top-3.5 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Todos",...STAGES].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`px-4 py-3 rounded-xl text-xs font-semibold border ${filter===s?"bg-indigo-600 text-white border-indigo-600":"bg-white text-gray-600 border-gray-200"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Cliente","Empresa","Contacto","Etapa","Valor","Notas","Acciones"].map(h=>(
                  <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c=>(
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name}/>
                      <div><div className="font-semibold text-sm text-gray-900">{c.name}</div><div className="text-xs text-gray-400">{c.email}</div></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{c.company}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {c.phone&&<a href={`https://wa.me/52${c.phone}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"><MessageCircle size={14}/></a>}
                      {c.email&&<a href={`mailto:${c.email}`} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Mail size={14}/></a>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select value={c.stage} onChange={e=>onMove(c.id,e.target.value)}
                      className="text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer focus:outline-none"
                      style={{backgroundColor:STAGE_META[c.stage]?.bg,color:STAGE_META[c.stage]?.color}}>
                      {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-700">{fmx(c.value)}</td>
                  <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">{c.notes||"—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={()=>onEdit(c)} className="w-8 h-8 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center"><Edit2 size={14}/></button>
                      <button onClick={()=>onDelete(c.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-16 text-gray-400"><Users size={48} className="mx-auto mb-3 opacity-30"/><p>No se encontraron clientes</p></div>}
        </div>
      </div>
    </div>
  );
}

// ─── PIPELINE VIEW ────────────────────────────────────────────────────────────
function PipelineView({ clients, onMove, onEdit }) {
  return (
    <div className="p-8 flex flex-col" style={{height:"calc(100vh - 0px)"}}>
      <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Pipeline</h1><p className="text-gray-500 mt-1">Gestiona el avance de cada oportunidad</p></div>
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {STAGES.filter(s=>s!=="Perdido").map(stage=>{
          const sc=clients.filter(c=>c.stage===stage);
          const total=sc.reduce((s,c)=>s+(c.value||0),0);
          const meta=STAGE_META[stage];
          return (
            <div key={stage} className="flex-shrink-0 w-64 flex flex-col">
              <div className="rounded-2xl p-4 mb-3" style={{backgroundColor:meta.bg}}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase" style={{color:meta.color}}>{stage}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white" style={{color:meta.color}}>{sc.length}</span>
                </div>
                <div className="text-sm font-bold text-gray-700">{fmx(total)}</div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {sc.map(c=>(
                  <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={c.name} size={7}/>
                      <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{c.name}</div><div className="text-xs text-gray-400 truncate">{c.company}</div></div>
                    </div>
                    <div className="text-base font-bold mb-2">{fmx(c.value)}</div>
                    {c.notes&&<p className="text-xs text-gray-500 mb-2 line-clamp-2">{c.notes}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {STAGES.filter(s=>s!==stage).slice(0,3).map(s=>(
                        <button key={s} onClick={()=>onMove(c.id,s)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600">→ {s}</button>
                      ))}
                    </div>
                    <button onClick={()=>onEdit(c)} className="mt-2 w-full text-xs text-indigo-600 font-medium py-1 flex items-center justify-center gap-1"><Edit2 size={12}/>Editar</button>
                  </div>
                ))}
                {sc.length===0&&<div className="text-center py-8 text-gray-300 text-xs border-2 border-dashed border-gray-200 rounded-xl">Sin clientes</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROSPECTOS VIEW ──────────────────────────────────────────────────────────
function ProspectosView({ prospects, onAdd, onDelete, onConvert }) {
  const [search,setSearch]=useState("");
  const [sector,setSector]=useState("todos");
  const [showAdd,setShowAdd]=useState(false);
  const [csvText,setCsvText]=useState("");
  const [showCsv,setShowCsv]=useState(false);
  const [form,setForm]=useState({name:"",company:"",email:"",phone:"",sector:"corp",city:"",source:"manual"});

  const filtered=prospects.filter(p=>{
    const q=search.toLowerCase();
    return((p.name||"").toLowerCase().includes(q)||(p.company||"").toLowerCase().includes(q)||(p.email||"").toLowerCase().includes(q))
      &&(sector==="todos"||p.sector===sector);
  });

  const sectorCounts=SECTORS.map(s=>({...s,count:prospects.filter(p=>p.sector===s.id).length}));

  const handleCsvImport=()=>{
    const rows=csvText.trim().split("\n").slice(1);
    const imported=rows.map(row=>{
      const [name,company,email,phone,sectorId,city]=(row||"").split(",").map(s=>s.trim().replace(/"/g,""));
      return{name:name||"",company:company||"",email:email||"",phone:phone||"",sector:sectorId||"corp",city:city||"",source:"csv",created:new Date().toISOString()};
    }).filter(p=>p.name||p.email);
    imported.forEach(p=>onAdd(p));
    setShowCsv(false);setCsvText("");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Prospectos</h1><p className="text-gray-500 mt-1">{prospects.length} prospectos · Búsqueda por sector</p></div>
        <div className="flex gap-3">
          <button onClick={()=>setShowCsv(true)} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"><Upload size={16}/>Importar CSV</button>
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-sm"><Plus size={18}/>Agregar prospecto</button>
        </div>
      </div>

      {/* Sector grid */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <button onClick={()=>setSector("todos")} className={`p-3 rounded-xl border-2 text-xs font-semibold text-center transition-all ${sector==="todos"?"border-purple-500 bg-purple-50 text-purple-700":"border-gray-200 text-gray-600"}`}>
          <Globe size={18} className="mx-auto mb-1"/>Todos ({prospects.length})
        </button>
        {sectorCounts.map(s=>{
          const Icon=s.icon;
          return(
            <button key={s.id} onClick={()=>setSector(s.id)} className={`p-3 rounded-xl border-2 text-xs font-semibold text-center transition-all ${sector===s.id?"border-purple-500 bg-purple-50 text-purple-700":"border-gray-200 text-gray-600"}`}>
              <Icon size={18} className="mx-auto mb-1"/>{s.label.split("/")[0].trim()} ({s.count})
            </button>
          );
        })}
      </div>

      {/* Hunter.io / Apollo banner */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"><Search size={18} className="text-white"/></div>
          <div className="flex-1">
            <h4 className="font-bold text-purple-900 mb-1">🔍 Búsqueda automatizada de prospectos</h4>
            <p className="text-xs text-purple-700 mb-3">Conecta tu API de Hunter.io o Apollo para buscar emails de empresas por sector automáticamente.</p>
            <div className="flex gap-3 flex-wrap">
              <a href="https://hunter.io" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50"><ExternalLink size={12}/>Hunter.io</a>
              <a href="https://apollo.io" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50"><ExternalLink size={12}/>Apollo.io</a>
              <span className="text-xs text-purple-600 flex items-center gap-1"><Check size={12}/>Importa tu lista CSV con nombre, empresa, email, teléfono, sector, ciudad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-3.5 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, empresa o email..."
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"/>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Prospecto","Empresa","Contacto","Sector","Ciudad","Fuente","Acciones"].map(h=>(
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p=>{
              const sec=SECTORS.find(s=>s.id===p.sector);
              return(
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name||p.company||"?"}/>
                      <div><div className="font-semibold text-sm text-gray-900">{p.name}</div><div className="text-xs text-gray-400">{p.email}</div></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 font-medium">{p.company||"—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {p.phone&&<a href={`https://wa.me/52${p.phone}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"><MessageCircle size={14}/></a>}
                      {p.email&&<a href={`mailto:${p.email}`} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Mail size={14}/></a>}
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${sec?.color||"bg-gray-100 text-gray-700"}`}>{sec?.label||p.sector}</span></td>
                  <td className="px-5 py-4 text-sm text-gray-500">{p.city||"—"}</td>
                  <td className="px-5 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{p.source||"manual"}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={()=>onConvert(p)} title="Convertir a cliente" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"><ArrowRight size={12}/>CRM</button>
                      <button onClick={()=>onDelete(p.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0&&<div className="text-center py-16 text-gray-400"><Search size={48} className="mx-auto mb-3 opacity-30"/><p>No se encontraron prospectos</p></div>}
      </div>

      {/* Add prospect modal */}
      {showAdd&&(
        <Modal title="Agregar Prospecto" onClose={()=>setShowAdd(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Juan Pérez"/>
            <Input label="Empresa" value={form.company} onChange={v=>setForm(f=>({...f,company:v}))} placeholder="Mi Empresa SA"/>
            <Input label="Email" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} placeholder="juan@empresa.com"/>
            <Input label="Teléfono" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="8112345678"/>
            <Select label="Sector" value={form.sector} onChange={v=>setForm(f=>({...f,sector:v}))}
              options={SECTORS.map(s=>({value:s.id,label:s.label}))}/>
            <Input label="Ciudad" value={form.city} onChange={v=>setForm(f=>({...f,city:v}))} placeholder="Monterrey"/>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancelar</button>
            <button onClick={()=>{onAdd({...form,source:"manual",created:new Date().toISOString()});setShowAdd(false);setForm({name:"",company:"",email:"",phone:"",sector:"corp",city:"",source:"manual"});}}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700">Agregar</button>
          </div>
        </Modal>
      )}

      {/* CSV import modal */}
      {showCsv&&(
        <Modal title="Importar CSV de Prospectos" onClose={()=>setShowCsv(false)} wide>
          <p className="text-sm text-gray-600 mb-3">Formato esperado (primera fila = encabezados):</p>
          <code className="block bg-gray-50 rounded-xl p-3 text-xs text-gray-700 mb-4 font-mono">nombre,empresa,email,telefono,sector,ciudad<br/>Juan Pérez,OXXO SA,juan@oxxo.com,8112345678,retail,Monterrey</code>
          <p className="text-xs text-gray-500 mb-3">Sectores válidos: {SECTORS.map(s=>s.id).join(", ")}</p>
          <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} rows={10}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Pega aquí tu CSV..."/>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>setShowCsv(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancelar</button>
            <button onClick={handleCsvImport} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700">Importar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── AGENTE IA ────────────────────────────────────────────────────────────────
function AgenteIAView({ clients, prospects }) {
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("anthropic_key")||"");
  const [showKey,setShowKey]=useState(false);
  const [mode,setMode]=useState("email");
  const [clientId,setClientId]=useState("");
  const [product,setProduct]=useState("renta_mens");
  const [extra,setExtra]=useState("");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);

  const allContacts=[...clients.map(c=>({...c,tipo:"cliente"})),...prospects.map(p=>({...p,tipo:"prospecto"}))];
  const selected=allContacts.find(c=>c.id===clientId);

  const saveKey=()=>{localStorage.setItem("anthropic_key",apiKey);alert("API key guardada ✓");};

  const generate=async()=>{
    if(!apiKey){alert("Ingresa tu API key de Anthropic primero");return;}
    if(!clientId){alert("Selecciona un contacto");return;}
    setLoading(true);setOutput("");
    const prod=BOTMATE_PRICING[product];
    const systemPrompt=`Eres un agente de ventas experto de BotMate, empresa que vende y renta robots autónomos de servicio al cliente en México. 
Tono: profesional, entusiasta, directo, en español.
Producto destacado: ${prod.label} (${fmx(prod.price)}).
Nunca menciones a la competencia. Usa datos específicos del contacto. Máximo 200 palabras para email, 80 para WhatsApp.`;
    const userPrompt=`Genera un ${mode==="email"?"correo electrónico completo con asunto":"mensaje de WhatsApp"} para:
- Nombre: ${selected.name||selected.company}
- Empresa: ${selected.company||"empresa"}
- Sector: ${SECTORS.find(s=>s.id===selected.sector)?.label||"corporativo"}
- Ciudad: ${selected.city||"México"}
- Contexto adicional: ${extra||"primera toma de contacto"}
Producto a ofrecer: ${prod.label} a ${fmx(prod.price)}.
${mode==="email"?"Incluye: Asunto, saludo, cuerpo y cierre con firma BotMate.":"Incluye solo el mensaje de WhatsApp listo para enviar."}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:[{role:"user",content:userPrompt}]})
      });
      const data=await res.json();
      setOutput(data.content?.[0]?.text||"Error al generar respuesta.");
    }catch(e){setOutput("Error: "+e.message);}
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"><Sparkles size={20} className="text-white"/></span>
          Agente IA de Ventas
        </h1>
        <p className="text-gray-500 mt-1">Redacta emails y mensajes personalizados con inteligencia artificial</p>
      </div>

      {/* API Key config */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Settings size={18} className="text-indigo-600"/>
          <span className="font-semibold text-indigo-900 text-sm">Configuración API de Anthropic Claude</span>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input type={showKey?"text":"password"} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-api03-..."
              className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"/>
            <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-2.5 text-gray-400">{showKey?<EyeOff size={16}/>:<Eye size={16}/>}</button>
          </div>
          <button onClick={saveKey} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Guardar</button>
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-4 py-2.5 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50"><ExternalLink size={14}/>Obtener key</a>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Configuración del mensaje</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de mensaje</label>
              <div className="grid grid-cols-2 gap-2">
                {[{id:"email",label:"📧 Email",},{id:"whatsapp",label:"💬 WhatsApp"}].map(m=>(
                  <button key={m.id} onClick={()=>setMode(m.id)} className={`py-2.5 rounded-xl text-sm font-semibold border-2 ${mode===m.id?"border-indigo-500 bg-indigo-50 text-indigo-700":"border-gray-200 text-gray-600"}`}>{m.label}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contacto</label>
              <select value={clientId} onChange={e=>setClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">— Seleccionar contacto —</option>
                <optgroup label="Clientes CRM">
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
                </optgroup>
                <optgroup label="Prospectos">
                  {prospects.map(p=><option key={p.id} value={p.id}>{p.name||p.company} – {p.sector}</option>)}
                </optgroup>
              </select>
            </div>

            {selected&&(
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1">
                <div className="font-semibold text-gray-800">{selected.name} · {selected.company}</div>
                <div className="text-gray-500">Sector: {SECTORS.find(s=>s.id===selected.sector)?.label||"—"}</div>
                {selected.email&&<div className="text-gray-500">✉ {selected.email}</div>}
                {selected.phone&&<div className="text-gray-500">📱 {selected.phone}</div>}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Producto / Servicio a ofrecer</label>
              <select value={product} onChange={e=>setProduct(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {Object.entries(BOTMATE_PRICING).map(([k,v])=>(
                  <option key={k} value={k}>{v.label} – {fmx(v.price)}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contexto adicional</label>
              <textarea value={extra} onChange={e=>setExtra(e.target.value)} rows={3} placeholder="Ej: ya vio demo, tiene presupuesto aprobado, competencia activa..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
            </div>

            <button onClick={generate} disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading?<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generando...</>:<><Sparkles size={16}/>Generar con IA</>}
            </button>
          </div>
        </div>

        {/* Output panel */}
        <div className="col-span-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Resultado generado</h3>
              {output&&(
                <div className="flex gap-2">
                  <button onClick={()=>navigator.clipboard.writeText(output)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200">Copiar</button>
                  {mode==="email"&&selected?.email&&(
                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent(output.split("\n")[0].replace(/^Asunto:\s*/i,""))}&body=${encodeURIComponent(output.split("\n").slice(2).join("\n"))}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600"><Mail size={12}/>Abrir en correo</a>
                  )}
                  {mode==="whatsapp"&&selected?.phone&&(
                    <a href={`https://wa.me/52${selected.phone}?text=${encodeURIComponent(output)}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600"><MessageCircle size={12}/>Enviar WA</a>
                  )}
                </div>
              )}
            </div>
            {output?(
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-4 min-h-64">{output}</pre>
            ):(
              <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                <Sparkles size={48} className="mb-3"/>
                <p className="text-sm">El mensaje generado aparecerá aquí</p>
                <p className="text-xs mt-1">Selecciona un contacto y haz clic en Generar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL VIEW ────────────────────────────────────────────────────────────────
function EmailView({ clients }) {
  const [selected,setSelected]=useState([]);
  const [template,setTemplate]=useState(EMAIL_TEMPLATES[0]);
  const [subject,setSubject]=useState(EMAIL_TEMPLATES[0].subject);
  const [body,setBody]=useState(EMAIL_TEMPLATES[0].body);
  const [vendedor,setVendedor]=useState("tu nombre");
  const [search,setSearch]=useState("");
  const [sent,setSent]=useState({});
  const [pdfNote,setPdfNote]=useState("");
  const toggle=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const filtered=clients.filter(c=>(c.name||"").toLowerCase().includes(search.toLowerCase())||(c.company||"").toLowerCase().includes(search.toLowerCase()));
  const fill=(c)=>({
    s:subject.replace(/\{nombre\}/gi,c.name?.split(" ")[0]||"").replace(/\{empresa\}/gi,c.company||"").replace(/\{vendedor\}/gi,vendedor),
    b:(body+(pdfNote?`\n\nPD: ${pdfNote}`:"")+`\n\n---\n${vendedor} · BotMate`).replace(/\{nombre\}/gi,c.name?.split(" ")[0]||"").replace(/\{empresa\}/gi,c.company||"").replace(/\{vendedor\}/gi,vendedor)
  });
  const openEmail=(c)=>{const{s,b}=fill(c);window.open(`mailto:${c.email}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`);setSent(st=>({...st,[c.id]:true}));};
  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><span className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"><Mail size={22} className="text-white"/></span>Email Marketing</h1><p className="text-gray-500 mt-1">Campañas personalizadas BotMate</p></div>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{maxHeight:"680px"}}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3"><Search size={15} className="absolute left-3 top-3 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/></div>
            <div className="flex gap-2">
              <button onClick={()=>setSelected(clients.filter(c=>c.email).map(c=>c.id))} className="flex-1 text-xs py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold">Todos</button>
              <button onClick={()=>setSelected([])} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-50 text-gray-600 font-semibold">Limpiar</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(c=>(
              <div key={c.id} onClick={()=>c.email&&toggle(c.id)} className={`flex items-center gap-3 px-4 py-3 ${c.email?"cursor-pointer hover:bg-gray-50":"opacity-40"} ${selected.includes(c.id)?"bg-blue-50":""}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.includes(c.id)?"border-blue-500 bg-blue-500":"border-gray-300"}`}>{selected.includes(c.id)&&<Check size={11} className="text-white"/>}</div>
                <Avatar name={c.name} size={8}/>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{c.name}</div><div className="text-xs text-gray-400 truncate">{c.email||"Sin email"}</div></div>
                {sent[c.id]&&<CheckCircle size={14} className="text-blue-500"/>}
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-xs text-gray-500">{selected.length} seleccionados</div>
        </div>
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tu nombre / Firma</label>
            <input value={vendedor} onChange={e=>setVendedor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-sm font-semibold text-gray-700 mb-3">Plantillas BotMate</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EMAIL_TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>{setTemplate(t);setSubject(t.subject);setBody(t.body);}}
                  className={`p-3 rounded-xl border-2 text-xs font-medium text-left ${template.id===t.id?"border-blue-500 bg-blue-50":"border-gray-200"}`}>
                  <div className="text-lg mb-1">{t.icon}</div>{t.name}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Asunto</label><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Cuerpo</label><textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"/></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">📎 Nota sobre PDF adjunto (opcional)</label>
                <input value={pdfNote} onChange={e=>setPdfNote(e.target.value)} placeholder="Ej: Adjunto el catálogo de productos BotMate 2025." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <p className="text-xs text-gray-400 mt-1">Adjunta manualmente el PDF desde tu cliente de correo al enviar.</p>
              </div>
            </div>
          </div>
          {selected.length>0&&(
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-3">Enviar emails ({selected.length})</div>
              <div className="space-y-2">
                {clients.filter(c=>selected.includes(c.id)).map(c=>(
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <Avatar name={c.name} size={8}/>
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{c.name}</div><div className="text-xs text-gray-400 truncate">{c.email}</div></div>
                    <button onClick={()=>openEmail(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${sent[c.id]?"bg-blue-100 text-blue-700":"bg-blue-500 text-white hover:bg-blue-600"}`}>
                      {sent[c.id]?<><Check size={12}/>Enviado</>:<><Send size={12}/>Enviar</>}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><ExternalLink size={11}/>Se abrirá tu cliente de correo. Adjunta el PDF antes de enviar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WHATSAPP VIEW ────────────────────────────────────────────────────────────
function WhatsAppView({ clients }) {
  const [selected,setSelected]=useState([]);
  const [template,setTemplate]=useState(WA_TEMPLATES[0]);
  const [customMsg,setCustomMsg]=useState(WA_TEMPLATES[0].text);
  const [vendedor,setVendedor]=useState("tu nombre");
  const [search,setSearch]=useState("");
  const [sent,setSent]=useState({});
  const toggle=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const filtered=clients.filter(c=>(c.name||"").toLowerCase().includes(search.toLowerCase())||(c.company||"").toLowerCase().includes(search.toLowerCase()));
  const buildMsg=(c)=>customMsg.replace(/\{nombre\}/gi,c.name?.split(" ")[0]||"").replace(/\{empresa\}/gi,c.company||"").replace(/\{vendedor\}/gi,vendedor);
  const openWA=(c)=>{window.open(`https://wa.me/52${(c.phone||"").replace(/\D/g,"")}?text=${encodeURIComponent(buildMsg(c))}`,"_blank");setSent(s=>({...s,[c.id]:true}));};
  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><span className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center"><MessageCircle size={22} className="text-white"/></span>WhatsApp</h1><p className="text-gray-500 mt-1">Mensajes personalizados BotMate</p></div>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{maxHeight:"600px"}}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3"><Search size={15} className="absolute left-3 top-3 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none"/></div>
            <div className="flex gap-2">
              <button onClick={()=>setSelected(clients.map(c=>c.id))} className="flex-1 text-xs py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold">Todos</button>
              <button onClick={()=>setSelected([])} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-50 text-gray-600 font-semibold">Limpiar</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(c=>(
              <div key={c.id} onClick={()=>toggle(c.id)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${selected.includes(c.id)?"bg-green-50":""}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.includes(c.id)?"border-green-500 bg-green-500":"border-gray-300"}`}>{selected.includes(c.id)&&<Check size={11} className="text-white"/>}</div>
                <Avatar name={c.name} size={8}/>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{c.name}</div><div className="text-xs text-gray-400">{c.phone}</div></div>
                {sent[c.id]&&<CheckCircle size={14} className="text-green-500"/>}
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-xs text-gray-500">{selected.length} seleccionados</div>
        </div>
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tu nombre</label>
            <input value={vendedor} onChange={e=>setVendedor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-sm font-semibold text-gray-700 mb-3">Plantillas</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {WA_TEMPLATES.map(t=>(
                <button key={t.id} onClick={()=>{setTemplate(t);setCustomMsg(t.text);}} className={`p-3 rounded-xl border-2 text-xs font-medium text-left ${template.id===t.id?"border-green-500 bg-green-50":"border-gray-200"}`}><div className="text-lg mb-1">{t.icon}</div>{t.name}</button>
              ))}
            </div>
            <textarea value={customMsg} onChange={e=>setCustomMsg(e.target.value)} rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"/>
            <p className="text-xs text-gray-400 mt-1">Variables: <code className="bg-gray-100 px-1 rounded">{"{nombre}"}</code> <code className="bg-gray-100 px-1 rounded">{"{empresa}"}</code> <code className="bg-gray-100 px-1 rounded">{"{vendedor}"}</code></p>
          </div>
          {selected.length>0&&(
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-sm font-semibold text-gray-700 mb-3">Enviar</div>
              <div className="space-y-2">
                {clients.filter(c=>selected.includes(c.id)).map(c=>(
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <Avatar name={c.name} size={8}/>
                    <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{c.name}</div><div className="text-xs text-gray-400 truncate">{buildMsg(c).substring(0,50)}...</div></div>
                    <button onClick={()=>openWA(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sent[c.id]?"bg-green-100 text-green-700":"bg-green-500 text-white hover:bg-green-600"}`}>{sent[c.id]?"✓ Listo":"Enviar"}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROBOTS VIEW ──────────────────────────────────────────────────────────────
function RobotsView({ robots, rentals, clients, onAddRobot, onEditRobot, onDeleteRobot, onAddRental, onUpdateRental }) {
  const [tab,setTab]=useState("robots");
  const [showRobotModal,setShowRobotModal]=useState(false);
  const [showRentalModal,setShowRentalModal]=useState(false);
  const [editingRobot,setEditingRobot]=useState(null);
  const [robotForm,setRobotForm]=useState({serial:"",model:"BotMate CC1",status:"Disponible",location:"",notes:""});
  const [rentalForm,setRentalForm]=useState({robotId:"",clientId:"",type:"mensual",startDate:"",endDate:"",amount:"",status:"Activa",notes:""});

  const statusColors={Disponible:"bg-emerald-100 text-emerald-700",Rentado:"bg-blue-100 text-blue-700",Mantenimiento:"bg-amber-100 text-amber-700",Baja:"bg-red-100 text-red-700"};
  const rentalStatusColors={Activa:"bg-green-100 text-green-700",Finalizada:"bg-gray-100 text-gray-700",Cancelada:"bg-red-100 text-red-700"};

  const robotStats={
    total:robots.length,
    disponibles:robots.filter(r=>r.status==="Disponible").length,
    rentados:robots.filter(r=>r.status==="Rentado").length,
    mantenimiento:robots.filter(r=>r.status==="Mantenimiento").length,
  };
  const activeRentals=rentals.filter(r=>r.status==="Activa");
  const totalRentalRevenue=rentals.filter(r=>r.status!=="Cancelada").reduce((s,r)=>s+(r.amount||0),0);

  const saveRobot=()=>{
    if(editingRobot){onEditRobot({...editingRobot,...robotForm});}
    else{onAddRobot(robotForm);}
    setShowRobotModal(false);setEditingRobot(null);setRobotForm({serial:"",model:"BotMate CC1",status:"Disponible",location:"",notes:""});
  };

  const saveRental=()=>{
    const rt=RENTAL_TYPES.find(r=>r.id===rentalForm.type);
    const amount=rentalForm.amount||(rt?.price||0);
    onAddRental({...rentalForm,amount:parseFloat(amount)||0,created:new Date().toISOString()});
    if(rentalForm.robotId){onEditRobot({...robots.find(r=>r.id===rentalForm.robotId),status:"Rentado"});}
    setShowRentalModal(false);setRentalForm({robotId:"",clientId:"",type:"mensual",startDate:"",endDate:"",amount:"",status:"Activa",notes:""});
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><span className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center"><Bot size={20} className="text-white"/></span>Control de Robots</h1><p className="text-gray-500 mt-1">Gestión de unidades, rentas y contratos</p></div>
        <div className="flex gap-3">
          <button onClick={()=>{setEditingRobot(null);setShowRobotModal(true);}} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50"><Plus size={16}/>Agregar Robot</button>
          <button onClick={()=>setShowRentalModal(true)} className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-sm"><Calendar size={16}/>Nueva Renta</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          {label:"Total Robots",     value:robotStats.total,         color:"bg-violet-500"},
          {label:"Disponibles",      value:robotStats.disponibles,   color:"bg-emerald-500"},
          {label:"Rentados",         value:robotStats.rentados,      color:"bg-blue-500"},
          {label:"Mantenimiento",    value:robotStats.mantenimiento, color:"bg-amber-500"},
          {label:"Ingresos Rentas",  value:fmx(totalRentalRevenue),  color:"bg-teal-500"},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-2 h-2 rounded-full ${color} mb-2`}/>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{id:"robots",label:`Unidades (${robots.length})`},{id:"rentas",label:`Rentas (${rentals.length})`},{id:"activas",label:`Activas (${activeRentals.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${tab===t.id?"bg-violet-600 text-white":"bg-white text-gray-600 border border-gray-200"}`}>{t.label}</button>
        ))}
      </div>

      {/* Robots table */}
      {tab==="robots"&&(
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b"><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Robot</th><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Serial</th><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Ubicación</th><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Notas</th><th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Acciones</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {robots.map(r=>(
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center"><Bot size={18} className="text-violet-600"/></div><span className="font-semibold text-sm">{r.model}</span></div></td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-600">{r.serial||"—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{r.location||"—"}</td>
                  <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[r.status]||"bg-gray-100 text-gray-700"}`}>{r.status}</span></td>
                  <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">{r.notes||"—"}</td>
                  <td className="px-5 py-4"><div className="flex gap-2">
                    <button onClick={()=>{setEditingRobot(r);setRobotForm({serial:r.serial||"",model:r.model,status:r.status,location:r.location||"",notes:r.notes||""});setShowRobotModal(true);}} className="w-8 h-8 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center"><Edit2 size={14}/></button>
                    <button onClick={()=>onDeleteRobot(r.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center"><Trash2 size={14}/></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {robots.length===0&&<div className="text-center py-16 text-gray-400"><Bot size={48} className="mx-auto mb-3 opacity-30"/><p>No hay robots registrados</p></div>}
        </div>
      )}

      {/* Rentals table */}
      {(tab==="rentas"||tab==="activas")&&(
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b">
              {["Robot","Cliente","Tipo","Inicio","Fin","Monto","Estado","Acciones"].map(h=><th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(tab==="activas"?activeRentals:rentals).map(r=>{
                const robot=robots.find(rb=>rb.id===r.robotId);
                const client=clients.find(c=>c.id===r.clientId);
                return(
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-semibold">{robot?.model||"—"}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{client?.name||"—"}<div className="text-xs text-gray-400">{client?.company}</div></td>
                    <td className="px-5 py-4"><span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">{RENTAL_TYPES.find(t=>t.id===r.type)?.label||r.type}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-600">{fdate(r.startDate)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{fdate(r.endDate)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-800">{fmx(r.amount)}</td>
                    <td className="px-5 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${rentalStatusColors[r.status]||"bg-gray-100 text-gray-700"}`}>{r.status}</span></td>
                    <td className="px-5 py-4">
                      {r.status==="Activa"&&<button onClick={()=>onUpdateRental(r.id,{status:"Finalizada"})} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Finalizar</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(tab==="activas"?activeRentals:rentals).length===0&&<div className="text-center py-16 text-gray-400"><Calendar size={48} className="mx-auto mb-3 opacity-30"/><p>No hay rentas registradas</p></div>}
        </div>
      )}

      {/* Robot modal */}
      {showRobotModal&&(
        <Modal title={editingRobot?"Editar Robot":"Agregar Robot"} onClose={()=>{setShowRobotModal(false);setEditingRobot(null);}}>
          <div className="space-y-4">
            <Input label="Número de Serie" value={robotForm.serial} onChange={v=>setRobotForm(f=>({...f,serial:v}))} placeholder="BM-CC1-001"/>
            <Select label="Modelo" value={robotForm.model} onChange={v=>setRobotForm(f=>({...f,model:v}))} options={ROBOT_MODELS}/>
            <Select label="Estado" value={robotForm.status} onChange={v=>setRobotForm(f=>({...f,status:v}))} options={ROBOT_STATUS}/>
            <Input label="Ubicación actual" value={robotForm.location} onChange={v=>setRobotForm(f=>({...f,location:v}))} placeholder="Cliente o almacén"/>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notas</label><textarea value={robotForm.notes} onChange={e=>setRobotForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"/></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>{setShowRobotModal(false);setEditingRobot(null);}} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancelar</button>
            <button onClick={saveRobot} className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700">{editingRobot?"Guardar":"Agregar"}</button>
          </div>
        </Modal>
      )}

      {/* Rental modal */}
      {showRentalModal&&(
        <Modal title="Registrar Renta" onClose={()=>setShowRentalModal(false)} wide>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Robot" value={rentalForm.robotId} onChange={v=>setRentalForm(f=>({...f,robotId:v}))}
              options={[{value:"",label:"— Seleccionar robot —"},...robots.map(r=>({value:r.id,label:`${r.model} – ${r.serial}`}))]}/>
            <Select label="Cliente" value={rentalForm.clientId} onChange={v=>setRentalForm(f=>({...f,clientId:v}))}
              options={[{value:"",label:"— Seleccionar cliente —"},...clients.map(c=>({value:c.id,label:`${c.name} – ${c.company}`}))]}/>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de renta</label>
              <div className="grid grid-cols-4 gap-2">
                {RENTAL_TYPES.map(t=>(
                  <button key={t.id} type="button" onClick={()=>setRentalForm(f=>({...f,type:t.id,amount:t.price||""}))}
                    className={`p-3 rounded-xl border-2 text-xs font-semibold text-center ${rentalForm.type===t.id?"border-violet-500 bg-violet-50 text-violet-700":"border-gray-200 text-gray-600"}`}>
                    {t.label}<div className="font-bold text-sm mt-1">{t.price?fmx(t.price):"—"}</div>
                  </button>
                ))}
              </div>
            </div>
            <Input label="Fecha inicio" type="date" value={rentalForm.startDate} onChange={v=>setRentalForm(f=>({...f,startDate:v}))}/>
            <Input label="Fecha fin" type="date" value={rentalForm.endDate} onChange={v=>setRentalForm(f=>({...f,endDate:v}))}/>
            <Input label="Monto (MXN)" type="number" value={rentalForm.amount} onChange={v=>setRentalForm(f=>({...f,amount:v}))} placeholder="25000"/>
            <Select label="Estado" value={rentalForm.status} onChange={v=>setRentalForm(f=>({...f,status:v}))} options={["Activa","Finalizada","Cancelada"]}/>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notas / Contrato</label><textarea value={rentalForm.notes} onChange={e=>setRentalForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" placeholder="Número de contrato, condiciones especiales..."/></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>setShowRentalModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm">Cancelar</button>
            <button onClick={saveRental} className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700">Registrar Renta</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── FACTURACIÓN VIEW ─────────────────────────────────────────────────────────
function FacturacionView({ invoices, clients, onAdd, onUpdate, onDelete }) {
  const MESES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  const emptyForm = {
    clientId:"", folio:"",
    date: new Date().toISOString().split("T")[0],
    periodoInicio:"", periodoFin:"",
    periodoNombre: MESES[new Date().getMonth()],
    conceptoFactura:"", planPod:"", planCliente:"",
    rubroFactura:"Operación CDMX",
    includeIva: true,
    items:[{desc:"",qty:1,price:0,dias:1}],
    notes:"", status:"Pendiente",
    approvalStatus:"Pendiente"
  };
  const [showModal, setShowModal] = useState(false);
  const [filter,    setFilter]    = useState("Todas");
  const [form,      setForm]      = useState(emptyForm);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const addItem    = () => setForm(f=>({...f, items:[...f.items,{desc:"",qty:1,price:0}]}));
  const setItem    = (i,k,v) => setForm(f=>({...f, items:f.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));
  const removeItem = (i) => setForm(f=>({...f, items:f.items.filter((_,idx)=>idx!==i)}));

  const getSubtotal = (items) => items.reduce((s,i)=>s+(parseFloat(i.qty)||0)*(parseFloat(i.dias)||1)*(parseFloat(i.price)||0), 0);
  const getIva      = (sub)   => form.includeIva ? sub * IVA_RATE : 0;
  const getTotal    = (items) => { const sub=getSubtotal(items); return sub + getIva(sub); };

  const filtered = invoices.filter(inv => filter==="Todas" || inv.status===filter);
  const totals = {
    pendiente: invoices.filter(i=>i.status==="Pendiente").reduce((s,i)=>s+(i.total||0),0),
    pagada:    invoices.filter(i=>i.status==="Pagada").reduce((s,i)=>s+(i.total||0),0),
    cancelada: invoices.filter(i=>i.status==="Cancelada").reduce((s,i)=>s+(i.total||0),0),
  };
  const statusColors = {
    Pendiente:"bg-amber-100 text-amber-700",
    Pagada:"bg-emerald-100 text-emerald-700",
    Cancelada:"bg-red-100 text-red-700"
  };

  const saveInvoice = () => {
    if(!form.clientId){ alert("Selecciona un cliente"); return; }
    const sub   = getSubtotal(form.items);
    const iva   = getIva(sub);
    const total = sub + iva;
    const client= clients.find(c=>c.id===form.clientId);
    const folio = form.folio || `BM-${Date.now().toString().slice(-6)}`;
    onAdd({
      ...form, folio, subtotal:sub, iva, total,
      clientName: client?.name||"",
      clientCompany: client?.company||"",
      clientEmail: client?.email||"",
      conceptoFactura: form.conceptoFactura,
      planPod: form.planPod,
      planCliente: form.planCliente,
      periodoNombre: form.periodoNombre,
      rubroFactura: form.rubroFactura,
      approvalStatus: form.approvalStatus,
      created: new Date().toISOString()
    });
    setShowModal(false);
    setForm(emptyForm);
  };

  const downloadExcel = (inv) => {
    const client = clients.find(c=>c.id===inv.clientId);
    const clientCompany = inv.clientCompany || client?.company || "";
    const clientName = client?.name || inv.clientName || "CLIENTE";
    const empresa = clientCompany || clientName;
    const items = inv.items || [{desc:"Servicio",qty:1,price:inv.subtotal||inv.total||0}];
    const commonParams = {
      concepto: inv.conceptoFactura || items[0]?.desc || "SERVICIO BOTMATE",
      planPod: inv.planPod || "",
      planCliente: inv.planCliente || "",
      periodoInicio: inv.periodoInicio || "",
      periodoFin: inv.periodoFin || "",
      mesElaboracion: inv.periodoNombre || "",
      rubro: inv.rubroFactura || "Operación CDMX",
      clientName,
      clientCompany,
      folio: inv.folio,
    };
    if(items.length === 1) {
      generateInvoiceExcel({
        ...commonParams,
        descripcionServicio: items[0].desc || "",
        cantidad: parseFloat(items[0].qty) || 1,
        dias: parseFloat(items[0].dias) || 1,
        unitario: parseFloat(items[0].price) || 0,
      });
    } else {
      generateInvoiceExcelMultiItem({
        ...commonParams,
        items: items.map(it => ({
          rubro: inv.rubroFactura || "Operación",
          descripcion: it.desc || "",
          cantidad: parseFloat(it.qty) || 1,
          dias: parseFloat(it.dias) || 1,
          unitario: parseFloat(it.price) || 0,
        })),
      });
    }
  };

  const printInvoice = (inv) => {
    const client  = clients.find(c=>c.id===inv.clientId);
    const sub     = inv.subtotal ?? inv.total;
    const iva     = inv.iva ?? 0;
    const total   = inv.total ?? 0;
    const mx      = (n) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n||0);
    const fdateLong = (d) => d ? new Date(d+"T12:00:00").toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"}) : "—";
    const statusBg  = inv.status==="Pagada"?"#d1fae5;color:#065f46":inv.status==="Pendiente"?"#fef3c7;color:#92400e":"#fee2e2;color:#991b1b";
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Factura ${inv.folio}</title>
<style>
  *{box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:44px;max-width:760px;margin:0 auto;color:#1a1a1a;font-size:14px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #0f766e;margin-bottom:24px;}
  .logo{font-size:26px;font-weight:900;color:#0f766e;letter-spacing:-1px;}
  .logo span{color:#1a1a1a;}
  .inv-title{text-align:right;}
  .inv-title h1{font-size:28px;font-weight:800;margin:0;color:#1a1a1a;letter-spacing:-1px;}
  .inv-title .folio{font-size:17px;font-weight:700;color:#0f766e;margin:3px 0;}
  .status-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${statusBg};}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px;}
  .meta-box{background:#f8fafc;border-radius:10px;padding:14px 16px;}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;margin-bottom:6px;}
  .meta-value{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px;}
  .meta-sub{font-size:12px;color:#64748b;}
  .plan-badge{display:inline-block;background:#ccfbf1;color:#0f766e;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-top:4px;}
  table{width:100%;border-collapse:collapse;margin:18px 0;}
  thead tr{background:#f1f5f9;}
  th{padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#475569;font-weight:700;}
  td{padding:11px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1a1a1a;}
  tr:last-child td{border-bottom:none;}
  .text-right{text-align:right;}
  .text-center{text-align:center;}
  .totals-box{margin-left:auto;width:280px;background:#f8fafc;border-radius:10px;padding:16px;}
  .totals-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#475569;}
  .totals-row.total-final{font-size:17px;font-weight:800;color:#0f766e;border-top:2px solid #ccfbf1;margin-top:8px;padding-top:10px;}
  .totals-row.iva-row{color:#64748b;font-size:12px;}
  .notes-box{background:#f8fafc;border-radius:10px;padding:14px 16px;margin-top:18px;font-size:13px;color:#475569;}
  .footer{margin-top:36px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;}
  @media print{body{padding:24px;}button{display:none;}}
</style>
</head><body>
<div class="header">
  <div>
    <div class="logo">⚡ Bot<span>Mate</span></div>
    <div style="font-size:12px;color:#64748b;margin-top:3px">salesflow-crm.vercel.app</div>
  </div>
  <div class="inv-title">
    <h1>FACTURA</h1>
    <div class="folio">${inv.folio}</div>
    ${inv.numeroFactura?`<div style="font-size:12px;color:#64748b;margin-top:2px">No. Fiscal: <b>${inv.numeroFactura}</b></div>`:""}
    <div style="margin-top:8px"><span class="status-badge">${inv.status}</span></div>
  </div>
</div>

<div class="meta-grid">
  <div class="meta-box">
    <div class="meta-label">Cliente</div>
    <div class="meta-value">${inv.clientName||client?.name||"—"}</div>
    <div class="meta-sub">${inv.clientCompany||client?.company||""}</div>
    ${(inv.clientEmail||client?.email)?`<div class="meta-sub">${inv.clientEmail||client?.email}</div>`:""}
  </div>
  <div class="meta-box">
    <div class="meta-label">Detalles de factura</div>
    <div class="meta-value">Fecha: ${fdateLong(inv.date)}</div>
    ${(inv.periodoInicio&&inv.periodoFin)?`<div class="meta-sub">Período: ${fdateLong(inv.periodoInicio)} al ${fdateLong(inv.periodoFin)}</div>`:""}
    ${inv.planLabel?`<div style="margin-top:6px"><span class="plan-badge">📦 ${inv.planLabel}</span></div>`:""}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:50%">Descripción</th>
      <th class="text-center" style="width:10%">Cant.</th>
      <th class="text-right" style="width:20%">Precio Unit.</th>
      <th class="text-right" style="width:20%">Importe</th>
    </tr>
  </thead>
  <tbody>
    ${(inv.items||[]).map((it,idx)=>`
    <tr style="background:${idx%2===0?"#ffffff":"#f8fafc"}">
      <td>${it.desc||"—"}</td>
      <td class="text-center">${it.qty}</td>
      <td class="text-right">${mx(it.price)}</td>
      <td class="text-right" style="font-weight:600">${mx((it.qty||0)*(it.price||0))}</td>
    </tr>`).join("")}
  </tbody>
</table>

<div class="totals-box">
  <div class="totals-row"><span>Subtotal</span><span>${mx(sub)}</span></div>
  <div class="totals-row iva-row"><span>IVA (16%)</span><span>${mx(iva)}</span></div>
  <div class="totals-row total-final"><span>TOTAL</span><span>${mx(total)}</span></div>
</div>

${inv.notes?`<div class="notes-box"><b>Notas:</b> ${inv.notes}</div>`:""}
<div class="footer">
  <p>BotMate · Robots Autónomos de Servicio al Cliente</p>
  <p>Este documento es un comprobante de control interno. Para factura fiscal solicitar CFDI al SAT.</p>
</div>
</body></html>`);
    w.document.close();
    w.print();
  };

  // Live totals for form preview
  const liveSubtotal = getSubtotal(form.items);
  const liveIva      = form.includeIva ? liveSubtotal * IVA_RATE : 0;
  const liveTotal    = liveSubtotal + liveIva;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></span>
            Facturación
          </h1>
          <p className="text-gray-500 mt-1">Control de ingresos, planes y cobros</p>
        </div>
        <button onClick={()=>setShowModal(true)} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-sm">
          <Plus size={18}/>Nueva Factura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          {label:"Pendiente de cobro", value:fmx(totals.pendiente), color:"bg-amber-500",  sub:`${invoices.filter(i=>i.status==="Pendiente").length} facturas`},
          {label:"Total cobrado",      value:fmx(totals.pagada),    color:"bg-emerald-500", sub:`${invoices.filter(i=>i.status==="Pagada").length} facturas`},
          {label:"Cancelado",          value:fmx(totals.cancelada), color:"bg-red-400",    sub:`${invoices.filter(i=>i.status==="Cancelada").length} facturas`},
        ].map(({label,value,color,sub})=>(
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><DollarSign size={22} className="text-white"/></div>
            <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-sm text-gray-700">{label}</div><div className="text-xs text-gray-400">{sub}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {["Todas","Pendiente","Pagada","Cancelada"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${filter===s?"bg-teal-600 text-white":"bg-white text-gray-600 border border-gray-200"}`}>{s}</button>
        ))}
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                {["Folio","Cliente","Plan Cliente","Fecha","Período trabajo","Subtotal","IVA","Total","Aprobación","Estado","Acciones"].map(h=>(
                  <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inv=>{
                const client = clients.find(c=>c.id===inv.clientId);
                const sub    = inv.subtotal ?? inv.total;
                const iva    = inv.iva ?? 0;
                return(
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-bold text-teal-700">{inv.folio}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900">{inv.clientName||client?.name||"—"}</div>
                      <div className="text-xs text-gray-400">{inv.clientCompany||client?.company||""}</div>
                    </td>
                    <td className="px-4 py-4">
                      {inv.planCliente
                        ? <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">{inv.planCliente}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{fdate(inv.date||inv.created)}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {inv.periodoInicio&&inv.periodoFin
                        ? <><div>{fdate(inv.periodoInicio)}</div><div className="text-gray-300">↓</div><div>{fdate(inv.periodoFin)}</div></>
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{fmx(sub)}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{fmx(iva)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900">{fmx(inv.total)}</td>
                    <td className="px-4 py-4">
                      <select value={inv.approvalStatus||"Pendiente"} onChange={e=>onUpdate(inv.id,{approvalStatus:e.target.value})}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer focus:outline-none ${
                          inv.approvalStatus==="Aprobada"?"bg-emerald-100 text-emerald-700":
                          inv.approvalStatus==="Rechazada"?"bg-red-100 text-red-700":
                          "bg-amber-100 text-amber-700"
                        }`}>
                        {["Pendiente","Aprobada","Rechazada"].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select value={inv.status} onChange={e=>onUpdate(inv.id,{status:e.target.value})}
                        className={`text-xs font-semibold rounded-lg px-2 py-1 border-0 cursor-pointer focus:outline-none ${statusColors[inv.status]||"bg-gray-100 text-gray-700"}`}>
                        {["Pendiente","Pagada","Cancelada"].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={()=>downloadExcel(inv)} title="Descargar Excel para Contador" className="w-8 h-8 rounded-full hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 flex items-center justify-center"><Download size={14}/></button>
                        <button onClick={()=>printInvoice(inv)} title="Imprimir / PDF" className="w-8 h-8 rounded-full hover:bg-teal-50 text-gray-400 hover:text-teal-600 flex items-center justify-center"><Printer size={14}/></button>
                        <button onClick={()=>onDelete(inv.id)} className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-16 text-gray-400"><FileText size={48} className="mx-auto mb-3 opacity-30"/><p>No hay facturas registradas</p></div>}
        </div>
      </div>

      {/* ── Invoice modal ── */}
      {showModal&&(
        <Modal title="Nueva Factura" onClose={()=>{setShowModal(false);setForm(emptyForm);}} extraWide>

          {/* Row 1: Cliente + Folio */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <Select label="Cliente *" value={form.clientId} onChange={v=>set("clientId",v)} className="col-span-2"
              options={[{value:"",label:"— Seleccionar cliente —"},...clients.map(c=>({value:c.id,label:`${c.name} – ${c.company}`}))]}/>
            <Input label="Folio interno (auto)" value={form.folio} onChange={v=>set("folio",v)} placeholder="BM-2025-001"/>
          </div>

          {/* Row 2: Fecha + Período de trabajo + Mes de elaboración */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <Input label="Fecha de factura" type="date" value={form.date} onChange={v=>set("date",v)}/>
            <Input label="Período de trabajo — Inicio" type="date" value={form.periodoInicio} onChange={v=>set("periodoInicio",v)}/>
            <Input label="Período de trabajo — Fin" type="date" value={form.periodoFin} onChange={v=>set("periodoFin",v)}/>
            <Select label="Mes de elaboración (Excel)" value={form.periodoNombre} onChange={v=>set("periodoNombre",v)} options={MESES}/>
          </div>

          {/* Datos para formato del contador */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} className="text-emerald-600"/>
              <span className="text-sm font-bold text-emerald-800">Datos para Excel del Contador</span>
              <span className="text-xs text-emerald-500 ml-auto">Clave: 23153200 | PPD | G03</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Concepto de factura" value={form.conceptoFactura} onChange={v=>set("conceptoFactura",v)} placeholder="Ej: RENTA BOT SONY MUSIC"/>
              <Input label="Rubro presupuestal" value={form.rubroFactura} onChange={v=>set("rubroFactura",v)} placeholder="Operación CDMX"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Plan POD (fijo: 212802 pod robots)" value={form.planPod} onChange={v=>set("planPod",v)} placeholder="212802 pod robots"/>
              <Input label="Plan Cliente *" value={form.planCliente} onChange={v=>set("planCliente",v)} placeholder="Ej: P-213001 Walmart Robots"/>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Conceptos</label>
              <button onClick={addItem} className="text-xs text-teal-600 flex items-center gap-1 hover:underline"><Plus size={12}/>Agregar línea</button>
            </div>
            {/* Quick add from pricing */}
            <div className="flex gap-2 flex-wrap mb-3">
              {Object.entries(BOTMATE_PRICING).map(([k,v])=>(
                <button key={k} onClick={()=>setForm(f=>({...f,items:[...f.items,{desc:v.label,qty:1,price:v.price}]}))}
                  className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100 border border-teal-100">
                  + {v.label.split(" ").slice(0,3).join(" ")}
                </button>
              ))}
            </div>
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 mb-1 px-1">
              <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase">Descripción</span>
              <span className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-center">Cant.</span>
              <span className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-center">Días</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Precio Unit.</span>
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase text-right">Importe</span>
              <span className="col-span-1"/>
            </div>
            <div className="space-y-2">
              {form.items.map((item,i)=>(
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                  <input value={item.desc} onChange={e=>setItem(i,"desc",e.target.value)} placeholder="Descripción del concepto"
                    className="col-span-5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
                  <input type="number" value={item.qty} onChange={e=>setItem(i,"qty",e.target.value)} placeholder="1"
                    className="col-span-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"/>
                  <input type="number" value={item.dias||1} onChange={e=>setItem(i,"dias",e.target.value)} placeholder="1"
                    className="col-span-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"/>
                  <input type="number" value={item.price} onChange={e=>setItem(i,"price",e.target.value)} placeholder="0.00"
                    className="col-span-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-right"/>
                  <div className="col-span-2 text-sm text-right font-semibold text-gray-700 pr-2">
                    {fmx((parseFloat(item.qty)||0)*(parseFloat(item.dias)||1)*(parseFloat(item.price)||0))}
                  </div>
                  <button onClick={()=>removeItem(i)} className="col-span-1 w-7 h-7 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 flex items-center justify-center mx-auto">
                    <X size={13}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Totals summary */}
            <div className="mt-4 ml-auto w-64 space-y-1.5 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span className="font-semibold">{fmx(liveSubtotal)}</span></div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.includeIva} onChange={e=>set("includeIva",e.target.checked)} className="rounded"/>
                  IVA (16%)
                </label>
                <span>{fmx(liveIva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-teal-700 border-t border-teal-100 pt-2"><span>Total</span><span>{fmx(liveTotal)}</span></div>
            </div>
          </div>

          {/* Notes + Status */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Condiciones de pago</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                placeholder="Ej: Pago a 30 días, transferencia bancaria, etc."/>
            </div>
            <Select label="Estado inicial" value={form.status} onChange={v=>set("status",v)} options={["Pendiente","Pagada","Cancelada"]}/>
          </div>

          {/* Approval status */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado de aprobación</label>
            <div className="flex gap-2">
              {[
                {id:"Pendiente",label:"Pendiente",color:"border-amber-400 bg-amber-50 text-amber-700"},
                {id:"Aprobada",label:"Aprobada para facturar",color:"border-emerald-400 bg-emerald-50 text-emerald-700"},
                {id:"Rechazada",label:"Rechazada / No facturar",color:"border-red-400 bg-red-50 text-red-700"},
              ].map(a=>(
                <button key={a.id} onClick={()=>set("approvalStatus",a.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.approvalStatus===a.id?a.color:"border-gray-200 text-gray-500"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={()=>{setShowModal(false);setForm(emptyForm);}} className="border border-gray-200 text-gray-600 py-2.5 px-5 rounded-xl text-sm">Cancelar</button>
            <button onClick={saveInvoice} className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700">
              Crear Factura
            </button>
            <button onClick={()=>{
              saveInvoice();
              setTimeout(()=>{
                const client = clients.find(c=>c.id===form.clientId);
                const items = form.items;
                const clientCompany = client?.company || "";
                const clientName = client?.name || "";
                const commonP = {
                  concepto: form.conceptoFactura || items[0]?.desc || "SERVICIO BOTMATE",
                  planPod: form.planPod || "212802 pod robots",
                  planCliente: form.planCliente || "",
                  periodoInicio: form.periodoInicio || "",
                  periodoFin: form.periodoFin || "",
                  mesElaboracion: form.periodoNombre,
                  rubro: form.rubroFactura || "Operación CDMX",
                  clientName, clientCompany,
                  folio: form.folio || "",
                };
                if(items.length === 1) {
                  generateInvoiceExcel({ ...commonP,
                    descripcionServicio: items[0].desc || "",
                    cantidad: parseFloat(items[0].qty) || 1,
                    dias: parseFloat(items[0].dias) || 1,
                    unitario: parseFloat(items[0].price) || 0,
                  });
                } else {
                  generateInvoiceExcelMultiItem({ ...commonP,
                    items: items.map(it => ({
                      rubro: form.rubroFactura || "Operación",
                      descripcion: it.desc || "",
                      cantidad: parseFloat(it.qty) || 1,
                      dias: parseFloat(it.dias) || 1,
                      unitario: parseFloat(it.price) || 0,
                    })),
                  });
                }
              }, 100);
            }} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
              <Download size={16}/>Crear + Descargar Excel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CONVERSATIONS VIEW (WhatsApp real-time) ────────────────────────────────
function ConversationsView({ conversations, clients, setConversations, setClients }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sendingMsg, setSendingMsg] = useState("");
  const [sending, setSending] = useState(false);

  // Refresh conversations every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await sbFetchConversations();
        setConversations(fresh || []);
      } catch (e) { console.error(e); }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const client = clients.find(cl => cl.id === c.client_id);
    return c.phone?.toLowerCase().includes(q) ||
           client?.name?.toLowerCase().includes(q) ||
           client?.company?.toLowerCase().includes(q);
  });

  const getClientForConv = (conv) => clients.find(cl => cl.id === conv.client_id);

  const getLastMsg = (conv) => {
    if (!conv.messages || conv.messages.length === 0) return "";
    return conv.messages[conv.messages.length - 1]?.text || "";
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  const toggleAI = async (conv) => {
    try {
      const { data } = await supabase
        .from("conversations")
        .update({ ai_enabled: !conv.ai_enabled })
        .eq("id", conv.id)
        .select()
        .single();
      setConversations(prev => prev.map(c => c.id === conv.id ? data : c));
    } catch (e) { console.error(e); }
  };

  const sendManualMessage = async () => {
    if (!sendingMsg.trim() || !selected) return;
    setSending(true);
    try {
      // Send via WhatsApp API through Edge Function
      const res = await fetch("https://njiwuuspfloschpeasol.supabase.co/functions/v1/whatsapp-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _manual_send: true,
          phone: selected.phone,
          message: sendingMsg,
        }),
      });
      // Update local state optimistically
      const msgObj = { direction: "out", text: sendingMsg, timestamp: new Date().toISOString() };
      setConversations(prev => prev.map(c => {
        if (c.id !== selected.id) return c;
        return { ...c, messages: [...(c.messages || []), msgObj], last_message_at: new Date().toISOString() };
      }));
      setSelected(prev => prev ? { ...prev, messages: [...(prev.messages || []), msgObj] } : null);
      setSendingMsg("");
    } catch (e) { console.error(e); alert("Error al enviar: " + e.message); }
    setSending(false);
  };

  const saveAsClient = async (conv) => {
    const name = prompt("Nombre del contacto:");
    if (!name) return;
    const company = prompt("Empresa (opcional):") || "";
    try {
      const saved = await sbAddClient({ name, phone: conv.phone?.replace(/^52/, ""), company, stage: "Lead", notes: "Capturado desde WhatsApp" });
      setClients(prev => [saved, ...prev]);
      // Link to conversation
      await supabase.from("conversations").update({ client_id: saved.id }).eq("id", conv.id);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, client_id: saved.id } : c));
      alert("Cliente guardado exitosamente!");
    } catch (e) { alert("Error: " + e.message); }
  };

  return (
    <div className="flex h-full">
      {/* Conversations list */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><MessageCircle size={20} className="text-green-500"/>Conversaciones WhatsApp</h2>
          <div className="mt-2 relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">No hay conversaciones aún. Cuando alguien escriba al WhatsApp de BotMate, aparecerán aquí.</div>}
          {filtered.map(conv => {
            const client = getClientForConv(conv);
            const isSelected = selected?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => setSelected(conv)} className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${isSelected ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-800 truncate">{client?.name || conv.phone?.replace(/^52/, "")}</span>
                  <span className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</span>
                </div>
                {client?.company && <div className="text-xs text-gray-500 mb-1">{client.company}</div>}
                <div className="text-xs text-gray-400 truncate">{getLastMsg(conv)}</div>
                <div className="flex items-center gap-2 mt-1">
                  {conv.ai_enabled ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">IA activa</span> : <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Humano</span>}
                  {!client && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Sin registrar</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat detail */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300"/>
              <p className="text-lg font-medium">Selecciona una conversación</p>
              <p className="text-sm mt-1">Las conversaciones de WhatsApp aparecen automáticamente</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800">{getClientForConv(selected)?.name || selected.phone?.replace(/^52/, "")}</div>
                <div className="text-xs text-gray-500">{selected.phone} {getClientForConv(selected)?.company ? `· ${getClientForConv(selected).company}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                {!getClientForConv(selected) && (
                  <button onClick={() => saveAsClient(selected)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 flex items-center gap-1"><Plus size={12}/>Guardar como cliente</button>
                )}
                <button onClick={() => toggleAI(selected)} className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${selected.ai_enabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}>
                  {selected.ai_enabled ? <><Bot size={12}/>IA activa</> : <><Eye size={12}/>Modo humano</>}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(selected.messages || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md px-4 py-2 rounded-2xl text-sm ${msg.direction === "out" ? "bg-indigo-600 text-white rounded-br-md" : "bg-white text-gray-800 shadow-sm rounded-bl-md"}`}>
                    <p>{msg.text}</p>
                    <div className={`text-xs mt-1 ${msg.direction === "out" ? "text-indigo-200" : "text-gray-400"}`}>
                      {msg.direction === "out" ? "BotMate" : "Cliente"} · {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Manual send */}
            <div className="bg-white border-t p-3 flex gap-2">
              <input value={sendingMsg} onChange={e=>setSendingMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendManualMessage();}}} placeholder={selected.ai_enabled?"La IA está respondiendo. Escribe para intervenir...":"Escribe un mensaje..."} className="flex-1 px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"/>
              <button onClick={sendManualMessage} disabled={sending||!sendingMsg.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"><Send size={14}/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function SalesFlow() {
  const [view,setView]         = useState("dashboard");
  const [clients,setClients]   = useState([]);
  const [prospects,setProspects]= useState([]);
  const [robots,setRobots]     = useState([]);
  const [rentals,setRentals]   = useState([]);
  const [invoices,setInvoices] = useState([]);
  const [conversations,setConversations] = useState([]);
  const [loading,setLoading]   = useState(true);
  const [saving,setSaving]     = useState(false);
  const [showAdd,setShowAdd]   = useState(false);
  const [editing,setEditing]   = useState(null);

  // Load all data from Supabase
  useEffect(()=>{
    (async()=>{
      try {
        const [cs,ps,rbs,rts,invs,convs]=await Promise.all([
          sbFetchClients(),
          sbFetchProspects(),
          sbFetchRobots(),
          sbFetchRentals(),
          sbFetchInvoices(),
          sbFetchConversations(),
        ]);
        setClients(cs);
        setProspects(ps);
        setRobots(rbs);
        setRentals(rts);
        setInvoices(mapInvoicesFromDB(invs));
        setConversations(convs||[]);
      } catch(e){console.error("Error loading data:",e);}
      setLoading(false);
    })();
  },[]);

  // Clients
  const addClient=async(c)=>{setSaving(true);try{const saved=await sbAddClient(c);setClients(p=>[saved,...p]);}catch(e){alert("Error: "+e.message);}setSaving(false);setShowAdd(false);};
  const updateClient=async(c)=>{setSaving(true);try{const{id,...data}=c;const saved=await sbUpdateClient(id,data);setClients(p=>p.map(x=>x.id===id?saved:x));}catch(e){alert("Error: "+e.message);}setSaving(false);setEditing(null);};
  const deleteClient=async(id)=>{if(!window.confirm("¿Eliminar cliente?"))return;try{await sbDeleteClient(id);setClients(p=>p.filter(c=>c.id!==id));}catch(e){alert("Error: "+e.message);}};
  const moveStage=async(id,stage)=>{try{await sbUpdateClient(id,{stage});setClients(p=>p.map(c=>c.id===id?{...c,stage}:c));}catch(e){console.error(e);}};

  // Prospects
  const addProspect=async(p)=>{try{const saved=await sbAddProspect(p);setProspects(prev=>[saved,...prev]);}catch(e){alert("Error: "+e.message);}};
  const deleteProspect=async(id)=>{try{await sbDeleteProspect(id);setProspects(p=>p.filter(x=>x.id!==id));}catch(e){alert("Error: "+e.message);}};
  const convertProspect=(p)=>{setShowAdd(true);setEditing({name:p.name,company:p.company,email:p.email,phone:p.phone,sector:p.sector,stage:"Lead",value:0,notes:"Convertido de prospecto"});};

  // Robots
  const addRobot=async(r)=>{try{const saved=await sbAddRobot(r);setRobots(p=>[saved,...p]);}catch(e){alert("Error: "+e.message);}};
  const editRobot=async(r)=>{try{const{id,...data}=r;const saved=await sbUpdateRobot(id,data);setRobots(p=>p.map(x=>x.id===id?saved:x));}catch(e){alert("Error: "+e.message);}};
  const deleteRobot=async(id)=>{if(!window.confirm("¿Eliminar robot?"))return;try{await sbDeleteRobot(id);setRobots(p=>p.filter(r=>r.id!==id));}catch(e){alert("Error: "+e.message);}};

  // Rentals
  const addRental=async(r)=>{try{const saved=await sbAddRental(r);setRentals(p=>[saved,...p]);}catch(e){alert("Error: "+e.message);}};
  const updateRental=async(id,data)=>{try{const saved=await sbUpdateRental(id,data);setRentals(p=>p.map(r=>r.id===id?saved:r));}catch(e){alert("Error: "+e.message);}};

  // Invoices
  const addInvoice=async(inv)=>{try{const saved=await sbAddInvoice(inv);setInvoices(p=>[saved,...p]);}catch(e){alert("Error: "+e.message);}};
  const updateInvoice=async(id,data)=>{try{const saved=await sbUpdateInvoice(id,data);setInvoices(p=>p.map(i=>i.id===id?saved:i));}catch(e){alert("Error: "+e.message);}};
  const deleteInvoice=async(id)=>{if(!window.confirm("¿Eliminar factura?"))return;try{await sbDeleteInvoice(id);setInvoices(p=>p.filter(i=>i.id!==id));}catch(e){alert("Error: "+e.message);}};


  if(loading)return(
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-500 text-sm">Cargando SalesFlow Pro...</p></div>
    </div>
  );

  const wonValue=clients.filter(c=>c.stage==="Ganado").reduce((s,c)=>s+(c.value||0),0);
  const nav=[
    {id:"dashboard",  label:"Dashboard",       icon:Home,       group:"main"},
    {id:"clients",    label:"CRM Clientes",     icon:Users,      group:"ventas"},
    {id:"pipeline",   label:"Pipeline",         icon:TrendingUp, group:"ventas"},
    {id:"prospectos", label:"Prospectos",        icon:Search,     group:"ventas"},
    {id:"agente",     label:"Agente IA",         icon:Sparkles,   group:"ventas"},
    {id:"email",      label:"Email Marketing",  icon:Mail,       group:"comms"},
    {id:"whatsapp",   label:"WhatsApp",          icon:MessageCircle,group:"comms"},
    {id:"conversations",label:"Conversaciones",  icon:Phone,        group:"comms"},
    {id:"robots",     label:"Robots",            icon:Bot,        group:"ops"},
    {id:"facturacion",label:"Facturación",       icon:FileText,   group:"ops"},
  ];
  const groups={main:"",ventas:"VENTAS",comms:"COMUNICACIÓN",ops:"OPERACIONES"};
  let lastGroup="";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{fontFamily:"'Segoe UI', system-ui, sans-serif"}}>
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 flex flex-col" style={{background:"linear-gradient(180deg,#0f0c29 0%,#1a1550 50%,#24243e 100%)"}}>
        <div className="p-5 border-b border-white border-opacity-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center"><Zap size={15} className="text-white"/></div>
            <div><span className="text-white font-black text-base tracking-tight">SalesFlow</span><span className="text-indigo-400 font-black text-base"> Pro</span></div>
          </div>
          <div className="text-indigo-400 text-xs flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"/>Supabase · v4.0
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {nav.map(({id,label,icon:Icon,group})=>{
            const showLabel=group!==lastGroup;
            if(showLabel)lastGroup=group;
            return(
              <div key={id}>
                {showLabel&&groups[group]&&<div className="text-indigo-500 text-xs font-bold uppercase tracking-widest px-4 pt-4 pb-1.5">{groups[group]}</div>}
                <button onClick={()=>setView(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${view===id?"bg-white text-indigo-900 shadow-md":"text-indigo-200 hover:bg-white hover:bg-opacity-10 hover:text-white"}`}>
                  <Icon size={16}/>{label}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white border-opacity-10">
          <div className="bg-white bg-opacity-10 rounded-xl p-3 mb-2">
            <div className="text-indigo-300 text-xs mb-0.5">Ventas cerradas</div>
            <div className="text-white font-bold text-lg">{fmx(wonValue)}</div>
            <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
              <div className="text-indigo-300">{clients.length} clientes</div>
              <div className="text-indigo-300">{prospects.length} prospectos</div>
              <div className="text-indigo-300">{robots.length} robots</div>
              <div className="text-indigo-300">{invoices.length} facturas</div>
              <div className="text-indigo-300">{conversations.length} chats</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {saving&&<div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg z-50 flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</div>}
        {view==="dashboard"  &&<Dashboard    clients={clients} robots={robots} rentals={rentals} invoices={invoices} setView={setView}/>}
        {view==="clients"    &&<ClientsView  clients={clients} onAdd={()=>{setEditing(null);setShowAdd(true);}} onEdit={c=>{setEditing(c);setShowAdd(true);}} onDelete={deleteClient} onMove={moveStage}/>}
        {view==="pipeline"   &&<PipelineView clients={clients} onMove={moveStage} onEdit={c=>{setEditing(c);setShowAdd(true);}}/>}
        {view==="prospectos" &&<ProspectosView prospects={prospects} onAdd={addProspect} onDelete={deleteProspect} onConvert={convertProspect}/>}
        {view==="agente"     &&<AgenteIAView clients={clients} prospects={prospects}/>}
        {view==="email"      &&<EmailView clients={clients}/>}
        {view==="whatsapp"   &&<WhatsAppView clients={clients}/>}
        {view==="conversations"&&<ConversationsView conversations={conversations} clients={clients} setConversations={setConversations} setClients={setClients}/>}
        {view==="robots"     &&<RobotsView robots={robots} rentals={rentals} clients={clients} onAddRobot={addRobot} onEditRobot={editRobot} onDeleteRobot={deleteRobot} onAddRental={addRental} onUpdateRental={updateRental}/>}
        {view==="facturacion"&&<FacturacionView invoices={invoices} clients={clients} onAdd={addInvoice} onUpdate={updateInvoice} onDelete={deleteInvoice}/>}
      </div>

      {showAdd&&<ClientModal client={editing} onSave={editing&&editing.id?updateClient:c=>{addClient(c);}} onClose={()=>{setShowAdd(false);setEditing(null);}}/>}
    </div>
  );
}
