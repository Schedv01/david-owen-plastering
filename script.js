/* David Owen Plastering Services — interactions & motion (no dependencies) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("reveal-ready");

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header + FAB ---------- */
  var header = document.getElementById("siteHeader");
  var fab = document.querySelector(".fab");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (fab) fab.classList.toggle("show", y > 700);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("navMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // stagger siblings within the same section container
        var group = Array.prototype.slice.call(
          (el.closest("section, footer, .hero") || document).querySelectorAll("[data-reveal]")
        );
        var idx = Math.max(0, group.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 70, 350) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: reveal everything after 2.5s regardless
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    }, 2500);
  }

  /* ---------- Animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toLocaleString("en-GB") + suffix; return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-GB") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Gallery filter ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var galleryEl = document.getElementById("gallery");
  var galleryTiles = galleryEl
    ? Array.prototype.slice.call(galleryEl.querySelectorAll(".tile"))
    : [];
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) {
        c.classList.remove("is-active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      var f = chip.getAttribute("data-filter");
      galleryTiles.forEach(function (tile) {
        var show = f === "all" || tile.getAttribute("data-cat") === f;
        tile.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* every tile (featured project + gallery) opens the lightbox */
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCap = document.getElementById("lightboxCap");
  var lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
  var lastFocused = null;

  function openLightbox(tile) {
    var img = tile.querySelector("img");
    var cap = tile.querySelector(".tile-cap");
    lastFocused = tile;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCap.textContent = cap ? cap.textContent : "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  if (lightbox) {
    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () { openLightbox(tile); });
    });
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  /* ---------- Form validation ---------- */
  var form = document.querySelector(".quote-form");
  if (form) {
    var status = form.querySelector(".form-status");

    function setError(field, on) {
      var input = form.elements[field];
      var err = form.querySelector('[data-err-for="' + field + '"]');
      if (input) input.setAttribute("aria-invalid", on ? "true" : "false");
      if (err) err.hidden = !on;
      return !on;
    }

    function validate() {
      var ok = true;
      ok = setError("name", !form.elements.name.value.trim()) && ok;
      ok = setError("phone", !form.elements.phone.value.trim()) && ok;
      ok = setError("postcode", !form.elements.postcode.value.trim()) && ok;
      ok = setError("job", !form.elements.job.value) && ok;
      var email = form.elements.email.value.trim();
      ok = setError("email", !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.hidden = true;
      status.classList.remove("ok");

      if (!validate()) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      // Demo only — no backend wired up. Replace with a real handler / mail service.
      status.textContent =
        "Thanks — your enquiry has been noted. In the live site this sends to David directly. " +
        "For now, please call 01204 555 019.";
      status.classList.add("ok");
      status.hidden = false;
      form.reset();
      status.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });

    ["name", "phone", "postcode", "job", "email"].forEach(function (name) {
      var el = form.elements[name];
      if (el) el.addEventListener("blur", validate);
    });
  }

  /* ---------- Instant estimate tool ---------- */
  (function estimator() {
    var root = document.getElementById("estimator");
    if (!root) return;
    var eForm = document.getElementById("estForm");
    var steps = Array.prototype.slice.call(eForm.querySelectorAll(".est-step"));
    var bar = document.getElementById("estBar");
    var backBtn = document.getElementById("estBack");
    var nextBtn = document.getElementById("estNext");
    var result = document.getElementById("estResult");
    var order = [];
    var pos = 0;

    function money(n) { return "£" + Math.round(n).toLocaleString("en-GB"); }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
    function picked(name) {
      var r = eForm.querySelector('input[name="' + name + '"]:checked');
      return r ? r.value : null;
    }

    var jobLabels = {
      skimRoom: "Skim a room", artex: "Artex ceiling", mediawall: "Media wall",
      stairs: "Stairs, landing & hallway", house: "Whole house re-plaster",
      patch: "Patch / small repair", render: "External rendering"
    };
    var jobToQuote = {
      skimRoom: "Re-skim a room", artex: "Ceiling / Artex cover", mediawall: "Media wall",
      stairs: "Stairs, landing & hallway", house: "Full house re-plaster",
      patch: "Patch repairs / making good", render: "External rendering"
    };

    function applicable(step) {
      if (step.dataset.step === "0") return true;
      var j = picked("job");
      if (!j) return false;
      var only = step.getAttribute("data-only-for");
      var skip = step.getAttribute("data-skip-for");
      if (only) return only.split(" ").indexOf(j) > -1;
      if (skip) return skip.split(" ").indexOf(j) === -1;
      return true;
    }
    function rebuildOrder() { order = steps.filter(applicable); }

    function render() {
      rebuildOrder();
      if (pos > order.length - 1) pos = order.length - 1;
      steps.forEach(function (s) { s.classList.remove("is-active"); });
      var cur = order[pos];
      cur.classList.add("is-active");
      bar.style.width = ((pos + 1) / order.length) * 100 + "%";
      backBtn.hidden = pos === 0;
      nextBtn.textContent = (picked("job") && pos === order.length - 1) ? "See my estimate" : "Next";
      var f = cur.querySelector("input");
      if (f && !reduceMotion) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
    }

    function answered() { return !!order[pos].querySelector("input:checked"); }
    function nudge() {
      var box = order[pos].querySelector(".est-options");
      box.classList.remove("est-shake");
      void box.offsetWidth;
      box.classList.add("est-shake");
    }

    // Rates mirror the published Guide Prices. Keep the two in sync.
    function calc() {
      var j = picked("job");
      var lines = [], low = 0, high = 0;
      var szName = { small: "Small", medium: "Medium", large: "Large" };

      if (j === "skimRoom") {
        var sz = picked("size") || "medium";
        var skim = { small: 550, medium: 750, large: 950 }[sz];
        var base = skim;
        lines.push([szName[sz] + " room, skim finish", money(skim)]);

        var cond = picked("condition") || "sound";
        if (cond === "bonding") {
          var b = { small: 300, medium: 400, large: 550 }[sz];
          base += b;
          lines.push(["Bonding / backing coat first", "+ " + money(b)]);
        } else if (cond === "boarding") {
          var bd = { small: 450, medium: 600, large: 800 }[sz];
          base += bd;
          lines.push(["Plasterboarding first", "+ " + money(bd)]);
        }

        var op = parseInt(picked("openings") || "0", 10);
        if (op > 0) {
          var ex = op * 40;
          base += ex;
          lines.push([op + (op >= 3 ? "+" : "") + " window/door reveal" + (op > 1 ? "s" : ""), "+ " + money(ex)]);
        }
        low = base;
        high = base * 1.15;
      }
      else if (j === "artex") {
        var az = picked("size") || "medium";
        var ap = { small: 450, medium: 550, large: 650 }[az];
        lines.push([szName[az] + " Artex ceiling, skimmed smooth", money(ap)]);
        low = ap; high = ap * 1.12;
      }
      else if (j === "mediawall") {
        var mw = picked("mwType") || "standard";
        var R = { simple: [1000, 1800], standard: [1800, 3000], feature: [3000, 4200] }[mw];
        var mwName = { simple: "Simple", standard: "Standard", feature: "Feature" }[mw];
        lines.push([mwName + " media wall", money(R[0]) + "–" + money(R[1])]);
        low = R[0]; high = R[1];
      }
      else if (j === "stairs") {
        lines.push(["Stairs, landing & hallway, skimmed", money(1700)]);
        low = 1700; high = 1950;
      }
      else if (j === "house") {
        var beds = picked("beds") || "3";
        var hp = { "2": 4500, "3": 5500, "4": 7500 }[beds];
        lines.push([beds + "-bed house, re-plastered throughout", money(hp)]);
        low = hp; high = hp * 1.12;
      }
      else if (j === "patch") {
        lines.push(["Patch repairs & making good", "from " + money(250)]);
        low = 250; high = 450;
      }
      else if (j === "render") {
        var a = +picked("renderArea") || 25;
        lines.push(["External render, about " + a + " m²", money(a * 55) + "–" + money(a * 70)]);
        low = Math.max(a * 55, 450);
        high = Math.max(a * 70, 650);
      }

      low = Math.round(low / 10) * 10;
      high = Math.round(high / 10) * 10;
      return { low: low, high: high, lines: lines, job: j };
    }

    function finish() {
      var r = calc();
      document.getElementById("estLow").textContent = money(r.low);
      document.getElementById("estHigh").textContent = money(r.high);
      document.getElementById("estSummary").textContent =
        jobLabels[r.job] + " — typical Bolton guide price, materials and labour in.";
      var bd = document.getElementById("estBreakdown");
      bd.innerHTML = "";
      r.lines.forEach(function (l) {
        var li = document.createElement("li");
        var a = document.createElement("span"); a.textContent = l[0];
        var b = document.createElement("span"); b.textContent = l[1];
        li.appendChild(a); li.appendChild(b);
        bd.appendChild(li);
      });
      eForm.hidden = true;
      result.hidden = false;
      bar.style.width = "100%";
      result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    nextBtn.addEventListener("click", function () {
      if (!answered()) { nudge(); return; }
      rebuildOrder();
      if (pos < order.length - 1) { pos++; render(); }
      else finish();
    });
    backBtn.addEventListener("click", function () {
      if (pos > 0) { pos--; render(); }
    });
    eForm.addEventListener("change", function (e) {
      rebuildOrder();
      nextBtn.textContent = (picked("job") && pos === order.length - 1) ? "See my estimate" : "Next";
      // auto-advance a moment after picking an option (unless it's the last step)
      if (e.target.name && pos < order.length - 1 && order[pos].contains(e.target)) {
        var at = pos;
        setTimeout(function () { if (pos === at) { pos++; render(); } }, reduceMotion ? 0 : 260);
      }
    });

    document.getElementById("estRestart").addEventListener("click", function () {
      eForm.reset();
      eForm.hidden = false;
      result.hidden = true;
      pos = 0;
      render();
    });
    document.getElementById("estToQuote").addEventListener("click", function () {
      var r = calc();
      var sel = document.querySelector('.quote-form [name="job"]');
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text === jobToQuote[r.job]) { sel.selectedIndex = i; break; }
        }
      }
      var det = document.querySelector('.quote-form [name="details"]');
      if (det && !det.value) {
        det.value = "Via the estimate tool: " + jobLabels[r.job] +
          ", guide £" + r.low + "–£" + r.high + ".";
      }
    });

    render();
  })();
})();
