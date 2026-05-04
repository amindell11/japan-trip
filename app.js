const WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

const CITY_COLORS = {
  Tokyo: "#d64545",
  Kyoto: "#7a4fa8",
  Osaka: "#2e8b8b",
  "Optional Add-ons": "#c08a2e",
};

const TAG_ICONS = {
  temple: "🛕",
  shrine: "⛩️",
  castle: "🏯",
  historic: "🏯",
  "fuji-view": "🗻",
  alps: "🏔️",
  hike: "🥾",
  waterfall: "💦",
  nature: "🌲",
  park: "🌳",
  beach: "🏖️",
  camping: "⛺",
  glamping: "⛺",
  onsen: "♨️",
  wellness: "♨️",
  "theme-park": "🎢",
  anime: "🎮",
  arcades: "🕹️",
  art: "🎨",
  immersive: "🎨",
  food: "🍜",
  nightlife: "🍻",
  drinks: "🍶",
  cafe: "☕",
  dessert: "🍰",
  shopping: "🛍️",
  fashion: "👗",
  vintage: "👕",
  deer: "🦌",
  ghibli: "🌀",
  unesco: "🏛️",
  walking: "🚶",
  scenic: "🌄",
  water: "💧",
  urban: "🏙️",
  cultural: "🎎",
  activity: "🎯",
  retro: "📼",
  "day-trip": "🚆",
  iconic: "⭐",
};

const ICON_PRIORITY = [
  "temple", "shrine", "castle", "fuji-view", "alps", "hike", "waterfall",
  "beach", "camping", "glamping", "onsen", "theme-park", "anime", "art",
  "deer", "ghibli", "food", "nightlife", "dessert", "cafe", "fashion",
  "vintage", "park", "nature", "historic", "shopping", "walking",
];

function iconFor(place) {
  for (const p of ICON_PRIORITY) {
    if (place.tags?.includes(p)) return TAG_ICONS[p];
  }
  for (const t of place.tags || []) {
    if (TAG_ICONS[t]) return TAG_ICONS[t];
  }
  return "📍";
}

