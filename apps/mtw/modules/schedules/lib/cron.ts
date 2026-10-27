// A tiny 5-field cron parser (no dependency). Local time. Fields: minute hour day-of-month month day-of-week.
// Supports *, lists (1,15), ranges (1-5), steps (*/10, 1-30/5, 5/15) and month/weekday names (jan, mon). Day-of-week 0 and 7 are Sunday.
// As in Vixie cron: when both day-of-month and day-of-week are restricted, a day matches if EITHER does.

export interface CronSpec {
  source: string;
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
  /** The field began with `*`, so it does not restrict the day. */
  domAny: boolean;
  dowAny: boolean;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface FieldDef {
  label: string;
  min: number;
  max: number;
  names?: string[];
  /** Index of names[0] as a number. */
  nameBase?: number;
}

const FIELDS: FieldDef[] = [
  { label: 'minute', min: 0, max: 59 },
  { label: 'hour', min: 0, max: 23 },
  { label: 'day of month', min: 1, max: 31 },
  { label: 'month', min: 1, max: 12, names: MONTHS, nameBase: 1 },
  { label: 'day of week', min: 0, max: 7, names: DAYS, nameBase: 0 },
];

function num(token: string, f: FieldDef): number {
  const lower = token.toLowerCase();
  if (f.names) {
    const i = f.names.indexOf(lower);
    if (i >= 0) return i + (f.nameBase ?? 0);
  }
  if (!/^\d+$/.test(token)) throw new Error(`${f.label}: "${token}" is not a number${f.names ? ' or name' : ''}`);
  const n = Number(token);
  if (n < f.min || n > f.max) throw new Error(`${f.label}: ${n} is outside ${f.min}-${f.max}`);
  return n;
}

function parseField(text: string, f: FieldDef): Set<number> {
  const out = new Set<number>();
  if (!text) throw new Error(`${f.label}: empty`);
  for (const part of text.split(',')) {
    if (!part) throw new Error(`${f.label}: empty list item`);
    const [range, stepText, extra] = part.split('/');
    if (extra !== undefined) throw new Error(`${f.label}: more than one "/" in "${part}"`);
    let step = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) throw new Error(`${f.label}: step "${stepText}" must be 1 or more`);
      step = Number(stepText);
    }
    let lo: number;
    let hi: number;
    if (range === '*') {
      lo = f.min;
      hi = f.max;
    } else if ((range as string).includes('-')) {
      const [a, b, more] = (range as string).split('-');
      if (more !== undefined || a === undefined || b === undefined) throw new Error(`${f.label}: bad range "${range}"`);
      lo = num(a, f);
      hi = num(b, f);
      if (lo > hi) throw new Error(`${f.label}: range ${a}-${b} runs backwards`);
    } else {
      lo = num(range as string, f);
      hi = stepText !== undefined ? f.max : lo;
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

/** Throws an Error whose message names the field at fault. */
export function parseCron(expr: string): CronSpec {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron needs 5 fields (minute hour day-of-month month day-of-week), got ${parts[0] === '' ? 0 : parts.length}`);
  const [mi, ho, dom, mo, dow] = parts as [string, string, string, string, string];
  const dowSet = parseField(dow, FIELDS[4] as FieldDef);
  if (dowSet.has(7)) {
    dowSet.delete(7);
    dowSet.add(0);
  }
  return {
    source: parts.join(' '),
    minutes: parseField(mi, FIELDS[0] as FieldDef),
    hours: parseField(ho, FIELDS[1] as FieldDef),
    daysOfMonth: parseField(dom, FIELDS[2] as FieldDef),
    months: parseField(mo, FIELDS[3] as FieldDef),
    daysOfWeek: dowSet,
    domAny: dom.startsWith('*'),
    dowAny: dow.startsWith('*'),
  };
}

export function validateCron(expr: string): string | null {
  try {
    parseCron(expr);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

function dayMatches(spec: CronSpec, d: Date): boolean {
  const dom = spec.daysOfMonth.has(d.getDate());
  const dow = spec.daysOfWeek.has(d.getDay());
  if (spec.domAny && spec.dowAny) return true;
  if (spec.domAny) return dow;
  if (spec.dowAny) return dom;
  return dom || dow;
}

/** Does this cron fire in the minute containing `d` (local time)? */
export function cronMatches(spec: CronSpec, d: Date): boolean {
  return spec.minutes.has(d.getMinutes()) && spec.hours.has(d.getHours()) && spec.months.has(d.getMonth() + 1) && dayMatches(spec, d);
}

/** The first firing strictly after `after` (local time), or null if none within five years. */
export function nextRun(spec: CronSpec, after: Date): Date | null {
  const d = new Date(after.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const limit = after.getTime() + 5 * 366 * 24 * 60 * 60 * 1000;
  for (let guard = 0; guard < 200000 && d.getTime() <= limit; guard++) {
    if (!spec.months.has(d.getMonth() + 1)) {
      d.setTime(new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0).getTime());
      continue;
    }
    if (!dayMatches(spec, d)) {
      d.setTime(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0).getTime());
      continue;
    }
    if (!spec.hours.has(d.getHours())) {
      d.setTime(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 0).getTime());
      continue;
    }
    if (!spec.minutes.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1);
      continue;
    }
    return d;
  }
  return null;
}

export function nextRuns(spec: CronSpec, after: Date, count: number): Date[] {
  const out: Date[] = [];
  let from = after;
  for (let i = 0; i < count; i++) {
    const n = nextRun(spec, from);
    if (!n) break;
    out.push(n);
    from = n;
  }
  return out;
}
