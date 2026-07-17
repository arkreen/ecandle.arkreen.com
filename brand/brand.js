/* brand kit — copy hex on swatch click */
(function () {
  "use strict";
  var swatches = Array.prototype.slice.call(document.querySelectorAll(".swatch"));
  swatches.forEach(function (sw) {
    sw.addEventListener("click", function () {
      var hex = sw.getAttribute("data-hex");
      function done() {
        sw.classList.add("copied");
        setTimeout(function () { sw.classList.remove("copied"); }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hex).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = hex;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  });
})();
