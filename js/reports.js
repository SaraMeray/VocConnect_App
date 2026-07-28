// Reports home screen
function renderReports() {
  app.innerHTML = `<div class="fade">
    <h1 class="screen-title">Reports</h1>
    <p class="screen-sub">View student progress and group performance.</p>
    <div class="grid">
      <button class="card" onclick="go('reportStudent')">
        <span class="name">Student Progress</span>
        <span class="meta">Individual growth over time</span></button>
      <button class="card" onclick="go('reportGroup')">
        <span class="name">Group Summary</span>
        <span class="meta">Classroom performance & engagement</span></button>
    </div>
    <div style="margin-top:40px">${returnToScoringBtn()}</div></div>`;
  savebar.innerHTML = '';
}

// Get sessions for a specific student
function reportStudentSessions(studentName) {
  return LIB.sessions.filter(s => s.student === studentName).reverse();
}

// Calculate stats for a student
function reportStudentStats(studentName) {
  const sessions = reportStudentSessions(studentName);
  if (!sessions.length) return { totalSessions: 0, uniqueBoxes: 0, boxStats: {}, overallAvg: 0 };

  const boxes = {};
  sessions.forEach(s => {
    if (!boxes[s.box]) boxes[s.box] = { scores: [], sessions: 0 };
    boxes[s.box].sessions++;
    const scores = s.scores.filter(item => typeof item.score === 'number').map(item => item.score);
    if (scores.length) boxes[s.box].scores.push(...scores);
  });

  const boxStats = {};
  Object.entries(boxes).forEach(([name, data]) => {
    const avg = data.scores.length ? ((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)) : 0;
    boxStats[name] = { avg: parseFloat(avg), sessions: data.sessions };
  });

  const allScores = Object.values(boxes).flatMap(b => b.scores);
  return {
    totalSessions: sessions.length,
    uniqueBoxes: Object.keys(boxes).length,
    overallAvg: allScores.length ? ((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)) : 0,
    boxStats
  };
}

// Get sessions for a group
function reportGroupSessions(group) {
  return LIB.sessions.filter(s => normalizeGroup(ROSTER.find(r => r.name === s.student)?.group) === group).reverse();
}

// Calculate stats for a group
function reportGroupStats(group) {
  const sessions = reportGroupSessions(group);
  if (!sessions.length) return { totalSessions: 0, uniqueStudents: 0, boxStats: {} };

  const students = new Set(sessions.map(s => s.student));
  const boxes = {};

  sessions.forEach(s => {
    if (!boxes[s.box]) boxes[s.box] = { scores: [], sessions: 0 };
    boxes[s.box].sessions++;
    const scores = s.scores.filter(item => typeof item.score === 'number').map(item => item.score);
    if (scores.length) boxes[s.box].scores.push(...scores);
  });

  const boxStats = {};
  Object.entries(boxes).forEach(([name, data]) => {
    const avg = data.scores.length ? ((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)) : 0;
    boxStats[name] = { avg: parseFloat(avg), sessions: data.sessions };
  });

  return { totalSessions: sessions.length, uniqueStudents: students.size, boxStats };
}

