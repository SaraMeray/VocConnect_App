// Render recent sessions (10 most recent, newest first)
function renderRecent() {
  const list = (LIB.sessions || []).slice(-10).reverse();
  const rows = list.length ? list.map((s) => {
    const rubric = LIB.rubrics.find(r => r.id === s.rubricId);
    const filteredScores = s.scores.filter(sc => rubric?.skills.some(sk => sk.id === sc.skillId));
    const scoredScores = filteredScores.filter(sc => typeof sc.score === 'number');
    const skipped = filteredScores.filter(sc => sc.score === 'NA').length;
    const total = scoredScores.reduce((sum, sc) => sum + sc.score, 0);
    const possible = scoredScores.length * 5;
    const avg = scoredScores.length ? (total / scoredScores.length).toFixed(1) : '—';
    const idx = LIB.sessions.indexOf(s);
    return `<button class="recent-row" onclick="viewSession(${idx})" style="cursor:pointer;text-align:left">
    <div class="rs">${avg}</div>
    <div class="ri"><div class="rt">${esc(s.student)} — ${esc(s.focus)}</div>
    <div class="rm">${esc(s.call)} ${esc(s.box)} · ${total}/${possible}${skipped ? ` · ${skipped} N/A` : ''} · ${new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date(s.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}${s.notes ? `<br><span style="font-size:11.5px;font-style:italic;color:#9aa4b2">"${esc(s.notes.substring(0, 60))}${s.notes.length > 60 ? '…' : ''}"</span>` : ''}</div></div>
    </button>`;
  }).join('') : `<div class="empty">No sessions yet. Score one to see it here.</div>`;

  app.innerHTML = `<div class="fade">${crumbs()}
    <h1 class="screen-title">Recent sessions</h1>
    <p class="screen-sub">Tap a session to view details and print. The big number is the session average.</p>
    ${rows}
    <p class="screen-sub" style="margin-top:18px">Displaying 10 most recent sessions.</p>
    <div style="margin-top:40px">${returnToScoringBtn()}</div></div>`;
  savebar.innerHTML = '';
}

// View a specific past session
window.viewSession = idx => {
  const sess = LIB.sessions[idx];
  if (!sess) return;
  state.viewingSession = sess;
  go('viewSession');
};

// Render individual session details
function renderViewSession() {
  const s = state.viewingSession;
  if (!s) return;

  const rubric = LIB.rubrics.find(r => r.id === s.rubricId);
  s.skills = rubric ? rubric.skills : [];
  s.scores = s.scores.filter(sc => s.skills.some(sk => sk.id === sc.skillId));

  // Recalculate aggregates based on filtered scores
  const scoredCount = s.scores.filter(sc => typeof sc.score === 'number').length;
  s.skipped = s.scores.filter(sc => sc.score === 'NA').length;
  s.total = s.scores.filter(sc => typeof sc.score === 'number').reduce((sum, sc) => sum + sc.score, 0);
  s.possible = scoredCount * 5;
  s.avg = scoredCount ? (s.total / scoredCount).toFixed(1) : '—';

  const today = new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = new Date(s.savedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Build skill list from stored scores and skills
  const skillList = (s.skills || []).map(sk => {
    const score = s.scores.find(sc => sc.skillId === sk.id)?.score;
    if (score === undefined) return '';
    const val = score === 'NA' ? 'N/A' : (typeof score === 'number' ? score : '—');
    const label = val === 'N/A' ? 'Not Assessed' : (val === '—' ? '—' : ['Not Displayed', 'Full Physical', 'Model/Partial', 'Verbal', 'Gestural/Visual', 'Independent'][val] || val);
    return `<div class="skill-view"><span style="flex:1">${esc(sk.text)}</span><span style="font-weight:900;color:var(--dkblue);min-width:60px">Score ${val}</span><span style="font-size:12px;color:var(--gray);min-width:140px">${label}</span></div>`;
  }).filter(x => x).join('');

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('recent')">‹ Recent Sessions</button></p>
    <div class="saved-hero" style="background:linear-gradient(135deg,var(--blue),var(--dkblue))">
      <h2 style="color:#fff;font-family:var(--head);font-size:28px;margin:0 0 4px">${esc(s.student)}</h2>
      <p style="color:var(--ltblue);font-weight:700;margin:0">${esc(s.focus)}</p>
      <p style="margin-top:10px;font-size:26px;font-family:var(--head);color:#fff">${s.total}<span style="color:var(--ltblue);font-size:16px">/${s.possible} · avg ${s.avg}</span></p>
      <p style="margin:6px 0 0;font-size:12px;color:var(--ltblue)">${esc(s.call)} ${esc(s.box)} • ${esc(s.type || 'Single')} • ${today} at ${time} • Scored by: ${esc(s.evaluatorName || 'Unknown')}</p>
      ${s.skipped ? `<p style="margin:6px 0 0;color:var(--ltblue);font-weight:700;font-size:13px">${s.skipped} skill${s.skipped === 1 ? '' : 's'} marked not assessed</p>` : ''}
      ${s.notes ? `<p style="margin:10px 0 0;font-size:13px;color:var(--ltblue);font-style:italic;max-width:400px;line-height:1.4">"${esc(s.notes)}"</p>` : ''}
      <div class="mini">
        <button class="btn ghost" onclick="go('reportStudent')">Back to Student Report</button>
        <button class="btn save" style="box-shadow:none" onclick="printPastSession()">Print Session</button>
      </div>
    </div>
    <div style="margin-top:22px">
      <h3 style="font-family:var(--head);font-size:20px;color:var(--dkblue);margin:0 0 12px">Skills scored</h3>
      ${skillList}
    </div></div>`;
  savebar.innerHTML = '';
}

// Print a past session
window.printPastSession = () => {
  const s = state.viewingSession;
  if (!s) return;

  const rubric = LIB.rubrics.find(r => r.id === s.rubricId);
  s.skills = rubric ? rubric.skills : [];
  s.scores = s.scores.filter(sc => s.skills.some(sk => sk.id === sc.skillId));

  // Recalculate aggregates based on filtered scores
  const scoredCount = s.scores.filter(sc => typeof sc.score === 'number').length;
  s.skipped = s.scores.filter(sc => sc.score === 'NA').length;
  s.total = s.scores.filter(sc => typeof sc.score === 'number').reduce((sum, sc) => sum + sc.score, 0);
  s.possible = scoredCount * 5;
  s.avg = scoredCount ? (s.total / scoredCount).toFixed(1) : '—';

  const today = new Date(s.savedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

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
  <div class="logo">RED OAK VOC ROOM</div>
  <div class="meta">
    <div><div class="meta-label">Student</div><div>${esc(s.student)}</div></div>
    <div><div class="meta-label">Date</div><div>${today}</div></div>
    <div><div class="meta-label">Task Box</div><div>${esc(s.box)}</div></div>
    <div><div class="meta-label">Scored by</div><div>${esc(s.evaluatorName || 'Unknown')}</div></div>
  </div>
</div>
<h2>${esc(s.focus)}</h2>
<div class="meta" style="margin-bottom:14pt">
  <div><span class="meta-label">Call #</span> ${esc(s.call)}</div>
  <div><span class="meta-label">Type</span> ${esc(s.type || 'Single')}</div>
</div>
<div class="summary">
  <div class="summary-row"><span>Skills scored:</span><span class="summary-val">${scoredCount}/${s.skills.length}</span></div>
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
      const score = s.scores.find(sc => sc.skillId === sk.id)?.score;
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
