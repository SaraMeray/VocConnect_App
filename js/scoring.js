// Skill control buttons for scoring
function skillControls(sk) {
  const v = state.scores[sk.id];
  const na = v === 'NA';
  const lvls = [0, 1, 2, 3, 4, 5].map(n => `<button class="lvl ${v === n ? 'sel ' + SCALE_GROUP[n] : ''}" onclick="setScore('${sk.id}',${n})">
      <span class="ln">${n}</span><span class="lp">${LVL[n].p}</span></button>`).join('');
  return `<div class="scale ${na ? 'naoff' : ''}">${lvls}</div>
      <div class="skiprow">${na ? '<span class="nahint">Not counted in this session\'s score</span>' : ''}
      <button class="skip ${na ? 'on' : ''}" onclick="setSkip('${sk.id}')">${na ? '✓ Not assessed' : 'Not assessed'}</button></div>`;
}

// Render scoring screen
function renderScore() {
  const r = state.rubric;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const rows = r.skills.map((sk, i) => {
    const na = state.scores[sk.id] === 'NA';
    return `<div class="skill ${na ? 'isna' : ''}" data-sid="${esc(sk.id)}"><div class="stext"><span class="snum">${i + 1}</span><span>${esc(sk.text)}</span></div>
      ${skillControls(sk)}</div>`;
  }).join('');

  app.innerHTML = `<div class="fade">${crumbs()}
    <div class="context"><div class="ctitle">${esc(r.boxName)}</div>
      <div class="crow"><span>Student <b>${esc(state.student.name)}</b></span>
      <span>${esc(r.callNumber)}</span>
      <span>${esc(r.skillFocus || r.boxName)}</span>
      <span>${esc(r.type || 'Single')}</span><span>Date <b>${today}</b></span></div></div>
    ${rows}
    <div class="notes-sec">
      <label class="lbl" style="font-family:var(--head);font-size:18px;letter-spacing:.4px;margin-bottom:8px">Session notes <span style="font-family:var(--base);font-weight:400;font-size:13px;color:#9aa4b2">(optional)</span></label>
      <textarea class="notes-in" placeholder="Observations, context, or behavior notes for this session…" id="sessNotes" oninput="state.sessionNotes=this.value">${esc(state.sessionNotes || '')}</textarea></div></div>`;
  renderSaveBar();
}

// Set individual score
window.setScore = (sid, n) => {
  state.scores[sid] = (state.scores[sid] === n) ? undefined : n;
  if (state.scores[sid] === undefined) delete state.scores[sid];
  updateSkill(sid);
  renderSaveBar();
};

// Toggle "Not Assessed"
window.setSkip = sid => {
  state.scores[sid] = (state.scores[sid] === 'NA') ? undefined : 'NA';
  if (state.scores[sid] === undefined) delete state.scores[sid];
  updateSkill(sid);
  renderSaveBar();
};

// Update single skill display
function updateSkill(sid) {
  const r = state.rubric;
  const idx = r.skills.findIndex(s => s.id === sid);
  const el = document.querySelectorAll('.skill')[idx];
  if (!el) return;
  const sk = r.skills[idx];
  const na = state.scores[sid] === 'NA';
  el.className = 'skill' + (na ? ' isna' : '');
  el.innerHTML = `<div class="stext"><span class="snum">${idx + 1}</span><span>${esc(sk.text)}</span></div>${skillControls(sk)}`;
}

