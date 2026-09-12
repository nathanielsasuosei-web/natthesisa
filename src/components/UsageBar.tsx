interface Props {
  value: number;
  max: number | null;
  tone?: "indigo" | "emerald";
}

export default function UsageBar({ value, max, tone = "indigo" }: Props) {
  const pct = max === null ? 6 : Math.min(100, Math.round((value / max) * 100));
  const nearLimit = max !== null && pct >= 80;
  return (
    <div className="h-2 rounded-full bg-slate-200">
      <div
        className={[
          "h-2 rounded-full transition-all",
          tone === "emerald"
            ? "bg-emerald-500"
            : nearLimit
              ? "bg-amber-500"
              : "bg-indigo-500",
        ].join(" ")}
        style={{ width: `${max === 0 ? 0 : pct}%` }}
      />
    </div>
  );
}
