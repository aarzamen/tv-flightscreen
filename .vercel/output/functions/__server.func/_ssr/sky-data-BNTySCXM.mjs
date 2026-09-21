import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as clampLatLon } from "./geo-PXMB8JJ2.mjs";
import { r as nearestAirports } from "./airports-BgInc76b.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sky-data-BNTySCXM.js
var UA = "CloudDeck/1.0 (west-coast sky viewer; https://grok.com; educational)";
function asNumber(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() && v !== "ground") {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function qty(v) {
	if (!v || typeof v !== "object") return null;
	const val = v.value;
	return asNumber(val);
}
async function fetchJson(url, timeoutMs, headers = {}) {
	const res = await fetch(url, {
		headers: {
			"user-agent": UA,
			accept: "application/json",
			...headers
		},
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res.json();
}
function parseAircraft(raw) {
	const lat = asNumber(raw.lat);
	const lon = asNumber(raw.lon);
	if (lat == null || lon == null) return null;
	const hex = String(raw.hex ?? "").toLowerCase();
	if (!hex) return null;
	const altRaw = raw.alt_baro;
	const altitudeFt = altRaw === "ground" ? "ground" : asNumber(altRaw);
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
		seenSec: asNumber(raw.seen_pos) ?? asNumber(raw.seen)
	};
}
async function pullAdsb(lat, lon, radiusNm) {
	const urls = [{
		source: "adsb.lol",
		url: `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${radiusNm}`
	}, {
		source: "adsb.fi",
		url: `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${radiusNm}`
	}];
	for (const u of urls) try {
		const json = await fetchJson(u.url, 8e3);
		const aircraft = (Array.isArray(json.ac) ? json.ac : []).map((row) => row && typeof row === "object" ? parseAircraft(row) : null).filter((a) => a !== null);
		if (aircraft.length || u.source === "adsb.lol") return {
			aircraft,
			source: u.source
		};
	} catch {}
	throw new Error("Traffic feeds unavailable");
}
var fetchTraffic_createServerFn_handler = createServerRpc({
	id: "a3ea8645d5ba368b96a29bc3a514c86099b314863ca295ce593cdf9c4d317d95",
	name: "fetchTraffic",
	filename: "src/lib/sky-data.ts"
}, (opts) => fetchTraffic.__executeServer(opts));
var fetchTraffic = createServerFn({ method: "POST" }).validator((input) => {
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
}).handler(fetchTraffic_createServerFn_handler, async ({ data }) => {
	try {
		const pulled = await pullAdsb(data.lat, data.lon, data.radiusNm);
		return {
			aircraft: pulled.aircraft,
			source: pulled.source,
			fetchedAt: Date.now(),
			error: null
		};
	} catch (err) {
		return {
			aircraft: [],
			source: "",
			fetchedAt: Date.now(),
			error: err instanceof Error ? err.message : "Traffic unavailable"
		};
	}
});
async function pullWeather(lat, lon) {
	const props = (await fetchJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, 8e3, { accept: "application/geo+json" })).properties ?? {};
	const loc = props.relativeLocation?.properties;
	const label = loc?.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ""}` : "Station";
	let obs = null;
	if (props.observationStations) {
		const id = (await fetchJson(props.observationStations, 8e3, { accept: "application/geo+json" })).features?.[0]?.properties?.stationIdentifier;
		if (id) obs = (await fetchJson(`https://api.weather.gov/stations/${id}/observations/latest`, 8e3, { accept: "application/geo+json" })).properties ?? null;
	}
	let forecast = "";
	if (props.forecast) try {
		const p = (await fetchJson(props.forecast, 8e3, { accept: "application/geo+json" })).properties?.periods?.[0];
		if (p?.shortForecast) forecast = p.name ? `${p.name}: ${p.shortForecast}` : p.shortForecast;
	} catch {
		forecast = "";
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
		isDay: typeof obs?.isDaytime === "boolean" ? obs.isDaytime : null
	};
}
function parseMetar(row) {
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
		wdir: row.wdir ?? null,
		wspd: asNumber(row.wspd),
		visib: row.visib ?? null,
		cover: String(row.cover ?? "").trim() || "—",
		altim: asNumber(row.altim)
	};
}
async function pullMetars(lat, lon) {
	const near = nearestAirports(lat, lon, 8, 220);
	if (!near.length) return [];
	const json = await fetchJson(`https://aviationweather.gov/api/data/metar?ids=${near.map((a) => a.icao).join(",")}&format=json`, 8e3);
	if (!Array.isArray(json)) return [];
	const byIcao = /* @__PURE__ */ new Map();
	for (const row of json) if (row && typeof row === "object") {
		const m = parseMetar(row);
		if (m) byIcao.set(m.icao, m);
	}
	return near.map((a) => byIcao.get(a.icao)).filter((m) => !!m);
}
async function pullTaf(icao) {
	const json = await fetchJson(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`, 8e3);
	if (!Array.isArray(json) || !json[0] || typeof json[0] !== "object") return null;
	return String(json[0].rawTAF ?? "").trim() || null;
}
async function pullRadar() {
	const json = await fetchJson("https://api.rainviewer.com/public/weather-maps.json", 6e3);
	const past = json.radar?.past ?? [];
	const last = past[past.length - 1];
	return {
		host: json.host || "https://tilecache.rainviewer.com",
		radarPath: last?.path ?? null,
		radarTime: last?.time ?? null
	};
}
function parseRadarSite(row) {
	if (!row || typeof row !== "object") return null;
	const r = row;
	const id = String(r.id ?? "").trim().toUpperCase();
	if (!/^[A-Z0-9]{3,8}$/.test(id)) return null;
	const lat = asNumber(r.lat);
	const lon = asNumber(r.lon);
	if (lat == null || lon == null) return null;
	return {
		id,
		name: String(r.name ?? id).trim() || id,
		lat,
		lon,
		type: String(r.type ?? "").trim() || "NEXRAD"
	};
}
async function pullNearbyRadars(lat, lon) {
	const json = await fetchJson(`https://mesonet.agron.iastate.edu/json/radar.py?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&operation=available`, 8e3);
	const sites = (Array.isArray(json.radars) ? json.radars : []).map(parseRadarSite).filter((s) => s !== null);
	const i = sites.findIndex((s) => s.type === "NEXRAD");
	if (i < 0) return sites;
	try {
		sites[i] = await enrichSite(sites[i]);
	} catch {
		sites[i] = {
			...sites[i],
			refProduct: "N0B",
			velProduct: "N0S"
		};
	}
	return sites;
}
var REF_PREF = [
	"N0B",
	"N0Q",
	"N0R"
];
var VEL_PREF = [
	"N0S",
	"N0U",
	"N0V"
];
function pickProduct(available, pref, fallback) {
	return pref.find((p) => available.includes(p)) ?? fallback;
}
async function pullRidgeMeta(siteId, product) {
	const valid = (await fetchJson(`https://mesonet.agron.iastate.edu/data/gis/images/4326/ridge/${siteId}/${product}_0.json`, 5e3)).meta?.valid;
	return typeof valid === "string" && valid ? valid : null;
}
async function enrichSite(site) {
	let available = [];
	try {
		available = ((await fetchJson(`https://mesonet.agron.iastate.edu/json/radar.py?radar=${encodeURIComponent(site.id)}&operation=products`, 6e3)).products ?? []).map((p) => String(p.id ?? "").toUpperCase()).filter(Boolean);
	} catch {
		available = [];
	}
	const refProduct = pickProduct(available, REF_PREF, "N0B");
	const velProduct = pickProduct(available, VEL_PREF, "N0S");
	const [refMeta, velMeta] = await Promise.allSettled([pullRidgeMeta(site.id, refProduct), pullRidgeMeta(site.id, velProduct)]);
	return {
		...site,
		refProduct,
		velProduct,
		refValid: refMeta.status === "fulfilled" ? refMeta.value : null,
		velValid: velMeta.status === "fulfilled" ? velMeta.value : null
	};
}
var EMPTY_RADAR = {
	host: "https://tilecache.rainviewer.com",
	radarPath: null,
	radarTime: null
};
var fetchAtmosphere_createServerFn_handler = createServerRpc({
	id: "caa28eb354777d357597f404230420ca37579b60a4666feeb8fb2f18b0ed9956",
	name: "fetchAtmosphere",
	filename: "src/lib/sky-data.ts"
}, (opts) => fetchAtmosphere.__executeServer(opts));
var fetchAtmosphere = createServerFn({ method: "POST" }).validator((input) => {
	const d = input ?? {};
	const lat = asNumber(d.lat);
	const lon = asNumber(d.lon);
	if (lat == null || lon == null) throw new Error("Invalid station");
	const pos = clampLatLon(lat, lon);
	return {
		lat: pos.lat,
		lon: pos.lon
	};
}).handler(fetchAtmosphere_createServerFn_handler, async ({ data }) => {
	try {
		const [weatherSettled, metarsSettled, radarSettled, sitesSettled] = await Promise.allSettled([
			pullWeather(data.lat, data.lon),
			pullMetars(data.lat, data.lon),
			pullRadar(),
			pullNearbyRadars(data.lat, data.lon)
		]);
		const weather = weatherSettled.status === "fulfilled" ? weatherSettled.value : null;
		const metars = metarsSettled.status === "fulfilled" ? metarsSettled.value : [];
		const radar = radarSettled.status === "fulfilled" ? radarSettled.value : EMPTY_RADAR;
		const radars = sitesSettled.status === "fulfilled" ? sitesSettled.value : [];
		let taf = null;
		if (metars[0]?.icao) try {
			taf = await pullTaf(metars[0].icao);
		} catch {
			taf = null;
		}
		const bits = [];
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
			error: bits.length ? `Partial: ${bits.join(", ")} missed` : null
		};
	} catch (err) {
		return {
			weather: null,
			metars: [],
			taf: null,
			radar: EMPTY_RADAR,
			radars: [],
			fetchedAt: Date.now(),
			error: err instanceof Error ? err.message : "Atmosphere unavailable"
		};
	}
});
//#endregion
export { fetchAtmosphere_createServerFn_handler, fetchTraffic_createServerFn_handler };
