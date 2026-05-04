// Pre-computes walking ETAs between nearby places in TRIP_DATA -> distances.json.
//
// Usage:
//   node scripts/compute-distances.js
//
// Output (distances.json at repo root):
//   { "slug-a::slug-b": { "meters": 1240, "walkSec": 1080 }, ... }
//   Keys are alphabetically-sorted slug pairs.
//
// Strategy:
//   - Pairs > 2 km haversine are skipped (too far to walk).
//   - One OSRM /table call retrieves the full matrix for all coords at once.
//   - We use OSRM's routed *distance* (street-network meters, not crow-flight)
//     and compute walking seconds from that at WALKING_SPEED_MPS. The public
//     OSRM demo only serves the car profile, so its durations are car speeds,
//     useless for walking — but its distances closely track walking distance
//     in dense urban grids, which is what we care about.
//   - Pairs > 30 min walking are skipped (transit territory; UI links to Google Maps instead).
//
// The runtime falls back to straight-line × WALKING_SPEED_MPS for any pair
// not in this file, so newly-added places work even before this script is re-run.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const DATA_JS = path.join(ROOT, "data.js");
const OUTPUT = path.join(ROOT, "distances.json");

const HAVERSINE_KM_MAX = 2.0;
const WALK_SEC_MAX = 1800;
const WALKING_SPEED_MPS = 1.4; // ≈ 5 km/h, typical urban pace
const OSRM_HOST = "router.project-osrm.org";

function loadTripData() {
  const src = fs.readFileSync(DATA_JS, "utf-8");
  const wrapped =
    src + "\nthis.TRIP_DATA = TRIP_DATA;\nthis.slugify = slugify;";
  const ctx = {};
  vm.runInNewContext(wrapped, ctx);
  return { TRIP_DATA: ctx.TRIP_DATA, slugify: ctx.slugify };
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]),
    lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { "User-Agent": "japan-trip-distances-script" } },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              return reject(
                new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`)
              );
            }
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
}

(async () => {
  const { TRIP_DATA, slugify } = loadTripData();

  const places = [];
  for (const section of TRIP_DATA.sections) {
    for (const group of section.groups) {
      for (const place of group.places) {
        if (!Array.isArray(place.coords) || place.coords.length !== 2) continue;
        places.push({
          slug: slugify(place.name),
          name: place.name,
          city: section.name,
          lat: place.coords[0],
          lng: place.coords[1],
        });
      }
    }
  }
  console.log(`Loaded ${places.length} places with coords.`);

  const candidates = [];
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const km = haversineKm(
        [places[i].lat, places[i].lng],
        [places[j].lat, places[j].lng]
      );
      if (km <= HAVERSINE_KM_MAX) candidates.push({ i, j, km });
    }
  }
  console.log(
    `${candidates.length} pairs within ${HAVERSINE_KM_MAX} km straight-line.`
  );

  if (candidates.length === 0) {
    fs.writeFileSync(OUTPUT, JSON.stringify({}, null, 2) + "\n");
    console.log(`Wrote empty ${path.relative(ROOT, OUTPUT)}.`);
    return;
  }

  const coordStr = places.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://${OSRM_HOST}/table/v1/foot/${coordStr}?annotations=duration,distance`;
  console.log(`Calling OSRM /table for ${places.length} coords (URL ${url.length} chars)...`);
  const result = await fetchJson(url);
  if (result.code !== "Ok") {
    throw new Error(`OSRM error: ${result.code} ${result.message || ""}`);
  }

  const out = {};
  let kept = 0,
    skipped = 0;
  for (const { i, j } of candidates) {
    const dist = result.distances?.[i]?.[j];
    if (typeof dist !== "number") {
      skipped++;
      continue;
    }
    const meters = Math.round(dist);
    const walkSec = Math.round(dist / WALKING_SPEED_MPS);
    if (walkSec > WALK_SEC_MAX) {
      skipped++;
      continue;
    }
    const a = places[i].slug;
    const b = places[j].slug;
    const key = a < b ? `${a}::${b}` : `${b}::${a}`;
    out[key] = { meters, walkSec };
    kept++;
  }

  const sorted = {};
  for (const k of Object.keys(out).sort()) sorted[k] = out[k];
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 2) + "\n");
  console.log(
    `Wrote ${kept} pairs to ${path.relative(ROOT, OUTPUT)} (skipped ${skipped} too-long/missing).`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
