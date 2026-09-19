import type { DayUsage } from "@/lib/store";
import { fmtDayKey } from "@/lib/format";

interface Props {
  history: DayUsage[];
  max?: number;
  showLabels?: boolean;
}

export default function UsageChart({ history, max, showLabels = true }: Props) {
  const ceiling = max ?? Math.max(...history.map((day) => day.count), 1);
  return (
    <div className="flex h-36 items-end gap-2.5 sm:gap-3">
      {history.map((day, index) => {
        const active = index === history.length - 1;
        return (
          <div key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex w-full flex-1 items-end justify-center">
              <span className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-md bg-[#1b1822] px-2 py-1 text-[9px] font-bold text-white shadow-lg group-hover:block">{day.count} min</span>
              <div className={`w-full max-w-8 rounded-t-[7px] transition group-hover:opacity-80 ${active ? "bg-[#6d4aff]" : "bg-[#d7cff9]"}`} style={{ height: `${Math.max((day.count / Math.max(ceiling, 1)) * 100, 5)}%` }} />
            </div>
            {showLabels && <span className={`text-[9px] font-bold ${active ? "text-[#5d3ce1]" : "text-[#a09aa6]"}`}>{fmtDayKey(day.date).slice(0, 1)}</span>}
          </div>
        );
      })}
    </div>
  );
}
