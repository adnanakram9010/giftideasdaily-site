/* Gift Ideas Daily — Gift Finder Quiz (vanilla JS).
   Expects window.QUIZ_DATA = { siteUrl, gifts: [...], events: {...}, persons: {...}, types: {...} }
   injected by build.py into quiz-data.js. */
(function () {
  "use strict";

  var mount = document.getElementById("quiz-mount");
  if (!mount || !window.QUIZ_DATA) return;
  var DATA = window.QUIZ_DATA;

  var ICONS = {
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8s-1.5-5-4.5-5S5 8 12 8zm0 0s1.5-5 4.5-5S19 8 12 8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 4h2l2.4 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.5 8H6"/></svg>'
  };

  var state = { step: 0, occasion: null, person: null, budget: null, vibes: [] };

  var STEPS = [
    {
      key: "occasion", title: "What's the occasion?", sub: "Pick the celebration you're shopping for.",
      multi: false, cols2: true,
      options: Object.keys(DATA.events).map(function (slug) {
        return { value: slug, label: DATA.events[slug] };
      }).concat([{ value: "any", label: "Just because" }])
    },
    {
      key: "person", title: "Who is the gift for?", sub: "We'll tailor picks to them.",
      multi: false, cols2: true,
      options: Object.keys(DATA.persons).map(function (slug) {
        return { value: slug, label: DATA.persons[slug] };
      })
    },
    {
      key: "budget", title: "What's your budget?", sub: "We'll only show gifts in your range.",
      multi: false, cols2: false,
      options: [
        { value: "under25", label: "Under $25" },
        { value: "25-50", label: "$25 – $50" },
        { value: "50-100", label: "$50 – $100" },
        { value: "100plus", label: "$100+" }
      ]
    },
    {
      key: "vibes", title: "Pick the vibe", sub: "Choose as many as you like, then see your matches.",
      multi: true, cols2: true,
      options: Object.keys(DATA.types).map(function (slug) {
        return { value: slug, label: DATA.types[slug] };
      })
    }
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function render() {
    var step = STEPS[state.step];
    var pct = Math.round((state.step / STEPS.length) * 100);
    var sel = step.multi ? state[step.key] : [state[step.key]];
    var html = '<div class="quiz-progress"><i style="width:' + pct + '%"></i></div>';
    html += '<div class="quiz-step"><h2>' + esc(step.title) + '</h2>';
    html += '<p class="q-sub">' + esc(step.sub) + '</p>';
    html += '<div class="q-options' + (step.cols2 ? " cols2" : "") + '">';
    step.options.forEach(function (opt) {
      var isSel = sel.indexOf(opt.value) !== -1;
      html += '<button type="button" class="q-opt' + (isSel ? " selected" : "") + '" data-value="' + esc(opt.value) + '">' +
        ICONS.gift + '<span>' + esc(opt.label) + '</span><span class="check"></span></button>';
    });
    html += "</div>";
    html += '<div class="quiz-nav"><button type="button" class="quiz-back" id="quiz-back"' +
      (state.step === 0 ? ' style="visibility:hidden"' : "") + '>&larr; Back</button>';
    if (step.multi) {
      html += '<button type="button" class="btn" id="quiz-next">See my matches ' + ICONS.spark + "</button>";
    }
    html += "</div></div>";
    mount.innerHTML = html;

    Array.prototype.forEach.call(mount.querySelectorAll(".q-opt"), function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-value");
        if (step.multi) {
          var arr = state[step.key];
          var i = arr.indexOf(v);
          if (i === -1) arr.push(v); else arr.splice(i, 1);
          render();
        } else {
          state[step.key] = v;
          state.step++;
          if (state.step >= STEPS.length) showResults();
          else render();
        }
      });
    });

    var back = document.getElementById("quiz-back");
    if (back) back.addEventListener("click", function () {
      if (state.step > 0) { state.step--; render(); }
    });
    var next = document.getElementById("quiz-next");
    if (next) next.addEventListener("click", showResults);
  }

  function scoreGift(g) {
    var score = 0, why = [];
    if (g.persons.indexOf(state.person) !== -1) { score += 3; why.push("great for " + DATA.persons[state.person].toLowerCase()); }
    if (state.occasion !== "any" && g.events.indexOf(state.occasion) !== -1) { score += 3; why.push("perfect for " + DATA.events[state.occasion].toLowerCase()); }
    if (g.priceBucket === state.budget) { score += 2; why.push("in your budget"); }
    state.vibes.forEach(function (v) {
      if (g.types.indexOf(v) !== -1) { score += 1.5; why.push(DATA.types[v].toLowerCase() + " style"); }
    });
    return { score: score, why: why };
  }

  function cardHtml(g, why) {
    var tags = g.types.map(function (t) { return '<span class="tag">' + esc(DATA.types[t]) + "</span>"; }).join("");
    var media = g.image
      ? '<img src="/assets/products/' + esc(g.image) + '" alt="' + esc(g.name) + '" loading="lazy" width="800" height="600">'
      : ICONS.gift;
    return '<article class="gift-card">' +
      '<div class="gift-media">' + media + "</div>" +
      '<div class="gift-body"><h3>' + esc(g.name) + "</h3>" +
      '<p class="gift-price">$' + g.price.toFixed(2) + "</p>" +
      '<p class="gift-desc">' + esc(g.description) + "</p>" +
      (why ? '<p class="match-why">' + ICONS.check.replace("<svg", '<svg style="width:14px;height:14px;display:inline;vertical-align:-2px"') + " " + esc(why) + "</p>" : "") +
      (tags ? '<div class="gift-tags">' + tags + "</div>" : "") +
      '<div class="gift-actions">' +
      '<a class="btn-buy" href="' + esc(g.buyUrl) + '" target="_blank" rel="sponsored nofollow noopener">' + ICONS.cart + '<span>' + esc(g.buyLabel) + '</span></a>' +
      '<a class="btn-pin" href="' + esc(g.pin) + '" target="_blank" rel="noopener" title="Pin it on Pinterest" aria-label="Pin it on Pinterest">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.5-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.3-4.4-4.3a4.6 4.6 0 0 0-4.8 4.6c0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.4.1-1.2-.6-2-2.4-2-3.9 0-3.2 2.3-6.1 6.7-6.1 3.5 0 6.2 2.5 6.2 5.8 0 3.5-2.2 6.3-5.3 6.3-1 0-2-.5-2.3-1.2l-.6 2.4c-.2.9-.8 2-1.2 2.6A10 10 0 1 0 12 2z"/></svg>' +
      "</a></div>" +
      '<p class="aff-note">' + esc(g.affNote) + '</p>' +
      "</div></article>";
  }

  function showResults() {
    var scored = DATA.gifts.map(function (g) {
      var s = scoreGift(g);
      return { g: g, score: s.score, why: s.why };
    }).filter(function (x) { return x.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, 6);

    var html = '<div class="quiz-results-head"><h2>Your gift matches</h2>' +
      '<p class="section-sub">Hand-picked from our collection for ' +
      esc(DATA.persons[state.person].toLowerCase()) +
      (state.occasion !== "any" ? " for " + esc(DATA.events[state.occasion].toLowerCase()) : "") + ".</p>" +
      '<button type="button" class="btn btn-outline" id="quiz-restart">Retake quiz</button></div>';

    if (top.length === 0) {
      html += '<p style="text-align:center">No strong matches this time — try broadening your vibe picks.</p>';
    } else {
      html += '<div class="gift-grid">';
      top.forEach(function (x) {
        html += cardHtml(x.g, "Matched: " + x.why.slice(0, 3).join(" · "));
      });
      html += "</div>";
    }
    mount.innerHTML = html;
    mount.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("quiz-restart").addEventListener("click", function () {
      state = { step: 0, occasion: null, person: null, budget: null, vibes: [] };
      render();
    });
  }

  render();
})();
