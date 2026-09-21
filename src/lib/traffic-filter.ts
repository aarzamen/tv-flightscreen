import type { Aircraft } from "@/lib/sky-data";
import type { TrafficFilter } from "@/lib/settings";

export function aircraftKind(ac: Aircraft): "rotor" | "airliner" | "general" {
  const cat = ac.category.toUpperCase();
  if (cat === "A7") return "rotor";
  if (cat === "A3" || cat === "A4" || cat === "A5") return "airliner";
  return "general";
}

export function passesFilter(ac: Aircraft, filter: TrafficFilter): boolean {
  const ground =
    ac.altitudeFt === "ground" ||
    (typeof ac.altitudeFt === "number" &&
      ac.altitudeFt < 80 &&
      (ac.gsKt ?? 0) < 40);
  if (filter.hideGround && ground) return false;
  const kind = aircraftKind(ac);
  if (kind === "airliner") return filter.airliner;
  if (kind === "rotor") return filter.rotor;
  return filter.general;
}

export function altNumber(ac: Aircraft): number {
  if (ac.altitudeFt === "ground") return 0;
  return typeof ac.altitudeFt === "number" ? ac.altitudeFt : 0;
}
