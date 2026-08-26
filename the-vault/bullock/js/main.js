// Bullock Hearing Centre — shared site behaviour

(function () {
  "use strict";

  // ---- Mobile nav toggle ----
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      });
    });
  }

  // ---- Text size control (persisted) ----
  var sizeButtons = document.querySelectorAll(".textsize-toggle button");
  var savedSize = localStorage.getItem("bhc-textsize") || "base";

  function applySize(size) {
    if (size === "base") {
      document.documentElement.removeAttribute("data-textsize");
    } else {
      document.documentElement.setAttribute("data-textsize", size);
    }
    sizeButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.dataset.size === size ? "true" : "false");
    });
    localStorage.setItem("bhc-textsize", size);
  }

  if (sizeButtons.length) {
    applySize(savedSize);
    sizeButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applySize(btn.dataset.size);
      });
    });
  }

  // ---- Mark current nav link ----
  var here = (window.location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".site-nav a, .footer-col a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === here || (here === "" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // ---- Appointment request form: friendly inline confirmation ----
  var form = document.querySelector(".book-form form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var success = document.querySelector(".form-success");
      form.style.display = "none";
      if (success) {
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  }
})();
