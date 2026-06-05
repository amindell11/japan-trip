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

const STAYS_PER_LEG_KEY = "japanTrip.staysPerLeg";
const STAYS_PER_LEG_OPTIONS = [3, 6, 10, "all"];

function getStaysPerLeg() {
  const raw = localStorage.getItem(STAYS_PER_LEG_KEY);
  if (raw === "all") return "all";
  const n = parseInt(raw, 10);
  return STAYS_PER_LEG_OPTIONS.includes(n) ? n : 6;
}

function setStaysPerLeg(value) {
  localStorage.setItem(STAYS_PER_LEG_KEY, String(value));
}

function buildExternalSearchLinks(leg, guests) {
  const adults = guests?.adults || 4;
  const rooms = guests?.rooms || 2;
  const loc = encodeURIComponent(`${leg.city}, Japan`);
  const cityDash = encodeURIComponent(`${leg.city}--Japan`);
  const ci = leg.checkin;
  const co = leg.checkout;
  return [
    {
      label: "Airbnb",
      url: `https://www.airbnb.com/s/${cityDash}/homes?checkin=${ci}&checkout=${co}&adults=${adults}`,
    },
    {
      label: "Booking",
      url: `https://www.booking.com/searchresults.html?ss=${loc}&checkin=${ci}&checkout=${co}&group_adults=${adults}&no_rooms=${rooms}`,
    },
    {
      label: "Google Hotels",
      url: `https://www.google.com/travel/hotels/${encodeURIComponent(leg.city)}?q=${loc}&checkin=${ci}&checkout=${co}&adults=${adults}`,
    },
    {
      label: "Expedia",
      url: `https://www.expedia.com/Hotel-Search?destination=${loc}&startDate=${ci}&endDate=${co}&adults=${adults}`,
    },
  ];
}

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

  const controls = el("div", "stays-controls");
  controls.appendChild(el("span", "stays-controls-label", "Show per city"));
  const seg = el("div", "stays-count-seg");
  const current = getStaysPerLeg();
  for (const opt of STAYS_PER_LEG_OPTIONS) {
    const btn = el(
      "button",
      "stays-count-btn" + (opt === current ? " active" : ""),
      opt === "all" ? "All" : String(opt)
    );
    btn.addEventListener("click", () => {
      if (opt === current) return;
      setStaysPerLeg(opt);
      renderHotelsPanel(panel);
    });
    seg.appendChild(btn);
  }
  controls.appendChild(seg);
  hero.appendChild(controls);
  panel.appendChild(hero);

  const perLeg = getStaysPerLeg();

  for (const leg of hotelData.legs) {
    const section = el("section", "stays-leg");
    const color = CITY_COLORS[leg.city] || "#444";
    const head = el("header", "stays-leg-head");
    head.innerHTML = `
      <h2 class="stays-leg-title" style="border-color:${color}">${leg.label}</h2>
      <p class="stays-leg-sub">${formatDateRange(leg.checkin, leg.checkout)} · ${leg.nights} night${leg.nights > 1 ? "s" : ""}</p>
    `;
    const links = el("div", "stays-extlinks");
    links.appendChild(el("span", "stays-extlinks-label", "Search elsewhere:"));
    for (const link of buildExternalSearchLinks(leg, hotelData.guests)) {
      const a = el("a", "stays-extlink", link.label);
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener";
      links.appendChild(a);
    }
    head.appendChild(links);
    section.appendChild(head);

    const shown =
      perLeg === "all" ? leg.hotels : leg.hotels.slice(0, perLeg);
    const grid = el("div", "stays-grid");
    for (const h of shown) grid.appendChild(renderStayCard(h, leg));
    section.appendChild(grid);

    if (perLeg !== "all" && leg.hotels.length > shown.length) {
      const more = el(
        "p",
        "stays-leg-more",
        `+ ${leg.hotels.length - shown.length} more available — switch to a higher count above.`
      );
      section.appendChild(more);
    }

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
          coords: Array.isArray(p.coords) && p.coords.length === 2 ? p.coords : null,
        });
      }
    }
  }
  return out;
}

