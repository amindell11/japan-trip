const WIKI_HOST = "https://en.wikipedia.org";

function el(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html != null) e.innerHTML = html;
  return e;
}

function getSlug() {
  const q = new URLSearchParams(location.search);
  return q.get("slug");
}

async function fetchSummary(title) {
  if (!title) return null;
  try {
    const res = await fetch(`${WIKI_HOST}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchExtract(title) {
  if (!title) return null;
  try {
    const url =
      `${WIKI_HOST}/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1` +
      `&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.extract || null;
  } catch {
    return null;
  }
}

async function fetchImages(title, max = 8) {
  if (!title) return [];
  try {
    const res = await fetch(`${WIKI_HOST}/api/rest_v1/page/media-list/${encodeURIComponent(title)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items || []).filter((i) => i.type === "image");
    const photos = [];
    for (const it of items) {
      const t = (it.title || "").replace(/^File:/i, "");
      if (!t) continue;
      if (/\.svg$/i.test(t)) continue;
      if (/(commons-logo|wiki.*\.png|icon|flag|coat_of_arms|locator)/i.test(t)) continue;
      const thumb = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(t)}?width=1000`;
      const page = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t)}`;
      const caption = it.caption?.text || "";
      photos.push({ thumb, page, caption });
      if (photos.length >= max) break;
    }
    return photos;
  } catch {
    return [];
  }
}

function linkList(links) {
  if (!links?.length) return null;
  const ul = el("ul", "detail-links");
  for (const l of links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = l.label;
    li.appendChild(a);
    ul.appendChild(li);
  }
  return ul;
}

function autoLinks(place) {
  const out = [];
  if (place.wiki) {
    out.push({
      label: "Wikipedia",
      url: `${WIKI_HOST}/wiki/${encodeURIComponent(place.wiki)}`,
    });
  }
  if (place.coords) {
    const [lat, lng] = place.coords;
    out.push({
      label: "Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    out.push({
      label: "Directions",
      url: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
  } else {
    out.push({
      label: "Search on Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " Japan")}`,
    });
  }
  return out;
}

function renderNotFound(slug) {
  const root = document.getElementById("detail");
  root.innerHTML = "";
  root.appendChild(el("h1", "detail-title", "Not found"));
  root.appendChild(
    el(
      "p",
      "detail-lede",
      `No place matches <code>${slug || "(empty)"}</code>. <a href="index.html">Back to the trip list</a>.`
    )
  );
}

function renderDetail({ place, section, group }) {
  document.title = `${place.name} · Japan Trip`;
  const crumb = document.getElementById("crumb");
  crumb.innerHTML = `<span>${section.name}</span> · <span>${group.name}</span>`;

  const root = document.getElementById("detail");
  root.innerHTML = "";

  const hero = el("div", "detail-hero");
  const heroImg = el("div", "detail-hero-img");
  hero.appendChild(heroImg);

  const heroBody = el("div", "detail-hero-body");
  heroBody.appendChild(el("h1", "detail-title", place.name));
  if (place.travel) heroBody.appendChild(el("p", "travel", place.travel));
  heroBody.appendChild(el("p", "detail-lede", place.summary));

  if (place.tags?.length) {
    const tags = el("div", "tags");
    for (const t of place.tags) tags.appendChild(el("span", "tag", t));
    heroBody.appendChild(tags);
  }
  hero.appendChild(heroBody);
  root.appendChild(hero);

  const body = el("div", "detail-body");

  const extractBox = el("section", "detail-section");
  extractBox.appendChild(el("h2", "detail-h2", "About"));
  const extractP = el("p", "detail-extract muted", "Loading from Wikipedia…");
  extractBox.appendChild(extractP);
  body.appendChild(extractBox);

  const linksBox = el("section", "detail-section");
  linksBox.appendChild(el("h2", "detail-h2", "Links"));
  const curated = linkList(place.links);
  if (curated) {
    linksBox.appendChild(el("h3", "detail-h3", "Official & tickets"));
    linksBox.appendChild(curated);
  }
  linksBox.appendChild(el("h3", "detail-h3", "Reference"));
  linksBox.appendChild(linkList(autoLinks(place)));
  body.appendChild(linksBox);

  const galleryBox = el("section", "detail-section detail-gallery-section");
  galleryBox.appendChild(el("h2", "detail-h2", "Photos"));
  const gallery = el("div", "detail-gallery");
  gallery.innerHTML = '<div class="muted">Loading photos…</div>';
  galleryBox.appendChild(gallery);
  body.appendChild(galleryBox);

  root.appendChild(body);

  fetchSummary(place.wiki).then((summary) => {
    const src = summary?.originalimage?.source || summary?.thumbnail?.source;
    if (src) {
      const img = document.createElement("img");
      img.alt = place.name;
      img.src = src;
      heroImg.appendChild(img);
    } else {
      heroImg.classList.add("no-img");
    }
  });

  fetchExtract(place.wiki).then((extract) => {
    if (extract) {
      extractP.classList.remove("muted");
      const paragraphs = extract.split(/\n+/).filter(Boolean).slice(0, 3);
      extractP.innerHTML = paragraphs.map((p) => `<span>${p}</span>`).join("<br><br>");
    } else if (place.wiki) {
      extractP.textContent = "No Wikipedia extract available.";
    } else {
      extractBox.remove();
    }
  });

  fetchImages(place.wiki).then((photos) => {
    gallery.innerHTML = "";
    if (!photos.length) {
      galleryBox.remove();
      return;
    }
    for (const p of photos) {
      const a = document.createElement("a");
      a.href = p.page;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "gallery-item";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = p.caption || place.name;
      img.src = p.thumb;
      a.appendChild(img);
      if (p.caption) {
        const cap = el("span", "gallery-caption", p.caption);
        a.appendChild(cap);
      }
      gallery.appendChild(a);
    }
  });
}

getTripData().then((data) => {
  const slug = getSlug();
  const hit = slug ? findPlaceBySlug(data, slug) : null;
  if (!hit) {
    renderNotFound(slug);
    return;
  }
  renderDetail(hit);
});
