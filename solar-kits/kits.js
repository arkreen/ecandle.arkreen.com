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
      successEl.hidden = true;
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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var d = new FormData(form);
    var lines = [
      "Solar Kit order request",
      "",
      "Selected kit: " + d.get("kit"),
      "Full name: " + d.get("name"),
      "Country: " + d.get("country"),
      "State / city: " + d.get("city"),
      "WhatsApp / phone: " + d.get("phone"),
      "Email: " + (d.get("email") || "-"),
      "Purchase preference: " + d.get("preference"),
      "Need delivery: " + d.get("delivery"),
      "Need installation: " + d.get("installation"),
      "Notes: " + (d.get("notes") || "-")
    ];
    var subject = "eCandle Solar Kit order request — " + d.get("kit");
    window.location.href = "mailto:" + ORDER_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
    successEl.hidden = false;
  });
})();
