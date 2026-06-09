/* eCandle landing — interactions */
(function () {
  "use strict";

  /* ---- nav shadow on scroll ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- duplicate marquee for seamless loop ---- */
  var mq = document.getElementById("marquee");
  if (mq) { mq.innerHTML += mq.innerHTML; }

  /* ---- scroll reveal ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  // Hard fallback: guarantee visibility WITHOUT depending on the entrance
  // animation actually running (some contexts pause CSS animations).
  function forceShow(el) {
    el.classList.add("in");
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.animation = "none";
  }
  function forceShowAll() { reveals.forEach(forceShow); }

  if (reduce || !("IntersectionObserver" in window)) {
    forceShowAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    // Reveal anything already in the initial viewport on the next frame.
    requestAnimationFrame(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.96) el.classList.add("in");
      });
    });

    // Ultimate safety net: after a grace period, force EVERYTHING visible via
    // inline styles so content can never be permanently stranded.
    setTimeout(forceShowAll, 3000);
  }

  /* ---- animated counters ---- */
  function formatNum(n, prefix, suffix) {
    var s;
    if (n >= 1000) s = Math.round(n).toLocaleString("en-US");
    else s = Math.round(n).toString();
    return (prefix || "") + s + '<span class="suffix">' + (suffix || "") + "</span>";
  }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.innerHTML = formatNum(target, prefix, suffix); return; }
    var dur = 1500, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = formatNum(target * eased, prefix, suffix);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (!("IntersectionObserver" in window)) {
    counters.forEach(runCounter);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---- value loop: steps <-> nodes, with auto-advance ---- */
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var nodes = Array.prototype.slice.call(document.querySelectorAll(".loop-node"));
  var current = 0, autoTimer = null, userPaused = false;

  function setActive(i) {
    current = i;
    steps.forEach(function (s, idx) { s.classList.toggle("active", idx === i); });
    nodes.forEach(function (n, idx) { n.classList.toggle("active", idx === i); });
  }
  function advance() { setActive((current + 1) % steps.length); }
  function startAuto() {
    if (reduce) return;
    stopAuto();
    autoTimer = setInterval(function () { if (!userPaused) advance(); }, 3200);
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  function bind(el) {
    var i = parseInt(el.getAttribute("data-step"), 10);
    el.addEventListener("click", function () { setActive(i); });
    el.addEventListener("mouseenter", function () { userPaused = true; setActive(i); });
    el.addEventListener("mouseleave", function () { userPaused = false; });
  }
  steps.forEach(bind);
  nodes.forEach(bind);

  // run loop only while in view
  var loopSection = document.getElementById("how");
  if (loopSection && "IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) startAuto(); else stopAuto();
      });
    }, { threshold: 0.25 });
    lio.observe(loopSection);
  } else {
    startAuto();
  }
  setActive(0);

  /* ---- smooth-scroll active nav link ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  var sections = navLinks.map(function (a) {
    var id = a.getAttribute("href").slice(1);
    return id ? document.getElementById(id) : null;
  });
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a, idx) {
          a.style.color = sections[idx] === e.target ? "var(--paper)" : "";
        });
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { if (s) sio.observe(s); });
  }
})();
