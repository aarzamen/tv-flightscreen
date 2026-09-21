import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as clampLatLon, s as haversineNm } from "./geo-PXMB8JJ2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/road-traffic-DhXo-V3u.js
var UA = "CloudDeck/1.0 (west-coast sky viewer; https://grok.com; educational)";
var CHP_KML = "https://quickmap.dot.ca.gov/data/chp-only.kml";
var LCS_KML = "https://quickmap.dot.ca.gov/data/lcs2way.kml";
var MAX_EVENTS = 100;
function asNumber(v) {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim()) {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
async function fetchText(url, timeoutMs) {
	const res = await fetch(url, {
		headers: {
			"user-agent": UA,
			accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml, */*"
		},
		signal: AbortSignal.timeout(timeoutMs)
	});
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res.text();
}
function decodeHtml(s) {
	return s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/\s+/g, " ").trim();
}
function classify(source, title) {
	if (source === "lcs") return "closure";
	const t = title.toLowerCase();
	if (/1182|1183|1179|20001|20002|accident|collision|crash/.test(t)) return "accident";
	return "hazard";
}
function parseLine(raw) {
	const pts = [];
	for (const pair of raw.trim().split(/\s+/)) {
		const [lo, la] = pair.split(",");
		const lon = Number(lo);
		const lat = Number(la);
		if (Number.isFinite(lat) && Number.isFinite(lon)) pts.push([lat, lon]);
	}
	if (pts.length < 2) return void 0;
	if (pts.length > 80) {
		const step = Math.ceil(pts.length / 80);
		return pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
	}
	return pts;
}
function parsePlacemarks(xml, source) {
	const out = [];
	const parts = xml.split("<Placemark>");
	for (let i = 1; i < parts.length; i++) {
		const block = parts[i] ?? "";
		const title = decodeHtml(block.match(/class="iw-title">([^<]+)/)?.[1] ?? (source === "lcs" ? "Lane closure" : "CHP incident"));
		const details = [...block.matchAll(/class="iw-text">([\s\S]*?)<\/p>/g)].map((m) => decodeHtml(m[1] ?? "")).filter(Boolean).slice(0, 2);
		const idM = block.match(/CHP Incident\s+([A-Z0-9]+)/i) ?? block.match(/Closure ID:\s*([A-Z0-9-]+)/i);
		const pointM = block.match(/<Point>\s*<coordinates>\s*([-\d.]+)\s*,\s*([-\d.]+)/);
		const lineM = block.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
		const line = lineM?.[1] ? parseLine(lineM[1]) : void 0;
		let lon = pointM ? Number(pointM[1]) : null;
		let lat = pointM ? Number(pointM[2]) : null;
		if ((lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) && line?.[0]) {
			lat = line[0][0];
			lon = line[0][1];
		}
		if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
		const kind = classify(source, title);
		out.push({
			id: idM?.[1] ?? `${source}-${lat.toFixed(4)}-${lon.toFixed(4)}`,
			kind,
			title,
			detail: details.join(" · "),
			lat,
			lon,
			line
		});
	}
	return out;
}
function rank(kind) {
	if (kind === "accident") return 0;
	if (kind === "hazard") return 1;
	return 2;
}
var fetchRoadTraffic_createServerFn_handler = createServerRpc({
	id: "c386918bf32f379c780c84d503a48ab2b61dabbf3885a8f2fc593728060b3433",
	name: "fetchRoadTraffic",
	filename: "src/lib/road-traffic.ts"
}, (opts) => fetchRoadTraffic.__executeServer(opts));
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
}).handler(fetchRoadTraffic_createServerFn_handler, async ({ data }) => {
	const origin = {
		lat: data.lat,
		lon: data.lon
	};
	try {
		const [chpSettled, lcsSettled] = await Promise.allSettled([fetchText(CHP_KML, 12e3), fetchText(LCS_KML, 15e3)]);
		const events = [];
		const sources = [];
		if (chpSettled.status === "fulfilled") {
			events.push(...parsePlacemarks(chpSettled.value, "chp"));
			sources.push("CHP");
		}
		if (lcsSettled.status === "fulfilled") {
			events.push(...parsePlacemarks(lcsSettled.value, "lcs"));
			sources.push("Caltrans LCS");
		}
		if (!sources.length) throw new Error("Road feeds unavailable");
		const seen = /* @__PURE__ */ new Set();
		return {
			events: events.filter((e) => haversineNm(origin, e) <= data.radiusNm).sort((a, b) => {
				const rk = rank(a.kind) - rank(b.kind);
				if (rk !== 0) return rk;
				return haversineNm(origin, a) - haversineNm(origin, b);
			}).filter((e) => {
				if (seen.has(e.id)) return false;
				seen.add(e.id);
				return true;
			}).slice(0, MAX_EVENTS),
			source: sources.join(" · "),
			fetchedAt: Date.now(),
			error: null
		};
	} catch (err) {
		return {
			events: [],
			source: "",
			fetchedAt: Date.now(),
			error: err instanceof Error ? err.message : "Road traffic unavailable"
		};
	}
});
//#endregion
export { fetchRoadTraffic_createServerFn_handler };
