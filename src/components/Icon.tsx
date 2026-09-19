import type { SVGProps } from "react";

export type IconName =
  | "arrow-right" | "arrow-left" | "check" | "play" | "clock" | "users" | "star"
  | "book" | "code" | "mobile" | "cpu" | "server" | "browser" | "lock" | "search"
  | "chart" | "home" | "courses" | "progress" | "card" | "user" | "logout" | "admin"
  | "flame" | "target" | "trophy" | "download" | "calendar" | "chevron-right"
  | "chevron-down" | "spark" | "shield" | "globe" | "terminal" | "close" | "menu"
  | "settings" | "bell" | "mail" | "layers" | "certificate" | "briefcase" | "pause";

const PATHS: Record<IconName, string> = {
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5m6 6-6-6 6-6",
  check: "m5 12 4 4L19 6",
  play: "M8 5v14l11-7z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  star: "m12 3 2.8 5.67 6.26.91-4.53 4.42 1.07 6.24L12 17.77 6.4 20.7l1.07-6.24L2.94 9.58l6.26-.91L12 3Z",
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z",
  code: "m8 9-3 3 3 3m8-6 3 3-3 3m-2-9-4 12",
  mobile: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2",
  cpu: "M9 9h6v6H9zM4 9h2m-2 6h2m12-6h2m-2 6h2M9 4v2m6-2v2M9 18v2m6-2v2M7 7h10v10H7z",
  server: "M4 4h16v6H4V4Zm0 10h16v6H4v-6ZM8 7h.01M8 17h.01M12 7h5m-5 10h5",
  browser: "M3 5h18v14H3V5Zm0 4h18M7 7h.01M10 7h.01",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3",
  search: "m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  chart: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  home: "m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z",
  courses: "M4 4h6v7H4V4Zm10 0h6v7h-6V4ZM4 15h6v5H4v-5Zm10 0h6v5h-6v-5Z",
  progress: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  card: "M3 6h18v12H3V6Zm0 4h18M7 15h4",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  logout: "M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7",
  admin: "m12 3 8 4v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V7l8-4Zm-3 9 2 2 4-5",
  flame: "M12 22c4 0 7-2.6 7-6.5 0-2.2-1.1-4.4-3.4-6.5.1 2-1 3.2-2 3.8.4-4.3-2.1-7.5-5.2-10.8.2 3.4-2.4 5.7-3.1 8.5C4 14 6.1 22 12 22Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v5m-4 2h8",
  download: "M12 3v12m0 0 5-5m-5 5-5-5M4 19h16",
  calendar: "M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  "chevron-right": "m9 18 6-6-6-6",
  "chevron-down": "m6 9 6 6 6-6",
  spark: "m12 2 1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z",
  shield: "m12 3 8 4v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V7l8-4Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2 0 3.5-4 3.5-9S14 3 12 3s-3.5 4-3.5 9S10 21 12 21ZM3 12h18",
  terminal: "m5 7 4 4-4 4m6 0h8",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6L16.5 7.5m-9 9L6 18m12 0-1.5-1.5m-9-9L6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5m-18 5 9 5 9-5",
  certificate: "M7 3h10v12H7V3Zm3 12-2 7 4-2 4 2-2-7M10 7h4m-4 4h4",
  briefcase: "M9 6V4h6v2m-11 0h16v14H4V6Zm0 5h16M9 11v2h6v-2",
  pause: "M8 5v14m8-14v14",
};

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 20, className = "", ...props }: Props) {
  const filled = name === "star" || name === "play";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
