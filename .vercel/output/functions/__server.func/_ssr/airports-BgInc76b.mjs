import { s as haversineNm } from "./geo-PXMB8JJ2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/airports-BgInc76b.js
/** West-of-the-divide fields used for METAR/TAF and station presets. */
var WEST_AIRPORTS = [
	{
		icao: "KOXR",
		name: "Oxnard",
		lat: 34.2008,
		lon: -119.2072
	},
	{
		icao: "KCMA",
		name: "Camarillo",
		lat: 34.2137,
		lon: -119.0944
	},
	{
		icao: "KNTD",
		name: "Point Mugu",
		lat: 34.1193,
		lon: -119.1196
	},
	{
		icao: "KSBA",
		name: "Santa Barbara",
		lat: 34.4262,
		lon: -119.8404
	},
	{
		icao: "KSMO",
		name: "Santa Monica",
		lat: 34.0158,
		lon: -118.4513
	},
	{
		icao: "KVNY",
		name: "Van Nuys",
		lat: 34.2098,
		lon: -118.49
	},
	{
		icao: "KBUR",
		name: "Hollywood Burbank",
		lat: 34.2006,
		lon: -118.3587
	},
	{
		icao: "KLAX",
		name: "Los Angeles Intl",
		lat: 33.9425,
		lon: -118.408
	},
	{
		icao: "KHHR",
		name: "Hawthorne",
		lat: 33.9228,
		lon: -118.3352
	},
	{
		icao: "KTOA",
		name: "Zamperini / Torrance",
		lat: 33.8034,
		lon: -118.3396
	},
	{
		icao: "KLGB",
		name: "Long Beach",
		lat: 33.8177,
		lon: -118.1516
	},
	{
		icao: "KSNA",
		name: "John Wayne",
		lat: 33.6757,
		lon: -117.8682
	},
	{
		icao: "KONT",
		name: "Ontario",
		lat: 34.056,
		lon: -117.6012
	},
	{
		icao: "KCRQ",
		name: "McClellan-Palomar",
		lat: 33.1283,
		lon: -117.28
	},
	{
		icao: "KSAN",
		name: "San Diego Intl",
		lat: 32.7338,
		lon: -117.1933
	},
	{
		icao: "KNZY",
		name: "North Island NAS",
		lat: 32.6996,
		lon: -117.2153
	},
	{
		icao: "KNKX",
		name: "Miramar MCAS",
		lat: 32.8684,
		lon: -117.1425
	},
	{
		icao: "KAVX",
		name: "Catalina",
		lat: 33.405,
		lon: -118.4158
	},
	{
		icao: "KSMX",
		name: "Santa Maria",
		lat: 34.8989,
		lon: -120.4574
	},
	{
		icao: "KSBP",
		name: "San Luis Obispo",
		lat: 35.2368,
		lon: -120.6424
	},
	{
		icao: "KPRB",
		name: "Paso Robles",
		lat: 35.6729,
		lon: -120.6271
	},
	{
		icao: "KMRY",
		name: "Monterey",
		lat: 36.587,
		lon: -121.843
	},
	{
		icao: "KSNS",
		name: "Salinas",
		lat: 36.6628,
		lon: -121.6064
	},
	{
		icao: "KSJC",
		name: "San Jose",
		lat: 37.3626,
		lon: -121.929
	},
	{
		icao: "KNUQ",
		name: "Moffett",
		lat: 37.4161,
		lon: -122.0493
	},
	{
		icao: "KPAO",
		name: "Palo Alto",
		lat: 37.4611,
		lon: -122.115
	},
	{
		icao: "KSFO",
		name: "San Francisco Intl",
		lat: 37.6188,
		lon: -122.3754
	},
	{
		icao: "KOAK",
		name: "Oakland",
		lat: 37.7213,
		lon: -122.2207
	},
	{
		icao: "KHWD",
		name: "Hayward",
		lat: 37.6592,
		lon: -122.1222
	},
	{
		icao: "KAPC",
		name: "Napa",
		lat: 38.2132,
		lon: -122.2807
	},
	{
		icao: "KSTS",
		name: "Santa Rosa",
		lat: 38.5088,
		lon: -122.8131
	},
	{
		icao: "KSUU",
		name: "Travis AFB",
		lat: 38.2625,
		lon: -121.927
	},
	{
		icao: "KSMF",
		name: "Sacramento Intl",
		lat: 38.6954,
		lon: -121.5908
	},
	{
		icao: "KRDD",
		name: "Redding",
		lat: 40.509,
		lon: -122.2934
	},
	{
		icao: "KACV",
		name: "Arcata-Eureka",
		lat: 40.9781,
		lon: -124.1086
	},
	{
		icao: "KMFR",
		name: "Medford",
		lat: 42.3742,
		lon: -122.8735
	},
	{
		icao: "KEUG",
		name: "Eugene",
		lat: 44.1246,
		lon: -123.211
	},
	{
		icao: "KPDX",
		name: "Portland Intl",
		lat: 45.5887,
		lon: -122.5975
	},
	{
		icao: "KHIO",
		name: "Hillsboro",
		lat: 45.5404,
		lon: -122.9499
	},
	{
		icao: "KSEA",
		name: "Seattle-Tacoma",
		lat: 47.449,
		lon: -122.3093
	},
	{
		icao: "KBFI",
		name: "Boeing Field",
		lat: 47.53,
		lon: -122.302
	},
	{
		icao: "KPAE",
		name: "Paine Field",
		lat: 47.9063,
		lon: -122.2816
	},
	{
		icao: "KGEG",
		name: "Spokane",
		lat: 47.6199,
		lon: -117.5338
	},
	{
		icao: "KRNO",
		name: "Reno",
		lat: 39.4991,
		lon: -119.7681
	},
	{
		icao: "KLAS",
		name: "Las Vegas",
		lat: 36.0801,
		lon: -115.1522
	},
	{
		icao: "KPHX",
		name: "Phoenix Sky Harbor",
		lat: 33.4373,
		lon: -112.0078
	},
	{
		icao: "KSDL",
		name: "Scottsdale",
		lat: 33.6229,
		lon: -111.9105
	},
	{
		icao: "KTUS",
		name: "Tucson",
		lat: 32.1161,
		lon: -110.941
	},
	{
		icao: "KFAT",
		name: "Fresno Yosemite",
		lat: 36.7762,
		lon: -119.7181
	},
	{
		icao: "KBFL",
		name: "Bakersfield",
		lat: 35.4336,
		lon: -119.0568
	},
	{
		icao: "KPSP",
		name: "Palm Springs",
		lat: 33.8297,
		lon: -116.5067
	},
	{
		icao: "KDAG",
		name: "Barstow-Daggett",
		lat: 34.8537,
		lon: -116.787
	},
	{
		icao: "KWJF",
		name: "General Wm J Fox",
		lat: 34.7411,
		lon: -118.2186
	},
	{
		icao: "KPMD",
		name: "Palmdale",
		lat: 34.6294,
		lon: -118.0846
	},
	{
		icao: "KNID",
		name: "China Lake",
		lat: 35.6854,
		lon: -117.692
	},
	{
		icao: "KNLC",
		name: "Lemoore NAS",
		lat: 36.333,
		lon: -119.952
	},
	{
		icao: "KSLI",
		name: "Los Alamitos AAF",
		lat: 33.79,
		lon: -118.0514
	},
	{
		icao: "KBOI",
		name: "Boise",
		lat: 43.5644,
		lon: -116.2228
	},
	{
		icao: "KSLC",
		name: "Salt Lake City",
		lat: 40.7884,
		lon: -111.9778
	}
];
var STATION_PRESETS = [
	{
		id: "channel",
		label: "Channel Islands",
		icao: "KOXR"
	},
	{
		id: "mugu",
		label: "Point Mugu",
		icao: "KNTD"
	},
	{
		id: "socal",
		label: "Los Angeles basin",
		icao: "KLAX"
	},
	{
		id: "bay",
		label: "San Francisco Bay",
		icao: "KSFO"
	},
	{
		id: "puget",
		label: "Puget Sound",
		icao: "KSEA"
	},
	{
		id: "pdx",
		label: "Portland",
		icao: "KPDX"
	},
	{
		id: "vegas",
		label: "Las Vegas",
		icao: "KLAS"
	},
	{
		id: "phx",
		label: "Phoenix",
		icao: "KPHX"
	}
];
function nearestAirports(lat, lon, count = 6, maxNm = 180) {
	return WEST_AIRPORTS.map((ap) => ({
		...ap,
		nm: haversineNm({
			lat,
			lon
		}, ap)
	})).filter((ap) => ap.nm <= maxNm).sort((a, b) => a.nm - b.nm).slice(0, count);
}
function airportByIcao(icao) {
	return WEST_AIRPORTS.find((a) => a.icao === icao);
}
//#endregion
export { airportByIcao as n, nearestAirports as r, STATION_PRESETS as t };
