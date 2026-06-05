/* ================================================================
   quickcapture.js — DPC Impact Hub  v1.0
   Quick Capture: fast activity logging into DPC.DB
   Covers all activity types; triggers DevObs and LRA modals.
   Saves to area.activityLog[] or DB.individualActivities[].
   ================================================================ */

DPC.QC = {

  // ── ACTIVITY TYPE GROUPS ─────────────────────────────────────────
  // Mirrors Evidence Hub grouped dropdown (screenshots)
  GROUPS: [
    {
      group: 'Meetings',
      types: [
        { id: 'meeting-quality-team',    label: 'Quality Team Meeting',         norm: 'hoa-meeting' },
        { id: 'meeting-line-manager',    label: 'Line Manager 1:1',             norm: 'hoa-meeting' },
        { id: 'meeting-digital-leads',   label: 'Digital Leads Coaching',       norm: 'digital-lead|staff-cpd' },
        { id: 'meeting-hoa',             label: 'Head of Area Meeting',         norm: 'hoa-meeting' },
        { id: 'meeting-exec',            label: 'Executive Team',               norm: 'hoa-meeting' },
        { id: 'meeting-digital-dev',     label: 'Digital Development Team',     norm: 'digital-lead' },
        { id: 'meeting-external',        label: 'External / BETT / Conferences',norm: 'staff-cpd' },
      ]
    },
    {
      group: 'Teach.Meets',
      types: [
        { id: 'teachmeet-ai-learning',   label: 'AI for Learning',              norm: 'ai-tools|staff-cpd' },
        { id: 'teachmeet-ai-efficiency', label: 'AI for Efficiency',            norm: 'ai-tools|staff-cpd' },
        { id: 'teachmeet-live-model',    label: 'Live Modeling',                norm: 'staff-cpd' },
        { id: 'teachmeet-qa',            label: 'Q+A',                          norm: 'staff-cpd' },
        { id: 'teachmeet-teams',         label: 'Teams',                        norm: 'teams-environments|staff-cpd' },
        { id: 'teachmeet-accessibility', label: 'Accessibility & Inclusion',    norm: 'accessibility|staff-cpd' },
        { id: 'teachmeet-capturing',     label: 'Capturing Learning',           norm: 'digital-marking|staff-cpd' },
        { id: 'teachmeet-feedback',      label: 'Feedback + Assessment',        norm: 'digital-marking|staff-cpd' },
        { id: 'teachmeet-monitoring',    label: 'Monitoring',                   norm: 'digital-skills|staff-cpd' },
        { id: 'teachmeet-clarification', label: 'Clarification',               norm: 'staff-cpd' },
        { id: 'teachmeet-engagement',    label: 'Engagement',                   norm: 'staff-cpd' },
        { id: 'teachmeet-21c',           label: '21st Century Learning Design', norm: 'curriculum-design|staff-cpd' },
        { id: 'teachmeet-udl',           label: 'UDL',                          norm: 'accessibility|staff-cpd' },
        { id: 'teachmeet-impact',        label: 'Impact',                       norm: 'staff-cpd' },
      ]
    },
    {
      group: 'Coaching',
      types: [
        { id: 'coaching-group',          label: 'Group Coaching',               norm: 'staff-cpd' },
        { id: 'coaching-1to1',           label: '1:1 Coaching',                 norm: 'staff-cpd' },
      ]
    },
    {
      group: 'COGs',
      types: [
        { id: 'cog-overview',            label: 'Overview Planning',            norm: 'curriculum-design' },
        { id: 'cog-session-1',           label: 'Session 1',                    norm: 'staff-cpd' },
        { id: 'cog-session-2',           label: 'Session 2',                    norm: 'staff-cpd' },
        { id: 'cog-session-3',           label: 'Session 3',                    norm: 'staff-cpd' },
        { id: 'cog-session-4',           label: 'Session 4',                    norm: 'staff-cpd' },
      ]
    },
    {
      group: 'CPD & Professional',
      types: [
        { id: 'cpd-own',                 label: 'Own Professional Development', norm: 'staff-cpd' },
        { id: 'cpd-external',            label: 'External Events & Networking', norm: 'staff-cpd' },
      ]
    },
    {
      group: 'Observations',
      types: [
        { id: 'obs-devobs',              label: 'Developmental Observation (DevObs)', norm: 'learning-walk|staff-cpd' },
        { id: 'obs-lra',                 label: 'Learning Review Activity (LRA)',     norm: 'learning-walk' },
      ]
    },
    {
      group: 'Learning Without Barriers',
      types: [
        { id: 'lwb-session',             label: 'LWB Planning / Session',       norm: 'accessibility|curriculum-design' },
        { id: 'lwb-review',              label: 'LWB Review / Impact',          norm: 'accessibility' },
      ]
    },
    {
      group: 'Digital Lead Activity',
      types: [
        { id: 'dl-planning',             label: 'Digital Lead Planning',        norm: 'digital-lead' },
        { id: 'dl-delivery',             label: 'Digital Lead Delivery',        norm: 'digital-lead|staff-cpd' },
        { id: 'dl-review',              label: 'Digital Lead Review',           norm: 'digital-lead|rag-review' },
      ]
    },
  ],

  // ── TAG GROUPS ───────────────────────────────────────────────────
  TAG_GROUPS: [
    {
      group: 'Accessibility & Inclusion',
      tags: [
        { id: 'accessibility-inclusion', label: 'Accessibility + Inclusion' },
        { id: 'learning-without-barriers', label: 'Learning Without Barriers' },
        { id: 'send',                    label: 'SEND' },
        { id: 'udl',                     label: 'UDL' },
      ]
    },
    {
      group: 'Digital Skills',
      tags: [
        { id: 'jisc-bdc',               label: 'Jisc BDC / Discovery Tool' },
        { id: 'ai-generative',          label: 'AI & Generative AI' },
        { id: 'digital-skills-framework', label: 'Digital Skills Framework' },
        { id: 'century-tech',           label: 'Century Tech' },
      ]
    },
    {
      group: 'TLA Pedagogy',
      tags: [
        { id: 'digital-tla',            label: 'Digital TLA Pedagogy' },
        { id: 'feedback-assessment',    label: 'Feedback & Assessment' },
        { id: 'curriculum-design',      label: 'Curriculum Design' },
        { id: 'qft',                    label: 'QFT / Questioning' },
      ]
    },
    {
      group: 'Systems',
      tags: [
        { id: 'teams-environments',     label: 'Teams Environments' },
        { id: 'sharepoint',             label: 'SharePoint / OneDrive' },
        { id: 'm365-tools',             label: 'M365 Tools' },
        { id: 'hyper-platform',         label: 'Hyper Platform' },
      ]
    },
    {
      group: 'Programme',
      tags: [
        { id: 'qip-linked',             label: 'QIP Linked' },
        { id: 'digital-lead-activity',  label: 'Digital Lead Activity' },
        { id: 'pilot-evidence',         label: 'Pilot Evidence' },
        { id: 'governance-review',      label: 'Governance Review' },
      ]
    },
  ],

  // ── PYRAMID LEVELS ───────────────────────────────────────────────
  PYRAMID_LEVELS: [
    { id: 'foundations', label: 'Foundations',      colour: 'var(--pyramid-found)' },
    { id: 'inclusion',   label: 'Digital Inclusion', colour: 'var(--pyramid-incl)'  },
    { id: 'innovation',  label: 'Digital Innovation',colour: 'var(--pyramid-innov)' },
  ],

  // ── STATE ────────────────────────────────────────────────────────
  _selectedTags:   new Set(),
  _actionCount:    0,

  // ── RENDER UI ────────────────────────────────────────────────────
  renderUI: function(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const today = new Date().toISOString().split('T')[0];

    // Build grouped dropdown options
    let optHtml = `<option value="">Select activity type…</option>`;
    DPC.QC.GROUPS.forEach(g => {
      optHtml += `<optgroup label="${DPC.escHtml(g.group)}">`;
      g.types.forEach(t => {
        optHtml += `<option value="${t.id}" data-norm="${t.norm}">${DPC.escHtml(t.label)}</option>`;
      });
      optHtml += `</optgroup>`;
    });

    // Build area options
    const areaOpts = `<option value="">— cross-college / no area —</option>` +
      (DPC.DB.areas || []).map(a =>
        `<option value="${a.code}">${DPC.escHtml(a.code)} — ${DPC.escHtml(a.name)}</option>`
      ).join('');

    // Build tag groups HTML
    let tagsHtml = '';
    DPC.QC.TAG_GROUPS.forEach(g => {
      tagsHtml += `<div class="qc-tag-group">
        <div class="qc-tag-group-label">${DPC.escHtml(g.group)}</div>
        <div class="qc-tag-chips">`;
      g.tags.forEach(t => {
        tagsHtml += `<button type="button" class="qc-tag-chip"
          data-tag="${t.id}"
          onclick="DPC.QC._toggleTag('${t.id}', this)"
          aria-pressed="false"
          aria-label="Tag: ${DPC.escHtml(t.label)}">${DPC.escHtml(t.label)}</button>`;
      });
      tagsHtml += `</div></div>`;
    });

    // Pyramid level buttons
    let pyramidHtml = DPC.QC.PYRAMID_LEVELS.map(p =>
      `<button type="button" class="qc-pyramid-btn" data-level="${p.id}"
        onclick="DPC.QC._selectPyramid('${p.id}', this)"
        aria-pressed="false"
        style="--pyr-col:${p.colour}"
        aria-label="Pyramid level: ${DPC.escHtml(p.label)}">${DPC.escHtml(p.label)}</button>`
    ).join('');

    el.innerHTML = `
    <div class="qc-layout">

      <!-- ── LEFT: form ── -->
      <div class="qc-form-panel card">
        <div class="card-header">
          <span class="card-title">What activity are you capturing?</span>
        </div>
        <div class="card-body">

          <!-- Activity type -->
          <div class="form-group mb-12">
            <label class="form-label" for="qc-type">Activity type <span class="req" aria-hidden="true">*</span></label>
            <select class="form-input" id="qc-type"
              onchange="DPC.QC._onTypeChange(this)"
              aria-required="true"
              aria-describedby="qc-type-hint">
              ${optHtml}
            </select>
            <div id="qc-type-hint" class="form-hint">Select a type — the form updates automatically</div>
          </div>

          <!-- Date + Area -->
          <div class="form-row mb-12">
            <div class="form-group" style="flex:0 0 160px">
              <label class="form-label" for="qc-date">Date <span class="req" aria-hidden="true">*</span></label>
              <input class="form-input" type="date" id="qc-date" value="${today}"
                aria-required="true">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label" for="qc-area">Curriculum area</label>
              <select class="form-input" id="qc-area" aria-label="Curriculum area">
                ${areaOpts}
              </select>
            </div>
          </div>

          <!-- Dynamic form container (DevObs / LRA show launcher here) -->
          <div id="qc-dynamic" class="mb-12" aria-live="polite">
            <!-- Populated by _onTypeChange() -->
          </div>

          <!-- Title / Summary -->
          <div class="form-group mb-12" id="qc-title-row">
            <label class="form-label" for="qc-title">Title / Summary</label>
            <input class="form-input" type="text" id="qc-title"
              placeholder="Brief description of what happened"
              aria-label="Title or summary">
          </div>

          <!-- Key Points -->
          <div class="form-group mb-12" id="qc-keypoints-row">
            <label class="form-label" for="qc-keypoints">Key Points / Notes</label>
            <textarea class="form-input" id="qc-keypoints" rows="3"
              placeholder="Main discussion points, outcomes, observations…"
              aria-label="Key points and notes"></textarea>
          </div>

          <!-- Notes / Detail -->
          <div class="form-group mb-12">
            <label class="form-label" for="qc-notes">Notes / Detail</label>
            <textarea class="form-input" id="qc-notes" rows="3"
              placeholder="Additional context, background, or detail…"
              aria-label="Additional notes"></textarea>
          </div>

          <!-- Action Points -->
          <div class="form-group mb-12">
            <label class="form-label">Action Points / Next Steps</label>
            <div id="qc-actions-list" aria-label="Action points list">
              <!-- Populated by _addAction() -->
            </div>
            <button type="button" class="btn btn-ghost btn-sm mt-8"
              onclick="DPC.QC._addAction()"
              aria-label="Add action point">+ Add action</button>
          </div>

          <!-- QIP Ref -->
          <div class="form-group mb-12">
            <label class="form-label" for="qc-qip">QIP Reference
              <span class="form-hint" style="display:inline;margin-left:4px">(optional — e.g. T&amp;L 3.1)</span>
            </label>
            <input class="form-input" type="text" id="qc-qip"
              placeholder="e.g. T&L 3.1, SfL 2.4"
              aria-label="QIP reference">
          </div>

          <!-- Pyramid Level -->
          <div class="form-group mb-16">
            <label class="form-label">Digital Learning Pyramid Level</label>
            <div class="qc-pyramid-row" role="group" aria-label="Pyramid level">
              ${pyramidHtml}
            </div>
          </div>

          <!-- Save -->
          <div class="qc-save-row">
            <button type="button" class="btn btn-primary" id="qc-save-btn"
              onclick="DPC.QC.save()"
              aria-label="Save this activity">
              ✓ Save Activity
            </button>
            <button type="button" class="btn btn-ghost"
              onclick="DPC.QC._reset()"
              aria-label="Clear form">Clear</button>
          </div>

        </div><!-- /card-body -->
      </div><!-- /qc-form-panel -->

      <!-- ── RIGHT: tags + recent ── -->
      <div class="qc-sidebar">

        <!-- Tags -->
        <div class="card mb-16">
          <div class="card-header">
            <span class="card-title">Tags</span>
            <button type="button" class="btn btn-ghost btn-sm"
              onclick="DPC.QC._clearTags()"
              aria-label="Clear all tags">Clear</button>
          </div>
          <div class="card-body qc-tags-body" id="qc-tags-container">
            ${tagsHtml}
          </div>
        </div>

        <!-- Link to thread / workflow placeholder (future) -->
        <div class="card mb-16">
          <div class="card-header"><span class="card-title">Link to Thread / Workflow</span></div>
          <div class="card-body">
            <select class="form-input" id="qc-thread" aria-label="Link to thread or workflow">
              <option value="">— not linked —</option>
              <!-- Phase 4: populated from area.currentActions -->
            </select>
            <div class="form-hint mt-4">Thread linking: Phase 4 feature</div>
          </div>
        </div>

        <!-- Recent captures -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Captures</span>
            <button type="button" class="btn btn-ghost btn-sm"
              onclick="DPC.QC.renderRecent()"
              aria-label="Refresh recent captures">↻</button>
          </div>
          <div class="card-body" id="qc-recent-list" aria-label="Recent activity captures">
            <!-- Populated by renderRecent() -->
          </div>
        </div>

      </div><!-- /qc-sidebar -->

    </div><!-- /qc-layout -->
    `;

    DPC.QC._selectedTags = new Set();
    DPC.QC._actionCount  = 0;
    DPC.QC.renderRecent();
  },

  // ── TYPE CHANGE HANDLER ──────────────────────────────────────────
  _onTypeChange: function(sel) {
    const typeId   = sel.value;
    const dynamic  = document.getElementById('qc-dynamic');
    if (!dynamic) return;

    // DevObs and LRA get a special launcher rather than inline form
    if (typeId === 'obs-devobs') {
      const areaCode = document.getElementById('qc-area')?.value || '';
      dynamic.innerHTML = `
        <div class="qc-obs-launcher" role="region" aria-label="Developmental Observation launcher">
          <p class="text-sm mb-8">
            Developmental Observations use a structured form mirroring the Weston Hyper platform.
            Fill it in here — then copy to Hyper with one click.
          </p>
          <button type="button" class="btn btn-primary"
            onclick="DPC.DevObs && DPC.DevObs.open({ areaCode: document.getElementById('qc-area')?.value || '' })"
            aria-label="Open Developmental Observation form">
            Open Dev Obs Form →
          </button>
          ${!DPC.DevObs ? `<p class="form-hint mt-8" style="color:var(--col-accent-2)">DevObs module not yet loaded — devobs.js coming in next build.</p>` : ''}
        </div>`;
      // Hide standard fields — DevObs saves directly
      document.getElementById('qc-title-row')?.style.setProperty('display','none');
      document.getElementById('qc-keypoints-row')?.style.setProperty('display','none');
      document.getElementById('qc-save-btn')?.setAttribute('disabled','true');
      return;
    }

    if (typeId === 'obs-lra') {
      dynamic.innerHTML = `
        <div class="qc-obs-launcher" role="region" aria-label="LRA launcher">
          <p class="text-sm mb-8">
            Learning Review Activities use a structured five-section form mirroring the Weston Hyper platform.
          </p>
          <button type="button" class="btn btn-primary"
            onclick="DPC.LRA && DPC.LRA.open({ areaCode: document.getElementById('qc-area')?.value || '' })"
            aria-label="Open Learning Review Activity form">
            Open LRA Form →
          </button>
          ${!DPC.LRA ? `<p class="form-hint mt-8" style="color:var(--col-accent-2)">LRA module not yet loaded — lra.js coming in next build.</p>` : ''}
        </div>`;
      document.getElementById('qc-title-row')?.style.setProperty('display','none');
      document.getElementById('qc-keypoints-row')?.style.setProperty('display','none');
      document.getElementById('qc-save-btn')?.setAttribute('disabled','true');
      return;
    }

    // All other types — restore standard fields
    dynamic.innerHTML = '';
    document.getElementById('qc-title-row')?.style.removeProperty('display');
    document.getElementById('qc-keypoints-row')?.style.removeProperty('display');
    document.getElementById('qc-save-btn')?.removeAttribute('disabled');

    // Auto-suggest tags based on type norm
    const opt = sel.options[sel.selectedIndex];
    const norm = opt?.dataset?.norm || '';
    if (norm) {
      DPC.QC._autoSelectTags(norm);
    }

    // Auto-suggest title
    const label = opt?.textContent?.trim() || '';
    const titleEl = document.getElementById('qc-title');
    if (titleEl && !titleEl.value) {
      const areaCode = document.getElementById('qc-area')?.value;
      titleEl.value = areaCode ? `${label} — ${areaCode}` : label;
    }
  },

  // ── AUTO-SELECT TAGS FROM NORM STRING ────────────────────────────
  _autoSelectTags: function(norm) {
    const normParts = norm.split('|');
    // Map norm keys to tag IDs
    const normToTag = {
      'teams-environments':   'teams-environments',
      'accessibility':        'accessibility-inclusion',
      'digital-marking':      'feedback-assessment',
      'ai-tools':             'ai-generative',
      'staff-cpd':            'digital-tla',
      'curriculum-design':    'curriculum-design',
      'digital-lead':         'digital-lead-activity',
      'learning-walk':        'pilot-evidence',
      'digital-skills':       'digital-skills-framework',
    };
    normParts.forEach(part => {
      const tagId = normToTag[part];
      if (tagId && !DPC.QC._selectedTags.has(tagId)) {
        const btn = document.querySelector(`.qc-tag-chip[data-tag="${tagId}"]`);
        if (btn) DPC.QC._toggleTag(tagId, btn);
      }
    });
  },

  // ── TAG TOGGLE ───────────────────────────────────────────────────
  _toggleTag: function(tagId, btn) {
    if (DPC.QC._selectedTags.has(tagId)) {
      DPC.QC._selectedTags.delete(tagId);
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed','false');
    } else {
      DPC.QC._selectedTags.add(tagId);
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed','true');
    }
  },

  _clearTags: function() {
    DPC.QC._selectedTags.clear();
    document.querySelectorAll('.qc-tag-chip').forEach(btn => {
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed','false');
    });
  },

  // ── PYRAMID LEVEL ────────────────────────────────────────────────
  _selectedPyramid: null,
  _selectPyramid: function(level, btn) {
    if (DPC.QC._selectedPyramid === level) {
      // Toggle off
      DPC.QC._selectedPyramid = null;
      btn.classList.remove('selected');
      btn.setAttribute('aria-pressed','false');
    } else {
      DPC.QC._selectedPyramid = level;
      document.querySelectorAll('.qc-pyramid-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed','true');
    }
  },

  // ── ACTION POINTS ────────────────────────────────────────────────
  _addAction: function() {
    DPC.QC._actionCount++;
    const i   = DPC.QC._actionCount;
    const list = document.getElementById('qc-actions-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'qc-action-row';
    row.id        = `qc-action-row-${i}`;
    row.setAttribute('role','group');
    row.setAttribute('aria-label',`Action point ${i}`);

    row.innerHTML = `
      <input type="text" class="form-input" id="qc-action-text-${i}"
        placeholder="Action…" aria-label="Action point ${i} description">
      <input type="date" class="form-input qc-action-date" id="qc-action-date-${i}"
        aria-label="Action point ${i} target date">
      <input type="text" class="form-input qc-action-who" id="qc-action-who-${i}"
        placeholder="Who…" value="Graeme Wright" aria-label="Action point ${i} responsible">
      <button type="button" class="btn-icon" aria-label="Remove action ${i}"
        onclick="document.getElementById('qc-action-row-${i}').remove()">✕</button>`;
    list.appendChild(row);
  },

  _gatherActions: function() {
    const actions = [];
    document.querySelectorAll('.qc-action-row').forEach(row => {
      const i    = row.id.replace('qc-action-row-','');
      const text = document.getElementById(`qc-action-text-${i}`)?.value?.trim();
      if (!text) return;
      actions.push({
        id:           DPC.uid(),
        text,
        who:          document.getElementById(`qc-action-who-${i}`)?.value?.trim() || 'Graeme Wright',
        targetDate:   document.getElementById(`qc-action-date-${i}`)?.value || null,
        status:       'not-started',
        dateLogged:   new Date().toISOString(),
        dateCompleted: null,
      });
    });
    return actions;
  },

  // ── SAVE ─────────────────────────────────────────────────────────
  save: function() {
    const typeEl  = document.getElementById('qc-type');
    const typeId  = typeEl?.value;
    if (!typeId) {
      DPC.showToast('Please select an activity type');
      typeEl?.focus();
      return;
    }

    const dateVal = document.getElementById('qc-date')?.value;
    if (!dateVal) {
      DPC.showToast('Please enter a date');
      document.getElementById('qc-date')?.focus();
      return;
    }

    const areaCode = document.getElementById('qc-area')?.value || '';
    const title    = document.getElementById('qc-title')?.value?.trim()     || '';
    const keyPoints= document.getElementById('qc-keypoints')?.value?.trim() || '';
    const notes    = document.getElementById('qc-notes')?.value?.trim()     || '';
    const qipRef   = document.getElementById('qc-qip')?.value?.trim()       || '';

    // Get type meta
    let typeLabel = '', typeNorm = '';
    DPC.QC.GROUPS.forEach(g => {
      g.types.forEach(t => {
        if (t.id === typeId) { typeLabel = t.label; typeNorm = t.norm; }
      });
    });

    // Build normalised cluster
    const normalised = DPC.normaliseAction(typeNorm + ' ' + title + ' ' + notes);

    const entry = {
      id:            DPC.uid(),
      dateLogged:    new Date(`${dateVal}T09:00:00`).toISOString(),
      dateCompleted: null,
      dateNextReview: null,
      type:          typeId,
      subtype:       typeLabel,
      title:         title || typeLabel + (areaCode ? ` — ${areaCode}` : ''),
      keyPoints,
      notes,
      actionPoints:  DPC.QC._gatherActions(),
      tags:          [...DPC.QC._selectedTags],
      pyramidLevel:  DPC.QC._selectedPyramid || null,
      qipRef,
      areaCode:      areaCode || null,
      captureSource: 'quick-capture',
      normalised,
    };

    // Save to correct store
    if (areaCode) {
      const area = DPC.getArea(areaCode);
      if (area) {
        if (!area.activityLog) area.activityLog = [];
        // Convert to activityLog format (compatible with existing schema)
        const logEntry = {
          ...entry,
          date:     dateVal,
          type:     typeId,
          notes:    [title, keyPoints, notes].filter(Boolean).join('\n\n'),
          actions:  entry.actionPoints,
        };
        area.activityLog.unshift(logEntry);
      }
    } else {
      if (!DPC.DB.individualActivities) DPC.DB.individualActivities = [];
      DPC.DB.individualActivities.unshift(entry);
    }

    DPC.saveToLocalStorage();
    DPC.App.markUnsaved();
    DPC.showToast(`✓ ${typeLabel} saved${areaCode ? ' — ' + areaCode : ''}`);

    // Refresh recent list
    DPC.QC.renderRecent();

    // Partial reset — keep type, date, area; clear content
    document.getElementById('qc-title').value     = '';
    document.getElementById('qc-keypoints').value = '';
    document.getElementById('qc-notes').value     = '';
    document.getElementById('qc-qip').value       = '';
    document.getElementById('qc-actions-list').innerHTML = '';
    DPC.QC._actionCount = 0;
    DPC.QC._clearTags();
    DPC.QC._selectedPyramid = null;
    document.querySelectorAll('.qc-pyramid-btn').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed','false');
    });

    // If area was set, update area selector card
    if (areaCode) DPC.Areas.renderSelector('area-selector-container');
  },

  // ── RESET ────────────────────────────────────────────────────────
  _reset: function() {
    document.getElementById('qc-type').value  = '';
    document.getElementById('qc-date').value  = new Date().toISOString().split('T')[0];
    document.getElementById('qc-area').value  = '';
    document.getElementById('qc-title').value = '';
    document.getElementById('qc-keypoints').value = '';
    document.getElementById('qc-notes').value     = '';
    document.getElementById('qc-qip').value       = '';
    document.getElementById('qc-actions-list').innerHTML = '';
    document.getElementById('qc-dynamic').innerHTML      = '';
    document.getElementById('qc-title-row')?.style.removeProperty('display');
    document.getElementById('qc-keypoints-row')?.style.removeProperty('display');
    document.getElementById('qc-save-btn')?.removeAttribute('disabled');
    DPC.QC._actionCount = 0;
    DPC.QC._clearTags();
    DPC.QC._selectedPyramid = null;
    document.querySelectorAll('.qc-pyramid-btn').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed','false');
    });
  },

  // ── RECENT CAPTURES ──────────────────────────────────────────────
  renderRecent: function() {
    const el = document.getElementById('qc-recent-list');
    if (!el) return;

    // Gather last 25 entries across all areas + individualActivities
    const entries = [];

    (DPC.DB.individualActivities || []).forEach(ia => {
      entries.push({ ...ia, _source: 'individual' });
    });

    (DPC.DB.areas || []).forEach(area => {
      (area.activityLog || []).forEach(entry => {
        if (entry.captureSource === 'quick-capture' ||
            entry.captureSource === 'devobs' ||
            entry.captureSource === 'lra') {
          entries.push({ ...entry, _areaCode: area.code, _areaName: area.name, _source: 'area' });
        }
      });
    });

    // Sort by dateLogged desc
    entries.sort((a,b) => new Date(b.dateLogged||b.date||0) - new Date(a.dateLogged||a.date||0));
    const recent = entries.slice(0, 25);

    if (!recent.length) {
      el.innerHTML = `<p class="text-muted text-sm">No captures yet — save an activity above.</p>`;
      return;
    }

    const typeIcon = {
      'meeting-quality-team':    '◈',
      'meeting-line-manager':    '◈',
      'meeting-hoa':             '◈',
      'meeting-digital-leads':   '◉',
      'meeting-exec':            '◈',
      'meeting-digital-dev':     '◉',
      'meeting-external':        '◈',
      'teachmeet-ai-learning':   '◬',
      'teachmeet-ai-efficiency': '◬',
      'teachmeet-teams':         '◬',
      'teachmeet-accessibility': '◬',
      'teachmeet-feedback':      '◬',
      'coaching-1to1':           '◷',
      'coaching-group':          '◷',
      'cog-overview':            '⊡',
      'cog-session-1':           '⊡',
      'cpd-own':                 '◇',
      'cpd-external':            '◇',
      'obs-devobs':              '◎',
      'devobs':                  '◎',
      'obs-lra':                 '◎',
      'lra':                     '◎',
    };

    el.innerHTML = recent.map(e => {
      const icon  = typeIcon[e.type] || '◎';
      const area  = e._areaCode || e.areaCode || '';
      const date  = DPC.formatDate(e.dateLogged || e.date);
      const label = e.title || e.subtype || e.type || '—';
      const tags  = (e.tags || []).slice(0,3).map(t =>
        `<span class="qc-recent-tag">${DPC.escHtml(t)}</span>`
      ).join('');
      return `
        <div class="qc-recent-entry" role="listitem">
          <div class="qc-recent-icon" aria-hidden="true">${icon}</div>
          <div class="qc-recent-body">
            <div class="qc-recent-title">${DPC.escHtml(label)}</div>
            <div class="qc-recent-meta">
              ${area ? `<span class="badge badge-ns" style="font-size:0.7rem">${DPC.escHtml(area)}</span>` : ''}
              <span class="text-muted">${date}</span>
            </div>
            ${tags ? `<div class="qc-recent-tags">${tags}</div>` : ''}
          </div>
          ${area ? `<button type="button" class="btn btn-ghost btn-sm qc-recent-go"
            onclick="DPC.Areas.openArea('${DPC.escHtml(area)}')"
            aria-label="Open ${DPC.escHtml(area)} area record">→</button>` : ''}
        </div>`;
    }).join('');
  },

};
