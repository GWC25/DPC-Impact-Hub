/* ================================================================
   rag.js — DPC Impact Hub
   RAG matrix render, click handlers, scoring, history
   ================================================================ */

DPC.RAG = {

  // ── RENDER MATRIX ──────────────────────────────────────────────
  render: function(areaCode, containerId) {
    const area = DPC.getArea(areaCode);
    const schema = DPC.ragSchema;
    if (!area || !schema) return;

    const current = area.ragRatings.current;
    const el = document.getElementById(containerId);
    if (!el) return;

    const dims = schema.dimensionOrder;

    let html = `<div class="rag-matrix" role="grid" aria-label="8-dimension RAG rating matrix for ${DPC.escHtml(area.name)}">`;

    // Header row
    html += `<div class="rag-matrix-row" role="row">
      <div class="rag-dim-label" role="columnheader" aria-label="Dimension"></div>
      <div class="rag-cells" role="columnheader">
        <div class="rag-cells-inner">`;
    [1,2,3,4,5].forEach(n => {
      const lvl = schema.scale[n];
      html += `<div class="rag-cell" role="columnheader" aria-label="Level ${n}: ${lvl.label}" style="font-weight:700;cursor:default;background:var(--col-surface-2)">
        <span class="rag-cell__level">${n}</span>
        <span class="rag-cell__label">${lvl.label}</span>
      </div>`;
    });
    html += `</div></div></div>`;

    // Dimension rows
    dims.forEach(key => {
      const dim = schema.dimensions[key];
      const selectedLevel = current[key];

      html += `<div class="rag-matrix-row" role="row">
        <div class="rag-dim-label" role="rowheader">
          <span class="rag-dim-icon" aria-hidden="true">${dim.icon}</span>
          ${DPC.escHtml(dim.shortLabel)}
        </div>
        <div class="rag-cells" role="gridcell">
          <div class="rag-cells-inner">`;

      [1,2,3,4,5].forEach(n => {
        const isSelected = selectedLevel === n;
        const lvl = schema.scale[n];
        const levelDesc = dim.levels[n];
        html += `<button
          class="rag-cell${isSelected ? ' selected-'+n : ''}"
          data-dim="${key}"
          data-level="${n}"
          data-area="${areaCode}"
          aria-pressed="${isSelected}"
          aria-label="${dim.label}: Level ${n} – ${lvl.label}. ${levelDesc}"
          title="${levelDesc}"
          type="button">
          <span class="rag-cell__level" aria-hidden="true">${n}</span>
          ${isSelected ? '' : `<span class="rag-cell__label" aria-hidden="true">${lvl.label}</span>`}
        </button>`;
      });

      html += `</div></div></div>`;
    });

    html += `</div>`;

    // Overall score display
    const overall = current.overall;
    const {label, cls} = DPC.ragLabel(overall);
    html += `<div class="mt-16 flex items-center gap-12 flex-wrap">
      <div>
        <div class="text-xs text-muted" style="margin-bottom:4px">Overall RAG (weighted)</div>
        ${DPC.ragBadge(overall)}
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-save-rag-${areaCode}" type="button">
        Save Rating Snapshot
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-view-rag-history-${areaCode}" type="button">
        View History
      </button>
    </div>`;

    // Sub-criteria tooltip reference
    html += `<div class="mt-12">
      <button class="collapsible-trigger" aria-expanded="false" aria-controls="rag-sub-${areaCode}" type="button">
        Sub-criteria reference <span class="chevron" aria-hidden="true">▾</span>
      </button>
      <div class="collapsible-body" id="rag-sub-${areaCode}" role="region">
        <div class="mt-8" style="font-size:var(--text-xs);color:var(--col-text-2);">`;
    dims.forEach(key => {
      const dim = schema.dimensions[key];
      html += `<div style="margin-bottom:8px">
        <strong>${dim.icon} ${dim.shortLabel}:</strong> ${dim.subCriteria.join(' · ')}
      </div>`;
    });
    html += `</div></div></div>`;

    el.innerHTML = html;

    // Wire up cell clicks
    el.querySelectorAll('.rag-cell[data-dim]').forEach(btn => {
      btn.addEventListener('click', () => DPC.RAG.handleClick(btn));
    });

    // Wire save button
    const saveBtn = document.getElementById(`btn-save-rag-${areaCode}`);
    if (saveBtn) saveBtn.addEventListener('click', () => DPC.RAG.saveSnapshot(areaCode));

    // Wire history button
    const histBtn = document.getElementById(`btn-view-rag-history-${areaCode}`);
    if (histBtn) histBtn.addEventListener('click', () => DPC.RAG.showHistory(areaCode));

    // Wire collapsible
    el.querySelectorAll('.collapsible-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !expanded);
        const body = document.getElementById(trigger.getAttribute('aria-controls'));
        if (body) body.classList.toggle('open', !expanded);
      });
    });
  },

  // ── HANDLE CELL CLICK ──────────────────────────────────────────
  handleClick: function(btn) {
    const areaCode = btn.dataset.area;
    const dim = btn.dataset.dim;
    const level = parseInt(btn.dataset.level);
    const area = DPC.getArea(areaCode);
    if (!area) return;

    const current = area.ragRatings.current[dim];
    // Clicking the already-selected level deselects it
    area.ragRatings.current[dim] = (current === level) ? null : level;

    // Recalculate weighted overall
    area.ragRatings.current.overall = DPC.calcWeightedRAG(area.ragRatings.current);

    DPC.saveToLocalStorage();
    DPC.App.markUnsaved();

    // Re-render matrix
    const container = btn.closest('[id]');
    if (container) DPC.RAG.render(areaCode, container.id);

    // Update area header scores
    DPC.Areas.updateHeaderScores(areaCode);

    // Announce to screen reader
    const schema = DPC.ragSchema;
    const dimLabel = schema?.dimensions[dim]?.shortLabel || dim;
    const levelLabel = area.ragRatings.current[dim]
      ? `set to ${schema.scale[area.ragRatings.current[dim]]?.label}`
      : 'cleared';
    DPC.announce(`${dimLabel} ${levelLabel}`);
  },

  // ── SAVE SNAPSHOT ──────────────────────────────────────────────
  saveSnapshot: function(areaCode) {
    const area = DPC.getArea(areaCode);
    if (!area) return;

    const dims = area.ragRatings.current;
    const snapshot = {
      date: new Date().toISOString(),
      overall: dims.overall,
      dimensions: {
        staffCapability: dims.staffCapability,
        hoaLeadership: dims.hoaLeadership,
        infrastructureDevices: dims.infrastructureDevices,
        digitalSkillsAssessment: dims.digitalSkillsAssessment,
        curriculumIntegration: dims.curriculumIntegration,
        learnerReadiness: dims.learnerReadiness,
        accessibilityHealth: dims.accessibilityHealth,
        digitalLeadEngagement: dims.digitalLeadEngagement,
      },
      notes: ''
    };

    if (!area.ragRatings.history) area.ragRatings.history = [];
    area.ragRatings.history.unshift(snapshot);
    DPC.saveToLocalStorage();
    DPC.App.markUnsaved();
    DPC.showToast('Rating snapshot saved');
  },

  // ── SHOW HISTORY ───────────────────────────────────────────────
  showHistory: function(areaCode) {
    const area = DPC.getArea(areaCode);
    if (!area) return;
    const history = area.ragRatings.history || [];
    const schema = DPC.ragSchema;

    let body = '';
    if (!history.length) {
      body = '<div class="empty-state"><div class="empty-state__title">No snapshots yet</div><div class="empty-state__body">Save a rating snapshot to track changes over time.</div></div>';
    } else {
      history.forEach((snap, i) => {
        body += `<div class="card mb-12">
          <div class="card-header">
            <span class="card-title">${DPC.formatDate(snap.date)}</span>
            ${DPC.ragBadge(snap.overall)}
          </div>
          <div class="card-body" style="font-size:var(--text-xs);color:var(--col-text-2);">`;
        if (schema) {
          schema.dimensionOrder.forEach(key => {
            const dim = schema.dimensions[key];
            const val = snap.dimensions?.[key];
            const {label} = DPC.ragLabel(val);
            body += `<div style="margin-bottom:2px"><strong>${dim.shortLabel}:</strong> ${val ? `${val} · ${label}` : '—'}</div>`;
          });
        }
        if (snap.notes) body += `<div class="mt-8">${DPC.escHtml(snap.notes)}</div>`;
        body += `</div></div>`;
      });
    }

    DPC.App.openModal(`RAG Rating History — ${area.code} ${area.name}`, body);
  }
};
