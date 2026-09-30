/**
 * Reusable CSV Sanitization & Export Utilities
 * 
 * Provides OWASP CWE-1236 Formula Injection protection for browser and node runtimes.
 * 
 * SANITIZATION STRATEGY:
 * 1. Empty / Nil handling: null and undefined return empty string "".
 * 2. Pure Numeric Values: Legitimate negative and positive numbers (e.g. -5, -12.5, "-42")
 *    are recognized and preserved without prepending single quotes.
 * 3. Formula Injection Defense: If a string begins with dangerous prefix characters
 *    (=, +, -, @, \t, \r) or leading whitespace followed by these characters,
 *    and is NOT a pure finite number, it is safely prepended with a single quote (').
 * 4. RFC-4180 Escaping: Any value containing commas, double quotes, carriage returns,
 *    or newlines is wrapped in double quotes, with internal quotes escaped as "".
 * 5. Unicode Integrity: Multi-byte UTF-8 characters (e.g. £, €, ©, clinical glyphs)
 *    are preserved intact.
 */

export function sanitizeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '';

  // Direct numeric primitive handling
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '';
  }

  const str = String(val);
  if (str.length === 0) return '';

  // Check if string is a legitimate pure numeric value (including negative numbers e.g. -5, -12.5)
  const isPureNumber = /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(str.trim());

  let safeStr = str;
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];

  if (
    dangerousPrefixes.some((p) => str.startsWith(p)) ||
    dangerousPrefixes.some((p) => str.trimStart().startsWith(p))
  ) {
    // If it's a legitimate numeric negative/positive number, preserve it
    if (!isPureNumber) {
      safeStr = `'` + safeStr;
    }
  }

  // Quote if contains commas, double quotes, or newlines per RFC 4180
  if (safeStr.includes(',') || safeStr.includes('"') || safeStr.includes('\n') || safeStr.includes('\r')) {
    safeStr = `"${safeStr.replace(/"/g, '""')}"`;
  }

  return safeStr;
}

export function buildCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(sanitizeCSVValue).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => sanitizeCSVValue(row[h])).join(',')
  );
  return [headerLine, ...rowLines].join('\n');
}

export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