// Render save bar with progress
function renderSaveBar() {
  const r = state.rubric;
  const vals = Object.values(state.scores);
  const scored = vals.filter(v => typeof v === 'number');
  const skipped = vals.filter(v => v === 'NA').length;
  const resolved = scored.length + skipped;
  const sum = scored.reduce((a, b) => a + b, 0);
  const poss = scored.length * 5;
  const avg = scored.length ? (sum / scored.length).toFixed(1) : '—';
  const left = r.skills.length - resolved;

  savebar.innerHTML = `<div class="inner" style="position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:25px;flex-wrap:wrap">
    <div class="tally"><span>Scored<b>${scored.length}<span style="font-size:14px;color:#aeb6c2">/${r.skills.length}</span></b></span>
    ${skipped ? `<span>Skipped<b style="color:var(--orange)">${skipped}</b></span>` : ''}
    <span class="sep done"><span>Total<b>${sum}<span style="font-size:14px;color:#aeb6c2">/${poss}</span></b></span></span>
    <span>Avg<b>${avg}</b></span></div>
    <button class="btn save" ${left ? 'disabled' : ''} onclick="this.disabled=true; saveSession()">
      ${left ? `${left} skill${left === 1 ? '' : 's'} left` : 'Save session'}</button></div>`;
}

// Save session to backend and local store
window.saveSession = async () => {
  const r = state.rubric;
  const entries = Object.entries(state.scores);
  const scored = entries.filter(([, v]) => typeof v === 'number');
  const skipped = entries.filter(([, v]) => v === 'NA').length;
  const sum = scored.reduce((a, [, v]) => a + v, 0);

  // Generate unique session ID
  const sessionId = 'sess_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();

  // Save to local store for immediate feedback
  const sess = Store.save({
    id: sessionId,
    student: state.student.name,
    box: state.box.name,
    call: r.callNumber,
    focus: r.skillFocus || r.boxName,
    type: r.type,
    total: sum,
    possible: scored.length * 5,
    scoredCount: scored.length,
    skipped,
    avg: scored.length ? (sum / scored.length).toFixed(1) : '—',
    notes: state.sessionNotes.trim(),
    skills: r.skills,
    scores: { ...state.scores }
  });

  // Send to Google Sheets backend
  try {
    await submitSessionToBackend({
      sessionId: sess.id,
      studentId: state.student.id,
      rubricId: r.id,
      notes: state.sessionNotes.trim(),
      scores: Object.entries(state.scores).map(([skillId, score]) => ({ skillId, score }))
    });
  } catch (err) {
    console.error('Failed to save to backend:', err);
  }

  state._last = sess;
  go('saved');
};

// Saved session confirmation screen
function renderSaved() {
  const s = state._last;
  app.innerHTML = `<div class="fade"><div class="saved-hero">
    <div class="check">✓</div><h2>Session saved</h2>
    <p>${esc(s.student)} · ${esc(s.focus)}</p>
    <p style="margin-top:10px;font-size:26px;font-family:var(--head);color:#fff">${s.total}<span style="color:var(--ltblue);font-size:16px">/${s.possible} · avg ${s.avg}</span></p>
    ${s.skipped ? `<p style="margin:6px 0 0;color:var(--ltblue);font-weight:700;font-size:13px">${s.skipped} skill${s.skipped === 1 ? '' : 's'} marked not assessed</p>` : ''}
    ${s.notes ? `<p style="margin:10px 0 0;font-size:13px;color:var(--ltblue);font-style:italic;max-width:400px;line-height:1.4">"${esc(s.notes)}"</p>` : ''}
    <div class="mini">
      <button class="btn ghost" onclick="reset()">New student</button>
      <button class="btn ghost" onclick="go('boxes')">Same student, new box</button>
      <button class="btn save" style="box-shadow:none" onclick="printSession()">Print session</button>
      <button class="btn ghost" onclick="go('recent')">View recent</button>
    </div></div>
    <p class="screen-sub" style="text-align:center">Session saved to Google Workspace database.</p></div>`;
  savebar.innerHTML = '';
}

