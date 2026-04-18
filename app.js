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
let hotelsByCity = {};
let showStays = false;

async function loadHotels() {
  try {
    const res = await fetch("hotels.json");
    if (!res.ok) return;
    const data = await res.json();
    hotelsByCity = data.cities || {};
  } catch {
    hotelsByCity = {};
  }
}

function makeHotelMarker(hotel, city) {
  const color = CITY_COLORS[city] || "#444";
  const icon = L.divIcon({
    className: "pin",
    html: `<div class="hotel-pin" style="--c:${color}"><span>${hotel.score}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
  const m = L.marker([hotel.lat, hotel.lng], { icon, title: hotel.name });
  const price = hotel.priceY ? `¥${hotel.priceY.toLocaleString()}+` : "—";
  const rating = hotel.rating
    ? `⭐ ${hotel.rating} <span class="hotel-reviews">(${hotel.reviews})</span>`
    : "";
  m.bindPopup(`
    <div class="popup hotel-popup">
      ${hotel.image ? `<img src="${hotel.image}" alt="" class="hotel-thumb" loading="lazy" />` : ""}
      <div class="popup-city" style="color:${color}">${city} · score ${hotel.score}/100</div>
      <h4>${hotel.name}</h4>
      <div class="hotel-meta">
        ${rating ? `<span>${rating}</span>` : ""}
        <span class="hotel-price">${price}/night</span>
      </div>
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
  const cities =
    currentFilter === "all" ? Object.keys(hotelsByCity) : [currentFilter];
  for (const c of cities) {
    for (const h of hotelsByCity[c] || []) {
      staysLayer.addLayer(makeHotelMarker(h, c));
    }
  }
  if (!map.hasLayer(staysLayer)) staysLayer.addTo(map);
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

Promise.all([getTripData(), loadHotels()]).then(([data]) => {
  document.querySelector("h1.site-title").textContent = data.title;
  document.title = data.title;

  renderNav(data.sections);
  const list = document.getElementById("list-view");
  for (const s of data.sections) list.appendChild(renderSection(s));

  allPlacesList = allPlaces(data);
  renderFilterBar(data.sections.map((s) => s.name));
  initMap();

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
