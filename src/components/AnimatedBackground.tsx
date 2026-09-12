interface Props {
  /** "full" = grid + three vivid blobs (marketing pages); "subtle" = soft wash (app) */
  variant?: "full" | "subtle";
}

/**
 * Fixed, GPU-friendly animated backdrop: slowly drifting gradient blobs
 * over a panning grid. Pure CSS — no JS, respects prefers-reduced-motion.
 */
export default function AnimatedBackground({ variant = "full" }: Props) {
  const subtle = variant === "subtle";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {!subtle && (
        <div className="bg-grid animate-grid-pan absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_15%,transparent_75%)]" />
      )}

      <div
        className={`animate-blob absolute -top-44 left-[5%] size-[38rem] rounded-full blur-3xl ${
          subtle
            ? "bg-indigo-300/20"
            : "bg-gradient-to-br from-indigo-400/45 via-indigo-300/25 to-transparent"
        }`}
      />
      <div
        className={`animate-blob absolute top-[10%] right-[1%] size-[32rem] rounded-full blur-3xl ${
          subtle ? "bg-fuchsia-300/15" : "bg-gradient-to-br from-fuchsia-400/35 via-fuchsia-300/15 to-transparent"
        }`}
        style={{ animationDelay: "-9s" }}
      />
      {!subtle && (
        <div
          className="animate-blob absolute top-[55%] left-[28%] size-[34rem] rounded-full bg-gradient-to-br from-cyan-300/30 via-emerald-200/15 to-transparent blur-3xl"
          style={{ animationDelay: "-17s" }}
        />
      )}
    </div>
  );
}
