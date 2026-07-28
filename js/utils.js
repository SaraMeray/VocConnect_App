// Initialize roster from LIB.students
function initializeRoster() {
  ROSTER = LIB.students.map(s => ({
    id: s.id,
    name: s.name,
    studentId: s.id,
    group: s.group || 'All',
    active: s.active
  }));
}

// String utilities
const initials = n => n.split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(w => w[0])
  .join('')
  .toUpperCase();

const esc = s => s.replace(/[&<>"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[c]));

// Roster helpers
function activeStudents() {
  return ROSTER.filter(s => s.active !== false);
}

function studentById(id) {
  return ROSTER.find(s => s.id === id);
}

function normalizeGroup(raw) {
  let g = (raw || '').trim().replace(/\s+/g, ' ');
  if (!g) return '';
  // "102", "room 102", "rm 102", "room102", "#102", "classroom 102" -> "Room 102"
  const m = g.match(/^(?:room|rm\.?|classroom|class|#)?\s*0*(\d{1,4})$/i);
  return m ? 'Room ' + m[1] : g;
}

function rosterGroups() {
  return [...new Set(ROSTER.map(s => normalizeGroup(s.group)).filter(Boolean))].sort();
}

// Box helpers
function boxRubrics(box) {
  return box.rubricIds.map(id => LIB.rubrics.find(r => r.id === id)).filter(Boolean);
}

function activeRubrics(box) {
  return boxRubrics(box).filter(r => r.active !== false);
}

function activeBoxes() {
  return LIB.physicalBoxes.filter(b => b.active !== false && activeRubrics(b).length > 0);
}

// Navigation
function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function reset() {
  state.student = null;
  state.box = null;
  state.rubric = null;
  state.scores = {};
  state.sessionNotes = '';
  go('students');
}

// Breadcrumbs
function crumbs() {
  const parts = [];
  parts.push(`<button class="c" onclick="reset()">Students</button>`);
  if (state.student) parts.push(`<span class="sep">›</span><button class="c" onclick="go('boxes')">${esc(state.student.name)}</button>`);
  if (state.box) parts.push(`<span class="sep">›</span><span class="c muted">${esc(state.box.name)}</span>`);
  if (state.rubric) parts.push(`<span class="sep">›</span><span class="c muted">${esc(state.rubric.skillFocus || state.rubric.boxName)}</span>`);
  return `<div class="crumbs">${parts.join('')}</div>`;
}

// UI Helpers
function returnToScoringBtn() {
  return `<button class="return-to-scoring-btn" onclick="reset()">← Return to Scoring</button>`;
}
