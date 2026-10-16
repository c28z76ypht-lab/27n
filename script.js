/* ============================================================
   27n: interações
   ============================================================ */
(function () {
  "use strict";

  /* ---- Theme (light / dark) ---- */
  (function () {
    var root = document.documentElement;
    var storageKey = "27n-theme";
    var meta = document.querySelector('meta[name="theme-color"]');

    var updateMeta = function () {
      if (!meta) return;
      var color = getComputedStyle(root).getPropertyValue("--theme-color").trim();
      if (color) meta.setAttribute("content", color);
    };

    var labels = function (theme) {
      var lang = (root.lang || "pt").slice(0, 2);
      var copy = {
        en: ["Switch to light mode", "Switch to dark mode"],
        pt: ["Mudar para modo claro", "Mudar para modo escuro"],
        de: ["Zum hellen Modus wechseln", "Zum dunklen Modus wechseln"],
        fr: ["Passer au mode clair", "Passer au mode sombre"],
        es: ["Cambiar a modo claro", "Cambiar a modo oscuro"]
      };
      var pair = copy[lang] || copy.pt;
      return theme === "dark" ? pair[0] : pair[1];
    };

    var syncToggle = function (theme) {
      var label = labels(theme);
      ["theme-toggle", "theme-toggle-menu"].forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) btn.setAttribute("aria-label", label);
      });
    };

    var applyTheme = function (theme) {
      root.setAttribute("data-theme", theme);
      updateMeta();
      syncToggle(theme);
    };

    var toggleTheme = function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      applyTheme(next);
    };

    applyTheme(root.getAttribute("data-theme") || "dark");

    document.addEventListener("DOMContentLoaded", function () {
      ["theme-toggle", "theme-toggle-menu"].forEach(function (id) {
        var btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", toggleTheme);
      });
    });
  })();

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

  var fold = function (s) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  var platformSearch = document.getElementById("platform-search");
  if (platformSearch) {
    platformSearch.addEventListener("input", function () {
      var q = fold(platformSearch.value.trim());
      document.querySelectorAll(".platform-grid li").forEach(function (item) {
        item.hidden = !!q && fold(item.textContent).indexOf(q) === -1;
      });
    });
  }

  var appSearch = document.getElementById("app-search");
  if (appSearch) {
    appSearch.addEventListener("input", function () {
      var q = fold(appSearch.value.trim());
      document.querySelectorAll(".app-group").forEach(function (group) {
        var visible = 0;
        group.querySelectorAll(".app").forEach(function (card) {
          var show = !q || fold(card.textContent).indexOf(q) !== -1;
          card.hidden = !show;
          if (show) {
            visible += 1;
            card.classList.add("in");
          }
        });
        group.hidden = visible === 0;
      });
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
    var submitBtn = form.querySelector('button[type="submit"]');
    var lang = (document.documentElement.lang || "pt").slice(0, 2);
    var copy = {
      en: {
        sending: "Sending…",
        ok: function (nome) { return "Thanks, " + (nome || "") + "! We got your request and will reply within 24h."; },
        err: "Something went wrong. Please try again or email ola@27n.pt."
      },
      pt: {
        sending: "A enviar…",
        ok: function (nome) { return "Obrigado, " + (nome || "") + "! Recebemos o teu pedido e respondemos em 24h."; },
        err: "Algo correu mal. Tenta novamente ou escreve para ola@27n.pt."
      },
      de: {
        sending: "Wird gesendet…",
        ok: function (nome) { return "Danke, " + (nome || "") + "! Wir haben deine Anfrage erhalten und antworten innerhalb von 24 Stunden."; },
        err: "Etwas ist schiefgelaufen. Versuch es erneut oder schreib an ola@27n.pt."
      },
      fr: {
        sending: "Envoi…",
        ok: function (nome) { return "Merci, " + (nome || "") + " ! Nous avons bien reçu votre demande et répondons sous 24 h."; },
        err: "Une erreur s'est produite. Réessayez ou écrivez à ola@27n.pt."
      },
      es: {
        sending: "Enviando…",
        ok: function (nome) { return "Gracias, " + (nome || "") + ". Recibimos tu solicitud y respondemos en 24 h."; },
        err: "Algo salió mal. Inténtalo de nuevo o escribe a ola@27n.pt."
      }
    };
    var t = copy[lang] || copy.pt;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var nome = document.getElementById("nome").value.trim();

      status.textContent = t.sending;
      status.classList.remove("form__status--error");
      if (submitBtn) submitBtn.disabled = true;

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success) {
            status.textContent = t.ok(nome);
            status.classList.remove("form__status--error");
            form.reset();
          } else {
            status.textContent = t.err;
            status.classList.add("form__status--error");
          }
        })
        .catch(function () {
          status.textContent = t.err;
          status.classList.add("form__status--error");
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  /* ---- Portfólio: grelha de lojas (screenshots) ---- */
  (function () {
    var grid = document.getElementById("work-grid");
    if (!grid) return;
    var base = "/";
    var urls = [
      "https://adamryansuits.com/","https://bosssupplements.com/","https://caramels.com/",
      "https://chocolate.com/","https://cubbybeds.com/","https://dimebeautyco.com/",
      "https://goldielocks.com/","https://licorice.com/","https://mybodyrestore.com/",
      "https://pensavings.com/","https://shellycove.com/","https://shopbrickcraft.com/",
      "https://taffy.com/","https://thecustomcaptain.com/","https://thepatchbrand.com/",
      "https://titancasket.com/","https://trystrips.com/","https://www.5strands.com/",
      "https://www.carbonaccents.co.uk/","https://www.diviofficial.com/","https://www.eskcare.com/",
      "https://www.gestaltwinecompany.com/","https://www.muddybites.com/","https://www.roewellness.com/",
      "https://www.romadesignerjewelry.com/","https://www.skoutorganic.com/","https://www.trybetterbrand.com/",
      "https://www.vyperindustrial.com/"
    ];
    var host = function (u) { return u.replace(/^https?:\/\//, "").split("/")[0]; };
    var slug = function (h) { return h.replace(/^www\./, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };

    var html = urls.map(function (u) {
      var h = host(u);
      var display = h.replace(/^www\./, "");
      var s = slug(h);
      var img = base + "assets/work/" + s + ".jpg";
      return '<a class="work-item" href="' + u + '" target="_blank" rel="noopener" aria-label="' + display + '">' +
        '<span class="work-thumb"><img loading="lazy" alt="' + display + '" src="' + img + '" ' +
        'onerror="this.style.display=\'none\';this.parentNode.classList.add(\'work-thumb--fallback\');this.parentNode.setAttribute(\'data-label\',\'' + display + '\');"></span>' +
        '<span class="work-cap"><span class="work-name">' + display + '</span><span class="work-go" aria-hidden="true">↗</span></span>' +
        '</a>';
    }).join("");
    grid.innerHTML = html;
  })();

  /* ---- Logos marquee ---- */
  (function () {
    var track = document.getElementById("logos-track");
    if (!track) return;
    var base = "/";
    var logos = [
      "5strands-com","adamryansuits-com","bosssupplements-com","caramels-com",
      "carbonaccents-co-uk","chocolate-com","cubbybeds-com","dimebeautyco-com",
      "eskcare-com","goldielocks-com","licorice-com","muddybites-com",
      "mybodyrestore-com","pensavings-com","roewellness-com","shellycove-com",
      "shopbrickcraft-com","skoutorganic-com","taffy-com","thecustomcaptain-com",
      "thepatchbrand-com","titancasket-com","trystrips-com","vyperindustrial-com"
    ];
    var label = function (slug) {
      return slug.replace(/-com$/, "").replace(/-co-uk$/, "").replace(/-/g, " ");
    };
    var items = logos.map(function (slug) {
      return '<span class="logos__item"><img src="' + base + 'assets/logos/' + slug + '.png" alt="' +
        label(slug) + '" loading="lazy" width="120" height="36"></span>';
    }).join("");
    track.innerHTML = items + items;
  })();

  /* ---- Cookie consent ---- */
  (function () {
    var banner = document.getElementById("cookie-banner");
    if (!banner) return;
    var key = "27n-cookie-consent";
    try {
      if (localStorage.getItem(key)) return;
    } catch (e) { /* ignore */ }
    banner.hidden = false;
    banner.querySelectorAll("[data-cookie]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try { localStorage.setItem(key, btn.getAttribute("data-cookie")); } catch (e) { /* ignore */ }
        banner.hidden = true;
      });
    });
  })();

  /* ---- Widget flutuante de contacto (WhatsApp → 27n) ---- */
  (function () {
    var lang = (document.documentElement.lang || "pt").slice(0, 2);
    var waCopy = {
      pt: {
        title: "Vamos conversar?",
        body: "Ao continuar, irá abrir uma conversa com a equipa 27n.",
        go: "Continuar no WhatsApp",
        later: "Agora não",
        open: "Abrir conversa no WhatsApp",
        close: "Fechar"
      },
      en: {
        title: "Shall we talk?",
        body: "Continuing opens a conversation with the 27n team.",
        go: "Continue on WhatsApp",
        later: "Not now",
        open: "Open a WhatsApp conversation",
        close: "Close"
      },
      de: {
        title: "Wollen wir sprechen?",
        body: "Weiter öffnet ein Gespräch mit dem 27n-Team.",
        go: "Weiter auf WhatsApp",
        later: "Jetzt nicht",
        open: "WhatsApp-Gespräch öffnen",
        close: "Schließen"
      },
      fr: {
        title: "On en parle ?",
        body: "En continuant, une conversation s'ouvre avec l'équipe 27n.",
        go: "Continuer sur WhatsApp",
        later: "Pas maintenant",
        open: "Ouvrir une conversation WhatsApp",
        close: "Fermer"
      },
      es: {
        title: "¿Hablamos?",
        body: "Al continuar, se abrirá una conversación con el equipo 27n.",
        go: "Continuar en WhatsApp",
        later: "Ahora no",
        open: "Abrir una conversación de WhatsApp",
        close: "Cerrar"
      }
    };
    var messages = {
      pt: "Olá! Vim do site da 27n e gostava de falar sobre um projeto.",
      en: "Hi! I came from the 27n website and I'd like to talk about a project.",
      de: "Hallo! Ich komme von der 27n-Website und möchte über ein Projekt sprechen.",
      fr: "Bonjour ! Je viens du site 27n et j'aimerais parler d'un projet.",
      es: "Hola. Vengo de la web de 27n y me gustaría hablar de un proyecto."
    };
    var copy = waCopy[lang] || waCopy.pt;
    var waHref = "https://wa.me/351911579030?text=" + encodeURIComponent(messages[lang] || messages.pt);
    var waIcon = '<svg class="fab-icon-wa" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M12 2.2A9.8 9.8 0 0 0 3.5 16.7L2.2 21.8l5.2-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.8c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.8-.3-1.6-.8-2.2-1.6-.5-.6-.9-1.3-1-1.5-.1-.2 0-.4.1-.5l.4-.4c.1-.1.1-.2.2-.4.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.5-.3z"/>' +
      '</svg>';
    var xIcon = '<svg class="fab-icon-x" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';

    var el = document.createElement("div");
    el.className = "fab-contact";
    el.innerHTML =
      '<div class="fab-panel" id="fab-panel" hidden role="dialog" aria-labelledby="fab-title">' +
        '<div class="fab-panel__head">' +
          '<span class="fab-brand" aria-hidden="true">27<span>n</span></span>' +
          '<button class="fab-x" type="button" data-fab-close>' + xIcon + '</button>' +
        '</div>' +
        '<div class="fab-panel__body">' +
          '<div class="fab-card">' +
            '<h2 id="fab-title"></h2>' +
            '<p></p>' +
          '</div>' +
          '<a class="fab-go" target="_blank" rel="noopener"></a>' +
          '<button class="fab-later" type="button" data-fab-close></button>' +
        '</div>' +
      '</div>' +
      '<button class="fab-trigger" type="button" aria-expanded="false" aria-controls="fab-panel">' +
        waIcon + xIcon +
      '</button>';
    document.body.appendChild(el);

    var panel = el.querySelector(".fab-panel");
    var trigger = el.querySelector(".fab-trigger");
    var title = el.querySelector("#fab-title");
    var body = el.querySelector(".fab-card p");
    var go = el.querySelector(".fab-go");
    var later = el.querySelector(".fab-later");
    var closers = el.querySelectorAll("[data-fab-close]");
    title.textContent = copy.title;
    body.textContent = copy.body;
    go.textContent = copy.go;
    go.href = waHref;
    later.textContent = copy.later;
    trigger.setAttribute("aria-label", copy.open);
    el.querySelector(".fab-x").setAttribute("aria-label", copy.close);

    function setOpen(open) {
      el.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      trigger.setAttribute("aria-label", open ? copy.close : copy.open);
      if (open) {
        panel.hidden = false;
        go.focus();
      } else {
        panel.hidden = true;
        trigger.focus();
      }
    }

    trigger.addEventListener("click", function () { setOpen(!el.classList.contains("is-open")); });
    closers.forEach(function (btn) {
      btn.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && el.classList.contains("is-open")) setOpen(false);
    });
  })();
})();
