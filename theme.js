// Theme (light/dark) handling. Loaded synchronously in <head> so the saved
// theme is applied before first paint — no light-mode flash.
(function () {
  const KEY = "jt-theme";

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", btn.title);
    }
  }

  applyTheme(preferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    // Re-run now that the button exists, to set its icon.
    applyTheme(document.documentElement.dataset.theme);
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch {}
      applyTheme(next);
    });
  });

  // Follow OS preference changes unless the user has explicitly chosen.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch {}
      if (saved !== "dark" && saved !== "light") applyTheme(e.matches ? "dark" : "light");
    });
  }
})();
