import { createServerFn } from "@tanstack/react-start";
import { nearestAirports } from "@/lib/airports";
import { clampLatLon } from "@/lib/geo";

const UA =
  "CloudDeck/1.0 (west-coast sky viewer; https://grok.com; educational)";

export type Aircraft = {
  hex: string;
  callsign: string;
  registration: string;
  type: string;
  lat: number;
  lon: number;
  altitudeFt: number | "ground" | null;
  gsKt: number | null;
  trackDeg: number | null;
  baroRate: number | null;
  squawk: string;
  category: string;
  emergency: string;
  seenSec: number | null;
};

export type Metar = {
  icao: string;
  name: string;
  lat: number;
  lon: number;
  raw: string;
  tempC: number | null;
  dewpC: number | null;
  wdir: number | string | null;
  wspd: number | null;
  visib: string | number | null;
  cover: string;
  altim: number | null;
};

export type StationWeather = {
  label: string;
  tempC: number | null;
  windKt: number | null;
  windDir: number | null;
  visM: number | null;
  humidity: number | null;
  pressurePa: number | null;
  dewC: number | null;
  text: string;
  forecast: string;
  isDay: boolean | null;
};

export type RadarCatalog = {
  host: string;
  radarPath: string | null;
  radarTime: number | null;
};

export type RadarSite = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  refProduct?: string;
  velProduct?: string;
  refValid?: string | null;
  velValid?: string | null;
};

export type TrafficResult = {
  aircraft: Aircraft[];
  source: string;
  fetchedAt: number;
  error: string | null;
};

export type AtmosphereResult = {
  weather: StationWeather | null;
  metars: Metar[];
  taf: string | null;
  radar: RadarCatalog;
  radars: RadarSite[];
  fetchedAt: number;
  error: string | null;
};

export function fieldWeather(
  weather: StationWeather | null,
  metar: Metar | null,
): StationWeather | null {
  if (!weather && !metar) return null;
  const cover = metar?.cover && metar.cover !== "—" ? metar.cover : "";
  const windDir =
    typeof metar?.wdir === "number" ? metar.wdir : (weather?.windDir ?? null);
  return {
    label: weather?.label || metar?.name || "Station",
    tempC: metar?.tempC ?? weather?.tempC ?? null,
    windKt: metar?.wspd ?? weather?.windKt ?? null,
    windDir,
    visM: weather?.visM ?? null,
    humidity: weather?.humidity ?? null,
    pressurePa: weather?.pressurePa ?? null,
    dewC: metar?.dewpC ?? weather?.dewC ?? null,
    text: cover || weather?.text || "",
    forecast: weather?.forecast ?? "",
    isDay: weather?.isDay ?? null,
  };
}

export function nearestNexrad(sites: RadarSite[]): RadarSite | null {
  return sites.find((s) => s.type === "NEXRAD") ?? null;
}

export function scanAgeMin(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60_000));
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && v !== "ground") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function qty(v: unknown): number | null {
  if (!v || typeof v !== "object") return null;
  const val = (v as { value?: unknown }).value;
  return asNumber(val);
}

async function fetchJson(
  url: string,
  timeoutMs: number,
  headers: Record<string, string> = {},
): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/json", ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }
  return res.json();
}

function parseAircraft(raw: Record<string, unknown>): Aircraft | null {
  const lat = asNumber(raw.lat);
  const lon = asNumber(raw.lon);
  if (lat == null || lon == null) return null;
  const hex = String(raw.hex ?? "").toLowerCase();
  if (!hex) return null;
  const altRaw = raw.alt_baro;
  const altitudeFt: Aircraft["altitudeFt"] =
    altRaw === "ground" ? "ground" : asNumber(altRaw);
  return {
    hex,
    callsign: String(raw.flight ?? "").trim(),
    registration: String(raw.r ?? "").trim(),
    type: String(raw.t ?? "").trim(),
    lat,
    lon,
    altitudeFt,
    gsKt: asNumber(raw.gs),
    trackDeg: asNumber(raw.track),
    baroRate: asNumber(raw.baro_rate),
    squawk: String(raw.squawk ?? "").trim(),
    category: String(raw.category ?? "").trim(),
    emergency: String(raw.emergency ?? "").trim(),
    seenSec: asNumber(raw.seen_pos) ?? asNumber(raw.seen),
  };
}

