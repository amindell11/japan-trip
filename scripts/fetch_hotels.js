// Rakuten Travel hotel fetcher.
// Usage:
//   RAKUTEN_APP_ID=... RAKUTEN_ACCESS_KEY=... node scripts/fetch_hotels.js
// Writes hotels.json at repo root.

const fs = require("fs");
const path = require("path");

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const ORIGIN = process.env.RAKUTEN_ORIGIN || "https://amindell11.github.io";

if (!APP_ID || !ACCESS_KEY) {
  console.error("Missing RAKUTEN_APP_ID or RAKUTEN_ACCESS_KEY env vars.");
  process.exit(1);
}

const ENDPOINT = "https://openapi.rakuten.co.jp/engine/api/Travel/SimpleHotelSearch/20170426";

// Search centers covering each city. Radius is 3km (API max). Use multiple
// centers per city to cover the user's place spread.
const SEARCH_CENTERS = {
  Tokyo: [
    { name: "Shinjuku",  lat: 35.6938, lng: 139.7036 },
    { name: "Shibuya",   lat: 35.6595, lng: 139.7004 },
    { name: "Asakusa",   lat: 35.7148, lng: 139.7967 },
    { name: "Tokyo Sta", lat: 35.6812, lng: 139.7671 },
  ],
  Kyoto: [
    { name: "Kyoto Sta", lat: 34.9858, lng: 135.7588 },
    { name: "Gion",      lat: 35.0036, lng: 135.7778 },
  ],
  Osaka: [
    { name: "Namba",     lat: 34.6687, lng: 135.5013 },
    { name: "Umeda",     lat: 34.7025, lng: 135.4959 },
  ],
};

// User places by city, for distance scoring. Kept in sync with data.js.
const USER_PLACES_BY_CITY = loadUserPlaces();

function loadUserPlaces() {
  // data.js is a browser file; load it by exec'ing in a sandbox to grab TRIP_DATA.
  const dataPath = path.join(__dirname, "..", "data.js");
  const src = fs.readFileSync(dataPath, "utf8");
  const fn = new Function(src + "\nreturn TRIP_DATA;");
  const data = fn();
  const byCity = {};
  for (const section of data.sections) {
    const city = section.name;
    if (!SEARCH_CENTERS[city]) continue;
    const places = [];
    for (const group of section.groups) {
      for (const p of group.places) {
        if (p.coords && Array.isArray(p.coords)) {
          places.push({ name: p.name, lat: p.coords[0], lng: p.coords[1] });
        }
      }
    }
    byCity[city] = places;
  }
  return byCity;
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearestPlaceKm(point, places) {
  let best = Infinity;
  let bestName = null;
  for (const p of places) {
    const d = haversineKm(point, p);
    if (d < best) {
      best = d;
      bestName = p.name;
    }
  }
  return { km: best, name: bestName };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOnce(params) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", APP_ID);
  url.searchParams.set("accessKey", ACCESS_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("datumType", "1");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let attempt = 0;
  while (true) {
    const res = await fetch(url, { headers: { Origin: ORIGIN } });
    const text = await res.text();
    if (res.status === 429 && attempt < 5) {
      attempt++;
      await sleep(1500 * attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  }
}

async function searchCenter(city, center) {
  console.log(`  [${city}] ${center.name} (${center.lat},${center.lng})`);
  const results = [];
  let page = 1;
  while (true) {
    const json = await fetchOnce({
      latitude: center.lat,
      longitude: center.lng,
      searchRadius: 3,
      hits: 30,
      page,
    });
    const hotels = json.hotels || [];
    for (const h of hotels) {
      const basic = h.hotel?.[0]?.hotelBasicInfo;
      if (basic) results.push(basic);
    }
    const pi = json.pagingInfo;
    if (!pi || pi.page >= pi.pageCount || page >= 10) break;
    page++;
    await sleep(1100);
  }
  return results;
}

function bayesianRating(avg, count, prior = 3.5, priorWeight = 15) {
  if (!count || !avg) return prior;
  return (avg * count + prior * priorWeight) / (count + priorWeight);
}

function normalize01(v, min, max) {
  if (max <= min) return 0.5;
  const x = (v - min) / (max - min);
  return Math.max(0, Math.min(1, x));
}

function scoreHotels(hotels, userPlaces) {
  const enriched = hotels.map((h) => {
    const near = nearestPlaceKm(
      { lat: h.latitude, lng: h.longitude },
      userPlaces
    );
    return {
      hotel: h,
      distanceKm: near.km,
      nearestPlace: near.name,
      priceY: h.hotelMinCharge || null,
      rating: h.reviewAverage || null,
      reviews: h.reviewCount || 0,
    };
  });

  const prices = enriched.map((e) => e.priceY).filter((p) => p != null);
  const dists = enriched.map((e) => e.distanceKm);
  const pMin = prices.length ? Math.min(...prices) : 0;
  const pMax = prices.length ? Math.max(...prices) : 1;
  const dMin = Math.min(...dists);
  const dMax = Math.max(...dists);

  return enriched.map((e) => {
    const bayes = bayesianRating(e.rating, e.reviews);
    const ratingScore = ((bayes - 1) / 4) * 100;
    const priceScore =
      e.priceY == null ? 50 : (1 - normalize01(e.priceY, pMin, pMax)) * 100;
    const distanceScore = (1 - normalize01(e.distanceKm, dMin, dMax)) * 100;
    const score = 0.45 * ratingScore + 0.25 * priceScore + 0.3 * distanceScore;
    return { ...e, score: Math.round(score) };
  });
}

function dedupe(hotels) {
  const seen = new Map();
  for (const h of hotels) {
    const existing = seen.get(h.hotelNo);
    if (!existing) seen.set(h.hotelNo, h);
  }
  return [...seen.values()];
}

async function main() {
  const output = { generatedAt: new Date().toISOString(), cities: {} };

  for (const [city, centers] of Object.entries(SEARCH_CENTERS)) {
    console.log(`\n=== ${city} ===`);
    let all = [];
    for (const c of centers) {
      const batch = await searchCenter(city, c);
      all = all.concat(batch);
      await sleep(1200);
    }
    const unique = dedupe(all);
    console.log(`  ${all.length} total, ${unique.length} unique`);
    const userPlaces = USER_PLACES_BY_CITY[city] || [];
    const scored = scoreHotels(unique, userPlaces);
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 40).map((e) => ({
      hotelNo: e.hotel.hotelNo,
      name: e.hotel.hotelName,
      score: e.score,
      priceY: e.priceY,
      rating: e.rating,
      reviews: e.reviews,
      distanceKm: Math.round(e.distanceKm * 100) / 100,
      nearest: e.nearestPlace,
      lat: e.hotel.latitude,
      lng: e.hotel.longitude,
      access: e.hotel.access,
      address: `${e.hotel.address1 || ""}${e.hotel.address2 || ""}`,
      image: e.hotel.hotelThumbnailUrl,
      url: e.hotel.hotelInformationUrl,
    }));
    output.cities[city] = top;
  }

  const outPath = path.join(__dirname, "..", "hotels.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${outPath}`);
  for (const [city, hotels] of Object.entries(output.cities)) {
    console.log(`  ${city}: ${hotels.length} hotels, top score ${hotels[0]?.score}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
