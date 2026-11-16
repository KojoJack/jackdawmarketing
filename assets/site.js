/* ============================================================
   Jackdaw Marketing: shared behaviour for every page.
   Theme toggle, sticky bar, mobile menu, footer year, analytics events.
   Page-specific code (homepage CONFIG + wordmark, the Vault gate)
   stays inline in that page.
   ============================================================ */
(function () {
  /* ---------- theme toggle ---------- */
  var THEME_KEY = "jackdaw-theme";
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function currentTheme() { return root.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  function applyThemeChrome(theme) {
    if (toggle) toggle.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    if (metaTheme) metaTheme.setAttribute("content", theme === "light" ? "#FCF3E3" : "#221024");
  }
  applyThemeChrome(currentTheme());
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyThemeChrome(next);
      // the homepage wordmark re-reads its colors from the CSS tokens
      if (window.refreshWordmarkPalette) window.refreshWordmarkPalette();
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = "© " + new Date().getFullYear() + " Jackdaw Marketing";

  /* ---------- sticky bar ---------- */
  var bar = document.getElementById("bar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("stuck", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- mobile menu ---------- */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menuBtn");
  if (nav && menuBtn) {
    var closeMenu = function () {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "Menu";
    };
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 760) closeMenu(); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- analytics: phone, email and contact form ---------- */
  function trackEvent(name, params) {
    if (typeof window.gtag !== "function") return;
    var p = { transport_type: "beacon" };
    for (var k in params) p[k] = params[k];
    window.gtag("event", name, p);
  }
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
    if (!link) return;
    var href = link.getAttribute("href");
    trackEvent(href.indexOf("tel:") === 0 ? "phone_click" : "email_click", { link_url: href });
  });
  var contactForm = document.querySelector(".contact-form");
  if (contactForm) contactForm.addEventListener("submit", function () { trackEvent("send_message", { form_name: "contact" }); });

  /* ---------- the walking mascot ----------
     If nobody touches the page for a few seconds, the bird walks across the
     bottom of the screen. Clicking it opens a speech bubble that points to
     the contact form. It stays away while someone is typing, while the form
     is already on screen, on the thank-you page and in the Vault, and for
     anyone who has asked their device to reduce motion. */
  (function () {
    if (document.body.getAttribute("data-walker") === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try { if (sessionStorage.getItem("jackdaw-walker") === "done") return; } catch (e) {}

    var IDLE_MS = 6000, SPEED = 68, MAX_WALKS = 3;
    // the same pixel grid as the logo bird (keep in step with BIRD in the page builder)
    var GRID = [
      ".............PPPP......", "............PPPPPP.....", "............PPMPPP.....", "............PPPPPPTT.CC",
      "...........PPPPPPPTT.CC", "..........PPPPPPPP.....", ".........PPPPPPPPP.....", "........PPPPMPPPPP.....",
      ".......PPPPMMPPPPP.....", ".....PPPPPMMPPPPPP.....", "...PPPPPPPMMPPPPPPP....", "PPPPPPPPPMMPPPPPPPP....",
      ".PPPPPPPPPPPPPPPPP.....", "....PPPP.....PPPP......", "....P...........P......", "...PPP.........PPP....."
    ];
    var FILL = { P: "var(--bird-body)", M: "var(--bird-detail)", T: "var(--brand-tomato)", C: "var(--bird-bright)" };
    var bird, say, timer, state = "idle", x = 0, dir = 1, lastT = 0, walks = 0, paused = false;

    function make() {
      var parts = { body: "", legl: "", legr: "" };
      GRID.forEach(function (row, y) {
        for (var c = 0; c < row.length; c++) {
          if (row[c] === ".") continue;
          var group = y < 13 ? "body" : (c < 10 ? "legl" : "legr");
          parts[group] += '<rect x="' + c + '" y="' + y + '" width="1" height="1" fill="' + FILL[row[c]] + '"/>';
        }
      });
      bird = document.createElement("button");
      bird.type = "button"; bird.className = "walker"; bird.tabIndex = -1;
      bird.setAttribute("aria-label", "The Jackdaw bird. Click for a message.");
      bird.innerHTML = '<svg viewBox="0 -1 23 17" aria-hidden="true" shape-rendering="crispEdges"><g class="w-body">' + parts.body +
        '</g><g class="w-legl">' + parts.legl + '</g><g class="w-legr">' + parts.legr + "</g></svg>";
      var href = document.getElementById("contact") ? "#contact" : "/#contact";
      say = document.createElement("div");
      say.className = "walker-say"; say.setAttribute("role", "status");
      say.innerHTML = '<button type="button" class="x" aria-label="Close">&times;</button>' +
        "<p>Hey! Click here to get your new website started!</p>" +
        '<a class="btn dark" href="' + href + '">Start my website</a>';
      document.body.appendChild(bird); document.body.appendChild(say);

      bird.addEventListener("pointerenter", function () { paused = true; bird.classList.remove("walking"); });
      bird.addEventListener("pointerleave", function () { if (state === "walking") { paused = false; bird.classList.add("walking"); lastT = performance.now(); } });
      bird.addEventListener("click", function () { if (state === "talking") closeSay(); else openSay(); });
      say.querySelector(".x").addEventListener("click", closeSay);
      say.querySelector("a").addEventListener("click", function () {
        try { sessionStorage.setItem("jackdaw-walker", "done"); } catch (e) {}
        walks = MAX_WALKS; say.classList.remove("on"); bird.classList.remove("on", "walking"); state = "idle";
      });
    }

    function openSay() {
      state = "talking"; bird.classList.remove("walking");
      say.classList.add("on");
      var w = bird.offsetWidth, sw = say.offsetWidth;
      var left = Math.max(12, Math.min(window.innerWidth - sw - 12, x + w / 2 - sw / 2));
      say.style.left = left + "px";
      say.style.bottom = (12 + bird.offsetHeight + 18) + "px";
      say.style.setProperty("--tail", Math.max(22, Math.min(sw - 22, x + w / 2 - left)) + "px");
    }
    function closeSay() {
      say.classList.remove("on");
      state = "walking"; paused = false; bird.classList.add("walking"); lastT = performance.now();
      requestAnimationFrame(step);
    }

    function blocked() {
      var a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;      // someone is filling in a form
      if (document.hidden || document.querySelector(".preview.on")) return true;
      var form = document.getElementById("contact");
      if (form) { var r = form.getBoundingClientRect(); if (r.top < window.innerHeight * 0.85 && r.bottom > 0) return true; }
      return false;
    }
    function arm() { clearTimeout(timer); if (state === "idle" && walks < MAX_WALKS) timer = setTimeout(go, IDLE_MS); }
    function go() {
      if (blocked()) { arm(); return; }
      if (!bird) make();
      dir = walks % 2 === 0 ? 1 : -1;                    // left to right first, then back the other way
      bird.classList.add("on", "walking"); bird.classList.toggle("flip", dir < 0);
      x = dir > 0 ? -bird.offsetWidth : window.innerWidth;
      bird.style.transform = "translateX(" + x + "px)";
      state = "walking"; paused = false; lastT = performance.now();
      requestAnimationFrame(step);
    }
    function step(now) {
      if (state !== "walking") return;
      if (!paused) x += dir * SPEED * Math.min(64, now - lastT) / 1000;
      lastT = now;
      bird.style.transform = "translateX(" + x + "px)";
      if (x > window.innerWidth + 8 || x < -bird.offsetWidth - 8) {
        bird.classList.remove("on", "walking"); state = "idle"; walks++; arm();
      } else requestAnimationFrame(step);
    }
    ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, arm, { passive: true });
    });
    arm();
  })();
})();
