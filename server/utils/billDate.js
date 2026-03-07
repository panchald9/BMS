function pad2(value) {
  return String(value).padStart(2, '0');
}

function toISODateLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeDateToISO(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toISODateLocal(value);
  }

  const input = String(value || '').trim();
  if (!input) return '';

  const strictISO = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (strictISO) {
    const year = Number(strictISO[1]);
    const month = Number(strictISO[2]);
    const day = Number(strictISO[3]);
    const date = new Date(year, month - 1, day);
    if (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return toISODateLocal(date);
    }
    return '';
  }

  const ddmmyyyy = input.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    const date = new Date(year, month - 1, day);
    if (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return toISODateLocal(date);
    }
    return '';
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return '';
  return toISODateLocal(parsed);
}

function validateBillDateInput(value) {
  const normalized = normalizeDateToISO(value);
  if (!normalized) {
    return { ok: false, message: 'Invalid bill_date. Use a valid date.' };
  }

  const today = toISODateLocal(new Date());
  if (normalized > today) {
    return { ok: false, message: 'bill_date cannot be in the future' };
  }

  return { ok: true, value: normalized };
}

module.exports = {
  validateBillDateInput,
  normalizeDateToISO
};