Promise.all([getTripData(), loadHotels(), loadTripDistances()]).then(([data]) => {
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

const DAY_COUNT = 12;
const TRIP_START = "2026-06-05";
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FALLBACK_EMOJIS = ["✨","🌸","🍡","🗾","🍵","🚅","🏮","🎐","📸","🧭","🎋","🍥","🎏"];

const TRANSIT_MODES = [
  { value: "shinkansen", icon: "🚅", label: "Shinkansen" },
  { value: "train",      icon: "🚆", label: "Train" },
  { value: "subway",     icon: "🚇", label: "Subway / Metro" },
  { value: "bus",        icon: "🚌", label: "Bus" },
  { value: "taxi",       icon: "🚕", label: "Taxi" },
  { value: "plane",      icon: "✈️", label: "Plane" },
  { value: "ferry",      icon: "⛴️", label: "Ferry" },
  { value: "cable",      icon: "🚠", label: "Cable / Ropeway" },
];
const TRANSIT_MODE_MAP = Object.fromEntries(TRANSIT_MODES.map((m) => [m.value, m]));

// Per-mode estimates: effective speed (after stops/transfers), fixed
// boarding/transit overhead, route multiplier (real route vs great-circle),
// and per-km / fixed cost in JPY. All values are rough but useful for
// auto-filling arrival times and ballpark fares.
const TRANSIT_ESTIMATES = {
  shinkansen: { speedKmh: 220, overheadMin: 15,  routeMult: 1.05, costPerKmYen: 35,  costBaseYen: 0 },
  train:      { speedKmh: 55,  overheadMin: 5,   routeMult: 1.30, costPerKmYen: 20,  costBaseYen: 0 },
  subway:     { speedKmh: 30,  overheadMin: 3,   routeMult: 1.30, costPerKmYen: 0,   costBaseYen: 220 },
  bus:        { speedKmh: 50,  overheadMin: 10,  routeMult: 1.30, costPerKmYen: 12,  costBaseYen: 0 },
  taxi:       { speedKmh: 30,  overheadMin: 0,   routeMult: 1.30, costPerKmYen: 420, costBaseYen: 500 },
  plane:      { speedKmh: 700, overheadMin: 120, routeMult: 1.05, costPerKmYen: 30,  costBaseYen: 3000 },
  ferry:      { speedKmh: 30,  overheadMin: 15,  routeMult: 1.20, costPerKmYen: 30,  costBaseYen: 500 },
  cable:      { speedKmh: 8,   overheadMin: 5,   routeMult: 1.40, costPerKmYen: 0,   costBaseYen: 1500 },
};

// Curated transit nodes — airports, major stations, common destinations —
// merged with the place catalog to seed the From/To autocomplete before any
// live Nominatim results arrive.
const COMMON_TRANSIT_NODES = [
  "Narita Airport", "Haneda Airport", "Kansai International Airport (KIX)", "Itami Airport",
  "Tokyo Station", "Shinjuku Station", "Shibuya Station", "Shinagawa Station",
  "Ueno Station", "Akihabara Station", "Asakusa Station", "Ikebukuro Station",
  "Kyoto Station", "Osaka Station", "Shin-Osaka Station", "Namba Station",
  "Nagoya Station", "Hiroshima Station", "Sannomiya Station", "Kobe Station",
  "Nara Station", "Kintetsu-Nara Station", "Yokohama Station", "Sapporo Station",
  "Hakata Station (Fukuoka)", "Kanazawa Station", "Sendai Station", "Niigata Station",
  "Kawaguchiko Station", "Mishima Station", "Atami Station", "Hakone-Yumoto Station",
  "Karuizawa Station", "Busta Shinjuku (Expressway Bus Terminal)",
  "Tokyo", "Kyoto", "Osaka", "Nara", "Hakone", "Nikko", "Kamakura", "Yokohama",
  "Kobe", "Hiroshima", "Miyajima", "Kanazawa", "Sapporo", "Fukuoka",
];

// Auto-migration recipes for transit-shaped entries that pre-date the transit
// card type. Keyed by exact title. Idempotent — only applied to entries whose
// `kind` field is unset.
const TRANSIT_KNOWN_MIGRATIONS = {
  "Land at Narita / Haneda — 7:30pm": { mode: "plane", fromLabel: "", toLabel: "Narita / Haneda", arriveTime: "19:30" },
  "Highway bus Shinjuku → Kawaguchiko": { mode: "bus", fromLabel: "Shinjuku", toLabel: "Kawaguchiko" },
  "Return gear → bus to Tokyo → Shinkansen to Kyoto": { mode: "shinkansen", fromLabel: "Tokyo", toLabel: "Kyoto" },
  "Train to Kasagi (JR Kansai Line)": { mode: "train", fromLabel: "", toLabel: "Kasagi", line: "JR Kansai Line" },
  "Train Kyoto → Osaka (~15 min)": { mode: "train", fromLabel: "Kyoto", toLabel: "Osaka" },
  "Shinkansen Osaka → Tokyo": { mode: "shinkansen", fromLabel: "Osaka", toLabel: "Tokyo" },
  "Head to airport — fly home": { mode: "plane", fromLabel: "", toLabel: "home" },
};

const MAP_PANEL_HEIGHT_KEY = "trip:mapPanelHeight";
const MAP_PANEL_MIN_PX = 180;
function loadSavedMapPanelHeight() {
  try {
    const raw = localStorage.getItem(MAP_PANEL_HEIGHT_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= MAP_PANEL_MIN_PX ? n : null;
  } catch {
    return null;
  }
}

const boardState = {
  entries: [],
  editingId: null,
  dragging: false,
  paletteQuery: "",
  archivedSlugs: new Set(),
  showArchived: false,
  dayTitles: {},
  activeDay: null,
  miniMap: null,
  miniMapLayers: null,
  pinByEntryId: new Map(),
  previewSlug: null,
  previewMarker: null,
  pulseTimer: null,
  transitMigrationRan: false,
  mapPanelHeight: loadSavedMapPanelHeight(),
};

// Walking-time helpers: cache from distances.json + runtime fallback.
const WALKING_SPEED_MPS = 1.4; // ≈ 5 km/h
const NEAR_KM = 2.0;
const MID_KM = 5.0;
const WALK_MAX_KM = 1.5; // hops longer than this → "directions ↗" instead of walking label
let tripDistances = {};

function distancePairKey(a, b) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
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

// Returns walking info for a pair of points; uses pre-computed walking
// distances when both sides are catalog slugs, otherwise falls back to a
// straight-line estimate from coords. One or both slugs may be null
// (custom-card coords) — coords alone are enough for an estimate.
function walkInfoForPair(slugA, slugB, coordsA, coordsB) {
  if (slugA && slugB && slugA === slugB) {
    return { meters: 0, walkSec: 0, source: "cache", hKm: 0 };
  }
  const hKm = coordsA && coordsB ? haversineKm(coordsA, coordsB) : null;
  if (slugA && slugB) {
    const cached = tripDistances[distancePairKey(slugA, slugB)];
    if (cached) {
      return { meters: cached.meters, walkSec: cached.walkSec, source: "cache", hKm };
    }
  }
  if (coordsA && coordsB) {
    const meters = Math.round(hKm * 1000);
    const walkSec = Math.round(meters / WALKING_SPEED_MPS);
    return { meters, walkSec, source: "computed", hKm };
  }
  return null;
}

function loadTripDistances() {
  return fetch("distances.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => {
      tripDistances = data || {};
    })
    .catch(() => {
      tripDistances = {};
    });
}

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
      runTransitMigration(entries);
    });
    window.Trip.subscribeDayTitles((titles) => {
      boardState.dayTitles = titles || {};
      applyDayTitles();
    });
    window.Trip.subscribeArchived((slugs) => {
      boardState.archivedSlugs = new Set(Object.keys(slugs || {}));
      renderPalette();
    });
    window.Trip.on(() => {
      reconcileBoard();
      runTransitMigration(boardState.entries);
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
  if (entry.kind === "transit") {
    const m = TRANSIT_MODE_MAP[entry.mode];
    if (m) return m.icon;
    return "🚆";
  }
  if (entry.kind === "custom") {
    if (entry.emoji && entry.emoji.trim()) return entry.emoji.trim();
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
    return "📍";
  }
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
  if (entry.kind === "transit") {
    const fromSlug = entry.from?.slug;
    const fromPlace = fromSlug ? placeFor(fromSlug) : null;
    if (fromPlace && CITY_COLORS[fromPlace.city]) return CITY_COLORS[fromPlace.city];
    return "#7a7a7a";
  }
  const p = placeFor(entry.placeSlug);
  if (p && CITY_COLORS[p.city]) return CITY_COLORS[p.city];
  if (entry.kind === "custom") return "#9a7bd1";
  return null;
}

// Coords usable on the mini map / distance segments / proximity context,
// regardless of card kind. Catalog-linked entries inherit coords from the
// place; custom entries with a resolved location carry their own coords.
function entryCoords(entry) {
  if (!entry) return null;
  const p = placeFor(entry.placeSlug);
  if (p && Array.isArray(p.coords) && p.coords.length === 2) return p.coords;
  if (
    entry.kind === "custom" &&
    Array.isArray(entry.coords) &&
    entry.coords.length === 2 &&
    Number.isFinite(entry.coords[0]) &&
    Number.isFinite(entry.coords[1])
  ) {
    return entry.coords;
  }
  return null;
}

function slugForPlaceName(name) {
  if (!name) return null;
  const lower = name.trim().toLowerCase();
  const hit = allPlacesForItin.find((p) => p.name.toLowerCase() === lower);
  return hit ? hit.slug : null;
}

function transitTitleFromFields(mode, fromLabel, toLabel) {
  const m = TRANSIT_MODE_MAP[mode];
  const modeLabel = m
    ? m.label
    : mode
    ? mode.charAt(0).toUpperCase() + mode.slice(1)
    : "Transit";
  if (fromLabel && toLabel) return `${modeLabel}: ${fromLabel} → ${toLabel}`;
  if (toLabel) return `${modeLabel} to ${toLabel}`;
  if (fromLabel) return `${modeLabel} from ${fromLabel}`;
  return modeLabel;
}

// Resolve a typed mode string into a canonical mode value (one of the 8
// known modes when matched, or the raw lowercased text otherwise).
function parseTransitMode(typed) {
  const raw = (typed || "").trim();
  if (!raw) return "train";
  const lower = raw.toLowerCase();
  if (TRANSIT_MODE_MAP[lower]) return lower;
  for (const m of TRANSIT_MODES) {
    if (m.label.toLowerCase() === lower) return m.value;
    const parts = m.label.toLowerCase().split(/\s*\/\s*/);
    if (parts.includes(lower)) return m.value;
  }
  for (const m of TRANSIT_MODES) {
    if (m.label.toLowerCase().includes(lower)) return m.value;
  }
  return lower;
}

function modeDisplayLabel(mode) {
  const m = TRANSIT_MODE_MAP[mode];
  if (m) return m.label;
  if (!mode) return "";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

// ---- Live location suggestions via OpenStreetMap Nominatim ----
// Free, CORS-enabled, ~1 req/sec rate limit. Debounced + cached so typing
// a query stays well under the budget.

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const nominatimCache = new Map();

async function fetchNominatimSuggestions(query) {
  const q = (query || "").trim();
  if (q.length < 3) return [];
  if (nominatimCache.has(q)) return nominatimCache.get(q);
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "6",
    "accept-language": "en",
  });
  try {
    const res = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`);
    if (!res.ok) {
      nominatimCache.set(q, []);
      return [];
    }
    const data = await res.json();
    const out = (Array.isArray(data) ? data : [])
      .map((d) => shortenNominatimLabel(d.display_name))
      .filter(Boolean);
    nominatimCache.set(q, out);
    return out;
  } catch {
    nominatimCache.set(q, []);
    return [];
  }
}

// One-shot geocode: resolves a free-text label to [lat, lng]. Used when the
// custom-card editor saves a location that doesn't match a catalog place.
const geocodeCache = new Map();
async function geocodeLabel(label) {
  const q = (label || "").trim();
  if (q.length < 2) return null;
  if (geocodeCache.has(q)) return geocodeCache.get(q);
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    "accept-language": "en",
  });
  try {
    const res = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`);
    if (!res.ok) {
      geocodeCache.set(q, null);
      return null;
    }
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    const coords = hit && hit.lat && hit.lon
      ? [Number(hit.lat), Number(hit.lon)]
      : null;
    const ok = coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
    const out = ok ? coords : null;
    geocodeCache.set(q, out);
    return out;
  } catch {
    geocodeCache.set(q, null);
    return null;
  }
}

function shortenNominatimLabel(displayName) {
  if (!displayName) return "";
  const parts = displayName.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return displayName.slice(0, 80);
  let label = parts[0];
  if (label.length < 25 && parts.length > 1) label += ", " + parts[1];
  return label.slice(0, 80);
}

// Wire an input to push its typed query into a datalist with: catalog
// places + curated transit nodes + live Nominatim results. Debounced.
function attachLocationSuggest(input, datalist, baseOptions) {
  const renderOptions = (opts) => {
    const seen = new Set();
    const html = [];
    for (const v of opts) {
      const key = v.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      html.push(`<option value="${escapeHtml(v)}"></option>`);
    }
    datalist.innerHTML = html.join("");
  };
  renderOptions(baseOptions);

  let timer = null;
  let lastQuery = "";
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q === lastQuery) return;
    lastQuery = q;
    clearTimeout(timer);
    if (q.length < 3) {
      renderOptions(baseOptions);
      return;
    }
    timer = setTimeout(async () => {
      const live = await fetchNominatimSuggestions(q);
      if (input.value.trim() !== q) return; // user moved on
      renderOptions([...live, ...baseOptions]);
    }, 350);
  });
}

function transitDurationMin(dep, arr) {
  if (!dep || !arr) return null;
  const m = /^(\d{1,2}):(\d{2})$/;
  const d = dep.match(m), a = arr.match(m);
  if (!d || !a) return null;
  const dMin = Number(d[1]) * 60 + Number(d[2]);
  const aMin = Number(a[1]) * 60 + Number(a[2]);
  let diff = aMin - dMin;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

function addMinutesToTime(timeStr, minutes) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr || "");
  if (!m || !Number.isFinite(minutes)) return "";
  let total = Number(m[1]) * 60 + Number(m[2]) + Math.round(minutes);
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

