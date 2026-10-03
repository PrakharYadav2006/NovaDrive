/* Screen 1 - Overview: Supplier Risk Command Center */
(function () {
  'use strict';
  const LH = window.LH, D = LH.D, esc = LH.esc;
  const K = LH.KEY;

  function attnRow(s) {
    const a = LH.action(s);
    const alts = LH.altsFor(s.id);
    return '<tr class="clk" data-act="sup" data-id="' + s.id + '" role="button" tabindex="0" aria-label="Open Supplier 360 for ' + esc(s.short) + '">' +
      '<td><div class="sname">' + esc(s.short) + '<small>' + LH.tierTxt(s) + ' · ' + s.zone + (s.status === 'Inferred' ? ' · link inferred' : '') + '</small></div></td>' +
      '<td class="n">' + LH.rk(s) + '<div class="xs muted">' + s.band + '</div></td>' +
      '<td>' + LH.confPill(s.conf) + '</td>' +
      '<td>' + esc(LH.whyMatters(s)) + '<div class="rowbtns">' +
        LH.btn('Why?', 'whyrow', { id: s.id }, 'sm ghost') + LH.btn('View network', 'viewnet', { id: s.id }, 'sm ghost') +
        LH.btn('Trace impact', 'trace', { id: s.id }, 'sm ghost') + LH.btn('Find alternatives', 'alts', { id: s.id }, 'sm ghost') + '</div></td>' +
      '<td>' + LH.actPill(a) + '</td></tr>' +
      '<tr id="why-' + s.id + '" hidden><td colspan="5"><div class="whybox"><b>Why this action?</b> ' + esc(a.why) +
        '<div class="mt8 small muted">Scorecard v2 next step: “' + esc(s.next) + '”. Top drivers: ' + esc(s.driver.split(' | ').map((x) => x.split(':')[0]).join(' · ')) + '.</div>' +
        (alts.length ? '<div class="mt8 small">Shortlisted: ' + alts.map((x) => LH.chipAlt(x)).join(' ') + ' <span class="muted">sourcing and engineering validation required</span></div>' : '') +
        '<div class="rowbtns">' + LH.btn('Open Supplier 360', 'sup', { id: s.id }, 'sm') + LH.btn('View evidence', 'evq', { q: s.id }, 'sm') + '</div></div></td></tr>';
  }

  LH.pages.overview = function () {
    const k = LH.kpi;
    const mat = LH.MATERIAL.map((i) => D.sup[i]).sort((a, b) => a.rank - b.rank);
    const ver = LH.supList.filter((s) => s.band === 'High' && (s.conf === 'Low' || s.status === 'Inferred'));
    const kp = (num, lab, cls, act, data) => '<div class="kpi ' + (cls || '') + (act ? ' clickable' : '') + '"' + (act ? ' role="button" tabindex="0" data-act="' + act + '"' + Object.keys(data || {}).map((x) => ' data-' + x + '="' + esc(data[x]) + '"').join('') : '') + '><b class="num">' + num + '</b><span>' + lab + '</span></div>';

    let h = LH.pageH('Supplier Risk Command Center', 'See what needs attention, why it matters, and what to do next.');
    h += '<div class="kpis">' +
      kp(k.suppliers, 'Suppliers mapped', '', 'nav', { to: 'network' }) +
      kp(k.tiers.join(' / '), 'Tier-1 / Tier-2 / Tier-3') +
      kp(k.confirmed, 'Confirmed links', '', 'evq', { q: 'Confirmed', tab: 'rel' }) +
      kp(k.inferred, 'Inferred link', 'warn', 'evq', { q: 'Inferred', tab: 'rel' }) +
      kp(k.material, 'Material vulnerabilities', 'alert', 'jump', { to: 'needs' }) +
      kp(k.z01, 'Z01 network sites', 'warn', 'zone', { id: 'Z01' }) + '</div>';
    h += LH.adv('Network detail', '<div class="kpis" style="grid-template-columns:repeat(6,1fr)">' +
      kp(D.links.length, 'Supplier links in the data (10 Tier-1, 16 Tier-2, 6 Tier-3)') + kp(Object.keys(D.ev).length, 'Evidence records reviewed', '', 'evq', { q: '', tab: 'rel' }) +
      kp(D.events.length, 'External events screened (2 matched)', '', 'nav', { to: 'events' }) + kp(LH.comps.length, 'Components traced (4 with a single disclosed Tier-1)', '', 'nav', { to: 'network' }) +
      kp(2, 'Hypotheses held outside the network (U2, U3)', '', 'evq', { q: 'Hypothesis', tab: 'rej' }) + kp(LH.supList.filter((s) => s.conf === 'Low').length, 'Suppliers with Low confidence', 'warn', 'nav', { to: 'risk' }) + '</div>');

    h += '<div class="grid mt24">';
    // Needs attention
    h += '<div class="c8" id="needs">' + LH.panel('Needs Attention', 'Recommended next actions based on risk and evidence confidence.',
      '<div class="t-wrap"><table class="t"><thead><tr><th>Supplier</th><th>Risk' + LH.help('Overall risk % from the six-dimension model (scorecard v2). Higher = riskier. It is separate from confidence.', 'What does this mean?') + '</th><th>Confidence' + LH.help('Confidence measures how well the conclusion is supported by evidence. It is separate from risk.', 'How confident are we?') + '</th><th>Why it matters</th><th>Action</th></tr></thead><tbody>' +
      mat.map(attnRow).join('') +
      '<tr><td colspan="5" style="background:var(--amber-soft);font-size:13px;font-weight:600;color:#6e4306;padding:8px 10px">High score, thin evidence: verify first ' + LH.help('These suppliers rank high mainly because data is missing or the link is only inferred. Verify before spending sourcing effort.') + '</td></tr>' +
      ver.map(attnRow).join('') + '</tbody></table></div>') + '</div>';

    // right column: exposure + alerts
    h += '<div class="c4" style="display:flex;flex-direction:column;gap:20px">';
    h += LH.panel('Portfolio exposure', null,
      '<div class="hero-n num">$1.56B</div><p class="mt8"><b>Annual NovaDrive product revenue behind the IonPeak dependency</b></p>' +
      '<div class="small muted">All three products (P1, P2, P3) depend on one die source. This is product revenue, not supplier spend. ' + LH.help('USD 1,560m = P1 624 + P2 520 + P3 416. It is the annual revenue of the dependent products. The data holds no supplier spend or purchase history.', 'What does this mean?') + '</div>' +
      '<div class="mt12">' + LH.prods.map((p) => '<div class="pbar" role="button" tabindex="0" data-act="prod" data-id="' + p.id + '"><span><b>' + p.id + '</b> ' + esc(p.name) + '</span>' + LH.bar(p.rev / LH.TOTAL * 100) + '<span class="num">$' + p.rev + 'm</span></div>').join('') + '</div>' +
      '<div class="row mt8">' + LH.btn('Trace IonPeak impact', 'trace', { id: K.ion }, 'sm') + LH.btn('How calculated?', 'method', { at: 'm-rev' }, 'sm ghost') + '</div>');
    h += LH.panel('Active alerts', 'Only signals that match the network.',
      '<div class="alert-card" role="button" tabindex="0" data-act="ev" data-id="EV-001"><div class="id">EV-001 · WATCH</div><b>East Delta flood watch</b><div class="small">Z01 · 5 sites potentially exposed</div><div class="small muted mt8">Action: <b style="color:var(--ink)">Verify continuity</b> (no damage or shutdown confirmed)</div></div>' +
      '<div class="alert-card red" role="button" tabindex="0" data-act="ev" data-id="EV-003"><div class="id">EV-003 · PRODUCTION CONTINUES</div><b>Meridian financing pressure</b><div class="small">Matched supplier · severity 60</div><div class="small muted mt8">Action: <b style="color:var(--ink)">Review exposure / sourcing</b></div></div>' +
      '<div class="row">' + LH.btn('View all signals', 'nav', { to: 'events' }, 'sm') + '<span class="xs muted">6 other signals were screened out. <button type="button" class="chip" data-act="nav" data-to="events">Why?</button></span></div>');
    h += '</div>';

    // concentration insight
    h += '<div class="c12">' + LH.panel('Where diversification breaks', 'Three places where the network looks diversified but is not.',
      '<div class="grid" style="gap:16px">' +
        '<div class="c4"><h4 class="mb8">Same parent, same upstream</h4><div class="flowrow"><div class="step"><h5>Tier-1</h5>Aster + Boreal</div><span class="arrow">→</span><div class="step"><h5>Owner</h5>CommonSpan (DOC-075)</div></div><div class="flowrow mt8"><div class="step"><h5>Shared Tier-2</h5>IonPeak · Lumen · Orion</div><span class="arrow">→</span><div class="step fail"><h5>Single die source</h5>IonPeak</div></div><div class="row mt8">' + LH.btn('Trace IonPeak', 'trace', { id: K.ion }, 'sm') + LH.chipDoc('DOC-078') + '</div></div>' +
        '<div class="c4"><h4 class="mb8">One substrate source</h4><div class="flowrow"><div class="step fail"><h5>Tier-2</h5>Jade</div><span class="arrow">→</span><div class="step"><h5>Three Tier-1s</h5>Cobalt + Grove + HarborSense</div></div><div class="small muted mt8">Only qualified substrate source for C10 (all products) and B10 (P3).</div><div class="row mt8">' + LH.btn('Trace Jade', 'trace', { id: K.jade }, 'sm') + LH.chipDoc('DOC-079') + '</div></div>' +
        '<div class="c4"><h4 class="mb8">One region</h4><div class="flowrow"><div class="step fail"><h5>Zone</h5>Z01 East Delta</div><span class="arrow">→</span><div class="step"><h5>Network sites</h5>5 (IonPeak, Jade, Orion, Umber, Verdant)</div></div><div class="small muted mt8">One regional event could hit power dies, circuit substrates and ceramics at once.</div><div class="row mt8">' + LH.btn('Show Z01 on the map', 'zone', { id: 'Z01' }, 'sm') + LH.chipEv('EV-001') + '</div></div>' +
      '</div><div class="statement">TWO APPARENT SOURCES CAN STILL REPRESENT ONE EFFECTIVE UPSTREAM DEPENDENCY.</div>') + '</div>';

    // executive action panel
    const al = LH.alts.filter((a) => a.role.startsWith('Primary'));
    h += '<div class="c12">' + LH.panel('Executive action plan', 'What to do, in what order. Sequencing is Lighthouse\'s proposal, not a case-provided deadline.',
      '<div class="grid" style="gap:14px">' +
      '<div class="c3"><div class="phase"><div class="when">0–30 DAYS</div><div class="verb">VERIFY</div><ul><li>Low-confidence relationships (Verdant → IonPeak is inferred)</li><li>Missing information (' + LH.supList.filter((s) => s.missing_fields.length).map((s) => esc(s.short.split(' ')[0])).join(', ') + ')</li><li>Exact specifications (die type, ceramic type, film, board)</li><li>Z01 continuity (EV-001)</li></ul></div></div>' +
      '<div class="c3"><div class="phase"><div class="when">30–90 DAYS</div><div class="verb">QUALIFY</div><ul>' + al.map((a) => '<li>' + LH.chipAlt(a) + ' for ' + esc(LH.name(a.replaces)) + ' <span class="muted">· ' + a.weeks + ' wk</span></li>').join('') + '</ul><div class="xs muted mt8">Validate first; qualification itself takes 8–16 weeks (indicative).</div></div></div>' +
      '<div class="c3"><div class="phase"><div class="when">ONGOING</div><div class="verb">MONITOR</div><ul><li>External events</li><li>Supplier health</li><li>Geography</li><li>Network concentration</li></ul></div></div>' +
      '<div class="c3"><div class="phase"><div class="when">WHEN TRIGGERED</div><div class="verb">ACT</div><ul><li>Validate</li><li>Qualify</li><li>Allocate</li><li>Escalate</li></ul></div></div>' +
      '</div>') + '</div>';
    h += '</div>';
    return h;
  };

  const A = LH.A;
  A.whyrow = (d) => { const r = document.getElementById('why-' + d.id); if (r) r.hidden = !r.hidden; };
  A.viewnet = (d) => { LH.focus('sup', d.id); LH.net.full = false; LH.net.trace = null; LH.go('network/explorer'); };
  A.jump = (d) => { const e = document.getElementById(d.to); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  A.method = (d) => LH.go('methodology?at=' + (d.at || ''));
})();
