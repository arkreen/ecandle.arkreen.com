/* eCandle lite paper — contents highlight, reading progress, save as PDF */
(function () {
  "use strict";

  /* ---- reading progress ---- */
  var bar = document.getElementById("lp-progress");
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---- contents rail: highlight the section being read ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".lp-toc a"));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  // the top nav too: sections here are taller than the screen, so ../app.js's
  // 40%-visible rule never fires; drive it from the same reading line instead
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  function spy() {
    var line = window.innerHeight * 0.3, current = 0;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) current = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = secs.length - 1;
    links.forEach(function (a, i) { a.classList.toggle("active", i === current); });
    var id = secs[current] && secs[current].id;
    navLinks.forEach(function (a) { a.style.color = a.getAttribute("href") === "#" + id ? "var(--ink)" : ""; });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ---- save as PDF ---- */
  var print = document.getElementById("lp-print");
  if (print) print.addEventListener("click", function () { window.print(); });
})();
