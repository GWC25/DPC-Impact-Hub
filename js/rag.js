/* ================================================================
   rag.js — DPC Impact Hub
   RAG matrix render, click handlers, scoring, history
   Full level descriptor display from rag-schema.json
   ================================================================ */

DPC.RAG = {

  // ── RENDER MATRIX ──────────────────────────────────────────────
  render: function(areaCode, containerId) {
    const area   = DPC.getArea(areaCode);
    const schema = DPC.ragSchema;
    if (!area || !schema) return;

    const el = document.getElementById(containerId);
    if (!el) return;

    const current  = area.ragRatings?.current || {};
    const dimOrder = schema.dimensionOrder || Object.keys(schema.dimensions);
    const scale    = schema.scale;

    let html = `<div style="margin-bottom:12px">
      <p style="font-size:.8rem;color:var(--col-muted)">
        Click a score to select it for each dimension. Click the selected score again to deselect.
        Each row shows the full criteria so you can make an accurate assessment.
      </p>
    </div>`;

    dimOrder.forEach(key => {
      const dim      = schema.dimensions[key];
      const selected = current[key] || null;
      const selScale = selected ? scale[String(selected)] : null;
      const selDim   = selected ? dim.levels?.[String(selected)] : null;

      html += `
      <div class="rag-dim-block" id="rag-dim-${areaCode}-${key}" style="
        border:1px solid var(--col-border);
        border-radius:var(--radius-lg);
        overflow:hidden;
        margin-bottom:12px;
        ${selected ? `border-left:4px solid ${selScale?.color||'var(--col-border)'};` : ''}
      ">
        <!-- Dimension header: name + score buttons -->
        <div style="
          display:flex;align-items:center;gap:10px;flex-wrap:wrap;
          padding:12px 16px;
          background:var(--col-surface-2);
          border-bottom:1px solid var(--col-border);
        ">
          <span style="font-size:1rem;color:var(--col-muted)" aria-hidden="true">${dim.icon}</span>
          <strong style="font-size:.9rem;color:var(--col-text);flex:1">${dim.label}</strong>
          ${selected ? `<span style="font-size:.78rem;font-weight:700;color:${selScale.color}">${selected} · ${selScale.label}</span>` : '<span style="font-size:.75rem;color:var(--col-muted)">Not rated</span>'}
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0" role="radiogroup" aria-label="Rating for ${dim.label}">
            <button type="button"
              style="font-size:.7rem;padding:3px 7px;background:transparent;border:1px solid var(--col-border);border-radius:var(--radius);color:var(--col-muted);cursor:pointer"
              onclick="DPC.RAG.setScore('${areaCode}','${key}',null,'${containerId}')"
              aria-label="Clear rating for ${dim.label}">Clear</button>
            ${Object.entries(scale).map(([v, s]) => {
              const isSelected = parseInt(v) === selected;
              return `<button type="button"
                class="rag-score-btn${isSelected?' rag-score-selected':''}"
                data-area="${areaCode}" data-dim="${key}" data-val="${v}"
                onclick="DPC.RAG.setScore('${areaCode}','${key}',${v},'${containerId}')"
                aria-pressed="${isSelected}"
                aria-label="${dim.label}: ${v} — ${s.label}"
                style="
                  min-width:48px;padding:5px 8px;border-radius:var(--radius);cursor:pointer;
                  border:2px solid ${isSelected ? s.color : 'var(--col-border)'};
                  background:${isSelected ? s.color+'22' : 'var(--col-surface)'};
                  color:${isSelected ? s.color : 'var(--col-text-2)'};
                  font-weight:${isSelected?'700':'400'};
                  font-size:.75rem;text-align:center;line-height:1.2;
                  transition:all .15s ease;
                ">
                <span style="display:block;font-weight:700;font-size:.85rem">${v}</span>
                <span style="font-size:.6rem">${s.label}</span>
              </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Full criteria table — always visible -->
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:.78rem;min-width:700px">
            <thead>
              <tr style="background:var(--col-surface-2)">
                <th style="width:120px;padding:8px 12px;text-align:left;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--col-muted);border-bottom:1px solid var(--col-border);border-right:1px solid var(--col-border)">Level</th>
                ${(dim.subCriteriaLabels||[]).map(lbl =>
                  `<th style="padding:8px 10px;text-align:left;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--col-muted);border-bottom:1px solid var(--col-border);border-right:1px solid var(--col-border)">${lbl}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${Object.entries(scale).map(([v, s]) => {
                const lvl        = dim.levels?.[v];
                const isSelected = parseInt(v) === selected;
                const rowBg      = isSelected ? s.color + '11' : 'var(--col-surface)';
                const subCrit    = lvl?.subCriteria || [];
                return `<tr style="background:${rowBg};cursor:pointer;transition:background .12s ease"
                  onclick="DPC.RAG.setScore('${areaCode}','${key}',${isSelected?'null':v},'${containerId}')"
                  role="row"
                  aria-label="Select ${dim.label}: ${v} — ${s.label}"
                  onmouseover="this.style.background='${s.color}18'"
                  onmouseout="this.style.background='${rowBg}'"
                >
                  <td style="padding:10px 12px;border-bottom:1px solid var(--col-border);border-right:1px solid var(--col-border);white-space:nowrap;vertical-align:top">
                    <span style="display:inline-flex;align-items:center;gap:6px">
                      ${isSelected ? `<span style="font-size:.65rem;color:${s.color}" aria-hidden="true">✓</span>` : ''}
                      <span style="font-weight:700;color:${s.color};font-size:.85rem">${v}</span>
                      <span style="color:${s.color};font-size:.75rem">${s.label}</span>
                    </span>
                  </td>
                  ${subCrit.map(txt =>
                    `<td style="padding:9px 10px;border-bottom:1px solid var(--col-border);border-right:1px solid var(--col-border);color:${isSelected?'var(--col-text)':'var(--col-text-2)'};line-height:1.5;vertical-align:top">${txt}</td>`
                  ).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    });

    // Overall RAG
    const overall = DPC.calcWeightedRAG(current);
    const overallLabel = overall ? (schema.scale[String(Math.round(overall))]?.label || '—') : 'Not yet rated';
    const overallColor = overall ? (schema.scale[String(Math.round(overall))]?.color || 'var(--col-muted)') : 'var(--col-muted)';

    html += `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 16px;background:var(--col-surface-2);border:1px solid var(--col-border);border-radius:var(--radius-lg);margin-top:4px">
      <div>
        <div style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--col-muted);margin-bottom:2px">Overall RAG (weighted)</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.8rem;font-weight:700;font-family:var(--font-mono);color:${overallColor}">${overall ? Math.round(overall) : '—'}</span>
          <span style="font-size:.9rem;color:${overallColor};font-weight:600">${overallLabel}</span>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" type="button"
          onclick="DPC.RAG.saveSnapshot('${areaCode}','${containerId}')">
          Save Rating Snapshot
        </button>
        <button class="btn btn-ghost btn-sm" type="button"
          onclick="DPC.RAG.showHistory('${areaCode}')">
          View History
        </button>
      </div>
    </div>
    <p style="font-size:.72rem;color:var(--col-muted);margin-top:8px">
      Weights: Staff Capability ×1.5 · HoA Leadership ×1.5 · Digital Health ×1.5 · all others ×1.0
    </p>`;

    el.innerHTML = html;
  },

  // ── SET SCORE ──────────────────────────────────────────────────
  setScore: function(areaCode, dimKey, level, containerId) {
    const area = DPC.getArea(areaCode);
    if (!area) return;
    if (!area.ragRatings) area.ragRatings = { current:{}, history:[] };
    if (!area.ragRatings.current) area.ragRatings.current = {};

    const current = area.ragRatings.current[dimKey];
    // Toggle: clicking selected level deselects
    area.ragRatings.current[dimKey] = (level !== null && current === level) ? null : level;

    // Recalc weighted overall
    area.ragRatings.current.overall = DPC.calcWeightedRAG(area.ragRatings.current);

    DPC.saveToLocalStorage();
    DPC.App.markUnsaved();

    // Re-render matrix
    DPC.RAG.render(areaCode, containerId);
    // Update header scores
    DPC.Areas.updateHeaderScores(areaCode);

    // Announce to screen reader
    const schema   = DPC.ragSchema;
    const dimLabel = schema?.dimensions[dimKey]?.shortLabel || dimKey;
    const val      = area.ragRatings.current[dimKey];
    const valLabel = val ? (schema?.scale[String(val)]?.label || val) : 'cleared';
    DPC.announce(`${dimLabel} set to ${valLabel}`);
  },

  // ── SAVE SNAPSHOT ──────────────────────────────────────────────
  saveSnapshot: function(areaCode, containerId) {
    const area = DPC.getArea(areaCode);
    if (!area) return;

    const dims = { ...area.ragRatings.current };
    delete dims.overall;

    const snapshot = {
      date:       new Date().toISOString(),
      overall:    area.ragRatings.current.overall,
      dimensions: dims,
      notes:      ''
    };

    if (!area.ragRatings.history) area.ragRatings.history = [];
    area.ragRatings.history.unshift(snapshot);
    DPC.saveToLocalStorage();
    DPC.App.markUnsaved();
    DPC.showToast('Rating snapshot saved');
  },

  // ── SHOW HISTORY ───────────────────────────────────────────────
  showHistory: function(areaCode) {
    const area    = DPC.getArea(areaCode);
    if (!area) return;
    const history = area.ragRatings?.history || [];
    const schema  = DPC.ragSchema;

    let body = '';
    if (!history.length) {
      body = `<div class="empty-state">
        <div class="empty-state__title">No snapshots yet</div>
        <div class="empty-state__body">Save a rating snapshot to track changes over time.</div>
      </div>`;
    } else {
      history.forEach(snap => {
        const overall = snap.overall;
        const color   = overall ? (schema.scale[String(Math.round(overall))]?.color || 'var(--col-muted)') : 'var(--col-muted)';
        const label   = overall ? (schema.scale[String(Math.round(overall))]?.label || '—') : '—';
        body += `<div class="card" style="margin-bottom:10px">
          <div class="card-header">
            <span class="card-title">${DPC.formatDate(snap.date)}</span>
            <span style="font-weight:700;color:${color};font-size:.9rem">${overall ? Math.round(overall) + ' · ' + label : '—'}</span>
          </div>
          <div class="card-body" style="display:flex;flex-wrap:wrap;gap:8px">
            ${schema.dimensionOrder.map(key => {
              const dim = schema.dimensions[key];
              const val = snap.dimensions?.[key];
              const c   = val ? schema.scale[String(val)]?.color : 'var(--col-border)';
              const l   = val ? schema.scale[String(val)]?.label : '—';
              return `<span style="font-size:.72rem;padding:3px 8px;border-radius:999px;border:1px solid ${c}44;background:${val?c+'11':'var(--col-surface-2)'};color:${val?c:'var(--col-muted)'}">
                ${dim.icon} ${dim.shortLabel}: <strong>${val||'—'}</strong> ${val?'· '+l:''}
              </span>`;
            }).join('')}
          </div>
        </div>`;
      });
    }

    DPC.App.openModal(`RAG Rating History — ${area.code} ${area.name}`, body);
  },

  // ── DIMENSION PILLS FOR SUMMARY TABLE ─────────────────────────
  getDimPills: function(areaCode) {
    const area   = DPC.getArea(areaCode);
    const schema = DPC.ragSchema;
    if (!area || !schema) return '';

    const current = area.ragRatings?.current || {};
    return schema.dimensionOrder.map(key => {
      const val   = current[key];
      const dim   = schema.dimensions[key];
      const color = val ? (schema.scale[String(val)]?.color || '#ccc') : 'var(--col-border)';
      const label = val ? (schema.scale[String(val)]?.label || val) : '—';
      return `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:4px;
        background:${val ? color : 'var(--col-surface-2)'};
        color:${val ? '#fff' : 'var(--col-muted)'};
        font-size:.65rem;font-weight:700;
        border:1px solid ${val ? color : 'var(--col-border)'};
        flex-shrink:0;
      " title="${dim.label}: ${val||'—'} ${val?'· '+label:''}">${val||'—'}</span>`;
    }).join('');
  },

  // ── RAG BADGE ─────────────────────────────────────────────────
  getOverallBadge: function(areaCode) {
    const area   = DPC.getArea(areaCode);
    const schema = DPC.ragSchema;
    if (!area) return '<span style="opacity:.4">—</span>';
    const v = area.ragRatings?.current?.overall || area.ragRatings?.history?.[0]?.overall;
    if (!v) return '<span style="color:var(--col-muted);font-size:.8rem">Not rated</span>';
    const rv    = Math.round(v);
    const color = schema?.scale?.[String(rv)]?.color || 'var(--col-muted)';
    const label = schema?.scale?.[String(rv)]?.label || rv;
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:${color}18;border:1px solid ${color}44;color:${color};font-size:.75rem;font-weight:700">${rv} · ${label}</span>`;
  }
};

// ── CALC WEIGHTED RAG ──────────────────────────────────────────
DPC.calcWeightedRAG = function(dims) {
  const schema  = DPC.ragSchema;
  if (!schema) return null;
  const weights = schema.weights;
  let total = 0, totalWeight = 0;
  Object.keys(weights).forEach(k => {
    const val = dims[k];
    if (val !== null && val !== undefined) {
      total       += val * weights[k];
      totalWeight += weights[k];
    }
  });
  if (!totalWeight) return null;
  return Math.round(total / totalWeight * 10) / 10;
};
