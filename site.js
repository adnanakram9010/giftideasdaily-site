/* Gift Ideas Daily — shared site JS (vanilla, no dependencies) */
(function () {
  "use strict";

  /* ---------- Category page filters ---------- */
  var grid = document.getElementById("gift-grid");
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".gift-card"));
    var priceBtns = Array.prototype.slice.call(document.querySelectorAll(".pbtn"));
    var typeChips = Array.prototype.slice.call(document.querySelectorAll(".tchip"));
    var countEl = document.getElementById("result-count");
    var noResults = document.getElementById("no-results");
    var activePrice = "all";
    var activeTypes = [];

    function applyFilters() {
      var shown = 0;
      cards.forEach(function (card) {
        var priceOk = activePrice === "all" || card.getAttribute("data-price-bucket") === activePrice;
        var cardTypes = (card.getAttribute("data-types") || "").split(",").filter(Boolean);
        var typesOk = activeTypes.length === 0 ||
          activeTypes.every(function (t) { return cardTypes.indexOf(t) !== -1; });
        var show = priceOk && typesOk;
        card.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " gift" : " gifts");
      if (noResults) noResults.classList.toggle("show", shown === 0);
    }

    priceBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        priceBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        activePrice = btn.getAttribute("data-price");
        applyFilters();
      });
    });

    typeChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var t = chip.getAttribute("data-type");
        var on = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        if (on) {
          activeTypes = activeTypes.filter(function (x) { return x !== t; });
        } else {
          activeTypes.push(t);
        }
        applyFilters();
      });
    });

    var clearBtn = document.getElementById("clear-filters");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        activePrice = "all";
        activeTypes = [];
        priceBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-price") === "all" ? "true" : "false"); });
        typeChips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        applyFilters();
      });
    }

    applyFilters();
  }

  /* ---------- Placeholder forms (newsletter / contact) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-placeholder-form]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.parentElement.querySelector(".form-success");
      if (ok) {
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
