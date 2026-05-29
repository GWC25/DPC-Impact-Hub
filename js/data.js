/* ================================================================
   data.js — DPC Impact Hub
   DB schema, load/save, migration, OneDrive sync
   ================================================================ */

// ── ONEDRIVE URL ──────────────────────────────────────────────────
// Paste your OneDrive shareable URL here after first deploy.
// See README.md → "OneDrive Setup" for instructions.
const ONEDRIVE_URL = '';

// ── SCHEMA VERSION ────────────────────────────────────────────────
const SCHEMA_VERSION = '2.0';
const STORAGE_KEY    = 'dpc-impact-hub-v2';

// ── LIVE DATABASE REFERENCE ───────────────────────────────────────
window.DPC = window.DPC || {};
DPC.DB = null;

// ── DEFAULT DB SKELETON ───────────────────────────────────────────
function createEmptyDB() {
  return {
    meta: {
      version: SCHEMA_VERSION,
      created: new Date().toISOString(),
      lastSaved: new Date().toISOString(),
      savedBy: 'Graeme Wright'
    },
    areas: [],
    learningWithoutBarriers: { frameworkLink: '', activities: [] },
    individualActivities: [],
    myCPD: [],
    settings: {
      afiPhaseTypes: ['Foundations', 'Embedding', 'Developing', 'Innovating', 'Standalone'],
      customActivityTypes: [],
      theme: 'auto'
    }
  };
}

// ── SEED DATA LOADER ──────────────────────────────────────────────
async function loadSeedData() {
  try {
    const r = await fetch('./data/areas-seed.json');
    return await r.json();
  } catch(e) {
    console.warn('Seed data not available:', e);
    return [];
  }
}

// ── RAG SCHEMA LOADER ─────────────────────────────────────────────
DPC.ragSchema = null;
async function loadRAGSchema() {
  try {
    const r = await fetch('./data/rag-schema.json');
    DPC.ragSchema = await r.json();
  } catch(e) {
    console.warn('RAG schema not available:', e);
  }
}

// ── HEALTH CHECK SCHEMA LOADER ────────────────────────────────────
DPC.hcSchema = null;
async function loadHCSchema() {
  try {
    const r = await fetch('./data/hc-schema.json');
    DPC.hcSchema = await r.json();
  } catch(e) {
    console.warn('HC schema not available:', e);
  }
}

// ── LOCALSTORAGE ──────────────────────────────────────────────────
DPC.saveToLocalStorage = function() {
  try {
    DPC.DB.meta.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DPC.DB));
    return true;
  } catch(e) {
    console.error('localStorage save failed:', e);
    return false;
  }
};

DPC.loadFromLocalStorage = function() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    console.warn('localStorage parse failed:', e);
    return null;
  }
};

