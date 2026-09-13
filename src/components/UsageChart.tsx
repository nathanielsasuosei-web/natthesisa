import { DayUsage } from "@/lib/store";

interface Props {
  history: DayUsage[];
  max: number;
}

export default function UsageChart({ history, max }: Props) {
  return (
    <div className="mt-4 flex h-32 items-end gap-2">
      {history.map((h) => (
        <div key={h.date} className="group relative flex h-full flex-1 flex-col justify-end">
          <div
            className="rounded-t-md bg-rose-500/80 transition group-hover:bg-rose-600"
            style={{ height: `${Math.max((h.count / max) * 100, 4)}%` }}
          />
          <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
            {h.count}
          </span>
        </div>
      ))}
    </div>
  );
}
