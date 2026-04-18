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
  } else {
    out.push({
      label: "Google Maps",
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

  const reviewsBox = el("section", "detail-section detail-reviews");
  reviewsBox.appendChild(el("h2", "detail-h2", "Ratings & Comments"));
  const reviewsInner = el("div", "reviews-inner");
  reviewsBox.appendChild(reviewsInner);
  body.appendChild(reviewsBox);
  mountReviews(reviewsInner, slugify(place.name));

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

function formatTime(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderStars(container, value, { interactive, onPick }) {
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement("span");
    s.className = "star" + (i <= value ? " filled" : "");
    s.textContent = "★";
    if (interactive) {
      s.addEventListener("click", () => onPick(i));
      s.addEventListener("mouseenter", () => {
        for (const n of container.children)
          n.classList.toggle("hover", Number(n.dataset.n) <= i);
      });
      s.addEventListener("mouseleave", () => {
        for (const n of container.children) n.classList.remove("hover");
      });
      s.dataset.n = i;
      s.style.cursor = "pointer";
    }
    container.appendChild(s);
  }
}

function mountReviews(root, slug) {
  root.innerHTML = "";

  const summaryRow = el("div", "reviews-summary");
  const stars = el("div", "stars");
  const avgText = el("span", "reviews-avg muted", "No ratings yet");
  summaryRow.append(stars, avgText);
  root.appendChild(summaryRow);

  const yourRatingRow = el("div", "reviews-your");
  root.appendChild(yourRatingRow);

  const commentsWrap = el("div", "comments");
  root.appendChild(commentsWrap);

  const inputWrap = el("div", "comment-input-wrap");
  root.appendChild(inputWrap);

  if (!window.Trip?.configured) {
    avgText.textContent =
      "Ratings & comments disabled — Firebase not configured.";
    return;
  }

  let stats = { ratingSum: 0, ratingCount: 0, commentCount: 0 };
  let userRating = 0;

  function paintSummary() {
    const avg = stats.ratingCount ? stats.ratingSum / stats.ratingCount : 0;
    renderStars(stars, Math.round(avg), { interactive: false });
    avgText.textContent = stats.ratingCount
      ? `${avg.toFixed(1)} · ${stats.ratingCount} rating${
          stats.ratingCount === 1 ? "" : "s"
        }`
      : "No ratings yet";
  }

  function paintYourRating() {
    yourRatingRow.innerHTML = "";
    if (!window.Trip.currentUser) {
      yourRatingRow.innerHTML =
        '<span class="muted">Sign in above to rate and comment.</span>';
      return;
    }
    yourRatingRow.appendChild(el("span", "your-label", "Your rating:"));
    const yourStars = el("div", "stars interactive");
    yourRatingRow.appendChild(yourStars);
    renderStars(yourStars, userRating, {
      interactive: true,
      onPick: async (r) => {
        userRating = r;
        paintYourRating();
        try {
          await window.Trip.submitRating(slug, r);
          stats = await window.Trip.getStats(slug);
          paintSummary();
        } catch (e) {
          alert(e.message);
        }
      },
    });
  }

  function paintCommentInput() {
    inputWrap.innerHTML = "";
    if (!window.Trip.currentUser) return;
    const ta = document.createElement("textarea");
    ta.placeholder = "Add a comment…";
    ta.rows = 3;
    const row = el("div", "comment-actions");
    const btn = document.createElement("button");
    btn.className = "auth-btn primary";
    btn.textContent = "Post";
    btn.addEventListener("click", async () => {
      const text = ta.value.trim();
      if (!text) return;
      btn.disabled = true;
      try {
        await window.Trip.addComment(slug, text);
        ta.value = "";
        await loadComments();
        stats = await window.Trip.getStats(slug);
      } catch (e) {
        alert(e.message);
      } finally {
        btn.disabled = false;
      }
    });
    row.appendChild(btn);
    inputWrap.append(ta, row);
  }

  async function loadComments() {
    const list = await window.Trip.getComments(slug);
    commentsWrap.innerHTML = "";
    if (!list.length) {
      commentsWrap.appendChild(
        el("p", "muted no-comments", "No comments yet.")
      );
      return;
    }
    for (const c of list) {
      const item = el("div", "comment");
      const head = el("div", "comment-head");
      if (c.photo) {
        const img = document.createElement("img");
        img.src = c.photo;
        img.alt = "";
        img.className = "comment-avatar";
        head.appendChild(img);
      }
      head.appendChild(el("strong", "comment-name", c.name || "Anon"));
      head.appendChild(el("span", "comment-time muted", formatTime(c.createdAt)));
      if (
        window.Trip.currentUser &&
        window.Trip.currentUser.uid === c.uid
      ) {
        const del = document.createElement("button");
        del.className = "comment-delete";
        del.textContent = "Delete";
        del.addEventListener("click", async () => {
          if (!confirm("Delete this comment?")) return;
          await window.Trip.deleteComment(slug, c.id);
          await loadComments();
          stats = await window.Trip.getStats(slug);
        });
        head.appendChild(del);
      }
      item.appendChild(head);
      const body = el("p", "comment-text");
      body.textContent = c.text;
      item.appendChild(body);
      commentsWrap.appendChild(item);
    }
  }

  async function refreshAll() {
    stats = (await window.Trip.getStats(slug)) || stats;
    paintSummary();
    userRating = (await window.Trip.getUserRating(slug)) || 0;
    paintYourRating();
    paintCommentInput();
    await loadComments();
  }

  window.Trip.on(() => {
    refreshAll();
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
