import { i as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as compass8, i as clampLatLon, n as VENTURA, o as destPoint, r as bearingDeg, s as haversineNm, t as NM_IN_METERS } from "./geo-PXMB8JJ2.mjs";
import { a as Minus, i as Plus, o as LocateFixed, r as Settings2, s as Crosshair, t as X } from "../_libs/lucide-react.mjs";
import { n as airportByIcao, t as STATION_PRESETS } from "./airports-BgInc76b.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/@radix-ui/react-slider+[...].mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-1H5H2-_F.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatAlt(alt) {
	if (alt === "ground" || alt === 0) return "GND";
	if (alt == null || !Number.isFinite(alt)) return "—";
	if (alt >= 18e3) return `FL${String(Math.round(alt / 100)).padStart(3, "0")}`;
	return `${Math.round(alt).toLocaleString("en-US")} ft`;
}
function formatGs(kt) {
	if (kt == null || !Number.isFinite(kt)) return "—";
	return `${Math.round(kt)} kt`;
}
function formatTrack(deg) {
	if (deg == null || !Number.isFinite(deg)) return "—";
	return `${Math.round(deg).toString().padStart(3, "0")}°`;
}
function formatNm(nm) {
	if (!Number.isFinite(nm)) return "—";
	if (nm < 10) return `${nm.toFixed(1)} nm`;
	return `${Math.round(nm)} nm`;
}
function formatTempF(celsius) {
	if (celsius == null || !Number.isFinite(celsius)) return "—";
	return `${Math.round(celsius * 9 / 5 + 32)}°`;
}
function metersToSm(m) {
	if (m == null || !Number.isFinite(m)) return null;
	return m / 1609.344;
}
function formatVisSm(sm) {
	if (typeof sm === "string") {
		if (sm.endsWith("+")) return `${sm.replace("+", "")}+ SM`;
		return `${sm} SM`;
	}
	if (sm == null || !Number.isFinite(sm)) return "—";
	if (sm >= 10) return "10+ SM";
	return `${sm < 1 ? sm.toFixed(1) : Math.round(sm * 10) / 10} SM`;
}
function formatClock(ts) {
	return new Date(ts).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false
	});
}
function vsLabel(fpm) {
	if (fpm == null || !Number.isFinite(fpm) || Math.abs(fpm) < 80) return "level";
	const mag = Math.round(Math.abs(fpm) / 50) * 50;
	return fpm > 0 ? `↑ ${mag} fpm` : `↓ ${mag} fpm`;
}
var PLANE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.6 14.7 9.6 22 12.2l-7.3.9L13.3 21 12 19.2 10.7 21l-1.4-7.9L2 12.2l7.3-2.6Z"/></svg>`;
/** 1×1 transparent GIF — IEM error tiles are 200s, so we also cap native zoom. */
var BLANK_TILE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
var IEM_TMS = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0";
var IEM_ATTR = "NEXRAD &copy; NOAA / Iowa State";
var MAP_MAX_ZOOM = 16;
function iemTile(layer) {
	return `${IEM_TMS}/${layer}/{z}/{x}/{y}.png`;
}
function ridgeLatest(siteId, product) {
	return iemTile(`ridge::${siteId}-${product}-0`);
}
function planeIconHtml(selected, track) {
	return `<div class="ac-mark${selected ? " is-on" : ""}" style="transform:rotate(${track == null ? 0 : track}deg)">${PLANE_SVG}</div>`;
}
function zoomForRadius(nm) {
	if (nm <= 30) return 10;
	if (nm <= 60) return 9;
	if (nm <= 100) return 8;
	if (nm <= 160) return 7;
	return 6;
}
function cappedTile(L, url, nativeZoom, extra = {}) {
	return L.tileLayer(url, {
		errorTileUrl: BLANK_TILE,
		maxNativeZoom: nativeZoom,
		maxZoom: MAP_MAX_ZOOM,
		minZoom: 4,
		...extra
	});
}
function syncLayer(map, layer, on) {
	if (!layer) return;
	if (on && !map.hasLayer(layer)) layer.addTo(map);
	if (!on && map.hasLayer(layer)) map.removeLayer(layer);
}
function stationFlagHtml(m, showMetar, showTemp) {
	const lines = [];
	if (showMetar) lines.push(m.icao, m.cover);
	else if (showTemp) lines.push(m.icao);
	if (showTemp && m.tempC != null) lines.push(formatTempF(m.tempC));
	return `<div class="metar-flag${showTemp ? " is-temp" : ""}">${lines.join("<br/>")}</div>`;
}
function roadFlagHtml(ev) {
	const tag = ev.kind === "accident" ? "ACC" : ev.kind === "closure" ? "LCS" : "HAZ";
	return `<div class="road-flag${ev.kind === "accident" ? " is-bad" : ev.kind === "closure" ? " is-shut" : ""}">${tag}</div>`;
}
function roadLineColor(kind) {
	if (kind === "accident") return "#c47a72";
	if (kind === "closure") return "#c9d4dc";
	return "#c4a574";
}
var RadarMap = (0, import_react.forwardRef)(function RadarMap({ origin, radiusNm, aircraft, selectedHex, onSelect, overlays, radar, radarSite, metars, roadEvents, precipOpacity, nexradOpacity, cloudOpacity }, ref) {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const LRef = (0, import_react.useRef)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const layersRef = (0, import_react.useRef)({
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
		planes: /* @__PURE__ */ new Map(),
		metarMarks: [],
		roadMarks: [],
		roadLines: []
	});
	const originRef = (0, import_react.useRef)(origin);
	const radiusRef = (0, import_react.useRef)(radiusNm);
	const onSelectRef = (0, import_react.useRef)(onSelect);
	const selectedRef = (0, import_react.useRef)(selectedHex);
	const sweepTimer = (0, import_react.useRef)(null);
	const sweepAngle = (0, import_react.useRef)(0);
	const fittedOrigin = (0, import_react.useRef)("");
	originRef.current = origin;
	radiusRef.current = radiusNm;
	onSelectRef.current = onSelect;
	selectedRef.current = selectedHex;
	(0, import_react.useImperativeHandle)(ref, () => ({
		zoomIn: () => mapRef.current?.zoomIn(),
		zoomOut: () => mapRef.current?.zoomOut(),
		flyTo: (lat, lon) => mapRef.current?.flyTo([lat, lon], zoomForRadius(radiusRef.current), { duration: .7 }),
		getCenter: () => {
			const c = mapRef.current?.getCenter();
			return c ? {
				lat: c.lat,
				lon: c.lng
			} : null;
		}
	}));
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		if (!hostRef.current) return;
		(async () => {
			const L = await import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
			if (cancelled || !hostRef.current) return;
			LRef.current = L;
			const map = L.map(hostRef.current, {
				zoomControl: false,
				attributionControl: true,
				minZoom: 4,
				maxZoom: MAP_MAX_ZOOM,
				worldCopyJump: true
			}).setView([originRef.current.lat, originRef.current.lon], zoomForRadius(radiusRef.current));
			map.attributionControl.setPrefix("");
			mapRef.current = map;
			const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
				subdomains: "abcd",
				maxZoom: 19,
				errorTileUrl: BLANK_TILE,
				attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> &copy; <a href=\"https://carto.com/attributions\">CARTO</a>"
			});
			const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
				maxZoom: MAP_MAX_ZOOM,
				maxNativeZoom: 16,
				errorTileUrl: BLANK_TILE,
				attribution: "Tiles &copy; Esri"
			});
			const topo = cappedTile(L, "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}", 16, {
				opacity: .72,
				zIndex: 3,
				attribution: "USGS The National Map"
			});
			const terrain = cappedTile(L, "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade_Dark/MapServer/tile/{z}/{y}/{x}", 16, {
				opacity: .42,
				zIndex: 4,
				attribution: "Esri hillshade"
			});
			const roads = cappedTile(L, "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", 19, {
				opacity: .92,
				zIndex: 5,
				attribution: "Esri roads"
			});
			const places = cappedTile(L, "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", 16, {
				opacity: .95,
				zIndex: 9,
				attribution: "Esri places"
			});
			const rail = cappedTile(L, "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", 18, {
				subdomains: "abc",
				opacity: .86,
				zIndex: 6,
				attribution: "<a href=\"https://www.openrailwaymap.org/\">OpenRailwayMap</a>"
			});
			const marine = cappedTile(L, "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", 18, {
				opacity: .92,
				zIndex: 7,
				attribution: "<a href=\"https://www.openseamap.org/\">OpenSeaMap</a>"
			});
			const counties = cappedTile(L, "https://mesonet.agron.iastate.edu/c/tile.py/1.0.0/uscounties/{z}/{x}/{y}.png", 12, {
				opacity: .7,
				zIndex: 8,
				attribution: "Counties &copy; IEM"
			});
			const states = cappedTile(L, "https://mesonet.agron.iastate.edu/c/tile.py/1.0.0/usstates/{z}/{x}/{y}.png", 12, {
				opacity: .55,
				zIndex: 8,
				attribution: ""
			});
			const trailsHike = cappedTile(L, "https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png", 15, {
				opacity: .88,
				zIndex: 6,
				attribution: "<a href=\"https://waymarkedtrails.org/\">Waymarked Trails</a>"
			});
			const trailsCycle = cappedTile(L, "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png", 15, {
				opacity: .8,
				zIndex: 6,
				attribution: ""
			});
			const clouds = cappedTile(L, iemTile("goes-west-ir-4km-900913"), 8, {
				opacity: .42,
				zIndex: 10,
				attribution: "GOES-West &copy; NOAA / Iowa State"
			});
			const nexrad = cappedTile(L, ridgeLatest("USCOMP", "N0Q"), 8, {
				opacity: .55,
				zIndex: 11,
				attribution: IEM_ATTR
			});
			const echoTops = cappedTile(L, iemTile("nexrad-eet"), 10, {
				opacity: .55,
				zIndex: 11,
				attribution: "Echo tops &copy; NOAA / Iowa State"
			});
			const mrms = cappedTile(L, iemTile("q2-hsr"), 8, {
				opacity: .55,
				zIndex: 11,
				attribution: "MRMS &copy; NOAA / Iowa State"
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
			bag.station = L.marker([originRef.current.lat, originRef.current.lon], {
				icon: L.divIcon({
					className: "ac-icon",
					html: `<div class="station-dot"></div>`,
					iconSize: [10, 10],
					iconAnchor: [5, 5]
				}),
				interactive: false,
				zIndexOffset: 600
			}).addTo(map);
			fittedOrigin.current = `${originRef.current.lat.toFixed(4)},${originRef.current.lon.toFixed(4)}`;
			setReady(true);
		})();
		return () => {
			cancelled = true;
			if (sweepTimer.current != null) {
				window.clearInterval(sweepTimer.current);
				sweepTimer.current = null;
			}
			mapRef.current?.remove();
			mapRef.current = null;
			layersRef.current.planes.clear();
			setReady(false);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const map = mapRef.current;
		if (!map) return;
		const key = `${origin.lat.toFixed(4)},${origin.lon.toFixed(4)}`;
		layersRef.current.station?.setLatLng([origin.lat, origin.lon]);
		if (fittedOrigin.current !== key) {
			fittedOrigin.current = key;
			map.flyTo([origin.lat, origin.lon], zoomForRadius(radiusNm), { duration: .65 });
		}
	}, [
		ready,
		origin.lat,
		origin.lon,
		radiusNm
	]);
	(0, import_react.useEffect)(() => {
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
		nexradOpacity
	]);
	(0, import_react.useEffect)(() => {
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
		bag.precip = cappedTile(L, `${radar.host}${radar.radarPath}/256/{z}/{x}/{y}/2/1_1.png`, 12, {
			opacity: precipOpacity,
			zIndex: 12,
			attribution: "Radar &copy; RainViewer"
		}).addTo(map);
	}, [
		ready,
		overlays.precip,
		radar.host,
		radar.radarPath,
		precipOpacity
	]);
	(0, import_react.useEffect)(() => {
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
					attribution: IEM_ATTR
				});
				bag.nexradVel = cappedTile(L, ridgeLatest(id, velProd), 12, {
					opacity: nexradOpacity,
					zIndex: 14,
					attribution: IEM_ATTR
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
		nexradOpacity
	]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const map = mapRef.current;
		const L = LRef.current;
		if (!map || !L) return;
		const bag = layersRef.current;
		if (bag.radarMark) {
			map.removeLayer(bag.radarMark);
			bag.radarMark = null;
		}
		if (!(overlays.nexradSite || overlays.nexradVel) || !radarSite) return;
		bag.radarMark = L.marker([radarSite.lat, radarSite.lon], {
			icon: L.divIcon({
				className: "ac-icon",
				html: `<div class="metar-flag">${radarSite.id}</div>`,
				iconSize: [40, 16],
				iconAnchor: [20, 8]
			}),
			interactive: true,
			zIndexOffset: 220
		}).addTo(map);
		bag.radarMark.bindTooltip(`${radarSite.id} · ${radarSite.name}${radarSite.velProduct ? ` · ${radarSite.velProduct}` : ""}`, {
			direction: "top",
			className: "ac-tip",
			opacity: .96
		});
	}, [
		ready,
		radarSite?.id,
		radarSite?.lat,
		radarSite?.lon,
		radarSite?.name,
		overlays.nexradSite,
		overlays.nexradVel
	]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const map = mapRef.current;
		const L = LRef.current;
		if (!map || !L) return;
		const bag = layersRef.current;
		for (const c of bag.rings) map.removeLayer(c);
		bag.rings = [];
		if (!overlays.rings) return;
		for (const f of [
			.25,
			.5,
			1
		]) {
			const nm = radiusNm * f;
			const circle = L.circle([origin.lat, origin.lon], {
				radius: nm * NM_IN_METERS,
				color: "#c9d4dc",
				weight: f === 1 ? 1.2 : .7,
				opacity: f === 1 ? .45 : .28,
				fill: false,
				interactive: false
			}).addTo(map);
			const tipAt = destPoint(origin, nm, 78);
			circle.bindTooltip(`${Math.round(nm)} nm`, {
				permanent: true,
				direction: "center",
				className: "ring-label",
				opacity: .85
			});
			circle.getTooltip()?.setLatLng([tipAt.lat, tipAt.lon]);
			bag.rings.push(circle);
		}
	}, [
		ready,
		origin.lat,
		origin.lon,
		radiusNm,
		overlays.rings
	]);
	(0, import_react.useEffect)(() => {
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
		const line = L.polyline([[origin.lat, origin.lon], [origin.lat, origin.lon]], {
			color: "#c9d4dc",
			weight: 1.4,
			opacity: .55,
			interactive: false
		}).addTo(map);
		bag.sweep = line;
		sweepTimer.current = window.setInterval(() => {
			sweepAngle.current = (sweepAngle.current + 2.2) % 360;
			const o = originRef.current;
			const end = destPoint(o, radiusRef.current, sweepAngle.current);
			line.setLatLngs([[o.lat, o.lon], [end.lat, end.lon]]);
		}, 40);
		return () => {
			if (sweepTimer.current != null) {
				window.clearInterval(sweepTimer.current);
				sweepTimer.current = null;
			}
		};
	}, [
		ready,
		origin.lat,
		origin.lon,
		radiusNm,
		overlays.sweep
	]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const map = mapRef.current;
		const L = LRef.current;
		if (!map || !L) return;
		const bag = layersRef.current;
		const seen = /* @__PURE__ */ new Set();
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
				iconAnchor: [11, 11]
			});
			const label = ac.callsign || ac.registration || ac.hex.slice(0, 6).toUpperCase();
			if (existing) {
				existing.setLatLng([ac.lat, ac.lon]);
				existing.setIcon(icon);
				existing.setZIndexOffset(selected ? 800 : 400);
				const tip = existing.getTooltip();
				if (overlays.labels) {
					if (tip) existing.setTooltipContent(label);
					else existing.bindTooltip(label, {
						permanent: true,
						direction: "right",
						className: "ac-tip",
						offset: [12, 0],
						opacity: .95
					});
				} else if (tip) existing.unbindTooltip();
			} else {
				const hex = ac.hex;
				const mk = L.marker([ac.lat, ac.lon], {
					icon,
					zIndexOffset: selected ? 800 : 400
				}).addTo(map);
				mk.on("click", () => {
					const current = selectedRef.current;
					onSelectRef.current(current === hex ? null : hex);
				});
				if (overlays.labels) mk.bindTooltip(label, {
					permanent: true,
					direction: "right",
					className: "ac-tip",
					offset: [12, 0],
					opacity: .95
				});
				bag.planes.set(hex, mk);
			}
		}
		for (const [hex, mk] of bag.planes) if (!seen.has(hex)) {
			map.removeLayer(mk);
			bag.planes.delete(hex);
		}
	}, [
		ready,
		aircraft,
		selectedHex,
		overlays.aircraft,
		overlays.labels
	]);
	(0, import_react.useEffect)(() => {
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
			const h = (showMetar && showTemp ? 3 : 2) >= 3 ? 40 : 28;
			const mk = L.marker([m.lat, m.lon], {
				icon: L.divIcon({
					className: "ac-icon",
					html: stationFlagHtml(m, showMetar, showTemp),
					iconSize: [52, h],
					iconAnchor: [26, h / 2]
				}),
				zIndexOffset: 200
			}).addTo(map);
			const tempBit = m.tempC != null ? ` · ${formatTempF(m.tempC)}` : "";
			mk.bindTooltip(`${m.icao} · ${m.name}${tempBit}<br/>${m.raw || m.cover}`, {
				direction: "top",
				className: "ac-tip",
				opacity: .96
			});
			bag.metarMarks.push(mk);
		}
	}, [
		ready,
		metars,
		overlays.metars,
		overlays.temps
	]);
	(0, import_react.useEffect)(() => {
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
					opacity: .72,
					interactive: false
				}).addTo(map);
				bag.roadLines.push(ln);
			}
			const mk = L.marker([ev.lat, ev.lon], {
				icon: L.divIcon({
					className: "ac-icon",
					html: roadFlagHtml(ev),
					iconSize: [32, 16],
					iconAnchor: [16, 8]
				}),
				zIndexOffset: 260
			}).addTo(map);
			const body = [ev.title, ev.detail].filter(Boolean).join("<br/>");
			mk.bindTooltip(body, {
				direction: "top",
				className: "ac-tip",
				opacity: .96
			});
			bag.roadMarks.push(mk);
		}
	}, [
		ready,
		roadEvents,
		overlays.roadTraffic
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "absolute inset-0 z-0 bg-bg",
		role: "presentation"
	});
});
var DEFAULT_SETTINGS = {
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
		roadTraffic: false
	},
	filter: {
		hideGround: true,
		airliner: true,
		general: true,
		rotor: true
	},
	precipOpacity: .72,
	nexradOpacity: .55,
	cloudOpacity: .28
};
var KEY = "cloud-deck-settings-v1";
function mergeSettings(raw) {
	if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS;
	const r = raw;
	return {
		radiusNm: clamp(r.radiusNm ?? DEFAULT_SETTINGS.radiusNm, 25, 250),
		overlays: {
			...DEFAULT_SETTINGS.overlays,
			...r.overlays
		},
		filter: {
			...DEFAULT_SETTINGS.filter,
			...r.filter
		},
		precipOpacity: clamp(r.precipOpacity ?? DEFAULT_SETTINGS.precipOpacity, .15, 1),
		nexradOpacity: clamp(r.nexradOpacity ?? DEFAULT_SETTINGS.nexradOpacity, .15, 1),
		cloudOpacity: clamp(r.cloudOpacity ?? DEFAULT_SETTINGS.cloudOpacity, .1, 1)
	};
}
function clamp(n, min, max) {
	if (!Number.isFinite(n)) return min;
	return Math.min(max, Math.max(min, n));
}
function readSettings() {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return DEFAULT_SETTINGS;
		return mergeSettings(JSON.parse(raw));
	} catch {
		return DEFAULT_SETTINGS;
	}
}
var snapshot = DEFAULT_SETTINGS;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	for (const l of listeners) l();
}
function hydrateDeckSettings() {
	snapshot = readSettings();
	emit();
}
function patchDeckSettings(patch) {
	snapshot = mergeSettings({
		...snapshot,
		...patch
	});
	try {
		window.localStorage.setItem(KEY, JSON.stringify(snapshot));
	} catch {}
	emit();
}
function patchOverlays(patch) {
	patchDeckSettings({ overlays: {
		...snapshot.overlays,
		...patch
	} });
}
function patchFilter(patch) {
	patchDeckSettings({ filter: {
		...snapshot.filter,
		...patch
	} });
}
function useDeckSettings() {
	return (0, import_react.useSyncExternalStore)((cb) => {
		listeners.add(cb);
		return () => listeners.delete(cb);
	}, () => snapshot, () => DEFAULT_SETTINGS);
}
var TYPE_NAMES = {
	B38M: "737 MAX 8",
	B39M: "737 MAX 9",
	B737: "737",
	B738: "737-800",
	B739: "737-900",
	B744: "747-400",
	B748: "747-8",
	B752: "757-200",
	B763: "767-300",
	B772: "777-200",
	B77W: "777-300ER",
	B788: "787-8",
	B789: "787-9",
	A319: "A319",
	A320: "A320",
	A321: "A321",
	A20N: "A320neo",
	A21N: "A321neo",
	A332: "A330-200",
	A333: "A330-300",
	A339: "A330-900",
	A359: "A350-900",
	A388: "A380-800",
	E75L: "E175",
	E190: "E190",
	CRJ9: "CRJ-900",
	DH8D: "Q400",
	C172: "Skyhawk",
	C182: "Skylane",
	C208: "Caravan",
	PC12: "PC-12",
	SR22: "SR22",
	DA40: "DA40",
	GLF4: "Gulfstream IV",
	GLF5: "Gulfstream V",
	GLF6: "Gulfstream G650",
	C25B: "Citation CJ3",
	C56X: "Citation XLS",
	C68A: "Citation Latitude",
	H60: "Black Hawk",
	A109: "AW109",
	EC35: "EC135",
	R44: "Robinson R44"
};
function typeLabel(code) {
	if (!code) return "Unknown type";
	return TYPE_NAMES[code] ? `${TYPE_NAMES[code]} · ${code}` : code;
}
function aircraftKind(ac) {
	const cat = ac.category.toUpperCase();
	if (cat === "A7") return "rotor";
	if (cat === "A3" || cat === "A4" || cat === "A5") return "airliner";
	return "general";
}
function passesFilter(ac, filter) {
	const ground = ac.altitudeFt === "ground" || typeof ac.altitudeFt === "number" && ac.altitudeFt < 80 && (ac.gsKt ?? 0) < 40;
	if (filter.hideGround && ground) return false;
	const kind = aircraftKind(ac);
	if (kind === "airliner") return filter.airliner;
	if (kind === "rotor") return filter.rotor;
	return filter.general;
}
function altNumber(ac) {
	if (ac.altitudeFt === "ground") return 0;
	return typeof ac.altitudeFt === "number" ? ac.altitudeFt : 0;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:opacity-90",
			ghost: "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-surface-2",
			quiet: "bg-transparent text-muted hover:text-fg hover:bg-surface"
		},
		size: {
			md: "h-11 px-4 text-sm rounded-md",
			sm: "h-9 px-3 text-sm rounded-sm",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "ghost",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("relative h-6 w-10 shrink-0 rounded-full bg-surface-2 shadow-[var(--shadow-border)] transition-colors duration-150 data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "block size-5 translate-x-0.5 rounded-full bg-fg transition-transform duration-150 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-accent-fg" })
	});
}
function Slider({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
		className: cn("relative flex h-11 w-full touch-none items-center", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
			className: "relative h-1 w-full grow rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full rounded-full bg-accent" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block size-4 rounded-full bg-fg shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70" })]
	});
}
function RowToggle({ label, hint, checked, onCheckedChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex min-h-11 items-center justify-between gap-3 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium text-fg",
			children: label
		}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-muted",
			children: hint
		}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
			checked,
			onCheckedChange
		})]
	});
}
function TopHud({ label, weather, airborne, radiusNm, source, updatedAt, geoState, onOpenSettings, visFallback, radarNote }) {
	const wind = weather?.windKt != null ? `${weather.windDir != null ? compass8(weather.windDir) : ""} ${Math.round(weather.windKt)} kt`.trim() : "—";
	const visFromWx = metersToSm(weather?.visM ?? null);
	const vis = visFromWx != null ? formatVisSm(visFromWx) : formatVisSm(visFallback ?? null);
	const forecast = weather?.forecast?.trim() ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto mx-auto flex max-w-3xl items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "deck-chrome min-w-0 rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-medium tracking-tight text-fg",
							children: "Cloud Deck"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-xs uppercase tracking-widest text-muted",
							children: source ? `live · ${source}` : "west coast"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 truncate font-mono text-xs text-muted tabular-nums",
						children: [
							label,
							geoState === "pending" ? " · locating" : null,
							geoState === "denied" ? " · GPS off" : null,
							" · ",
							formatTempF(weather?.tempC ?? null),
							" · ",
							wind,
							" · ",
							vis,
							weather?.text ? ` · ${weather.text}` : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate font-mono text-xs text-subtle tabular-nums",
						children: [
							airborne,
							" airborne · ",
							radiusNm,
							" nm",
							radarNote ? ` · ${radarNote}` : null,
							updatedAt ? ` · ${formatClock(updatedAt)}` : null,
							forecast ? ` · ${forecast}` : null
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "deck-persist bg-bg/80 backdrop-blur-sm",
				"aria-label": "Open settings",
				onClick: onOpenSettings,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-5" })
			})]
		})
	});
}
function MapControls({ onZoomIn, onZoomOut, onLocate, onUseCenter }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "deck-chrome pointer-events-auto absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "bg-bg/80 backdrop-blur-sm",
				"aria-label": "Zoom in",
				onClick: onZoomIn,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "bg-bg/80 backdrop-blur-sm",
				"aria-label": "Zoom out",
				onClick: onZoomOut,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "bg-bg/80 backdrop-blur-sm",
				"aria-label": "Use my location",
				onClick: onLocate,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				className: "bg-bg/80 backdrop-blur-sm",
				"aria-label": "Station on map center",
				onClick: onUseCenter,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, { className: "size-5" })
			})
		]
	});
}
function SelectedCard({ ac, origin, onClose }) {
	const nm = haversineNm(origin, ac);
	const brg = bearingDeg(origin, ac);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-xl bg-bg/88 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs uppercase tracking-widest text-muted",
						children: aircraftKind(ac)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "truncate text-xl font-medium tracking-tight",
						children: ac.callsign || ac.registration || ac.hex.toUpperCase()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: typeLabel(ac.type)
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "quiet",
				"aria-label": "Clear selection",
				onClick: onClose,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs tabular-nums sm:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Altitude",
					v: formatAlt(ac.altitudeFt)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Groundspeed",
					v: formatGs(ac.gsKt)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Track",
					v: formatTrack(ac.trackDeg)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Vertical",
					v: vsLabel(ac.baroRate)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Distance",
					v: formatNm(nm)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Bearing",
					v: `${Math.round(brg).toString().padStart(3, "0")}° ${compass8(brg)}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Squawk",
					v: ac.squawk || "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					k: "Tail",
					v: ac.registration || ac.hex.toUpperCase()
				})
			]
		})]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-subtle",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "text-fg",
		children: v
	})] });
}
function TrafficStrip({ aircraft, origin, radiusNm, selectedHex, onSelect }) {
	const maxAlt = 45e3;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1 flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Profile · dist / alt" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FL450" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-16 overflow-hidden rounded-sm bg-surface",
				children: [[
					.25,
					.5,
					.75
				].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-x-0 border-t border-border",
					style: { top: `${(1 - f) * 100}%` }
				}, f)), aircraft.slice(0, 80).map((ac) => {
					const nm = haversineNm(origin, ac);
					const x = Math.min(1, nm / Math.max(radiusNm, 1));
					const y = 1 - Math.min(1, altNumber(ac) / maxAlt);
					const on = ac.hex === selectedHex;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": ac.callsign || ac.hex,
						onClick: () => onSelect(ac.hex),
						className: cn("absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full", on ? "bg-fg" : "bg-accent/80"),
						style: {
							left: `${x * 100}%`,
							top: `${y * 100}%`
						}
					}, ac.hex);
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex justify-between font-mono text-xs text-subtle",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "station" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [radiusNm, " nm"] })]
			})
		]
	});
}
function MetarStrip({ metars }) {
	if (!metars.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-xl bg-bg/80 px-3 py-2 shadow-[var(--shadow-border)] backdrop-blur-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-4",
			children: metars.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-40 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs uppercase tracking-widest text-muted",
					children: [
						m.icao,
						" · ",
						m.cover
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs text-fg tabular-nums",
					children: [
						formatTempF(m.tempC),
						" · ",
						typeof m.wdir === "number" ? compass8(m.wdir) : m.wdir ?? "VRB",
						" ",
						m.wspd ?? "—",
						" kt · ",
						formatVisSm(m.visib)
					]
				})]
			}, m.icao))
		})
	});
}
function RoadStrip({ events }) {
	if (!events.length) return null;
	const accidents = events.filter((e) => e.kind === "accident").length;
	const hazards = events.filter((e) => e.kind === "hazard").length;
	const closures = events.filter((e) => e.kind === "closure").length;
	const bits = [];
	if (accidents) bits.push(`${accidents} accident${accidents === 1 ? "" : "s"}`);
	if (hazards) bits.push(`${hazards} hazard${hazards === 1 ? "" : "s"}`);
	if (closures) bits.push(`${closures} closure${closures === 1 ? "" : "s"}`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "px-1 font-mono text-xs text-muted",
		children: ["Roads · ", bits.join(" · ") || `${events.length} events`]
	});
}
function SettingsPanel({ open, onClose, settings, onPreset, onResetDefaults, taf, radarSite }) {
	if (!open) return null;
	const o = settings.overlays;
	const f = settings.filter;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 z-40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "absolute inset-0 bg-bg/70",
			"aria-label": "Close settings",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-surface px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-medium tracking-tight",
						children: "Scope"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "quiet",
						"aria-label": "Close settings",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-5 text-sm text-muted",
					children: "Defaults stay a dark sky. Extra layers are optional clutter — they persist on this device, no account. Public ADS-B, NOAA GOES-West, NEXRAD RIDGE, MRMS, RainViewer, Aviation Weather, Esri, OSM, USGS. Sign-up not required."
				}),
				taf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Nearest TAF",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-1 font-mono text-xs leading-relaxed text-muted",
						children: taf
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Range",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "25 nm" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-fg tabular-nums",
								children: [settings.radiusNm, " nm"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "250 nm" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
						min: 25,
						max: 250,
						step: 5,
						value: [settings.radiusNm],
						onValueChange: (v) => patchDeckSettings({ radiusNm: v[0] ?? 80 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Station presets",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: STATION_PRESETS.map((p) => {
							const ap = airportByIcao(p.icao);
							if (!ap) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "h-11 rounded-md bg-surface-2 px-3 text-sm text-fg shadow-[var(--shadow-border)]",
								onClick: () => onPreset(ap.lat, ap.lon, p.label),
								children: p.label
							}, p.id);
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Base map",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
						label: "Satellite photo",
						hint: "Esri imagery under the overlays",
						checked: o.satelliteBase,
						onCheckedChange: (v) => patchOverlays({ satelliteBase: v })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
						label: "USGS topo",
						hint: "National Map — covers the base while on",
						checked: o.topo,
						onCheckedChange: (v) => patchOverlays({ topo: v })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Ground · optional clutter",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs text-muted",
							children: "Google-style flow coloring is not a public tile. Live traffic plots CHP incidents and Caltrans lane closures. Streets is the road network. Choices stay on this device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Live traffic",
							hint: "CHP incidents and Caltrans lane closures",
							checked: o.roadTraffic,
							onCheckedChange: (v) => patchOverlays({ roadTraffic: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Streets",
							hint: "Esri transportation, not live congestion colors",
							checked: o.roads,
							onCheckedChange: (v) => patchOverlays({ roads: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Places & names",
							hint: "Boundaries and city labels — useful on satellite",
							checked: o.places,
							onCheckedChange: (v) => patchOverlays({ places: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Terrain",
							hint: "Dark hillshade",
							checked: o.terrain,
							onCheckedChange: (v) => patchOverlays({ terrain: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Rail",
							hint: "OpenRailwayMap",
							checked: o.rail,
							onCheckedChange: (v) => patchOverlays({ rail: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Marine marks",
							hint: "OpenSeaMap beacons, lights, traffic lanes",
							checked: o.marine,
							onCheckedChange: (v) => patchOverlays({ marine: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "County & state lines",
							hint: "IEM cartography",
							checked: o.counties,
							onCheckedChange: (v) => patchOverlays({ counties: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Trails",
							hint: "Hiking and cycling, Waymarked Trails",
							checked: o.trails,
							onCheckedChange: (v) => patchOverlays({ trails: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Station temperatures",
							hint: "METAR chips in Fahrenheit",
							checked: o.temps,
							onCheckedChange: (v) => patchOverlays({ temps: v })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Weather",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Precipitation",
							hint: "RainViewer — blank when nothing is falling",
							checked: o.precip,
							onCheckedChange: (v) => patchOverlays({ precip: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpacityRow, {
							label: "Precip opacity",
							value: settings.precipOpacity,
							onChange: (n) => patchDeckSettings({ precipOpacity: n })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "NEXRAD mosaic",
							hint: "CONUS composite — blank in the dry, falls off past zoom 8",
							checked: o.nexrad,
							onCheckedChange: (v) => patchOverlays({ nexrad: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Nearest WSR-88D",
							hint: radarSite ? `Super-res reflectivity · ${radarSite.id} ${radarSite.name}` : "Super-res reflectivity from the nearest WSR-88D",
							checked: o.nexradSite,
							onCheckedChange: (v) => patchOverlays({ nexradSite: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Velocity",
							hint: radarSite ? `Storm-relative velocity · ${radarSite.id} — inbound / outbound, storm motion subtracted` : "Storm-relative velocity from the nearest WSR-88D",
							checked: o.nexradVel,
							onCheckedChange: (v) => patchOverlays({ nexradVel: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Echo tops",
							hint: "CONUS storm height — blank in the dry",
							checked: o.echoTops,
							onCheckedChange: (v) => patchOverlays({ echoTops: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "MRMS hybrid scan",
							hint: "Seamless HSR — paints where rain is, empty over dry air",
							checked: o.mrms,
							onCheckedChange: (v) => patchOverlays({ mrms: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpacityRow, {
							label: "Radar opacity",
							value: settings.nexradOpacity,
							onChange: (n) => patchDeckSettings({ nexradOpacity: n })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Clouds",
							hint: "GOES-West IR cloud tops — clear air stays dark",
							checked: o.clouds,
							onCheckedChange: (v) => patchOverlays({ clouds: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpacityRow, {
							label: "Cloud opacity",
							value: settings.cloudOpacity,
							onChange: (n) => patchDeckSettings({ cloudOpacity: n })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "METAR flags",
							hint: "Nearest west-coast fields",
							checked: o.metars,
							onCheckedChange: (v) => patchOverlays({ metars: v })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Traffic",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Aircraft",
							checked: o.aircraft,
							onCheckedChange: (v) => patchOverlays({ aircraft: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Callsigns",
							checked: o.labels,
							onCheckedChange: (v) => patchOverlays({ labels: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Range rings",
							checked: o.rings,
							onCheckedChange: (v) => patchOverlays({ rings: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Sweep",
							hint: "Decorative scope arm",
							checked: o.sweep,
							onCheckedChange: (v) => patchOverlays({ sweep: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Hide ground",
							checked: f.hideGround,
							onCheckedChange: (v) => patchFilter({ hideGround: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Airliners",
							checked: f.airliner,
							onCheckedChange: (v) => patchFilter({ airliner: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "General aviation",
							checked: f.general,
							onCheckedChange: (v) => patchFilter({ general: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowToggle, {
							label: "Rotor",
							checked: f.rotor,
							onCheckedChange: (v) => patchFilter({ rotor: v })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "mt-4",
					onClick: onResetDefaults,
					children: "Restore default overlays"
				})
			]
		})]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-2 font-mono text-xs uppercase tracking-widest text-muted",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-lg bg-bg px-3 py-2 shadow-[var(--shadow-border)]",
			children
		})]
	});
}
function OpacityRow({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between text-xs text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono tabular-nums",
				children: [Math.round(value * 100), "%"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
			min: .1,
			max: 1,
			step: .05,
			value: [value],
			onValueChange: (v) => onChange(v[0] ?? value)
		})]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function fieldWeather(weather, metar) {
	if (!weather && !metar) return null;
	const cover = metar?.cover && metar.cover !== "—" ? metar.cover : "";
	const windDir = typeof metar?.wdir === "number" ? metar.wdir : weather?.windDir ?? null;
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
		isDay: weather?.isDay ?? null
	};
}
function nearestNexrad(sites) {
	return sites.find((s) => s.type === "NEXRAD") ?? null;
}
function scanAgeMin(iso) {
	if (!iso) return null;
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return null;
	return Math.max(0, Math.round((Date.now() - t) / 6e4));
}
function asNumber$1(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() && v !== "ground") {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
var fetchTraffic = createServerFn({ method: "POST" }).validator((input) => {
	const d = input ?? {};
	const lat = asNumber$1(d.lat);
	const lon = asNumber$1(d.lon);
	if (lat == null || lon == null) throw new Error("Invalid station");
	const pos = clampLatLon(lat, lon);
	return {
		lat: pos.lat,
		lon: pos.lon,
		radiusNm: Math.round(Math.min(250, Math.max(15, asNumber$1(d.radiusNm) ?? 80)))
	};
}).handler(createSsrRpc("a3ea8645d5ba368b96a29bc3a514c86099b314863ca295ce593cdf9c4d317d95"));
var fetchAtmosphere = createServerFn({ method: "POST" }).validator((input) => {
	const d = input ?? {};
	const lat = asNumber$1(d.lat);
	const lon = asNumber$1(d.lon);
	if (lat == null || lon == null) throw new Error("Invalid station");
	const pos = clampLatLon(lat, lon);
	return {
		lat: pos.lat,
		lon: pos.lon
	};
}).handler(createSsrRpc("caa28eb354777d357597f404230420ca37579b60a4666feeb8fb2f18b0ed9956"));
function asNumber(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim()) {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
var fetchRoadTraffic = createServerFn({ method: "POST" }).validator((input) => {
	const d = input ?? {};
	const lat = asNumber(d.lat);
	const lon = asNumber(d.lon);
	if (lat == null || lon == null) throw new Error("Invalid station");
	const pos = clampLatLon(lat, lon);
	return {
		lat: pos.lat,
		lon: pos.lon,
		radiusNm: Math.round(Math.min(250, Math.max(15, asNumber(d.radiusNm) ?? 80)))
	};
}).handler(createSsrRpc("c386918bf32f379c780c84d503a48ab2b61dabbf3885a8f2fc593728060b3433"));
var EVENTS = [
	"pointerdown",
	"pointermove",
	"keydown",
	"wheel",
	"touchstart",
	"touchmove"
];
/** Fade unused chrome after the deck sits untouched. Map pan/zoom counts. */
function useIdleChrome(delayMs = 4800, paused = false) {
	const [idle, setIdle] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (paused) {
			setIdle(false);
			return;
		}
		if (typeof window === "undefined") return;
		let timer = 0;
		const ping = () => {
			setIdle(false);
			window.clearTimeout(timer);
			timer = window.setTimeout(() => setIdle(true), delayMs);
		};
		ping();
		const opts = { passive: true };
		for (const name of EVENTS) window.addEventListener(name, ping, opts);
		return () => {
			window.clearTimeout(timer);
			for (const name of EVENTS) window.removeEventListener(name, ping);
		};
	}, [delayMs, paused]);
	return idle;
}
function Home() {
	const settings = useDeckSettings();
	const mapRef = (0, import_react.useRef)(null);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [origin, setOrigin] = (0, import_react.useState)(VENTURA);
	const [label, setLabel] = (0, import_react.useState)(VENTURA.label);
	const [geoState, setGeoState] = (0, import_react.useState)("pending");
	const [traffic, setTraffic] = (0, import_react.useState)(null);
	const [atmo, setAtmo] = (0, import_react.useState)(null);
	const [roads, setRoads] = (0, import_react.useState)(null);
	const [selectedHex, setSelectedHex] = (0, import_react.useState)(null);
	const [clientReady, setClientReady] = (0, import_react.useState)(false);
	const idle = useIdleChrome(4800, settingsOpen);
	(0, import_react.useEffect)(() => {
		hydrateDeckSettings();
		setClientReady(true);
	}, []);
	const locate = (0, import_react.useCallback)(() => {
		if (!navigator.geolocation) {
			setGeoState("denied");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			const next = {
				lat: pos.coords.latitude,
				lon: pos.coords.longitude
			};
			setOrigin(next);
			setLabel("Your position");
			setGeoState("live");
			mapRef.current?.flyTo(next.lat, next.lon);
		}, () => {
			setGeoState((g) => g === "live" ? g : "denied");
		}, {
			enableHighAccuracy: true,
			timeout: 1e4,
			maximumAge: 3e4
		});
	}, []);
	(0, import_react.useEffect)(() => {
		locate();
		const t = window.setTimeout(() => {
			setGeoState((g) => g === "pending" ? "default" : g);
		}, 9e3);
		return () => window.clearTimeout(t);
	}, [locate]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const pull = async () => {
			try {
				const res = await fetchTraffic({ data: {
					lat: origin.lat,
					lon: origin.lon,
					radiusNm: settings.radiusNm
				} });
				if (!cancelled) setTraffic(res);
			} catch {
				if (!cancelled) setTraffic({
					aircraft: [],
					source: "",
					fetchedAt: Date.now(),
					error: "Traffic unavailable"
				});
			}
		};
		pull();
		const id = window.setInterval(pull, 12e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [
		origin.lat,
		origin.lon,
		settings.radiusNm
	]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const pull = async () => {
			try {
				const res = await fetchAtmosphere({ data: {
					lat: origin.lat,
					lon: origin.lon
				} });
				if (!cancelled) {
					setAtmo(res);
					if (res.weather?.label) setLabel((current) => current === VENTURA.label && geoState !== "live" ? res.weather.label : current);
				}
			} catch {
				if (!cancelled) setAtmo({
					weather: null,
					metars: [],
					taf: null,
					radar: {
						host: "https://tilecache.rainviewer.com",
						radarPath: null,
						radarTime: null
					},
					radars: [],
					fetchedAt: Date.now(),
					error: "Atmosphere unavailable"
				});
			}
		};
		pull();
		const wantRadar = settings.overlays.nexradSite || settings.overlays.nexradVel || settings.overlays.nexrad;
		const id = window.setInterval(pull, wantRadar ? 6e4 : 18e4);
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
		settings.overlays.nexrad
	]);
	(0, import_react.useEffect)(() => {
		if (!settings.overlays.roadTraffic) {
			setRoads(null);
			return;
		}
		let cancelled = false;
		const pull = async () => {
			try {
				const res = await fetchRoadTraffic({ data: {
					lat: origin.lat,
					lon: origin.lon,
					radiusNm: settings.radiusNm
				} });
				if (!cancelled) setRoads(res);
			} catch {
				if (!cancelled) setRoads({
					events: [],
					source: "",
					fetchedAt: Date.now(),
					error: "Road traffic unavailable"
				});
			}
		};
		pull();
		const id = window.setInterval(pull, 6e4);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [
		origin.lat,
		origin.lon,
		settings.radiusNm,
		settings.overlays.roadTraffic
	]);
	const visible = (0, import_react.useMemo)(() => {
		return (traffic?.aircraft ?? []).filter((ac) => passesFilter(ac, settings.filter));
	}, [traffic, settings.filter]);
	const selected = (0, import_react.useMemo)(() => {
		if (!selectedHex) return null;
		return visible.find((a) => a.hex === selectedHex) ?? null;
	}, [visible, selectedHex]);
	const airborne = visible.filter((a) => a.altitudeFt !== "ground" && a.altitudeFt !== 0).length;
	const hudWeather = fieldWeather(atmo?.weather ?? null, atmo?.metars[0] ?? null);
	const radarSite = nearestNexrad(atmo?.radars ?? []);
	const radarAgeMin = settings.overlays.precip && atmo?.radar.radarTime ? Math.max(0, Math.round((Date.now() / 1e3 - atmo.radar.radarTime) / 60)) : null;
	const radarNoteBits = [];
	if (radarAgeMin != null) radarNoteBits.push(radarAgeMin <= 1 ? "radar now" : `radar ${radarAgeMin}m`);
	if (radarSite && settings.overlays.nexradVel) {
		const age = scanAgeMin(radarSite.velValid);
		radarNoteBits.push(age == null ? `${radarSite.id} SRM` : age <= 1 ? `${radarSite.id} SRM now` : `${radarSite.id} SRM ${age}m`);
	} else if (radarSite && settings.overlays.nexradSite) {
		const age = scanAgeMin(radarSite.refValid);
		radarNoteBits.push(age == null ? radarSite.id : age <= 1 ? `${radarSite.id} now` : `${radarSite.id} ${age}m`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: cn("relative h-[100dvh] overflow-hidden bg-bg text-fg", idle && "deck-idle"),
		children: [
			clientReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadarMap, {
				ref: mapRef,
				origin,
				radiusNm: settings.radiusNm,
				aircraft: visible,
				selectedHex,
				onSelect: setSelectedHex,
				overlays: settings.overlays,
				radar: atmo?.radar ?? {
					host: "https://tilecache.rainviewer.com",
					radarPath: null,
					radarTime: null
				},
				radarSite,
				metars: atmo?.metars ?? [],
				roadEvents: settings.overlays.roadTraffic ? roads?.events ?? [] : [],
				precipOpacity: settings.precipOpacity,
				nexradOpacity: settings.nexradOpacity,
				cloudOpacity: settings.cloudOpacity
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-bg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopHud, {
				label,
				weather: hudWeather,
				visFallback: atmo?.metars[0]?.visib ?? null,
				airborne,
				radiusNm: settings.radiusNm,
				source: traffic?.source ?? "",
				updatedAt: traffic?.fetchedAt ?? null,
				geoState,
				onOpenSettings: () => setSettingsOpen(true),
				radarNote: radarNoteBits.length ? radarNoteBits.join(" · ") : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapControls, {
				onZoomIn: () => mapRef.current?.zoomIn(),
				onZoomOut: () => mapRef.current?.zoomOut(),
				onLocate: locate,
				onUseCenter: () => {
					const c = mapRef.current?.getCenter();
					if (!c) return;
					setOrigin(c);
					setLabel("Map station");
					setGeoState("default");
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2",
					children: [selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectedCard, {
						ac: selected,
						origin,
						onClose: () => setSelectedHex(null)
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "deck-chrome flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrafficStrip, {
								aircraft: visible,
								origin,
								radiusNm: settings.radiusNm,
								selectedHex,
								onSelect: setSelectedHex
							}),
							settings.overlays.metars || settings.overlays.temps ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetarStrip, { metars: atmo?.metars ?? [] }) : null,
							settings.overlays.roadTraffic ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoadStrip, { events: roads?.events ?? [] }) : null,
							traffic?.error || atmo?.error || roads?.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-1 font-mono text-xs text-warn",
								children: traffic?.error ?? atmo?.error ?? roads?.error
							}) : null,
							atmo?.taf && selected == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "hidden truncate px-1 font-mono text-xs text-subtle sm:block",
								children: atmo.taf
							}) : null
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {
				open: settingsOpen,
				onClose: () => setSettingsOpen(false),
				settings,
				onPreset: (lat, lon, name) => {
					setOrigin({
						lat,
						lon
					});
					setLabel(name);
					setGeoState("default");
					setSettingsOpen(false);
					mapRef.current?.flyTo(lat, lon);
				},
				onResetDefaults: () => patchDeckSettings(DEFAULT_SETTINGS),
				taf: atmo?.taf ?? null,
				radarSite
			})
		]
	});
}
//#endregion
export { Home as component };
