/* eCandle Solar Kits — page interactions */
(function () {
  "use strict";

  /* Configurable order destination — swap for a checkout URL or API endpoint
     when commerce goes live. Mode B (partner-assisted) composes an email. */
  var ORDER_EMAIL = "ecandle@arkreen.com";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav shadow on scroll ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- scroll reveal (same contract as ../app.js) ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function forceShow(el) {
    el.classList.add("in");
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.animation = "none";
  }
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(forceShow);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.96) el.classList.add("in");
      });
    });
    setTimeout(function () { reveals.forEach(forceShow); }, 3000);
  }

  /* ---- film: click-to-play with sound (same contract as ../app.js) ---- */
  var film = document.getElementById("film-video");
  var filmPlay = document.getElementById("film-play");
  if (film && filmPlay) {
    filmPlay.addEventListener("click", function () {
      film.parentNode.classList.add("playing");
      film.controls = true;
      var p = film.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  /* ---- mobile sticky bar: show after the hero, hide near final CTA ---- */
  var stickyBar = document.getElementById("stickyBar");
  var hero = document.querySelector(".kits-hero");
  var finalCta = document.querySelector(".cta-final");
  function updateSticky() {
    var past = hero ? window.scrollY > hero.offsetTop + hero.offsetHeight * 0.7 : true;
    var nearEnd = false;
    if (finalCta) {
      var r = finalCta.getBoundingClientRect();
      nearEnd = r.top < (window.innerHeight || 0);
    }
    var show = past && !nearEnd;
    stickyBar.classList.toggle("show", show);
    stickyBar.setAttribute("aria-hidden", show ? "false" : "true");
  }
  window.addEventListener("scroll", updateSticky, { passive: true });
  window.addEventListener("resize", updateSticky);
  updateSticky();

  /* ---- order dialog (Mode B — partner-assisted) ---- */
  var dialog = document.getElementById("orderDialog");
  var form = document.getElementById("orderForm");
  var kitSelect = document.getElementById("orderKit");
  var successEl = document.getElementById("orderSuccess");

  Array.prototype.slice.call(document.querySelectorAll("[data-order]")).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var kit = btn.getAttribute("data-order");
      kitSelect.value = kit === "500W" ? "500W Solar Kit · $499" : "300W Solar Kit · $399";
      // a finished request: start the next one from a clean form
      if (form.classList.contains("done")) { form.reset(); form.classList.remove("done"); }
      successEl.hidden = true;
      document.getElementById("orderError").hidden = true;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  });

  document.getElementById("orderClose").addEventListener("click", function () {
    dialog.close ? dialog.close() : dialog.removeAttribute("open");
  });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close && dialog.close();
  });

  var errorEl = document.getElementById("orderError");
  var submitBtn = document.getElementById("orderSubmit");
  function orderError(msg) { errorEl.textContent = msg; errorEl.hidden = !msg; }
  form.addEventListener("input", function () { orderError(""); });

  // Sent to /api/order: stored in the database and emailed to the eCandle team.
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    orderError("");
    if (!form.reportValidity()) return;
    var d = new FormData(form);
    var get = function (k) { return String(d.get(k) || "").trim(); };
    var body = {
      kit: get("kit"), name: get("name"), country: get("country"), city: get("city"),
      phone: get("phone"), email: get("email"), preference: get("preference"),
      delivery: get("delivery"), installation: get("installation"), notes: get("notes"),
      hp: get("ec_hp_note")
    };
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    fetch("/api/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request order";
        if (res.ok) {
          form.classList.add("done");
          successEl.hidden = false;
          return;
        }
        if (res.status === 429) orderError("Too many attempts. Please wait a minute and try again.");
        else if (res.status === 422) orderError("Some details are missing or invalid. Please check the form and try again.");
        else orderError("Something went wrong on our side. Please try again, or email " + ORDER_EMAIL + ".");
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request order";
        orderError("We couldn’t send your request. Check your connection and try again, or email " + ORDER_EMAIL + ".");
      });
  });
})();
