# DPC Impact Hub

**Weston College Group · Digital Pedagogy Coach · 2025–27 Pilot**

A password-protected, browser-based tracking tool for the Digital Pedagogy Coach programme.
Hosted on GitHub Pages. All live data stays in your browser — nothing sensitive is stored in this repository.

---

## Initial setup

### 1. Set your password

Generate a SHA-256 hash of your chosen password at:
**https://emn178.github.io/online-tools/sha256.html**

Open `index.html`, find this line near the bottom:

```js
const PASSWORD_HASH = '7a0bc2e07c5d4b3a...';
```

Replace the hash string with your own. Push to GitHub.

### 2. First load

Open `https://gwc25.github.io/dpc-impact-hub/` and sign in.

The hub loads from `localStorage`. On first visit with no existing data it reads from `data/areas-seed.json` to pre-populate all 35 areas. After that first load the seed file is no longer used.

---

## Removing the seed data from GitHub

`data/areas-seed.json` contains HoA names, Digital Lead names, and meeting notes.
Once you have loaded the hub and verified your data is in the browser, you can remove it:

```bash
# In your local repo:
git rm data/areas-seed.json
git commit -m "Remove seed data after initial load"
git push
```

**Before you do this:**
1. Open the hub and click **⬇ Save** to download `dpc-data.json`
2. Confirm your data loads correctly (open Settings → Import → pick the file → verify)
3. Then delete from GitHub

After deletion, the hub will start fresh for any new browser/device — use the Import function in Settings to restore from your backup file.

---

## Daily backup workflow

The hub autosaves to your browser (`localStorage`) every 90 seconds, on tab close, and when your laptop lid closes.

To create a local backup:

1. Click **⬇ Save** in the top bar
2. `dpc-data.json` downloads to your Downloads folder
3. Move it to `Documents/DPC-Hub-Data/dpc-data.json` (replace previous backup)

**To restore** (new machine, new browser, or cleared cache):

1. Open the hub and sign in
2. Go to **Settings → Import dpc-data.json**
3. Pick your backup file → all data restores instantly

---

## File structure

```
dpc-impact-hub/
├── index.html          ← Password gate
├── hub.html            ← Full application shell
├── css/design.css      ← All styles (WCAG 2.2 AA, light + dark)
├── js/
│   ├── data.js         ← DB schema, localStorage, seed loading
│   ├── rag.js          ← 8-dimension RAG matrix with full criteria
│   ├── areas.js        ← Area tabs: Overview, Activity, Interventions, RAG, Skills, Health Checks
│   └── app.js          ← Navigation, LWB, Individual Activities, My CPD, Settings
├── data/
│   ├── areas-seed.json ← Initial area data (remove after first load — see above)
│   └── rag-schema.json ← 8-dimension framework with full level descriptors
└── README.md
```

---

## What is NOT in this repo

- Live coaching data (`dpc-data.json` — stays in your browser and local backup folder)
- Your password in plain text (only a SHA-256 hash is stored here)
- Any learner data, assessment records, or personal information

---

## WCAG 2.2 AA

All components meet WCAG 2.2 AA as a minimum. Light and dark mode supported via CSS custom properties with verified contrast ratios throughout.

---

*Graeme Wright · Digital Pedagogy Coach · Weston College Group*
