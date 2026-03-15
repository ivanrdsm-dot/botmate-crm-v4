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

function applyStyles(ws, rows) {
  // Column widths
  ws["!cols"] = [
    { wch: 3 },   // A
    { wch: 30 },  // B
    { wch: 42 },  // C
    { wch: 10 },  // D
    { wch: 8 },   // E
    { wch: 14 },  // F - unitario
    { wch: 16 },  // G - subtotal
    { wch: 3 },   // H
    { wch: 16 },  // I
  ];
  // Merge title row
  if (!ws["!merges"]) ws["!merges"] = [];
  ws["!merges"].push({ s: { r: 0, c: 1 }, e: { r: 0, c: 6 } }); // B1:G1 title
}

function buildHeader(empresa, concepto, planPodCliente, periodo, folio) {
  return [
    // Row 1: Title
    [null, `REPORTE PARA FACTURACIÓN — ${(empresa || "").toUpperCase()}`],
    // Row 2: empty
    [],
    // Row 3: Empresa
    [null, "EMPRESA A FACTURAR", (empresa || "").toUpperCase()],
    // Row 4: Folio
    [null, "FOLIO INTERNO", folio || "—"],
    // Row 5: Concepto
    [null, "CONCEPTO", concepto || ""],
    // Row 6: Plan POD fijo
    [null, "PLAN POD (FIJO)", FIXED.planPodFijo],
    // Row 7: Plan del cliente
    [null, "PLAN SP (CLIENTE)", planPodCliente || ""],
    // Row 8: Periodo
    [null, "PERIODO", periodo || ""],
    // Row 9: empty
    [],
  ];
}

function buildTableHeader() {
  return [
    // Row 10: table headers
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
  const r = lastDataRow + 1; // next row after data (1-indexed in Excel)
  return [
    // Totals row
    [
      null, null, null, null, null,
      "Total",
      { f: `SUM(G${firstDataRow}:G${lastDataRow})` },
    ],
    // IVA row
    [
      null, null, null, null, null,
      "IVA (16%)",
      { f: `G${r}*0.16` },
    ],
    // Grand total
    [
      null, null, null, null, null,
      "TOTAL",
      { f: `G${r}+G${r + 1}` },
    ],
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
 * Genera Excel para facturación con diseño profesional.
 * Single item version.
 */
export function generateInvoiceExcel({
  concepto,
  planPod,
  periodo,
  rubro,
  descripcionServicio,
  cantidad,
  dias,
  unitario,
  clientName = "",
  clientCompany = "",
  folio = "",
}) {
  const empresa = clientCompany || clientName || "CLIENTE";
  const wb = XLSX.utils.book_new();

  const header = buildHeader(empresa, concepto, planPod, periodo, folio);
  const tableHead = buildTableHeader();

  // Data row at Excel row 11 (0-indexed row 10)
  const dataRow = [
    null,
    rubro || "Operación CDMX",
    descripcionServicio || concepto || "",
    cantidad || 1,
    dias || 1,
    unitario || 0,
    { f: "D11*E11*F11" },
  ];

  const footer = buildFooter(11, 11);

  const data = [...header, ...tableHead, dataRow, ...footer];
  const ws = XLSX.utils.aoa_to_sheet(data);
  applyStyles(ws);

  const sheetName = empresa
    ? `F ${empresa.substring(0, 26).toUpperCase()}`
    : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = folio
    ? `FACTURA_${folio}_${periodo || "SIN_PERIODO"}.xlsx`
    : `FACTURA_${empresa}_${periodo || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}

/**
 * Genera Excel multi-item con diseño profesional.
 */
export function generateInvoiceExcelMultiItem({
  concepto,
  planPod,
  periodo,
  items,
  clientName = "",
  clientCompany = "",
  folio = "",
}) {
  const empresa = clientCompany || clientName || "CLIENTE";
  const wb = XLSX.utils.book_new();

  const header = buildHeader(empresa, concepto, planPod, periodo, folio);
  const tableHead = buildTableHeader();

  // First data row in Excel = row 11 (header=9 rows + tableHead=1 row + 1)
  const firstDataRow = 11;
  const itemRows = items.map((item, i) => {
    const row = firstDataRow + i;
    return [
      null,
      item.rubro || "Operación",
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

  const sheetName = empresa
    ? `F ${empresa.substring(0, 26).toUpperCase()}`
    : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = folio
    ? `FACTURA_${folio}_${periodo || "SIN_PERIODO"}.xlsx`
    : `FACTURA_${empresa}_${periodo || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}
