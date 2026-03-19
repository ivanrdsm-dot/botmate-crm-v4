import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FIXED = {
  clave: "23153200",
  claveDesc: "23153200 - Robótica.  E48 SERVICIO",
  formaPago: "Forma de pago: por definir",
  metodoPago: "Método de pago: PPD",
  usoCFDI: "Uso de CFDI: gastos en general",
  g03: "G03 GASTOS EN GENERAL",
  planPodFijo: "212802 pod robots",
};

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

function applyStyles(ws, totalRows) {
  ws["!cols"] = [
    { wch: 4 },   // A - spacer
    { wch: 22 },  // B - labels / rubro
    { wch: 38 },  // C - values / conceptos
    { wch: 8 },   // D - cant
    { wch: 8 },   // E - dias
    { wch: 14 },  // F - unitario
    { wch: 16 },  // G - subtotal
    { wch: 4 },   // H - spacer
    { wch: 18 },  // I - info block
  ];
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 0, c: 1 }, e: { r: 0, c: 6 } });
}

function buildHeader({ empresa, concepto, planPod, planCliente, periodoInicio, periodoFin, mesElaboracion, folio }) {
  const periodoTrabajo = (periodoInicio && periodoFin)
    ? `${fmtDate(periodoInicio)} — ${fmtDate(periodoFin)}`
    : "—";

  return [
    [null, `REPORTE PARA FACTURACIÓN`],
    [],
    [null, "EMPRESA", (empresa || "").toUpperCase()],
    [null, "FOLIO INTERNO", folio || "—"],
    [null, "CONCEPTO", concepto || ""],
    [null, "PLAN POD", FIXED.planPodFijo],
    [null, "PLAN CLIENTE", planCliente || ""],
    [null, "PERÍODO DE TRABAJO", periodoTrabajo],
    [null, "MES DE ELABORACIÓN", mesElaboracion || ""],
    [],
  ];
}

function buildTableHeader() {
  return [
    [null, "RUBROS PPTO", "CONCEPTOS", "Cant", "Días", "Unitario", "Subtotal"],
  ];
}

function buildFooter(firstDataRow, lastDataRow) {
  const r = lastDataRow + 1;
  return [
    [null, null, null, null, null, "Total", { f: `SUM(G${firstDataRow}:G${lastDataRow})` }],
    [null, null, null, null, null, "IVA (16%)", { f: `G${r}*0.16` }],
    [null, null, null, null, null, "TOTAL", { f: `G${r}+G${r + 1}` }],
    [],
    [],
    [null, "CLAVE SAT", FIXED.clave],
    [null, FIXED.claveDesc],
    [null, FIXED.g03],
    [],
    [null, "DATOS FISCALES"],
    [null, FIXED.formaPago],
    [null, FIXED.metodoPago],
    [null, FIXED.usoCFDI],
  ];
}

/**
 * Single item invoice Excel
 */