async function pullAdsb(
  lat: number,
  lon: number,
  radiusNm: number,
): Promise<{ aircraft: Aircraft[]; source: string }> {
  const urls = [
    {
      source: "adsb.lol",
      url: `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radiusNm}`,
    },
    {
      source: "adsb.fi",
      url: `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${radiusNm}`,
    },
  ];
  for (const u of urls) {
    try {
      const json = (await fetchJson(u.url, 8000)) as { ac?: unknown[] };
      const list = Array.isArray(json.ac) ? json.ac : [];
      const aircraft = list
        .map((row) =>
          row && typeof row === "object"
            ? parseAircraft(row as Record<string, unknown>)
            : null,
        )
        .filter((a): a is Aircraft => a !== null);
      if (aircraft.length || u.source === "adsb.lol") {
        return { aircraft, source: u.source };
      }
    } catch {
      // try next
    }
  }
  throw new Error("Traffic feeds unavailable");
}

export const fetchTraffic = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = (input ?? {}) as {
      lat?: unknown;
      lon?: unknown;
      radiusNm?: unknown;
    };
    const lat = asNumber(d.lat);
    const lon = asNumber(d.lon);
    if (lat == null || lon == null) throw new Error("Invalid station");
    const pos = clampLatLon(lat, lon);
    return {
      lat: pos.lat,
      lon: pos.lon,
      radiusNm: Math.round(
        Math.min(250, Math.max(15, asNumber(d.radiusNm) ?? 80)),
      ),
    };
  })
  .handler(async ({ data }): Promise<TrafficResult> => {
    try {
      const pulled = await pullAdsb(data.lat, data.lon, data.radiusNm);
      return {
        aircraft: pulled.aircraft,
        source: pulled.source,
        fetchedAt: Date.now(),
        error: null,
      };
    } catch (err) {
      return {
        aircraft: [],
        source: "",
        fetchedAt: Date.now(),
        error: err instanceof Error ? err.message : "Traffic unavailable",
      };
    }
  });

async function pullWeather(lat: number, lon: number): Promise<StationWeather> {
  const points = (await fetchJson(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    8000,
    { accept: "application/geo+json" },
  )) as {
    properties?: {
      forecast?: string;
      observationStations?: string;
      relativeLocation?: { properties?: { city?: string; state?: string } };
    };
  };
  const props = points.properties ?? {};
  const loc = props.relativeLocation?.properties;
  const label = loc?.city
    ? `${loc.city}${loc.state ? `, ${loc.state}` : ""}`
    : "Station";

  let obs: Record<string, unknown> | null = null;
  if (props.observationStations) {
    const stations = (await fetchJson(props.observationStations, 8000, {
      accept: "application/geo+json",
    })) as {
      features?: Array<{
        properties?: { stationIdentifier?: string };
      }>;
    };
    const id = stations.features?.[0]?.properties?.stationIdentifier;
    if (id) {
      const latest = (await fetchJson(
        `https://api.weather.gov/stations/${id}/observations/latest`,
        8000,
        { accept: "application/geo+json" },
      )) as { properties?: Record<string, unknown> };
      obs = latest.properties ?? null;
    }
  }

  let forecast = "";
  if (props.forecast) {
    try {
      const fc = (await fetchJson(props.forecast, 8000, {
        accept: "application/geo+json",
      })) as {
        properties?: { periods?: Array<{ shortForecast?: string; name?: string }> };
      };
      const p = fc.properties?.periods?.[0];
      if (p?.shortForecast) {
        forecast = p.name ? `${p.name}: ${p.shortForecast}` : p.shortForecast;
      }
    } catch {
      forecast = "";
    }
  }

  const windKmh = qty(obs?.windSpeed);
  return {
    label,
    tempC: qty(obs?.temperature),
    windKt: windKmh == null ? null : windKmh / 1.852,
    windDir: qty(obs?.windDirection),
    visM: qty(obs?.visibility),
    humidity: qty(obs?.relativeHumidity),
    pressurePa: qty(obs?.barometricPressure),
    dewC: qty(obs?.dewpoint),
    text: String(obs?.textDescription ?? "").trim(),
    forecast,
    isDay: typeof obs?.isDaytime === "boolean" ? obs.isDaytime : null,
  };
}