// Student progress report screen
function renderReportStudent() {
  const students = [...new Set(LIB.sessions.map(s => s.student))].sort();
  const selected = state.reportStudentName || '';
  const stats = selected ? reportStudentStats(selected) : null;
  const sessions = selected ? reportStudentSessions(selected) : [];

  const chartContainer = selected ? `<div style="margin:22px 0;"><canvas id="studentChart" style="max-height:300px"></canvas></div>` : '';
  const boxChart = selected && Object.keys(stats.boxStats).length ? `<div style="margin:22px 0;"><canvas id="boxChart" style="max-height:280px"></canvas></div>` : '';

  let sessionTable = '';
  if (selected) {
    const recentList = LIB.sessions;
    const sessionRows = sessions.length ? sessions.map((s) => {
      const idx = recentList.indexOf(s);
      const rubric = LIB.rubrics.find(r => r.id === s.rubricId);
      const filteredScores = s.scores.filter(sc => rubric?.skills.some(sk => sk.id === sc.skillId));
      const scoredScores = filteredScores.filter(sc => typeof sc.score === 'number');
      const total = scoredScores.reduce((sum, sc) => sum + sc.score, 0);
      const possible = scoredScores.length * 5;
      const avg = scoredScores.length ? (total / scoredScores.length).toFixed(1) : '—';
      return `<div class="recent-row" style="cursor:pointer" onclick="viewSession(${idx})">
        <div class="rs">${avg}</div>
        <div class="ri"><div class="rt">${esc(s.focus)}</div>
        <div class="rm">${esc(s.box)} · ${total}/${possible} · ${new Date(s.savedAt).toLocaleDateString()}</div></div></div>`;
    }).join('') : '<div class="empty">No sessions</div>';
    sessionTable = `<div style="margin-top:22px;"><h3 style="font-family:var(--head);font-size:18px;color:var(--dkblue);margin:0 0 12px">Sessions (${sessions.length})</h3>${sessionRows}</div>`;
  }

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('reports')">‹ Reports</button></p>
    <h1 class="screen-title">Student Progress</h1>
    <label class="fld" style="margin-bottom:18px"><span class="lbl">Select student</span>
      <select class="in" onchange="state.reportStudentName=this.value;renderReportStudent()" style="cursor:pointer">
        <option value="">Choose a student…</option>
        ${students.map(s => `<option value="${esc(s)}" ${s === selected ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select></label>
    ${selected ? `<div class="summary" style="background:var(--xltblue);border-left:4px solid var(--blue);padding:14px;border-radius:10px;margin-bottom:18px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;font-size:13px">
        <div><span style="font-weight:700;color:var(--blue)">Total sessions</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${stats.totalSessions}</div></div>
        <div><span style="font-weight:700;color:var(--blue)">Unique boxes</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${stats.uniqueBoxes}</div></div>
        <div><span style="font-weight:700;color:var(--blue)">Overall average</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${stats.overallAvg}</div></div>
      </div>
    </div>` : ''}
    ${chartContainer}
    ${boxChart}
    ${sessionTable}
    <div style="margin-top:22px"><button class="btn ghost" onclick="reportPrintStudent()">Print report</button></div></div>`;
  savebar.innerHTML = '';
  if (selected) { setTimeout(() => { renderStudentProgressCharts(selected, stats, sessions) }, 50); }
}

// Render student progress charts
function renderStudentProgressCharts(studentName, stats, sessions) {
  // Timeline chart
  if (sessions.length) {
    const ctx = document.getElementById('studentChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: sessions.map((s, i) => (i + 1).toString()),
        datasets: [{
          label: 'Session Average',
          data: sessions.map(s => parseFloat(s.avg)),
          borderColor: '#002D74',
          backgroundColor: '#D7EBFD',
          tension: 0.4,
          fill: true
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, max: 5 } } }
    });
  }
  // Box performance chart
  if (Object.keys(stats.boxStats).length) {
    const ctx = document.getElementById('boxChart');
    if (!ctx) return;
    const boxes = Object.keys(stats.boxStats).sort();
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: boxes.map(b => b.substring(0, 20)),
        datasets: [{ label: 'Average Score', data: boxes.map(b => stats.boxStats[b].avg), backgroundColor: '#80BC00' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 5 } } }
    });
  }
}

