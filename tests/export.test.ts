import { describe, it, expect } from 'vitest';
import { sanitizeCSVValue, buildCSV } from '../src/lib/exportUtils';

describe('CSV Sanitization & Formula Injection Protection (CWE-1236)', () => {
  describe('Dangerous formula injection prefixes', () => {
    it('neutralizes dangerous formula injection prefixes by prefixing with a single quote', () => {
      expect(sanitizeCSVValue('=1+1')).toBe(`'=1+1`);
      expect(sanitizeCSVValue('+cmd|/c calc')).toBe(`'+cmd|/c calc`);
      expect(sanitizeCSVValue('-2+3+cmd')).toBe(`'-2+3+cmd`);
      expect(sanitizeCSVValue('@SUM(A1:A10)')).toBe(`'@SUM(A1:A10)`);
      expect(sanitizeCSVValue('\tcmd')).toBe(`'\tcmd`);
      expect(sanitizeCSVValue('\rpayload')).toBe(`"'\rpayload"`);
    });

    it('neutralizes formulas with leading whitespace', () => {
      expect(sanitizeCSVValue('  =cmd|/c calc')).toBe(`'  =cmd|/c calc`);
      expect(sanitizeCSVValue('\t=1+1')).toBe(`'\t=1+1`);
    });

    it('escapes and quotes dangerous formulas that also contain commas and quotes', () => {
      expect(sanitizeCSVValue('=HYPERLINK("http://attacker.com", "Click")')).toBe(
        `"'=HYPERLINK(""http://attacker.com"", ""Click"")"`
      );
    });
  });

  describe('Legitimate negative & positive numeric preservation', () => {
    it('does NOT corrupt legitimate numeric negative values', () => {
      // Primitive numbers
      expect(sanitizeCSVValue(-5)).toBe('-5');
      expect(sanitizeCSVValue(-12.5)).toBe('-12.5');
      expect(sanitizeCSVValue(-0.001)).toBe('-0.001');

      // Numeric strings
      expect(sanitizeCSVValue('-42')).toBe('-42');
      expect(sanitizeCSVValue('-72.2')).toBe('-72.2');
      expect(sanitizeCSVValue('+100')).toBe('+100');
      expect(sanitizeCSVValue('-1e5')).toBe('-1e5');
    });

    it('preserves standard positive numbers and decimals', () => {
      expect(sanitizeCSVValue(0)).toBe('0');
      expect(sanitizeCSVValue(42)).toBe('42');
      expect(sanitizeCSVValue(99.9)).toBe('99.9');
      expect(sanitizeCSVValue('123.45')).toBe('123.45');
    });
  });

  describe('RFC-4180 Escaping, Quotes, Newlines, and Unicode', () => {
    it('handles quotes, commas, and newlines properly', () => {
      expect(sanitizeCSVValue('High Workload, Distraction')).toBe('"High Workload, Distraction"');
      expect(sanitizeCSVValue('Patient said "ouch"')).toBe('"Patient said ""ouch"""');
      expect(sanitizeCSVValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
      expect(sanitizeCSVValue('Line 1\r\nLine 2')).toBe('"Line 1\r\nLine 2"');
    });

    it('preserves multi-byte Unicode and clinical symbols without corruption', () => {
      expect(sanitizeCSVValue('SafeDose™ NearMiss')).toBe('SafeDose™ NearMiss');
      expect(sanitizeCSVValue('Dose: 50µg β-blocker')).toBe('Dose: 50µg β-blocker');
      expect(sanitizeCSVValue('Total cost: £450.00')).toBe('Total cost: £450.00');
      expect(sanitizeCSVValue('Patient records: 醫院 (Hospital)')).toBe('Patient records: 醫院 (Hospital)');
    });

    it('handles empty, null, and undefined values cleanly', () => {
      expect(sanitizeCSVValue('')).toBe('');
      expect(sanitizeCSVValue(null)).toBe('');
      expect(sanitizeCSVValue(undefined)).toBe('');
    });
  });

  describe('CSV Row & Header Building', () => {
    it('builds a sanitized CSV string with headers and multiple rows', () => {
      const headers = ['id', 'delta_percentage', 'description', 'formula_attempt'];
      const rows = [
        { id: '1', delta_percentage: -72.2, description: 'Normal event', formula_attempt: '=cmd|' },
        { id: '2', delta_percentage: -15.0, description: 'Another event, with comma', formula_attempt: '+SUM' },
      ];
      const csv = buildCSV(headers, rows);
      expect(csv).toContain('id,delta_percentage,description,formula_attempt');
      expect(csv).toContain("1,-72.2,Normal event,'=cmd|");
      expect(csv).toContain('2,-15,"Another event, with comma",\'+SUM');
    });
  });
});
