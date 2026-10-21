import { describe, it, expect } from 'vitest';
import { formatCurrency, formatRelativeTime } from '../utils/format';

describe('formatCurrency', () => {
  it('correctly formats integer money into IDR format', () => {
    const formatted = formatCurrency(1250000);
    // Should contain Rp and 1.250.000
    expect(formatted).toContain('Rp');
    expect(formatted.replace(/\s/g, '')).toContain('1.250.000');
  });

  it('formats zero correctly', () => {
    const formatted = formatCurrency(0);
    expect(formatted).toContain('0');
  });
});

describe('formatRelativeTime', () => {
  it('returns Never for null date', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });

  it('returns Just now for recent date', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });
});