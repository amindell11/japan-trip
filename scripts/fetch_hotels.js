// Rakuten Travel hotel fetcher (VacantHotelSearch — real dates, availability).
// Setup once: copy .env.example to .env at repo root, fill in your keys.
// Run:   node --env-file=.env scripts/fetch_hotels.js
// Writes hotels.json at repo root.

const fs = require("fs");
const path = require("path");

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const ORIGIN = process.env.RAKUTEN_ORIGIN || "https://amindell11.github.io";
const USD_RATE = Number(process.env.USD_RATE || 150); // JPY per USD

if (!APP_ID || !ACCESS_KEY) {
  console.error("Missing RAKUTEN_APP_ID or RAKUTEN_ACCESS_KEY env vars.");
  process.exit(1);
}

const ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";

const TRANSLATE_ENDPOINT =
  "https://translate.googleapis.com/translate_a/single";
const TRANSLATION_CACHE_PATH = path.join(__dirname, "translations.json");

let translationCache = {};
try {
  translationCache = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_PATH, "utf8"));
} catch {}

function saveTranslationCache() {
  fs.writeFileSync(
    TRANSLATION_CACHE_PATH,
    JSON.stringify(translationCache, null, 2)
  );
}

async function translate(text) {
  if (!text) return text;
  if (translationCache[text]) return translationCache[text];
  const url = new URL(TRANSLATE_ENDPOINT);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "ja");
  url.searchParams.set("tl", "en");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  try {
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    const segments = data?.[0] || [];
    const translated = segments.map((s) => s[0]).join("").trim();
    translationCache[text] = translated || text;
    return translationCache[text];
  } catch {
    return text;
  }
}

const GUESTS = { adults: 4, rooms: 2 };

// One entry per hotel booking in the itinerary.
const STAYS = [
  {
    id: "tokyo-arrival",
    label: "Tokyo — Arrival",
    city: "Tokyo",
    checkin: "2026-06-04",
    checkout: "2026-06-07",
    centers: [
      { name: "Shinjuku", lat: 35.6938, lng: 139.7036 },
      { name: "Shibuya", lat: 35.6595, lng: 139.7004 },
      { name: "Asakusa", lat: 35.7148, lng: 139.7967 },
      { name: "Tokyo Sta", lat: 35.6812, lng: 139.7671 },
    ],
  },
  {
    id: "kyoto",
    label: "Kyoto",
    city: "Kyoto",
    checkin: "2026-06-08",
    checkout: "2026-06-10",
    centers: [
      { name: "Kyoto Sta", lat: 34.9858, lng: 135.7588 },
      { name: "Gion", lat: 35.0036, lng: 135.7778 },
    ],
  },
  {
    id: "osaka",
    label: "Osaka",
    city: "Osaka",
    checkin: "2026-06-12",
    checkout: "2026-06-14",
    centers: [
      { name: "Namba", lat: 34.6687, lng: 135.5013 },
      { name: "Umeda", lat: 34.7025, lng: 135.4959 },
    ],
  },
  {
    id: "tokyo-return",
    label: "Tokyo — Last Night",
    city: "Tokyo",
    checkin: "2026-06-14",
    checkout: "2026-06-15",
    centers: [
      { name: "Shinjuku", lat: 35.6938, lng: 139.7036 },
      { name: "Shibuya", lat: 35.6595, lng: 139.7004 },
      { name: "Tokyo Sta", lat: 35.6812, lng: 139.7671 },
    ],
  },
];

function loadUserPlaces() {
  const dataPath = path.join(__dirname, "..", "data.js");
  const src = fs.readFileSync(dataPath, "utf8");
  const fn = new Function(src + "\nreturn TRIP_DATA;");
  const data = fn();
  const byCity = {};
  for (const section of data.sections) {
    const places = [];
    for (const group of section.groups) {
      for (const p of group.places) {
        if (p.coords) places.push({ name: p.name, lat: p.coords[0], lng: p.coords[1] });
      }
    }
    byCity[section.name] = places;
  }
  return byCity;
}

const USER_PLACES = loadUserPlaces();

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    // VacantHotelSearch returns 404 when zero hotels match — treat as empty.
    if (res.status === 404) return { hotels: [], pagingInfo: { pageCount: 0, page: 1 } };
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  }
}

// Pull the cheapest plan's real total for the configured guests from roomInfo.
function extractCheapestPlan(hotelArr, nights) {
  let best = null;
  for (const item of hotelArr) {
    if (!item.roomInfo) continue;
    const basic = item.roomInfo.find((x) => x.roomBasicInfo)?.roomBasicInfo;
    const days = item.roomInfo
      .filter((x) => x.dailyCharge)
      .map((x) => x.dailyCharge);
    if (!days.length) continue;
    // Rakuten sometimes returns only one day's charge — assume nightly rate is
    // constant and multiply. When multiple days are returned, sum them.
    const perNightTotal =
      days.length >= nights
        ? days.reduce((s, d) => s + (d.total || 0), 0) / nights
        : days[0]?.total || 0;
    const tripTotal = perNightTotal * nights;
    if (!tripTotal) continue;
    if (!best || tripTotal < best.tripTotal) {
      best = {
        tripTotal,
        perNightTotal,
        roomName: basic?.roomName || null,
        planName: basic?.planName || null,
      };
    }
  }
  return best;
}

