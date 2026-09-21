import { useSyncExternalStore } from "react";

export type Overlays = {
  aircraft: boolean;
  labels: boolean;
  rings: boolean;
  sweep: boolean;
  precip: boolean;
  nexrad: boolean;
  nexradSite: boolean;
  nexradVel: boolean;
  echoTops: boolean;
  mrms: boolean;
  clouds: boolean;
  metars: boolean;
  satelliteBase: boolean;
  roads: boolean;
  places: boolean;
  terrain: boolean;
  topo: boolean;
  rail: boolean;
  marine: boolean;
  counties: boolean;
  trails: boolean;
  temps: boolean;
  roadTraffic: boolean;
};

export type TrafficFilter = {
  hideGround: boolean;
  airliner: boolean;
  general: boolean;
  rotor: boolean;
};

export type DeckSettings = {
  radiusNm: number;
  overlays: Overlays;
  filter: TrafficFilter;
  precipOpacity: number;
  nexradOpacity: number;
  cloudOpacity: number;
};

export const DEFAULT_SETTINGS: DeckSettings = {
  radiusNm: 80,
  overlays: {
    aircraft: true,
    labels: true,
    rings: true,
    sweep: true,
    precip: true,
    nexrad: false,
    nexradSite: false,
    nexradVel: false,
    echoTops: false,
    mrms: false,
    clouds: true,
    metars: true,
    satelliteBase: false,
    roads: false,
    places: false,
    terrain: false,
    topo: false,
    rail: false,
    marine: false,
    counties: false,
    trails: false,
    temps: false,
    roadTraffic: false,
  },
  filter: {
    hideGround: true,
    airliner: true,
    general: true,
    rotor: true,
  },
  precipOpacity: 0.72,
  nexradOpacity: 0.55,
  cloudOpacity: 0.28,
};

const KEY = "cloud-deck-settings-v1";

function mergeSettings(raw: unknown): DeckSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
  const r = raw as Partial<DeckSettings>;
  return {
    radiusNm: clamp(r.radiusNm ?? DEFAULT_SETTINGS.radiusNm, 25, 250),
    overlays: { ...DEFAULT_SETTINGS.overlays, ...r.overlays },
    filter: { ...DEFAULT_SETTINGS.filter, ...r.filter },
    precipOpacity: clamp(
      r.precipOpacity ?? DEFAULT_SETTINGS.precipOpacity,
      0.15,
      1,
    ),
    nexradOpacity: clamp(
      r.nexradOpacity ?? DEFAULT_SETTINGS.nexradOpacity,
      0.15,
      1,
    ),
    cloudOpacity: clamp(
      r.cloudOpacity ?? DEFAULT_SETTINGS.cloudOpacity,
      0.1,
      1,
    ),
  };
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function readSettings(): DeckSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return mergeSettings(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let snapshot: DeckSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getDeckSettings(): DeckSettings {
  return snapshot;
}

export function hydrateDeckSettings() {
  snapshot = readSettings();
  emit();
}

export function patchDeckSettings(patch: Partial<DeckSettings>) {
  snapshot = mergeSettings({ ...snapshot, ...patch });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // private mode — keep in-memory
  }
  emit();
}

export function patchOverlays(patch: Partial<Overlays>) {
  patchDeckSettings({ overlays: { ...snapshot.overlays, ...patch } });
}

export function patchFilter(patch: Partial<TrafficFilter>) {
  patchDeckSettings({ filter: { ...snapshot.filter, ...patch } });
}

export function useDeckSettings(): DeckSettings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
    () => DEFAULT_SETTINGS,
  );
}
