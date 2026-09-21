//#region node_modules/.nitro/vite/services/ssr/assets/geo-PXMB8JJ2.js
var NM_IN_METERS = 1852;
var VENTURA = {
	lat: 34.2819,
	lon: -119.2999,
	label: "Ventura, CA"
};
function toRad(deg) {
	return deg * Math.PI / 180;
}
function toDeg(rad) {
	return rad * 180 / Math.PI;
}
function haversineNm(a, b) {
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 12742.0176 * Math.asin(Math.min(1, Math.sqrt(h))) / 1.852;
}
function bearingDeg(from, to) {
	const lat1 = toRad(from.lat);
	const lat2 = toRad(to.lat);
	const dLon = toRad(to.lon - from.lon);
	const y = Math.sin(dLon) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
	return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function destPoint(from, nm, bearing) {
	const d = nm / 3440.065;
	const brng = toRad(bearing);
	const lat1 = toRad(from.lat);
	const lon1 = toRad(from.lon);
	const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
	const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
	return {
		lat: toDeg(lat2),
		lon: (toDeg(lon2) + 540) % 360 - 180
	};
}
function compass8(deg) {
	return [
		"N",
		"NE",
		"E",
		"SE",
		"S",
		"SW",
		"W",
		"NW"
	][Math.round(deg / 45) % 8] ?? "N";
}
function clampLatLon(lat, lon) {
	return {
		lat: Math.max(-90, Math.min(90, lat)),
		lon: ((lon + 180) % 360 + 360) % 360 - 180
	};
}
//#endregion
export { compass8 as a, clampLatLon as i, VENTURA as n, destPoint as o, bearingDeg as r, haversineNm as s, NM_IN_METERS as t };
