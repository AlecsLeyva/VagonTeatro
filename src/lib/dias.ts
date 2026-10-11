export type WeekDayKey = "lun" | "mar" | "mie" | "jue";

export const WEEK_DAYS: { key: WeekDayKey; short: string; long: string }[] = [
  { key: "lun", short: "Lun", long: "Lunes" },
  { key: "mar", short: "Mar", long: "Martes" },
  { key: "mie", short: "Mié", long: "Miércoles" },
  { key: "jue", short: "Jue", long: "Jueves" },
];

export interface DiasValue {
  days: WeekDayKey[];
  start: string;
  end: string;
}

export const EMPTY_DIAS: DiasValue = { days: [], start: "", end: "" };

const DAY_ALIASES: Record<string, WeekDayKey> = {
  lun: "lun",
  lunes: "lun",
  mar: "mar",
  martes: "mar",
  mie: "mie",
  miercoles: "mie",
  jue: "jue",
  jueves: "jue",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseDias(value: string | null | undefined): DiasValue {
  if (!value) return { ...EMPTY_DIAS };
  const found = new Set<WeekDayKey>();
  for (const token of normalize(value).split(/[^a-z]+/)) {
    const key = DAY_ALIASES[token];
    if (key) found.add(key);
  }
  const time = value.match(
    /(\d{1,2}:\d{2})\s*(?:-|–|—|a|to)\s*(\d{1,2}:\d{2})/i,
  );
  return {
    days: WEEK_DAYS.map((d) => d.key).filter((k) => found.has(k)),
    start: time ? time[1] : "",
    end: time ? time[2] : "",
  };
}

export function serializeDias(value: DiasValue): string {
  const parts: string[] = [];
  if (value.days.length > 0) {
    parts.push(
      value.days
        .map((key) => WEEK_DAYS.find((d) => d.key === key)?.short ?? key)
        .join(", "),
    );
  }
  if (value.start && value.end) {
    parts.push(`${value.start}-${value.end}`);
  } else if (value.start) {
    parts.push(value.start);
  }
  return parts.join(" · ");
}