async function searchCenter(stay, center, nights) {
  console.log(`  [${stay.id}] ${center.name}`);
  const results = [];
  let page = 1;
  while (true) {
    const json = await fetchOnce({
      latitude: center.lat,
      longitude: center.lng,
      searchRadius: 3,
      checkinDate: stay.checkin,
      checkoutDate: stay.checkout,
      adultNum: GUESTS.adults,
      roomNum: GUESTS.rooms,
      hits: 30,
      page,
    });
    const hotels = json.hotels || [];
    for (const h of hotels) {
      const basic = h.hotel?.[0]?.hotelBasicInfo;
      if (!basic) continue;
      const plan = extractCheapestPlan(h.hotel, nights);
      results.push({ ...basic, _plan: plan });
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
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

// Weights: prioritize price + closeness, rating matters less.
const W = { price: 0.4, distance: 0.35, rating: 0.25 };

function scoreHotels(hotels, userPlaces) {
  const enriched = hotels
    .map((h) => {
      const near = nearestPlaceKm(
        { lat: h.latitude, lng: h.longitude },
        userPlaces
      );
      return {
        hotel: h,
        distanceKm: near.km,
        nearestPlace: near.name,
        tripTotalY: h._plan?.tripTotal || null,
        perNightTotalY: h._plan?.perNightTotal || null,
        roomNameJa: h._plan?.roomName || null,
        planNameJa: h._plan?.planName || null,
        rating: h.reviewAverage || null,
        reviews: h.reviewCount || 0,
      };
    })
    // Drop hotels where we couldn't resolve a real plan price.
    .filter((e) => e.tripTotalY);

  const prices = enriched.map((e) => e.tripTotalY);
  const dists = enriched.map((e) => e.distanceKm);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const dMin = Math.min(...dists);
  const dMax = Math.max(...dists);

  return enriched.map((e) => {
    const bayes = bayesianRating(e.rating, e.reviews);
    const ratingScore = ((bayes - 1) / 4) * 100;
    const priceScore = (1 - normalize01(e.tripTotalY, pMin, pMax)) * 100;
    const distanceScore = (1 - normalize01(e.distanceKm, dMin, dMax)) * 100;
    const score =
      W.price * priceScore + W.distance * distanceScore + W.rating * ratingScore;
    return { ...e, score: Math.round(score) };
  });
}

function dedupe(hotels) {
  const seen = new Map();
  for (const h of hotels) if (!seen.has(h.hotelNo)) seen.set(h.hotelNo, h);
  return [...seen.values()];
}

function nightsBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

async function main() {
  const output = {
    generatedAt: new Date().toISOString(),
    usdRate: USD_RATE,
    guests: GUESTS,
    legs: [],
  };

  for (const stay of STAYS) {
    const nights = nightsBetween(stay.checkin, stay.checkout);
    console.log(`\n=== ${stay.label} (${stay.checkin} → ${stay.checkout}, ${nights}n) ===`);
    let all = [];
    for (const c of stay.centers) {
      const batch = await searchCenter(stay, c, nights);
      all = all.concat(batch);
      await sleep(1200);
    }
    const unique = dedupe(all);
    console.log(`  ${all.length} total, ${unique.length} unique available`);
    const places = USER_PLACES[stay.city] || [];
    const scored = scoreHotels(unique, places);
    scored.sort((a, b) => b.score - a.score);
    const top = [];
    for (const e of scored.slice(0, 15)) {
      const priceNightY = Math.round(e.perNightTotalY);
      const priceTotalY = Math.round(e.tripTotalY);
      const addressJa = `${e.hotel.address1 || ""}${e.hotel.address2 || ""}`;
      const [name, access, address, roomType] = await Promise.all([
        translate(e.hotel.hotelName),
        translate(e.hotel.access),
        translate(addressJa),
        translate(e.roomNameJa),
      ]);
      top.push({
        hotelNo: e.hotel.hotelNo,
        name,
        nameJa: e.hotel.hotelName,
        score: e.score,
        // All prices are TOTALS for 4 guests in 2 rooms.
        priceNightY,
        priceNightUsd: Math.round(priceNightY / USD_RATE),
        priceTotalY,
        priceTotalUsd: Math.round(priceTotalY / USD_RATE),
        priceNightPerPersonY: Math.round(priceNightY / GUESTS.adults),
        priceNightPerPersonUsd: Math.round(priceNightY / GUESTS.adults / USD_RATE),
        roomType: roomType || null,
        roomTypeJa: e.roomNameJa || null,
        rating: e.rating,
        reviews: e.reviews,
        distanceKm: Math.round(e.distanceKm * 100) / 100,
        nearest: e.nearestPlace,
        lat: e.hotel.latitude,
        lng: e.hotel.longitude,
        access,
        address,
        image: e.hotel.hotelImageUrl || e.hotel.hotelThumbnailUrl,
        url: e.hotel.hotelInformationUrl,
      });
      await sleep(120);
    }

    output.legs.push({
      id: stay.id,
      label: stay.label,
      city: stay.city,
      checkin: stay.checkin,
      checkout: stay.checkout,
      nights,
      hotels: top,
    });
  }

  saveTranslationCache();
  const outPath = path.join(__dirname, "..", "hotels.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${outPath}`);
  for (const leg of output.legs) {
    const top = leg.hotels[0];
    console.log(
      `  ${leg.label}: ${leg.hotels.length} hotels, top=${top?.name} (${top?.score}, ¥${top?.priceNightY}/$${top?.priceNightUsd} per night)`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
