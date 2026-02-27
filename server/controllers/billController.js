const billModel = require('../models/billModel');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeSource(value) {
  const s = String(value || '').trim().toLowerCase();
  if (s === 'claim') return 'claim';
  if (s === 'depo') return 'depo';
  return '';
}

function parseDateToISO(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const y = String(parsed.y).padStart(4, '0');
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const s = String(value || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return '';
}

function isBlankBank(value) {
  const bank = String(value || '').trim().toLowerCase();
  return bank === '' || bank === '-' || bank === 'n/a';
}

exports.getBills = async (req, res) => {
  try {
    const type = String(req.query.type || '').trim();
    const rows = await billModel.getBills({ type: type || undefined });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAgentBills = async (_req, res) => {
  try {
    const rows = await billModel.getAgentBills();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getClientAllBills = async (req, res) => {
  try {
    const rawClientId = String(req.query.client_id || '').trim();
    let clientId = null;
    if (rawClientId && rawClientId.toLowerCase() !== 'all') {
      const parsedClientId = toNumber(rawClientId);
      if (!Number.isInteger(parsedClientId) || parsedClientId <= 0) {
        return res.status(400).json({ message: 'client_id must be a positive integer or "all"' });
      }
      clientId = parsedClientId;
    }
    const data = await billModel.getClientAllBills(clientId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.exportClientAllBillsExcel = async (req, res) => {
  try {
    const BILL_TYPES = ['Claim Bills', 'Depo Bills', 'Other Bills', 'Processing Bills', 'Payment Bills'];
    const body = req.body || {};
    const clientLabel = String(body.clientLabel || 'All Clients');
    const dateRangeLabel = String(body.dateRangeLabel || 'All dates');
    const searchText = String(body.searchText || 'N/A');
    const pendingDue = Number(body.pendingDue) || 0;
    const providedGrandTotal = Number(body.grandTotalAmount);
    const rows = Array.isArray(body.rows) ? body.rows : [];

    const rowsByType = new Map();
    const totalsByType = { claim: 0, depo: 0, processing: 0, payment: 0, other: 0 };
    for (const type of BILL_TYPES) rowsByType.set(type, []);

    for (const row of rows) {
      const type = String(row?.type || '');
      if (!rowsByType.has(type)) continue;
      rowsByType.get(type).push(row);
      const total = Number(row?.totalInr || 0);
      if (type === 'Claim Bills') totalsByType.claim += total;
      else if (type === 'Depo Bills') totalsByType.depo += total;
      else if (type === 'Processing Bills') totalsByType.processing += total;
      else if (type === 'Payment Bills') totalsByType.payment += total;
      else if (type === 'Other Bills') totalsByType.other += total;
    }

    const computedGrandTotal = Number.isFinite(providedGrandTotal) ? providedGrandTotal :
      totalsByType.claim + totalsByType.depo + totalsByType.processing + totalsByType.payment + totalsByType.other + pendingDue;

    const formatISOToDDMMYYYY = (iso) => {
      const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : iso || '-';
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Client Bills');
    worksheet.columns = [
      { width: 14 }, { width: 16 }, { width: 16 }, { width: 20 },
      { width: 12 }, { width: 8 }, { width: 12 }, { width: 14 }
    ];

    const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const titleStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const colHeaderStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const grandTotalStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } } };

    let currentRow = 1;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Client: ${clientLabel}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Date Range: ${dateRangeLabel}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Search: ${searchText}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Rows: ${rows.length}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow += 2;

    for (const type of BILL_TYPES) {
      const sectionRows = [...(rowsByType.get(type) || [])].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
      const sectionTotal = sectionRows.reduce((acc, row) => acc + Number(row?.totalInr || 0), 0);

      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = type;
      worksheet.getCell(`A${currentRow}`).style = titleStyle;
      currentRow++;

      worksheet.getCell(`G${currentRow}`).value = `${sectionRows.length} rows`;
      currentRow++;

      ['Date', 'Group', 'Client', 'Bank / Payment Type', 'Amount ($)', '%', 'Dollar Rate', 'Total (INR)'].forEach((h, i) => {
        worksheet.getCell(currentRow, i + 1).value = h;
        worksheet.getCell(currentRow, i + 1).style = colHeaderStyle;
      });
      currentRow++;

      if (!sectionRows.length) {
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = 'No bills found.';
        currentRow++;
      } else {
        for (const row of sectionRows) {
          const isProcOrPay = row.type === 'Processing Bills' || row.type === 'Payment Bills';
          worksheet.addRow([
            formatISOToDDMMYYYY(row.dateISO),
            row.group || '-',
            row.client || '-',
            [row.bank, row.paymentType].filter(Boolean).join(' / ') || '-',
            Number(row.amountUsd || 0),
            isProcOrPay ? `${Number(row.pct || 0).toFixed(2)}%` : '-',
            row.rate ? Number(row.rate) : '-',
            Number(row.totalInr || 0)
          ]);
          currentRow++;
        }
      }

      worksheet.getCell(`G${currentRow}`).value = 'Total:';
      worksheet.getCell(`G${currentRow}`).font = { bold: true };
      worksheet.getCell(`H${currentRow}`).value = Number(sectionTotal.toFixed(2));
      worksheet.getCell(`H${currentRow}`).font = { bold: true };
      currentRow += 2;
    }

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Grand Total: ${computedGrandTotal.toFixed(2)} INR`;
    worksheet.getCell(`A${currentRow}`).style = grandTotalStyle;
    currentRow += 2;

    ['Claim', 'Depo', 'Processing', 'Payment', 'Other', 'Pending/Due', 'Total'].forEach((h, i) => {
      worksheet.getCell(currentRow, i + 1).value = h;
      worksheet.getCell(currentRow, i + 1).font = { bold: true };
    });
    currentRow++;

    worksheet.addRow([
      Number(totalsByType.claim.toFixed(2)),
      Number(totalsByType.depo.toFixed(2)),
      Number(totalsByType.processing.toFixed(2)),
      Number(totalsByType.payment.toFixed(2)),
      Number(totalsByType.other.toFixed(2)),
      Number(pendingDue.toFixed(2)),
      Number(computedGrandTotal.toFixed(2))
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="client_bills_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.exportAgentAllBillsExcel = async (req, res) => {
  try {
    const body = req.body || {};
    const agentLabel = String(body.agentLabel || 'All Agents');
    const dateRangeLabel = String(body.dateRangeLabel || 'All dates');
    const searchText = String(body.searchText || 'N/A');
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const providedGrandTotal = Number(body.grandTotalAmount);

    const billRows = rows
      .filter((row) => String(row?.section || '').toLowerCase() === 'bill')
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    const otherRows = rows
      .filter((row) => String(row?.section || '').toLowerCase() === 'other')
      .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

    const billTotal = billRows.reduce((acc, row) => acc + Number(row?.totalInr || 0), 0);
    const otherTotal = otherRows.reduce((acc, row) => acc + Number(row?.totalInr || 0), 0);
    const computedGrandTotal = Number.isFinite(providedGrandTotal) ? providedGrandTotal : billTotal + otherTotal;

    const formatISOToDDMMYYYY = (iso) => {
      const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : iso || '-';
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Agent Bills');
    worksheet.columns = [
      { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 },
      { width: 18 }, { width: 12 }, { width: 12 }, { width: 14 }
    ];

    const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const titleStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const colHeaderStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } }, alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
    const grandTotalStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } } };

    let currentRow = 1;
    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Agent: ${agentLabel}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Date Range: ${dateRangeLabel}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Search: ${searchText}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow++;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Rows: ${rows.length}`;
    worksheet.getCell(`A${currentRow}`).style = headerStyle;
    currentRow += 2;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Agent Bills';
    worksheet.getCell(`A${currentRow}`).style = titleStyle;
    currentRow++;
    worksheet.getCell(`G${currentRow}`).value = `${billRows.length} rows`;
    currentRow++;
    ['Date', 'Group', 'Client', 'Source', 'Bank', 'Amount ($)', 'Dollar Rate', 'Total (INR)'].forEach((h, i) => {
      worksheet.getCell(currentRow, i + 1).value = h;
      worksheet.getCell(currentRow, i + 1).style = colHeaderStyle;
    });
    currentRow++;
    if (!billRows.length) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'No bills found.';
      currentRow++;
    } else {
      for (const row of billRows) {
        worksheet.addRow([
          formatISOToDDMMYYYY(row.dateISO),
          row.group || '-',
          row.client || '-',
          row.source || '-',
          row.bank || '-',
          Number(row.amountUsd || 0),
          Number(row.rate || 0),
          Number(row.totalInr || 0)
        ]);
        currentRow++;
      }
    }
    worksheet.getCell(`G${currentRow}`).value = 'Total:';
    worksheet.getCell(`G${currentRow}`).font = { bold: true };
    worksheet.getCell(`H${currentRow}`).value = Number(billTotal.toFixed(2));
    worksheet.getCell(`H${currentRow}`).font = { bold: true };
    currentRow += 2;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Agent Other Bills';
    worksheet.getCell(`A${currentRow}`).style = titleStyle;
    currentRow++;
    worksheet.getCell(`G${currentRow}`).value = `${otherRows.length} rows`;
    currentRow++;
    ['Date', 'Comment', 'Amount (INR)', 'Total (INR)'].forEach((h, i) => {
      worksheet.getCell(currentRow, i + 1).value = h;
      worksheet.getCell(currentRow, i + 1).style = colHeaderStyle;
    });
    currentRow++;
    if (!otherRows.length) {
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'No bills found.';
      currentRow++;
    } else {
      for (const row of otherRows) {
        worksheet.addRow([
          formatISOToDDMMYYYY(row.dateISO),
          row.comment || '-',
          Number(row.amountInr || 0),
          Number(row.totalInr || 0)
        ]);
        currentRow++;
      }
    }
    worksheet.getCell(`C${currentRow}`).value = 'Total:';
    worksheet.getCell(`C${currentRow}`).font = { bold: true };
    worksheet.getCell(`D${currentRow}`).value = Number(otherTotal.toFixed(2));
    worksheet.getCell(`D${currentRow}`).font = { bold: true };
    currentRow += 2;

    worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `Grand Total: ${computedGrandTotal.toFixed(2)} INR`;
    worksheet.getCell(`A${currentRow}`).style = grandTotalStyle;

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="agent_bills_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAgentAllBills = async (req, res) => {
  try {
    const rawAgentId = String(req.query.agent_id || '').trim();
    let agentId = null;
    if (rawAgentId && rawAgentId.toLowerCase() !== 'all') {
      const parsedAgentId = toNumber(rawAgentId);
      if (!Number.isInteger(parsedAgentId) || parsedAgentId <= 0) {
        return res.status(400).json({ message: 'agent_id must be a positive integer or "all"' });
      }
      agentId = parsedAgentId;
    }
    const data = await billModel.getAgentAllBills(agentId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createBill = async (req, res) => {
  try {
    const {
      bill_date,
      group_id,
      bank_id,
      client_id,
      agent_id,
      amount,
      rate
    } = req.body || {};

    if (!bill_date || !group_id || !client_id || !agent_id || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date, group_id, client_id, agent_id and amount are required' });
    }

    const payload = {
      bill_date,
      group_id: toNumber(group_id),
      bank_id: bank_id === undefined || bank_id === null || bank_id === '' ? null : toNumber(bank_id),
      client_id: toNumber(client_id),
      agent_id: toNumber(agent_id),
      amount: toNumber(amount),
      rate: rate === undefined || rate === null || rate === '' ? null : toNumber(rate)
    };

    if (!Number.isFinite(payload.group_id) || !Number.isFinite(payload.client_id) || !Number.isFinite(payload.agent_id) || !Number.isFinite(payload.amount)) {
      return res.status(400).json({ message: 'Invalid numeric payload' });
    }
    if (payload.bank_id !== null && !Number.isFinite(payload.bank_id)) {
      return res.status(400).json({ message: 'Invalid bank_id' });
    }
    if (payload.rate !== null && !Number.isFinite(payload.rate)) {
      return res.status(400).json({ message: 'Invalid rate' });
    }

    const row = await billModel.createBill(payload);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const {
      bill_date,
      group_id,
      bank_id,
      client_id,
      agent_id,
      amount,
      rate
    } = req.body || {};

    if (!bill_date || !group_id || !client_id || !agent_id || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'bill_date, group_id, client_id, agent_id and amount are required' });
    }

    const payload = {
      bill_date,
      group_id: toNumber(group_id),
      bank_id: bank_id === undefined || bank_id === null || bank_id === '' ? null : toNumber(bank_id),
      client_id: toNumber(client_id),
      agent_id: toNumber(agent_id),
      amount: toNumber(amount),
      rate: rate === undefined || rate === null || rate === '' ? null : toNumber(rate)
    };

    const updated = await billModel.updateBill(id, payload);
    if (!updated) return res.status(404).json({ message: 'Bill not found' });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const id = toNumber(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid bill id' });
    }

    const deleted = await billModel.deleteBill(id);
    if (!deleted) return res.status(404).json({ message: 'Bill not found' });
    return res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.bulkUploadBills = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'File is required' });
    }

    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    } catch (_error) {
      return res.status(400).json({ message: 'Invalid file. Upload a valid CSV/XLS/XLSX file.' });
    }

    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: 'Uploaded file does not contain any sheet data' });
    }

    const sheet = workbook.Sheets[firstSheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!Array.isArray(matrix) || matrix.length < 2) {
      return res.status(400).json({ message: 'File must include a header row and at least one data row' });
    }

    const requiredColumns = ['Date', 'Group', 'Agent', 'Bank', 'Amount', 'Total'];
    const headerRow = (matrix[0] || []).map((v) => String(v || '').trim());
    const headerIndexByKey = new Map();
    headerRow.forEach((header, index) => {
      const key = normalizeKey(header);
      if (key) headerIndexByKey.set(key, index);
    });

    const missingColumns = requiredColumns.filter((col) => !headerIndexByKey.has(normalizeKey(col)));
    if (missingColumns.length) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    const dataRows = matrix
      .slice(1)
      .map((row, idx) => ({ row, rowNumber: idx + 2 }))
      .filter(({ row }) => Array.isArray(row) && row.some((cell) => String(cell || '').trim() !== ''));

    if (!dataRows.length) {
      return res.status(400).json({ message: 'No bill rows found in uploaded file' });
    }

    const lookup = await billModel.getBulkUploadLookupData();

    const groupsByName = new Map();
    for (const group of lookup.groups || []) {
      groupsByName.set(normalizeName(group.name), group);
    }

    const usersById = new Map();
    const agentsByName = new Map();
    for (const user of lookup.users || []) {
      usersById.set(Number(user.id), user);
      const nameKey = normalizeName(user.name);
      const role = String(user.role || '').trim().toLowerCase();
      if (!nameKey) continue;
      if (role === 'agent') {
        if (!agentsByName.has(nameKey)) agentsByName.set(nameKey, []);
        agentsByName.get(nameKey).push(user);
      }
    }

    const banksByName = new Map();
    for (const bank of lookup.banks || []) {
      banksByName.set(normalizeName(bank.bank_name), bank);
    }

    const groupRateMap = new Map();
    for (const row of lookup.groupBankRates || []) {
      groupRateMap.set(`${row.group_id}:${row.bank_id}`, Number(row.rate));
    }

    const getCell = (row, columnName) => {
      const idx = headerIndexByKey.get(normalizeKey(columnName));
      return idx === undefined ? '' : row[idx];
    };

    const rowsForInsert = [];
    const errors = [];

    for (const { row, rowNumber } of dataRows) {
      const rowErrors = [];
      const dateRaw = getCell(row, 'Date');
      const groupRaw = getCell(row, 'Group');
      const agentRaw = getCell(row, 'Agent');
      const bankRaw = getCell(row, 'Bank');
      const amountRaw = getCell(row, 'Amount');
      const totalRaw = getCell(row, 'Total');

      const billDate = parseDateToISO(dateRaw);
      if (!billDate) rowErrors.push('Date is invalid');

      const groupNameKey = normalizeName(groupRaw);
      const group = groupsByName.get(groupNameKey);
      if (!group) rowErrors.push(`Group not found: ${String(groupRaw || '').trim()}`);

      const groupOwnerId = group ? Number(group.owner) : NaN;
      const client = Number.isFinite(groupOwnerId) ? usersById.get(groupOwnerId) : null;
      if (!client) {
        rowErrors.push(`Client not found from group owner for group: ${String(groupRaw || '').trim()}`);
      } else if (String(client.role || '').trim().toLowerCase() !== 'client') {
        rowErrors.push(`Group owner must have role=Client for group: ${String(groupRaw || '').trim()}`);
      }

      const agentNameKey = normalizeName(agentRaw);
      const agentMatches = agentsByName.get(agentNameKey) || [];
      if (!agentMatches.length) {
        rowErrors.push(`Agent not found with role=Agent: ${String(agentRaw || '').trim()}`);
      } else if (agentMatches.length > 1) {
        rowErrors.push(`Multiple agents found with same name: ${String(agentRaw || '').trim()}`);
      }
      const agent = agentMatches[0];

      const source = group ? normalizeSource(group.type) : '';
      if (group && !source) {
        rowErrors.push(`Group type must be Claim or Depo: ${group.type || ''}`);
      }

      const amount = toNumber(amountRaw);
      if (!Number.isFinite(amount) || amount <= 0) {
        rowErrors.push('Amount must be a number greater than 0');
      }

      let bankId = null;
      let derivedRate = NaN;
      if (group) {
        const hasSameRate = group.same_rate !== null && group.same_rate !== undefined;
        const bankIsBlank = isBlankBank(bankRaw);
        const bankName = String(bankRaw || '').trim();
        let bank = null;

        if (!bankIsBlank) {
          bank = banksByName.get(normalizeName(bankName)) || null;
          if (!bank) rowErrors.push(`Bank not found: ${bankName}`);
        }

        if (hasSameRate) {
          const groupRate = Number(group.same_rate);
          if (!Number.isFinite(groupRate)) {
            rowErrors.push(`Group same_rate is invalid for group: ${group.name}`);
          } else {
            derivedRate = groupRate;
          }

          if (bank) {
            bankId = Number(bank.id);
          }
        } else {
          if (bankIsBlank) {
            rowErrors.push(`Bank is required for per-bank rate group: ${group.name}`);
          } else if (bank) {
            const groupBankRate = groupRateMap.get(`${group.id}:${bank.id}`);
            if (groupBankRate === undefined) {
              rowErrors.push(`Bank "${bank.bank_name}" is not configured in group_bank_rate for group "${group.name}"`);
            } else {
              bankId = Number(bank.id);
              derivedRate = Number(groupBankRate);
            }
          }
        }
      }

      if (!Number.isFinite(derivedRate) || derivedRate <= 0) {
        rowErrors.push('Rate could not be derived from group configuration');
      }

      const expectedTotal = Number((amount * derivedRate).toFixed(2));
      const totalIsBlank = String(totalRaw ?? '').trim() === '';
      if (!totalIsBlank) {
        const total = toNumber(totalRaw);
        if (!Number.isFinite(total) || total < 0) {
          rowErrors.push('Total must be a valid number');
        } else if (Number.isFinite(amount) && Number.isFinite(derivedRate)) {
          const providedTotal = Number(total.toFixed(2));
          if (Math.abs(providedTotal - expectedTotal) > 0.01) {
            rowErrors.push(`Total mismatch. Expected ${expectedTotal}, received ${providedTotal}`);
          }
        }
      }

      if (rowErrors.length) {
        errors.push({
          rowNumber,
          errors: rowErrors,
          row: {
            Date: dateRaw,
            Group: groupRaw,
            Agent: agentRaw,
            Bank: bankRaw,
            Amount: amountRaw,
            DerivedClient: client?.name || '',
            DerivedSource: source ? (source === 'depo' ? 'Depo' : 'Claim') : '',
            DerivedRate: Number.isFinite(derivedRate) ? derivedRate : '',
            Total: totalRaw
          }
        });
        continue;
      }

      rowsForInsert.push({
        bill_date: billDate,
        group_id: Number(group.id),
        bank_id: bankId,
        client_id: Number(client.id),
        agent_id: Number(agent.id),
        amount: Number(amount),
        rate: Number(derivedRate)
      });
    }

    if (errors.length) {
      return res.status(400).json({
        message: 'Bulk upload validation failed. No data was inserted.',
        totalRows: dataRows.length,
        failedRows: errors.length,
        errors
      });
    }

    const inserted = await billModel.createBillsBulk(rowsForInsert);

    return res.status(201).json({
      message: 'Bulk upload successful',
      totalRows: dataRows.length,
      failedRows: 0,
      insertedCount: inserted.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
