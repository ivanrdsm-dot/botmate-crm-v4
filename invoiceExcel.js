import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Campos FIJOS de BotMate para facturacion
const FIXED_FIELDS = {
  clave: "23153200 - Robótica.  E48 SERVICIO",
  formaPago: "Forma de pago: por definir",
  metodoPago: "Método de pago: PPD",
  usoCFDI: "Uso de CFDI: gastos en general",
  claveProducto: "23153200",
  rubroG03: "G03 GASTOS EN GENERAL",
};

/**
 * Genera un archivo Excel con el formato exacto del contador de BotMate.
 *
 * @param {Object} params
 * @param {string} params.concepto - Ej: "RENTA BOT SONY MUSIC"
 * @param {string} params.planPod - Ej: "P213101 SonyMusic Robots POD"
 * @param {string} params.periodo - Ej: "DICIEMBRE"
 * @param {string} params.rubro - Ej: "Operación CDMX"
 * @param {string} params.descripcionServicio - Ej: "RENTA ROBOT SONY MUSIC"
 * @param {number} params.cantidad - Ej: 1
 * @param {number} params.dias - Ej: 1
 * @param {number} params.unitario - Ej: 4000
 * @param {string} [params.clientName] - Nombre del cliente
 * @param {string} [params.folio] - Folio de la factura
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
  folio = "",
}) {
  const wb = XLSX.utils.book_new();

  // Build data matching the accountant's exact layout
  const data = [
    [], // row 1 empty
    [null, "CONCEPTO", concepto], // row 2: B2, C2
    [null, "PLAN POD", planPod], // row 3: B3, C3
    [null, "PERIODO DE TRABAJO", periodo], // row 4: B4, C4
    [], // row 5 empty
    // row 6: headers
    [
      null,
      "RUBROS PPTO",
      "CONCEPTOS",
      "Cant",
      "dias",
      "unitario",
      "total",
      null,
      "TOTAL + IVA",
    ],
    // row 7: data with formulas
    [
      null,
      rubro || "Operación CDMX",
      descripcionServicio || concepto,
      cantidad || 1,
      dias || 1,
      unitario || 0,
      { f: "D7*E7*F7" }, // G7 = cantidad * dias * unitario
      null,
      { f: "G7*1.16" }, // I7 = total + IVA
    ],
    [], // row 8
    [], // row 9
    // row 10: Clave / Forma de pago
    [null, "CLAVE", FIXED_FIELDS.formaPago],
    // row 11: Clave producto / Metodo de pago
    [null, FIXED_FIELDS.clave, FIXED_FIELDS.metodoPago],
    // row 12: G03 / Uso CFDI
    [null, FIXED_FIELDS.rubroG03, "Uso de CFDI: gastos en general"],
    // row 13: Clave producto numero
    [null, FIXED_FIELDS.claveProducto],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths to match the template
  ws["!cols"] = [
    { wch: 3 }, // A
    { wch: 35 }, // B
    { wch: 40 }, // C
    { wch: 8 }, // D - Cant
    { wch: 8 }, // E - dias
    { wch: 12 }, // F - unitario
    { wch: 14 }, // G - total
    { wch: 3 }, // H
    { wch: 16 }, // I - TOTAL + IVA
  ];

  // Name the sheet after the client or use default
  const sheetName =
    clientName
      ? `F ${clientName.substring(0, 26).toUpperCase()}`
      : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate and download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = folio
    ? `FACTURA_${folio}_${periodo || "SIN_PERIODO"}.xlsx`
    : `FACTURA_${clientName || "BOTMATE"}_${periodo || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}

/**
 * Genera Excel para multiples items de factura (cuando hay mas de un rubro).
 */
export function generateInvoiceExcelMultiItem({
  concepto,
  planPod,
  periodo,
  items, // [{rubro, descripcion, cantidad, dias, unitario}]
  clientName = "",
  folio = "",
}) {
  const wb = XLSX.utils.book_new();

  const headerRows = [
    [],
    [null, "CONCEPTO", concepto],
    [null, "PLAN POD", planPod],
    [null, "PERIODO DE TRABAJO", periodo],
    [],
    [
      null,
      "RUBROS PPTO",
      "CONCEPTOS",
      "Cant",
      "dias",
      "unitario",
      "total",
      null,
      "TOTAL + IVA",
    ],
  ];

  const itemRows = items.map((item, i) => {
    const row = i + 7; // Excel row number (1-indexed)
    return [
      null,
      item.rubro || "Operación",
      item.descripcion || item.desc || "",
      item.cantidad || item.qty || 1,
      item.dias || 1,
      item.unitario || item.price || 0,
      { f: `D${row}*E${row}*F${row}` },
      null,
      { f: `G${row}*1.16` },
    ];
  });

  const lastDataRow = 6 + items.length;
  const footerRows = [
    [],
    [],
    [null, "CLAVE", FIXED_FIELDS.formaPago],
    [null, FIXED_FIELDS.clave, FIXED_FIELDS.metodoPago],
    [null, FIXED_FIELDS.rubroG03, "Uso de CFDI: gastos en general"],
    [null, FIXED_FIELDS.claveProducto],
  ];

  const data = [...headerRows, ...itemRows, ...footerRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = [
    { wch: 3 },
    { wch: 35 },
    { wch: 40 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 3 },
    { wch: 16 },
  ];

  const sheetName = clientName
    ? `F ${clientName.substring(0, 26).toUpperCase()}`
    : "FACTURA";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = folio
    ? `FACTURA_${folio}_${periodo || "SIN_PERIODO"}.xlsx`
    : `FACTURA_${clientName || "BOTMATE"}_${periodo || new Date().toISOString().slice(0, 7)}.xlsx`;

  saveAs(blob, fileName);
  return fileName;
}
