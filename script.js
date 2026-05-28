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

  /* ---- Widget flutuante de contacto (WhatsApp) ---- */
  (function () {
    var isEN = (document.documentElement.lang || "pt").slice(0, 2) === "en";
    var t = {
      trigger: isEN ? "Contact us" : "Contacta-nos",
      bubble: isEN ? "Message us 👋" : "Fala connosco 👋",
      title: isEN ? "Chat on WhatsApp" : "Fala por WhatsApp",
      close: isEN ? "Close" : "Fechar"
    };
    var msg = encodeURIComponent(isEN
      ? "Hi! I came from the 27n website and I'd like to talk about a project."
      : "Olá! Vim do site da 27n e gostava de falar sobre um projeto.");
    var team = [
      { name: "Gonçalo", phone: "351964184075" },
      { name: "Alexandre", phone: "351961904305" },
      { name: "Afonso", phone: "351969189741" }
    ];
    var waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />' +
      '<path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z" /></svg>';

    var people = team.map(function (p) {
      return '<a class="fab-wa" href="https://wa.me/' + p.phone + '?text=' + msg + '" target="_blank" rel="noopener">' +
        '<span class="fab-wa-name">' + p.name + '</span>' + waIcon + '</a>';
    }).join("");

    var el = document.createElement("div");
    el.className = "fab-contact";
    el.innerHTML =
      '<div class="fab-panel" id="fab-panel" role="menu" aria-label="' + t.title + '">' +
        '<p class="fab-panel-title">' + t.title + '</p>' + people +
        '<button type="button" class="fab-close">' + t.close + ' ✕</button>' +
      '</div>' +
      '<div class="fab-launch">' +
        '<span class="fab-bubble">' + t.bubble + '</span>' +
        '<button type="button" class="fab-trigger" aria-expanded="false" aria-controls="fab-panel" aria-label="' + t.trigger + '">' +
          '<span>' + t.trigger + '</span> 💬<span class="fab-badge">1</span></button>' +
      '</div>';
    document.body.appendChild(el);

    var trigger = el.querySelector(".fab-trigger");
    var closeBtn = el.querySelector(".fab-close");
    var setOpen = function (open) {
      el.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };
    trigger.addEventListener("click", function () { setOpen(true); });
    closeBtn.addEventListener("click", function () { setOpen(false); trigger.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  })();
})();
