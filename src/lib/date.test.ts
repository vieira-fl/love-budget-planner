import { describe, expect, it } from 'bun:test';
import { parseLocalDate } from './date';

describe('parseLocalDate', () => {
  it('parses yyyy-MM-dd as a local date without shifting the day', () => {
    const parsed = parseLocalDate('2024-07-10');

    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(10);
  });

  it('ignores time portions in ISO strings', () => {
    const parsed = parseLocalDate('2024-07-10T00:00:00.000Z');

    expect(parsed.getFullYear()).toBe(2024);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(10);
  });
});