async function fetchThumb(title) {
  if (!title) return null;
  try {
    const res = await fetch(WIKI_SUMMARY + encodeURIComponent(title));
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

async function fetchWikiSummary(title) {
  if (!title) return null;
  try {
    const res = await fetch(WIKI_SUMMARY + encodeURIComponent(title));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchWikiExtract(title) {
  if (!title) return null;
  try {
    const url =
      "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1" +
      "&redirects=1&format=json&origin=*&titles=" +
      encodeURIComponent(title);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.extract || null;
  } catch {
    return null;
  }
}

async function fetchWikiImages(title, max = 6) {
  if (!title) return [];
  try {
    const res = await fetch(
      "https://en.wikipedia.org/api/rest_v1/page/media-list/" + encodeURIComponent(title)
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items || []).filter((i) => i.type === "image");
    const photos = [];
    for (const it of items) {
      const t = (it.title || "").replace(/^File:/i, "");
      if (!t) continue;
      if (/\.svg$/i.test(t)) continue;
      if (/(commons-logo|wiki.*\.png|icon|flag|coat_of_arms|locator)/i.test(t)) continue;
      const thumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(t)}?width=600`;
      const page = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t)}`;
      photos.push({ thumb, page });
      if (photos.length >= max) break;
    }
    return photos;
  } catch {
    return [];
  }
}

const wikiCache = new Map();

function getWikiBundle(title) {
  if (!title) return Promise.resolve(null);
  if (wikiCache.has(title)) return wikiCache.get(title);
  const p = Promise.all([
    fetchWikiSummary(title),
    fetchWikiExtract(title),
    fetchWikiImages(title, 5),
  ])
    .then(([summary, extract, images]) => ({
      heroImage:
        summary?.originalimage?.source || summary?.thumbnail?.source || null,
      extract: extract || null,
      images: images || [],
    }))
    .catch(() => null);
  wikiCache.set(title, p);
  return p;
}

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}

function directionsUrl(place) {
  if (place.coords) {
    const [lat, lng] = place.coords;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.name + " Japan"
  )}`;
}

function renderPlace(place) {
  const card = el("div", "card");
  const slug = slugify(place.name);
  card.dataset.slug = slug;
  const detailHref = "place.html?slug=" + encodeURIComponent(slug);
  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    window.location.href = detailHref;
  });
  const imgWrap = el("div", "card-img");
  card.appendChild(imgWrap);

  const body = el("div", "card-body");
  body.appendChild(el("h3", "card-title", place.name));
  if (place.travel) body.appendChild(el("p", "travel", place.travel));
  body.appendChild(el("p", "summary", place.summary));

  if (place.tags?.length) {
    const tags = el("div", "tags");
    for (const t of place.tags) tags.appendChild(el("span", "tag", t));
    body.appendChild(tags);
  }

  body.appendChild(el("div", "card-stats"));

  const actions = el("div", "card-actions");
  const more = el("a", "card-more", "View details →");
  more.href = detailHref;
  actions.appendChild(more);
  const dir = el("a", "card-directions", "Directions ↗");
  dir.href = directionsUrl(place);
  dir.target = "_blank";
  dir.rel = "noopener";
  actions.appendChild(dir);
  body.appendChild(actions);

  card.appendChild(body);

  fetchThumb(place.wiki).then((src) => {
    if (!src) {
      imgWrap.classList.add("no-img");
      return;
    }
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = place.name;
    img.src = src;
    imgWrap.appendChild(img);
  });

  return card;
}

function renderGroup(group) {
  const wrap = el("section", "group");
  wrap.appendChild(el("h2", "group-title", group.name));
  const grid = el("div", "grid");
  for (const p of group.places) grid.appendChild(renderPlace(p));
  wrap.appendChild(grid);
  return wrap;
}

function renderSection(section) {
  const wrap = el("section", "section");
  const id = section.name.toLowerCase().replace(/\s+/g, "-");
  wrap.id = id;
  wrap.appendChild(el("h1", "section-title", section.name));
  for (const g of section.groups) wrap.appendChild(renderGroup(g));
  return wrap;
}

function renderNav(sections) {
  const nav = document.getElementById("nav");
  for (const s of sections) {
    const a = el("a", null, s.name);
    a.href = "#" + s.name.toLowerCase().replace(/\s+/g, "-");
    nav.appendChild(a);
  }
}

function allPlaces(data) {
  const out = [];
  for (const s of data.sections) {
    for (const g of s.groups) {
      for (const p of g.places) {
        if (p.coords) out.push({ ...p, city: s.name, group: g.name });
      }
    }
  }
  return out;
}

function makeMarker(place) {
  const color = CITY_COLORS[place.city] || "#444";
  const emoji = iconFor(place);
  const icon = L.divIcon({
    className: "pin",
    html: `<div class="pin-pill" style="--c:${color}"><span>${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
  const marker = L.marker(place.coords, { icon, title: place.name });

  marker.bindTooltip(place.name, {
    permanent: true,
    direction: "right",
    offset: [14, 0],
    className: "place-label",
  });

  const tags = (place.tags || [])
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");
  const extraLinks = [
    ...(place.links || []),
    { label: "Directions ↗", url: directionsUrl(place) },
  ];
  const links = extraLinks
    .map(
      (l) =>
        `<li><a href="${l.url}" target="_blank" rel="noopener">${l.label}</a></li>`
    )
    .join("");
  const slug = slugify(place.name);
  marker.bindPopup(`
    <div class="popup">
      <div class="popup-city" style="color:${color}">${place.city} · ${place.group}</div>
      <h4><a href="place.html?slug=${encodeURIComponent(slug)}">${place.name}</a></h4>
      <p>${place.summary}</p>
      <div class="tags">${tags}</div>
      ${links ? `<ul class="links">${links}</ul>` : ""}
      <a class="popup-more" href="place.html?slug=${encodeURIComponent(slug)}">View details →</a>
    </div>
  `);
  return marker;
}

let map;
let markersLayer;
let staysLayer;
let currentBounds;
let allPlacesList = [];
let currentFilter = "all";
let hotelData = { legs: [] };
let showStays = false;

async function loadHotels() {
  try {
    const res = await fetch("hotels.json");
    if (!res.ok) return;
    hotelData = await res.json();
  } catch {
    hotelData = { legs: [] };
  }
}

function hotelPriceLine(hotel, nights) {
  const pn = hotel.priceNightY
    ? `¥${hotel.priceNightY.toLocaleString()} / $${hotel.priceNightUsd}`
    : "—";
  const pt =
    hotel.priceTotalY && nights > 1
      ? `${nights}n total ≈ ¥${hotel.priceTotalY.toLocaleString()} / $${hotel.priceTotalUsd}`
      : "";
  const pp =
    hotel.priceTotalY
      ? `≈ $${Math.round(hotel.priceTotalUsd / 4)} per person`
      : "";
  return { perNight: pn, total: pt, perPerson: pp };
}

function makeHotelMarker(hotel, leg) {
  const color = CITY_COLORS[leg.city] || "#444";
  const icon = L.divIcon({
    className: "pin",
    html: `<div class="hotel-pin" style="--c:${color}"><span>${hotel.score}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
  const m = L.marker([hotel.lat, hotel.lng], { icon, title: hotel.name });
  const price = hotelPriceLine(hotel, leg.nights);
  const rating = hotel.rating
    ? `⭐ ${hotel.rating} <span class="hotel-reviews">(${hotel.reviews})</span>`
    : "";
  m.bindPopup(`
    <div class="popup hotel-popup">
      ${hotel.image ? `<img src="${hotel.image}" alt="" class="hotel-thumb" loading="lazy" />` : ""}
      <div class="popup-city" style="color:${color}">${leg.label} · score ${hotel.score}/100</div>
      <h4>${hotel.name}</h4>
      <div class="hotel-meta">
        ${rating ? `<span>${rating}</span>` : ""}
        <span class="hotel-price">${price.perNight}/night · 4 guests</span>
      </div>
      ${price.total ? `<p class="hotel-dist">${price.total} · ${price.perPerson}</p>` : `<p class="hotel-dist">${price.perPerson}</p>`}
      ${hotel.roomType ? `<p class="hotel-dist">🛏️ ${hotel.roomType}</p>` : ""}
      <p class="hotel-dist">${hotel.distanceKm} km to ${hotel.nearest}</p>
      <a class="popup-more" href="${hotel.url}" target="_blank" rel="noopener">Book on Rakuten →</a>
    </div>
  `);
  return m;
}

function renderStays() {
  if (!staysLayer) staysLayer = L.layerGroup();
  staysLayer.clearLayers();
  if (!showStays) {
    if (map.hasLayer(staysLayer)) map.removeLayer(staysLayer);
    return;
  }
  const legs =
    currentFilter === "all"
      ? hotelData.legs
      : hotelData.legs.filter((l) => l.city === currentFilter);
  for (const leg of legs) {
    for (const h of leg.hotels || []) {
      staysLayer.addLayer(makeHotelMarker(h, leg));
    }
  }
  if (!map.hasLayer(staysLayer)) staysLayer.addTo(map);
}

function formatDateRange(checkin, checkout) {
  const fmt = (d) =>
    new Date(d + "T00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return `${fmt(checkin)} → ${fmt(checkout)}`;
}

function renderStayCard(hotel, leg) {
  const color = CITY_COLORS[leg.city] || "#444";
  const card = el("a", "stay-card");
  card.href = hotel.url;
  card.target = "_blank";
  card.rel = "noopener";

  const imgWrap = el("div", "stay-img");
  if (hotel.image) {
    const img = document.createElement("img");
    img.src = hotel.image;
    img.alt = hotel.name;
    img.loading = "lazy";
    imgWrap.appendChild(img);
  } else {
    imgWrap.classList.add("no-img");
  }
  const badge = el("span", "stay-score", hotel.score);
  badge.style.setProperty("--c", color);
  imgWrap.appendChild(badge);
  card.appendChild(imgWrap);

  const body = el("div", "stay-body");
  body.appendChild(el("h3", "stay-name", hotel.name));
  if (hotel.nameJa && hotel.nameJa !== hotel.name) {
    body.appendChild(el("p", "stay-name-ja", hotel.nameJa));
  }

  const meta = el("div", "stay-meta");
  if (hotel.rating) {
    meta.appendChild(
      el(
        "span",
        "stay-rating",
        `⭐ ${hotel.rating} <span class="muted">(${hotel.reviews})</span>`
      )
    );
  }
  meta.appendChild(
    el(
      "span",
      "stay-distance",
      `📍 ${hotel.distanceKm} km → ${hotel.nearest}`
    )
  );
  body.appendChild(meta);

  const price = hotelPriceLine(hotel, leg.nights);
  const priceEl = el("div", "stay-price");
  priceEl.innerHTML = `
    <span class="stay-price-night">${price.perNight}</span><span class="muted"> /night · 4 guests</span>
    ${price.total ? `<span class="stay-price-total">${price.total} · ${price.perPerson}</span>` : `<span class="stay-price-total">${price.perPerson}</span>`}
  `;
  body.appendChild(priceEl);

  if (hotel.roomType) {
    body.appendChild(el("p", "stay-room", hotel.roomType));
  }

  const cta = el("span", "stay-cta", "Book on Rakuten →");
  body.appendChild(cta);

  card.appendChild(body);
  return card;
}

const COUNCIL_REPORT_PATH = "council/council-report-20260417-234658.html";

function renderHotelsPanel(panel) {
  panel.innerHTML = "";
  if (!hotelData.legs.length) {
    panel.appendChild(
      el(
        "p",
        "stays-empty",
        "No stays data yet. Run scripts/fetch_hotels.js."
      )
    );
    return;
  }

  const hero = el("section", "stays-hero");
  hero.innerHTML = `
    <h1 class="stays-title">Stays</h1>
    <p class="stays-sub">
      ${hotelData.guests?.adults || 4} guests · ${hotelData.guests?.rooms || 2} rooms ·
      scored on price, closeness to your places, and rating.
      <span class="muted">USD ≈ ¥${hotelData.usdRate || 150}</span>
    </p>
  `;
  panel.appendChild(hero);

  for (const leg of hotelData.legs) {
    const section = el("section", "stays-leg");
    const color = CITY_COLORS[leg.city] || "#444";
    const head = el("header", "stays-leg-head");
    head.innerHTML = `
      <h2 class="stays-leg-title" style="border-color:${color}">${leg.label}</h2>
      <p class="stays-leg-sub">${formatDateRange(leg.checkin, leg.checkout)} · ${leg.nights} night${leg.nights > 1 ? "s" : ""}</p>
    `;
    section.appendChild(head);
    const grid = el("div", "stays-grid");
    for (const h of leg.hotels) grid.appendChild(renderStayCard(h, leg));
    section.appendChild(grid);
    panel.appendChild(section);
  }
}

function renderCouncilPanel(panel) {
  panel.innerHTML = "";
  const header = el("div", "council-header");
  header.innerHTML = `
    <h1 class="stays-title">Council Report</h1>
    <p class="stays-sub">5 AI advisors debate the hotel picks. <a href="${COUNCIL_REPORT_PATH}" target="_blank" rel="noopener" class="council-open">Open in new tab ↗</a></p>
  `;
  panel.appendChild(header);

  const frame = document.createElement("iframe");
  frame.src = COUNCIL_REPORT_PATH;
  frame.className = "council-iframe";
  frame.title = "LLM Council Report";
  panel.appendChild(frame);
}

function renderStaysView() {
  const root = document.getElementById("stays-view");
  root.innerHTML = "";

  const subtabs = el("div", "stays-subtabs");
  const hotelsBtn = el("button", "stays-subtab active", "Hotels");
  const councilBtn = el("button", "stays-subtab", "Council Report");
  subtabs.appendChild(hotelsBtn);
  subtabs.appendChild(councilBtn);
  root.appendChild(subtabs);

  const hotelsPanel = el("div", "stays-panel");
  renderHotelsPanel(hotelsPanel);
  root.appendChild(hotelsPanel);

  const councilPanel = el("div", "stays-panel");
  councilPanel.style.display = "none";
  root.appendChild(councilPanel);

  let councilLoaded = false;
  hotelsBtn.addEventListener("click", () => {
    hotelsBtn.classList.add("active");
    councilBtn.classList.remove("active");
    hotelsPanel.style.display = "";
    councilPanel.style.display = "none";
  });
  councilBtn.addEventListener("click", () => {
    councilBtn.classList.add("active");
    hotelsBtn.classList.remove("active");
    hotelsPanel.style.display = "none";
    councilPanel.style.display = "";
    if (!councilLoaded) {
      renderCouncilPanel(councilPanel);
      councilLoaded = true;
    }
  });
}

function renderMarkers(places) {
  if (!markersLayer) {
    markersLayer = L.layerGroup().addTo(map);
  } else {
    markersLayer.clearLayers();
  }
  const markers = places.map(makeMarker);
  for (const m of markers) markersLayer.addLayer(m);
  if (markers.length) {
    const group = L.featureGroup(markers);
    currentBounds = group.getBounds().pad(0.15);
    map.fitBounds(currentBounds, { animate: true });
  }
}

function initMap() {
  if (map) return;
  map = L.map("map", {
    scrollWheelZoom: true,
    zoomControl: true,
  }).setView([36, 137], 5);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);
  renderMarkers(allPlacesList);

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "legend");
    div.innerHTML = Object.entries(CITY_COLORS)
      .map(
        ([name, color]) =>
          `<div><span class="pin-dot" style="background:${color}"></span>${name}</div>`
      )
      .join("");
    return div;
  };
  legend.addTo(map);
}

function applyFilter(city) {
  currentFilter = city;
  for (const chip of document.querySelectorAll(".chip[data-city]")) {
    chip.classList.toggle("active", chip.dataset.city === city);
  }
  const filtered =
    city === "all"
      ? allPlacesList
      : allPlacesList.filter((p) => p.city === city);
  renderMarkers(filtered);
  renderStays();
}

function toggleStays() {
  showStays = !showStays;
  const btn = document.querySelector(".chip.stays-toggle");
  if (btn) btn.classList.toggle("active", showStays);
  renderStays();
}

function renderFilterBar(cities) {
  const bar = document.getElementById("filter-bar");
  const makeChip = (label, value) => {
    const btn = el("button", "chip", label);
    btn.dataset.city = value;
    if (value === currentFilter) btn.classList.add("active");
    btn.addEventListener("click", () => applyFilter(value));
    return btn;
  };
  bar.appendChild(makeChip("All", "all"));
  for (const c of cities) bar.appendChild(makeChip(c, c));

  const sep = el("span", "filter-sep");
  bar.appendChild(sep);

  const stays = el("button", "chip stays-toggle", "🏨 Stays");
  stays.title = "Toggle scored hotels near your places";
  stays.addEventListener("click", toggleStays);
  bar.appendChild(stays);
}

function setView(view) {
  document.body.dataset.view = view;
  for (const btn of document.querySelectorAll(".tab")) {
    btn.classList.toggle("active", btn.dataset.view === view);
  }
  if (view === "map") {
    setTimeout(() => {
      map.invalidateSize();
      if (currentBounds) map.fitBounds(currentBounds, { animate: false });
    }, 50);
  }
}

let allPlacesForItin = [];

function allPlacesIncludingCoordless(data) {
  const out = [];
  for (const s of data.sections) {
    for (const g of s.groups) {
      for (const p of g.places) {
        out.push({
          name: p.name,
          slug: slugify(p.name),
          city: s.name,
          group: g.name,
          tags: p.tags || [],
          summary: p.summary || "",
          emoji: iconFor(p),
          links: p.links || [],
        });
      }
    }
  }
  return out;
}

Promise.all([getTripData(), loadHotels()]).then(([data]) => {
  document.querySelector("h1.site-title").textContent = data.title;
  document.title = data.title;

  renderNav(data.sections);
  const list = document.getElementById("list-view");
  for (const s of data.sections) list.appendChild(renderSection(s));

  allPlacesList = allPlaces(data);
  allPlacesForItin = allPlacesIncludingCoordless(data);
  renderFilterBar(data.sections.map((s) => s.name));
  initMap();
  renderStaysView();
  initItinerary();

  for (const btn of document.querySelectorAll(".tab")) {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  }
  setView("list");

  loadCardStats();
});

function formatStats(s) {
  const parts = [];
  if (s?.ratingCount) {
    const avg = (s.ratingSum / s.ratingCount).toFixed(1);
    parts.push(`★ ${avg} (${s.ratingCount})`);
  }
  if (s?.commentCount) parts.push(`💬 ${s.commentCount}`);
  return parts.join("  ·  ");
}

function loadCardStats() {
  if (!window.Trip?.configured) return;
  window.Trip.getAllStats().then((stats) => {
    for (const card of document.querySelectorAll(".card[data-slug]")) {
      const slot = card.querySelector(".card-stats");
      if (!slot) continue;
      const s = stats[card.dataset.slug];
      const txt = formatStats(s);
      if (txt) slot.textContent = txt;
    }
  });
}

/* ---------- Itinerary board ---------- */

const DAY_COUNT = 13;
const TRIP_START = "2026-06-04";
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FALLBACK_EMOJIS = ["✨","🌸","🍡","🗾","🍵","🚅","🏮","🎐","📸","🧭","🎋","🍥","🎏"];

const boardState = {
  entries: [],
  editingId: null,
  dragging: false,
  paletteQuery: "",
  dayTitles: {},
};

function dateForDay(dayNum) {
  const [y, m, d] = TRIP_START.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dayNum - 1);
  return date;
}

function formatDayDate(dayNum) {
  const date = dateForDay(dayNum);
  return `${WEEKDAY_SHORT[date.getDay()]} · ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

const sortables = new Map();

function initItinerary() {
  buildBoardShell();
  setupBoardPopover();

  if (window.Trip?.configured) {
    window.Trip.subscribeItinerary((entries) => {
      boardState.entries = entries;
      reconcileBoard();
    });
    window.Trip.subscribeDayTitles((titles) => {
      boardState.dayTitles = titles || {};
      applyDayTitles();
    });
    window.Trip.on(() => {
      reconcileBoard();
    });
  } else {
    reconcileBoard();
  }
}

function applyDayTitles() {
  for (let d = 1; d <= DAY_COUNT; d++) {
    const input = document.querySelector(`.board-col-day-title[data-day="${d}"]`);
    if (!input) continue;
    const remote = boardState.dayTitles[String(d)] || "";
    if (document.activeElement !== input) input.value = remote;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function hashInt(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function placeFor(slug) {
  if (!slug) return null;
  return allPlacesForItin.find((p) => p.slug === slug) || null;
}

function entryEmoji(entry) {
  const p = placeFor(entry.placeSlug);
  if (p) {
    const full = TRIP_DATA
      ? (() => {
          const hit = findPlaceBySlug(TRIP_DATA, p.slug);
          return hit ? hit.place : null;
        })()
      : null;
    if (full) return iconFor(full);
  }
  return FALLBACK_EMOJIS[hashInt(entry.id || entry.title || "") % FALLBACK_EMOJIS.length];
}

function entryStripeColor(entry) {
  const p = placeFor(entry.placeSlug);
  if (p && CITY_COLORS[p.city]) return CITY_COLORS[p.city];
  return null;
}

function groupEntriesByDay(entries) {
  const byDay = new Map();
  for (let d = 1; d <= DAY_COUNT; d++) byDay.set(d, []);
  for (const e of entries) {
    const d = Number(e.day);
    if (!Number.isFinite(d) || d < 1 || d > DAY_COUNT) continue;
    byDay.get(d).push(e);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 0;
      const bo = typeof b.order === "number" ? b.order : 0;
      if (ao !== bo) return ao - bo;
      const aMs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bMs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return aMs - bMs;
    });
  }
  return byDay;
}

function buildBoardShell() {
  const board = document.getElementById("itinerary-board");
  if (!board || board.dataset.built === "1") return;
  board.dataset.built = "1";
  board.innerHTML = "";

  const daysStrip = el("div", "board-days-strip");
  for (let d = 1; d <= DAY_COUNT; d++) {
    daysStrip.appendChild(buildDayColumn(d));
  }
  board.appendChild(daysStrip);

  board.appendChild(buildIdeasPanel());
}

function buildDayColumn(dayNum) {
  const col = el("section", "board-col board-col-day");
  col.dataset.key = `day-${dayNum}`;

  const head = el("div", "board-col-head");
  head.innerHTML = `
    <span class="board-col-day-num">Day ${dayNum}</span>
    <span class="board-col-day-date">${escapeHtml(formatDayDate(dayNum))}</span>
    <span class="board-col-count" data-count></span>
  `;
  col.appendChild(head);

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "board-col-day-title";
  titleInput.dataset.day = String(dayNum);
  titleInput.placeholder = "Add a title…";
  titleInput.maxLength = 80;
  titleInput.value = boardState.dayTitles[String(dayNum)] || "";
  titleInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      titleInput.blur();
    } else if (ev.key === "Escape") {
      titleInput.value = boardState.dayTitles[String(dayNum)] || "";
      titleInput.blur();
    }
  });
  titleInput.addEventListener("blur", async () => {
    const current = boardState.dayTitles[String(dayNum)] || "";
    const next = titleInput.value.trim();
    if (next === current) return;
    if (!window.Trip?.configured) return;
    if (!window.Trip.currentUser) {
      titleInput.value = current;
      alert("Sign in to edit day titles");
      return;
    }
    try {
      await window.Trip.setDayTitle(dayNum, next);
    } catch (e) {
      alert(e.message);
      titleInput.value = current;
    }
  });
  col.appendChild(titleInput);

  const list = el("div", "board-col-list");
  list.dataset.day = String(dayNum);
  col.appendChild(list);

  col.appendChild(buildQuickAdd(dayNum));
  return col;
}

function buildQuickAdd(dayNum) {
  const wrap = el("div", "board-add");
  wrap.dataset.day = String(dayNum);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "board-add-input";
  input.placeholder = "+ add note…";

  const submit = async () => {
    const title = input.value.trim();
    if (!title) return;
    const siblings = getCardOrdersForDay(dayNum);
    const topOrder = siblings.length ? siblings[0] - 1 : 0;
    try {
      await window.Trip.addItineraryEntry({
        day: dayNum,
        order: topOrder,
        placeSlug: null,
        title,
        notes: "",
        tickets: [],
      });
      input.value = "";
    } catch (e) {
      alert(e.message);
    }
  };

  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      submit();
    }
  });

  wrap.append(input);
  return wrap;
}

