interface Props {
  variant?: "full" | "subtle";
}

export default function AnimatedBackground({ variant = "full" }: Props) {
  const subtle = variant === "subtle";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {!subtle && <div className="bg-grid animate-grid-pan absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_0%,transparent_70%)]" />}
      <div className={`animate-blob absolute -left-40 -top-48 size-[38rem] rounded-full blur-3xl ${subtle ? "bg-violet-200/25" : "bg-violet-300/35"}`} />
      <div className={`animate-blob absolute -right-40 top-16 size-[34rem] rounded-full blur-3xl ${subtle ? "bg-orange-100/35" : "bg-orange-200/40"}`} style={{ animationDelay: "-10s" }} />
      {!subtle && <div className="animate-blob absolute left-[38%] top-[44rem] size-[30rem] rounded-full bg-cyan-100/45 blur-3xl" style={{ animationDelay: "-18s" }} />}
    </div>
  );
}
