/* Interactive demo behaviour. Vanilla JS, no build step, no network calls.
   Data comes from window.DEMO_DATA (data.js). */

(function () {
  "use strict";

  var D = window.DEMO_DATA;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* =========================================================
     1. Reveal on scroll
     ========================================================= */
  $$$reveal();
  function $$$reveal() {
    var targets = $$(".section-head, .split, .rail, .stage-detail, .tabs, .track-panel, .lab, .dedup, .mini-table, .outreach, .gate-lab, .synthetic-banner, .table-tools, .table-wrap, .metrics");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("reveal", "in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach(function (t) { t.classList.add("reveal"); io.observe(t); });
  }

  /* =========================================================
     2. Static text slots
     ========================================================= */
  var banner = $("#syntheticBanner");
  if (banner) banner.textContent = D.meta.syntheticNotice;
  var notice = $("#footerNotice");
  if (notice) notice.textContent = "Synthetic data only.";

  /* =========================================================
     3. Metrics
     ========================================================= */
  var metricsEl = $("#metrics");
  if (metricsEl) {
    metricsEl.innerHTML = D.metrics.map(function (m) {
      return '<div class="metric">' +
        '<span class="metric-value">' + esc(m.value) + '</span>' +
        '<span class="metric-label">' + esc(m.label) + '</span>' +
        '<span class="metric-note">' + esc(m.note) + '</span>' +
        '</div>';
    }).join("");
  }

  /* =========================================================
     4. Pipeline rail + detail
     ========================================================= */
  var rail = $("#rail");
  var stageDetail = $("#stageDetail");
  var activeStage = 0;

  var MODE_LABEL = { online: "online", offline: "offline", gated: "gated", human: "human" };

  function renderRail() {
    rail.innerHTML = D.stages.map(function (s, i) {
      return '<button type="button" role="tab" id="stage-tab-' + i + '"' +
        ' aria-selected="' + (i === activeStage) + '"' +
        ' aria-controls="stageDetail" tabindex="' + (i === activeStage ? 0 : -1) + '"' +
        ' class="rail-node' + (i === activeStage ? " is-active" : "") + '" data-i="' + i + '">' +
        '<span class="rail-num">' + s.n + '</span>' +
        '<span class="rail-name">' + esc(s.name) + '</span>' +
        '<span class="rail-dot ' + s.mode + '" aria-hidden="true"></span>' +
        '</button>';
    }).join("");
  }

  function renderStage(i) {
    var s = D.stages[i];
    var prev = D.stages[i - 1];
    var next = D.stages[i + 1];
    stageDetail.innerHTML =
      '<div>' +
        '<div class="stage-top">' +
          '<span class="badge badge-' + s.mode + '">' + MODE_LABEL[s.mode] + '</span>' +
          '<span class="stage-where mono">' + esc(s.where) + '</span>' +
        '</div>' +
        '<h3 class="stage-title">' + esc(s.name) + '</h3>' +
        '<p class="stage-blurb">' + esc(s.detail) + '</p>' +
        '<ul class="stage-points">' + s.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + '</ul>' +
      '</div>' +
      '<div class="stage-artifact">' +
        '<p class="stage-artifact-label">Hands on</p>' +
        '<p class="stage-artifact-value">' + esc(s.artifact) + '</p>' +
        '<div class="flow-chips">' +
          (prev ? '<span class="chip-mini">' + esc(prev.name) + '</span><span class="chip-mini">&rarr;</span>' : '<span class="chip-mini">start</span><span class="chip-mini">&rarr;</span>') +
          '<span class="chip-mini hot">' + esc(s.name) + '</span>' +
          (next ? '<span class="chip-mini">&rarr;</span><span class="chip-mini">' + esc(next.name) + '</span>' : '') +
        '</div>' +
      '</div>';
  }

  function selectStage(i, focus) {
    activeStage = i;
    $$(".rail-node", rail).forEach(function (n, k) {
      var on = k === i;
      n.classList.toggle("is-active", on);
      n.setAttribute("aria-selected", String(on));
      n.tabIndex = on ? 0 : -1;
    });
    renderStage(i);
    if (focus) {
      var node = $('#stage-tab-' + i);
      if (node) node.focus();
    }
  }

  if (rail && stageDetail) {
    renderRail();
    renderStage(activeStage);
    rail.addEventListener("click", function (e) {
      var btn = e.target.closest(".rail-node");
      if (!btn) return;
      selectStage(Number(btn.dataset.i), false);
    });
    rail.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      var n = D.stages.length;
      var i = activeStage;
      if (e.key === "ArrowRight") i = (i + 1) % n;
      if (e.key === "ArrowLeft") i = (i - 1 + n) % n;
      if (e.key === "Home") i = 0;
      if (e.key === "End") i = n - 1;
      selectStage(i, true);
    });
  }

  /* =========================================================
     5. Track tabs
     ========================================================= */
  var trackTabs = $("#trackTabs");
  var trackPanel = $("#trackPanel");
  var activeTrack = 0;

  function renderTracks() {
    trackTabs.innerHTML = D.tracks.map(function (t, i) {
      return '<button type="button" role="tab" class="tab' + (i === activeTrack ? " is-active" : "") + '"' +
        ' aria-selected="' + (i === activeTrack) + '" data-i="' + i + '">' + esc(t.name) + '</button>';
    }).join("");
  }

  function renderTrack(i) {
    var t = D.tracks[i];
    trackPanel.innerHTML =
      '<h3 class="track-goal">' + esc(t.goal) + '</h3>' +
      '<p class="track-intent">' + esc(t.intent) + '</p>' +
      '<div class="flow">' + t.steps.map(function (s) {
        return '<div class="flow-step ' + s.actor + '">' +
          '<span class="flow-actor">' + s.actor + '</span>' +
          '<span><span class="flow-label">' + esc(s.label) + '</span><br><span class="flow-note">' + esc(s.note) + '</span></span>' +
          '</div>';
      }).join("") + '</div>' +
      '<div class="constraint-block">' +
        '<p class="constraint-title">Hard constraints</p>' +
        '<ul class="constraint-list">' + t.constraints.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + '</ul>' +
      '</div>';
  }

  if (trackTabs && trackPanel) {
    renderTracks();
    renderTrack(activeTrack);
    trackTabs.addEventListener("click", function (e) {
      var btn = e.target.closest(".tab");
      if (!btn) return;
      activeTrack = Number(btn.dataset.i);
      $$(".tab", trackTabs).forEach(function (b, k) {
        b.classList.toggle("is-active", k === activeTrack);
        b.setAttribute("aria-selected", String(k === activeTrack));
      });
      renderTrack(activeTrack);
    });
  }

  /* =========================================================
     6. Rubric calculator
     ========================================================= */
  var ORG_HINT = {
    1: "No event capability.",
    2: "Newer or small event.",
    3: "A modest existing event, or an established organiser.",
    4: "Three or more editions with a real sponsor base.",
    5: "Flagship event, or a proven operator who commands the local network."
  };
  var PERSONA_HINT = {
    1: "No decision path.",
    2: "Board member, sponsor rep or volunteer.",
    3: "Community or event manager, coordinator.",
    4: "Program, partnerships or events director.",
    5: "Owner, executive director or a senior industry figure."
  };
  var MARKET_WEIGHT = { new: 1.30, underserved: 1.15, saturated: 0.85 };

  function band(total) {
    if (total >= 10) return { label: "10 priority", cls: "new" };
    if (total >= 8) return { label: "8-9 personalized", cls: "unique" };
    if (total >= 6) return { label: "6-7 viable", cls: "possible" };
    return { label: "<= 5 deprioritize", cls: "sat" };
  }

  var orgEl = $("#orgFit"), pFitEl = $("#personaFit"), marketEl = $("#market"), mediaEl = $("#media");

  function renderRubric() {
    if (!orgEl) return;
    var org = Number(orgEl.value);
    var pf = Number(pFitEl.value);
    var market = marketEl.value;
    var media = mediaEl.checked;

    $("#orgFitVal").textContent = org;
    $("#personaFitVal").textContent = pf;
    $("#orgHint").textContent = ORG_HINT[org];
    $("#personaHint").textContent = PERSONA_HINT[pf];

    var total = org + pf;
    var weight = MARKET_WEIGHT[market];
    var boost = media ? 1.05 : 1.00;
    var priority = total * weight * boost;
    var b = band(total);

    $("#totalFit").textContent = total;
    $("#priorityScore").textContent = priority.toFixed(2);
    var pill = $("#bandPill");
    pill.textContent = b.label;
    pill.style.color = "var(--accent)";

    var pct = Math.min(100, (priority / 13.65) * 100);
    $("#gaugeFill").style.width = pct.toFixed(1) + "%";

    $("#formula").innerHTML =
      "total_fit_score = org_fit + persona_fit = " + org + " + " + pf + " = <b>" + total + "</b>\n" +
      "priority_score  = " + total + " &times; " + weight.toFixed(2) + " &times; " + boost.toFixed(2) + " = <b>" + priority.toFixed(2) + "</b>";

    var compare = (7 * MARKET_WEIGHT.new).toFixed(2);
    var strong = (9 * MARKET_WEIGHT.saturated).toFixed(2);
    var msg;
    if (total >= 7 && market === "new") {
      msg = "This is the headline rule. A base score of " + total + " in a new market lands at " + priority.toFixed(2) +
        ", which outranks a base score of 9 in a saturated market (" + strong + "). Priority, not raw fit, sets the order.";
    } else if (market === "saturated" && total >= 9) {
      msg = "The strongest possible fit in a saturated market still scores " + priority.toFixed(2) +
        ". A base score of 7 in a new market lands at " + compare + ", which places it higher.";
    } else {
      msg = "Market weighting shifts the order without touching the base score. A base score of 7 in a new market reaches " +
        compare + "; the same score in a saturated market reaches " + (7 * MARKET_WEIGHT.saturated).toFixed(2) + ".";
    }
    $("#rubricCallout").textContent = msg;

    $("#confidenceVal").textContent = "50";
    $("#confidenceFill").style.width = "50%";
  }

  if (orgEl) {
    [orgEl, pFitEl].forEach(function (el) { el.addEventListener("input", renderRubric); });
    marketEl.addEventListener("change", renderRubric);
    mediaEl.addEventListener("change", renderRubric);

    $("#presets").innerHTML = D.rubric.presets.map(function (p, i) {
      return '<button type="button" class="preset" data-i="' + i + '">' + esc(p.name) + '</button>';
    }).join("");
    $("#presets").addEventListener("click", function (e) {
      var btn = e.target.closest(".preset");
      if (!btn) return;
      var p = D.rubric.presets[Number(btn.dataset.i)];
      orgEl.value = p.org; pFitEl.value = p.persona;
      marketEl.value = p.market; mediaEl.checked = !!p.media;
      renderRubric();
    });
    renderRubric();
  }

  /* =========================================================
     7. Dedup simulator (Jaro-Winkler)
     ========================================================= */
  function jaro(a, b) {
    if (a === b) return 1;
    var la = a.length, lb = b.length;
    if (!la || !lb) return 0;
    var matchDist = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
    var aMatch = new Array(la).fill(false);
    var bMatch = new Array(lb).fill(false);
    var matches = 0;
    for (var i = 0; i < la; i++) {
      var lo = Math.max(0, i - matchDist);
      var hi = Math.min(i + matchDist + 1, lb);
      for (var j = lo; j < hi; j++) {
        if (bMatch[j] || a[i] !== b[j]) continue;
        aMatch[i] = true; bMatch[j] = true; matches++;
        break;
      }
    }
    if (!matches) return 0;
    var t = 0, k = 0;
    for (var x = 0; x < la; x++) {
      if (!aMatch[x]) continue;
      while (!bMatch[k]) k++;
      if (a[x] !== b[k]) t++;
      k++;
    }
    t = t / 2;
    return (matches / la + matches / lb + (matches - t) / matches) / 3;
  }

  function jaroWinkler(a, b) {
    a = normalizeName(a); b = normalizeName(b);
    var j = jaro(a, b);
    if (j < 0.7) return j;
    var prefix = 0;
    for (var i = 0; i < Math.min(4, a.length, b.length); i++) {
      if (a[i] === b[i]) prefix++; else break;
    }
    return j + prefix * 0.1 * (1 - j);
  }

  function normalizeName(s) {
    return String(s || "").toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(inc|llc|ltd|limited|gmbh|group|holdings|partners|partner|ventures|venture|the|co)\b/g, " ")
      .replace(/\b(19|20)\d{2}\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function classify(score) {
    if (score >= 0.95) return { key: "exact", label: "Exact match", action: "Dropped automatically. The record already exists." };
    if (score >= 0.80) return { key: "possible", label: "Possible match", action: "Flagged for human review. Never auto-resolved." };
    return { key: "unique", label: "Unique", action: "Proceeds as a new record." };
  }

  var dedupA = $("#dedupA"), dedupB = $("#dedupB");

  function renderDedup() {
    if (!dedupA) return;
    var score = jaroWinkler(dedupA.value, dedupB.value);
    var c = classify(score);
    var color = c.key === "exact" ? "var(--risk)" : c.key === "possible" ? "var(--warn)" : "var(--accent)";
    $("#dedupResult").innerHTML =
      '<span class="dedup-verdict ' + c.key + '">' + c.label + '</span>' +
      '<span class="dedup-score">' + (score * 100).toFixed(1) + '<span class="mono muted" style="font-size:.9rem">/100</span></span>' +
      '<span class="dedup-meter"><span style="width:' + (score * 100).toFixed(1) + '%;background:' + color + '"></span></span>' +
      '<p class="dedup-note">Similarity is computed on a normalised name: case, punctuation, legal suffixes and a trailing year are stripped first.</p>' +
      '<p class="dedup-action">' + esc(c.action) + '</p>';
  }

  if (dedupA) {
    $("#dedupRules").innerHTML = D.dedup.thresholds.map(function (t) {
      return "<tr><td>" + esc(t.label) + "</td><td class=\"mono\">" + esc(t.rule) + "</td><td>" + esc(t.outcome) + "</td></tr>";
    }).join("");
    $("#dedupPresets").innerHTML = D.dedup.pairs.map(function (p, i) {
      return '<button type="button" class="preset" data-i="' + i + '">' + esc(p.a) + " vs " + esc(p.b) + '</button>';
    }).join("");
    $("#dedupPresets").addEventListener("click", function (e) {
      var btn = e.target.closest(".preset");
      if (!btn) return;
      var p = D.dedup.pairs[Number(btn.dataset.i)];
      dedupA.value = p.a; dedupB.value = p.b;
      renderDedup();
    });
    dedupA.addEventListener("input", renderDedup);
    dedupB.addEventListener("input", renderDedup);
    renderDedup();
  }

  /* =========================================================
     8. Outreach + email simulator
     ========================================================= */
  function tierOf(c) {
    if (c.thesis && c.sourceUrl) return "Tier 1";
    if (c.firmPositioning || c.angle) return "Tier 2";
    return "Tier 3";
  }
  function statusOf(tier) { return tier === "Tier 3" ? "Manual Review Required" : "Sequence Eligible"; }

  function complimentOf(c) {
    var t = tierOf(c);
    if (t === "Tier 1" && c.thesis) {
      var pre = "I came across your perspective on " + c.thesis;
      return c.firmPositioning
        ? pre + ", and it fits the way " + c.company + " is known for " + c.firmPositioning + "."
        : pre + ", and it stood out as relevant to this conversation.";
    }
    if (t === "Tier 2") {
      if (c.company && c.firmPositioning) return "I've been following " + c.company + "'s work in " + c.firmPositioning + ".";
      if (c.firmPositioning) return "I've been following the firm's work in " + c.firmPositioning + ".";
      if (c.angle) return "I've been following your work from the perspective of " + c.angle + ".";
    }
    return "";
  }
  function fitOf(c) {
    var t = tierOf(c);
    if (t === "Tier 1" && c.thesis) return "Your perspective on " + c.thesis + " would add real value to the discussion.";
    if (t === "Tier 2") {
      var focus = c.angle || c.firmPositioning;
      if (focus) return "Your perspective from " + focus + " would add meaningful context to the conversation.";
    }
    return "";
  }

  function checksFor(c) {
    return [
      {
        label: "Outreach status is Qualified",
        pass: c.status === "Qualified",
        detail: "status = " + c.status
      },
      {
        label: "Personalization tier is sequence-eligible",
        pass: tierOf(c) !== "Tier 3",
        detail: tierOf(c) + " / " + statusOf(tierOf(c))
      },
      {
        label: "Email is present and verified",
        pass: !!c.email && c.verifiedEmail === true,
        detail: c.email + (c.verifiedEmail ? " (verified)" : " (unverified)")
      },
      {
        label: "No human sequence assignment yet",
        pass: !c.sequence,
        detail: c.sequence ? 'outreach_sequence = "' + c.sequence + '"' : "outreach_sequence = blank"
      }
    ];
  }

  var contactList = $("#contactList");
  var activeContact = 0;
  var sendMode = "dry";

  function renderContacts() {
    contactList.innerHTML = D.contacts.map(function (c, i) {
      var eligible = checksFor(c).every(function (k) { return k.pass; });
      return '<button type="button" role="option" aria-selected="' + (i === activeContact) + '"' +
        ' class="contact' + (i === activeContact ? " is-active" : "") + '" data-i="' + i + '">' +
        '<span class="contact-name">' + esc(c.name) + (eligible ? "" : ' <span class="mono" style="color:var(--risk)">&middot; hold</span>') + '</span>' +
        '<span class="contact-meta">' + esc(c.title + " · " + c.company + " · " + c.track) + '</span>' +
        '</button>';
    }).join("");
  }

  function buildEmail(c) {
    var tpl = D.emailTemplates[c.track];
    var first = c.name.split(" ")[0];
    var eventName = "The Summit Series";
    function fill(s) {
      return s.replace(/\{company\}/g, c.company)
        .replace(/\{city\}/g, c.city)
        .replace(/\{first\}/g, first)
        .replace(/\{event\}/g, eventName);
    }
    var compliment = complimentOf(c);
    var fit = fitOf(c);
    var body = tpl.body.map(function (line) {
      return fill(line)
        .replace("{compliment}", compliment || "[[no evidence-based opener]]")
        .replace("{fit}", fit || "[[no evidence-based value line]]");
    }).join("\n\n");
    return { subject: fill(tpl.subject), greeting: fill(tpl.greeting), body: body, signoff: tpl.signoff, compliment: compliment, fit: fit };
  }

  function renderOutreach() {
    var c = D.contacts[activeContact];
    var checks = checksFor(c);
    var eligible = checks.every(function (k) { return k.pass; });
    var tier = tierOf(c);

    $("#gateChecks").innerHTML = checks.map(function (k) {
      return '<div class="gate-check ' + (k.pass ? "pass" : "fail") + '">' +
        '<span class="gate-icon" aria-hidden="true">' + (k.pass ? "&#10003;" : "&#10007;") + '</span>' +
        '<span class="gate-check-label">' + esc(k.label) + '</span>' +
        '<span class="gate-check-detail">' + esc(k.detail) + '</span>' +
        '</div>';
    }).join("");

    var email = buildEmail(c);
    var bodyHtml = esc(email.body)
      .replace(/\[\[no evidence-based opener\]\]/g, '<span class="fill-muted">[[no evidence-based opener &#8212; routed to review]]</span>')
      .replace(/\[\[no evidence-based value line\]\]/g, '<span class="fill-muted">[[no evidence-based value line &#8212; routed to review]]</span>');
    if (email.compliment) bodyHtml = bodyHtml.replace(esc(email.compliment), '<span class="fill">' + esc(email.compliment) + '</span>');
    if (email.fit) bodyHtml = bodyHtml.replace(esc(email.fit), '<span class="fill">' + esc(email.fit) + '</span>');

    $("#emailPreview").innerHTML =
      '<div class="email-head">' +
        '<div class="email-field"><span>To</span><span class="mono">' + esc(c.email) + '</span></div>' +
        '<div class="email-field"><span>Subj</span><span>' + esc(email.subject) + '</span></div>' +
      '</div>' +
      '<div class="email-body">' + esc(email.greeting) + '\n\n' + bodyHtml + '\n\n' + esc(email.signoff) + '</div>' +
      '<div class="email-tags">' +
        '<span class="tag tier">' + esc(tier) + '</span>' +
        '<span class="tag ' + (tier === "Tier 3" ? "review" : "") + '">' + esc(statusOf(tier)) + '</span>' +
        '<span class="tag">' + esc(c.track) + '</span>' +
        '<span class="tag">market: ' + esc(c.market) + '</span>' +
      '</div>';

    $("#sendBtn").disabled = false;
    $("#sendBtn").textContent = sendMode === "dry" ? "Preview enrolment" : "Enroll live";
    var st = $("#sendStatus");
    st.className = "send-status mono";
    st.textContent = eligible ? "ready" : "blocked by " + checks.filter(function (k) { return !k.pass; }).length + " check(s)";

    renderRunner();
    renderGuard(c);
  }

  function renderRunner() {
    var stage = $(".outreach-stage");
    if (!stage) return;
    var steps = ["scored", "deduplicated", "tier derived", "email drafted", sendMode === "dry" ? "plan written" : "sequence enrolment"];
    var html = '<div class="flow-runner"><span class="mono muted" style="font-size:.7rem">PIPELINE</span>' +
      steps.map(function (s, i) {
        return '<span class="runner-step" data-step="' + i + '">' + esc(s) + '</span>' +
          (i < steps.length - 1 ? '<span class="mono muted">&rarr;</span>' : "");
      }).join("") + '</div>';
    var existing = $(".flow-runner", stage);
    if (existing) existing.outerHTML = html;
    else stage.insertAdjacentHTML("afterbegin", html);
  }

  function renderGuard(c) {
    var note = $("#guardNote");
    if (c.sequence) {
      note.innerHTML = "<strong>outreach_sequence</strong> is already set to <code>" + esc(c.sequence) +
        "</code> by a human. The agent never touches this field, so the contact is left alone. Correct behaviour: it stays in its assigned sequence.";
    } else {
      note.innerHTML = "<strong>outreach_sequence</strong> stays blank. The agent never writes it — a person assigns the sequence during qualification. Uploading a contact does not enrol it; enrolment is a separate, human-set decision.";
    }
  }

  function runSend() {
    var c = D.contacts[activeContact];
    var checks = checksFor(c);
    var eligible = checks.every(function (k) { return k.pass; });
    var st = $("#sendStatus");

    if (!eligible) {
      var failed = checks.filter(function (k) { return !k.pass; });
      st.className = "send-status mono block";
      st.textContent = "blocked: " + failed[0].label.toLowerCase();
      if (c.sequence) {
        st.textContent = "blocked: sequence already assigned by a human";
      }
      return;
    }

    var steps = $$(".runner-step");
    steps.forEach(function (s) { s.classList.remove("done", "active"); });
    var i = 0;
    (function tick() {
      if (i >= steps.length) {
        st.className = "send-status mono ok";
        st.textContent = sendMode === "dry"
          ? "dry run complete — nothing was sent"
          : "enrolled — status Prospecting → Sent";
        return;
      }
      steps.forEach(function (s, k) { s.classList.toggle("active", k === i); if (k < i) { s.classList.add("done"); s.classList.remove("active"); } });
      i++;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { while (i <= steps.length) { steps[i - 1].classList.add("done"); i++; } i = steps.length + 1; return tick(); }
      setTimeout(tick, 320);
    })();
  }

  if (contactList) {
    renderContacts();
    renderOutreach();
    contactList.addEventListener("click", function (e) {
      var btn = e.target.closest(".contact");
      if (!btn) return;
      activeContact = Number(btn.dataset.i);
      $$(".contact", contactList).forEach(function (b, k) { b.setAttribute("aria-selected", String(k === activeContact)); b.classList.toggle("is-active", k === activeContact); });
      renderOutreach();
    });
    $$(".mode-btn[data-send]").forEach(function (b) {
      b.addEventListener("click", function () {
        sendMode = b.dataset.send;
        $$(".mode-btn[data-send]").forEach(function (x) {
          var on = x.dataset.send === sendMode;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-pressed", String(on));
        });
        renderOutreach();
      });
    });
    $("#sendBtn").addEventListener("click", runSend);
  }

  /* =========================================================
     9. Write gates
     ========================================================= */
  var gateState = { live: false, writes: false, schema: false };

  function renderGates() {
    var host = $("#gateControls");
    if (!host) return;
    host.innerHTML = D.gates.map(function (g) {
      return '<label class="gate-row">' +
        '<span><span class="gate-env">' + esc(g.env) + '</span><br><span class="gate-row-note">' + esc(g.note) + '</span></span>' +
        '<span class="switch"><input type="checkbox" data-gate="' + g.id + '"' + (gateState[g.id] ? " checked" : "") + '>' +
        '<span class="switch-track" aria-hidden="true"></span></span>' +
        '</label>';
    }).join("");

    var allowed = gateState.live && gateState.writes;
    var schemaAllowed = allowed && gateState.schema;
    var r = $("#gateResult");
    r.innerHTML =
      '<p class="gate-verdict ' + (allowed ? "allowed" : "blocked") + '">' + (allowed ? "CRM write allowed" : "CRM write blocked") + '</p>' +
      '<p class="gate-explain">' +
        (allowed
          ? "Both switches are open. The upload plan can be executed — and the plan itself can still be inspected first."
          : "At least one switch is closed. The pipeline builds a plan and stops.") +
      '</p>' +
      '<ul class="gate-list">' +
        '<li><span>LIVE_WRITE</span><span class="' + (gateState.live ? "on" : "off") + '">' + (gateState.live ? "true" : "false") + '</span></li>' +
        '<li><span>ALLOW_CRM_WRITES</span><span class="' + (gateState.writes ? "on" : "off") + '">' + (gateState.writes ? "true" : "false") + '</span></li>' +
        '<li><span>ALLOW_SCHEMA_WRITES</span><span class="' + (gateState.schema ? "on" : "off") + '">' + (gateState.schema ? "true" : "false") + '</span></li>' +
        '<li><span>schema change allowed</span><span class="' + (schemaAllowed ? "on" : "off") + '">' + (schemaAllowed ? "yes" : "no") + '</span></li>' +
        '<li><span>agent writes outreach_sequence</span><span class="never">never</span></li>' +
      '</ul>';

    $$("input[data-gate]", host).forEach(function (cb) {
      cb.addEventListener("change", function () {
        gateState[cb.dataset.gate] = cb.checked;
        renderGates();
      });
    });
  }
  renderGates();

  /* =========================================================
     10. Output explorer
     ========================================================= */
  var rowBody = $("#rowBody");
  var sortKey = "priority", sortDir = -1, rowFilter = "All", rowQuery = "";

  function renderRows() {
    if (!rowBody) return;
    var rows = D.outputRows.slice();
    if (rowFilter !== "All") rows = rows.filter(function (r) { return r.track === rowFilter; });
    if (rowQuery) {
      var q = rowQuery.toLowerCase();
      rows = rows.filter(function (r) {
        return (r.company + " " + r.city + " " + r.country).toLowerCase().indexOf(q) !== -1;
      });
    }
    rows.sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      if (typeof x === "number" && typeof y === "number") return (x - y) * sortDir;
      return String(x).localeCompare(String(y)) * sortDir;
    });

    rowBody.innerHTML = rows.map(function (r) {
      var marketCls = r.priority / (r.fit || 1) >= 1.2 ? "new" : r.priority / (r.fit || 1) >= 1.0 ? "und" : "sat";
      return "<tr>" +
        "<td>" + esc(r.company) + "</td>" +
        "<td>" + esc(r.city) + "</td>" +
        "<td>" + esc(r.country) + "</td>" +
        "<td><span class=\"mono\" style=\"font-size:.74rem;color:var(--muted)\">" + esc(r.track) + "</span></td>" +
        "<td class=\"num\">" + r.fit + "</td>" +
        "<td class=\"num\">" + r.priority.toFixed(2) + "</td>" +
        "<td><span class=\"pill " + marketCls + "\">" + esc(r.band) + "</span></td>" +
        "<td class=\"num\">" + r.confidence + "</td>" +
        "<td><span class=\"pill " + r.dedup.toLowerCase() + "\">" + esc(r.dedup) + "</span></td>" +
        "</tr>";
    }).join("");

    $("#rowCount").textContent = rows.length + " of " + D.outputRows.length + " rows · sorted by " + sortKey + (sortDir < 0 ? " desc" : " asc");
  }

  if (rowBody) {
    var tracks = ["All"].concat(D.outputRows.map(function (r) { return r.track; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    $("#rowFilters").innerHTML = tracks.map(function (t) {
      return '<button type="button" class="chip' + (t === "All" ? " is-active" : "") + '" data-track="' + esc(t) + '">' + esc(t) + '</button>';
    }).join("");
    $("#rowFilters").addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      rowFilter = btn.dataset.track;
      $$(".chip", $("#rowFilters")).forEach(function (c) { c.classList.toggle("is-active", c.dataset.track === rowFilter); });
      renderRows();
    });
    $("#rowSearch").addEventListener("input", function (e) { rowQuery = e.target.value.trim(); renderRows(); });
    $$("#rowTable thead th").forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.dataset.sort;
        if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = (key === "company" || key === "city" || key === "country" || key === "track" || key === "band" || key === "dedup") ? 1 : -1; }
        renderRows();
      });
    });
    renderRows();
  }

  /* =========================================================
     helpers
     ========================================================= */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