function buildIdeasPanel() {
  const section = el("section", "board-ideas");
  section.innerHTML = `
    <div class="board-ideas-head">
      <span class="board-ideas-emoji">📝</span>
      <span class="board-ideas-title">Ideas</span>
      <span class="board-ideas-sub">drag a place onto a day</span>
      <input class="board-ideas-search" type="search" placeholder="Search name, city, or tag…" aria-label="Search places" />
      <span class="board-ideas-count" data-ideas-count></span>
    </div>
    <div class="board-ideas-list" data-day="palette"></div>
  `;
  const search = section.querySelector(".board-ideas-search");
  search.value = boardState.paletteQuery;
  search.addEventListener("input", () => {
    boardState.paletteQuery = search.value;
    renderPalette();
  });
  return section;
}

function getCardOrdersForDay(dayNum) {
  const list = document.querySelector(`.board-col-list[data-day="${dayNum}"]`);
  if (!list) return [];
  return [...list.querySelectorAll(":scope > .board-card")].map((el) => Number(el.dataset.order));
}

function paletteMatches(place, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (place.name.toLowerCase().includes(q)) return true;
  if (place.city.toLowerCase().includes(q)) return true;
  if (place.group && place.group.toLowerCase().includes(q)) return true;
  for (const t of place.tags || []) {
    if (t.toLowerCase().includes(q)) return true;
  }
  return false;
}