async function coordsForLabel(label) {
  const slug = slugForPlaceName(label);
  if (slug) {
    const p = placeFor(slug);
    if (p?.coords) return p.coords;
  }
  return geocodeLabel(label);
}

const YEN_PER_USD = 150;

function yenToUsdLabel(yen) {
  if (typeof yen !== "number" || !Number.isFinite(yen) || yen <= 0) return "";
  const usd = yen / YEN_PER_USD;
  if (usd < 1) return "<$1";
  return "$" + Math.round(usd).toLocaleString();
}

async function estimateTransit(fromLabel, toLabel, mode) {
  if (!fromLabel || !toLabel) return null;
  const conf = TRANSIT_ESTIMATES[mode];
  if (!conf) return null;
  const [fromCoord, toCoord] = await Promise.all([
    coordsForLabel(fromLabel),
    coordsForLabel(toLabel),
  ]);
  if (!fromCoord || !toCoord) return null;
  const lineKm = haversineKm(fromCoord, toCoord);
  if (!Number.isFinite(lineKm)) return null;
  const distKm = lineKm * conf.routeMult;
  const minutes = Math.round((distKm / conf.speedKmh) * 60 + conf.overheadMin);
  const rawYen = conf.costBaseYen + distKm * conf.costPerKmYen;
  const yen = Math.max(0, Math.round(rawYen / 100) * 100);
  return { minutes, yen, distKm };
}