function parseMetar(row: Record<string, unknown>): Metar | null {
  const icao = String(row.icaoId ?? "").trim();
  const lat = asNumber(row.lat);
  const lon = asNumber(row.lon);
  if (!icao || lat == null || lon == null) return null;
  return {
    icao,
    name: String(row.name ?? icao).trim(),
    lat,
    lon,
    raw: String(row.rawOb ?? "").trim(),
    tempC: asNumber(row.temp),
    dewpC: asNumber(row.dewp),
    wdir: (row.wdir as number | string | null) ?? null,
    wspd: asNumber(row.wspd),
    visib: (row.visib as string | number | null) ?? null,
    cover: String(row.cover ?? "").trim() || "—",
    altim: asNumber(row.altim),
  };
}

async function pullMetars(lat: number, lon: number): Promise<Metar[]> {
  const near = nearestAirports(lat, lon, 8, 220);
  if (!near.length) return [];
  const ids = near.map((a) => a.icao).join(",");
  const json = await fetchJson(
    `https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`,
    8000,
  );
  if (!Array.isArray(json)) return [];
  const byIcao = new Map<string, Metar>();
  for (const row of json) {
    if (row && typeof row === "object") {
      const m = parseMetar(row as Record<string, unknown>);
      if (m) byIcao.set(m.icao, m);
    }
  }
  return near.map((a) => byIcao.get(a.icao)).filter((m): m is Metar => !!m);
}

async function pullTaf(icao: string): Promise<string | null> {
  const json = await fetchJson(
    `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`,
    8000,
  );
  if (!Array.isArray(json) || !json[0] || typeof json[0] !== "object") {
    return null;
  }
  const raw = String(
    (json[0] as { rawTAF?: string }).rawTAF ?? "",
  ).trim();
  return raw || null;
}

async function pullRadar(): Promise<RadarCatalog> {
  const json = (await fetchJson(
    "https://api.rainviewer.com/public/weather-maps.json",
    6000,
  )) as {
    host?: string;
    radar?: { past?: Array<{ time?: number; path?: string }> };
  };
  const past = json.radar?.past ?? [];
  const last = past[past.length - 1];
  return {
    host: json.host || "https://tilecache.rainviewer.com",
    radarPath: last?.path ?? null,
    radarTime: last?.time ?? null,
  };
}

function parseRadarSite(row: unknown): RadarSite | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = String(r.id ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{3,8}$/.test(id)) return null;
  const lat = asNumber(r.lat);
  const lon = asNumber(r.lon);
  if (lat == null || lon == null) return null;
  return {
    id,
    name: String(r.name ?? id).trim() || id,
    lat,
    lon,
    type: String(r.type ?? "").trim() || "NEXRAD",
  };
}

async function pullNearbyRadars(lat: number, lon: number): Promise<RadarSite[]> {
  const json = (await fetchJson(
    `https://mesonet.agron.iastate.edu/json/radar.py?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&operation=available`,
    8000,
  )) as { radars?: unknown[] };
  const list = Array.isArray(json.radars) ? json.radars : [];
  const sites = list
    .map(parseRadarSite)
    .filter((s): s is RadarSite => s !== null);
  const i = sites.findIndex((s) => s.type === "NEXRAD");
  if (i < 0) return sites;
  try {
    sites[i] = await enrichSite(sites[i]);
  } catch {
    sites[i] = {
      ...sites[i],
      refProduct: "N0B",
      velProduct: "N0S",
    };
  }
  return sites;
}

