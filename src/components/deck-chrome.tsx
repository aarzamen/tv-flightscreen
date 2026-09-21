import type { ReactNode } from "react";
import { Crosshair, LocateFixed, Minus, Plus, Settings2, X } from "lucide-react";
import type { Aircraft, Metar, RadarSite, StationWeather } from "@/lib/sky-data";
import type { RoadEvent } from "@/lib/road-traffic";
import {
  patchDeckSettings,
  patchFilter,
  patchOverlays,
  type DeckSettings,
} from "@/lib/settings";
import { STATION_PRESETS, airportByIcao } from "@/lib/airports";
import { bearingDeg, compass8, haversineNm, type LatLon } from "@/lib/geo";
import {
  formatAlt,
  formatClock,
  formatGs,
  formatNm,
  formatTempF,
  formatTrack,
  formatVisSm,
  metersToSm,
  vsLabel,
} from "@/lib/format";
import { typeLabel } from "@/lib/type-names";
import { altNumber, aircraftKind } from "@/lib/traffic-filter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/cn";

function RowToggle({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export function TopHud({
  label,
  weather,
  airborne,
  radiusNm,
  source,
  updatedAt,
  geoState,
  onOpenSettings,
  visFallback,
  radarNote,
}: {
  label: string;
  weather: StationWeather | null;
  visFallback?: string | number | null;
  airborne: number;
  radiusNm: number;
  source: string;
  updatedAt: number | null;
  geoState: "pending" | "live" | "default" | "denied";
  onOpenSettings: () => void;
  radarNote?: string | null;
}) {
  const wind =
    weather?.windKt != null
      ? `${weather.windDir != null ? compass8(weather.windDir) : ""} ${Math.round(weather.windKt)} kt`.trim()
      : "—";
  const visFromWx = metersToSm(weather?.visM ?? null);
  const vis = visFromWx != null ? formatVisSm(visFromWx) : formatVisSm(visFallback ?? null);
  const forecast = weather?.forecast?.trim() ?? "";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-start justify-between gap-3">
        <div className="deck-chrome min-w-0 rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-medium tracking-tight text-fg">
              Cloud Deck
            </h1>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {source ? `live · ${source}` : "west coast"}
            </span>
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-muted tabular-nums">
            {label}
            {geoState === "pending" ? " · locating" : null}
            {geoState === "denied" ? " · GPS off" : null}
            {" · "}
            {formatTempF(weather?.tempC ?? null)}
            {" · "}
            {wind}
            {" · "}
            {vis}
            {weather?.text ? ` · ${weather.text}` : null}
          </p>
          <p className="truncate font-mono text-xs text-subtle tabular-nums">
            {airborne} airborne · {radiusNm} nm
            {radarNote ? ` · ${radarNote}` : null}
            {updatedAt ? ` · ${formatClock(updatedAt)}` : null}
            {forecast ? ` · ${forecast}` : null}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="deck-persist bg-bg/80 backdrop-blur-sm"
          aria-label="Open settings"
          onClick={onOpenSettings}
        >
          <Settings2 className="size-5" />
        </Button>
      </div>
    </header>
  );
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onUseCenter,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onUseCenter: () => void;
}) {
  return (
    <div className="deck-chrome pointer-events-auto absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
      <Button size="icon" variant="ghost" className="bg-bg/80 backdrop-blur-sm" aria-label="Zoom in" onClick={onZoomIn}>
        <Plus className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" className="bg-bg/80 backdrop-blur-sm" aria-label="Zoom out" onClick={onZoomOut}>
        <Minus className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" className="bg-bg/80 backdrop-blur-sm" aria-label="Use my location" onClick={onLocate}>
        <LocateFixed className="size-5" />
      </Button>
      <Button size="icon" variant="ghost" className="bg-bg/80 backdrop-blur-sm" aria-label="Station on map center" onClick={onUseCenter}>
        <Crosshair className="size-5" />
      </Button>
    </div>
  );
}

