import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RadarMap, type RadarHandle } from "@/components/radar-map";
import {
  MapControls,
  MetarStrip,
  RoadStrip,
  SelectedCard,
  SettingsPanel,
  TopHud,
  TrafficStrip,
} from "@/components/deck-chrome";
import { VENTURA, type LatLon } from "@/lib/geo";
import {
  DEFAULT_SETTINGS,
  hydrateDeckSettings,
  patchDeckSettings,
  useDeckSettings,
} from "@/lib/settings";
import {
  fetchAtmosphere,
  fetchTraffic,
  fieldWeather,
  nearestNexrad,
  scanAgeMin,
  type Aircraft,
  type AtmosphereResult,
  type TrafficResult,
} from "@/lib/sky-data";
import { passesFilter } from "@/lib/traffic-filter";
import {
  fetchRoadTraffic,
  type RoadTrafficResult,
} from "@/lib/road-traffic";
import { useIdleChrome } from "@/lib/use-idle";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const settings = useDeckSettings();
  const mapRef = useRef<RadarHandle>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [origin, setOrigin] = useState<LatLon>(VENTURA);
  const [label, setLabel] = useState(VENTURA.label);
  const [geoState, setGeoState] = useState<"pending" | "live" | "default" | "denied">(
    "pending",
  );
  const [traffic, setTraffic] = useState<TrafficResult | null>(null);
  const [atmo, setAtmo] = useState<AtmosphereResult | null>(null);
  const [roads, setRoads] = useState<RoadTrafficResult | null>(null);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const idle = useIdleChrome(4800, settingsOpen);

  useEffect(() => {
    hydrateDeckSettings();
    setClientReady(true);
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setOrigin(next);
        setLabel("Your position");
        setGeoState("live");
        mapRef.current?.flyTo(next.lat, next.lon);
      },
      () => {
        setGeoState((g) => (g === "live" ? g : "denied"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    locate();
    const t = window.setTimeout(() => {
      setGeoState((g) => (g === "pending" ? "default" : g));
    }, 9000);
    return () => window.clearTimeout(t);
  }, [locate]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetchTraffic({
          data: {
            lat: origin.lat,
            lon: origin.lon,
            radiusNm: settings.radiusNm,
          },
        });
        if (!cancelled) setTraffic(res);
      } catch {
        if (!cancelled) {
          setTraffic({
            aircraft: [],
            source: "",
            fetchedAt: Date.now(),
            error: "Traffic unavailable",
          });
        }
      }
    };
    pull();
    const id = window.setInterval(pull, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [origin.lat, origin.lon, settings.radiusNm]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetchAtmosphere({
          data: { lat: origin.lat, lon: origin.lon },
        });
        if (!cancelled) {
          setAtmo(res);
          if (res.weather?.label) {
            setLabel((current) =>
              current === VENTURA.label && geoState !== "live"
                ? res.weather!.label
                : current,
            );
          }
        }
      } catch {
        if (!cancelled) {
          setAtmo({
            weather: null,
            metars: [],
            taf: null,
            radar: {
              host: "https://tilecache.rainviewer.com",
              radarPath: null,
              radarTime: null,
            },
            radars: [],
            fetchedAt: Date.now(),
            error: "Atmosphere unavailable",
          });
        }
      }
    };
    pull();
    const wantRadar =
      settings.overlays.nexradSite ||
      settings.overlays.nexradVel ||
      settings.overlays.nexrad;
    const id = window.setInterval(pull, wantRadar ? 60_000 : 180_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [
    origin.lat,
    origin.lon,
    geoState,
    settings.overlays.nexradSite,
    settings.overlays.nexradVel,
    settings.overlays.nexrad,
  ]);

  useEffect(() => {
    if (!settings.overlays.roadTraffic) {
      setRoads(null);
      return;
    }
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetchRoadTraffic({
          data: {
            lat: origin.lat,
            lon: origin.lon,
            radiusNm: settings.radiusNm,
          },
        });
        if (!cancelled) setRoads(res);
      } catch {
        if (!cancelled) {
          setRoads({
            events: [],
            source: "",
            fetchedAt: Date.now(),
            error: "Road traffic unavailable",
          });
        }
      }
    };
    pull();
    const id = window.setInterval(pull, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [origin.lat, origin.lon, settings.radiusNm, settings.overlays.roadTraffic]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (window as any).tvBridge = {
      snapHome: () => {
        mapRef.current?.flyTo(origin.lat, origin.lon);
      },
      pan: (dx: number, dy: number) => {
        (window as any)._leafletMap?.panBy?.([dx, dy]);
      },
      zoomIn: () => {
        mapRef.current?.zoomIn();
      },
      zoomOut: () => {
        mapRef.current?.zoomOut();
      },
      selectNext: () => {
        const list = traffic?.aircraft ?? [];
        if (!list.length) return;
        const currIdx = list.findIndex((a) => a.hex === selectedHex);
        const next = list[(currIdx + 1) % list.length];
        if (next) setSelectedHex(next.hex);
      },
      deselect: () => {
        setSelectedHex(null);
      },
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedHex(null);
      } else if (e.key === "h" || e.key === "H") {
        mapRef.current?.flyTo(origin.lat, origin.lon);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      delete (window as any).tvBridge;
    };
  }, [origin.lat, origin.lon, traffic?.aircraft, selectedHex]);

  const visible = useMemo(() => {
    const list = traffic?.aircraft ?? [];
    return list.filter((ac) => passesFilter(ac, settings.filter));
  }, [traffic, settings.filter]);

  const selected: Aircraft | null = useMemo(() => {
    if (!selectedHex) return null;
    return visible.find((a) => a.hex === selectedHex) ?? null;
  }, [visible, selectedHex]);

  const airborne = visible.filter(
    (a) => a.altitudeFt !== "ground" && a.altitudeFt !== 0,
  ).length;

  const hudWeather = fieldWeather(atmo?.weather ?? null, atmo?.metars[0] ?? null);
  const radarSite = nearestNexrad(atmo?.radars ?? []);
  const radarAgeMin =
    settings.overlays.precip && atmo?.radar.radarTime
      ? Math.max(
          0,
          Math.round((Date.now() / 1000 - atmo.radar.radarTime) / 60),
        )
      : null;
  const radarNoteBits: string[] = [];
  if (radarAgeMin != null) {
    radarNoteBits.push(
      radarAgeMin <= 1 ? "radar now" : `radar ${radarAgeMin}m`,
    );
  }
  if (radarSite && settings.overlays.nexradVel) {
    const age = scanAgeMin(radarSite.velValid);
    radarNoteBits.push(
      age == null
        ? `${radarSite.id} SRM`
        : age <= 1
          ? `${radarSite.id} SRM now`
          : `${radarSite.id} SRM ${age}m`,
    );
  } else if (radarSite && settings.overlays.nexradSite) {
    const age = scanAgeMin(radarSite.refValid);
    radarNoteBits.push(
      age == null
        ? radarSite.id
        : age <= 1
          ? `${radarSite.id} now`
          : `${radarSite.id} ${age}m`,
    );
  }

  return (
    <main
      className={cn(
        "relative h-[100dvh] overflow-hidden bg-bg text-fg",
        idle && "deck-idle",
      )}
    >
      {clientReady ? (
        <RadarMap
          ref={mapRef}
          origin={origin}
          radiusNm={settings.radiusNm}
          aircraft={visible}
          selectedHex={selectedHex}
          onSelect={setSelectedHex}
          overlays={settings.overlays}
          radar={
            atmo?.radar ?? {
              host: "https://tilecache.rainviewer.com",
              radarPath: null,
              radarTime: null,
            }
          }
          radarSite={radarSite}
          metars={atmo?.metars ?? []}
          roadEvents={
            settings.overlays.roadTraffic ? (roads?.events ?? []) : []
          }
          precipOpacity={settings.precipOpacity}
          nexradOpacity={settings.nexradOpacity}
          cloudOpacity={settings.cloudOpacity}
        />
      ) : (
        <div className="absolute inset-0 bg-bg" />
      )}

      <TopHud
        label={label}
        weather={hudWeather}
        visFallback={atmo?.metars[0]?.visib ?? null}
        airborne={airborne}
        radiusNm={settings.radiusNm}
        source={traffic?.source ?? ""}
        updatedAt={traffic?.fetchedAt ?? null}
        geoState={geoState}
        onOpenSettings={() => setSettingsOpen(true)}
        radarNote={radarNoteBits.length ? radarNoteBits.join(" · ") : null}
      />

      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onLocate={locate}
        onUseCenter={() => {
          const c = mapRef.current?.getCenter();
          if (!c) return;
          setOrigin(c);
          setLabel("Map station");
          setGeoState("default");
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2">
          {selected ? (
            <SelectedCard
              ac={selected}
              origin={origin}
              onClose={() => setSelectedHex(null)}
            />
          ) : null}
          <div className="deck-chrome flex flex-col gap-2">
            <TrafficStrip
              aircraft={visible}
              origin={origin}
              radiusNm={settings.radiusNm}
              selectedHex={selectedHex}
              onSelect={setSelectedHex}
            />
            {settings.overlays.metars || settings.overlays.temps ? (
              <MetarStrip metars={atmo?.metars ?? []} />
            ) : null}
            {settings.overlays.roadTraffic ? (
              <RoadStrip events={roads?.events ?? []} />
            ) : null}
            {traffic?.error || atmo?.error || roads?.error ? (
              <p className="px-1 font-mono text-xs text-warn">
                {traffic?.error ?? atmo?.error ?? roads?.error}
              </p>
            ) : null}
            {atmo?.taf && selected == null ? (
              <p className="hidden truncate px-1 font-mono text-xs text-subtle sm:block">
                {atmo.taf}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onPreset={(lat, lon, name) => {
          setOrigin({ lat, lon });
          setLabel(name);
          setGeoState("default");
          setSettingsOpen(false);
          mapRef.current?.flyTo(lat, lon);
        }}
        onResetDefaults={() => patchDeckSettings(DEFAULT_SETTINGS)}
        taf={atmo?.taf ?? null}
        radarSite={radarSite}
      />
    </main>
  );
}