function formatDurationMin(min) {
  if (min == null || min <= 0) return "";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTransitTimeRange(dep, arr) {
  const m = /^\d{1,2}:\d{2}$/;
  const validDep = m.test(dep || "") ? dep : "";
  const validArr = m.test(arr || "") ? arr : "";
  if (!validDep && !validArr) return "";
  if (validDep && validArr) {
    const dur = transitDurationMin(validDep, validArr);
    const durStr = dur ? ` <span class="board-transit-dur">(${formatDurationMin(dur)})</span>` : "";
    return `${escapeHtml(validDep)} → ${escapeHtml(validArr)}${durStr}`;
  }
  if (validDep) return `dep ${escapeHtml(validDep)}`;
  return `arr ${escapeHtml(validArr)}`;
}

function buildTransitMetaLine(entry) {
  const parts = [];
  if (entry.line) parts.push(escapeHtml(entry.line));
  const time = formatTransitTimeRange(entry.departTime, entry.arriveTime);
  if (time) {
    parts.push(time);
  } else if (typeof entry.durationMin === "number" && entry.durationMin > 0) {
    parts.push(`≈ ${escapeHtml(formatDurationMin(entry.durationMin))}`);
  }
  if (typeof entry.distKm === "number" && entry.distKm > 0) {
    parts.push(`<span class="board-transit-dist">${Math.round(entry.distKm).toLocaleString()} km</span>`);
  }
  if (typeof entry.costYen === "number" && entry.costYen > 0) {
    const usd = yenToUsdLabel(entry.costYen);
    if (usd) parts.push(`<span class="board-transit-cost">≈ ${escapeHtml(usd)}</span>`);
  }
  return parts.length ? parts.join(' <span class="board-transit-dot">·</span> ') : "";
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

  const main = el("div", "board-main");
  main.appendChild(buildIdeasPanel());

  const daysStrip = el("div", "board-days-strip");
  for (let d = 1; d <= DAY_COUNT; d++) {
    daysStrip.appendChild(buildDayColumn(d));
  }
  main.appendChild(daysStrip);

  board.appendChild(main);
  board.appendChild(buildMapPanel());
}

function buildMapPanel() {
  const panel = el("div", "board-map-panel");
  panel.dataset.collapsed = "true";
  panel.innerHTML = `
    <div class="board-map-resizer" data-map-resizer title="Drag to resize" role="separator" aria-orientation="horizontal" aria-label="Resize map panel"></div>
    <div class="board-map-bar">
      <span class="board-map-bar-text" data-map-status>📍 Click a day column to focus the map</span>
      <button type="button" class="board-map-close" data-map-close title="Unpin day">×</button>
    </div>
    <div class="board-map-body">
      <div class="board-map-empty" data-map-empty>This day has no places yet — drop one from Ideas to plot it.</div>
      <div id="itinerary-map" data-map-host></div>
    </div>
  `;
  panel.querySelector("[data-map-close]").addEventListener("click", () => {
    setActiveDay(null);
  });
  attachMapPanelResizer(panel);
  applyMapPanelHeight(panel);
  return panel;
}

function applyMapPanelHeight(panel) {
  const p = panel || document.querySelector(".board-map-panel");
  if (!p) return;
  if (p.dataset.collapsed === "true") {
    p.style.height = "";
    return;
  }
  const h = boardState.mapPanelHeight;
  if (h && Number.isFinite(h)) {
    const max = Math.round(window.innerHeight * 0.9);
    const clamped = Math.max(MAP_PANEL_MIN_PX, Math.min(max, h));
    p.style.height = `${clamped}px`;
  } else {
    p.style.height = "";
  }
}

function attachMapPanelResizer(panel) {
  const resizer = panel.querySelector("[data-map-resizer]");
  if (!resizer) return;
  let startY = 0;
  let startH = 0;
  let pointerId = null;

  const onMove = (ev) => {
    const dy = startY - ev.clientY; // dragging up grows the panel
    const max = Math.round(window.innerHeight * 0.9);
    const next = Math.max(MAP_PANEL_MIN_PX, Math.min(max, startH + dy));
    panel.style.height = `${next}px`;
    boardState.mapPanelHeight = next;
    if (boardState.miniMap) boardState.miniMap.invalidateSize();
  };

  const onUp = () => {
    panel.classList.remove("is-resizing");
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    if (pointerId != null) {
      try { resizer.releasePointerCapture(pointerId); } catch {}
      pointerId = null;
    }
    if (boardState.mapPanelHeight) {
      try {
        localStorage.setItem(
          MAP_PANEL_HEIGHT_KEY,
          String(Math.round(boardState.mapPanelHeight))
        );
      } catch {}
    }
    if (boardState.miniMap) {
      setTimeout(() => boardState.miniMap.invalidateSize(), 60);
    }
  };

  resizer.addEventListener("pointerdown", (ev) => {
    if (panel.dataset.collapsed === "true") return;
    ev.preventDefault();
    startY = ev.clientY;
    startH = panel.getBoundingClientRect().height;
    panel.classList.add("is-resizing");
    pointerId = ev.pointerId;
    try { resizer.setPointerCapture(ev.pointerId); } catch {}
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  // Double-click resets to the CSS default (38vh).
  resizer.addEventListener("dblclick", () => {
    if (panel.dataset.collapsed === "true") return;
    boardState.mapPanelHeight = null;
    panel.style.height = "";
    try { localStorage.removeItem(MAP_PANEL_HEIGHT_KEY); } catch {}
    if (boardState.miniMap) {
      setTimeout(() => boardState.miniMap.invalidateSize(), 220);
    }
  });
}

function buildDayColumn(dayNum) {
  const col = el("section", "board-col board-col-day");
  col.dataset.key = `day-${dayNum}`;
  col.dataset.day = String(dayNum);

  const head = el("button", "board-col-head");
  head.type = "button";
  head.dataset.day = String(dayNum);
  head.title = "Click to focus the map on this day";
  head.innerHTML = `
    <span class="board-col-day-num">Day ${dayNum}</span>
    <span class="board-col-day-date">${escapeHtml(formatDayDate(dayNum))}</span>
    <span class="board-col-count" data-count></span>
    <span class="board-col-pin" aria-hidden="true">📍</span>
  `;
  head.addEventListener("click", () => {
    setActiveDay(boardState.activeDay === dayNum ? null : dayNum);
  });
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

  const transitBtn = document.createElement("button");
  transitBtn.type = "button";
  transitBtn.className = "board-add-transit-btn";
  transitBtn.title = "Add a transit leg";
  transitBtn.textContent = "+ transit";
  transitBtn.addEventListener("click", () => addEmptyTransitForDay(dayNum));

  const customBtn = document.createElement("button");
  customBtn.type = "button";
  customBtn.className = "board-add-custom-btn";
  customBtn.title = "Add a custom card with optional location";
  customBtn.textContent = "+ custom";
  customBtn.addEventListener("click", () => addEmptyCustomForDay(dayNum));

  wrap.append(input, transitBtn, customBtn);
  return wrap;
}

async function addEmptyCustomForDay(dayNum) {
  if (!window.Trip?.configured || !window.Trip.currentUser) {
    alert("Sign in to add a card");
    return;
  }
  const siblings = getCardOrdersForDay(dayNum);
  const topOrder = siblings.length ? siblings[0] - 1 : 0;
  try {
    const id = await window.Trip.addItineraryEntry({
      day: dayNum,
      order: topOrder,
      placeSlug: null,
      kind: "custom",
      title: "Custom card",
      emoji: "",
      locationLabel: "",
      coords: null,
      notes: "",
      tickets: [],
    });
    if (id) {
      boardState.editingId = id;
    }
  } catch (e) {
    alert(e.message);
  }
}

async function addEmptyTransitForDay(dayNum) {
  if (!window.Trip?.configured || !window.Trip.currentUser) {
    alert("Sign in to add transit");
    return;
  }
  const siblings = getCardOrdersForDay(dayNum);
  const topOrder = siblings.length ? siblings[0] - 1 : 0;
  try {
    const id = await window.Trip.addItineraryEntry({
      day: dayNum,
      order: topOrder,
      placeSlug: null,
      kind: "transit",
      mode: "train",
      from: { slug: null, label: "" },
      to: { slug: null, label: "" },
      departTime: "",
      arriveTime: "",
      line: "",
      title: "Transit",
      notes: "",
      tickets: [],
    });
    if (id) {
      boardState.editingId = id;
      // The next subscribe tick will reconcile and render the editor.
    }
  } catch (e) {
    alert(e.message);
  }
}

function entryToMarkdown(entry) {
  const emoji = entryEmoji(entry);
  const lines = [];
  const validTime = /^\d{1,2}:\d{2}$/;

  if (entry.kind === "transit") {
    const fromLabel = entry.from?.label || "";
    const toLabel = entry.to?.label || "";
    const title = transitTitleFromFields(entry.mode, fromLabel, toLabel);
    const meta = [];
    if (entry.line) meta.push(entry.line);
    const dep = entry.departTime || "";
    const arr = entry.arriveTime || "";
    if (validTime.test(dep) && validTime.test(arr)) {
      const dur = transitDurationMin(dep, arr);
      meta.push(dur ? `${dep} → ${arr} (${formatDurationMin(dur)})` : `${dep} → ${arr}`);
    } else if (validTime.test(dep)) {
      meta.push(`dep ${dep}`);
    } else if (validTime.test(arr)) {
      meta.push(`arr ${arr}`);
    } else if (typeof entry.durationMin === "number" && entry.durationMin > 0) {
      meta.push(`≈ ${formatDurationMin(entry.durationMin)}`);
    }
    if (typeof entry.distKm === "number" && entry.distKm > 0) {
      meta.push(`${Math.round(entry.distKm).toLocaleString()} km`);
    }
    if (typeof entry.costYen === "number" && entry.costYen > 0) {
      const usd = yenToUsdLabel(entry.costYen);
      if (usd) meta.push(`≈ ${usd}`);
    }
    const metaSuffix = meta.length ? ` — ${meta.join(" · ")}` : "";
    lines.push(`- ${emoji} **${title}**${metaSuffix}`);
  } else if (entry.kind === "custom") {
    const sub = customLocationSubLabel(entry);
    const subSuffix = sub ? ` — ${sub}` : "";
    lines.push(`- ${emoji} **${entry.title || "Untitled"}**${subSuffix}`);
  } else {
    const place = placeFor(entry.placeSlug);
    const subSuffix = place?.city ? ` — ${place.city}` : "";
    lines.push(`- ${emoji} **${entry.title || "Untitled"}**${subSuffix}`);
  }

  if (entry.notes && entry.notes.trim()) {
    for (const line of entry.notes.trim().split(/\r?\n/)) {
      lines.push(`  ${line}`);
    }
  }

  const tickets = (entry.tickets || []).filter((t) => t && t.url);
  for (const t of tickets) {
    const label = (t.label || "").trim() || "Link";
    lines.push(`  - [${label}](${t.url})`);
  }

  return lines.join("\n");
}

function buildItineraryMarkdown() {
  const byDay = groupEntriesByDay(boardState.entries);
  const startDate = dateForDay(1);
  const endDate = dateForDay(DAY_COUNT);
  const fmtFullDate = (d) =>
    `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const out = [];
  out.push("# Japan Trip");
  out.push("");
  out.push(
    `_${fmtFullDate(startDate)} – ${fmtFullDate(endDate)} · ${DAY_COUNT} days_`
  );
  out.push("");

  for (let d = 1; d <= DAY_COUNT; d++) {
    const entries = byDay.get(d) || [];
    const title = (boardState.dayTitles[String(d)] || "").trim();
    const dateLabel = formatDayDate(d).replace(" · ", ", ");
    const headSuffix = title ? ` — ${title}` : "";
    out.push(`## Day ${d} · ${dateLabel}${headSuffix}`);
    out.push("");
    if (entries.length === 0) {
      out.push("_(no cards yet)_");
      out.push("");
    } else {
      for (const e of entries) {
        out.push(entryToMarkdown(e));
        out.push("");
      }
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function downloadItineraryMarkdown() {
  const md = buildItineraryMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
  a.href = url;
  a.download = `japan-trip-itinerary-${stamp}.md`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 0);
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
      <button class="board-ideas-archived-toggle" type="button" title="Show or hide archived ideas" hidden>🗄 Hidden</button>
      <button class="board-ideas-export-btn" type="button" title="Download the full itinerary as a Markdown file">⬇ Export .md</button>
    </div>
    <div class="board-ideas-list" data-day="palette"></div>
  `;
  const search = section.querySelector(".board-ideas-search");
  search.value = boardState.paletteQuery;
  search.addEventListener("input", () => {
    boardState.paletteQuery = search.value;
    renderPalette();
  });
  const archivedToggle = section.querySelector(".board-ideas-archived-toggle");
  archivedToggle.addEventListener("click", () => {
    boardState.showArchived = !boardState.showArchived;
    renderPalette();
  });
  const exportBtn = section.querySelector(".board-ideas-export-btn");
  exportBtn.addEventListener("click", () => {
    try {
      downloadItineraryMarkdown();
    } catch (e) {
      alert("Export failed: " + (e?.message || e));
    }
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
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const editing = user && boardState.editingId === entry.id;
      list.appendChild(
        editing ? renderCardEditor(entry) : renderCard(entry, user)
      );
      const next = entries[i + 1];
      if (next) {
        const seg = renderDistanceSegment(entry, next);
        if (seg) list.appendChild(seg);
      }
    }

    const col = list.closest(".board-col");
    const countSlot = col.querySelector("[data-count]");
    if (countSlot) countSlot.textContent = entries.length ? `· ${entries.length}` : "";
    col.classList.toggle("is-pinned", boardState.activeDay === d);

    ensureDaySortable(list, canDrag);
  }

  renderPalette();
  updateAuthAffordances(user);
  renderMiniMap();
}

function renderDistanceSegment(prev, next) {
  const prevCoords = entryCoords(prev);
  const nextCoords = entryCoords(next);
  if (!prevCoords || !nextCoords) return null;

  const info = walkInfoForPair(
    prev.placeSlug,
    next.placeSlug,
    prevCoords,
    nextCoords
  );
  if (!info) return null;

  const km = info.hKm != null ? info.hKm : info.meters / 1000;
  const seg = el("div", "board-seg");

  if (km > WALK_MAX_KM) {
    const a = document.createElement("a");
    a.className = "board-seg-link";
    a.href = `https://www.google.com/maps/dir/?api=1&origin=${prevCoords[0]},${prevCoords[1]}&destination=${nextCoords[0]},${nextCoords[1]}&travelmode=transit`;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = `📍 ${km < 10 ? km.toFixed(1) : Math.round(km)} km · directions ↗`;
    a.addEventListener("mousedown", (ev) => ev.stopPropagation());
    seg.appendChild(a);
  } else {
    const minutes = Math.max(1, Math.round(info.walkSec / 60));
    const meters = info.meters;
    const distLabel =
      meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
    const span = el("span", "board-seg-walk", `🚶 ${minutes} min · ${distLabel}`);
    if (info.source === "computed") span.title = "Estimated from straight-line distance";
    seg.appendChild(span);
  }
  return seg;
}

function setActiveDay(dayNum) {
  if (dayNum === boardState.activeDay) return;
  boardState.activeDay = dayNum;
  boardState.previewSlug = null;
  const panel = document.querySelector(".board-map-panel");
  if (panel) {
    panel.dataset.collapsed = dayNum == null ? "true" : "false";
    applyMapPanelHeight(panel);
  }
  for (const col of document.querySelectorAll(".board-col-day")) {
    col.classList.toggle(
      "is-pinned",
      Number(col.dataset.day) === dayNum
    );
  }
  renderMiniMap();
  renderPalette();
}

function ensureMiniMap() {
  if (typeof L === "undefined") return null;
  if (boardState.miniMap) return boardState.miniMap;
  const host = document.getElementById("itinerary-map");
  if (!host) return null;
  const map = L.map(host, {
    scrollWheelZoom: true,
    zoomControl: true,
    attributionControl: false,
  }).setView([36, 137], 5);
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OSM</a>, © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);
  L.control.attribution({ prefix: false }).addTo(map);
  boardState.miniMap = map;
  boardState.miniMapLayers = L.layerGroup().addTo(map);
  return map;
}

function numberedDivIcon(n, color, highlight) {
  const cls = "board-map-pin" + (highlight ? " is-active" : "");
  return L.divIcon({
    className: "board-map-pin-icon",
    html: `<span class="${cls}" style="--pin-color:${color}">${n}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function renderMiniMap() {
  const panel = document.querySelector(".board-map-panel");
  if (!panel) return;
  const status = panel.querySelector("[data-map-status]");
  const empty = panel.querySelector("[data-map-empty]");
  const host = panel.querySelector("[data-map-host]");
  const day = boardState.activeDay;
  boardState.pinByEntryId = new Map();
  boardState.previewMarker = null;

  // A previewed idea that has since been scheduled no longer needs a preview.
  if (
    boardState.previewSlug &&
    boardState.entries.some((e) => e.placeSlug === boardState.previewSlug)
  ) {
    boardState.previewSlug = null;
  }

  if (day == null) {
    panel.dataset.collapsed = "true";
    applyMapPanelHeight(panel);
    if (status) status.textContent = "📍 Click a day column to focus the map";
    if (host) host.style.display = "none";
    if (empty) empty.style.display = "none";
    return;
  }

  panel.dataset.collapsed = "false";
  applyMapPanelHeight(panel);
  const entries = (groupEntriesByDay(boardState.entries).get(day) || []).filter(
    (e) => entryCoords(e) != null
  );
  const previewPlace = boardState.previewSlug
    ? placeFor(boardState.previewSlug)
    : null;
  const preview = previewPlace?.coords ? previewPlace : null;
  const titleText = boardState.dayTitles[String(day)];
  const label = titleText
    ? `Day ${day} · ${titleText}`
    : `Day ${day} · ${formatDayDate(day)}`;
  if (status) {
    const base =
      entries.length === 0
        ? `${label} — no places yet`
        : `${label} — ${entries.length} stop${entries.length > 1 ? "s" : ""}`;
    status.textContent = preview ? `${base} · previewing ${preview.name}` : base;
  }

  if (entries.length === 0 && !preview) {
    if (host) host.style.display = "none";
    if (empty) empty.style.display = "flex";
    return;
  }
  if (host) host.style.display = "block";
  if (empty) empty.style.display = "none";

  const map = ensureMiniMap();
  if (!map) return;
  boardState.miniMapLayers.clearLayers();

  const points = [];
  entries.forEach((entry, i) => {
    const place = placeFor(entry.placeSlug);
    const coords = entryCoords(entry);
    const color = place
      ? CITY_COLORS[place.city] || "#444"
      : entry.kind === "custom"
      ? "#9a7bd1"
      : "#444";
    const marker = L.marker(coords, {
      icon: numberedDivIcon(i + 1, color, false),
    });
    marker.entryId = entry.id;
    const sub = !place && entry.kind === "custom" ? customLocationSubLabel(entry) : "";
    const tip = sub ? `${i + 1}. ${entry.title} — ${sub}` : `${i + 1}. ${entry.title}`;
    marker.bindTooltip(tip, { direction: "top", offset: [0, -22] });
    marker.on("click", () => focusCardForEntry(entry.id));
    boardState.miniMapLayers.addLayer(marker);
    boardState.pinByEntryId.set(entry.id, marker);
    points.push(coords);
  });

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const km = haversineKm(a, b);
    const dashed = km > WALK_MAX_KM;
    L.polyline([a, b], {
      color: "#666",
      weight: 3,
      opacity: 0.7,
      dashArray: dashed ? "6 6" : null,
    }).addTo(boardState.miniMapLayers);
  }

  const boundsPoints = [...points];
  if (preview) {
    const color = CITY_COLORS[preview.city] || "#2e7d4f";
    const icon = L.divIcon({
      className: "board-map-pin-icon",
      html: `<span class="board-map-pin is-preview" style="--pin-color:${color}">+</span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    const marker = L.marker(preview.coords, { icon });
    marker.bindTooltip(`${preview.name} — idea (click pin to dismiss)`, {
      direction: "top",
      offset: [0, -22],
    });
    marker.on("click", () => {
      boardState.previewSlug = null;
      renderMiniMap();
    });
    boardState.miniMapLayers.addLayer(marker);
    boardState.previewMarker = marker;
    boundsPoints.push(preview.coords);
  }

  const bounds = L.latLngBounds(boundsPoints).pad(0.2);
  // Panel height transitions over ~180ms; defer size + bounds until it settles.
  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(bounds, { animate: true, maxZoom: 16 });
  }, 220);
}

function pulsePreviewPin() {
  const marker = boardState.previewMarker;
  if (!marker) return;
  const map = boardState.miniMap;
  if (map) map.panTo(marker.getLatLng(), { animate: true });
  const icon = marker._icon;
  if (icon) {
    icon.classList.add("is-pulsing");
    setTimeout(() => icon.classList.remove("is-pulsing"), 900);
  }
}

function pulsePin(entryId) {
  const marker = boardState.pinByEntryId.get(entryId);
  if (!marker) return;
  const map = boardState.miniMap;
  if (map) map.panTo(marker.getLatLng(), { animate: true });
  const icon = marker._icon;
  if (icon) {
    icon.classList.add("is-pulsing");
    setTimeout(() => icon.classList.remove("is-pulsing"), 900);
  }
}

function focusCardForEntry(entryId) {
  const card = document.querySelector(`.board-card[data-id="${entryId}"]`);
  if (!card) return;
  card.scrollIntoView({ block: "center", behavior: "smooth" });
  card.classList.add("is-pulsing");
  clearTimeout(boardState.pulseTimer);
  boardState.pulseTimer = setTimeout(() => {
    card.classList.remove("is-pulsing");
  }, 900);
}

// Scheduled itinerary entries within walking distance of a point. Used for
// the "close to N" badges on idea cards and itinerary cards. Only entries
// that resolve to coords count (transit legs never do).
function nearbyScheduledEntries(slug, coords, excludeEntryId) {
  if (!coords) return [];
  const out = [];
  for (const e of boardState.entries) {
    if (excludeEntryId && e.id === excludeEntryId) continue;
    if (slug && e.placeSlug === slug) continue; // same place — not a neighbor
    const eCoords = entryCoords(e);
    if (!eCoords) continue;
    const info = walkInfoForPair(slug, e.placeSlug, coords, eCoords);
    if (!info) continue;
    const km = info.meters / 1000;
    if (km <= WALK_MAX_KM) out.push({ entry: e, km, walkSec: info.walkSec });
  }
  out.sort((a, b) => a.km - b.km);
  return out;
}

function setNearHighlight(entryIds, days, on) {
  for (const id of entryIds) {
    const cardEl = document.querySelector(`.board-card[data-id="${id}"]`);
    if (cardEl) cardEl.classList.toggle("board-near-hit", on);
  }
  for (const d of days) {
    const col = document.querySelector(`.board-col-day[data-day="${d}"]`);
    if (col) col.classList.toggle("board-near-hit-day", on);
  }
}

function buildNearBadge(nearby) {
  if (!nearby.length) return null;
  const badge = el("span", "board-near-badge", `🚶 ${nearby.length}`);
  const lines = nearby.map((n) => {
    const mins = Math.max(1, Math.round(n.walkSec / 60));
    return `${n.entry.title} — Day ${n.entry.day} · ${mins} min walk`;
  });
  badge.title =
    `Close to ${nearby.length} scheduled place${nearby.length > 1 ? "s" : ""}:\n` +
    lines.join("\n");
  const ids = nearby.map((n) => n.entry.id);
  const days = [...new Set(nearby.map((n) => Number(n.entry.day)))];
  badge.addEventListener("mouseenter", () => setNearHighlight(ids, days, true));
  badge.addEventListener("mouseleave", () => setNearHighlight(ids, days, false));
  badge.addEventListener("mousedown", (ev) => ev.stopPropagation());
  badge.addEventListener("click", (ev) => ev.stopPropagation());
  return badge;
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

function activeDayProximityContext() {
  const day = boardState.activeDay;
  if (day == null) return null;
  const entries = (groupEntriesByDay(boardState.entries).get(day) || []);
  const anchors = [];
  const cities = new Set();
  for (const e of entries) {
    const p = placeFor(e.placeSlug);
    if (p) {
      cities.add(p.city);
      if (Array.isArray(p.coords)) anchors.push(p.coords);
      continue;
    }
    const coords = entryCoords(e);
    if (coords) anchors.push(coords);
  }
  if (anchors.length === 0 && cities.size === 0) return null;
  return { anchors, cities };
}

function proximityTierFor(place, ctx) {
  if (!ctx) return null;
  const cityMatch = ctx.cities.has(place.city);
  if (Array.isArray(place.coords) && ctx.anchors.length > 0) {
    let minKm = Infinity;
    for (const a of ctx.anchors) {
      const km = haversineKm(a, place.coords);
      if (km < minKm) minKm = km;
    }
    if (minKm <= NEAR_KM) return "near";
    if (minKm <= MID_KM) return "mid";
    return cityMatch ? "mid" : "far";
  }
  if (!cityMatch) return "far";
  return "near";
}

function renderPalette() {
  const list = document.querySelector('.board-ideas-list[data-day="palette"]');
  if (!list) return;
  list.innerHTML = "";
  const usedMap = usedSlugDayMap(boardState.entries);
  const archivedSet = boardState.archivedSlugs;
  const filtered = allPlacesForItin.filter((p) => paletteMatches(p, boardState.paletteQuery));
  const active = filtered.filter((p) => !archivedSet.has(p.slug));
  const archived = filtered.filter((p) => archivedSet.has(p.slug));
  const proxCtx = activeDayProximityContext();
  const tieredFree = active
    .filter((p) => !usedMap.has(p.slug))
    .map((p) => ({ p, tier: proximityTierFor(p, proxCtx) }));
  // Sort by tier so "near" floats to the top when a day is pinned.
  if (proxCtx) {
    const order = { near: 0, mid: 1, far: 2 };
    tieredFree.sort((a, b) => (order[a.tier] ?? 0) - (order[b.tier] ?? 0));
  }
  const used = active.filter((p) => usedMap.has(p.slug));
  for (const { p, tier } of tieredFree) {
    list.appendChild(renderPaletteCard(p, undefined, tier));
  }
  for (const p of used) list.appendChild(renderPaletteCard(p, usedMap.get(p.slug), null));
  if (boardState.showArchived) {
    for (const p of archived) {
      list.appendChild(renderPaletteCard(p, usedMap.get(p.slug), null, true));
    }
  }
  const renderedCount =
    tieredFree.length + used.length + (boardState.showArchived ? archived.length : 0);
  if (renderedCount === 0) {
    list.appendChild(el("div", "board-palette-empty", "No matches — try a different tag or name."));
  }
  const countSlot = document.querySelector("[data-ideas-count]");
  if (countSlot) {
    const shown = active.length;
    const hiddenSuffix = archived.length ? ` · ${archived.length} hidden` : "";
    if (proxCtx) {
      const near = tieredFree.filter((t) => t.tier === "near").length;
      countSlot.textContent = `${near} near · ${tieredFree.length} free · ${shown} shown${hiddenSuffix}`;
    } else {
      countSlot.textContent = `${tieredFree.length} free · ${shown} shown${hiddenSuffix}`;
    }
  }
  const toggle = document.querySelector(".board-ideas-archived-toggle");
  if (toggle) {
    const totalArchived = allPlacesForItin.filter((p) => archivedSet.has(p.slug)).length;
    toggle.hidden = totalArchived === 0 && !boardState.showArchived;
    toggle.textContent = boardState.showArchived
      ? `🗄 Hide ${totalArchived} hidden`
      : `🗄 ${totalArchived} hidden`;
    toggle.classList.toggle("active", boardState.showArchived);
  }
  ensurePaletteSortable(list, !!window.Trip?.currentUser);
}

function renderPaletteCard(place, usedOnDay, proxTier, archived) {
  const card = el("article", "board-card board-palette-card");
  card.dataset.placeSlug = place.slug;
  if (proxTier === "mid") card.classList.add("board-palette-mid");
  if (proxTier === "far") card.classList.add("board-palette-far");
  const color = CITY_COLORS[place.city];
  if (color) card.style.setProperty("--stripe", color);

  const tagRow = (place.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="board-card-tag">${escapeHtml(t)}</span>`)
    .join("");

  const usedBadge = usedOnDay
    ? `<span class="board-palette-used-badge">Day ${usedOnDay}</span>`
    : "";

  const canArchive = !!window.Trip?.currentUser;
  const hideBtnHtml = canArchive
    ? `<button class="board-palette-hide-btn" type="button" title="${
        archived ? "Restore to ideas" : "Hide from ideas"
      }">${archived ? "↩" : "🗄"}</button>`
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
      ${hideBtnHtml}
    </div>
    ${summary}
    ${tagRow ? `<div class="board-card-tags">${tagRow}</div>` : ""}
  `;

  const nearby = nearbyScheduledEntries(place.slug, place.coords, null);
  const nearBadge = buildNearBadge(nearby);
  if (nearBadge) {
    const head = card.querySelector(".board-card-head");
    const titleWrap = head.querySelector(".board-card-title-wrap");
    head.insertBefore(nearBadge, titleWrap.nextSibling);
  }

  // While a day is pinned, clicking an idea previews it on the mini map
  // (a temporary pin alongside that day's stops). Click again to dismiss.
  card.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button, input")) return;
    if (boardState.activeDay == null || !place.coords) return;
    boardState.previewSlug =
      boardState.previewSlug === place.slug ? null : place.slug;
    renderMiniMap();
    if (boardState.previewSlug) setTimeout(pulsePreviewPin, 300);
  });

  if (usedOnDay) {
    card.classList.add("board-palette-used");
    card.title = `Already scheduled on Day ${usedOnDay}`;
  }
  if (archived) {
    card.classList.add("board-palette-archived");
    card.title = "Hidden from ideas";
  }

  const hideBtn = card.querySelector(".board-palette-hide-btn");
  if (hideBtn) {
    hideBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      try {
        await window.Trip.setPlaceArchived(place.slug, !archived);
      } catch (e) {
        alert("Could not update: " + (e?.message || e));
      }
    });
  }

  return card;
}

function updateAuthAffordances(user) {
  const configured = window.Trip?.configured;
  for (const wrap of document.querySelectorAll(".board-add")) {
    const input = wrap.querySelector(".board-add-input");
    const transitBtn = wrap.querySelector(".board-add-transit-btn");
    const customBtn = wrap.querySelector(".board-add-custom-btn");
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
    if (transitBtn) transitBtn.disabled = !configured || !user;
    if (customBtn) customBtn.disabled = !configured || !user;
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
    preventOnFilter: false,
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
    filter: ".board-palette-used, .board-palette-archived, .board-palette-hide-btn",
    preventOnFilter: false,
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
  if (entry.kind === "transit") return renderTransitCard(entry, user);
  if (entry.kind === "custom") return renderCustomCard(entry, user);

  const card = el("article", "board-card");
  card.dataset.id = entry.id;
  card.dataset.day = String(entry.day);
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);

  const stripe = entryStripeColor(entry);
  if (stripe) card.style.setProperty("--stripe", stripe);
  else card.classList.add("board-card-plain");

  card.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button, input, textarea")) return;
    const day = Number(entry.day);
    if (boardState.activeDay !== day) {
      setActiveDay(day);
      setTimeout(() => pulsePin(entry.id), 80);
    } else {
      pulsePin(entry.id);
    }
  });

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

  const nearBadge = buildNearBadge(
    nearbyScheduledEntries(entry.placeSlug, entryCoords(entry), entry.id)
  );
  if (nearBadge) head.appendChild(nearBadge);

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
  if (entry.kind === "transit") return renderTransitCardEditor(entry);
  if (entry.kind === "custom") return renderCustomCardEditor(entry);

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

/* ---------- Custom cards (free-text card with optional location) ---------- */

function customLocationSubLabel(entry) {
  if (!entry) return "";
  if (entry.placeSlug) {
    const p = placeFor(entry.placeSlug);
    if (p) return p.name;
  }
  if (entry.locationLabel && entry.locationLabel.trim()) {
    return entry.locationLabel.trim();
  }
  return "";
}

function renderCustomCard(entry, user) {
  const card = el("article", "board-card board-card-custom");
  card.dataset.id = entry.id;
  card.dataset.day = String(entry.day);
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);
  card.dataset.kind = "custom";

  const stripe = entryStripeColor(entry);
  if (stripe) card.style.setProperty("--stripe", stripe);

  card.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button, input, textarea")) return;
    const day = Number(entry.day);
    if (boardState.activeDay !== day) {
      setActiveDay(day);
      setTimeout(() => pulsePin(entry.id), 80);
    } else {
      pulsePin(entry.id);
    }
  });

  const head = el("div", "board-card-head");
  head.innerHTML = `<span class="board-card-emoji">${escapeHtml(entryEmoji(entry))}</span>`;

  const titleWrap = el("div", "board-card-title-wrap");
  titleWrap.appendChild(
    el("span", "board-card-title", escapeHtml(entry.title || "Untitled"))
  );
  const sub = customLocationSubLabel(entry);
  if (sub) {
    const subEl = el("span", "board-card-custom-loc", `📍 ${escapeHtml(sub)}`);
    if (!entryCoords(entry)) subEl.classList.add("board-card-custom-loc-unmapped");
    titleWrap.appendChild(subEl);
  }
  head.appendChild(titleWrap);

  const nearBadge = buildNearBadge(
    nearbyScheduledEntries(entry.placeSlug, entryCoords(entry), entry.id)
  );
  if (nearBadge) head.appendChild(nearBadge);

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

  if (entry.notes) {
    card.appendChild(el("p", "board-card-notes", escapeHtml(entry.notes)));
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
      a.textContent = (t.label || "Link") + " ↗";
      a.addEventListener("mousedown", (ev) => ev.stopPropagation());
      li.appendChild(a);
      ul.appendChild(li);
    }
    card.appendChild(ul);
  }

  return card;
}

function renderCustomCardEditor(entry) {
  const card = el("form", "board-card board-card-editing board-card-custom-editing");
  card.dataset.id = entry.id;
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);
  card.dataset.kind = "custom";

  const tickets = (entry.tickets || []).map((t) => ({
    label: t.label || "",
    url: t.url || "",
  }));
  if (tickets.length === 0) tickets.push({ label: "", url: "" });

  const datalistId = `custom-places-${entry.id}`;
  const baseLocationOptions = [
    ...allPlacesForItin.map((p) => p.name),
    ...COMMON_TRANSIT_NODES,
  ];

  const initialTitle =
    entry.title && entry.title !== "Custom card" ? entry.title : "";

  card.innerHTML = `
    <datalist id="${datalistId}"></datalist>
    <div class="board-custom-edit-row">
      <input class="board-custom-edit-emoji" type="text" maxlength="4" placeholder="🎯" value="${escapeHtml(entry.emoji || "")}" aria-label="Emoji" />
      <input class="board-edit-title board-custom-edit-title" type="text" value="${escapeHtml(initialTitle)}" placeholder="Title" required />
    </div>
    <input class="board-custom-edit-location" list="${datalistId}" type="text" placeholder="Location (optional) — e.g. Shinjuku, Tokyo" value="${escapeHtml(entry.locationLabel || "")}" />
    <div class="board-custom-edit-loc-status" data-loc-status></div>
    <textarea class="board-edit-notes" rows="2" placeholder="Notes (optional)">${escapeHtml(entry.notes || "")}</textarea>
    <div class="board-edit-tickets"></div>
    <button type="button" class="board-edit-add-ticket">+ link</button>
    <div class="board-edit-actions">
      <button type="button" class="board-card-btn board-edit-cancel">Cancel</button>
      <button type="submit" class="board-card-btn board-edit-save">Save</button>
    </div>
  `;

  const locationInput = card.querySelector(".board-custom-edit-location");
  const locationDatalist = card.querySelector(`#${datalistId}`);
  attachLocationSuggest(locationInput, locationDatalist, baseLocationOptions);

  const locStatus = card.querySelector("[data-loc-status]");
  const renderLocStatus = () => {
    const raw = locationInput.value.trim();
    if (!raw) {
      locStatus.textContent = "";
      locStatus.classList.remove("is-resolved", "is-unmapped");
      return;
    }
    const slug = slugForPlaceName(raw);
    if (slug) {
      locStatus.textContent = "📍 Linked to catalog place — will appear on the map";
      locStatus.classList.add("is-resolved");
      locStatus.classList.remove("is-unmapped");
      return;
    }
    if (
      entry.locationLabel === raw &&
      Array.isArray(entry.coords) &&
      entry.coords.length === 2
    ) {
      locStatus.textContent = "📍 Geocoded — will appear on the map";
      locStatus.classList.add("is-resolved");
      locStatus.classList.remove("is-unmapped");
      return;
    }
    locStatus.textContent = "Will geocode on save (or save without a map pin)";
    locStatus.classList.remove("is-resolved");
    locStatus.classList.add("is-unmapped");
  };
  locationInput.addEventListener("input", renderLocStatus);
  renderLocStatus();

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
  const emojiInput = card.querySelector(".board-custom-edit-emoji");

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
    const emoji = emojiInput.value.trim().slice(0, 4);
    const locLabel = locationInput.value.trim();
    const cleanTickets = tickets
      .map((t) => ({ label: t.label.trim(), url: t.url.trim() }))
      .filter((t) => t.url);

    let placeSlug = null;
    let coords = null;
    if (locLabel) {
      placeSlug = slugForPlaceName(locLabel);
      if (placeSlug) {
        // Catalog match — coords come from the catalog via entryCoords.
        coords = null;
      } else if (
        entry.locationLabel === locLabel &&
        Array.isArray(entry.coords) &&
        entry.coords.length === 2
      ) {
        coords = entry.coords;
      } else {
        const saveBtn = card.querySelector(".board-edit-save");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Geocoding…";
        }
        coords = await geocodeLabel(locLabel);
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
        }
      }
    }

    try {
      await window.Trip.updateItineraryEntry(entry.id, {
        kind: "custom",
        title,
        emoji,
        placeSlug,
        locationLabel: locLabel,
        coords,
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

/* ---------- Transit cards ---------- */

function renderTransitCard(entry, user) {
  const card = el("article", "board-card board-card-transit");
  card.dataset.id = entry.id;
  card.dataset.day = String(entry.day);
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);
  card.dataset.kind = "transit";

  const stripe = entryStripeColor(entry);
  if (stripe) card.style.setProperty("--stripe", stripe);

  card.addEventListener("click", (ev) => {
    if (ev.target.closest("a, button, input, textarea")) return;
    const day = Number(entry.day);
    if (boardState.activeDay !== day) {
      setActiveDay(day);
      setTimeout(() => pulsePin(entry.id), 80);
    } else {
      pulsePin(entry.id);
    }
  });

  const mode = TRANSIT_MODE_MAP[entry.mode] || TRANSIT_MODE_MAP.train;
  const fromLabel = entry.from?.label || "";
  const toLabel = entry.to?.label || "";

  const head = el("div", "board-card-head");
  head.innerHTML = `<span class="board-card-emoji">${escapeHtml(mode.icon)}</span>`;

  const titleWrap = el("div", "board-card-title-wrap");
  if (fromLabel || toLabel) {
    titleWrap.innerHTML = `
      <span class="board-card-title board-transit-route">
        <span class="board-transit-end ${fromLabel ? "" : "board-transit-end-empty"}">${escapeHtml(fromLabel || "—")}</span>
        <span class="board-transit-arrow">→</span>
        <span class="board-transit-end ${toLabel ? "" : "board-transit-end-empty"}">${escapeHtml(toLabel || "—")}</span>
      </span>
    `;
  } else {
    titleWrap.innerHTML = `<span class="board-card-title board-transit-route">${escapeHtml(mode.label)}</span>`;
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
      if (!confirm("Delete this transit?")) return;
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

  const meta = buildTransitMetaLine(entry);
  if (meta) {
    const metaEl = el("div", "board-transit-meta");
    metaEl.innerHTML = meta;
    card.appendChild(metaEl);
  }

  if (entry.notes) {
    card.appendChild(el("p", "board-card-notes", escapeHtml(entry.notes)));
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

function renderTransitCardEditor(entry) {
  const card = el("form", "board-card board-card-editing board-card-transit-editing");
  card.dataset.id = entry.id;
  card.dataset.order = String(typeof entry.order === "number" ? entry.order : 0);
  card.dataset.kind = "transit";

  const tickets = (entry.tickets || []).map((t) => ({
    label: t.label || "",
    url: t.url || "",
  }));
  if (tickets.length === 0) tickets.push({ label: "", url: "" });

  const fromDatalistId = `transit-from-${entry.id}`;
  const toDatalistId = `transit-to-${entry.id}`;
  const modesDatalistId = `transit-modes-${entry.id}`;
  const modeOptionsHtml = TRANSIT_MODES
    .map((m) => `<option value="${escapeHtml(m.label)}">${m.icon}</option>`)
    .join("");
  const modeValue = modeDisplayLabel(entry.mode);

  card.innerHTML = `
    <datalist id="${fromDatalistId}"></datalist>
    <datalist id="${toDatalistId}"></datalist>
    <datalist id="${modesDatalistId}">${modeOptionsHtml}</datalist>
    <input class="board-transit-edit-mode" list="${modesDatalistId}" type="text" placeholder="Mode (type or pick)" value="${escapeHtml(modeValue)}" autocomplete="off" />
    <div class="board-transit-edit-row">
      <input class="board-transit-edit-from" list="${fromDatalistId}" type="text" placeholder="From — type any place" value="${escapeHtml(entry.from?.label || "")}" autocomplete="off" />
      <span class="board-transit-edit-arrow" aria-hidden="true">→</span>
      <input class="board-transit-edit-to" list="${toDatalistId}" type="text" placeholder="To — type any place" value="${escapeHtml(entry.to?.label || "")}" autocomplete="off" />
    </div>
    <div class="board-transit-edit-row">
      <input class="board-transit-edit-time" type="time" value="${escapeHtml(entry.departTime || "")}" aria-label="Depart" />
      <span class="board-transit-edit-arrow" aria-hidden="true">→</span>
      <input class="board-transit-edit-time" type="time" value="${escapeHtml(entry.arriveTime || "")}" aria-label="Arrive" />
    </div>
    <div class="board-transit-estimate" data-estimate></div>
    <input class="board-transit-edit-line" type="text" placeholder="Line / number (e.g. Nozomi 7)" value="${escapeHtml(entry.line || "")}" autocomplete="off" />
    <textarea class="board-edit-notes" rows="2" placeholder="Notes (optional)">${escapeHtml(entry.notes || "")}</textarea>
    <div class="board-edit-tickets"></div>
    <button type="button" class="board-edit-add-ticket">+ link</button>
    <div class="board-edit-actions">
      <button type="button" class="board-card-btn board-edit-cancel">Cancel</button>
      <button type="submit" class="board-card-btn board-edit-save">Save</button>
    </div>
  `;

  const baseLocationOptions = [
    ...(allPlacesForItin || []).map((p) => p.name),
    ...COMMON_TRANSIT_NODES,
  ];
  const modeInput = card.querySelector(".board-transit-edit-mode");
  const fromInput = card.querySelector(".board-transit-edit-from");
  const toInput = card.querySelector(".board-transit-edit-to");
  const [departInput, arriveInput] = card.querySelectorAll(".board-transit-edit-time");
  const estimateBox = card.querySelector("[data-estimate]");

  attachLocationSuggest(
    fromInput,
    card.querySelector(`#${CSS.escape(fromDatalistId)}`),
    baseLocationOptions
  );
  attachLocationSuggest(
    toInput,
    card.querySelector(`#${CSS.escape(toDatalistId)}`),
    baseLocationOptions
  );

  // Make the typeable inputs feel like dropdown-or-typed: clicking selects
  // existing text so the user can immediately replace, and Chrome reliably
  // pops the datalist when the cursor moves.
  for (const inp of [modeInput, fromInput, toInput]) {
    inp.addEventListener("focus", () => {
      try { inp.select(); } catch {}
    });
  }

  // ---- Travel-time + cost estimate ----
  let lastEstimate = null;
  let estimateTimer = null;
  let estimateGen = 0;

  const renderEstimateUI = (state) => {
    if (!estimateBox) return;
    estimateBox.innerHTML = "";
    estimateBox.classList.toggle("is-loading", state.kind === "loading");
    if (state.kind === "loading") {
      estimateBox.textContent = "estimating travel time…";
      return;
    }
    if (state.kind === "none") return;
    const est = state.est;
    const pill = document.createElement("span");
    pill.className = "board-transit-estimate-pill";
    const usdLabel = yenToUsdLabel(est.yen);
    pill.textContent = `≈ ${formatDurationMin(est.minutes)}${usdLabel ? " · " + usdLabel : ""}`;
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "board-transit-apply";
    apply.textContent = departInput.value ? "fill arrive" : arriveInput.value ? "back-fill depart" : "";
    if (apply.textContent) {
      apply.addEventListener("click", () => applyEstimateToTimes(est));
      pill.appendChild(apply);
    }
    const hint = document.createElement("span");
    hint.className = "board-transit-estimate-hint";
    hint.textContent = `~${est.distKm.toFixed(0)} km · rough estimate`;
    estimateBox.append(pill, hint);
  };

  const applyEstimateToTimes = (est) => {
    if (departInput.value) {
      arriveInput.value = addMinutesToTime(departInput.value, est.minutes);
    } else if (arriveInput.value) {
      departInput.value = addMinutesToTime(arriveInput.value, -est.minutes);
    }
    renderEstimateUI({ kind: "ok", est });
  };

  const recomputeEstimate = () => {
    clearTimeout(estimateTimer);
    estimateTimer = setTimeout(async () => {
      const fromLabel = fromInput.value.trim();
      const toLabel = toInput.value.trim();
      const mode = parseTransitMode(modeInput.value);
      if (!fromLabel || !toLabel) {
        lastEstimate = null;
        renderEstimateUI({ kind: "none" });
        return;
      }
      const myGen = ++estimateGen;
      renderEstimateUI({ kind: "loading" });
      const est = await estimateTransit(fromLabel, toLabel, mode);
      if (myGen !== estimateGen) return;
      lastEstimate = est;
      if (!est) {
        renderEstimateUI({ kind: "none" });
        return;
      }
      // If depart is set and arrive is empty, auto-fill arrive once.
      if (departInput.value && !arriveInput.value) {
        arriveInput.value = addMinutesToTime(departInput.value, est.minutes);
      }
      renderEstimateUI({ kind: "ok", est });
    }, 400);
  };

  for (const inp of [modeInput, fromInput, toInput]) {
    inp.addEventListener("input", recomputeEstimate);
    inp.addEventListener("change", recomputeEstimate);
  }
  departInput.addEventListener("change", () => {
    if (lastEstimate && departInput.value && !arriveInput.value) {
      arriveInput.value = addMinutesToTime(departInput.value, lastEstimate.minutes);
    }
  });

  // Seed the estimate (in case the entry already has from/to set).
  recomputeEstimate();

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

  card.querySelector(".board-edit-cancel").addEventListener("click", () => {
    boardState.editingId = null;
    reconcileBoard();
  });

  card.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const modeRaw = card.querySelector(".board-transit-edit-mode").value;
    const mode = parseTransitMode(modeRaw);
    const fromLabel = card.querySelector(".board-transit-edit-from").value.trim();
    const toLabel = card.querySelector(".board-transit-edit-to").value.trim();
    const [departInput, arriveInput] = card.querySelectorAll(".board-transit-edit-time");
    const departTime = departInput?.value || "";
    const arriveTime = arriveInput?.value || "";
    const line = card.querySelector(".board-transit-edit-line").value.trim();
    const notes = card.querySelector(".board-edit-notes").value.trim();
    const cleanTickets = tickets
      .map((t) => ({ label: t.label.trim(), url: t.url.trim() }))
      .filter((t) => t.url);
    try {
      await window.Trip.updateItineraryEntry(entry.id, {
        kind: "transit",
        mode,
        from: { slug: slugForPlaceName(fromLabel), label: fromLabel },
        to: { slug: slugForPlaceName(toLabel), label: toLabel },
        departTime,
        arriveTime,
        line,
        notes,
        tickets: cleanTickets,
        title: transitTitleFromFields(mode, fromLabel, toLabel),
        placeSlug: null,
        costYen: lastEstimate?.yen ?? entry.costYen ?? null,
        distKm: lastEstimate?.distKm ?? entry.distKm ?? null,
        durationMin: lastEstimate?.minutes ?? entry.durationMin ?? null,
      });
      boardState.editingId = null;
    } catch (e) {
      alert(e.message);
    }
  });

  return card;
}

async function runTransitMigration(entries) {
  if (boardState.transitMigrationRan) return;
  if (!window.Trip?.configured || !window.Trip.currentUser) return;
  const myUid = window.Trip.currentUser.uid;
  const candidates = entries.filter(
    (e) =>
      e.kind == null &&
      !e.placeSlug &&
      e.createdBy?.uid === myUid &&
      TRANSIT_KNOWN_MIGRATIONS[e.title]
  );
  if (candidates.length === 0) {
    boardState.transitMigrationRan = true;
    return;
  }
  boardState.transitMigrationRan = true;
  for (const entry of candidates) {
    const recipe = TRANSIT_KNOWN_MIGRATIONS[entry.title];
    const fromLabel = recipe.fromLabel || "";
    const toLabel = recipe.toLabel || "";
    try {
      await window.Trip.updateItineraryEntry(entry.id, {
        kind: "transit",
        mode: recipe.mode,
        from: { slug: slugForPlaceName(fromLabel), label: fromLabel },
        to: { slug: slugForPlaceName(toLabel), label: toLabel },
        departTime: recipe.departTime || "",
        arriveTime: recipe.arriveTime || "",
        line: recipe.line || "",
        title: transitTitleFromFields(recipe.mode, fromLabel, toLabel),
      });
      console.log(`[trip] migrated transit: ${entry.title}`);
    } catch (e) {
      console.warn(`[trip] transit migration failed for "${entry.title}"`, e);
    }
  }
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

  if (entry?.kind === "transit") {
    const mode = TRANSIT_MODE_MAP[entry.mode] || TRANSIT_MODE_MAP.train;
    const fromLabel = entry.from?.label || "—";
    const toLabel = entry.to?.label || "—";
    const meta = buildTransitMetaLine(entry);
    const hasNotes = entry.notes && entry.notes.trim();
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
          <span class="board-popover-emoji">${escapeHtml(mode.icon)}</span>
          <div class="board-popover-title-wrap">
            <span class="board-popover-title">${escapeHtml(fromLabel)} → ${escapeHtml(toLabel)}</span>
            <span class="board-popover-sub">Day ${entry.day} · ${escapeHtml(mode.label)}</span>
          </div>
        </div>
        ${meta ? `<div class="board-popover-transit-meta">${meta}</div>` : ""}
        ${hasNotes ? `<p class="board-popover-summary">${escapeHtml(entry.notes)}</p>` : ""}
        ${ticketRow ? `<div class="board-popover-links">${ticketRow}</div>` : ""}
      </div>
    `;
  }

  if (!place || entry?.kind === "custom") {
    if (!entry) return null;
    const isCustom = entry.kind === "custom";
    const locLabel = isCustom ? customLocationSubLabel(entry) : "";
    const coords = isCustom ? entryCoords(entry) : null;
    const hasNotes = entry.notes && entry.notes.trim();
    const hasTickets = (entry.tickets || []).some((t) => t && t.url);
    if (!isCustom && !hasNotes && !hasTickets) return null;

    const baseTickets = (entry.tickets || [])
      .filter((t) => t && t.url)
      .map(
        (t) =>
          `<a href="${escapeHtml(t.url)}" target="_blank" rel="noopener">${escapeHtml(
            t.label || "Link"
          )}</a>`
      );
    if (isCustom && coords) {
      baseTickets.push(
        `<a href="https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}" target="_blank" rel="noopener">Google Maps</a>`
      );
    } else if (isCustom && locLabel) {
      baseTickets.push(
        `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locLabel)}" target="_blank" rel="noopener">Google Maps</a>`
      );
    }
    const ticketRow = baseTickets.join("");

    const sub = isCustom
      ? locLabel
        ? `Day ${entry.day} · 📍 ${escapeHtml(locLabel)}${coords ? "" : " · not on map"}`
        : `Day ${entry.day} · custom card`
      : `Day ${entry.day} · custom note`;

    return `
      <div class="board-popover-body">
        <div class="board-popover-head">
          <span class="board-popover-emoji">${escapeHtml(entryEmoji(entry))}</span>
          <div class="board-popover-title-wrap">
            <span class="board-popover-title">${escapeHtml(entry.title || "Untitled")}</span>
            <span class="board-popover-sub">${sub}</span>
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
  window.addEventListener("resize", () => applyMapPanelHeight());
}
