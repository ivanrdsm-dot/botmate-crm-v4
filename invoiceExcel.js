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
  // Merge title row B1:G1
  ws["!merges"].push({ s: { r: 0, c: 1 }, e: { r: 0, c: 6 } });
}

function buildHeader({ empresa, concepto, planPod, planCliente, periodoInicio, periodoFin, mesElaboracion, folio }) {
  const periodoTrabajo = (periodoInicio && periodoFin)
    ? `${fmtDate(periodoInicio)} — ${fmtDate(periodoFin)}`
    : "—";

  return [
    // Row 1: Title
    [null, `REPORTE PARA FACTURACIÓN`],
    // Row 2: empty
    [],
    // Row 3: Empresa
    [null, "EMPRESA", (empresa || "").toUpperCase()],
    // Row 4: Folio
    [null, "FOLIO INTERNO", folio || "—"],
    // Row 5: Concepto
    [null, "CONCEPTO", concepto || ""],
    // Row 6: Plan POD fijo
    [null, "PLAN POD", FIXED.planPodFijo],
    // Row 7: Plan del cliente
    [null, "PLAN CLIENTE", planCliente || ""],
    // Row 8: Periodo de trabajo
    [null, "PERÍODO DE TRABAJO", periodoTrabajo],
    // Row 9: Mes de elaboración
    [null, "MES DE ELABORACIÓN", mesElaboracion || ""],
    // Row 10: empty
    [],
  ];
}

function buildTableHeader() {
  return [
    // Row 11: table headers
    [
      null,
      "RUBROS PPTO",
      "CONCEPTOS",
      "Cant",
      "Días",
      "Unitario",
      "Subtotal",
    ],
  ];
}

function buildFooter(firstDataRow, lastDataRow) {
  const r = lastDataRow + 1;
  return [
    // Totals row
    [null, null, null, null, null, "Total", { f: `SUM(G${firstDataRow}:G${lastDataRow})` }],
    // IVA row
    [null, null, null, null, null, "IVA (16%)", { f: `G${r}*0.16` }],
    // Grand total
    [null, null, null, null, null, "TOTAL", { f: `G${r}+G${r + 1}` }],
    // empty
    [],
    [],
    // SAT info block
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

  // Data row at Excel row 12 (header=10 rows + tableHead=1 row + 1)
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

  // First data row = 12 (header=10 + tableHead=1 + 1)
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
