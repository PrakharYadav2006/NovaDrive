/* Screen 6 - Alternate Supplier Intelligence */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const st = (LH.src = { cmpA: null, cmpB: null });
  const PRIMARY = ['ORG-453', 'ORG-439', 'ORG-708', 'ORG-210'];

  const tally = (a) => { const t = { Strong: 0, Partial: 0, 'Not shown': 0 }; Object.values(a.ratings).forEach((x) => t[x.r]++); return t; };
  // gate: technical capability and application relevance must both be at least Partial
  LH.gate = (a) => {
    const t = a.ratings.tech.r, p = a.ratings.app.r;
    const ok = t !== 'Not shown' && p !== 'Not shown';
    return { ok, text: ok ? 'Passes the fit gate: technical capability and application relevance are both at least Partial.' : (t === 'Not shown' ? 'Excluded because exact technical capability was not sufficiently demonstrated.' : 'Excluded because application relevance was not sufficiently demonstrated.') };
  };

  function srcList(a) {
    const ids = [...new Set(Object.values(a.ratings).flatMap((r) => r.src))];
    return ids.map((i) => LH.srcById[i]).filter(Boolean);
  }

  function card(a) {
    const g = LH.gate(a); const t = tally(a); const sup = D.sup[a.replaces];
    let h = '<div class="altcard ' + (st.cmpA === a.id || st.cmpB === a.id ? 'sel' : '') + '" id="' + a.id + '"><div class="row"><h3 style="font-size:19px;font-family:var(--serif)">' + esc(a.name) + '</h3><span class="pill neutral">' + a.role + '</span><span class="pill amber">Evidence: Company-claimed ' + LH.help('Every rating comes from the company\'s own public pages, opened on ' + D.accessed + '. No independent source (certificate database, filing, customer announcement) was checked.', 'Claimed vs independent') + '</span><span class="sp"></span>' + LH.btn(st.cmpA === a.id || st.cmpB === a.id ? 'In comparison ✓' : 'Add to comparison', 'cmpadd', { id: a.id }, 'sm') + '</div>';
    h += '<div class="small mt8"><b>Target component:</b> ' + esc(a.target) + ' · <b>Replaces:</b> ' + LH.chipSup(a.replaces) + ' <span class="muted">(' + LH.pct1(sup.overall) + ', ' + sup.conf + ' confidence)</span></div>';
    h += '<div class="mt8">' + LH.altDisclaimer() + '</div>';
    h += '<div class="row mt8 small"><span class="muted">Fit on six factors:</span><span class="pill green">' + t.Strong + ' Strong</span><span class="pill amber">' + t.Partial + ' Partial</span><span class="pill neutral">' + t['Not shown'] + ' Not shown</span>' + LH.help('Counts of ratings, not a score. Each rating is a company claim. Ratings are not weighted or ranked into a number.', 'How to read this') + '</div>';
    h += '<div class="t-wrap mt8"><table class="cmp"><tbody>' + D.factors.map((f) => { const r = a.ratings[f.k]; return '<tr><td>' + f.n + '</td><td style="width:120px">' + LH.rate(r.r) + '</td><td class="small">' + esc(r.note) + (r.src.length ? ' <span class="xs">' + r.src.map((s) => '<button type="button" class="chip" data-act="src" data-id="' + s + '">' + s + '</button>').join(' ') + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<div class="note ' + (g.ok ? 'info' : 'warn') + '">' + esc(g.text) + '</div>';
    h += '<div class="small"><b>Qualification time:</b> ' + a.weeks + ' weeks indicative. <span class="muted">' + esc(a.weeks_note) + '</span></div>';
    h += '<div class="small mt8"><b>How it would work:</b> ' + esc(a.how) + '</div>';
    h += '<div class="val"><h4>Open validation points · Validate before qualification</h4><ul>' + a.open.map((o) => '<li>' + esc(o) + '</li>').join('') + '</ul></div>';
    h += '<details class="adv"><summary>Financials and sources (company-claimed)</summary><div class="body"><p class="small">' + esc(a.financials) + '</p>' + srcList(a).map((s) => '<div class="small mb8"><button type="button" class="chip" data-act="src" data-id="' + s.id + '">' + s.id + '</button> ' + LH.link(s.url, s.title) + ' <span class="muted">· ' + esc(s.pagedate || 'no page date shown') + ' · opened ' + s.accessed + ' · ' + s.type + '</span></div>').join('') + (a.derived ? '<div class="note warn">Lighthouse-derived ratings: Phase 2 assessed this candidate in prose; the six ratings are derived from that prose.</div>' : '') + '</div></details>';
    h += '</div>';
    return h;
  }

  function compare() {
    const A = LH.altById[st.cmpA], B = LH.altById[st.cmpB];
    const opts = (cur) => LH.alts.map((a) => '<option value="' + a.id + '"' + (cur === a.id ? ' selected' : '') + '>' + esc(a.name) + ' (for ' + esc(LH.name(a.replaces)) + ')</option>').join('');
    let h = '<div class="row mb8"><label class="small muted">Compare <select data-cmp="A" style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px">' + opts(st.cmpA) + '</select></label><label class="small muted">with <select data-cmp="B" style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px">' + opts(st.cmpB) + '</select></label></div>';
    if (A.id === B.id) return h + LH.empty('Pick two different candidates to compare.');
    h += '<div class="t-wrap"><table class="cmp"><thead><tr><th></th><th>' + esc(A.name) + '<div class="xs muted" style="text-transform:none;letter-spacing:0">for ' + esc(LH.name(A.replaces)) + ' · ' + esc(A.role) + '</div></th><th>' + esc(B.name) + '<div class="xs muted" style="text-transform:none;letter-spacing:0">for ' + esc(LH.name(B.replaces)) + ' · ' + esc(B.role) + '</div></th></tr></thead><tbody>';
    D.factors.forEach((f) => { h += '<tr><td>' + f.n + '</td>' + [A, B].map((x) => '<td>' + LH.rate(x.ratings[f.k].r) + '<div class="xs muted mt8">' + esc(x.ratings[f.k].note) + '</div></td>').join('') + '</tr>'; });
    h += '<tr><td>Qualification time</td>' + [A, B].map((x) => '<td>' + x.weeks + ' weeks indicative</td>').join('') + '</tr>';
    h += '<tr><td>Evidence</td>' + [A, B].map(() => '<td>Company-claimed, not independently verified</td>').join('') + '</tr>';
    h += '<tr><td>Open questions</td>' + [A, B].map((x) => '<td><ul style="margin:0 0 0 16px;padding:0" class="small">' + x.open.map((o) => '<li>' + esc(o) + '</li>').join('') + '</ul></td>').join('') + '</tr></tbody></table></div><div class="mt8">' + LH.altDisclaimer() + '</div>';
    return h;
  }

  LH.pages.sourcing = function (r) {
    let supId = r.a && D.sup[r.a] ? r.a : (LH.ctx.sup && D.sup[LH.ctx.sup] ? LH.ctx.sup : 'ORG-453');
    const selAlt = r.b || null;
    const alts = LH.altsFor(supId); const s = D.sup[supId];
    if (!st.cmpA) { st.cmpA = 'ALT-TTM'; st.cmpB = 'ALT-SCH'; }
    if (alts.length >= 2 && !alts.find((a) => a.id === st.cmpA)) { st.cmpA = alts[0].id; st.cmpB = alts[1].id; }
    else if (alts.length === 1 && selAlt) { /* keep */ }
    if (selAlt && LH.altById[selAlt] && st.cmpA !== selAlt && st.cmpB !== selAlt && alts.length < 2) { st.cmpA = selAlt; }
    const step = alts.length ? (selAlt ? 4 : 2) : 1;
    let h = LH.pageH('Alternate Supplier Intelligence', 'Identify credible secondary sources for material vulnerabilities.');
    h += '<div class="steps">' + ['Select supplier / component', 'Find alternatives', 'Compare fit', 'Review evidence', 'Validate', 'Qualify'].map((x, i) => '<span class="' + (i < step ? 'on' : '') + '">' + (i + 1) + ' ' + x + '</span>').join('') + '</div>';
    h += '<div class="small muted mb8" style="margin-top:-8px">Steps 5–6 happen with sourcing and engineering, outside Lighthouse.</div>';
    // selector: primary candidates
    h += '<div class="grid mb16">' + PRIMARY.map((id) => {
      const p = D.sup[id]; const a = LH.altsFor(id).filter((x) => x.role.startsWith('Primary'))[0];
      return '<div class="c3"><div class="alert-card" role="button" tabindex="0" data-act="srcsel" data-id="' + id + '" style="' + (supId === id ? 'border-color:var(--blue);box-shadow:0 0 0 2px var(--blue-soft)' : '') + '"><div class="id" style="color:var(--muted)">' + esc(p.short.split(' ')[0]) + ' · ' + LH.pct1(p.overall) + ' · ' + p.conf + '</div><b style="font-size:16px">→ ' + esc(a.name) + '</b><div class="xs muted mt8">' + esc(a.target) + '</div></div></div>';
    }).join('') + '</div>';
    h += '<div class="row mb16"><label class="small muted">Or search another supplier: <select data-srcsup style="font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:7px;max-width:260px">' + LH.supList.map((x) => '<option value="' + x.id + '"' + (x.id === supId ? ' selected' : '') + '>' + esc(x.short) + (LH.altsFor(x.id).length ? '' : ' (no candidate yet)') + '</option>').join('') + '</select></label></div>';
    // incumbent summary
    const a0 = LH.action(s);
    h += '<div class="panel flat"><div class="row"><div><div class="xs muted">What needs replacing</div><b style="font-size:18px">' + esc(s.name) + '</b> ' + LH.rk(s) + ' ' + LH.riskPill(s.band) + ' ' + LH.confPill(s.conf) + '</div><span class="sp"></span>' + LH.actPill(a0) + LH.btn('Supplier 360', 'sup', { id: supId }, 'sm') + '</div><div class="small mt8">' + esc(LH.whyMatters2(s)) + '</div><div class="row mt8 small muted">Components ' + s.comps.map(LH.chipComp).join(' ') + ' · qualification ' + s.weeks + ' weeks indicative · ' + LH.help('Alternates are shortlisted candidates for sourcing to validate, not approved replacements.') + '</div></div>';
    if (!alts.length) {
      h += '<div class="note empty mt16">No qualified candidate identified from the current evidence.<br><span class="small">' + (s.band === 'High' && s.conf === 'Low' ? 'Alternate search has not started: this supplier is VERIFY FIRST (high score, thin evidence).' : 'Phase 2 researched alternates for Jade, IonPeak, Orion and Meridian only.') + '</span></div>';
    } else {
      h += '<h2 class="mt24 mb8">What could replace this source?</h2><div class="grid">' + alts.map((a) => '<div class="' + (alts.length > 1 ? 'c6' : 'c12') + '">' + card(a) + '</div>').join('') + '</div>';
      if (supId === 'ORG-439') h += '<div class="note warn mt16"><b>PolarSwitch</b> — prospective only, not assessed. ' + esc(D.prospect.text) + ' ' + LH.chipDoc('DOC-078') + '</div>';
      if (supId === 'ORG-439') h += '<div class="note info"><b>Why not just another module assembler?</b> Aster and Boreal share one parent (DOC-075) and the same IonPeak die family (DOC-078). A different assembler does not provide independent die supply. The fix has to be an independent die maker. ' + LH.chipDoc('DOC-075') + ' ' + LH.chipDoc('DOC-078') + '</div>';
    }
    // fit logic + compare
    h += '<div class="mt24">' + LH.panel('How alternates are judged', 'Fit is scored separately from risk. Technical capability and application relevance are a gate.',
      '<p class="small">A candidate must show at least <b>Partial</b> technical capability <b>and</b> at least <b>Partial</b> application relevance, or it is excluded: “Excluded because exact technical capability was not sufficiently demonstrated.” The other four factors are then compared. Ratings are Strong, Partial or Not shown. No quantitative score is invented. Missing evidence means “ask”, not “they do not have it”.</p><div class="t-wrap"><table class="t"><thead><tr><th>Candidate</th><th>Technical</th><th>Application</th><th>Gate</th></tr></thead><tbody>' +
      LH.alts.map((a) => { const g = LH.gate(a); return '<tr><td class="sname">' + esc(a.name) + '<small>for ' + esc(LH.name(a.replaces)) + '</small></td><td>' + LH.rate(a.ratings.tech.r) + '</td><td>' + LH.rate(a.ratings.app.r) + '</td><td>' + (g.ok ? '<span class="pill green">✓ Passes</span>' : '<span class="pill red">✕ Excluded</span>') + '</td></tr>'; }).join('') + '</tbody></table></div><div class="xs muted mt8">0 of ' + LH.alts.length + ' candidates were excluded on the current evidence. PolarSwitch was not assessed, so it is neither passed nor excluded.</div>') + '</div>';
    h += '<div class="mt16" id="cmpbox">' + LH.panel('Compare candidates side by side', null, '<div id="cmpbody">' + compare() + '</div>') + '</div>';
    h += '<div class="mt16">' + LH.panel('Questions to give sourcing for every candidate', null, '<ol class="small" style="margin:0 0 0 18px"><li>Can you make our exact item?</li><li>Which plant would make it, and is it outside our exposed zones with its own inputs not coming from them?</li><li>What spare capacity do you have?</li><li>How long would qualification really take? (Our indicative figures: 12 weeks for C10 and B10, 16 for M10/M20, 8 for C20.)</li></ol>') + '</div>';
    return h;
  };

  const A = LH.A;
  A.srcsel = (d) => { LH.focus('sup', d.id); LH.go('sourcing/' + d.id); };
  A.cmpadd = (d) => { if (st.cmpA === d.id || st.cmpB === d.id) return; st.cmpB = st.cmpA; st.cmpA = d.id; LH.rerender(); const b = document.getElementById('cmpbox'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  document.addEventListener('change', (e) => {
    const c = e.target.closest('select[data-cmp]'); if (c) { st['cmp' + c.dataset.cmp] = c.value; document.getElementById('cmpbody').innerHTML = compare(); return; }
    const s = e.target.closest('select[data-srcsup]'); if (s) A.srcsel({ id: s.value });
  });
})();
