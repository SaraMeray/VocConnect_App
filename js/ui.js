// Main render function - routes to appropriate screen
function render() {
  switch (state.screen) {
    case 'home':
      renderHome();
      break;
    case 'students':
      renderStudents();
      break;
    case 'boxes':
      renderBoxes();
      break;
    case 'rubric':
      renderRubric();
      break;
    case 'score':
      renderScore();
      break;
    case 'saved':
      renderSaved();
      break;
    case 'recent':
      renderRecent();
      break;
    case 'viewSession':
      renderViewSession();
      break;
    case 'reports':
      renderReports();
      break;
    case 'reportStudent':
      renderReportStudent();
      break;
    case 'reportGroup':
      renderReportGroup();
      break;
    case 'admin':
      renderAdmin();
      break;
    case 'bulkImport':
      renderBulkImport();
      break;
    case 'roster':
      renderRoster();
      break;
    case 'rosterImport':
      renderRosterImport();
      break;
    case 'boxEdit':
      renderBoxEdit();
      break;
    case 'studentEdit':
      renderStudentEdit();
      break;
    case 'rubricEdit':
      renderRubricEdit();
      break;
    default:
      renderHome();
  }
}

// Home screen
function renderHome() {
  app.innerHTML = `<div class="fade">
    <div class="home-hero">
      <h1 class="head" style="font-size:48px;color:var(--dkblue);margin:0 0 8px;letter-spacing:.5px">Ready to Record Skills?</h1>
      <p style="font-size:16px;color:var(--gray);margin:0;line-height:1.6">Use this tool to collect task box assessment data for your students. Below is the scoring scale you'll be using.</p>
    </div>
    
    <div style="background:#fff;border:1.5px solid #e7edf5;border-radius:14px;padding:24px;margin-bottom:24px">
      <h2 class="head" style="font-size:20px;color:var(--dkblue);margin:0 0 16px">6-Level Scoring Scale</h2>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">
        <div style="background:var(--xltgray);border:1.5px solid #e2e8f1;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:#595959;line-height:1">0</div>
          <div style="font-weight:700;font-size:11px;color:var(--dkblue);margin-top:4px;line-height:1.3">Not Displayed</div>
        </div>
        <div style="background:#d7f3ff;border:1.5px solid #b3ddf5;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:var(--blue);line-height:1">1</div>
          <div style="font-weight:700;font-size:11px;color:var(--dkblue);margin-top:4px;line-height:1.3">Full Physical</div>
        </div>
        <div style="background:#c5e6ff;border:1.5px solid #8fd5ff;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:var(--blue);line-height:1">2</div>
          <div style="font-weight:700;font-size:11px;color:var(--dkblue);margin-top:4px;line-height:1.3">Model/Partial</div>
        </div>
        <div style="background:#b3e5a0;border:1.5px solid #7dd468;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:#3d5a1a;line-height:1">3</div>
          <div style="font-weight:700;font-size:11px;color:#26420a;margin-top:4px;line-height:1.3">Verbal</div>
        </div>
        <div style="background:#c5e680;border:1.5px solid #9dc74d;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:#5d8600;line-height:1">4</div>
          <div style="font-weight:700;font-size:11px;color:#26420a;margin-top:4px;line-height:1.3">Gestural/Visual</div>
        </div>
        <div style="background:#80BC00;border:1.5px solid #70a300;border-radius:11px;padding:10px;text-align:center">
          <div style="font-family:var(--head);font-size:24px;color:#fff;line-height:1">5</div>
          <div style="font-weight:700;font-size:11px;color:#fff;margin-top:4px;line-height:1.3">Independent</div>
        </div>
      </div>
    </div>

    <div style="background:#f2f8e5;border:1.5px solid #d7ecc2;border-radius:14px;padding:18px;margin-bottom:28px">
      <h3 class="head" style="font-size:16px;color:var(--medgreen);margin:0 0 12px">Quick Tips</h3>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:var(--gray);line-height:1.7">
        <li>Select a student and task box to begin</li>
        <li>Rate each skill using the 0–5 scale above</li>
        <li>Add notes if helpful (optional)</li>
        <li>Scores are saved to your secure workspace</li>
      </ul>
    </div>

    <button class="return-to-scoring-btn" onclick="go('students')" style="margin:0;font-size:18px;padding:16px 24px">Start Recording Data →</button>
  </div>`;
  savebar.innerHTML = '';
}