// Print session from saved screen
window.printSession = () => {
  const s = state._last;
  if (!s) return;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Session Report - ${esc(s.student)}</title>
<style>
  body{font-family:'Lato',Arial,sans-serif;max-width:8.5in;margin:0;padding:20pt;background:#fff;color:#333}
  .header{border-bottom:3px solid #002D74;padding-bottom:12pt;margin-bottom:18pt}
  .logo{font-family:'Bebas Neue',Arial,sans-serif;font-size:24px;letter-spacing:1px;color:#00145B;margin-bottom:6pt}
  .meta{display:flex;justify-content:space-between;font-size:10pt;color:#666;flex-wrap:wrap}
  .meta-label{font-weight:700;color:#002D74}
  h2{font-family:'Bebas Neue',Arial,sans-serif;font-size:20px;letter-spacing:.4px;color:#00145B;margin:14pt 0 4pt;page-break-after:avoid}
  .summary{background:#f7f7f7;border-left:4px solid #80BC00;padding:12pt;margin:14pt 0;font-size:10pt}
  .summary-row{display:flex;justify-content:space-between;margin:4pt 0}
  .summary-val{font-weight:900;color:#00145B;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:10pt;margin:12pt 0}
  th{background:#002D74;color:#fff;padding:6pt 8pt;text-align:left;font-weight:700}
  td{padding:7pt 8pt;border-bottom:1px solid #e0e0e0}
  tr:nth-child(even){background:#f9f9f9}
  .footer{border-top:1px solid #ddd;margin-top:20pt;padding-top:12pt;font-size:9pt;color:#999;text-align:center}
</style></head>
<body>
<div class="header">
  <div class="logo">WISD VOC ROOM</div>
  <div class="meta">
    <div><div class="meta-label">Student</div><div>${esc(s.student)}</div></div>
    <div><div class="meta-label">Date</div><div>${today}</div></div>
    <div><div class="meta-label">Task Box</div><div>${esc(s.box)}</div></div>
  </div>
</div>
<h2>${esc(s.focus)}</h2>
<div class="meta" style="margin-bottom:14pt">
  <div><span class="meta-label">Call #</span> ${esc(s.call)}</div>
  <div><span class="meta-label">Type</span> ${esc(s.type || 'Single')}</div>
</div>
<div class="summary">
  <div class="summary-row"><span>Skills scored:</span><span class="summary-val">${s.scoredCount}</span></div>
  ${s.skipped ? `<div class="summary-row"><span>Not assessed:</span><span class="summary-val">${s.skipped}</span></div>` : ''}
  <div class="summary-row" style="font-size:11pt;margin-top:6pt;padding-top:6pt;border-top:1px solid rgba(0,0,0,0.1)">
    <span style="font-weight:700">Total score</span>
    <span class="summary-val" style="font-size:18px">${s.total}/${s.possible}</span>
  </div>
  <div class="summary-row"><span>Average</span><span class="summary-val">${s.avg}</span></div>
</div>
<h2>Skills Scored</h2>
<table>
  <thead><tr><th style="width:60%">Skill</th><th style="width:20%;text-align:center">Score</th><th style="width:20%;text-align:center">Level</th></tr></thead>
  <tbody>
    ${(s.skills || []).map(sk => {
      const score = s.scores[sk.id];
      if (score === undefined) return '';
      const val = score === 'NA' ? 'N/A' : (typeof score === 'number' ? score : '—');
      const label = val === 'N/A' ? 'Not Assessed' : (val === '—' ? '—' : ['Not Displayed', 'Full Physical', 'Model/Partial', 'Verbal', 'Gestural/Visual', 'Independent'][val] || val);
      return `<tr><td>${esc(sk.text)}</td><td style="text-align:center;font-weight:900;color:#00145B">${val}</td><td>${label}</td></tr>`;
    }).filter(x => x).join('')}
  </tbody>
</table>
${s.notes ? `<div style="background:#fffaf0;border-left:4px solid #F3B151;padding:12pt;margin:14pt 0;font-size:10pt;line-height:1.5"><strong>Session notes:</strong><br><br>${esc(s.notes)}</div>` : ''}
<div class="footer">
  <p>Session Report • ${today} • WISD Vocational Room Data Collection</p>
</div>
</body>
</html>`;

  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);
  const doc = printFrame.contentDocument || printFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    printFrame.contentWindow.print();
  }, 250);
};
