/* eCandle Africa Field Partners — film, funnel events and the pilot proposal form */
(function () {
  "use strict";

  var PAGE_URL = "https://ecandle.arkreen.com/field-partners/";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  var session = store("sessionStorage");
  function sget(k) { try { return session && session.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { session && session.setItem(k, v); } catch (e) { /* private mode */ } }
  function sdel(k) { try { session && session.removeItem(k); } catch (e) { /* private mode */ } }

  /* ---- channel: ?src= (or utm_source) from X, LinkedIn, WhatsApp, the invitation… ---- */
  var source = "direct";
  try {
    var q = new URLSearchParams(window.location.search);
    var s = (q.get("src") || q.get("utm_source") || "").toLowerCase();
    if (/^[a-z0-9_-]{1,30}$/.test(s)) sset("fp-src", s);
  } catch (e) { /* old browser */ }
  source = sget("fp-src") || "direct";

  function track(event) {
    try {
      fetch("/api/fp-event", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ event: event, source: source }) })
        .catch(function () {});
    } catch (e) { /* never block the page on analytics */ }
  }
  track("view");

  /* ---- field film: loads only when played ---- */
  var film = document.getElementById("fp-video");
  var filmBtn = document.getElementById("fp-play");
  if (film && filmBtn) {
    filmBtn.addEventListener("click", function () {
      film.parentNode.classList.add("playing");
      film.controls = true;
      var p = film.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  var form = document.getElementById("fp-form");
  if (!form) return;
  var el = function (id) { return document.getElementById(id); };
  var f = form.elements;

  /* ---- first interaction counts as "started" ---- */
  var started = false;
  form.addEventListener("focusin", function () { if (!started) { started = true; track("start"); } });

  /* ---- WhatsApp country codes, built from the country list ---- */
  var dial = el("fp-dial");
  var codes = {};
  Array.prototype.forEach.call(f.country.options, function (o) {
    var d = o.getAttribute("data-dial");
    if (!d) return;
    codes[o.value] = d;
    var opt = document.createElement("option");
    opt.value = "+" + d;
    opt.textContent = "+" + d + " " + o.value; // code first, so a narrow select still shows it
    dial.appendChild(opt);
  });
  var dialTouched = false;
  dial.addEventListener("change", function () { dialTouched = true; });
  function syncDial() { if (!dialTouched && codes[f.country.value]) dial.value = "+" + codes[f.country.value]; }
  f.country.addEventListener("change", syncDial);

  /* ---- contact method: email or WhatsApp ---- */
  function method() { return form.querySelector('input[name="contactMethod"]:checked').value; }
  function showMethod() {
    var wa = method() === "whatsapp";
    el("fp-reach-email").hidden = wa;
    el("fp-reach-wa").hidden = !wa;
    if (wa) syncDial();
  }
  Array.prototype.forEach.call(form.querySelectorAll('input[name="contactMethod"]'), function (r) {
    r.addEventListener("change", function () { showMethod(); clearErr("email"); clearErr("wa"); });
  });

  /* ---- keep a draft for this tab, so a dropped connection or reload loses nothing ---- */
  var FIELDS = ["country", "city", "siteKind", "usersPower", "firstTest", "leadName", "organisation", "email", "dial", "whatsapp"];
  function saveDraft() {
    var d = { contactMethod: method() };
    FIELDS.forEach(function (k) { d[k] = f[k].value; });
    sset("fp-draft", JSON.stringify(d));
  }
  try {
    var draft = JSON.parse(sget("fp-draft") || "null");
    if (draft) {
      FIELDS.forEach(function (k) { if (draft[k]) f[k].value = draft[k]; });
      if (draft.dial) dialTouched = true;
      var r = form.querySelector('input[name="contactMethod"][value="' + draft.contactMethod + '"]');
      if (r) r.checked = true;
    }
  } catch (e) { /* ignore a bad draft */ }
  showMethod();
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  /* ---- inline errors, shown next to the field they belong to ---- */
  var ERR = { country: "fp-country", city: "fp-city", siteKind: "fp-site", usersPower: "fp-users", firstTest: "fp-test", leadName: "fp-lead", email: "fp-email", wa: "fp-wa" };
  function setErr(key, msg) {
    var input = el(ERR[key]); var e = el(ERR[key] + "-err");
    input.setAttribute("aria-invalid", "true");
    e.textContent = msg; e.hidden = false;
  }
  function clearErr(key) {
    var input = el(ERR[key]); var e = el(ERR[key] + "-err");
    input.removeAttribute("aria-invalid");
    e.hidden = true;
  }
  Object.keys(ERR).forEach(function (k) {
    el(ERR[k]).addEventListener("input", function () { clearErr(k); });
    el(ERR[k]).addEventListener("change", function () { clearErr(k); });
  });

  function v(name) { return (f[name].value || "").trim(); }
  function waNumber() {
    var digits = v("whatsapp").replace(/[^\d]/g, "").replace(/^0+/, "");
    return digits ? dial.value + " " + digits : "";
  }
  function validate() {
    var bad = [];
    function need(key, ok, msg) { if (ok) clearErr(key); else { setErr(key, msg); bad.push(key); } }
    need("country", !!v("country"), "Choose your country.");
    need("city", !!v("city"), "Add your town or city.");
    need("siteKind", !!v("siteKind"), "Tell us what kind of site you run.");
    need("usersPower", !!v("usersPower"), "Tell us who would use it and how they get power today.");
    need("firstTest", !!v("firstTest"), "Tell us what you would test first.");
    need("leadName", !!v("leadName"), "Add the name of the person who would run the pilot.");
    if (method() === "email") {
      need("email", EMAIL_RE.test(v("email")), v("email") ? "That email address doesn’t look right." : "Add an email address.");
    } else {
      // same rule as the server: country code + number = 8–15 digits (E.164)
      var local = v("whatsapp").replace(/\D/g, "").replace(/^0+/, "");
      var total = (dial.value + local).replace(/\D/g, "").length;
      need("wa", !!local && total >= 8 && total <= 15, local ? "Check the number. Use digits only, after the country code." : "Add a WhatsApp number.");
    }
    if (bad.length) el(ERR[bad[0]]).focus();
    return !bad.length;
  }

  /* ---- answers as text, for the email fallback ---- */
  function answers() {
    return [
      "eCandle pilot proposal",
      "",
      "Country: " + v("country"),
      "Town or city: " + v("city"),
      "Site: " + v("siteKind"),
      "Who would use it, and how they get power today: " + v("usersPower"),
      "What we would test first, and how we would know it helped: " + v("firstTest"),
      "Who would run the pilot: " + v("leadName") + (v("organisation") ? " (" + v("organisation") + ")" : ""),
      "Contact: " + (method() === "whatsapp" ? "WhatsApp " + waNumber() : v("email"))
    ].join("\n");
  }
  el("fp-copy").addEventListener("click", function () {
    var text = "To: ecandle@arkreen.com\n\n" + answers();
    var done = function () { el("fp-copy").textContent = "Copied"; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else {
      var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* nothing more to try */ }
      t.remove();
    }
  });

  /* ---- submit: one id per proposal, reused on retry, so it is stored once ---- */
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "fp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }
  var submissionId = sget("fp-submission") || "";
  var btn = el("fp-submit");
  var sending = false;

  function fail(kind) {
    sending = false;
    btn.disabled = false;
    btn.textContent = "Try again";
    if (kind === "rate") {
      el("fp-status").textContent = "Too many attempts. Please wait a minute and try again.";
      el("fp-status").hidden = false;
      return;
    }
    el("fp-mailto").href = "mailto:ecandle@arkreen.com?subject=" + encodeURIComponent("eCandle pilot proposal") + "&body=" + encodeURIComponent(answers());
    el("fp-fail").hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    el("fp-fail").hidden = true;
    el("fp-status").hidden = true;
    if (!validate()) return;
    if (!submissionId) { submissionId = newId(); sset("fp-submission", submissionId); }
    var body = {
      submissionId: submissionId,
      country: v("country"), city: v("city"), siteKind: v("siteKind"),
      usersPower: v("usersPower"), firstTest: v("firstTest"),
      leadName: v("leadName"), organisation: v("organisation"),
      contactMethod: method(),
      email: method() === "email" ? v("email") : "",
      whatsapp: method() === "whatsapp" ? waNumber() : "",
      source: source,
      hp: f.ec_hp_note.value
    };
    sending = true;
    btn.disabled = true;
    btn.textContent = "Sending…";
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch("/api/field-partner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        clearTimeout(timer);
        if (res.status === 429) return fail("rate");
        if (res.status === 422) {
          // the server disagreed with our checks: show them again rather than a generic failure
          sending = false; btn.disabled = false; btn.textContent = "Send my proposal";
          if (validate()) fail();
          return;
        }
        if (!res.ok) return fail();
        return res.json().then(function (data) {
          sdel("fp-draft"); sdel("fp-submission");
          if (data && data.ref) { el("fp-ref").textContent = "Reference " + data.ref; el("fp-ref").hidden = false; }
          form.hidden = true;
          el("fp-done").hidden = false;
          el("fp-done").focus();
        });
      })
      .catch(function () { clearTimeout(timer); fail(); });
  });

  /* ---- after submitting: invite (never require) sharing the same page ---- */
  el("fp-share").addEventListener("click", function () {
    var data = { title: "Host an eCandle pilot in your community", text: "Selected teams across Africa can test one or two portable solar batteries for eight weeks.", url: PAGE_URL };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var note = el("fp-share-note");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PAGE_URL).then(function () { note.hidden = false; }, function () {});
  });
})();
