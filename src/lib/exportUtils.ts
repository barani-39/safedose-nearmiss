/**
 * Reusable CSV Sanitization & Export Utilities
 * 
 * Provides OWASP CWE-1236 Formula Injection protection for browser and node runtimes.
 */

export function sanitizeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);

  // Check dangerous leading characters (=, +, -, @, tab, CR)
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  let safeStr = str;
  if (dangerousPrefixes.some((p) => safeStr.startsWith(p))) {
    safeStr = `'` + safeStr;
  }

  // Quote if contains commas, double quotes, or newlines
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