export function generateInvoiceExcel({
  concepto, planPod, planCliente, periodoInicio, periodoFin, mesElaboracion,
  rubro, descripcionServicio, cantidad, dias, unitario,
  clientName = "", clientCompany = "", folio = "",
}) {
  const empresa = clientCompany || clientName || "CLIENTE";
  const wb = XLSX.utils.book_new();

  const header = buildHeader({ empresa, concepto, planPod: planPod || FIXED.planPodFijo, planCliente, periodoInicio, periodoFin, mesElaboracion, folio });
  const tableHead = buildTableHeader();

  const dataRow = [
    null,
    rubro || "Operación CDMX",
    descripcionServicio || concepto || "",
    cantidad || 1,
    dias || 1,
    unitario || 0,
    { f: "D12*E12*F12" },
  ];

  const footer = buildFooter(12, 12);
  const data = [...header, ...tableHead, dataRow, ...footer];
  const ws = XLSX.utils.aoa_to_sheet(data);
  applyStyles(ws);

  const sheetName = empresa ? `F ${empresa.substring(0, 26).toUpperCase()}` : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const fileName = folio
    ? `FACTURA_${folio}_${mesElaboracion || "SIN_MES"}.xlsx`
    : `FACTURA_${empresa}_${mesElaboracion || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}

/**
 * Multi item invoice Excel
 */
export function generateInvoiceExcelMultiItem({
  concepto, planPod, planCliente, periodoInicio, periodoFin, mesElaboracion,
  items, rubro,
  clientName = "", clientCompany = "", folio = "",
}) {
  const empresa = clientCompany || clientName || "CLIENTE";
  const wb = XLSX.utils.book_new();

  const header = buildHeader({ empresa, concepto, planPod: planPod || FIXED.planPodFijo, planCliente, periodoInicio, periodoFin, mesElaboracion, folio });
  const tableHead = buildTableHeader();

  const firstDataRow = 12;
  const itemRows = items.map((item, i) => {
    const row = firstDataRow + i;
    return [
      null,
      item.rubro || rubro || "Operación",
      item.descripcion || item.desc || "",
      item.cantidad || item.qty || 1,
      item.dias || 1,
      item.unitario || item.price || 0,
      { f: `D${row}*E${row}*F${row}` },
    ];
  });

  const lastDataRow = firstDataRow + items.length - 1;
  const footer = buildFooter(firstDataRow, lastDataRow);
  const data = [...header, ...tableHead, ...itemRows, ...footer];
  const ws = XLSX.utils.aoa_to_sheet(data);
  applyStyles(ws);

  const sheetName = empresa ? `F ${empresa.substring(0, 26).toUpperCase()}` : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  const fileName = folio
    ? `FACTURA_${folio}_${mesElaboracion || "SIN_MES"}.xlsx`
    : `FACTURA_${empresa}_${mesElaboracion || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}

/**
 * Global Dashboard Excel Report — all invoices with monthly breakdown
 */
export function generateGlobalReport(invoices, clients) {
  const wb = XLSX.utils.book_new();
  const MESES_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mx = (n) => `$${(n||0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── HOJA 1: RESUMEN DASHBOARD ───
  const totalPagadas = invoices.filter(i=>i.status==="Pagada").reduce((s,i)=>s+(i.total||0),0);
  const totalPendientes = invoices.filter(i=>i.status==="Pendiente").reduce((s,i)=>s+(i.total||0),0);
  const totalCanceladas = invoices.filter(i=>i.status==="Cancelada").reduce((s,i)=>s+(i.total||0),0);

  const dashData = [
    ["", "REPORTE GLOBAL DE FACTURACIÓN — BOTMATE"],
    ["", `Generado: ${new Date().toLocaleDateString("es-MX", { year:"numeric", month:"long", day:"numeric" })}`],
    [],
    ["", "RESUMEN GENERAL"],
    ["", "Total Facturado (Cobrado)", totalPagadas],
    ["", "Pendiente de Cobro", totalPendientes],
    ["", "Cancelado", totalCanceladas],
    ["", "Total General", totalPagadas + totalPendientes],
    ["", "Total Facturas", invoices.length],
    ["", "Facturas Pagadas", invoices.filter(i=>i.status==="Pagada").length],
    ["", "Facturas Pendientes", invoices.filter(i=>i.status==="Pendiente").length],
    ["", "Facturas Canceladas", invoices.filter(i=>i.status==="Cancelada").length],
    [],
    ["", "INGRESOS POR MES"],
    ["", "Mes", "Pagadas", "Pendientes", "Canceladas", "Total Mes", "# Facturas"],
  ];

  // Group invoices by month
  const byMonth = {};
  invoices.forEach(inv => {
    const d = inv.date || inv.periodoInicio || (inv.created ? inv.created.split("T")[0] : null);
    if (!d) return;
    const dt = new Date(d + "T12:00:00");
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
    if (!byMonth[key]) byMonth[key] = { pagadas:0, pendientes:0, canceladas:0, count:0 };
    if (inv.status === "Pagada") byMonth[key].pagadas += (inv.total||0);
    else if (inv.status === "Pendiente") byMonth[key].pendientes += (inv.total||0);
    else if (inv.status === "Cancelada") byMonth[key].canceladas += (inv.total||0);
    byMonth[key].count++;
  });

  const sortedMonths = Object.keys(byMonth).sort();
  sortedMonths.forEach(key => {
    const [y, m] = key.split("-");
    const mesName = `${MESES_NAMES[parseInt(m)-1]} ${y}`;
    const d = byMonth[key];
    dashData.push(["", mesName, d.pagadas, d.pendientes, d.canceladas, d.pagadas + d.pendientes, d.count]);
  });

  const monthStartRow = 16;
  const monthEndRow = monthStartRow + sortedMonths.length - 1;
  if (sortedMonths.length > 0) {
    dashData.push(["", "TOTAL", { f:`SUM(C${monthStartRow}:C${monthEndRow})` }, { f:`SUM(D${monthStartRow}:D${monthEndRow})` }, { f:`SUM(E${monthStartRow}:E${monthEndRow})` }, { f:`SUM(F${monthStartRow}:F${monthEndRow})` }, { f:`SUM(G${monthStartRow}:G${monthEndRow})` }]);
  }

  // Top clients
  dashData.push([], ["", "TOP CLIENTES POR FACTURACIÓN"]);
  dashData.push(["", "Cliente", "Empresa", "Total Facturado", "# Facturas", "Estado"]);

  const byClient = {};
  invoices.forEach(inv => {
    const cid = inv.clientId || "sin-cliente";
    if (!byClient[cid]) byClient[cid] = { name: inv.clientName||"", company: inv.clientCompany||"", total:0, count:0, paid:0, pending:0 };
    byClient[cid].total += (inv.total||0);
    byClient[cid].count++;
    if (inv.status==="Pagada") byClient[cid].paid += (inv.total||0);
    if (inv.status==="Pendiente") byClient[cid].pending += (inv.total||0);
  });

  Object.entries(byClient)
    .sort((a,b) => b[1].total - a[1].total)
    .forEach(([_, c]) => {
      dashData.push(["", c.name, c.company, c.total, c.count, `Pagado: ${mx(c.paid)} | Pendiente: ${mx(c.pending)}`]);
    });

  const wsDash = XLSX.utils.aoa_to_sheet(dashData);
  wsDash["!cols"] = [
    { wch: 3 }, { wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
  ];
  const currencyFmt = '"$"#,##0.00';
  for (let r = 4; r <= 7; r++) {
    const cell = wsDash[XLSX.utils.encode_cell({r, c:2})];
    if (cell) cell.z = currencyFmt;
  }
  XLSX.utils.book_append_sheet(wb, wsDash, "Dashboard");

  // ─── HOJA 2: DETALLE DE TODAS LAS FACTURAS ───
  const detailHeader = [
    ["", "DETALLE DE FACTURAS — BOTMATE"],
    [],
    ["", "Folio", "Cliente", "Empresa", "Fecha", "Período Inicio", "Período Fin", "Mes", "Concepto", "Rubro", "Plan Cliente", "Subtotal", "IVA", "Total", "Estado", "Aprobación", "Notas"],
  ];

  const detailRows = invoices.map(inv => {
    const client = clients.find(c=>c.id===inv.clientId);
    return [
      "",
      inv.folio || "—",
      inv.clientName || client?.name || "—",
      inv.clientCompany || client?.company || "—",
      inv.date ? fmtDate(inv.date) : "—",
      inv.periodoInicio ? fmtDate(inv.periodoInicio) : "—",
      inv.periodoFin ? fmtDate(inv.periodoFin) : "—",
      inv.periodoNombre || "—",
      inv.conceptoFactura || "—",
      inv.rubroFactura || "—",
      inv.planCliente || "—",
      inv.subtotal || 0,
      inv.iva || 0,
      inv.total || 0,
      inv.status || "—",
      inv.approvalStatus || "—",
      inv.notes || "",
    ];
  });

  detailRows.sort((a,b) => {
    const da = a[4] || "";
    const db = b[4] || "";
    return db.localeCompare(da);
  });

  const detailData = [...detailHeader, ...detailRows];
  const firstDetailRow = 4;
  const lastDetailRow = firstDetailRow + detailRows.length - 1;
  if (detailRows.length > 0) {
    detailData.push([
      "", "", "", "", "", "", "", "", "", "", "TOTALES:",
      { f: `SUM(L${firstDetailRow}:L${lastDetailRow})` },
      { f: `SUM(M${firstDetailRow}:M${lastDetailRow})` },
      { f: `SUM(N${firstDetailRow}:N${lastDetailRow})` },
    ]);
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail["!cols"] = [
    { wch: 3 }, { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle Facturas");

  // ─── HOJA 3: INGRESOS MENSUALES (para gráficas en Excel) ───
  const monthlyData = [
    ["", "INGRESOS MENSUALES"],
    [],
    ["", "Mes", "Cobrado", "Pendiente", "Total"],
  ];
  sortedMonths.forEach(key => {
    const [y, m] = key.split("-");
    const mesName = `${MESES_NAMES[parseInt(m)-1]} ${y}`;
    const d = byMonth[key];
    monthlyData.push(["", mesName, d.pagadas, d.pendientes, d.pagadas + d.pendientes]);
  });

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
  wsMonthly["!cols"] = [{ wch: 3 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Ingresos Mensuales");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const today = new Date().toISOString().slice(0, 10);
  saveAs(blob, `REPORTE_GLOBAL_BOTMATE_${today}.xlsx`);
}
