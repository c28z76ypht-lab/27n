/* ============================================================
   27n Secure Links — ticket + token helpers + form submit
   ============================================================ */
(function () {
  "use strict";

  var isEN = (document.documentElement.lang || "pt").slice(0, 2) === "en";

  function pathToken() {
    var parts = location.pathname.replace(/\/+$/, "").split("/");
    var idx = parts.indexOf("submission");
    if (idx === -1) return "";
    var token = parts[idx + 1] || "";
    if (!token || token === "index.html") return "";
    return decodeURIComponent(token);
  }

  function queryParam(name) {
    try {
      return new URLSearchParams(location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function ticketFromQuery() {
    return (queryParam("ticket") || queryParam("t") || "").replace(/^#/, "").trim();
  }

  function formatTicket(raw) {
    if (!raw) return "";
    return raw.charAt(0) === "#" ? raw : "#" + raw;
  }

  /* ---- Submission page: fill ticket / token, handle form ---- */
  var ticketEl = document.getElementById("secure-ticket");
  var ticketInput = document.getElementById("ticket-id");
  var tokenInput = document.getElementById("link-token");
  var subjectInput = document.getElementById("secure-subject");
  var form = document.getElementById("secure-form");
  var status = document.getElementById("form-status");

  if (ticketEl || form) {
    var ticket = formatTicket(ticketFromQuery());
    var token = pathToken() || queryParam("ref") || "";

    if (ticketEl) {
      if (ticket) {
        ticketEl.textContent = isEN
          ? "Ticket ID: " + ticket
          : "Ticket ID: " + ticket;
      } else if (token) {
        ticketEl.textContent = isEN
          ? "Link ID: " + token.slice(0, 12) + (token.length > 12 ? "…" : "")
          : "Link ID: " + token.slice(0, 12) + (token.length > 12 ? "…" : "");
      } else {
        ticketEl.textContent = isEN
          ? "Secure link · 27n"
          : "Link seguro · 27n";
      }
    }

    if (ticketInput) ticketInput.value = ticket || "(sem ticket)";
    if (tokenInput) tokenInput.value = token || "(sem token)";
    if (subjectInput) {
      subjectInput.value = ticket
        ? "Secure data submission " + ticket + " | 27n"
        : "Secure data submission | 27n";
    }
  }

  if (form && status) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var t = {
      sending: isEN ? "Sending…" : "A enviar…",
      ok: isEN
        ? "Received. The 27n team will use this only for your project."
        : "Recebido. A equipa 27n usa estes dados só para o teu projeto.",
      err: isEN
        ? "Something went wrong. Try again or email ola@27n.pt."
        : "Algo correu mal. Tenta novamente ou escreve para ola@27n.pt.",
      empty: isEN
        ? "Please enter the data before sending."
        : "Escreve os dados antes de enviar."
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var area = document.getElementById("secure-data");
      if (!area || !area.value.trim()) {
        status.textContent = t.empty;
        status.classList.add("form__status--error");
        if (area) area.focus();
        return;
      }

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
            status.textContent = t.ok;
            status.classList.remove("form__status--error");
            form.reset();
            if (ticketInput) ticketInput.value = formatTicket(ticketFromQuery()) || "(sem ticket)";
            if (tokenInput) tokenInput.value = pathToken() || queryParam("ref") || "(sem token)";
            if (subjectInput) {
              var tk = formatTicket(ticketFromQuery());
              subjectInput.value = tk
                ? "Secure data submission " + tk + " | 27n"
                : "Secure data submission | 27n";
            }
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

  /* ---- Staff: generate shareable link ---- */
  var genForm = document.getElementById("secure-link-form");
  if (genForm) {
    var out = document.getElementById("secure-link-out");
    var copyBtn = document.getElementById("secure-link-copy");
    var ticketField = document.getElementById("gen-ticket");

    function randomToken(len) {
      var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      var bytes = new Uint8Array(len || 28);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
      else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      var s = "";
      for (var j = 0; j < bytes.length; j++) s += alphabet[bytes[j] % alphabet.length];
      return s;
    }

    function buildUrl(ticket) {
      var lang = isEN ? "" : "/pt";
      var token = randomToken(28);
      var base = location.origin + lang + "/secure/submission/" + token + "/";
      var clean = String(ticket || "").replace(/^#/, "").trim();
      if (clean) base += "?ticket=" + encodeURIComponent(clean);
      return base;
    }

    genForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ticket = ticketField ? ticketField.value.trim() : "";
      if (!ticket) {
        if (ticketField) ticketField.focus();
        return;
      }
      var url = buildUrl(ticket);
      if (out) {
        out.value = url;
        out.hidden = false;
        out.select();
      }
      if (copyBtn) copyBtn.hidden = false;
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        if (!out || !out.value) return;
        var done = function () {
          copyBtn.textContent = isEN ? "Copied" : "Copiado";
          setTimeout(function () {
            copyBtn.textContent = isEN ? "Copy link" : "Copiar link";
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(out.value).then(done).catch(function () {
            out.select();
            try { document.execCommand("copy"); done(); } catch (err) {}
          });
        } else {
          out.select();
          try { document.execCommand("copy"); done(); } catch (err) {}
        }
      });
    }
  }
})();