export function SelectedCard({
  ac,
  origin,
  onClose,
}: {
  ac: Aircraft;
  origin: LatLon;
  onClose: () => void;
}) {
  const nm = haversineNm(origin, ac);
  const brg = bearingDeg(origin, ac);
  return (
    <article className="rounded-xl bg-bg/88 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {aircraftKind(ac)}
          </p>
          <h2 className="truncate text-xl font-medium tracking-tight">
            {ac.callsign || ac.registration || ac.hex.toUpperCase()}
          </h2>
          <p className="text-sm text-muted">{typeLabel(ac.type)}</p>
        </div>
        <Button size="icon" variant="quiet" aria-label="Clear selection" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs tabular-nums sm:grid-cols-4">
        <Stat k="Altitude" v={formatAlt(ac.altitudeFt)} />
        <Stat k="Groundspeed" v={formatGs(ac.gsKt)} />
        <Stat k="Track" v={formatTrack(ac.trackDeg)} />
        <Stat k="Vertical" v={vsLabel(ac.baroRate)} />
        <Stat k="Distance" v={formatNm(nm)} />
        <Stat k="Bearing" v={`${Math.round(brg).toString().padStart(3, "0")}° ${compass8(brg)}`} />
        <Stat k="Squawk" v={ac.squawk || "—"} />
        <Stat k="Tail" v={ac.registration || ac.hex.toUpperCase()} />
      </dl>
    </article>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-subtle">{k}</dt>
      <dd className="text-fg">{v}</dd>
    </div>
  );
}

