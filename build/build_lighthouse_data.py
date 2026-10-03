"""Builds assets/data.js for Project LIGHTHOUSE.

Inputs  : data/data.json (suppliers, links, evidence, events - built from the verified scorecard v2 and tiering workbooks)
          source_inputs/NovaDrive_Supplier_Tiering.xlsx (shared dependencies S1-S6, rejected R1-R9, unresolved U1-U11)
          data/geo.json (illustrative zone layout)
Curated : Phase 2 alternate-supplier research (every rating, figure and URL below is copied from the Phase 2 write-up;
          nothing is added from memory).
Output  : assets/data.js  ->  window.LH_DATA
"""
import json, os, re
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, 'data/data.json')))
GEO = json.load(open(os.path.join(ROOT, 'data/geo.json')))
wbT = openpyxl.load_workbook(os.path.join(ROOT, 'source_inputs/NovaDrive_Supplier_Tiering.xlsx'), data_only=True)

def sheet(name):
    ws = wbT[name]
    hdr = [c.value for c in ws[1]]
    return [dict(zip(hdr, r)) for r in ws.iter_rows(min_row=2, values_only=True) if r[0] and re.match(r'^[SRU]\d+$', str(r[0]))]

shared = [dict(id=r['ID'], priority=r['Priority (analyst view)'], node=r['Shared node'], why=r['Why it is a hidden concentration'],
               comps=r['Components affected'], products=r['Products affected / exposure'],
               evidence=[x.strip() for x in str(r['Evidence IDs']).split(',')], quote=r['Key quote'], status=r['Status'])
          for r in sheet('Shared Dependencies')]
rejected = [dict(id=r['ID'], item=r['Candidate link or reading'], evidence=[x.strip() for x in str(r['Evidence IDs']).split(',')],
                 cls=r['Reason class'], why=r['Why not accepted'], quote=r['Verbatim quote']) for r in sheet('Rejected Links')]
unresolved = [dict(id=r['ID'], item=r['Item'], status=r['Status'],
                   evidence=[x.strip() for x in str(r['Evidence IDs']).split(',') if x.strip() not in ('-', 'None', '')],
                   says=r['What the data does and does not say'], settle=r['What would settle it']) for r in sheet('Unresolved')]
assert len(shared) == 6 and len(rejected) == 9 and len(unresolved) == 11

# ---------------------------------------------------------------- components
COMP_NAME = D['meta']['comp']
CMP = {  # from Components Context + disclosed Tier-1 allocations (planning allocations, NOT purchase history)
 'M10': dict(app='Industrial inverter power assembly; IGBT/SiC-capable module integration', weeks=16, prods=['P1', 'P3'],
             t1=[('ORG-247', 60), ('ORG-725', 40)]),
 'M20': dict(app='High-voltage power assembly for charging power conversion; IGBT/SiC-capable', weeks=16, prods=['P2'],
             t1=[('ORG-247', 70), ('ORG-725', 30)]),
 'C10': dict(app='Industrial control PCB/PCBA with embedded microcontroller and power-control interfaces', weeks=12, prods=['P1', 'P2', 'P3'],
             t1=[('ORG-119', 100)]),
 'C20': dict(app='High-energy DC-link film capacitor for power-electronics applications', weeks=8, prods=['P1', 'P2'],
             t1=[('ORG-922', 100)]),
 'H10': dict(app='Machined/fabricated aluminum enclosure for industrial power electronics', weeks=4, prods=['P1'],
             t1=[('ORG-287', 100)]),
 'H20': dict(app='Thermal-management / liquid-cooling assembly for power electronics', weeks=6, prods=['P2', 'P3'],
             t1=[('ORG-786', 100)]),
 'B10': dict(app='Battery-monitoring/control PCBA with sensing and embedded electronics', weeks=12, prods=['P3'],
             t1=[('ORG-103', 80), ('ORG-176', 20)]),
}
REV = D['meta']['rev']
components = []
for cid, c in CMP.items():
    # tier-2 / tier-3 dependencies: any supplier whose chain reaches this component
    deps = sorted({sid for sid, s in D['sup'].items() if cid in s['comps'] and s['tiern'] > 1},
                  key=lambda k: D['sup'][k]['rank'])
    components.append(dict(id=cid, name=COMP_NAME[cid], app=c['app'], weeks=c['weeks'], prods=c['prods'],
                           rev=sum(REV[p] for p in c['prods']),
                           t1=[dict(id=i, share=p) for i, p in c['t1']], deps=deps))
