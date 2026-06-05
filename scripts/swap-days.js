// One-shot migration: swap the content of two itinerary days.
//
// Context: we're staying in Shibuya, so we want day 2 and day 11 swapped.
// Every itinerary entry on day A moves to day B and vice-versa, and the two
// day titles are swapped to match. Calendar dates are derived from the day
// number in app.js, so swapping the day field is all that's needed.
//
// Usage:
//   node scripts/swap-days.js            (defaults to swapping days 2 and 11)
//   node scripts/swap-days.js 3 7        (swap any two days)
//   A browser tab opens. Sign in with Google, review the preview, click
//   "Swap days". A pre-migration backup is saved to scripts/ first.
//   The script refuses to run the same swap twice (marker in itinerary_meta/migrations).

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8768;
const ROOT = path.join(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "firebase-config.js");

const DAY_A = Number(process.argv[2] || 2);
const DAY_B = Number(process.argv[3] || 11);
if (!Number.isInteger(DAY_A) || !Number.isInteger(DAY_B) || DAY_A === DAY_B) {
  console.error(`Invalid days: ${DAY_A}, ${DAY_B}. Pass two distinct integers.`);
  process.exit(1);
}
const MIGRATION_ID = `swap-days-${DAY_A}-${DAY_B}`;

const configJs = fs.readFileSync(CONFIG_PATH, "utf-8");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Swap itinerary days</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { margin-top: 0; }
  button { font: inherit; font-size: 0.95rem; padding: 0.55rem 1.1rem; cursor: pointer; border-radius: 8px; border: 1px solid #d6d6d6; background: #fff; }
  button:hover:not(:disabled) { border-color: #888; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button.primary { background: #d64545; color: #fff; border-color: #d64545; }
  .controls { display: flex; gap: 0.5rem; align-items: center; margin: 1rem 0; flex-wrap: wrap; }
  .user { color: #555; font-size: 0.9rem; }
  pre { background: #f5f5f3; padding: 0.9rem; border-radius: 8px; max-height: 320px; overflow: auto; font-size: 0.8rem; }
  .entry { padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .ok { color: #1a7a3a; }
  .err { color: #c0392b; }
  .summary { margin-top: 1rem; font-weight: 600; }
</style>
</head>
<body>
<h1>Swap itinerary days ${DAY_A} &harr; ${DAY_B}</h1>
<p>Every entry on <b>day ${DAY_A}</b> moves to <b>day ${DAY_B}</b> and vice-versa. The two day titles are swapped to match. A backup is saved to <code>scripts/</code> before any write.</p>
<p class="user" id="user">Checking auth&hellip;</p>
<div class="controls">
  <button id="signin">Sign in with Google</button>
  <button id="run" class="primary" disabled>Swap days</button>
</div>
<h3>Preview</h3>
<pre id="preview">Sign in to load the preview.</pre>
<h3>Progress</h3>
<div id="log"></div>
<p class="summary" id="summary"></p>

<script src="/firebase-config.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script>
const MIGRATION_ID = ${JSON.stringify(MIGRATION_ID)};
const DAY_A = ${DAY_A};
const DAY_B = ${DAY_B};
firebase.initializeApp(window.FIREBASE_CONFIG);
const db = firebase.firestore();

let user = null;
let plan = null;
const userEl = document.getElementById("user");
const signinBtn = document.getElementById("signin");
const runBtn = document.getElementById("run");
const previewEl = document.getElementById("preview");
const logEl = document.getElementById("log");

function logRow(cls, text) {
  const row = document.createElement("div");
  row.className = "entry " + cls;
  row.textContent = text;
  logEl.appendChild(row);
}

async function loadPlan() {
  const marker = await db.doc("itinerary_meta/migrations").get();
  if (marker.exists && marker.data()[MIGRATION_ID]) {
    previewEl.textContent = "Migration \\"" + MIGRATION_ID + "\\" has already been applied. Refusing to run again.";
    runBtn.disabled = true;
    return;
  }
  const snap = await db.collection("itinerary").get();
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  entries.sort((a, b) => (a.day - b.day) || ((a.order || 0) - (b.order || 0)));
  const toSwap = entries.filter((e) => e.day === DAY_A || e.day === DAY_B);

  const titlesDoc = await db.doc("itinerary_meta/days").get();
  const oldTitles = (titlesDoc.exists && titlesDoc.data().titles) || {};
  const newTitles = Object.assign({}, oldTitles);
  newTitles[String(DAY_A)] = oldTitles[String(DAY_B)] || "";
  newTitles[String(DAY_B)] = oldTitles[String(DAY_A)] || "";

  plan = { entries, toSwap, oldTitles, newTitles };
  const countA = toSwap.filter((e) => e.day === DAY_A).length;
  const countB = toSwap.filter((e) => e.day === DAY_B).length;
  previewEl.textContent =
    "Total entries: " + entries.length + "\\n" +
    "Day " + DAY_A + " has " + countA + " entr" + (countA === 1 ? "y" : "ies") +
    ", day " + DAY_B + " has " + countB + " entr" + (countB === 1 ? "y" : "ies") + ".\\n\\n" +
    toSwap.map((e) => "  day " + e.day + " \\u2192 " + (e.day === DAY_A ? DAY_B : DAY_A) + "  " + e.title).join("\\n") +
    "\\n\\nDay titles:\\n" +
    "  " + DAY_A + ": " + JSON.stringify(oldTitles[String(DAY_A)] || "") + " \\u2192 " + JSON.stringify(newTitles[String(DAY_A)]) + "\\n" +
    "  " + DAY_B + ": " + JSON.stringify(oldTitles[String(DAY_B)] || "") + " \\u2192 " + JSON.stringify(newTitles[String(DAY_B)]);
  runBtn.disabled = false;
}

firebase.auth().onAuthStateChanged((u) => {
  user = u;
  if (u) {
    userEl.textContent = "Signed in as " + (u.email || u.displayName || u.uid);
    signinBtn.textContent = "Sign out";
    loadPlan().catch((e) => { previewEl.textContent = "Failed to load: " + e.message; });
  } else {
    userEl.textContent = "Not signed in.";
    signinBtn.textContent = "Sign in with Google";
    runBtn.disabled = true;
  }
});

signinBtn.onclick = async () => {
  signinBtn.disabled = true;
  try {
    if (user) {
      await firebase.auth().signOut();
    } else {
      await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
  } catch (e) {
    alert("Auth error: " + e.message);
  } finally {
    signinBtn.disabled = false;
  }
};

runBtn.onclick = async () => {
  if (!plan) return;
  runBtn.disabled = true;
  signinBtn.disabled = true;

  // 1. Backup everything before touching it.
  try {
    const res = await fetch("/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: plan.entries, titles: plan.oldTitles }),
    });
    if (!res.ok) throw new Error("backup endpoint returned " + res.status);
    logRow("ok", "\\u2713 Backup saved (" + (await res.text()) + ")");
  } catch (e) {
    logRow("err", "\\u2717 Backup failed: " + e.message + " \\u2014 aborting, nothing was written.");
    return;
  }

  // 2. Swap entries in a single batch (atomic; far fewer than 500 ops).
  try {
    const batch = db.batch();
    for (const e of plan.toSwap) {
      batch.update(db.collection("itinerary").doc(e.id), {
        day: e.day === DAY_A ? DAY_B : DAY_A,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }
    batch.set(db.doc("itinerary_meta/days"), { titles: plan.newTitles }, { merge: true });
    batch.set(db.doc("itinerary_meta/migrations"), {
      [MIGRATION_ID]: {
        by: user.email || user.uid,
        at: firebase.firestore.FieldValue.serverTimestamp(),
        swapped: plan.toSwap.length,
      },
    }, { merge: true });
    await batch.commit();
    logRow("ok", "\\u2713 Swapped " + plan.toSwap.length + " entries and the two day titles.");
  } catch (e) {
    logRow("err", "\\u2717 Batch failed: " + e.message + " \\u2014 no partial writes (batches are atomic).");
    return;
  }

  document.getElementById("summary").textContent = "Done. You can close this tab.";
  fetch("/done", { method: "POST", body: JSON.stringify({ ok: plan.toSwap.length }) });
};
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } else if (req.url === "/firebase-config.js") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(configJs);
  } else if (req.url === "/backup" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const file = path.join(__dirname, `itinerary-backup-${stamp}.json`);
        fs.writeFileSync(file, JSON.stringify(JSON.parse(body), null, 2));
        console.log(`Backup written: ${path.relative(ROOT, file)}`);
        res.end(path.basename(file));
      } catch (e) {
        res.writeHead(500).end(e.message);
      }
    });
  } else if (req.url === "/done" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.end("OK");
      try {
        const r = JSON.parse(body || "{}");
        console.log(`\nFinished: ${r.ok || 0} entries swapped.`);
      } catch {
        console.log("\nFinished.");
      }
      setTimeout(() => process.exit(0), 300);
    });
  } else {
    res.writeHead(404).end();
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\nServer running at ${url}`);
  console.log(`Swapping days ${DAY_A} and ${DAY_B}.`);
  console.log(`Opening browser... sign in with Google, review the preview, then click "Swap days".`);
  console.log(`(Ctrl+C to abort)\n`);

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
});
