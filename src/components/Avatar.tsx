import { initials } from "@/lib/profile";

/**
 * A member's face: the uploaded photo when there is one, otherwise the chosen
 * emoji avatar over a rose wash. Used in the sidebar, preview cards and admin.
 */
export default function Avatar({
  name,
  photo,
  emoji,
  size = 40,
  rounded = "full",
  className = "",
  ring = true,
}: {
  name: string;
  photo?: string | null;
  emoji?: string;
  size?: number;
  rounded?: "full" | "2xl";
  className?: string;
  ring?: boolean;
}) {
  const shape = rounded === "full" ? "rounded-full" : "rounded-2xl";
  const ringCls = ring ? "ring-2 ring-rose-100" : "";
  if (photo) {
    // A data URL from the browser — plain <img> keeps the demo dependency-free.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photo}
        alt={`${name}'s profile photo`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`shrink-0 object-cover ${shape} ${ringCls} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * (emoji ? 0.5 : 0.36)) }}
      className={`grid shrink-0 place-items-center bg-gradient-to-br from-rose-100 to-fuchsia-100 font-semibold text-rose-700 ${shape} ${ringCls} ${className}`}
    >
      {emoji && emoji.trim() ? emoji : initials(name)}
    </span>
  );
}