function reconcileBoard() {
  buildBoardShell();
  if (boardState.dragging) {
    boardState.pendingReconcile = true;
    return;
  }
  hidePopover();
  const byDay = groupEntriesByDay(boardState.entries);
  const user = window.Trip?.currentUser;
  const canDrag = !!user;

  for (let d = 1; d <= DAY_COUNT; d++) {
    const list = document.querySelector(`.board-col-list[data-day="${d}"]`);
    if (!list) continue;
    const entries = byDay.get(d) || [];

    list.innerHTML = "";
    if (entries.length === 0) {
      list.appendChild(el("div", "board-col-empty", "Drop here"));
    }
    for (const entry of entries) {
      const editing = user && boardState.editingId === entry.id;
      list.appendChild(
        editing ? renderCardEditor(entry) : renderCard(entry, user)
      );
    }

    const col = list.closest(".board-col");
    const countSlot = col.querySelector("[data-count]");
    if (countSlot) countSlot.textContent = entries.length ? `· ${entries.length}` : "";

    ensureDaySortable(list, canDrag);
  }

  renderPalette();
  updateAuthAffordances(user);
}

function usedSlugDayMap(entries) {
  const m = new Map();
  for (const e of entries) {
    if (!e.placeSlug) continue;
    const d = Number(e.day);
    if (!Number.isFinite(d) || d < 1 || d > DAY_COUNT) continue;
    if (!m.has(e.placeSlug)) m.set(e.placeSlug, d);
  }
  return m;
}