// Group summary report screen
function renderReportGroup() {
  const groups = rosterGroups();
  const selected = state.reportGroupName || '';
  const stats = selected ? reportGroupStats(selected) : null;
  const sessions = selected ? reportGroupSessions(selected) : [];

  const engageChart = selected ? `<div style="margin:22px 0;"><canvas id="groupChart" style="max-height:300px"></canvas></div>` : '';
  const boxChart = selected && Object.keys(stats.boxStats).length ? `<div style="margin:22px 0;"><canvas id="groupBoxChart" style="max-height:280px"></canvas></div>` : '';

  const studentList = selected ? `<div style="margin-top:22px;"><h3 style="font-family:var(--head);font-size:18px;color:var(--dkblue);margin:0 0 12px">Students in ${esc(selected)}</h3>
    ${[...new Set(sessions.map(s => s.student))].sort().map(name => {
      const studentSessions = sessions.filter(s => s.student === name);
      const avg = studentSessions.length ? (studentSessions.reduce((a, s) => a + parseFloat(s.avg), 0) / studentSessions.length).toFixed(1) : '—';
      return `<div class="admin-row" style="margin-bottom:9px"><div class="ar-main"><div class="ar-name">${esc(name)}</div>
        <div class="ar-meta">${studentSessions.length} session${studentSessions.length === 1 ? '' : 's'} · avg ${avg}</div></div></div>`;
    }).join('')}</div>` : '';

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('reports')">‹ Reports</button></p>
    <h1 class="screen-title">Group Summary</h1>
    <label class="fld" style="margin-bottom:18px"><span class="lbl">Select classroom</span>
      <select class="in" onchange="state.reportGroupName=this.value;renderReportGroup()" style="cursor:pointer">
        <option value="">Choose a room…</option>
        ${groups.map(g => `<option value="${esc(g)}" ${g === selected ? 'selected' : ''}>${esc(g)}</option>`).join('')}
      </select></label>
    ${selected ? `<div class="summary" style="background:var(--xltgreen);border-left:4px solid var(--green);padding:14px;border-radius:10px;margin-bottom:18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px">
        <div><span style="font-weight:700;color:var(--medgreen)">Total sessions</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${stats.totalSessions}</div></div>
        <div><span style="font-weight:700;color:var(--medgreen)">Unique students</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${stats.uniqueStudents}</div></div>
      </div>
    </div>` : ''}
    ${engageChart}
    ${boxChart}
    ${studentList}
    <div style="margin-top:22px"><button class="btn ghost" onclick="reportPrintGroup()">Print report</button></div></div>`;
  savebar.innerHTML = '';
  if (selected) { setTimeout(() => { renderGroupCharts(selected, stats, sessions) }, 50); }
}

// Render group charts
function renderGroupCharts(group, stats, sessions) {
  // Engagement trend
  if (sessions.length) {
    const byDate = {};
    sessions.forEach(s => { const d = new Date(s.savedAt).toLocaleDateString(); byDate[d] = (byDate[d] || 0) + 1; });
    const dates = Object.keys(byDate).sort();
    const ctx = document.getElementById('groupChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{ label: 'Sessions per Day', data: dates.map(d => byDate[d]), borderColor: '#70A300', backgroundColor: '#F2F8E5', tension: 0.4, fill: true }]
      },
      options: { responsive: true, plugins: { legend: { display: true } } }
    });
  }
  // Box performance
  if (Object.keys(stats.boxStats).length) {
    const ctx = document.getElementById('groupBoxChart');
    if (!ctx) return;
    const boxes = Object.keys(stats.boxStats).sort();
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: boxes.map(b => b.substring(0, 20)),
        datasets: [{ label: 'Avg Score', data: boxes.map(b => parseFloat(stats.boxStats[b].avg) || 0), backgroundColor: '#80BC00' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 5 } } }
    });
  }
}

// Print student report
window.reportPrintStudent = () => {
  if (!state.reportStudentName) return;
  const stats = reportStudentStats(state.reportStudentName);
  const sessions = reportStudentSessions(state.reportStudentName);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Student Report</title><style>
    body{font-family:'Lato',Arial,sans-serif;padding:20pt;max-width:8.5in;margin:0}
    h1{font-family:'Bebas Neue',Arial;font-size:28px;color:#00145B;margin:0 0 4px}
    .meta{font-size:12px;color:#666;margin-bottom:18px}
    .box{background:#f7f7f7;border-left:4px solid #002D74;padding:12pt;margin:14pt 0;font-size:11pt}
    table{width:100%;border-collapse:collapse;font-size:10pt;margin:14pt 0}
    th{background:#002D74;color:#fff;padding:6pt 8pt;text-align:left;font-weight:700}
    td{padding:7pt 8pt;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even){background:#f9f9f9}
  </style></head><body>
    <h1>${esc(state.reportStudentName)}</h1>
    <div class="meta">Student Progress Report • ${new Date().toLocaleDateString()}</div>
    <div class="box">
      <strong>Total Sessions:</strong> ${stats.totalSessions} | <strong>Unique Boxes:</strong> ${stats.uniqueBoxes} | <strong>Overall Avg:</strong> ${stats.overallAvg}
    </div>
    <h2 style="font-family:'Bebas Neue',Arial;font-size:18px;color:#00145B;margin:18pt 0 8pt">Performance by Task Box</h2>
    <table>
      <tr><th>Task Box</th><th>Sessions</th><th>Average Score</th></tr>
      ${Object.entries(stats.boxStats).map(([box, data]) => `<tr><td>${esc(box)}</td><td>${data.sessions}</td><td>${data.avg}</td></tr>`).join('')}
    </table>
    <h2 style="font-family:'Bebas Neue',Arial;font-size:18px;color:#00145B;margin:18pt 0 8pt">Session History</h2>
    <table>
      <tr><th>Date</th><th>Box</th><th>Score</th><th>Notes</th></tr>
      ${sessions.map(s => `<tr><td>${new Date(s.savedAt).toLocaleDateString()}</td><td>${esc(s.box)}</td><td>${s.total}/${s.possible}</td><td style="font-size:9pt">${esc(s.notes || '—')}</td></tr>`).join('')}
    </table>
  </body></html>`;
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);
  const doc = printFrame.contentDocument || printFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => { printFrame.contentWindow.print(); }, 250);
};

