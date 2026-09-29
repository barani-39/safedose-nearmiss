import { describe, it, expect } from 'vitest';
import { sanitizeCSVValue, buildCSV } from '../scripts/export-evaluation-results';

describe('CSV Sanitization & Formula Injection Protection (CWE-1236)', () => {
  it('neutralizes dangerous formula injection prefixes by prefixing with a single quote', () => {
    expect(sanitizeCSVValue('=1+1')).toBe(`'=1+1`);
    expect(sanitizeCSVValue('+cmd|/c calc')).toBe(`'+cmd|/c calc`);
    expect(sanitizeCSVValue('-2+3')).toBe(`'-2+3`);
    expect(sanitizeCSVValue('@SUM(A1:A10)')).toBe(`'@SUM(A1:A10)`);
    expect(sanitizeCSVValue('\tcmd')).toBe(`'\tcmd`);
    expect(sanitizeCSVValue('\rpayload')).toBe(`"'\rpayload"`);
  });

  it('preserves benign strings without dangerous prefixes', () => {
    expect(sanitizeCSVValue('SafeDose NearMiss')).toBe('SafeDose NearMiss');
    expect(sanitizeCSVValue('ICU Ward')).toBe('ICU Ward');
    expect(sanitizeCSVValue(42)).toBe('42');
    expect(sanitizeCSVValue(null)).toBe('');
    expect(sanitizeCSVValue(undefined)).toBe('');
  });

  it('escapes and quotes values containing commas and quotation marks', () => {
    expect(sanitizeCSVValue('High Workload, Distraction')).toBe('"High Workload, Distraction"');
    expect(sanitizeCSVValue('Patient said "ouch"')).toBe('"Patient said ""ouch"""');
  });

  it('escapes and quotes dangerous formulas that also contain commas', () => {
    expect(sanitizeCSVValue('=HYPERLINK("http://attacker.com", "Click")')).toBe(
      `"'=HYPERLINK(""http://attacker.com"", ""Click"")"`
    );
  });

  it('builds a sanitized CSV string with headers and multiple rows', () => {
    const headers = ['id', 'description', 'formula_attempt'];
    const rows = [
      { id: '1', description: 'Normal event', formula_attempt: '=cmd|' },
      { id: '2', description: 'Another event, with comma', formula_attempt: '+SUM' },
    ];
    const csv = buildCSV(headers, rows);
    expect(csv).toContain(`id,description,formula_attempt`);
    expect(csv).toContain(`1,Normal event,'=cmd|`);
    expect(csv).toContain(`2,"Another event, with comma",'+SUM`);
  });
});
