import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://njiwuuspfloschpeasol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tla7B5l9R_aAdhN6Gvkb2Q_qABTkr6-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── CLIENTS ────────────────────────────────────────────────
export async function fetchClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addClient(client) {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// ─── PROSPECTS ──────────────────────────────────────────────
export async function fetchProspects() {
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addProspect(prospect) {
  const { data, error } = await supabase
    .from("prospects")
    .insert(prospect)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProspect(id) {
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw error;
}

// ─── ROBOTS ─────────────────────────────────────────────────
export async function fetchRobots() {
  const { data, error } = await supabase
    .from("robots")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addRobot(robot) {
  const { data, error } = await supabase
    .from("robots")
    .insert(robot)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRobot(id, updates) {
  const { data, error } = await supabase
    .from("robots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRobot(id) {
  const { error } = await supabase.from("robots").delete().eq("id", id);
  if (error) throw error;
}

// ─── RENTALS ────────────────────────────────────────────────
export async function fetchRentals() {
  const { data, error } = await supabase
    .from("rentals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addRental(rental) {
  const { data, error } = await supabase
    .from("rentals")
    .insert(rental)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRental(id, updates) {
  const { data, error } = await supabase
    .from("rentals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── INVOICES ───────────────────────────────────────────────
export async function fetchInvoices() {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addInvoice(invoice) {
  // Map camelCase to snake_case for Supabase
  const row = {
    client_id: invoice.clientId,
    folio: invoice.folio,
    numero_factura: invoice.numeroFactura,
    date: invoice.date,
    periodo_inicio: invoice.periodoInicio || null,
    periodo_fin: invoice.periodoFin || null,
    periodo_nombre: invoice.periodoNombre,
    plan_id: invoice.planId,
    plan_label: invoice.planLabel,
    plan_custom: invoice.planCustom,
    concepto_factura: invoice.conceptoFactura,
    plan_pod: invoice.planPod,
    rubro_factura: invoice.rubroFactura,
    items: invoice.items,
    include_iva: invoice.includeIva,
    subtotal: invoice.subtotal,
    iva: invoice.iva,
    total: invoice.total,
    notes: invoice.notes,
    status: invoice.status,
    approval_status: invoice.approvalStatus,
    client_name: invoice.clientName,
    client_company: invoice.clientCompany,
    client_email: invoice.clientEmail,
  };
  const { data, error } = await supabase
    .from("invoices")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

export async function updateInvoice(id, updates) {
  const fieldMap = {
    status: "status",
    approvalStatus: "approval_status",
    sentToAccountant: "sent_to_accountant",
    clientId: "client_id",
    folio: "folio",
    numeroFactura: "numero_factura",
    date: "date",
    periodoInicio: "periodo_inicio",
    periodoFin: "periodo_fin",
    periodoNombre: "periodo_nombre",
    planId: "plan_id",
    planLabel: "plan_label",
    planCustom: "plan_custom",
    conceptoFactura: "concepto_factura",
    planPod: "plan_pod",
    rubroFactura: "rubro_factura",
    items: "items",
    includeIva: "include_iva",
    subtotal: "subtotal",
    iva: "iva",
    total: "total",
    notes: "notes",
    clientName: "client_name",
    clientCompany: "client_company",
    clientEmail: "client_email",
  };
  const row = {};
  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (updates[camel] !== undefined) row[snake] = updates[camel];
  }
  const { data, error } = await supabase
    .from("invoices")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapInvoiceFromDB(data);
}

export async function deleteInvoice(id) {
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
}

// Map snake_case DB columns back to camelCase for the React app
function mapInvoiceFromDB(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    folio: row.folio,
    numeroFactura: row.numero_factura,
    date: row.date,
    periodoInicio: row.periodo_inicio,
    periodoFin: row.periodo_fin,
    periodoNombre: row.periodo_nombre,
    planId: row.plan_id,
    planLabel: row.plan_label,
    planCustom: row.plan_custom,
    conceptoFactura: row.concepto_factura,
    planPod: row.plan_pod,
    rubroFactura: row.rubro_factura,
    items: row.items,
    includeIva: row.include_iva,
    subtotal: row.subtotal,
    iva: row.iva,
    total: row.total,
    notes: row.notes,
    status: row.status,
    approvalStatus: row.approval_status,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    sentToAccountant: row.sent_to_accountant,
    created: row.created_at,
  };
}

// Batch map for fetchInvoices
export function mapInvoicesFromDB(rows) {
  return rows.map(mapInvoiceFromDB);
}

// ─── CONVERSATIONS (para Fase 3) ───────────────────────────
export async function fetchConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ─── APPOINTMENTS (para Fase 3) ────────────────────────────
export async function fetchAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}
