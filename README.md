# Project LIGHTHOUSE

A supplier-risk and sourcing decision tool for NovaDrive's CRO. I built it for the NovaDrive case competition, so everything in here runs on the fictional case data. No real companies, no real numbers.

It's deliberately simple: plain HTML, CSS and JavaScript. No framework, no build step, no server. All the data lives in one bundled file (`assets/data.js`) and nothing ever gets sent anywhere.

## What you can do in it

- **Overview** – the big picture first
- **Network Explorer** – the supply network as a map, by component, or by zone
- **Supplier 360** – everything we know about one supplier on a single page
- **Risk Intelligence** – where the risk actually sits and what to do about it
- **External Risk Intelligence** – outside events that could hit the network
- **Alternate Supplier Intelligence** – shortlisted backup suppliers and how well they fit
- **Scenario Lab** – "what if this supplier goes down?" simulations
- **Evidence Center** – the sources behind the numbers
- **Methodology** and **Help** – how scoring works and how to use the app

There's also an **Ask Lighthouse** panel for quick questions, and a short welcome tour the first time you open the app.

## Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Double-clicking `index.html` usually works too, but if something looks off, use the server.

## Deploy it on Vercel

There are three ways to do it. All of them need zero configuration. No build command, no environment variables. `vercel.json` already handles the output directory, security headers and asset caching.

**Vercel CLI**

```
npm i -g vercel
cd novadrive_lighthouse
vercel            # preview deploy, accept the defaults (Framework: Other, no build command)
vercel --prod     # production
```

**Import from GitHub**

1. Push this folder to a GitHub repo, with these files at the repo root.
2. On vercel.com, go to Add New → Project and import the repo.
3. Set Framework Preset to **Other**, leave Build Command empty, and keep Output Directory as `.` (it's already set in `vercel.json`).
4. Deploy.

**Drag and drop**

Go to vercel.com/new and drop the unzipped folder in.

GitHub Pages works as well. Serve the folder root as is. Routing uses `#/...` hashes, so you don't need any rewrite rules.

## How the folder is laid out

```
index.html            app shell
assets/data.js        generated data bundle (suppliers, links, events, alternates, evidence, assumptions)
assets/logic.js       risk actions, impact propagation, scenario and sensitivity logic (no DOM)
assets/ui.js          UI kit, router, search, tooltips, cross-filter context
assets/p_*.js         one file per screen; p_ask.js is Ask Lighthouse; boot.js starts everything up
assets/styles.css     design system
build/                Python that regenerates assets/data.js from data/ and source_inputs/
data/, source_inputs/ where the numbers came from: scorecard v2 export, tiering workbook, geometry
```

If you change anything in the source files, rebuild the data bundle:

```
python3 build/build_lighthouse_data.py
```

## Read this before you present it

A few things that are easy to misread, so better to say them up front:

- **Scores come from scorecard v2.** Jade 69.0, IonPeak 65.3, Orion 57.5, Meridian 57.4. Confidence never changes a risk percentage.
- **USD 1.56B is not supplier spend, and it's not revenue at risk.** It's NovaDrive's annual *product revenue* that sits behind the IonPeak dependency.
- **Alternates are shortlisted candidates, not recommendations.** Every fit rating is company-claimed, pulled from public pages, and still needs sourcing and engineering validation. Schweizer's six factor ratings are my own reading of the Phase 2 write-up (flagged as A16), and Orion/CeramTec's 16 weeks is a stand-in taken from the parent component.
- **The India zone map is illustrative.** Zones Z01 to Z08 are made up. Only Z01 "East Delta" is actually named in the case.
- **Scenario Lab runs simulations, not real events.** It doesn't model inventory, recovery time or lost revenue.
- **Ask Lighthouse isn't a live language model.** It answers a fixed set of question types using the same data and logic as the rest of the app.
- **Action labels are a refinement of the scorecard's "next step".** For example, "Search alternate now" gets split into SEARCH ALTERNATE, REVIEW, QUALIFY or VERIFY FIRST. The original next step is still visible under "Why this action?".

## Architecture

[![Architecture diagram of prakharyadav2006/novadrive](https://gitdiagram.com/prakharyadav2006/novadrive/diagram.png)](https://gitdiagram.com/prakharyadav2006/novadrive?utm_source=readme&utm_medium=picture)
