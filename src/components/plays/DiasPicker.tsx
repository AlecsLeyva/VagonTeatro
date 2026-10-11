import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { WEEK_DAYS, type DiasValue, type WeekDayKey } from "@/lib/dias";

interface DiasPickerProps {
  value: DiasValue;
  onChange: (value: DiasValue) => void;
  disabled?: boolean;
}

export function DiasPicker({ value, onChange, disabled }: DiasPickerProps) {
  function toggleDay(key: WeekDayKey) {
    const has = value.days.includes(key);
    const days = has
      ? value.days.filter((d) => d !== key)
      : WEEK_DAYS.map((d) => d.key).filter(
          (d) => value.days.includes(d) || d === key,
        );
    onChange({ ...value, days });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {WEEK_DAYS.map((day) => {
          const active = value.days.includes(day.key);
          return (
            <button
              key={day.key}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => toggleDay(day.key)}
              className={cn(
                "group flex flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-primary/60 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-warm"
                  : "border-input bg-background/60 text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="text-sm font-semibold">{day.short}</span>
              <span
                className={cn(
                  "text-[10px] font-normal",
                  active ? "opacity-80" : "opacity-70",
                )}
              >
                {day.long}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="dias-start"
            className="text-xs font-medium text-muted-foreground"
          >
            Hora de inicio
          </label>
          <Input
            id="dias-start"
            type="time"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="dias-end"
            className="text-xs font-medium text-muted-foreground"
          >
            Hora de fin
          </label>
          <Input
            id="dias-end"
            type="time"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