function renderPalette() {
  const list = document.querySelector('.board-ideas-list[data-day="palette"]');
  if (!list) return;
  list.innerHTML = "";
  const usedMap = usedSlugDayMap(boardState.entries);
  const filtered = allPlacesForItin.filter((p) => paletteMatches(p, boardState.paletteQuery));
  const free = filtered.filter((p) => !usedMap.has(p.slug));
  const used = filtered.filter((p) => usedMap.has(p.slug));
  for (const p of free) list.appendChild(renderPaletteCard(p, undefined));
  for (const p of used) list.appendChild(renderPaletteCard(p, usedMap.get(p.slug)));
  if (filtered.length === 0) {
    list.appendChild(el("div", "board-palette-empty", "No matches — try a different tag or name."));
  }
  const countSlot = document.querySelector("[data-ideas-count]");
  if (countSlot) {
    countSlot.textContent = `${free.length} free · ${filtered.length} shown`;
  }
  ensurePaletteSortable(list, !!window.Trip?.currentUser);
}

function renderPaletteCard(place, usedOnDay) {
  const card = el("article", "board-card board-palette-card");
  card.dataset.placeSlug = place.slug;
  const color = CITY_COLORS[place.city];
  if (color) card.style.setProperty("--stripe", color);

  const tagRow = (place.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="board-card-tag">${escapeHtml(t)}</span>`)
    .join("");

  const usedBadge = usedOnDay
    ? `<span class="board-palette-used-badge">Day ${usedOnDay}</span>`
    : "";

  const summary = place.summary
    ? `<p class="board-card-summary">${escapeHtml(place.summary)}</p>`
    : "";

  card.innerHTML = `
    <div class="board-card-head">
      <span class="board-card-emoji">${escapeHtml(place.emoji || "📍")}</span>
      <div class="board-card-title-wrap">
        <span class="board-card-title">${escapeHtml(place.name)}</span>
        <span class="board-palette-city">${escapeHtml(place.city)}</span>
      </div>
      ${usedBadge}
    </div>
    ${summary}
    ${tagRow ? `<div class="board-card-tags">${tagRow}</div>` : ""}
  `;

  if (usedOnDay) {
    card.classList.add("board-palette-used");
    card.title = `Already scheduled on Day ${usedOnDay}`;
  }

  return card;
}

function updateAuthAffordances(user) {
  const configured = window.Trip?.configured;
  for (const wrap of document.querySelectorAll(".board-add")) {
    const input = wrap.querySelector(".board-add-input");
    if (!configured) {
      input.disabled = true;
      input.placeholder = "Sign-in disabled";
    } else if (!user) {
      input.disabled = true;
      input.placeholder = "Sign in to plan";
    } else {
      input.disabled = false;
      input.placeholder = "+ add note…";
    }
  }
  for (const titleInput of document.querySelectorAll(".board-col-day-title")) {
    titleInput.disabled = !configured || !user;
  }
}

function ensureDaySortable(list, enabled) {
  if (typeof Sortable === "undefined") return;
  let inst = sortables.get(list);
  if (inst) {
    inst.option("disabled", !enabled);
    return;
  }
  inst = Sortable.create(list, {
    group: { name: "trip", pull: true, put: true },
    animation: 160,
    ghostClass: "board-card-ghost",
    chosenClass: "board-card-chosen",
    dragClass: "board-card-drag",
    disabled: !enabled,
    draggable: ".board-card",
    filter: ".board-card-editing, .board-col-empty",
    delay: 120,
    delayOnTouchOnly: true,
    touchStartThreshold: 6,
    onStart: () => {
      boardState.dragging = true;
      hidePopover();
    },
    onEnd: async (evt) => {
      boardState.dragging = false;
      await handleDrop(evt);
      if (boardState.pendingReconcile) {
        boardState.pendingReconcile = false;
        reconcileBoard();
      }
    },
  });
  sortables.set(list, inst);
}

function ensurePaletteSortable(list, enabled) {
  if (typeof Sortable === "undefined") return;
  let inst = sortables.get(list);
  if (inst) {
    inst.option("disabled", !enabled);
    return;
  }
  inst = Sortable.create(list, {
    group: { name: "trip", pull: "clone", put: false },
    sort: false,
    animation: 160,
    ghostClass: "board-card-ghost",
    chosenClass: "board-card-chosen",
    dragClass: "board-card-drag",
    disabled: !enabled,
    draggable: ".board-card",
    filter: ".board-palette-used",
    preventOnFilter: true,
    delay: 120,
    delayOnTouchOnly: true,
    touchStartThreshold: 6,
    onStart: () => {
      boardState.dragging = true;
      hidePopover();
    },
    onEnd: async (evt) => {
      boardState.dragging = false;
      await handleDrop(evt);
      if (boardState.pendingReconcile) {
        boardState.pendingReconcile = false;
        reconcileBoard();
      }
    },
  });
  sortables.set(list, inst);
}

async function handleDrop(evt) {
  const toDay = Number(evt.to.dataset.day);
  const fromPalette = evt.from.dataset.day === "palette";

  if (fromPalette) {
    if (!Number.isFinite(toDay)) {
      evt.item.remove();
      return;
    }
    const placeSlug = evt.item.dataset.placeSlug;
    const place = placeFor(placeSlug);
    if (!place) {
      evt.item.remove();
      return;
    }
    const alreadyUsed = boardState.entries.some((e) => e.placeSlug === placeSlug);
    if (alreadyUsed) {
      evt.item.remove();
      reconcileBoard();
      return;
    }
    const order = computeOrderFromDom(evt.to, evt.item);
    evt.item.remove();
    try {
      await window.Trip.addItineraryEntry({
        day: toDay,
        order,
        placeSlug,
        title: place.name,
        notes: "",
        tickets: [],
      });
    } catch (e) {
      alert(e.message);
      reconcileBoard();
    }
    return;
  }

  const id = evt.item.dataset.id;
  if (!id || !Number.isFinite(toDay)) {
    reconcileBoard();
    return;
  }
  const order = computeOrderFromDom(evt.to, evt.item);
  evt.item.dataset.order = String(order);
  try {
    await window.Trip.updateItineraryEntry(id, { day: toDay, order });
  } catch (e) {
    alert(e.message);
    reconcileBoard();
  }
}

function computeOrderFromDom(list, droppedEl) {
  const siblings = [...list.querySelectorAll(":scope > .board-card")];
  const idx = siblings.indexOf(droppedEl);
  const before = siblings[idx - 1];
  const after = siblings[idx + 1];
  const bo = before ? Number(before.dataset.order) : null;
  const ao = after ? Number(after.dataset.order) : null;
  if (bo == null && ao == null) return 0;
  if (bo == null) return ao - 1;
  if (ao == null) return bo + 1;
  return (bo + ao) / 2;
}

function renderCard(entry, user) {
  const card = el("article", "board-card");
  card.dataset.id = entry.id;
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);

  const stripe = entryStripeColor(entry);
  if (stripe) card.style.setProperty("--stripe", stripe);
  else card.classList.add("board-card-plain");

  const head = el("div", "board-card-head");
  head.innerHTML = `<span class="board-card-emoji">${escapeHtml(entryEmoji(entry))}</span>`;
  const titleWrap = el("div", "board-card-title-wrap");
  if (entry.placeSlug) {
    const a = document.createElement("a");
    a.href = "place.html?slug=" + encodeURIComponent(entry.placeSlug);
    a.className = "board-card-title board-card-title-link";
    a.textContent = entry.title;
    a.addEventListener("mousedown", (ev) => ev.stopPropagation());
    titleWrap.appendChild(a);
  } else {
    titleWrap.appendChild(el("span", "board-card-title", escapeHtml(entry.title)));
  }
  head.appendChild(titleWrap);

  if (user && entry.createdBy?.uid === user.uid) {
    const actions = el("div", "board-card-actions");
    const editBtn = el("button", "board-card-btn", "✎");
    editBtn.type = "button";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      boardState.editingId = entry.id;
      reconcileBoard();
    });
    const delBtn = el("button", "board-card-btn board-card-btn-danger", "×");
    delBtn.type = "button";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm("Delete this card?")) return;
      try {
        await window.Trip.deleteItineraryEntry(entry.id);
      } catch (e) {
        alert(e.message);
      }
    });
    actions.append(editBtn, delBtn);
    head.appendChild(actions);
  }

  card.appendChild(head);

  const place = placeFor(entry.placeSlug);
  if (place?.summary) {
    card.appendChild(el("p", "board-card-summary", escapeHtml(place.summary)));
  }

  if (entry.notes) {
    card.appendChild(el("p", "board-card-notes", escapeHtml(entry.notes)));
  }

  const tags = place?.tags?.slice(0, 4) || [];
  if (tags.length) {
    const tagRow = el("div", "board-card-tags");
    for (const t of tags) {
      tagRow.appendChild(el("span", "board-card-tag", escapeHtml(t)));
    }
    card.appendChild(tagRow);
  }

  const tickets = (entry.tickets || []).filter((t) => t && t.url);
  if (tickets.length) {
    const ul = el("ul", "board-card-tickets");
    for (const t of tickets) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = t.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = (t.label || "Ticket") + " ↗";
      a.addEventListener("mousedown", (ev) => ev.stopPropagation());
      li.appendChild(a);
      ul.appendChild(li);
    }
    card.appendChild(ul);
  }

  return card;
}

function renderCardEditor(entry) {
  const card = el("form", "board-card board-card-editing");
  card.dataset.id = entry.id;
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);

  const tickets = (entry.tickets || []).map((t) => ({
    label: t.label || "",
    url: t.url || "",
  }));
  if (tickets.length === 0) tickets.push({ label: "", url: "" });

  card.innerHTML = `
    <input class="board-edit-title" type="text" value="${escapeHtml(entry.title || "")}" placeholder="Title" required />
    <textarea class="board-edit-notes" rows="2" placeholder="Notes (optional)">${escapeHtml(entry.notes || "")}</textarea>
    <div class="board-edit-tickets"></div>
    <button type="button" class="board-edit-add-ticket">+ link</button>
    <div class="board-edit-actions">
      <button type="button" class="board-card-btn board-edit-cancel">Cancel</button>
      <button type="submit" class="board-card-btn board-edit-save">Save</button>
    </div>
  `;

  const ticketHost = card.querySelector(".board-edit-tickets");
  const renderTickets = () => {
    ticketHost.innerHTML = "";
    tickets.forEach((t, i) => {
      const row = el("div", "board-edit-ticket-row");
      row.innerHTML = `
        <input data-i="${i}" data-k="label" type="text" placeholder="Label" value="${escapeHtml(t.label)}" />
        <input data-i="${i}" data-k="url" type="url" placeholder="https://…" value="${escapeHtml(t.url)}" />
        <button type="button" class="board-card-btn board-card-btn-danger" data-rm="${i}">×</button>
      `;
      ticketHost.appendChild(row);
    });
  };
  renderTickets();

  ticketHost.addEventListener("input", (ev) => {
    const i = ev.target.dataset.i;
    const k = ev.target.dataset.k;
    if (i != null && k) tickets[Number(i)][k] = ev.target.value;
  });
  ticketHost.addEventListener("click", (ev) => {
    const rm = ev.target.dataset.rm;
    if (rm != null) {
      tickets.splice(Number(rm), 1);
      if (tickets.length === 0) tickets.push({ label: "", url: "" });
      renderTickets();
    }
  });
  card.querySelector(".board-edit-add-ticket").addEventListener("click", () => {
    tickets.push({ label: "", url: "" });
    renderTickets();
  });

  const titleInput = card.querySelector(".board-edit-title");

  card.querySelector(".board-edit-cancel").addEventListener("click", () => {
    boardState.editingId = null;
    reconcileBoard();
  });

  card.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    const cleanTickets = tickets
      .map((t) => ({ label: t.label.trim(), url: t.url.trim() }))
      .filter((t) => t.url);
    try {
      await window.Trip.updateItineraryEntry(entry.id, {
        title,
        notes: card.querySelector(".board-edit-notes").value.trim(),
        tickets: cleanTickets,
      });
      boardState.editingId = null;
    } catch (e) {
      alert(e.message);
    }
  });

  return card;
}

/* ---------- Card hover popover ---------- */

const popoverState = {
  el: null,
  showTimer: null,
  hideTimer: null,
  currentCard: null,
  showDelay: 260,
  hideDelay: 100,
};

function ensurePopoverEl() {
  if (popoverState.el) return popoverState.el;
  const pop = document.createElement("div");
  pop.className = "board-popover";
  pop.setAttribute("role", "tooltip");
  pop.style.display = "none";
  pop.addEventListener("mouseenter", () => {
    clearTimeout(popoverState.hideTimer);
    popoverState.hideTimer = null;
  });
  pop.addEventListener("mouseleave", () => schedulePopoverHide());
  document.body.appendChild(pop);
  popoverState.el = pop;
  return pop;
}

function hidePopover() {
  clearTimeout(popoverState.showTimer);
  clearTimeout(popoverState.hideTimer);
  popoverState.showTimer = null;
  popoverState.hideTimer = null;
  if (popoverState.el) popoverState.el.style.display = "none";
  popoverState.currentCard = null;
}

function schedulePopoverHide() {
  clearTimeout(popoverState.hideTimer);
  popoverState.hideTimer = setTimeout(hidePopover, popoverState.hideDelay);
}

function popoverContextForCard(card) {
  const paletteSlug = card.dataset.placeSlug;
  let placeSlug = paletteSlug || null;
  let entry = null;
  if (!placeSlug && card.dataset.id) {
    entry = boardState.entries.find((e) => e.id === card.dataset.id);
    if (entry) placeSlug = entry.placeSlug || null;
  }
  const hit = placeSlug && TRIP_DATA ? findPlaceBySlug(TRIP_DATA, placeSlug) : null;
  return { entry, hit, place: hit ? hit.place : null };
}

function popoverHTMLForCard(card) {
  const { entry, hit, place } = popoverContextForCard(card);

  if (!place) {
    if (!entry) return null;
    const hasNotes = entry.notes && entry.notes.trim();
    const hasTickets = (entry.tickets || []).some((t) => t && t.url);
    if (!hasNotes && !hasTickets) return null;
    const ticketRow = (entry.tickets || [])
      .filter((t) => t && t.url)
      .map(
        (t) =>
          `<a href="${escapeHtml(t.url)}" target="_blank" rel="noopener">${escapeHtml(
            t.label || "Link"
          )}</a>`
      )
      .join("");
    return `
      <div class="board-popover-body">
        <div class="board-popover-head">
          <span class="board-popover-emoji">${escapeHtml(entryEmoji(entry))}</span>
          <div class="board-popover-title-wrap">
            <span class="board-popover-title">${escapeHtml(entry.title || "Untitled")}</span>
            <span class="board-popover-sub">Day ${entry.day} · custom note</span>
          </div>
        </div>
        ${hasNotes ? `<p class="board-popover-summary">${escapeHtml(entry.notes)}</p>` : ""}
        ${ticketRow ? `<div class="board-popover-links">${ticketRow}</div>` : ""}
      </div>
    `;
  }

  const sectionName = hit?.section?.name || "";
  const groupName = hit?.group?.name || "";
  const breadcrumb = [sectionName, groupName].filter(Boolean).map(escapeHtml).join(" · ");

  const tagRow = (place.tags || [])
    .map((t) => `<span class="board-popover-tag">${escapeHtml(t)}</span>`)
    .join("");

  const refLinks = [];
  if (place.wiki) {
    refLinks.push({
      label: "Wikipedia",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(place.wiki)}`,
    });
  }
  if (place.coords) {
    const [lat, lng] = place.coords;
    refLinks.push({
      label: "Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
  } else {
    refLinks.push({
      label: "Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        place.name + " Japan"
      )}`,
    });
  }

  const allLinks = (place.links || []).concat(refLinks);
  const linkRow = allLinks
    .map(
      (l) =>
        `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
    )
    .join("");

  const slug = slugify(place.name);
  const entryNote = entry?.notes?.trim();

  const heroBlock = place.wiki
    ? `<div class="board-popover-hero" data-hero><div class="board-popover-hero-skeleton"></div></div>`
    : "";

  const summaryBlock = place.summary
    ? `<p class="board-popover-summary" data-summary>${escapeHtml(place.summary)}</p>`
    : place.wiki
    ? `<p class="board-popover-summary board-popover-muted" data-summary>Loading description…</p>`
    : "";

  return `
    ${heroBlock}
    <div class="board-popover-body">
      <div class="board-popover-head">
        <span class="board-popover-emoji">${escapeHtml(iconFor(place))}</span>
        <div class="board-popover-title-wrap">
          <span class="board-popover-title">${escapeHtml(place.name)}</span>
          ${breadcrumb ? `<span class="board-popover-sub">${breadcrumb}</span>` : ""}
        </div>
      </div>
      ${place.travel ? `<p class="board-popover-travel">🚆 ${escapeHtml(place.travel)}</p>` : ""}
      ${summaryBlock}
      ${entryNote ? `<p class="board-popover-notes">${escapeHtml(entryNote)}</p>` : ""}
      ${tagRow ? `<div class="board-popover-tags">${tagRow}</div>` : ""}
      <div class="board-popover-gallery" data-gallery hidden></div>
      ${linkRow ? `<div class="board-popover-links">${linkRow}</div>` : ""}
      <a class="board-popover-more" href="place.html?slug=${encodeURIComponent(slug)}">View full details →</a>
    </div>
  `;
}

function truncateText(text, max) {
  if (!text) return "";
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastBreak = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf("? "), clipped.lastIndexOf("! "));
  if (lastBreak > max * 0.5) return clipped.slice(0, lastBreak + 1) + " …";
  return clipped.replace(/\s+\S*$/, "") + "…";
}