# sanity: planning shares add to 100
for c in components: assert sum(t['share'] for t in c['t1']) == 100, c['id']

products = [dict(id=p, name=D['meta']['pname'][p], rev=REV[p],
                 comps=[c['id'] for c in components if p in c['prods']]) for p in ('P1', 'P2', 'P3')]
assert sum(p['rev'] for p in products) == 1560

# ---------------------------------------------------------------- Phase 2 sources (copied from the Phase 2 write-up; opened 3 Oct 2026)
ACCESSED = '2026-10-03'
SRC = [
 dict(id='TTM-1', co='TTM', title='Automotive capabilities', url='https://www.ttm.com/en/markets-we-serve/automotive/capabilities', supports='Heavy copper 2–12 oz, insulated metal substrates, "TS 16949" sites, named plants', pagedate=None),
 dict(id='TTM-2', co='TTM', title='Automotive applications', url='https://www.ttm.com/index.php/en/markets-we-serve/automotive/applications', supports='Electrified powertrain, charging stations, energy storage', pagedate=None),
 dict(id='TTM-3', co='TTM', title='Factsheet (May 2025)', url='https://www.ttm.com/sites/default/files/documents/20250530%20-%20TTM_Factsheet_2025.pdf', supports='22 factories, 16,000+ staff, USD 2.44bn sales, end-market shares, IATF 16949', pagedate='May 2025'),
 dict(id='INF-1', co='Infineon', title='SiC bare dies', url='https://www.infineon.com/products/power/mosfet/silicon-carbide/baredies', supports='CoolSiC bare dies are offered', pagedate=None),
 dict(id='INF-2', co='Infineon', title='Bare die product table', url='https://www.infineon.com/product-table/baredies', supports='SiC and IGBT bare dies, "automotive and industrial needs"', pagedate=None),
 dict(id='INF-3', co='Infineon', title='Kulim fab article (Semiconductor Today)', url='https://www.semiconductor-today.com/news_items/2024/aug/infineon-080824.shtml', supports='Investment of EUR 2bn and up to EUR 5bn, design wins of about EUR 5bn, Villach and Dresden', pagedate='8 Aug 2024'),
 dict(id='INF-4', co='Infineon', title='Dresden fab release (PR Newswire)', url='https://www.prnewswire.com/news-releases/infineon-opens-the-worlds-largest-fab-for-power-semiconductors-and-analogmixed-signal-technologies-in-dresden-302816962.html', supports='Dresden fab, EUR 5bn investment', pagedate=None),
 dict(id='INF-5', co='Infineon', title='FY2025 results release', url='https://www.infineon.com/row/public/documents/corporate/press/2025/infxx202511-021e.pdf', supports='Revenue EUR 14.662bn, Segment Result EUR 2.560bn', pagedate='Year to 30 Sep 2025'),
 dict(id='CER-1', co='CeramTec', title='Ceramic substrates', url='https://www.ceramtec-industrial.com/en/products-applications/substrates', supports='Al₂O₃, AlN, Si₃N₄, ZTA, DCB/AMB, industrial drives and e-mobility', pagedate=None),
 dict(id='CER-2', co='CeramTec', title='Power electronics news', url='https://www.ceramtec-group.com/en/news-events/news-overview/detail/ceramics-for-semiconductor-manufacturing-power-electronics', supports='Substrates for power electronics, made in Europe', pagedate='11 Aug 2026'),
 dict(id='CER-3', co='CeramTec', title='Worldwide sites', url='https://www.ceramtec-group.com/en/company/ceramtec-worldwide', supports='German sites plus UK, China, US', pagedate=None),
 dict(id='CER-4', co='CeramTec', title='Company facts', url='https://www.ceramtec-group.com/en/', supports='About 3,500 staff, about EUR 685m (2025), 18 sites', pagedate='2025 figures'),
 dict(id='TOR-1', co='Toray', title='Torayfan page', url='https://www.films.toray/en/products/torayfan/', supports='Capacitor applications, first made in Japan', pagedate=None),
 dict(id='TOR-2', co='Toray', title='Capacity expansion article (passive-components.eu)', url='https://passive-components.eu/toray-boosting-polypropylene-film-production-capacity-to-meet-growing-demand-for-automotive-capacitors/', supports='60% more capacity at Tsuchiura for automotive capacitor film, EV inverter use', pagedate='Expansion planned for 2022'),
 dict(id='TOR-3', co='Toray', title='Results summary (MarketScreener)', url='https://www.marketscreener.com/quote/stock/TORAY-INDUSTRIES-INC-6492027/news/Toray-Industries-Consolidated-Results-for-the-Fiscal-Year-Ended-March-2025-49938648/', supports='Revenue JPY 2,563.3bn, operating income JPY 127.5bn', pagedate='Year to Mar 2025'),
 dict(id='SCH-1', co='Schweizer', title='Sectors', url='https://schweizer.ag/en/sectors', supports='Battery management, e-mobility charging stations', pagedate=None),
 dict(id='SCH-2', co='Schweizer', title='Company facts', url='https://schweizer.ag/en/the-company', supports='2 plants, about 500 staff, IATF 16949 at both', pagedate=None),
 dict(id='SCH-3', co='Schweizer', title='PCB technologies', url='https://schweizer.ag/en/technologies-solutions/pcb-technologies', supports='Heavy copper, inlay boards, embedded chips; no assembly mentioned', pagedate=None),
]
for s in SRC:
    s['accessed'] = ACCESSED
    s['type'] = 'Claimed'  # company's own pages or reports of company statements; no independent source was checked

