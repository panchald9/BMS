function pad2(value) {
  return String(value).padStart(2, "0");
}

export function todayISO() {
  const now = new Date();
  return dateToISO(now);
}

export function dateToISO(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function isoToDate(iso) {
  if (!iso) return null;
  if (iso instanceof Date) {
    if (Number.isNaN(iso.getTime())) return null;
    return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
  }
  if (typeof iso !== "string") return null;

  // Fast path for YYYY-MM-DD.
  const strict = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (strict) {
    const year = Number(strict[1]);
    const month = Number(strict[2]);
    const day = Number(strict[3]);
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return null;
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  }

  // Fallback: accept ISO datetime values like 2026-02-22T00:00:00.000Z.
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatDateDDMMYYYY(iso) {
  const d = isoToDate(iso);
  if (!d) return "";
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function parseDDMMYYYYToISO(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }

  return dateToISO(d);
}

export function startOfWeekISO(iso = todayISO()) {
  const d = isoToDate(iso);
  if (!d) return "";
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  return dateToISO(start);
}

export function endOfWeekISO(iso = todayISO()) {
  const start = isoToDate(startOfWeekISO(iso));
  if (!start) return "";
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return dateToISO(end);
}

export function startOfMonthISO(iso = todayISO()) {
  const d = isoToDate(iso);
  if (!d) return "";
  return dateToISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonthISO(iso = todayISO()) {
  const d = isoToDate(iso);
  if (!d) return "";
  return dateToISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
