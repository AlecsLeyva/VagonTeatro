import { parseDias, WEEK_DAYS, type WeekDayKey } from "./dias";

type AnyDayKey = WeekDayKey | "vie" | "sab" | "dom";

const DAY_SEQUENCE: AnyDayKey[] = [
  "lun",
  "mar",
  "mie",
  "jue",
  "vie",
  "sab",
  "dom",
];

const DAY_ALIASES: Record<string, AnyDayKey> = {
  lun: "lun",
  lunes: "lun",
  mar: "mar",
  martes: "mar",
  mie: "mie",
  miercoles: "mie",
  jue: "jue",
  jueves: "jue",
  vie: "vie",
  viernes: "vie",
  sab: "sab",
  sabado: "sab",
  dom: "dom",
  domingo: "dom",
};

/** Códigos cortos usados en rangos como "L-V", "Lun-Jue" o "L a V". */
const RANGE_CODES: Record<string, AnyDayKey> = {
  l: "lun",
  lu: "lun",
  m: "mar",
  ma: "mar",
  mi: "mie",
  j: "jue",
  ju: "jue",
  v: "vie",
  vi: "vie",
  s: "sab",
  sa: "sab",
  d: "dom",
  do: "dom",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isPlayDay(key: AnyDayKey): key is WeekDayKey {
  return (WEEK_DAYS as { key: string }[]).some((day) => day.key === key);
}

/**
 * Extrae los días de la semana que menciona un texto libre de horario
 * (por ejemplo los `horario_clases` de un actor: "Lunes y miércoles 07:00-09:00"
 * o "L-V 08:00 a 12:00"). Devuelve solo los días Lun-Jue, que son los usados
 * por los ensayos. Es una detección best-effort.
 */
export function extractWeekDays(text: string | null | undefined): WeekDayKey[] {
  if (!text) return [];
  const norm = normalize(text);
  const found = new Set<WeekDayKey>();

  for (const token of norm.split(/[^a-z]+/)) {
    const key = DAY_ALIASES[token];
    if (key && isPlayDay(key)) found.add(key);
  }

  const rangeRegex =
    /([a-z]{1,9})\s*(?:-|–|—|\ba\b|\bal\b|\bto\b)\s*([a-z]{1,9})/g;
  let match: RegExpExecArray | null;
  while ((match = rangeRegex.exec(norm)) !== null) {
    const from = RANGE_CODES[match[1]] ?? DAY_ALIASES[match[1]];
    const to = RANGE_CODES[match[2]] ?? DAY_ALIASES[match[2]];
    if (!from || !to) continue;
    const start = DAY_SEQUENCE.indexOf(from);
    const end = DAY_SEQUENCE.indexOf(to);
    if (start === -1 || end === -1 || start > end) continue;
    for (let i = start; i <= end; i += 1) {
      const key = DAY_SEQUENCE[i];
      if (isPlayDay(key)) found.add(key);
    }
  }

  return WEEK_DAYS.map((day) => day.key).filter((key) => found.has(key));
}

/**
 * Indica si los días de ensayo de una obra (`dias_asignados`) chocan con el
 * horario de clases de un actor (`horario_clases`). Sin días de ensayo o sin
 * horario registrado se considera que no hay conflicto.
 */
export function hasScheduleConflict(
  diasAsignados: string | null | undefined,
  horarioClases: string | null | undefined,
): boolean {
  const playDays = parseDias(diasAsignados).days;
  if (playDays.length === 0) return false;
  const classDays = extractWeekDays(horarioClases);
  if (classDays.length === 0) return false;
  return playDays.some((day) => classDays.includes(day));
}