// Students selection screen
function renderStudents() {
  const groups = rosterGroups();
  const g = state.studentGroup || 'All';
  const list = activeStudents()
    .filter(s => g === 'All' || normalizeGroup(s.group) === g)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const cards = list.map(s => `<button class="card student-card" onclick="pickStudent('${s.id}')">
    <span class="avatar-lg">${initials(s.name)}</span>
    <span><span class="name">${esc(s.name)}</span><br><span class="meta">${esc(s.group || '—')}</span></span></button>`).join('')
    || `<div class="empty">No students in this group yet. Add them under Manage → Roster.</div>`;
  
  const chips = groups.length ? `<div class="chips">${['All', ...groups].map(x => `<button class="chip${x === g ? ' on' : ''}" onclick="state.studentGroup='${esc(x)}';renderStudents()">${esc(x)}</button>`).join('')}</div>` : '';
  
  app.innerHTML = `<div class="fade">
    <div class="demo-banner"><b>Preview</b> These are fictional sample names, kept in memory only — no real student data is shown or stored here. Real rosters load from your Google Sheet in Phase 2.</div>
    <h1 class="screen-title">Choose a student</h1>
    <p class="screen-sub">Pick who you're collecting data for today.</p>
    ${chips}
    <div class="grid">${cards}</div></div>`;
  savebar.innerHTML = '';
}

window.pickStudent = id => {
  state.student = studentById(id);
  state.box = null;
  state.rubric = null;
  go('boxes');
};

// Boxes selection screen
function renderBoxes() {
  const cards = activeBoxes().map(b => {
    const rs = activeRubrics(b);
    const n = rs.length;
    const calls = [...new Set(rs.map(r => r.callNumber))];
    const tag = n > 1 ? `<span class="tag multi">${n} rubrics</span>` : `<span class="tag blue">${calls[0]}</span>`;
    return `<button class="card" data-name="${esc(b.name.toLowerCase())} ${calls.join(' ').toLowerCase()}" onclick="pickBox('${b.id}')">
      <span class="name">${esc(b.name)}</span>
      <span class="meta">${calls.join(' · ')}</span>${tag}</button>`;
  }).join('');

  app.innerHTML = `<div class="fade">${crumbs()}
    <h1 class="screen-title">Choose a task box</h1>
    <p class="screen-sub">Tap the box ${esc(state.student.name)} is working from. Boxes with more than one rubric let you pick next.</p>
    <input class="search" id="boxSearch" placeholder="Search by box name or call number…" oninput="filterBoxes(this.value)">
    <div class="grid" id="boxGrid">${cards}</div></div>`;
  savebar.innerHTML = '';
}

window.filterBoxes = v => {
  v = v.toLowerCase();
  document.querySelectorAll('#boxGrid .card').forEach(c => {
    c.style.display = c.dataset.name.includes(v) ? '' : 'none';
  });
};

window.pickBox = id => {
  state.box = LIB.physicalBoxes.find(b => b.id === id);
  const rs = activeRubrics(state.box);
  if (rs.length === 1) {
    startRubric(rs[0]);
  } else {
    state.rubric = null;
    go('rubric');
  }
};

// Rubric selection screen
function renderRubric() {
  const rs = activeRubrics(state.box);
  const opts = rs.map(r => {
    const cls = (r.type || 'Single').toLowerCase();
    const isDraft = r.published === false;
    return `<button class="rubric-opt${isDraft ? ' disabled' : ''}" ${isDraft ? 'disabled' : ''}onclick="startRubric(LIB.rubrics.find(x=>x.id==='${r.id}'))" title="${isDraft ? 'This rubric is in draft mode and is not yet ready for scoring' : ''}">
      <span class="pill ${cls}">${esc(r.type || 'Single')}${isDraft ? ' · DRAFT' : ''}</span>
      <span><span class="focus">${esc(r.skillFocus || r.boxName)}</span><br>
      <span class="sub">${esc(r.callNumber)} · ${r.skills.length} skills${isDraft ? ' · Not published' : ''}</span></span>
      <span class="arrow">›</span></button>`;
  }).join('');

  app.innerHTML = `<div class="fade">${crumbs()}
    <h1 class="screen-title">Which rubric?</h1>
    <p class="screen-sub">${esc(state.box.name)} has ${rs.length} rubrics on this box — choose the one you're scoring.</p>
    ${opts}</div>`;
  savebar.innerHTML = '';
}

window.startRubric = r => {
  state.rubric = r;
  state.scores = {};
  state.sessionNotes = '';
  go('score');
};