export function TrafficStrip({
  aircraft,
  origin,
  radiusNm,
  selectedHex,
  onSelect,
}: {
  aircraft: Aircraft[];
  origin: LatLon;
  radiusNm: number;
  selectedHex: string | null;
  onSelect: (hex: string) => void;
}) {
  const maxAlt = 45000;
  return (
    <div className="rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
      <div className="mb-1 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span>Profile · dist / alt</span>
        <span>FL450</span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-sm bg-surface">
        {[0.25, 0.5, 0.75].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 border-t border-border"
            style={{ top: `${(1 - f) * 100}%` }}
          />
        ))}
        {aircraft.slice(0, 80).map((ac) => {
          const nm = haversineNm(origin, ac);
          const x = Math.min(1, nm / Math.max(radiusNm, 1));
          const y = 1 - Math.min(1, altNumber(ac) / maxAlt);
          const on = ac.hex === selectedHex;
          return (
            <button
              key={ac.hex}
              type="button"
              aria-label={ac.callsign || ac.hex}
              onClick={() => onSelect(ac.hex)}
              className={cn(
                "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                on ? "bg-fg" : "bg-accent/80",
              )}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs text-subtle">
        <span>station</span>
        <span>{radiusNm} nm</span>
      </div>
    </div>
  );
}

export function MetarStrip({ metars }: { metars: Metar[] }) {
  if (!metars.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
      <div className="flex gap-4">
        {metars.map((m) => (
          <div key={m.icao} className="min-w-40 shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {m.icao} · {m.cover}
            </p>
            <p className="font-mono text-xs text-fg tabular-nums">
              {formatTempF(m.tempC)} · {typeof m.wdir === "number" ? compass8(m.wdir) : m.wdir ?? "VRB"}{" "}
              {m.wspd ?? "—"} kt · {formatVisSm(m.visib)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoadStrip({ events }: { events: RoadEvent[] }) {
  if (!events.length) return null;
  const accidents = events.filter((e) => e.kind === "accident").length;
  const hazards = events.filter((e) => e.kind === "hazard").length;
  const closures = events.filter((e) => e.kind === "closure").length;
  const bits: string[] = [];
  if (accidents) bits.push(`${accidents} accident${accidents === 1 ? "" : "s"}`);
  if (hazards) bits.push(`${hazards} hazard${hazards === 1 ? "" : "s"}`);
  if (closures) bits.push(`${closures} closure${closures === 1 ? "" : "s"}`);
  return (
    <p className="px-1 font-mono text-xs text-muted">
      Roads · {bits.join(" · ") || `${events.length} events`}
    </p>
  );
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onPreset,
  onResetDefaults,
  taf,
  radarSite,
}: {
  open: boolean;
  onClose: () => void;
  settings: DeckSettings;
  onPreset: (lat: number, lon: number, label: string) => void;
  onResetDefaults: () => void;
  taf: string | null;
  radarSite?: RadarSite | null;
}) {
  if (!open) return null;
  const o = settings.overlays;
  const f = settings.filter;
  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-surface px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-border)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Scope</h2>
          <Button size="icon" variant="quiet" aria-label="Close settings" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <p className="mb-5 text-sm text-muted">
          Defaults stay a dark sky. Extra layers are optional clutter — they
          persist on this device, no account. Public ADS-B, NOAA GOES-West,
          NEXRAD RIDGE, MRMS, RainViewer, Aviation Weather, Esri, OSM, USGS.
          Sign-up not required.
        </p>

        {taf ? (
          <Section title="Nearest TAF">
            <p className="py-1 font-mono text-xs leading-relaxed text-muted">{taf}</p>
          </Section>
        ) : null}

        <Section title="Range">
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>25 nm</span>
            <span className="text-fg tabular-nums">{settings.radiusNm} nm</span>
            <span>250 nm</span>
          </div>
          <Slider
            min={25}
            max={250}
            step={5}
            value={[settings.radiusNm]}
            onValueChange={(v) => patchDeckSettings({ radiusNm: v[0] ?? 80 })}
          />
        </Section>

        <Section title="Station presets">
          <div className="flex flex-wrap gap-2">
            {STATION_PRESETS.map((p) => {
              const ap = airportByIcao(p.icao);
              if (!ap) return null;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="h-11 rounded-md bg-surface-2 px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  onClick={() => onPreset(ap.lat, ap.lon, p.label)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Base map">
          <RowToggle
            label="Satellite photo"
            hint="Esri imagery under the overlays"
            checked={o.satelliteBase}
            onCheckedChange={(v) => patchOverlays({ satelliteBase: v })}
          />
          <RowToggle
            label="USGS topo"
            hint="National Map — covers the base while on"
            checked={o.topo}
            onCheckedChange={(v) => patchOverlays({ topo: v })}
          />
        </Section>

        <Section title="Ground · optional clutter">
          <p className="mb-2 text-xs text-muted">
            Google-style flow coloring is not a public tile. Live traffic plots
            CHP incidents and Caltrans lane closures. Streets is the road
            network. Choices stay on this device.
          </p>
          <RowToggle
            label="Live traffic"
            hint="CHP incidents and Caltrans lane closures"
            checked={o.roadTraffic}
            onCheckedChange={(v) => patchOverlays({ roadTraffic: v })}
          />
          <RowToggle
            label="Streets"
            hint="Esri transportation, not live congestion colors"
            checked={o.roads}
            onCheckedChange={(v) => patchOverlays({ roads: v })}
          />
          <RowToggle
            label="Places & names"
            hint="Boundaries and city labels — useful on satellite"
            checked={o.places}
            onCheckedChange={(v) => patchOverlays({ places: v })}
          />
          <RowToggle
            label="Terrain"
            hint="Dark hillshade"
            checked={o.terrain}
            onCheckedChange={(v) => patchOverlays({ terrain: v })}
          />
          <RowToggle
            label="Rail"
            hint="OpenRailwayMap"
            checked={o.rail}
            onCheckedChange={(v) => patchOverlays({ rail: v })}
          />
          <RowToggle
            label="Marine marks"
            hint="OpenSeaMap beacons, lights, traffic lanes"
            checked={o.marine}
            onCheckedChange={(v) => patchOverlays({ marine: v })}
          />
          <RowToggle
            label="County & state lines"
            hint="IEM cartography"
            checked={o.counties}
            onCheckedChange={(v) => patchOverlays({ counties: v })}
          />
          <RowToggle
            label="Trails"
            hint="Hiking and cycling, Waymarked Trails"
            checked={o.trails}
            onCheckedChange={(v) => patchOverlays({ trails: v })}
          />
          <RowToggle
            label="Station temperatures"
            hint="METAR chips in Fahrenheit"
            checked={o.temps}
            onCheckedChange={(v) => patchOverlays({ temps: v })}
          />
        </Section>

        <Section title="Weather">
          <RowToggle
            label="Precipitation"
            hint="RainViewer — blank when nothing is falling"
            checked={o.precip}
            onCheckedChange={(v) => patchOverlays({ precip: v })}
          />
          <OpacityRow
            label="Precip opacity"
            value={settings.precipOpacity}
            onChange={(n) => patchDeckSettings({ precipOpacity: n })}
          />
          <RowToggle
            label="NEXRAD mosaic"
            hint="CONUS composite — blank in the dry, falls off past zoom 8"
            checked={o.nexrad}
            onCheckedChange={(v) => patchOverlays({ nexrad: v })}
          />
          <RowToggle
            label="Nearest WSR-88D"
            hint={
              radarSite
                ? `Super-res reflectivity · ${radarSite.id} ${radarSite.name}`
                : "Super-res reflectivity from the nearest WSR-88D"
            }
            checked={o.nexradSite}
            onCheckedChange={(v) => patchOverlays({ nexradSite: v })}
          />
          <RowToggle
            label="Velocity"
            hint={
              radarSite
                ? `Storm-relative velocity · ${radarSite.id} — inbound / outbound, storm motion subtracted`
                : "Storm-relative velocity from the nearest WSR-88D"
            }
            checked={o.nexradVel}
            onCheckedChange={(v) => patchOverlays({ nexradVel: v })}
          />
          <RowToggle
            label="Echo tops"
            hint="CONUS storm height — blank in the dry"
            checked={o.echoTops}
            onCheckedChange={(v) => patchOverlays({ echoTops: v })}
          />
          <RowToggle
            label="MRMS hybrid scan"
            hint="Seamless HSR — paints where rain is, empty over dry air"
            checked={o.mrms}
            onCheckedChange={(v) => patchOverlays({ mrms: v })}
          />
          <OpacityRow
            label="Radar opacity"
            value={settings.nexradOpacity}
            onChange={(n) => patchDeckSettings({ nexradOpacity: n })}
          />
          <RowToggle
            label="Clouds"
            hint="GOES-West IR cloud tops — clear air stays dark"
            checked={o.clouds}
            onCheckedChange={(v) => patchOverlays({ clouds: v })}
          />
          <OpacityRow
            label="Cloud opacity"
            value={settings.cloudOpacity}
            onChange={(n) => patchDeckSettings({ cloudOpacity: n })}
          />
          <RowToggle
            label="METAR flags"
            hint="Nearest west-coast fields"
            checked={o.metars}
            onCheckedChange={(v) => patchOverlays({ metars: v })}
          />
        </Section>

        <Section title="Traffic">
          <RowToggle
            label="Aircraft"
            checked={o.aircraft}
            onCheckedChange={(v) => patchOverlays({ aircraft: v })}
          />
          <RowToggle
            label="Callsigns"
            checked={o.labels}
            onCheckedChange={(v) => patchOverlays({ labels: v })}
          />
          <RowToggle
            label="Range rings"
            checked={o.rings}
            onCheckedChange={(v) => patchOverlays({ rings: v })}
          />
          <RowToggle
            label="Sweep"
            hint="Decorative scope arm"
            checked={o.sweep}
            onCheckedChange={(v) => patchOverlays({ sweep: v })}
          />
          <RowToggle
            label="Hide ground"
            checked={f.hideGround}
            onCheckedChange={(v) => patchFilter({ hideGround: v })}
          />
          <RowToggle
            label="Airliners"
            checked={f.airliner}
            onCheckedChange={(v) => patchFilter({ airliner: v })}
          />
          <RowToggle
            label="General aviation"
            checked={f.general}
            onCheckedChange={(v) => patchFilter({ general: v })}
          />
          <RowToggle
            label="Rotor"
            checked={f.rotor}
            onCheckedChange={(v) => patchFilter({ rotor: v })}
          />
        </Section>

        <Button variant="ghost" className="mt-4" onClick={onResetDefaults}>
          Restore default overlays
        </Button>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
        {title}
      </h3>
      <div className="rounded-lg bg-bg px-3 py-2 shadow-[var(--shadow-border)]">{children}</div>
    </section>
  );
}

function OpacityRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="py-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <Slider
        min={0.1}
        max={1}
        step={0.05}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}