// ── MANUAL DOWNLOAD ───────────────────────────────────────────────
DPC.downloadJSON = function() {
  DPC.DB.meta.lastSaved = new Date().toISOString();
  const blob = new Blob([JSON.stringify(DPC.DB, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dpc-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
  DPC.saveToLocalStorage();
};

// ── ONEDRIVE FETCH ────────────────────────────────────────────────
async function fetchFromOneDrive() {
  if (!ONEDRIVE_URL) return null;
  try {
    // Convert share URL to direct download URL
    const directUrl = ONEDRIVE_URL.replace('redir?', 'download?');
    const r = await fetch(directUrl, {cache: 'no-store'});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch(e) {
    console.warn('OneDrive fetch failed (using localStorage):', e.message);
    return null;
  }
}

// ── MIGRATION ─────────────────────────────────────────────────────
function migrateDB(db) {
  // v1.x → v2.0: ensure new fields exist on all areas
  if (!db.areas) db.areas = [];
  db.areas.forEach(area => {
    if (!area.afiPhases) area.afiPhases = [];
    if (!area.activityLog) area.activityLog = [];
    if (!area.interventions) area.interventions = [];
    if (!area.generalDigitalSkills) {
      area.generalDigitalSkills = {curriculumSkillsList:'',curriculumPlanningScore:null,centuryAverageData:'',currentGaps:'',gapNarrowingPlan:'',progressTrackingPlan:'',progressData:''};
    }
    if (!area.industryDigitalSkills) {
      area.industryDigitalSkills = {curriculumSkillsList:'',curriculumPlanningScore:null,learnerBaselineData:'',currentGaps:'',gapNarrowingPlan:'',progressTrackingPlan:'',progressData:''};
    }
    if (!area.staffDevelopment) area.staffDevelopment = {staffMembers:[]};
    if (!area.healthChecks) area.healthChecks = {records:[],aggregateScore:null};
    if (!area.ragRatings) {
      area.ragRatings = {history:[],current:{staffCapability:null,hoaLeadership:null,infrastructureDevices:null,digitalSkillsAssessment:null,curriculumIntegration:null,learnerReadiness:null,accessibilityHealth:null,digitalLeadEngagement:null,overall:null}};
    }
    if (!area.ragRatings.current) {
      area.ragRatings.current = {staffCapability:null,hoaLeadership:null,infrastructureDevices:null,digitalSkillsAssessment:null,curriculumIntegration:null,learnerReadiness:null,accessibilityHealth:null,digitalLeadEngagement:null,overall:null};
    }
    if (area.ragRatings.current.overall === undefined) area.ragRatings.current.overall = null;
    if (!area.strengths) area.strengths = '';
    if (!area.context) area.context = '';
    if (!area.m1Summary) area.m1Summary = '';
    if (!area.m2KDP) area.m2KDP = '';
    if (!area.m2Strengths) area.m2Strengths = '';
    if (!area.m2AFIs) area.m2AFIs = '';
    if (!area.nextPlannedAction) area.nextPlannedAction = '';
  });
  if (!db.learningWithoutBarriers) db.learningWithoutBarriers = {frameworkLink:'',activities:[]};
  if (!db.individualActivities) db.individualActivities = [];
  if (!db.myCPD) db.myCPD = [];
  if (!db.settings) db.settings = {afiPhaseTypes:['Foundations','Embedding','Developing','Innovating','Standalone'],customActivityTypes:[],theme:'auto'};
  db.meta.version = SCHEMA_VERSION;
  return db;
}

// ── MERGE SEED INTO DB ────────────────────────────────────────────
// Adds any areas from seed that aren't in DB yet (non-destructive)
function mergeSeedAreas(db, seedAreas) {
  const existingCodes = new Set(db.areas.map(a => a.code));
  seedAreas.forEach(seedArea => {
    if (!existingCodes.has(seedArea.code)) {
      db.areas.push(seedArea);
    }
  });
  // Sort alphabetically by code
  db.areas.sort((a,b) => a.code.localeCompare(b.code));
  return db;
}

// ── MAIN INIT ─────────────────────────────────────────────────────
DPC.initDB = async function() {
  await loadRAGSchema();
  await loadHCSchema();
  const seedAreas = await loadSeedData();

  // Try OneDrive first, then localStorage, then fresh
  let db = await fetchFromOneDrive();
  const localDB = DPC.loadFromLocalStorage();

  if (!db) {
    db = localDB;
  } else if (localDB && localDB.meta?.lastSaved > db.meta?.lastSaved) {
    // localStorage is newer than OneDrive — use localStorage
    console.info('Using localStorage (newer than OneDrive)');
    db = localDB;
  }

  if (!db) {
    db = createEmptyDB();
    console.info('No existing data — starting fresh from seed');
  }

  db = migrateDB(db);
  db = mergeSeedAreas(db, seedAreas);
  DPC.DB = db;
  DPC.saveToLocalStorage();
  return db;
};

// ── HELPERS ───────────────────────────────────────────────────────
DPC.getArea = function(code) {
  return DPC.DB.areas.find(a => a.code === code) || null;
};

DPC.uid = function() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
};

DPC.ragLabel = function(score) {
  if (!score) return {label:'Not rated', cls:'', n: null};
  const labels = {1:'Urgent',2:'Challenged',3:'Developing',4:'On Track',5:'Confident'};
  const classes = {1:'rag-1',2:'rag-2',3:'rag-3',4:'rag-4',5:'rag-5'};
  return {label: labels[score] || '—', cls: classes[score] || '', n: score};
};

DPC.statusBadge = function(status) {
  const map = {
    'not-started': ['Not Started','ns'],
    'in-progress':  ['In Progress','ip'],
    'completed':    ['Completed','done'],
    'planned':      ['Planned','ns'],
    'cancelled':    ['Cancelled','ns'],
  };
  const [label, cls] = map[status] || ['Unknown','ns'];
  return `<span class="status-pill ${cls}" aria-label="Status: ${label}">${label}</span>`;
};

DPC.ragBadge = function(score) {
  if (!score) return `<span class="badge badge-ns" aria-label="Not rated">—</span>`;
  const {label, cls} = DPC.ragLabel(score);
  return `<span class="badge badge-${cls}" aria-label="RAG: ${label}">${score} · ${label}</span>`;
};

DPC.escHtml = function(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
};

DPC.formatDate = function(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
  catch(e){ return d; }
};

// ── AREA RAG WEIGHTED SCORE ───────────────────────────────────────
DPC.calcWeightedRAG = function(dims) {
  if (!DPC.ragSchema) return null;
  const weights = DPC.ragSchema.weights;
  let total = 0, totalWeight = 0;
  Object.keys(weights).forEach(k => {
    const val = dims[k];
    if (val !== null && val !== undefined) {
      total += val * weights[k];
      totalWeight += weights[k];
    }
  });
  if (totalWeight === 0) return null;
  return Math.round(total / totalWeight);
};
