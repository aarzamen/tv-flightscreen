import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  Map as LeafletMap,
  Marker,
  Circle,
  Polyline,
  TileLayer,
  TileLayerOptions,
} from "leaflet";
import type { Aircraft, Metar, RadarCatalog, RadarSite } from "@/lib/sky-data";
import type { RoadEvent } from "@/lib/road-traffic";
import type { Overlays } from "@/lib/settings";
import { destPoint, NM_IN_METERS, type LatLon } from "@/lib/geo";
import { formatTempF } from "@/lib/format";

export type RadarHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  flyTo: (lat: number, lon: number) => void;
  getCenter: () => LatLon | null;
};

type Props = {
  origin: LatLon;
  radiusNm: number;
  aircraft: Aircraft[];
  selectedHex: string | null;
  onSelect: (hex: string | null) => void;
  overlays: Overlays;
  radar: RadarCatalog;
  radarSite: RadarSite | null;
  metars: Metar[];
  roadEvents: RoadEvent[];
  precipOpacity: number;
  nexradOpacity: number;
  cloudOpacity: number;
};

const PLANE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.6 14.7 9.6 22 12.2l-7.3.9L13.3 21 12 19.2 10.7 21l-1.4-7.9L2 12.2l7.3-2.6Z"/></svg>`;

/** 1×1 transparent GIF — IEM error tiles are 200s, so we also cap native zoom. */
const BLANK_TILE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const IEM_TMS = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0";
const IEM_ATTR = "NEXRAD &copy; NOAA / Iowa State";
const MAP_MAX_ZOOM = 16;

function iemTile(layer: string) {
  return `${IEM_TMS}/${layer}/{z}/{x}/{y}.png`;
}

function ridgeLatest(siteId: string, product: string) {
  return iemTile(`ridge::${siteId}-${product}-0`);
}

function planeIconHtml(selected: boolean, track: number | null) {
  const rot = track == null ? 0 : track;
  const on = selected ? " is-on" : "";
  return `<div class="ac-mark${on}" style="transform:rotate(${rot}deg)">${PLANE_SVG}</div>`;
}

function zoomForRadius(nm: number) {
  if (nm <= 30) return 10;
  if (nm <= 60) return 9;
  if (nm <= 100) return 8;
  if (nm <= 160) return 7;
  return 6;
}

function cappedTile(
  L: typeof import("leaflet"),
  url: string,
  nativeZoom: number,
  extra: TileLayerOptions = {},
) {
  return L.tileLayer(url, {
    errorTileUrl: BLANK_TILE,
    maxNativeZoom: nativeZoom,
    maxZoom: MAP_MAX_ZOOM,
    minZoom: 4,
    ...extra,
  });
}

function syncLayer(map: LeafletMap, layer: TileLayer | null, on: boolean) {
  if (!layer) return;
  if (on && !map.hasLayer(layer)) layer.addTo(map);
  if (!on && map.hasLayer(layer)) map.removeLayer(layer);
}

function stationFlagHtml(m: Metar, showMetar: boolean, showTemp: boolean) {
  const lines: string[] = [];
  if (showMetar) {
    lines.push(m.icao, m.cover);
  } else if (showTemp) {
    lines.push(m.icao);
  }
  if (showTemp && m.tempC != null) lines.push(formatTempF(m.tempC));
  const extra = showTemp ? " is-temp" : "";
  return `<div class="metar-flag${extra}">${lines.join("<br/>")}</div>`;
}

function roadFlagHtml(ev: RoadEvent) {
  const tag = ev.kind === "accident" ? "ACC" : ev.kind === "closure" ? "LCS" : "HAZ";
  const extra =
    ev.kind === "accident" ? " is-bad" : ev.kind === "closure" ? " is-shut" : "";
  return `<div class="road-flag${extra}">${tag}</div>`;
}

function roadLineColor(kind: RoadEvent["kind"]) {
  if (kind === "accident") return "#c47a72";
  if (kind === "closure") return "#c9d4dc";
  return "#c4a574";
}

