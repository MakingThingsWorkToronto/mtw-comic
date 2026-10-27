import { describe, expect, it } from 'vitest';
import { cronMatches, nextRun, nextRuns, parseCron, validateCron } from '../modules/schedules/lib/cron';

// 2026-10-09 is a Friday. All times are local, like the parser.
const at = (y: number, mo: number, d: number, h = 0, mi = 0): Date => new Date(y, mo - 1, d, h, mi, 0, 0);
const iso = (d: Date | null): string => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : 'none');

describe('parseCron', () => {
  it('parses stars, lists, ranges and steps', () => {
    const c = parseCron('*/15 9-17 1,15 * 1-5');
    expect([...c.minutes]).toEqual([0, 15, 30, 45]);
    expect(c.hours.size).toBe(9);
    expect([...c.daysOfMonth]).toEqual([1, 15]);
    expect(c.months.size).toBe(12);
    expect([...c.daysOfWeek]).toEqual([1, 2, 3, 4, 5]);
  });

  it('accepts names, a start-with-step, and 7 as Sunday', () => {
    const c = parseCron('5/20 6 * jan-mar,dec mon,SUN');
    expect([...c.minutes]).toEqual([5, 25, 45]);
    expect([...c.months]).toEqual([1, 2, 3, 12]);
    expect([...c.daysOfWeek].sort()).toEqual([0, 1]);
    expect([...parseCron('0 0 * * 7').daysOfWeek]).toEqual([0]);
  });

  it('names the field at fault', () => {
    expect(validateCron('* * * *')).toMatch(/5 fields/);
    expect(validateCron('* * * * * *')).toMatch(/5 fields/);
    expect(validateCron('60 * * * *')).toMatch(/minute: 60 is outside 0-59/);
    expect(validateCron('0 24 * * *')).toMatch(/hour/);
    expect(validateCron('0 0 0 * *')).toMatch(/day of month/);
    expect(validateCron('0 0 * 13 *')).toMatch(/month/);
    expect(validateCron('0 0 * * 8')).toMatch(/day of week/);
    expect(validateCron('*/0 * * * *')).toMatch(/step/);
    expect(validateCron('5-1 * * * *')).toMatch(/backwards/);
    expect(validateCron('a * * * *')).toMatch(/not a number/);
    expect(validateCron('1,,2 * * * *')).toMatch(/empty list item/);
    expect(validateCron('0 7 * * 1')).toBeNull();
    expect(validateCron('')).toMatch(/5 fields/);
  });
});

describe('cronMatches', () => {
  it('matches the weekly Journal slot only on Monday 07:00', () => {
    const c = parseCron('0 7 * * 1');
    expect(cronMatches(c, at(2026, 10, 12, 7, 0))).toBe(true);
    expect(cronMatches(c, at(2026, 10, 12, 7, 1))).toBe(false);
    expect(cronMatches(c, at(2026, 10, 13, 7, 0))).toBe(false);
    expect(cronMatches(c, at(2026, 10, 12, 8, 0))).toBe(false);
  });

  it('treats day-of-month and day-of-week as OR when both are restricted', () => {
    const c = parseCron('0 0 13 * 5');
    expect(cronMatches(c, at(2026, 10, 13))).toBe(true); // the 13th (a Tuesday)
    expect(cronMatches(c, at(2026, 10, 16))).toBe(true); // a Friday
    expect(cronMatches(c, at(2026, 10, 14))).toBe(false);
  });

  it('uses AND when one of them is a star', () => {
    const c = parseCron('0 0 * * 5');
    expect(cronMatches(c, at(2026, 10, 9))).toBe(true);
    expect(cronMatches(c, at(2026, 10, 10))).toBe(false);
  });
});

describe('nextRun', () => {
  it('finds the next weekly slot', () => {
    expect(iso(nextRun(parseCron('0 7 * * 1'), at(2026, 10, 9, 12, 0)))).toBe('2026-10-12 07:00');
  });

  it('is strictly after the starting minute', () => {
    expect(iso(nextRun(parseCron('0 7 * * 1'), at(2026, 10, 12, 7, 0)))).toBe('2026-10-19 07:00');
    expect(iso(nextRun(parseCron('*/15 * * * *'), at(2026, 10, 9, 10, 7)))).toBe('2026-10-09 10:15');
    expect(iso(nextRun(parseCron('*/15 * * * *'), at(2026, 10, 9, 10, 15)))).toBe('2026-10-09 10:30');
  });

  it('rolls over days, months and years', () => {
    expect(iso(nextRun(parseCron('30 23 * * *'), at(2026, 12, 31, 23, 45)))).toBe('2027-01-01 23:30');
    expect(iso(nextRun(parseCron('0 0 1 1 *'), at(2026, 10, 9)))).toBe('2027-01-01 00:00');
    expect(iso(nextRun(parseCron('0 6 31 * *'), at(2026, 11, 1)))).toBe('2026-12-31 06:00');
  });

  it('finds a leap day', () => {
    expect(iso(nextRun(parseCron('0 0 29 2 *'), at(2026, 3, 1)))).toBe('2028-02-29 00:00');
  });

  it('honours the OR rule when searching', () => {
    expect(iso(nextRun(parseCron('0 0 13 * 5'), at(2026, 10, 9, 12, 0)))).toBe('2026-10-13 00:00');
  });

  it('returns null for a date that never happens', () => {
    expect(nextRun(parseCron('0 0 31 2 *'), at(2026, 1, 1))).toBeNull();
  });

  it('lists successive runs', () => {
    expect(nextRuns(parseCron('0 7 * * 1'), at(2026, 10, 9), 3).map(iso)).toEqual(['2026-10-12 07:00', '2026-10-19 07:00', '2026-10-26 07:00']);
  });
});