def R(r, note, src=()):
    assert r in ('Strong', 'Partial', 'Not shown')
    return dict(r=r, note=note, src=list(src))

ALT = [
 dict(id='ALT-TTM', name='TTM Technologies', short='TTM', replaces='ORG-453', role='Primary candidate',
      target='Circuit-board substrates for C10 (Cobalt) and B10 (Grove, HarborSense)', comps=['C10', 'B10'], weeks=12,
      weeks_note='12 weeks indicative qualification lead time for C10 and B10 (Components Context).',
      why='Strongest mix of fit, scale and spread among the candidates researched. Makes boards of this kind, including heavy-copper power boards, at plants in North America and Asia.',
      how='Would be qualified on both boards in about 12 weeks (indicative) and run alongside Jade.',
      ratings=dict(
        tech=R('Strong', 'Heavy copper (2–12 oz), insulated metal substrates, HDI, flex.', ['TTM-1']),
        app=R('Strong', 'Electrified powertrain, charging stations, energy storage.', ['TTM-2']),
        foot=R('Strong', '22 factories (16 North America, 6 Asia Pacific).', ['TTM-3']),
        scale=R('Strong', '16,000+ staff, USD 2.44bn sales (FY2024). Capacity for NovaDrive volumes: sourcing to validate.', ['TTM-3']),
        pres=R('Partial', 'Automotive is 13% of sales and medical/industrial/instrumentation 14%. No named customers.', ['TTM-3']),
        qual=R('Partial', 'IATF 16949 in its factsheet; "TS 16949" (the older name) on its automotive page. Certificate not checked.', ['TTM-1', 'TTM-3'])),
      financials='USD 2.44bn revenue (FY2024), 16,000+ staff. Profit signal not checked.',
      open=['Battery-monitoring-board capability needs validation: no TTM page names battery-monitoring boards.',
            'Spare capacity for three Tier-1s is unknown (no supplier volume in the data): sourcing to validate.',
            'Which plant would make the boards, and does that plant hold the IATF 16949 certificate? Certificate not checked.',
            'Exact C10 / B10 board specification: Jade substrates are program-specific (DOC-079).',
            'No named customers shown on the pages read.']),
 dict(id='ALT-SCH', name='Schweizer Electronic', short='Schweizer', replaces='ORG-453', role='Backup candidate',
      target='Circuit-board substrates for C10 and B10 (backup to TTM)', comps=['C10', 'B10'], weeks=12,
      weeks_note='12 weeks indicative qualification lead time for C10 and B10 (Components Context).',
      why='Backup to TTM: names battery management and charging stations and holds IATF 16949 at both plants, but has only 2 plants and about 500 staff.',
      how='Would be assessed only if TTM does not validate.',
      derived=True,
      ratings=dict(
        tech=R('Partial', 'PCB technologies include heavy copper, inlay boards and embedded chips. No assembly mentioned, so exact C10 / B10 capability is unproven.', ['SCH-3']),
        app=R('Strong', 'Lists "battery management" and "e-mobility charging stations". Relevant, to validate.', ['SCH-1']),
        foot=R('Partial', '2 plants (Germany and China): not widely spread.', ['SCH-2']),
        scale=R('Partial', 'About 500 staff and about 3,000 m² of production capacity per day. Enough? Sourcing to validate.', ['SCH-2']),
        pres=R('Not shown', 'Sectors are listed but no named customers or dated programs were captured.', ['SCH-1']),
        qual=R('Partial', 'IATF 16949 at both plants (company page). Certificate not checked.', ['SCH-2'])),
      financials='Not captured in Phase 2.',
      open=['Can it make the exact C10 / B10 board (assembly is not mentioned on the PCB technologies page)?',
            'Scale: about 500 staff and 2 plants. Is that enough for three Tier-1s?',
            'Named customers and dated programs not shown.']),
 dict(id='ALT-INF', name='Infineon', short='Infineon', replaces='ORG-439', role='Primary candidate',
      target='Power semiconductor dies for M10/M20 (Aster, Boreal)', comps=['M10', 'M20'], weeks=16,
      weeks_note='16 weeks indicative qualification lead time for M10 and M20 (Components Context).',
      why='Largest evidence of power-die capability, scale and plants in several places. Sells both SiC and IGBT dies.',
      how='Power modules would be re-qualified with Infineon dies (about 16 weeks, indicative). The fix has to be an independent die maker: a different module assembler does not help (DOC-078).',
      ratings=dict(
        tech=R('Strong', 'Lists SiC MOSFET and IGBT bare dies, plus modules.', ['INF-1', 'INF-2']),
        app=R('Strong', 'Dies for "automotive and industrial needs", with design wins in renewable and industrial.', ['INF-2', 'INF-3']),
        foot=R('Strong', 'Villach and Dresden (300mm), plus Kulim, Malaysia (200mm SiC).', ['INF-3', 'INF-4']),
        scale=R('Strong', 'Kulim EUR 2bn first phase, up to EUR 5bn second phase. FY2025 revenue EUR 14.662bn.', ['INF-3', 'INF-5']),
        pres=R('Strong', 'About EUR 5bn of design wins from six automotive OEMs plus renewable and industrial customers (Aug 2024).', ['INF-3']),
        qual=R('Not shown', 'Certificate page could not be read.', [])),
      financials='EUR 14.662bn revenue (FY2025, to 30 Sep 2025), down 2%. Segment Result EUR 2.560bn, 17.5% margin.',
      open=['Not a drop-in swap: modules would need re-qualifying with Infineon dies.',
            'Exact IonPeak die technology needs confirmation: the case data does not say whether the dies are SiC or IGBT.',
            "Check that Infineon's own inputs do not come from Z01 like IonPeak's (Umber, Verdant). Z01 is fictional, so this is a question to ask, not test.",
            'IATF 16949 certificate not shown: certificate page could not be read.',
            'Spare capacity for NovaDrive volumes: sourcing to validate.',
            'PolarSwitch is named in DOC-078 only as a "prospective alternative". Not in the Supplier Universe, not assessed, not qualified.']),
 dict(id='ALT-CER', name='CeramTec', short='CeramTec', replaces='ORG-708', role='Primary candidate',
      target='Ceramic substrates for M10/M20 (Aster, Boreal)', comps=['M10', 'M20'], weeks=16,
      weeks_note="16 weeks is the parent component's (M10/M20) figure, used as a stand-in. Not a figure for the ceramic substrate itself.",
      why='Makes the standard power-module ceramic substrate materials and has 18 sites across three regions.',
      how='A second substrate source qualified on the power assemblies, in about 16 weeks (parent component figure used as a stand-in).',
      ratings=dict(
        tech=R('Strong', 'Al₂O₃, AlN, Si₃N₄ and ZTA substrates, compatible with the standard copper-bonding processes (DCB/AMB) used on power modules.', ['CER-1']),
        app=R('Strong', 'Industrial drives, e-mobility, renewables.', ['CER-1']),
        foot=R('Partial', '18 sites in Europe, the USA and Asia, but the pages do not say which plants make substrates.', ['CER-3', 'CER-4']),
        scale=R('Strong', 'About 3,500 staff, about EUR 685m sales (2025).', ['CER-4']),
        pres=R('Partial', 'Sectors listed, no named customers.', ['CER-1', 'CER-2']),
        qual=R('Not shown', 'The pages read mention only RoHS.', ['CER-1'])),
      financials='About EUR 685m revenue (2025), about 3,500 staff. Profit signal not checked.',
      open=['Exact ceramic type and manufacturing plant require confirmation: the pages do not say which plant makes power-module substrates.',
            "The case data does not state the ceramic type Orion uses.",
            'Quality certificates not shown (only RoHS on the pages read).',
            "Orion's 16-week lead time is borrowed from the parent component (M10/M20).",
            'No named customers shown.']),
 dict(id='ALT-TOR', name='Toray', short='Toray', replaces='ORG-210', role='Primary candidate',
      target='Dielectric film for C20 capacitors (Delta Capacitor Works)', comps=['C20'], weeks=8,
      weeks_note='8 weeks indicative qualification lead time for C20 (Components Context).',
      why='Polypropylene capacitor film aimed at EV inverters, from a very large group, which suits backing up a financially stressed supplier.',
      how='A second film source qualified at Delta Capacitor Works, with about 8 weeks as the indicative figure for C20.',
      ratings=dict(
        tech=R('Strong', 'Torayfan polypropylene film, with capacity added for automotive capacitors.', ['TOR-1', 'TOR-2']),
        app=R('Strong', 'Film for capacitors in EV motor-inverter circuits.', ['TOR-2']),
        foot=R('Partial', 'Only the Tsuchiura plant (Japan) is named on the pages read.', ['TOR-1', 'TOR-2']),
        scale=R('Partial', 'A 60% capacity increase at Tsuchiura, with no volume figures.', ['TOR-2']),
        pres=R('Partial', 'Automotive capacitor use stated, no named customers.', ['TOR-2']),
        qual=R('Not shown', 'No quality certificate shown on the pages read.', [])),
      financials='JPY 2,563.3bn revenue (year to March 2025), up 4.0%. Operating income JPY 127.5bn, up 121.1% (about 5% of revenue). Balance sheet not checked.',
      open=['Exact film specification and plant require validation: only one plant is named on the pages read.',
            "The case data does not say which film material Meridian makes. Polypropylene is a team assumption because C20 is a film capacitor.",
            'Quality certificates not shown.',
            "The capacity-expansion article is dated 'planned for 2022'. Check it is still current.",
            "Toray's balance sheet has not been checked."]),
]
# Phase 2 left PolarSwitch un-assessed: it appears only as a named prospect in DOC-078.
PROSPECT = dict(name='PolarSwitch', replaces='ORG-439', source='DOC-078',
                text='Named in DOC-078 only as "a prospective alternative". Not in the Supplier Universe, not assessed, not qualified (U8).')

