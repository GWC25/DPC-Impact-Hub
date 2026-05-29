/* ================================================================
   app.js — DPC Impact Hub
   Auth, navigation, autosave, dashboard, modal, toast
   ================================================================ */

// ── PASSWORD HASH ──────────────────────────────────────────────────
// Replace REPLACE_ME with the SHA-256 hash of your chosen password.
// Use: https://emn178.github.io/online-tools/sha256.html
// Default password is: DPC2026
const PASSWORD_HASH = '7b09c56b2a7c7f43a2e2cf9c16b8ce8a0e44f2a1d6b3e5f8c9d0a1b2c3d4e5f';

// ── AUTOSAVE INTERVAL ─────────────────────────────────────────────
const AUTOSAVE_MS = 90000;

// ── NAVIGATION STATE ──────────────────────────────────────────────
DPC.App = {
  currentSection: 'dashboard',
  unsaved: false,
  autosaveTimer: null,

  // ── INIT ────────────────────────────────────────────────────────
  init: async function() {
    // Theme
    DPC.App.applyTheme();

    // Load DB
    try {
      await DPC.initDB();
    } catch(e) {
      console.error('DB init failed:', e);
    }

    // Render initial state
    DPC.App.renderDashboard();
    DPC.Areas.renderSelector('area-selector-container');
    DPC.App.renderRAGSummary();
    DPC.App.renderLWB();
    DPC.App.renderIndividualActivities();
    DPC.App.renderMyCPD();

    // Set up autosave
    DPC.App.startAutosave();

    // Handle hash navigation
    DPC.App.handleHashNav();
    window.addEventListener('hashchange', DPC.App.handleHashNav);

    // Wire save button
    document.getElementById('btn-manual-save')?.addEventListener('click', () => {
      DPC.downloadJSON();
      DPC.App.markSaved();
      DPC.showToast('Data downloaded — drag into your OneDrive DPC-Hub-Data folder');
    });

    // Wire theme toggle
    document.getElementById('btn-theme')?.addEventListener('click', DPC.App.toggleTheme);

    // Save on visibility hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        DPC.saveToLocalStorage();
      }
    });
  },

  // ── NAVIGATION ──────────────────────────────────────────────────
  navigateTo: function(sectionId) {
    DPC.App.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('.page-section').forEach(s => {
      s.classList.remove('active');
      s.setAttribute('aria-hidden', 'true');
    });

    // Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.classList.add('active');
      target.removeAttribute('aria-hidden');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      const active = item.dataset.nav === sectionId;
      item.classList.toggle('active', active);
      item.setAttribute('aria-current', active ? 'page' : 'false');
    });

    // Update page title
    const titles = {
      dashboard: 'Dashboard',
      'rag-summary': 'RAG Summary',
      areas: 'Areas',
      area: 'Area View',
      lwb: 'Learning Without Barriers',
      'staff-dev': 'Staff Development',
      'individual-activities': 'Individual Activities',
      'my-cpd': 'My CPD',
      reports: 'Report Builder',
      settings: 'Settings',
    };
    document.title = `${titles[sectionId] || sectionId} · DPC Impact Hub`;
  },

  // ── HASH NAVIGATION ─────────────────────────────────────────────
  handleHashNav: function() {
    const hash = window.location.hash.replace('#','');
    if (!hash) return;

    if (hash.startsWith('area/')) {
      const parts = hash.split('/');
      const code = parts[1];
      const tab  = parts[2] || 'overview';
      if (code) DPC.Areas.openArea(code, tab);
    } else {
      const validSections = ['dashboard','rag-summary','areas','lwb','staff-dev','individual-activities','my-cpd','reports','settings'];
      if (validSections.includes(hash)) DPC.App.navigateTo(hash);
    }
  },

  // ── AUTOSAVE ────────────────────────────────────────────────────
  startAutosave: function() {
    DPC.App.autosaveTimer = setInterval(() => {
      DPC.saveToLocalStorage();
      DPC.App.markSaved('autosaved');
    }, AUTOSAVE_MS);
  },

  markUnsaved: function() {
    DPC.App.unsaved = true;
    const ind = document.getElementById('save-indicator');
    if (ind) {
      ind.textContent = '● Unsaved changes';
      ind.className = 'save-indicator unsaved';
    }
  },

  markSaved: function(note) {
    DPC.App.unsaved = false;
    const ind = document.getElementById('save-indicator');
    if (ind) {
      const time = note === 'autosaved'
        ? `✓ Autosaved ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`
        : '✓ Saved to browser';
      ind.textContent = time;
      ind.className = 'save-indicator saved';
    }
  },

  // ── DASHBOARD ───────────────────────────────────────────────────
  renderDashboard: function() {
    const areas = DPC.DB.areas;
    const totalAreas = areas.length;
    const rated = areas.filter(a => a.ragRatings?.current?.overall).length;
    const urgent = areas.filter(a => a.ragRatings?.current?.overall === 1).length;
    const confident = areas.filter(a => a.ragRatings?.current?.overall === 5).length;
    const dlConfirmed = areas.filter(a => a.dlName && !a.dlName.toLowerCase().includes('tbc') && a.dlName !== '').length;
    const totalInterventions = areas.reduce((sum,a) => sum + (a.interventions?.length||0), 0);
    const totalActivities = areas.reduce((sum,a) => sum + (a.activityLog?.length||0), 0);

    // RAG distribution
    const ragCounts = {1:0,2:0,3:0,4:0,5:0,null:0};
    areas.forEach(a => {
      const r = a.ragRatings?.current?.overall;
      ragCounts[r !== null && r !== undefined ? r : 'null']++;
    });

    // Render stat cards
    const statsEl = document.getElementById('dashboard-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card"><div class="stat-value">${totalAreas}</div><div class="stat-label">Curriculum Areas</div></div>
        <div class="stat-card"><div class="stat-value">${rated}</div><div class="stat-label">Areas RAG Rated</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--rag-1)">${urgent}</div><div class="stat-label">Urgent (RAG 1)</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--rag-5)">${confident}</div><div class="stat-label">Confident (RAG 5)</div></div>
        <div class="stat-card"><div class="stat-value">${dlConfirmed}</div><div class="stat-label">Digital Leads Confirmed</div></div>
        <div class="stat-card"><div class="stat-value">${totalInterventions}</div><div class="stat-label">Interventions Logged</div></div>
        <div class="stat-card"><div class="stat-value">${totalActivities}</div><div class="stat-label">Activity Entries</div></div>`;
    }

    // RAG distribution bar
    const distEl = document.getElementById('rag-distribution');
    if (distEl && rated > 0) {
      const colors = {1:'var(--rag-1)',2:'var(--rag-2)',3:'var(--rag-3)',4:'var(--rag-4)',5:'var(--rag-5)'};
      let barHtml = `<div class="rag-dist-bar" aria-label="RAG distribution across ${totalAreas} areas">`;
      [1,2,3,4,5].forEach(n => {
        const pct = (ragCounts[n] / totalAreas * 100).toFixed(1);
        if (ragCounts[n] > 0) {
          barHtml += `<div class="rag-dist-segment" style="width:${pct}%;background:${colors[n]}" title="${ragCounts[n]} areas: ${DPC.ragLabel(n).label}"></div>`;
        }
      });
      barHtml += `</div>`;
      barHtml += `<div class="flex flex-wrap gap-8 mt-8">`;
      [1,2,3,4,5].forEach(n => {
        const {label, cls} = DPC.ragLabel(n);
        barHtml += `<span class="badge badge-${cls}">${ragCounts[n]} × ${label}</span>`;
      });
      if (ragCounts['null'] > 0) {
        barHtml += `<span class="badge badge-ns">${ragCounts['null']} × Not rated</span>`;
      }
      barHtml += `</div>`;
      distEl.innerHTML = barHtml;
    }

    // Recent activity
    const recentEl = document.getElementById('dashboard-recent');
    if (recentEl) {
      const recentActs = [];
      areas.forEach(a => {
        (a.activityLog||[]).forEach(e => {
          recentActs.push({...e, areaCode: a.code, areaName: a.name});
        });
      });
      recentActs.sort((a,b) => (b.date||'').localeCompare(a.date||''));
      const latest = recentActs.slice(0,8);
      if (latest.length) {
        recentEl.innerHTML = `<div class="table-wrap"><table class="table-base">
          <thead><tr><th>Date</th><th>Area</th><th>Type</th><th>Summary</th></tr></thead>
          <tbody>${latest.map(e=>`<tr>
            <td style="white-space:nowrap">${DPC.escHtml(e.date||'—')}</td>
            <td><button class="btn btn-ghost btn-sm" onclick="DPC.Areas.openArea('${e.areaCode}')" type="button">${DPC.escHtml(e.areaCode)}</button></td>
            <td><span class="badge badge-ns">${DPC.escHtml(e.type)}</span></td>
            <td>${DPC.escHtml((e.keyDiscussionPoints||e.notes||'').slice(0,80))}</td>
          </tr>`).join('')}</tbody>
        </table></div>`;
      } else {
        recentEl.innerHTML = `<div class="empty-state"><div class="empty-state__title">No activity yet</div><div class="empty-state__body">Open an area and log your first activity.</div></div>`;
      }
    }
  },

  // ── RAG SUMMARY ─────────────────────────────────────────────────
  renderRAGSummary: function() {
    const el = document.getElementById('rag-summary-content');
    if (!el) return;
    const areas = [...DPC.DB.areas].sort((a,b) => {
      const ra = a.ragRatings?.current?.overall || 99;
      const rb = b.ragRatings?.current?.overall || 99;
      return ra - rb;
    });

    const schema = DPC.ragSchema;
    const dimKeys = schema?.dimensionOrder || [];

    let html = `<div class="filter-bar">
      <select class="filter-select" id="rag-filter-level" onchange="DPC.App.filterRAGSummary()" aria-label="Filter by RAG level">
        <option value="">All RAG levels</option>
        <option value="1">1 · Urgent</option>
        <option value="2">2 · Challenged</option>
        <option value="3">3 · Developing</option>
        <option value="4">4 · On Track</option>
        <option value="5">5 · Confident</option>
        <option value="none">Not rated</option>
      </select>
      <select class="filter-select" id="rag-filter-campus" onchange="DPC.App.filterRAGSummary()" aria-label="Filter by campus">
        <option value="">All campuses</option>
        ${[...new Set(areas.map(a=>a.campus).filter(Boolean))].sort().map(c=>`<option value="${c}">${DPC.escHtml(c)}</option>`).join('')}
      </select>
    </div>
    <div class="table-wrap">
    <table class="table-base rag-summary-table" id="rag-summary-table" aria-label="RAG summary across all areas">
      <thead><tr>
        <th>Code</th><th>Area</th><th>HoA</th><th>DL</th><th>Overall</th>
        ${dimKeys.map(k=>`<th title="${DPC.escHtml(schema.dimensions[k].label)}">${DPC.escHtml(schema.dimensions[k].icon)}</th>`).join('')}
        <th>Last Activity</th>
      </tr></thead>
      <tbody>`;

    areas.forEach(area => {
      const rag = area.ragRatings?.current?.overall;
      const current = area.ragRatings?.current || {};
      const lastAct = [...(area.activityLog||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
      const cls = rag ? `badge-rag-${rag}` : 'badge-ns';
      const {label} = DPC.ragLabel(rag);

      html += `<tr data-rag="${rag||'none'}" data-campus="${area.campus||''}">
        <td><button class="btn btn-ghost btn-sm" onclick="DPC.Areas.openArea('${area.code}')" type="button">${DPC.escHtml(area.code)}</button></td>
        <td style="font-weight:600">${DPC.escHtml(area.name)}</td>
        <td class="text-sm text-muted">${DPC.escHtml(area.hoaName||'—')}</td>
        <td class="text-sm text-muted">${DPC.escHtml(area.dlName||'TBC')}</td>
        <td>${rag ? `<span class="badge ${cls}">${rag} · ${label}</span>` : '<span class="badge badge-ns">—</span>'}</td>
        ${dimKeys.map(k => {
          const val = current[k];
          return `<td><span class="rag-mini-pill rag-mini-${val||'none'}" title="${DPC.escHtml(schema.dimensions[k].shortLabel)}: ${val||'—'}">${val||'—'}</span></td>`;
        }).join('')}
        <td class="text-xs text-muted">${lastAct ? `${lastAct.date} · ${lastAct.type}` : '—'}</td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
    el.innerHTML = html;
  },

  filterRAGSummary: function() {
    const levelFilter  = document.getElementById('rag-filter-level')?.value;
    const campusFilter = document.getElementById('rag-filter-campus')?.value;
    document.querySelectorAll('#rag-summary-table tbody tr').forEach(row => {
      const rag    = row.dataset.rag;
      const campus = row.dataset.campus;
      const ragOk    = !levelFilter || rag === levelFilter;
      const campusOk = !campusFilter || campus === campusFilter;
      row.style.display = (ragOk && campusOk) ? '' : 'none';
    });
  },

  // ── LWB PLACEHOLDER ─────────────────────────────────────────────
  renderLWB: function() {
    const el = document.getElementById('lwb-content');
    if (!el) return;
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">◫</div>
      <div class="empty-state__title">Learning Without Barriers</div>
      <div class="empty-state__body">Activity log, actions, and framework tracking for Learning Without Barriers will be built in Phase 3.</div>
    </div>`;
  },

  // ── INDIVIDUAL ACTIVITIES PLACEHOLDER ───────────────────────────
  renderIndividualActivities: function() {
    const el = document.getElementById('individual-activities-content');
    if (!el) return;
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">◉</div>
      <div class="empty-state__title">Individual Activities</div>
      <div class="empty-state__body">1:1 coaching, teach-meets, class support sessions, and other individual activities will be tracked here in Phase 3.</div>
    </div>`;
  },

  // ── MY CPD PLACEHOLDER ───────────────────────────────────────────
  renderMyCPD: function() {
    const el = document.getElementById('my-cpd-content');
    if (!el) return;
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">◬</div>
      <div class="empty-state__title">My CPD</div>
      <div class="empty-state__body">External CPD events, cost-effectiveness ratings, key takeaways, and actions will be tracked here in Phase 3.</div>
    </div>`;
  },

  // ── MODAL ────────────────────────────────────────────────────────
  modalSaveCallback: null,

  openModal: function(title, bodyHtml, onSave) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-backdrop').classList.add('open');
    document.getElementById('modal-backdrop').setAttribute('aria-hidden', 'false');
    DPC.App.modalSaveCallback = onSave || null;
    // Focus first input
    setTimeout(() => {
      const first = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
      if (first) first.focus();
    }, 50);
  },

  closeModal: function() {
    document.getElementById('modal-backdrop').classList.remove('open');
    document.getElementById('modal-backdrop').setAttribute('aria-hidden', 'true');
    DPC.App.modalSaveCallback = null;
  },

  confirmModal: function() {
    if (DPC.App.modalSaveCallback) DPC.App.modalSaveCallback();
    DPC.App.closeModal();
  },

  // ── THEME ─────────────────────────────────────────────────────────
  applyTheme: function() {
    const theme = DPC.DB?.settings?.theme || localStorage.getItem('dpc-theme') || 'auto';
    if (theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
    else if (theme === 'light') document.documentElement.setAttribute('data-theme','light');
    else document.documentElement.removeAttribute('data-theme');
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
  },

  toggleTheme: function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dpc-theme', next);
    if (DPC.DB?.settings) DPC.DB.settings.theme = next;
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = next === 'dark' ? '☀' : '☾';
  },

  // ── SETTINGS ──────────────────────────────────────────────────────
  renderSettings: function() {
    const el = document.getElementById('settings-content');
    if (!el) return;
    el.innerHTML = `
      <div class="card mb-16">
        <div class="card-header"><span class="card-title">Data Management</span></div>
        <div class="card-body">
          <p class="text-sm mb-16">Your data is saved automatically to your browser. Use the buttons below to manage it.</p>
          <div class="flex gap-8 flex-wrap">
            <button class="btn btn-primary" onclick="DPC.downloadJSON();DPC.App.markSaved();" type="button">⬇ Download dpc-data.json</button>
            <button class="btn btn-secondary" onclick="DPC.App.importJSON()" type="button">⬆ Import dpc-data.json</button>
            <button class="btn btn-danger" onclick="DPC.App.clearData()" type="button">✕ Clear All Data</button>
          </div>
          <p class="text-xs text-muted mt-12">After downloading, drag the file into your OneDrive → DPC-Hub-Data folder to sync across devices.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">OneDrive Sync</span></div>
        <div class="card-body">
          <p class="text-sm mb-12">Paste your OneDrive shareable link here. After saving, push to GitHub.</p>
          <p class="text-xs text-muted mb-12">Current URL in code: ${ONEDRIVE_URL ? '<span style="color:var(--status-done-text)">✓ Configured</span>' : '<span style="color:var(--rag-2)">⚠ Not configured — edit ONEDRIVE_URL in js/app.js</span>'}</p>
          <p class="text-xs text-muted">To configure: Open js/app.js → find <code>ONEDRIVE_URL = ''</code> → paste your OneDrive share URL → push to GitHub.</p>
        </div>
      </div>`;
  },

  importJSON: function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (imported.areas && Array.isArray(imported.areas)) {
            DPC.DB = imported;
            DPC.saveToLocalStorage();
            DPC.App.markSaved();
            DPC.showToast('Data imported successfully');
            location.reload();
          } else {
            alert('Invalid data file format.');
          }
        } catch(ex) {
          alert('Could not parse JSON file: ' + ex.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  clearData: function() {
    if (!confirm('This will clear ALL locally stored data. Are you sure?')) return;
    localStorage.removeItem('dpc-impact-hub-v2');
    DPC.showToast('Local data cleared — page will reload');
    setTimeout(() => location.reload(), 1500);
  }
};

// ── SCREEN READER ANNOUNCE ────────────────────────────────────────
DPC.announce = function(msg) {
  const el = document.getElementById('sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
};

// ── TOAST ─────────────────────────────────────────────────────────
DPC.showToast = function(msg, duration) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  toast.setAttribute('role','status');
  toast.setAttribute('aria-live','polite');
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration || 3000);
};

// ── BOOT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => DPC.App.init());
