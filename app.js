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

Promise.all([getTripData(), loadHotels()]).then(([data]) => {
  document.querySelector("h1.site-title").textContent = data.title;
  document.title = data.title;

  renderNav(data.sections);
  const list = document.getElementById("list-view");
  for (const s of data.sections) list.appendChild(renderSection(s));

  allPlacesList = allPlaces(data);
  renderFilterBar(data.sections.map((s) => s.name));
  initMap();
  renderStaysView();

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