type LayerBag = {
  dark: TileLayer | null;
  sat: TileLayer | null;
  topo: TileLayer | null;
  terrain: TileLayer | null;
  roads: TileLayer | null;
  places: TileLayer | null;
  rail: TileLayer | null;
  marine: TileLayer | null;
  counties: TileLayer | null;
  states: TileLayer | null;
  trailsHike: TileLayer | null;
  trailsCycle: TileLayer | null;
  clouds: TileLayer | null;
  precip: TileLayer | null;
  nexrad: TileLayer | null;
  nexradSite: TileLayer | null;
  nexradVel: TileLayer | null;
  echoTops: TileLayer | null;
  mrms: TileLayer | null;
  rings: Circle[];
  sweep: Polyline | null;
  station: Marker | null;
  radarMark: Marker | null;
  siteKey: string | null;
  planes: Map<string, Marker>;
  metarMarks: Marker[];
  roadMarks: Marker[];
  roadLines: Polyline[];
};

export const RadarMap = forwardRef<RadarHandle, Props>(function RadarMap(
  {
    origin,
    radiusNm,
    aircraft,
    selectedHex,
    onSelect,
    overlays,
    radar,
    radarSite,
    metars,
    roadEvents,
    precipOpacity,
    nexradOpacity,
    cloudOpacity,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const [ready, setReady] = useState(false);
  const layersRef = useRef<LayerBag>({
    dark: null,
    sat: null,
    topo: null,
    terrain: null,
    roads: null,
    places: null,
    rail: null,
    marine: null,
    counties: null,
    states: null,
    trailsHike: null,
    trailsCycle: null,
    clouds: null,
    precip: null,
    nexrad: null,
    nexradSite: null,
    nexradVel: null,
    echoTops: null,
    mrms: null,
    rings: [],
    sweep: null,
    station: null,
    radarMark: null,
    siteKey: null,
    planes: new Map(),
    metarMarks: [],
    roadMarks: [],
    roadLines: [],
  });
  const originRef = useRef(origin);
  const radiusRef = useRef(radiusNm);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedHex);
  const sweepTimer = useRef<number | null>(null);
  const sweepAngle = useRef(0);
  const fittedOrigin = useRef<string>("");

  originRef.current = origin;
  radiusRef.current = radiusNm;
  onSelectRef.current = onSelect;
  selectedRef.current = selectedHex;

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    flyTo: (lat, lon) =>
      mapRef.current?.flyTo([lat, lon], zoomForRadius(radiusRef.current), {
        duration: 0.7,
      }),
    getCenter: () => {
      const c = mapRef.current?.getCenter();
      return c ? { lat: c.lat, lon: c.lng } : null;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current) return;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !hostRef.current) return;
      LRef.current = L;
      const map = L.map(hostRef.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 4,
        maxZoom: MAP_MAX_ZOOM,
        worldCopyJump: true,
      }).setView(
        [originRef.current.lat, originRef.current.lon],
        zoomForRadius(radiusRef.current),
      );

      map.attributionControl.setPrefix("");
      mapRef.current = map;
      if (typeof window !== "undefined") {
        (window as any)._leafletMap = map;
      }

      const dark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          errorTileUrl: BLANK_TILE,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      );
      const sat = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: MAP_MAX_ZOOM,
          maxNativeZoom: 16,
          errorTileUrl: BLANK_TILE,
          attribution: "Tiles &copy; Esri",
        },
      );
      const topo = cappedTile(
        L,
        "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        16,
        { opacity: 0.72, zIndex: 3, attribution: "USGS The National Map" },
      );
      const terrain = cappedTile(
        L,
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade_Dark/MapServer/tile/{z}/{y}/{x}",
        16,
        { opacity: 0.42, zIndex: 4, attribution: "Esri hillshade" },
      );
      const roads = cappedTile(
        L,
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        19,
        { opacity: 0.92, zIndex: 5, attribution: "Esri roads" },
      );
      const places = cappedTile(
        L,
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        16,
        { opacity: 0.95, zIndex: 9, attribution: "Esri places" },
      );
      const rail = cappedTile(
        L,
        "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
        18,
        {
          subdomains: "abc",
          opacity: 0.86,
          zIndex: 6,
          attribution: '<a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
        },
      );
      const marine = cappedTile(
        L,
        "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
        18,
        {
          opacity: 0.92,
          zIndex: 7,
          attribution: '<a href="https://www.openseamap.org/">OpenSeaMap</a>',
        },
      );
      const counties = cappedTile(
        L,
        "https://mesonet.agron.iastate.edu/c/tile.py/1.0.0/uscounties/{z}/{x}/{y}.png",
        12,
        { opacity: 0.7, zIndex: 8, attribution: "Counties &copy; IEM" },
      );
      const states = cappedTile(
        L,
        "https://mesonet.agron.iastate.edu/c/tile.py/1.0.0/usstates/{z}/{x}/{y}.png",
        12,
        { opacity: 0.55, zIndex: 8, attribution: "" },
      );
      const trailsHike = cappedTile(
        L,
        "https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png",
        15,
        {
          opacity: 0.88,
          zIndex: 6,
          attribution: '<a href="https://waymarkedtrails.org/">Waymarked Trails</a>',
        },
      );
      const trailsCycle = cappedTile(
        L,
        "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png",
        15,
        { opacity: 0.8, zIndex: 6, attribution: "" },
      );
      const clouds = cappedTile(
        L,
        iemTile("goes-west-ir-4km-900913"),
        8,
        {
          opacity: 0.42,
          zIndex: 10,
          attribution: "GOES-West &copy; NOAA / Iowa State",
        },
      );
      const nexrad = cappedTile(L, ridgeLatest("USCOMP", "N0Q"), 8, {
        opacity: 0.55,
        zIndex: 11,
        attribution: IEM_ATTR,
      });
      const echoTops = cappedTile(L, iemTile("nexrad-eet"), 10, {
        opacity: 0.55,
        zIndex: 11,
        attribution: "Echo tops &copy; NOAA / Iowa State",
      });
      const mrms = cappedTile(L, iemTile("q2-hsr"), 8, {
        opacity: 0.55,
        zIndex: 11,
        attribution: "MRMS &copy; NOAA / Iowa State",
      });

      const bag = layersRef.current;
      bag.dark = dark;
      bag.sat = sat;
      bag.topo = topo;
      bag.terrain = terrain;
      bag.roads = roads;
      bag.places = places;
      bag.rail = rail;
      bag.marine = marine;
      bag.counties = counties;
      bag.states = states;
      bag.trailsHike = trailsHike;
      bag.trailsCycle = trailsCycle;
      bag.clouds = clouds;
      bag.nexrad = nexrad;
      bag.echoTops = echoTops;
      bag.mrms = mrms;
      dark.addTo(map);

      const station = L.marker([originRef.current.lat, originRef.current.lon], {
        icon: L.divIcon({
          className: "ac-icon",
          html: `<div class="station-dot"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
        interactive: false,
        zIndexOffset: 600,
      }).addTo(map);
      bag.station = station;
      fittedOrigin.current = `${originRef.current.lat.toFixed(4)},${originRef.current.lon.toFixed(4)}`;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (sweepTimer.current != null) {
        window.clearInterval(sweepTimer.current);
        sweepTimer.current = null;
      }
      if (typeof window !== "undefined" && (window as any)._leafletMap === mapRef.current) {
        delete (window as any)._leafletMap;
      }
      mapRef.current?.remove();
      mapRef.current = null;
      layersRef.current.planes.clear();
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const key = `${origin.lat.toFixed(4)},${origin.lon.toFixed(4)}`;
    layersRef.current.station?.setLatLng([origin.lat, origin.lon]);
    if (fittedOrigin.current !== key) {
      fittedOrigin.current = key;
      map.flyTo([origin.lat, origin.lon], zoomForRadius(radiusNm), {
        duration: 0.65,
      });
    }
  }, [ready, origin.lat, origin.lon, radiusNm]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const bag = layersRef.current;
    if (overlays.satelliteBase) {
      if (bag.dark && map.hasLayer(bag.dark)) map.removeLayer(bag.dark);
      if (bag.sat && !map.hasLayer(bag.sat)) bag.sat.addTo(map);
    } else {
      if (bag.sat && map.hasLayer(bag.sat)) map.removeLayer(bag.sat);
      if (bag.dark && !map.hasLayer(bag.dark)) bag.dark.addTo(map);
    }
    syncLayer(map, bag.topo, overlays.topo);
    syncLayer(map, bag.terrain, overlays.terrain);
    syncLayer(map, bag.roads, overlays.roads);
    syncLayer(map, bag.rail, overlays.rail);
    syncLayer(map, bag.trailsHike, overlays.trails);
    syncLayer(map, bag.trailsCycle, overlays.trails);
    syncLayer(map, bag.marine, overlays.marine);
    syncLayer(map, bag.counties, overlays.counties);
    syncLayer(map, bag.states, overlays.counties);
    syncLayer(map, bag.places, overlays.places);
    if (bag.clouds) {
      bag.clouds.setOpacity(cloudOpacity);
      syncLayer(map, bag.clouds, overlays.clouds);
    }
    if (bag.nexrad) {
      bag.nexrad.setOpacity(nexradOpacity);
      syncLayer(map, bag.nexrad, overlays.nexrad);
    }
    if (bag.echoTops) {
      bag.echoTops.setOpacity(nexradOpacity);
      syncLayer(map, bag.echoTops, overlays.echoTops);
    }
    if (bag.mrms) {
      bag.mrms.setOpacity(nexradOpacity);
      syncLayer(map, bag.mrms, overlays.mrms);
    }
  }, [
    ready,
    overlays.satelliteBase,
    overlays.topo,
    overlays.terrain,
    overlays.roads,
    overlays.places,
    overlays.rail,
    overlays.marine,
    overlays.counties,
    overlays.trails,
    overlays.clouds,
    overlays.nexrad,
    overlays.echoTops,
    overlays.mrms,
    cloudOpacity,
    nexradOpacity,
  ]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    if (bag.precip) {
      map.removeLayer(bag.precip);
      bag.precip = null;
    }
    if (!overlays.precip || !radar.radarPath) return;
    bag.precip = cappedTile(
      L,
      `${radar.host}${radar.radarPath}/256/{z}/{x}/{y}/2/1_1.png`,
      12,
      {
        opacity: precipOpacity,
        zIndex: 12,
        attribution: "Radar &copy; RainViewer",
      },
    ).addTo(map);
  }, [ready, overlays.precip, radar.host, radar.radarPath, precipOpacity]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    const id = radarSite?.id ?? null;
    const refProd = radarSite?.refProduct || "N0B";
    const velProd = radarSite?.velProduct || "N0S";
    const key = id ? `${id}:${refProd}:${velProd}` : null;
    if (bag.siteKey !== key) {
      if (bag.nexradSite) {
        map.removeLayer(bag.nexradSite);
        bag.nexradSite = null;
      }
      if (bag.nexradVel) {
        map.removeLayer(bag.nexradVel);
        bag.nexradVel = null;
      }
      bag.siteKey = key;
      if (id) {
        bag.nexradSite = cappedTile(L, ridgeLatest(id, refProd), 12, {
          opacity: nexradOpacity,
          zIndex: 13,
          attribution: IEM_ATTR,
        });
        bag.nexradVel = cappedTile(L, ridgeLatest(id, velProd), 12, {
          opacity: nexradOpacity,
          zIndex: 14,
          attribution: IEM_ATTR,
        });
      }
    }
    if (bag.nexradSite) bag.nexradSite.setOpacity(nexradOpacity);
    if (bag.nexradVel) bag.nexradVel.setOpacity(nexradOpacity);
    syncLayer(map, bag.nexradSite, Boolean(overlays.nexradSite && id));
    syncLayer(map, bag.nexradVel, Boolean(overlays.nexradVel && id));
  }, [
    ready,
    radarSite?.id,
    radarSite?.refProduct,
    radarSite?.velProduct,
    overlays.nexradSite,
    overlays.nexradVel,
    nexradOpacity,
  ]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    if (bag.radarMark) {
      map.removeLayer(bag.radarMark);
      bag.radarMark = null;
    }
    const show = overlays.nexradSite || overlays.nexradVel;
    if (!show || !radarSite) return;
    bag.radarMark = L.marker([radarSite.lat, radarSite.lon], {
      icon: L.divIcon({
        className: "ac-icon",
        html: `<div class="metar-flag">${radarSite.id}</div>`,
        iconSize: [40, 16],
        iconAnchor: [20, 8],
      }),
      interactive: true,
      zIndexOffset: 220,
    }).addTo(map);
    bag.radarMark.bindTooltip(
      `${radarSite.id} · ${radarSite.name}${
        radarSite.velProduct ? ` · ${radarSite.velProduct}` : ""
      }`,
      {
        direction: "top",
        className: "ac-tip",
        opacity: 0.96,
      },
    );
  }, [
    ready,
    radarSite?.id,
    radarSite?.lat,
    radarSite?.lon,
    radarSite?.name,
    overlays.nexradSite,
    overlays.nexradVel,
  ]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    for (const c of bag.rings) map.removeLayer(c);
    bag.rings = [];
    if (!overlays.rings) return;
    const steps = [0.25, 0.5, 1];
    for (const f of steps) {
      const nm = radiusNm * f;
      const circle = L.circle([origin.lat, origin.lon], {
        radius: nm * NM_IN_METERS,
        color: "#c9d4dc",
        weight: f === 1 ? 1.2 : 0.7,
        opacity: f === 1 ? 0.45 : 0.28,
        fill: false,
        interactive: false,
      }).addTo(map);
      const tipAt = destPoint(origin, nm, 78);
      circle.bindTooltip(`${Math.round(nm)} nm`, {
        permanent: true,
        direction: "center",
        className: "ring-label",
        opacity: 0.85,
      });
      circle.getTooltip()?.setLatLng([tipAt.lat, tipAt.lon]);
      bag.rings.push(circle);
    }
  }, [ready, origin.lat, origin.lon, radiusNm, overlays.rings]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    if (sweepTimer.current != null) {
      window.clearInterval(sweepTimer.current);
      sweepTimer.current = null;
    }
    if (bag.sweep) {
      map.removeLayer(bag.sweep);
      bag.sweep = null;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!overlays.sweep || reduce) return;
    const line = L.polyline(
      [
        [origin.lat, origin.lon],
        [origin.lat, origin.lon],
      ],
      {
        color: "#c9d4dc",
        weight: 1.4,
        opacity: 0.55,
        interactive: false,
      },
    ).addTo(map);
    bag.sweep = line;
    sweepTimer.current = window.setInterval(() => {
      sweepAngle.current = (sweepAngle.current + 2.2) % 360;
      const o = originRef.current;
      const end = destPoint(o, radiusRef.current, sweepAngle.current);
      line.setLatLngs([
        [o.lat, o.lon],
        [end.lat, end.lon],
      ]);
    }, 40);
    return () => {
      if (sweepTimer.current != null) {
        window.clearInterval(sweepTimer.current);
        sweepTimer.current = null;
      }
    };
  }, [ready, origin.lat, origin.lon, radiusNm, overlays.sweep]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    const seen = new Set<string>();
    if (!overlays.aircraft) {
      for (const [hex, mk] of bag.planes) {
        map.removeLayer(mk);
        bag.planes.delete(hex);
      }
      return;
    }
    for (const ac of aircraft) {
      seen.add(ac.hex);
      const selected = ac.hex === selectedHex;
      const html = planeIconHtml(selected, ac.trackDeg);
      const existing = bag.planes.get(ac.hex);
      const icon = L.divIcon({
        className: "ac-icon",
        html,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const label = ac.callsign || ac.registration || ac.hex.slice(0, 6).toUpperCase();
      if (existing) {
        existing.setLatLng([ac.lat, ac.lon]);
        existing.setIcon(icon);
        existing.setZIndexOffset(selected ? 800 : 400);
        const tip = existing.getTooltip();
        if (overlays.labels) {
          if (tip) {
            existing.setTooltipContent(label);
          } else {
            existing.bindTooltip(label, {
              permanent: true,
              direction: "right",
              className: "ac-tip",
              offset: [12, 0],
              opacity: 0.95,
            });
          }
        } else if (tip) {
          existing.unbindTooltip();
        }
      } else {
        const hex = ac.hex;
        const mk = L.marker([ac.lat, ac.lon], {
          icon,
          zIndexOffset: selected ? 800 : 400,
        }).addTo(map);
        mk.on("click", () => {
          const current = selectedRef.current;
          onSelectRef.current(current === hex ? null : hex);
        });
        if (overlays.labels) {
          mk.bindTooltip(label, {
            permanent: true,
            direction: "right",
            className: "ac-tip",
            offset: [12, 0],
            opacity: 0.95,
          });
        }
        bag.planes.set(hex, mk);
      }
    }
    for (const [hex, mk] of bag.planes) {
      if (!seen.has(hex)) {
        map.removeLayer(mk);
        bag.planes.delete(hex);
      }
    }
  }, [ready, aircraft, selectedHex, overlays.aircraft, overlays.labels]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    for (const mk of bag.metarMarks) map.removeLayer(mk);
    bag.metarMarks = [];
    const showMetar = overlays.metars;
    const showTemp = overlays.temps;
    if (!showMetar && !showTemp) return;
    for (const m of metars) {
      if (showTemp && !showMetar && m.tempC == null) continue;
      const lines = showMetar && showTemp ? 3 : 2;
      const h = lines >= 3 ? 40 : 28;
      const mk = L.marker([m.lat, m.lon], {
        icon: L.divIcon({
          className: "ac-icon",
          html: stationFlagHtml(m, showMetar, showTemp),
          iconSize: [52, h],
          iconAnchor: [26, h / 2],
        }),
        zIndexOffset: 200,
      }).addTo(map);
      const tempBit =
        m.tempC != null ? ` · ${formatTempF(m.tempC)}` : "";
      mk.bindTooltip(
        `${m.icao} · ${m.name}${tempBit}<br/>${m.raw || m.cover}`,
        {
          direction: "top",
          className: "ac-tip",
          opacity: 0.96,
        },
      );
      bag.metarMarks.push(mk);
    }
  }, [ready, metars, overlays.metars, overlays.temps]);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    const bag = layersRef.current;
    for (const mk of bag.roadMarks) map.removeLayer(mk);
    for (const ln of bag.roadLines) map.removeLayer(ln);
    bag.roadMarks = [];
    bag.roadLines = [];
    if (!overlays.roadTraffic) return;
    for (const ev of roadEvents) {
      if (ev.line && ev.line.length >= 2) {
        const ln = L.polyline(ev.line, {
          color: roadLineColor(ev.kind),
          weight: 2.2,
          opacity: 0.72,
          interactive: false,
        }).addTo(map);
        bag.roadLines.push(ln);
      }
      const mk = L.marker([ev.lat, ev.lon], {
        icon: L.divIcon({
          className: "ac-icon",
          html: roadFlagHtml(ev),
          iconSize: [32, 16],
          iconAnchor: [16, 8],
        }),
        zIndexOffset: 260,
      }).addTo(map);
      const body = [ev.title, ev.detail].filter(Boolean).join("<br/>");
      mk.bindTooltip(body, {
        direction: "top",
        className: "ac-tip",
        opacity: 0.96,
      });
      bag.roadMarks.push(mk);
    }
  }, [ready, roadEvents, overlays.roadTraffic]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-0 bg-bg"
      role="presentation"
    />
  );
});