function enrichPopover(pop, card, place, data) {
  if (!data) return;
  if (popoverState.currentCard !== card) return;

  const heroSlot = pop.querySelector("[data-hero]");
  if (heroSlot) {
    if (data.heroImage) {
      heroSlot.innerHTML = "";
      const img = document.createElement("img");
      img.src = data.heroImage;
      img.alt = place.name;
      img.loading = "lazy";
      heroSlot.appendChild(img);
    } else {
      heroSlot.remove();
    }
  }

  const summarySlot = pop.querySelector("[data-summary]");
  if (summarySlot && data.extract) {
    const text = truncateText(data.extract, 320);
    summarySlot.textContent = text;
    summarySlot.classList.remove("board-popover-muted");
  } else if (summarySlot && summarySlot.classList.contains("board-popover-muted")) {
    summarySlot.textContent = place.summary || "";
    if (place.summary) summarySlot.classList.remove("board-popover-muted");
  }

  const gallery = pop.querySelector("[data-gallery]");
  if (gallery && data.images && data.images.length) {
    const extras = data.images.filter((img) => img.thumb !== data.heroImage).slice(0, 4);
    if (extras.length) {
      gallery.hidden = false;
      gallery.innerHTML = extras
        .map(
          (img) =>
            `<a class="board-popover-thumb" href="${escapeHtml(img.page)}" target="_blank" rel="noopener">` +
            `<img src="${escapeHtml(img.thumb)}" alt="" loading="lazy" /></a>`
        )
        .join("");
    }
  }

  if (popoverState.currentCard === card) positionPopover(card, pop);
}

