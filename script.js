/* ============================================================
   27n — interações
   ============================================================ */
(function () {
  "use strict";

  /* ---- Ano no rodapé ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Header: sombra ao fazer scroll ---- */
  var header = document.getElementById("header");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
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
          // pequeno stagger entre irmãos visíveis
          var delay = Math.min(i * 60, 240);
          setTimeout(function () { entry.target.classList.add("in"); }, delay);
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---- Contadores animados ---- */
  var counters = document.querySelectorAll(".stat__num[data-count]");
  var animateCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var plain = el.getAttribute("data-plain") === "true"; // ex.: ano (sem separador de milhar)
    var duration = 1500;
    var start = null;

    var format = function (val) {
      var n = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
      if (decimals > 0) n = n.replace(".", ","); // formato PT
      if (!plain && decimals === 0 && val >= 1000) {
        n = Math.round(val).toLocaleString("pt-PT");
      }
      return n + suffix;
    };

    var tick = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = format(target);
    };
    requestAnimationFrame(tick);
  };

  if (prefersReduced || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) {
      var t = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suf = el.getAttribute("data-suffix") || "";
      var plain = el.getAttribute("data-plain") === "true";
      var txt = dec > 0 ? t.toFixed(dec).replace(".", ",") : (!plain && t >= 1000 ? t.toLocaleString("pt-PT") : t.toString());
      el.textContent = txt + suf;
    });
  } else {
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cntObs.unobserve(entry.target);
        }
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
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var nome = document.getElementById("nome").value.trim();
      status.textContent = "Obrigado, " + (nome || "") + "! Recebemos o teu pedido e respondemos em 24h.";
      form.reset();
    });
  }
})();
