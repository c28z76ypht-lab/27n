/* ============================================================
   27n — interações
   ============================================================ */
(function () {
  "use strict";

  /* ---- Ano no rodapé ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header: muda ao fazer scroll ---- */
  var header = document.getElementById("header");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 12); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var delay = Math.min(i * 55, 220);
          setTimeout(function () { entry.target.classList.add("in"); }, delay);
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---- Contadores animados (hero card + stat band) ---- */
  var counters = document.querySelectorAll("[data-count]");

  var formatValue = function (val, decimals, suffix, plain) {
    var n;
    if (decimals > 0) {
      n = val.toFixed(decimals).replace(".", ","); // formato PT
    } else if (!plain && val >= 1000) {
      n = Math.round(val).toLocaleString("pt-PT");
    } else {
      n = Math.round(val).toString();
    }
    return n + suffix;
  };

  var animateCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var plain = el.getAttribute("data-plain") === "true";
    var duration = 1500, start = null;
    var tick = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatValue(target * eased, decimals, suffix, plain);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = formatValue(target, decimals, suffix, plain);
    };
    requestAnimationFrame(tick);
  };

  if (prefersReduced || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) {
      el.textContent = formatValue(
        parseFloat(el.getAttribute("data-count")),
        parseInt(el.getAttribute("data-decimals") || "0", 10),
        el.getAttribute("data-suffix") || "",
        el.getAttribute("data-plain") === "true"
      );
    });
  } else {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cntObs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cntObs.observe(el); });
  }

  /* ---- Formulário de contacto (sem backend: feedback local) ---- */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var nome = document.getElementById("nome").value.trim();
      var isEN = (document.documentElement.lang || "pt").slice(0, 2) === "en";
      status.textContent = isEN
        ? "Thanks, " + (nome || "") + "! We got your request and will reply within 24h."
        : "Obrigado, " + (nome || "") + "! Recebemos o teu pedido e respondemos em 24h.";
      form.reset();
    });
  }
})();