function positionPopover(card, pop) {
  const margin = 8;
  const overlap = 4;
  const cardRect = card.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = cardRect.right - overlap;
  if (left + popRect.width + margin > vw) {
    const leftSide = cardRect.left - popRect.width + overlap;
    if (leftSide >= margin) {
      left = leftSide;
    } else {
      left = Math.max(margin, vw - popRect.width - margin);
    }
  }

  let top = cardRect.top;
  if (top + popRect.height + margin > vh) {
    top = Math.max(margin, vh - popRect.height - margin);
  }
  if (top < margin) top = margin;

  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
}

function showPopoverFor(card) {
  if (boardState.dragging) return;
  if (card.classList.contains("board-card-editing")) return;
  const html = popoverHTMLForCard(card);
  if (!html) return;
  const pop = ensurePopoverEl();
  pop.innerHTML = html;
  pop.style.display = "block";
  pop.style.left = "-9999px";
  pop.style.top = "-9999px";
  requestAnimationFrame(() => positionPopover(card, pop));

  const { place } = popoverContextForCard(card);
  if (place && place.wiki) {
    getWikiBundle(place.wiki).then((data) => {
      if (popoverState.currentCard !== card) return;
      enrichPopover(pop, card, place, data);
    });
  }
}

function setupBoardPopover() {
  const board = document.getElementById("itinerary-board");
  if (!board || board.dataset.popoverWired === "1") return;
  board.dataset.popoverWired = "1";

  board.addEventListener("mouseover", (ev) => {
    const card = ev.target.closest(".board-card");
    if (!card || !board.contains(card)) return;
    if (popoverState.currentCard === card) {
      clearTimeout(popoverState.hideTimer);
      popoverState.hideTimer = null;
      return;
    }
    if (popoverState.el && popoverState.el.style.display === "block") {
      popoverState.el.style.display = "none";
    }
    popoverState.currentCard = card;
    clearTimeout(popoverState.showTimer);
    clearTimeout(popoverState.hideTimer);
    popoverState.hideTimer = null;
    popoverState.showTimer = setTimeout(() => {
      if (popoverState.currentCard === card) showPopoverFor(card);
    }, popoverState.showDelay);
  });

  board.addEventListener("mouseout", (ev) => {
    const card = ev.target.closest(".board-card");
    if (!card) return;
    const to = ev.relatedTarget;
    if (to && (card.contains(to) || (popoverState.el && popoverState.el.contains(to)))) return;
    if (popoverState.currentCard === card) {
      clearTimeout(popoverState.showTimer);
      popoverState.showTimer = null;
      schedulePopoverHide();
      popoverState.currentCard = null;
    }
  });

  window.addEventListener("scroll", hidePopover, true);
  window.addEventListener("resize", hidePopover);
}
