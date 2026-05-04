// Bulk-add entries to the itinerary Firestore collection.
//
// Usage:
//   1. Copy scripts/entries.example.json -> scripts/entries.json and edit it.
//   2. Run: node scripts/bulk-add-itinerary.js
//   3. A browser tab opens. Click "Sign in with Google", then "Add entries".
//   4. The script writes via the browser using your authenticated session,
//      so Firestore rules apply normally and createdBy is set correctly.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8766;
const ROOT = path.join(__dirname, "..");
const ENTRIES_PATH = path.join(__dirname, "entries.json");
const CONFIG_PATH = path.join(ROOT, "firebase-config.js");

if (!fs.existsSync(ENTRIES_PATH)) {
  console.error(
    `Missing ${ENTRIES_PATH}\n` +
      `Copy scripts/entries.example.json to scripts/entries.json and edit it.`
  );
  process.exit(1);
}

let entries;
try {
  entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, "utf-8"));
} catch (e) {
  console.error(`Could not parse ${ENTRIES_PATH}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(entries) || entries.length === 0) {
  console.error("entries.json must be a non-empty array.");
  process.exit(1);
}
for (const [i, e] of entries.entries()) {
  if (typeof e.day !== "number" || !e.title) {
    console.error(`Entry #${i} missing required fields (day:number, title:string)`);
    process.exit(1);
  }
}

const configJs = fs.readFileSync(CONFIG_PATH, "utf-8");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Bulk add itinerary</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { margin-top: 0; }
  button { font: inherit; font-size: 0.95rem; padding: 0.55rem 1.1rem; cursor: pointer; border-radius: 8px; border: 1px solid #d6d6d6; background: #fff; }
  button:hover:not(:disabled) { border-color: #888; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  button.primary { background: #d64545; color: #fff; border-color: #d64545; }
  .controls { display: flex; gap: 0.5rem; align-items: center; margin: 1rem 0; flex-wrap: wrap; }
  .user { color: #555; font-size: 0.9rem; }
  pre { background: #f5f5f3; padding: 0.9rem; border-radius: 8px; max-height: 220px; overflow: auto; font-size: 0.8rem; }
  .entry { padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .ok { color: #1a7a3a; }
  .err { color: #c0392b; }
  .pending { color: #888; }
  .summary { margin-top: 1rem; font-weight: 600; }
</style>
</head>
<body>
<h1>Bulk add to itinerary</h1>
<p class="user" id="user">Checking auth&hellip;</p>
<div class="controls">
  <button id="signin">Sign in with Google</button>
  <button id="run" class="primary" disabled>Add ${entries.length} entries</button>
</div>
<h3>Will add ${entries.length} ${entries.length === 1 ? "entry" : "entries"}:</h3>
<pre id="preview"></pre>
<h3>Progress</h3>
<div id="log"></div>
<p class="summary" id="summary"></p>

<script src="/firebase-config.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script>
const ENTRIES = ${JSON.stringify(entries)};
firebase.initializeApp(window.FIREBASE_CONFIG);

document.getElementById("preview").textContent = JSON.stringify(ENTRIES, null, 2);

let user = null;
const userEl = document.getElementById("user");
const signinBtn = document.getElementById("signin");
const runBtn = document.getElementById("run");

firebase.auth().onAuthStateChanged((u) => {
  user = u;
  if (u) {
    userEl.textContent = "Signed in as " + (u.email || u.displayName || u.uid);
    signinBtn.textContent = "Sign out";
    runBtn.disabled = false;
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
  runBtn.disabled = true;
  signinBtn.disabled = true;
  const log = document.getElementById("log");
  const db = firebase.firestore();
  const ts = firebase.firestore.FieldValue.serverTimestamp();
  const baseOrder = Date.now();
  let okCount = 0, errCount = 0;

  for (let i = 0; i < ENTRIES.length; i++) {
    const e = ENTRIES[i];
    const row = document.createElement("div");
    row.className = "entry pending";
    row.textContent = "⏳ Day " + e.day + " — " + e.title;
    log.appendChild(row);
    try {
      await db.collection("itinerary").add({
        day: e.day,
        order: typeof e.order === "number" ? e.order : (baseOrder + i),
        placeSlug: e.placeSlug || null,
        title: e.title,
        notes: e.notes || "",
        tickets: Array.isArray(e.tickets) ? e.tickets : [],
        createdBy: {
          uid: user.uid,
          name: user.displayName || "Anon",
          photo: user.photoURL || null,
        },
        createdAt: ts,
        updatedAt: ts,
      });
      row.className = "entry ok";
      row.textContent = "✓ Day " + e.day + " — " + e.title;
      okCount++;
    } catch (err) {
      row.className = "entry err";
      row.textContent = "✗ Day " + e.day + " — " + e.title + " — " + err.message;
      errCount++;
    }
  }

  document.getElementById("summary").textContent =
    "Done. " + okCount + " added, " + errCount + " failed. You can close this tab.";

  fetch("/done", { method: "POST", body: JSON.stringify({ ok: okCount, err: errCount }) });
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
  } else if (req.url === "/done" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.end("OK");
      try {
        const r = JSON.parse(body || "{}");
        console.log(`\nFinished: ${r.ok || 0} added, ${r.err || 0} failed.`);
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
  console.log(`\nLoaded ${entries.length} entries from ${path.relative(ROOT, ENTRIES_PATH)}`);
  console.log(`Server running at ${url}`);
  console.log(`Opening browser... sign in with Google, then click "Add entries".`);
  console.log(`(Ctrl+C to abort)\n`);

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
});