// Print group report
window.reportPrintGroup = () => {
  if (!state.reportGroupName) return;
  const stats = reportGroupStats(state.reportGroupName);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Group Report</title><style>
    body{font-family:'Lato',Arial,sans-serif;padding:20pt;max-width:8.5in;margin:0}
    h1{font-family:'Bebas Neue',Arial;font-size:28px;color:#00145B;margin:0 0 4px}
    .meta{font-size:12px;color:#666;margin-bottom:18px}
    .box{background:#f7f7f7;border-left:4px solid #70A300;padding:12pt;margin:14pt 0;font-size:11pt}
    table{width:100%;border-collapse:collapse;font-size:10pt;margin:14pt 0}
    th{background:#70A300;color:#fff;padding:6pt 8pt;text-align:left;font-weight:700}
    td{padding:7pt 8pt;border-bottom:1px solid #e0e0e0}
    tr:nth-child(even){background:#f9f9f9}
  </style></head><body>
    <h1>${esc(state.reportGroupName)}</h1>
    <div class="meta">Group Summary Report • ${new Date().toLocaleDateString()}</div>
    <div class="box">
      <strong>Total Sessions:</strong> ${stats.totalSessions} | <strong>Unique Students:</strong> ${stats.uniqueStudents}
    </div>
    <h2 style="font-family:'Bebas Neue',Arial;font-size:18px;color:#00145B;margin:18pt 0 8pt">Performance by Task Box</h2>
    <table>
      <tr><th>Task Box</th><th>Sessions</th><th>Average Score</th></tr>
      ${Object.entries(stats.boxStats).map(([box, data]) => `<tr><td>${esc(box)}</td><td>${data.sessions}</td><td>${data.avg}</td></tr>`).join('')}
    </table>
  </body></html>`;
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);
  const doc = printFrame.contentDocument || printFrame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => { printFrame.contentWindow.print(); }, 250);
};