const REF_PREF = ["N0B", "N0Q", "N0R"] as const;
const VEL_PREF = ["N0S", "N0U", "N0V"] as const;

function pickProduct(
  available: string[],
  pref: readonly string[],
  fallback: string,
) {
  return pref.find((p) => available.includes(p)) ?? fallback;
}

async function pullRidgeMeta(
  siteId: string,
  product: string,
): Promise<string | null> {
  const json = (await fetchJson(
    `https://mesonet.agron.iastate.edu/data/gis/images/4326/ridge/${siteId}/${product}_0.json`,
    5000,
  )) as { meta?: { valid?: unknown } };
  const valid = json.meta?.valid;
  return typeof valid === "string" && valid ? valid : null;
}

async function enrichSite(site: RadarSite): Promise<RadarSite> {
  let available: string[] = [];
  try {
    const json = (await fetchJson(
      `https://mesonet.agron.iastate.edu/json/radar.py?radar=${encodeURIComponent(site.id)}&operation=products`,
      6000,
    )) as { products?: Array<{ id?: unknown }> };
    available = (json.products ?? [])
      .map((p) => String(p.id ?? "").toUpperCase())
      .filter(Boolean);
  } catch {
    available = [];
  }
  const refProduct = pickProduct(available, REF_PREF, "N0B");
  const velProduct = pickProduct(available, VEL_PREF, "N0S");
  const [refMeta, velMeta] = await Promise.allSettled([
    pullRidgeMeta(site.id, refProduct),
    pullRidgeMeta(site.id, velProduct),
  ]);
  return {
    ...site,
    refProduct,
    velProduct,
    refValid: refMeta.status === "fulfilled" ? refMeta.value : null,
    velValid: velMeta.status === "fulfilled" ? velMeta.value : null,
  };
}

const EMPTY_RADAR: RadarCatalog = {
  host: "https://tilecache.rainviewer.com",
  radarPath: null,
  radarTime: null,
};

export const fetchAtmosphere = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = (input ?? {}) as { lat?: unknown; lon?: unknown };
    const lat = asNumber(d.lat);
    const lon = asNumber(d.lon);
    if (lat == null || lon == null) throw new Error("Invalid station");
    const pos = clampLatLon(lat, lon);
    return { lat: pos.lat, lon: pos.lon };
  })
  .handler(async ({ data }): Promise<AtmosphereResult> => {
    try {
      const [weatherSettled, metarsSettled, radarSettled, sitesSettled] =
        await Promise.allSettled([
          pullWeather(data.lat, data.lon),
          pullMetars(data.lat, data.lon),
          pullRadar(),
          pullNearbyRadars(data.lat, data.lon),
        ]);
      const weather =
        weatherSettled.status === "fulfilled" ? weatherSettled.value : null;
      const metars =
        metarsSettled.status === "fulfilled" ? metarsSettled.value : [];
      const radar =
        radarSettled.status === "fulfilled" ? radarSettled.value : EMPTY_RADAR;
      const radars =
        sitesSettled.status === "fulfilled" ? sitesSettled.value : [];
      let taf: string | null = null;
      if (metars[0]?.icao) {
        try {
          taf = await pullTaf(metars[0].icao);
        } catch {
          taf = null;
        }
      }
      const bits: string[] = [];
      if (weatherSettled.status === "rejected") bits.push("weather");
      if (metarsSettled.status === "rejected") bits.push("METAR");
      if (radarSettled.status === "rejected") bits.push("radar");
      return {
        weather,
        metars,
        taf,
        radar,
        radars,
        fetchedAt: Date.now(),
        error: bits.length ? `Partial: ${bits.join(", ")} missed` : null,
      };
    } catch (err) {
      return {
        weather: null,
        metars: [],
        taf: null,
        radar: EMPTY_RADAR,
        radars: [],
        fetchedAt: Date.now(),
        error: err instanceof Error ? err.message : "Atmosphere unavailable",
      };
    }
  });