# the six factors, as used in the Phase 2 ratings
FACTORS = [dict(k='tech', n='Technical capability', q='Can they make the exact item?'),
           dict(k='app', n='Application relevance', q='Do they already serve this kind of industry?'),
           dict(k='foot', n='Manufacturing footprint', q='Plants in several regions? ("Outside Z01" cannot be tested: Z01 is fictional.)'),
           dict(k='scale', n='Scale', q='Plausible for the volume? The data has no supplier volume, so this is always "sourcing to validate".'),
           dict(k='pres', n='Industry presence', q='Named customers or programs, with dates?'),
           dict(k='qual', n='Qualification', q='Quality certificates, and which plants hold them?')]

# ---------------------------------------------------------------- assumptions
ASSUMPTIONS = [
 dict(id='A1', t='Planning allocation is not purchase history', d='Allocation shares (Aster 60 / Boreal 40 for M10; Aster 70 / Boreal 30 for M20; Grove 80 / HarborSense 20 for B10; 100% for the rest) are disclosed planning allocations. The data holds no supplier spend or purchase orders.', src='DOC-001 to DOC-019 (U7)'),
 dict(id='A2', t='USD 1.56B is product revenue, not supplier spend', d='USD 1,560m = P1 624 + P2 520 + P3 416, the annual revenue of the products that depend on the IonPeak die source. It is shown as context only. It is not supplier spend, procurement spend or revenue at risk.', src='Business Context sheet'),
 dict(id='A3', t='Event severity levels are assumptions', d='Zone-level watch = 40, supplier-specific adverse report = 60, confirmed disruption = 100. The data gives no severity scale. Only the first two are used.', src='Scorecard v2 · Scales'),
 dict(id='A4', t='Single-source levels are assumptions', d='100 = data shows no alternative (sole Tier-1 at 100%, or an explicit "no second source"). 50 = no alternative stated, or one parent. 0 = a second independent Tier-1 is disclosed.', src='Scorecard v2 · Method'),
 dict(id='A5', t='Risk bands are relative', d='High = top third of the 24 suppliers, Medium = middle third, Low = bottom third (cut-offs 54.3 and 41.5). Suppliers within about 1 point of a cut-off could flip.', src='Scorecard v2 · Scales'),
 dict(id='A6', t='Confidence is separate from risk', d='Confidence = the lower of link evidence (High = 2+ independent source families, Medium = one, Low = inferred) and data completeness (High only if all 8 indicator fields are present). It never changes the risk %.', src='Scorecard v2 · Method'),
 dict(id='A7', t='Missing data raises risk, it never lowers it', d='D6 scores missing assurance and missing indicator fields as risk. Tier-3 suppliers have no financial data, so their scores are pushed up. Read their rank together with Confidence.', src='Scorecard v2 · Method'),
 dict(id='A8', t='Qualification lead times are indicative', d='M10 16, M20 16, C10 12, C20 8, H10 4, H20 6, B10 12 weeks (Components Context). CeramTec/Orion uses the parent component figure of 16 weeks as a stand-in.', src='Components Context'),
 dict(id='A9', t='Zones are fictional; the map is an illustrative layout', d='Only Z01 is named (East Delta, DOC-077). Zones Z02–Z08 have no names in the data. The India outline places the zones for orientation only and does not claim real geography.', src='DOC-077'),
 dict(id='A10', t='Real alternates are shortlisted candidates, not approved replacements', d='Every alternate rating is a company claim from public pages opened on 3 Oct 2026. No independent source (certificate database, filing, customer announcement) was checked. Real companies are not proof of the fictional incumbent network.', src='Phase 2 research'),
 dict(id='A11', t='"Outside Z01" cannot be tested for real companies', d='Z01 is fictional, so footprint is judged by plant spread across regions.', src='Phase 2 research'),
 dict(id='A12', t='Scenario Lab is a rule-based simulation', d='It follows confirmed and inferred links in the data. It does not estimate lost revenue, inventory buffers, recovery curves or the capacity of other suppliers, because none are in the data.', src='Lighthouse logic'),
 dict(id='A13', t='Action labels are a Lighthouse rule set', d='High band + Low confidence or an inferred link → VERIFY FIRST. High band + High confidence → SEARCH ALTERNATE. High band + Medium confidence → QUALIFY / VALIDATE, or REVIEW / ACCELERATE when a supplier-specific event is matched. Medium band → MONITOR and prepare shortlist. Low band → MONITOR.', src='Scorecard v2 next steps, refined by Lighthouse'),
 dict(id='A14', t='Deeper tiers are not assumed', d='No evidence describes who supplies the Tier-3 suppliers or Lumen, Kestrel, Nacre, Pine, Rill and Quartz, so every chain stops there (U5). "No backup disclosed" never means "no backup exists".', src='U4, U5'),
 dict(id='A15', t='Two hypotheses are not in the network', d='Solace Optics → Grove (sample evaluation only, U2) and Alder Bauxite → Quartz (trade-directory co-membership, U3) are held as hypotheses. They are not scored.', src='DOC-085, DOC-074, DOC-086'),
 dict(id='A16', t='Schweizer ratings are derived', d='The Phase 2 write-up gave a six-factor table for the four primary candidates. Schweizer was assessed in prose only, so its six ratings here are Lighthouse-derived from that prose and marked as such.', src='Phase 2 research'),
]

out = dict(
    sup=D['sup'], links=D['links'], ev=D['ev'], events=D['events'], zidx=D['zidx'], nonnet=D['nonnet'], meta=D['meta'],
    shared=shared, rejected=rejected, unresolved=unresolved,
    components=components, products=products,
    alt=ALT, prospect=PROSPECT, factors=FACTORS, srcs=SRC, assumptions=ASSUMPTIONS,
    geo=GEO, accessed=ACCESSED,
    built='2026-10-04',
)
js = 'window.LH_DATA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(ROOT, 'assets/data.js'), 'w', encoding='utf-8').write(js)
print('assets/data.js', len(js) // 1024, 'KB', 'sup', len(out['sup']), 'links', len(out['links']), 'alt', len(ALT))
