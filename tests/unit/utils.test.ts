import { cn, formatCurrency, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });
});

describe('formatCurrency', () => {
  it('formats BRL by default', () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain('1.234,50');
  });

  it('formats USD when specified', () => {
    const result = formatCurrency(1234.5, 'USD');
    expect(result).toContain('1.234,50');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });
});

describe('formatDate', () => {
  const date = new Date(2025, 0, 15); // Jan 15, 2025

  it('formats short date', () => {
    expect(formatDate(date)).toBe('15/01/2025');
  });

  it('formats long date', () => {
    const result = formatDate(date, 'long');
    expect(result).toContain('2025');
    expect(result).toContain('15');
  });
});
