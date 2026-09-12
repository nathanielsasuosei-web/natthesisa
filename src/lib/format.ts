/** Deterministic date/money formatting shared by server & client renders. */
import { site } from "@/config/site";

export function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function fmtDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function fmtMoney(n: number): string {
  return `${site.currency.symbol}${n.toLocaleString("en-US")}`;
}

export function fmtDayKey(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${key}T00:00:00Z`));
}
