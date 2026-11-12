/* eCandle — homepage enquiry form (POST /api/contact) */
(function () {
  "use strict";

  var form = document.getElementById("cf-form");
  if (!form) return;
  var errEl = document.getElementById("cf-error");
  var submit = document.getElementById("cf-submit");
  var success = document.getElementById("cf-success");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var source = "home";

  function group(name) { return form.querySelector('.cf-pills[data-name="' + name + '"]'); }
  function pills(name) { return Array.prototype.slice.call(group(name).querySelectorAll(".cf-pill")); }
  function picked(name) {
    return pills(name).filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })
      .map(function (b) { return b.textContent.trim(); });
  }
  function setPill(btn, on) { btn.setAttribute("aria-pressed", on ? "true" : "false"); }

  /* ---- pills: single-choice groups behave like radios, the rest toggle.
     State lives in the DOM, so rapid clicks can't lose a selection. ---- */
  Array.prototype.slice.call(form.querySelectorAll(".cf-pills")).forEach(function (g) {
    var single = g.hasAttribute("data-single");
    g.addEventListener("click", function (e) {
      var btn = e.target.closest(".cf-pill");
      if (!btn) return;
      if (single) {
        Array.prototype.forEach.call(g.querySelectorAll(".cf-pill"), function (b) { setPill(b, b === btn); });
      } else {
        setPill(btn, btn.getAttribute("aria-pressed") !== "true");
      }
      hideError();
    });
  });

  /* ---- preset the role (and the matching interest) from a CTA or ?role= ---- */
  var INTEREST_FOR = { investor: "funding", operator: "fleet", distributor: "kits", developer: "dev", hub: "pilot", ngo: "pilot" };
  function preset(role, from) {
    var btn = group("role").querySelector('.cf-pill[data-key="' + role + '"]');
    if (!btn) return;
    pills("role").forEach(function (b) { setPill(b, b === btn); });
    var key = INTEREST_FOR[role];
    if (key) pills("interests").forEach(function (b) { setPill(b, b.getAttribute("data-key") === key); });
    source = from;
  }
  Array.prototype.slice.call(document.querySelectorAll('a[href$="#contact"][data-role]')).forEach(function (a) {
    a.addEventListener("click", function () { preset(a.getAttribute("data-role"), "home · " + a.getAttribute("data-role") + " button"); });
  });
  try {
    var q = new URLSearchParams(window.location.search).get("role");
    if (q) preset(q, (document.referrer.indexOf("/lite-paper") > -1 ? "lite paper" : "link") + " · " + q);
  } catch (e) { /* old browser: no preset */ }

  /* ---- validation: top to bottom, one message at a time ---- */
  function val(name) { return (form.elements[name].value || "").trim(); }
  function showError(msg, focusEl) {
    errEl.textContent = msg;
    errEl.hidden = false;
    if (focusEl && focusEl.focus) focusEl.focus({ preventScroll: false });
  }
  function hideError() { errEl.hidden = true; }
  form.addEventListener("input", hideError);

  function validate() {
    if (!picked("role").length) return showError("Please tell us who you are.", group("role").querySelector(".cf-pill")), false;
    if (!picked("interests").length) return showError("Please choose at least one thing you’re interested in.", group("interests").querySelector(".cf-pill")), false;
    if (!val("market")) return showError("Please add your market or region.", form.elements.market), false;
    if (!val("name")) return showError("Please add your name.", form.elements.name), false;
    if (!val("company")) return showError("Please add your company or organisation.", form.elements.company), false;
    if (!val("email")) return showError("Please add your work email.", form.elements.email), false;
    if (!EMAIL_RE.test(val("email"))) return showError("That email address doesn’t look right.", form.elements.email), false;
    return true;
  }

  /* ---- submit ---- */
  var label = submit.innerHTML;
  function busy(on) {
    submit.disabled = on;
    submit.innerHTML = on ? "Sending…" : label;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();
    if (!validate()) return;
    var body = {
      lang: "en",
      role: picked("role")[0],
      interests: picked("interests"),
      market: val("market"),
      scale: val("scale"),
      goals: picked("goals"),
      operations: val("operations"),
      timeline: val("timeline"),
      notes: val("notes"),
      name: val("name"),
      company: val("company"),
      title: val("title"),
      email: val("email"),
      phone: val("phone"),
      source: source,
      hp: form.elements.ec_hp_note.value
    };
    busy(true);
    fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) {
        if (res.ok) {
          document.getElementById("cf-success-email").textContent = body.email;
          form.hidden = true;
          success.hidden = false;
          success.focus();
          return;
        }
        busy(false);
        if (res.status === 429) showError("Too many attempts. Please wait a minute and try again.");
        else if (res.status === 422) showError("Some required details are missing or invalid. Please check the form and try again.");
        else showError("Something went wrong on our side. Please try again, or email ecandle@arkreen.com.");
      })
      .catch(function () {
        busy(false);
        showError("We couldn’t send your enquiry. Check your connection and try again, or email ecandle@arkreen.com.");
      });
  });
})();
