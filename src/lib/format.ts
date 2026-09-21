export function formatAlt(alt: number | "ground" | null): string {
  if (alt === "ground" || alt === 0) return "GND";
  if (alt == null || !Number.isFinite(alt)) return "—";
  if (alt >= 18000) return `FL${String(Math.round(alt / 100)).padStart(3, "0")}`;
  return `${Math.round(alt).toLocaleString("en-US")} ft`;
}

export function formatGs(kt: number | null): string {
  if (kt == null || !Number.isFinite(kt)) return "—";
  return `${Math.round(kt)} kt`;
}

export function formatTrack(deg: number | null): string {
  if (deg == null || !Number.isFinite(deg)) return "—";
  return `${Math.round(deg).toString().padStart(3, "0")}°`;
}

export function formatNm(nm: number): string {
  if (!Number.isFinite(nm)) return "—";
  if (nm < 10) return `${nm.toFixed(1)} nm`;
  return `${Math.round(nm)} nm`;
}

export function formatTempF(celsius: number | null): string {
  if (celsius == null || !Number.isFinite(celsius)) return "—";
  return `${Math.round((celsius * 9) / 5 + 32)}°`;
}

export function msToKt(ms: number | null): number | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  return ms * 1.943844;
}

export function kmhToKt(kmh: number | null): number | null {
  if (kmh == null || !Number.isFinite(kmh)) return null;
  return kmh / 1.852;
}

export function metersToSm(m: number | null): number | null {
  if (m == null || !Number.isFinite(m)) return null;
  return m / 1609.344;
}

export function formatVisSm(sm: number | null | string): string {
  if (typeof sm === "string") {
    if (sm.endsWith("+")) return `${sm.replace("+", "")}+ SM`;
    return `${sm} SM`;
  }
  if (sm == null || !Number.isFinite(sm)) return "—";
  if (sm >= 10) return "10+ SM";
  return `${sm < 1 ? sm.toFixed(1) : Math.round(sm * 10) / 10} SM`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function vsLabel(fpm: number | null): string {
  if (fpm == null || !Number.isFinite(fpm) || Math.abs(fpm) < 80) return "level";
  const mag = Math.round(Math.abs(fpm) / 50) * 50;
  return fpm > 0 ? `↑ ${mag} fpm` : `↓ ${mag} fpm`;
}
