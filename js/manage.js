// Admin/Manage functionality - Task boxes, rubrics, and roster management

/* ================= HELPERS ================= */
function uid(p) { return p + '_' + Math.random().toString(36).slice(2, 7); }
function boxById(id) { return LIB.physicalBoxes.find(b => b.id === id); }
function rubById(id) { return LIB.rubrics.find(r => r.id === id); }
function slugify(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function titleOf(d) {
  const f = (d.skillFocus || '').trim();
  return (`${(d.callNumber || '').trim()} ${(d.boxName || '').trim()}`).trim() + (f ? ` — ${f}` : '');
}

function adminTabs(active) {
  const tab = (id, label) => `<button class="atab${active === id ? ' on' : ''}" onclick="go('${id}')">${label}</button>`;
  return `<div class="atabs">${tab('admin', 'Task Boxes')}${tab('roster', 'Roster')}</div>`;
}

/* ================= ADMIN: TASK BOXES ================= */
let adminShowArchived = false;

function renderAdmin() {
  const rows = LIB.physicalBoxes
    .filter(b => adminShowArchived || b.active !== false)
    .map(b => {
      const rs = boxRubrics(b);
      const calls = [...new Set(rs.map(r => r.callNumber))];
      const arch = b.active === false;
      const search = (b.name + ' ' + rs.map(r => r.callNumber + ' ' + (r.skillFocus || '')).join(' ')).toLowerCase();
      return `<button class="admin-row${arch ? ' arch' : ''}" data-search="${esc(search)}" onclick="openBox('${b.id}')">
        <div class="ar-main"><div class="ar-name">${esc(b.name)}${arch ? ' <span class="archtag">Archived</span>' : ''}</div>
        <div class="ar-meta">${calls.length ? esc(calls.join(' · ')) : 'no rubrics yet'} · ${rs.length} rubric${rs.length === 1 ? '' : 's'}</div></div>
        <span class="arrow">›</span></button>`;
    }).join('') || `<div class="empty">No task boxes match.</div>`;

  app.innerHTML = `<div class="fade">
    <div class="demo-banner"><b>Note:</b> Admin edits (students, boxes, rubrics) are saved in this session only. Persistent backend storage for admin changes coming soon!</div>
    ${adminTabs('admin')}
    <div style="margin:40px 0">${returnToScoringBtn()}</div>
    <div class="admin-head"><h1 class="screen-title" style="margin:0">Task boxes</h1>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn save" style="box-shadow:none" onclick="newBox()">+ New task box</button>
        <button class="btn ghost" style="box-shadow:none" onclick="go('bulkImport')">⬆ Bulk import</button></div></div>
    <p class="screen-sub">${LIB.physicalBoxes.filter(b => b.active !== false).length} active boxes · ${LIB.rubrics.filter(r => r.active !== false).length} rubrics. Tap a box to edit it, its rubrics, and their skills.</p>
    <input class="search" placeholder="Search boxes…" oninput="filterAdmin(this.value)">
    <label class="chk"><input type="checkbox" ${adminShowArchived ? 'checked' : ''} onchange="adminShowArchived=this.checked;renderAdmin()"> Show archived boxes</label>
    <div class="admin-list">${rows}</div></div>`;
  savebar.innerHTML = '';
}

window.filterAdmin = v => { v = v.toLowerCase(); document.querySelectorAll('.admin-list .admin-row').forEach(r => { r.style.display = r.dataset.search.includes(v) ? '' : 'none'; }); };
window.newBox = async () => {
  const boxName = 'New Task Box';
  const b = { id: slugify(boxName), name: boxName, rubricIds: [], active: true };
  LIB.physicalBoxes.push(b);
  
  // Save to backend immediately
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addBox',
        boxId: b.id,
        name: b.name,
        active: b.active
      })
    });
  } catch (err) {
    console.error('Failed to create box:', err);
  }
  
  state.boxId = b.id;
  go('boxEdit');
};
window.openBox = id => { state.boxId = id; go('boxEdit'); };

/* ================= ADMIN: BOX EDIT ================= */
function renderBoxEdit() {
  const b = boxById(state.boxId);
  if (!b) { go('admin'); return; }
  const rs = boxRubrics(b);
  const rlist = rs.map(r => {
    const cls = (r.type || 'Single').toLowerCase();
    const arch = r.active === false;
    return `<div class="rub-row${arch ? ' arch' : ''}">
      <span class="pill ${cls}">${esc(r.type || 'Single')}</span>
      <div class="rr-main"><div class="rr-focus">${esc(r.skillFocus || r.boxName || '(no focus)')}${arch ? ' <span class="archtag">Archived</span>' : ''}</div>
      <div class="rr-meta">${esc(r.callNumber || '(no call #)')} · ${r.skills.length} skill${r.skills.length === 1 ? '' : 's'}</div></div>
      <button class="mini-btn" onclick="editRubric('${r.id}')">Edit</button>
      <button class="mini-btn" onclick="toggleRubric('${r.id}')">${arch ? 'Restore' : 'Archive'}</button></div>`;
  }).join('') || `<div class="empty" style="padding:18px 0">No rubrics yet — add the first one below.</div>`;

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('admin')">‹ All task boxes</button></p>
    <h1 class="screen-title">Edit task box</h1>
    <label class="fld"><span class="lbl">Box name (shelf label)</span>
      <input class="in" value="${esc(b.name)}" oninput="renameBox('${b.id}',this.value)"></label>
    <div class="section-h">Rubrics on this box <span>${rs.length}</span></div>
    <p class="hint" style="margin:-4px 0 12px">A box can hold one rubric, or a Primary + Secondary pair, or several (like the Bolt Board).</p>
    <div class="rub-list">${rlist}</div>
    <button class="btn ghost" style="margin-top:6px" onclick="addRubric('${b.id}')">+ Add rubric</button>
    <div class="danger-zone">
      ${b.active === false
        ? `<button class="mini-btn" onclick="setBoxActive('${b.id}',true)">Restore box</button>`
        : `<button class="mini-btn danger" onclick="setBoxActive('${b.id}',false)">Archive this box</button>`}
      ${rs.length === 0 ? `<button class="mini-btn danger" onclick="deleteBox('${b.id}')">Delete empty box</button>` : ''}
    </div>
    <div style="height:18px"></div>
    <button class="btn save" onclick="go('admin')">Done</button></div>`;
  savebar.innerHTML = '';
}

window.renameBox = (id, v) => {
  const b = boxById(id);
  b.name = v;
  boxRubrics(b).forEach(r => { r.physicalBox = v; });
  
  // Save to backend
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateBox',
      boxId: id,
      name: v,
      active: b.active
    })
  }).catch(err => console.error('Failed to save box name:', err));
};
window.setBoxActive = (id, a) => {
  const b = boxById(id);
  b.active = a;
  
  // Save to backend
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateBox',
      boxId: id,
      name: b.name,
      active: a
    })
  }).catch(err => console.error('Failed to save box status:', err));
  
  renderBoxEdit();
};
window.deleteBox = id => { if (!confirm('Delete this empty box? This cannot be undone.')) return; LIB.physicalBoxes = LIB.physicalBoxes.filter(b => b.id !== id); go('admin'); };
window.toggleRubric = rid => { const r = rubById(rid); r.active = (r.active === false); renderBoxEdit(); };
window.addRubric = bid => {
  const b = boxById(bid);
  state.rubricDraft = { id: null, boxId: bid, callNumber: '', boxName: b.name, type: 'Single', skillFocus: '', skills: [{ id: uid('sk'), text: '' }] };
  go('rubricEdit');
};
window.editRubric = rid => {
  const r = rubById(rid);
  const b = LIB.physicalBoxes.find(x => x.rubricIds.includes(rid));
  state.rubricDraft = {
    id: r.id, boxId: b ? b.id : state.boxId, callNumber: r.callNumber, boxName: r.boxName, type: r.type || 'Single',
    skillFocus: r.skillFocus || '', skills: r.skills.map(s => ({ id: s.id, text: s.text }))
  };
  go('rubricEdit');
};

/* ================= ADMIN: RUBRIC EDIT ================= */
function renderRubricEdit() {
  const d = state.rubricDraft;
  const typeBtns = ['Single', 'Primary', 'Secondary'].map(t => `<button class="seg${d.type === t ? ' on' : ''}" onclick="draftType('${t}')">${t}</button>`).join('');
  const skills = d.skills.map((s, i) => `<div class="sk-row">
    <span class="sk-num">${i + 1}</span>
    <textarea class="sk-in" rows="1" oninput="draftSkill(${i},this.value);autogrow(this)" placeholder="Describe the skill…">${esc(s.text)}</textarea>
    <div class="sk-actions">
      <button class="mini-btn"${i === 0 ? ' disabled' : ''} onclick="moveSkill(${i},-1)" title="Move up">↑</button>
      <button class="mini-btn"${i === d.skills.length - 1 ? ' disabled' : ''} onclick="moveSkill(${i},1)" title="Move down">↓</button>
      <button class="mini-btn danger"${d.skills.length === 1 ? ' disabled' : ''} onclick="delSkill(${i})" title="Delete">✕</button></div></div>`).join('');

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('boxEdit')">‹ Back to box</button></p>
    <h1 class="screen-title">${d.id ? 'Edit rubric' : 'New rubric'}</h1>
    <div class="title-prev">Title preview: <b id="titlePreview">${esc(titleOf(d)) || '—'}</b></div>
    <div class="grid2">
      <label class="fld"><span class="lbl">Call # (as printed on box)</span>
        <input class="in" value="${esc(d.callNumber)}" oninput="draftSet('callNumber',this.value)" placeholder="e.g. MAT-105"></label>
      <label class="fld"><span class="lbl">Box name</span>
        <input class="in" value="${esc(d.boxName)}" oninput="draftSet('boxName',this.value)" placeholder="e.g. Washers"></label></div>
    <label class="fld"><span class="lbl">Rubric type</span><div class="seg-wrap">${typeBtns}</div>
      <span class="hint">Use Primary (assembly) + Secondary (disassembly) when one box has two rubrics.</span></label>
    <label class="fld"><span class="lbl">Status</span>
      <div style="display:flex;align-items:center;gap:10px">
        <button class="seg ${d.published === false ? '' : 'on'}" onclick="draftSet('published',true)">Published</button>
        <button class="seg ${d.published === false ? 'on' : ''}" onclick="draftSet('published',false)">Draft</button>
        <span class="hint" style="margin:0">${d.published === false ? 'Instructors can view but cannot score this rubric.' : 'Instructors can score with this rubric.'}</span>
      </div></label>
    <label class="fld"><span class="lbl">Skill focus <span style="font-weight:400;color:#9aa4b2">(the descriptor after the —)</span></span>
      <input class="in" value="${esc(d.skillFocus)}" oninput="draftSet('skillFocus',this.value)" placeholder="e.g. Size Sorting & Grasp"></label>
    <div class="section-h">Skills <span>${d.skills.length}</span></div>
    <p class="hint" style="margin:-4px 0 10px">Every skill is scored on the shared 0–5 scale. Reorder with the arrows.</p>
    <div class="sk-list">${skills}</div>
    <button class="btn ghost" style="margin-top:8px" onclick="addSkill()">+ Add skill</button>
    <div class="err" id="rubErr"></div>
    <div class="edit-actions">
      <button class="btn ghost" onclick="go('boxEdit')">Cancel</button>
      <button class="btn save" onclick="saveRubric()">Save rubric</button></div></div>`;
  savebar.innerHTML = '';
  document.querySelectorAll('.sk-in').forEach(el => autogrow(el));
}

window.autogrow = el => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
window.draftSet = (k, v) => { state.rubricDraft[k] = v; const t = document.getElementById('titlePreview'); if (t) t.textContent = titleOf(state.rubricDraft) || '—'; };
window.draftType = t => { state.rubricDraft.type = t; renderRubricEdit(); };
window.draftSkill = (i, v) => { state.rubricDraft.skills[i].text = v; };
window.moveSkill = (i, dir) => { const s = state.rubricDraft.skills; const j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; renderRubricEdit(); };
window.delSkill = i => { if (state.rubricDraft.skills.length === 1) return; state.rubricDraft.skills.splice(i, 1); renderRubricEdit(); };
window.addSkill = () => {
  state.rubricDraft.skills.push({ id: uid('sk'), text: '' });
  renderRubricEdit();
  const ins = document.querySelectorAll('.sk-in');
  const last = ins[ins.length - 1];
  if (last) last.focus();
};
window.saveRubric = async () => {
  const d = state.rubricDraft;
  const errs = [];
  if (!d.callNumber.trim()) errs.push('Call # is required.');
  const skills = d.skills.map(s => ({id:s.id,text:s.text.trim()})).filter(s=>s.text);
  if (!skills.length) errs.push('Add at least one skill.');
  if (errs.length){const e=document.getElementById('rubErr');e.textContent=errs.join(' ');e.style.display='block';return;}
  
  try {
    const title = titleOf(d);
    const box = boxById(d.boxId);
    
    if (d.id) {
      // Update existing rubric
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateRubric',
          rubricId: d.id,
          callNumber: d.callNumber.trim(),
          boxName: d.boxName.trim(),
          type: d.type,
          skillFocus: d.skillFocus.trim(),
          published: d.published,
          skills: skills
        })
      });
      
      const r = rubById(d.id);
      Object.assign(r, {callNumber: d.callNumber.trim(), boxName: d.boxName.trim(), type: d.type, skillFocus: d.skillFocus.trim(), title, skills});
    } else {
      // Add new rubric
      const nid = uid('rub');
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addRubric',
          rubricId: nid,
          callNumber: d.callNumber.trim(),
          boxName: d.boxName.trim(),
          type: d.type,
          skillFocus: d.skillFocus.trim(),
          published: d.published !== false,
          skills: skills
        })
      });
      
      LIB.rubrics.push({
        id: nid,
        callNumber: d.callNumber.trim(),
        boxName: d.boxName.trim(),
        type: d.type,
        skillFocus: d.skillFocus.trim(),
        title,
        physicalBox: box ? box.name : d.boxName.trim(),
        skills,
        active: true
      });
      
      if (box && !box.rubricIds.includes(nid)) box.rubricIds.push(nid);
    }
    
    go('boxEdit');
  } catch (err) {
    console.error('Failed to save rubric:', err);
    const e = document.getElementById('rubErr');
    e.textContent = 'Error saving rubric';
    e.style.display = 'block';
  }
};

/* ================= ADMIN: BULK IMPORT ================= */
function renderBulkImport() {
  const parsed = state.importRubricsParsed;
  if (!parsed) {
    app.innerHTML = `<div class="fade">
      <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('admin')">‹ Task boxes</button></p>
      <h1 class="screen-title">Bulk Import Rubrics</h1>
      <p class="screen-sub">Paste CSV data. Expected columns: <b>Call#, Box Name, Type, Skill Focus</b>, then skill text columns (Skill 1, Skill 2, etc.).</p>
      <p class="screen-sub" style="color:#9aa4b2;font-size:12px">Example: <code style="background:#f7f7f7;padding:2px 6px;border-radius:4px">MAT-105,Washers,Single,Size Sorting & Grasp,Distinguishes components,Recognizes attributes,Uses pincer grasp</code></p>
      <textarea class="notes-in" placeholder="Paste CSV data here (copy from Excel and paste)..." id="bulkRubricCsv" style="min-height:300px"></textarea>
      <div style="margin-top:14px;display:flex;gap:10px">
        <button class="btn save" onclick="previewBulkImport()">Preview Import</button>
        <button class="btn ghost" onclick="go('admin')">Cancel</button>
      </div></div>`;
    savebar.innerHTML = '';
    return;
  }

  const { new: newRubrics, duplicates } = parsed;
  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="state.importRubricsParsed=null;renderBulkImport()">‹ Back</button></p>
    <h1 class="screen-title">Import Preview</h1>
    <div class="summary" style="background:var(--xltblue);border-left:4px solid var(--blue);padding:14px;border-radius:10px;margin-bottom:18px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px">
        <div><span style="font-weight:700;color:var(--blue)">New rubrics</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${newRubrics.length}</div></div>
        <div><span style="font-weight:700;color:var(--blue)">Duplicates (skipped)</span><div style="font-size:20px;font-weight:900;color:var(--dkblue)">${duplicates.length}</div></div>
      </div>
    </div>
    ${duplicates.length ? `<div style="background:#fff3cd;border-left:4px solid #F3B151;padding:12px;margin-bottom:14px;border-radius:8px">
      <strong style="color:#F3B151">⚠ Duplicates found (will skip):</strong>
      <div style="font-size:12px;margin-top:6px;color:#666">${duplicates.map(d => d.callNumber + ' — ' + d.boxName).join('<br>')}</div>
    </div>` : ''}
    <h3 style="font-family:var(--head);font-size:18px;color:var(--dkblue);margin:0 0 12px">Rubrics to import:</h3>
    ${newRubrics.map(r => `<div class="admin-row" style="margin-bottom:9px"><div class="ar-main"><div class="ar-name">${esc(r.callNumber)} ${esc(r.boxName)}</div>
      <div class="ar-meta">${esc(r.skillFocus || r.boxName)} · ${r.skills.length} skills</div></div></div>`).join('')}
    <div style="margin-top:22px;display:flex;gap:10px">
      <button class="btn save" onclick="confirmBulkImport()">Confirm Import</button>
      <button class="btn ghost" onclick="state.importRubricsParsed=null;renderBulkImport()">Cancel</button>
    </div></div>`;
  savebar.innerHTML = '';
}

window.previewBulkImport = () => {
  const csv = document.getElementById('bulkRubricCsv').value.trim();
  try {
    const rows = parseCSV(csv);
    if (rows.length < 2) throw new Error('Need at least a header row and one data row');

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const colIdx = {
      call: headers.findIndex(h => /^call\s*#|callnumber|call_number/.test(h)),
      box: headers.findIndex(h => /^box\s*name|boxname/.test(h)),
      type: headers.findIndex(h => /^type|rubric\s*type/.test(h)),
      focus: headers.findIndex(h => /^skill\s*focus|skillfocus|focus/.test(h))
    };

    if (colIdx.call < 0 || colIdx.box < 0 || colIdx.type < 0 || colIdx.focus < 0) throw new Error('Missing required columns: Call#, Box Name, Type, Skill Focus');

    const skillCols = [];
    headers.forEach((h, i) => {
      if (i !== colIdx.call && i !== colIdx.box && i !== colIdx.type && i !== colIdx.focus && h.trim() !== '') {
        skillCols.push(i);
      }
    });
    if (skillCols.length === 0) throw new Error('No skill columns found. Add columns like "Skill 1", "Skill 2", etc.');

    const existing = new Set(LIB.rubrics.map(r => r.callNumber + '\x00' + r.boxName));
    const newRubrics = [], duplicates = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const call = (row[colIdx.call] || '').trim();
      const box = (row[colIdx.box] || '').trim();
      const type = (row[colIdx.type] || 'Single').trim();
      const focus = (row[colIdx.focus] || '').trim();

      if (!call || !box) continue;

      const key = call + '\x00' + box;
      if (existing.has(key)) {
        duplicates.push({ callNumber: call, boxName: box });
        continue;
      }

      const skills = skillCols.map((idx, num) => {
        const text = (row[idx] || '').trim();
        return text ? { id: call + '__s' + (num + 1), text } : null;
      }).filter(x => x);

      if (skills.length === 0) throw new Error('Row ' + (i + 1) + ': No skills found');

      newRubrics.push({
        id: uid('rubric'), callNumber: call, boxName: box, type, skillFocus: focus,
        title: call + ' ' + box + ' — ' + focus, physicalBox: box, skills, active: true, published: true
      });
    }

    if (newRubrics.length === 0) throw new Error('No new rubrics found (all are duplicates or empty)');
    state.importRubricsParsed = { new: newRubrics, duplicates };
    renderBulkImport();
  } catch (e) {
    alert('Error parsing CSV: ' + e.message);
  }
};

window.confirmBulkImport = () => {
  const { new: newRubrics } = state.importRubricsParsed;
  newRubrics.forEach(r => { LIB.rubrics.push(r); });
  state.importRubricsParsed = null;
  alert('✓ Imported ' + newRubrics.length + ' rubric' + (newRubrics.length === 1 ? '' : 's'));
  go('admin');
};

/* ================= ROSTER: STUDENTS ================= */
let rosterShowArchived = false;

function renderRoster() {
  const q = (state.rosterQ || '').toLowerCase();
  const gf = state.rosterGroupFilter || 'All';
  const groups = rosterGroups();
  let list = rosterShowArchived ? ROSTER.filter(s => s.active === false) : ROSTER.filter(s => s.active !== false);
  if (gf !== 'All') list = list.filter(s => normalizeGroup(s.group) === gf);
  list = list.sort((a, b) => a.name.localeCompare(b.name));

  const rows = list.map(s => {
    const arch = s.active === false;
    const search = (s.name + ' ' + (s.group || '')).toLowerCase();
    return `<div class="admin-row roster-row${arch ? ' arch' : ''}" data-search="${esc(search)}">
      <span class="avatar-lg" style="background:${arch ? '#9aa4b2' : 'var(--blue)'}">${initials(s.name)}</span>
      <div class="ar-main"><div class="ar-name" style="font-family:var(--base);font-weight:900;font-size:16px">${esc(s.name)}${arch ? ' <span class="archtag">Archived</span>' : ''}</div>
      <div class="ar-meta">${esc(s.group || 'no group')}</div>
      <button class="mini-btn" onclick="editStudent('${s.id}')">Edit</button>
      <button class="mini-btn" onclick="toggleStudent('${s.id}')">${arch ? 'Restore' : 'Archive'}</button></div></div>`;
  }).join('') || `<div class="empty">No students match.</div>`;

  const gchips = groups.length ? `<div class="chips">${['All', ...groups].map(x => `<button class="chip${x === gf ? ' on' : ''}" onclick="state.rosterGroupFilter='${esc(x)}';renderRoster()">${esc(x)}</button>`).join('')}</div>` : '';
  const banner = state.importResult ? `<div class="success-banner"><span style="flex:1"><b>✓ Import successful</b> Added ${state.importResult.added} student${state.importResult.added === 1 ? '' : 's'}${state.importResult.dupes ? `, skipped ${state.importResult.dupes} duplicate${state.importResult.dupes === 1 ? '' : 's'}` : ''}.${state.importResult.added === 0 ? ' All records already existed.' : ''}</span><button class="close-btn" onclick="state.importResult=null;renderRoster()">✕</button></div>` : '';

  app.innerHTML = `<div class="fade">
    <div class="demo-banner"><b>Note:</b> Fictional students in real classroom groups. Scoring data saves to Google Workspace database.</div>
    ${banner}
    ${adminTabs('roster')}
    <div style="margin:40px 0">${returnToScoringBtn()}</div>
    <div class="admin-head"><h1 class="screen-title" style="margin:0">Student roster</h1>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn save" style="box-shadow:none" onclick="newStudent()">+ Add student</button>
        <button class="btn ghost" onclick="go('rosterImport')">Import CSV</button></div></div>
    <p class="screen-sub">${activeStudents().length} active student${activeStudents().length === 1 ? '' : 's'}${groups.length ? ' across ' + groups.length + ' group' + (groups.length === 1 ? '' : 's') : ''}.</p>
    <input class="search" placeholder="Search by student name or group…" oninput="filterRoster(this.value)">
    ${gchips}
    <label class="chk"><input type="checkbox" ${rosterShowArchived ? 'checked' : ''} onchange="rosterShowArchived=this.checked;renderRoster()"> Show archived students</label>
    <div class="admin-list">${rows}</div></div>`;
  savebar.innerHTML = '';
}

window.filterRoster = v => { v = v.toLowerCase(); document.querySelectorAll('.admin-list .roster-row').forEach(r => { r.style.display = r.dataset.search.includes(v) ? '' : 'none'; }); };
window.newStudent = () => { state.studentDraft = { id: null, name: '', group: '' }; go('studentEdit'); };
window.editStudent = id => { const s = studentById(id); state.studentDraft = { id: s.id, name: s.name, group: s.group || '' }; go('studentEdit'); };
window.toggleStudent = id => {
  const s = studentById(id);
  s.active = (s.active === false);
  
  // Save to backend
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'updateStudent',
      studentId: id,
      name: s.name,
      active: s.active,
      group: s.group
    })
  }).catch(err => console.error('Failed to save student status:', err));
  
  renderRoster();
};

/* ================= ROSTER: STUDENT EDIT ================= */
function renderStudentEdit() {
  const d = state.studentDraft;
  const groups = rosterGroups();
  const dl = groups.map(g => `<option value="${esc(g)}">`).join('');

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('roster')">‹ All students</button></p>
    <h1 class="screen-title">${d.id ? 'Edit student' : 'Add student'}</h1>
    <label class="fld"><span class="lbl">Student name</span>
      <input class="in" id="stName" value="${esc(d.name)}" oninput="state.studentDraft.name=this.value" placeholder="First Last"></label>
    <label class="fld"><span class="lbl">Group / class</span>
      <select class="in" value="${esc(d.group)}" onchange="state.studentDraft.group=this.value">
        <option value="">Select a classroom…</option>
        ${groups.map(g => `<option value="${esc(g)}"${d.group === g ? ' selected' : ''}>${esc(g)}</option>`).join('')}
      </select></label>
    <div class="err" id="stErr"></div>
    <div class="edit-actions">
      <button class="btn ghost" onclick="go('roster')">Cancel</button>
      <button class="btn save" onclick="saveStudent()">Save student</button></div></div>`;
  savebar.innerHTML = '';
}

window.saveStudent = async () => {
  const d = state.studentDraft;
  if (!d.name.trim()) { const e = document.getElementById('stErr'); e.textContent = 'Student name is required.'; e.style.display = 'block'; return; }
  
  const btn = document.querySelector('button[onclick="saveStudent()"]');
  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.style.cursor = 'not-allowed';
  
  try {
    if (d.id) {
      // Update existing student
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateStudent',
          studentId: d.id,
          name: d.name.trim(),
          group: normalizeGroup(d.group)
        })
      });
    } else {
      // Add new student
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addStudent',
          name: d.name.trim(),
          group: normalizeGroup(d.group)
        })
      });
    }
    
    // Reload roster from backend
    const resp = await fetch(API_URL + '?action=getStudents');
    const data = await resp.json();
    LIB.students = data.students || [];
    initializeRoster();
    
    go('roster');
  } catch (err) {
    console.error('Failed to save student:', err);
    const e = document.getElementById('stErr');
    e.textContent = 'Error saving student';
    e.style.display = 'block';
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
};

/* ================= CSV IMPORT ================= */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',' || c === '\t') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function mapHeaders(hdr) {
  const h = hdr.map(x => x.trim().toLowerCase());
  const find = re => h.findIndex(x => re.test(x));
  return {
    name: find(/^(student ?name|full ?name|name)$/),
    first: find(/^first[ _]?name$/),
    last: find(/^last[ _]?name$/),
    sid: find(/student[ _]?id|^id$|id ?number/),
    group: find(/group|class|cohort|period|session|teacher/)
  };
}

function parseRoster(text) {
  const rows = parseCSV(text);
  if (rows.length < 1) return { students: [], warnings: ['File is empty.'] };
  const m = mapHeaders(rows[0]);
  const warnings = [];
  const out = [];
  const hasName = m.name >= 0 || (m.first >= 0 && m.last >= 0) || m.first >= 0;
  if (!hasName) { return { students: [], warnings: ['Couldn\'t find a Name column. Expected a "Student Name" column, or "First Name" + "Last Name".'] }; }
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    let name = m.name >= 0 ? (r[m.name] || '').trim()
      : [m.first >= 0 ? r[m.first] : '', m.last >= 0 ? r[m.last] : ''].map(x => (x || '').trim()).filter(Boolean).join(' ');
    if (!name) { warnings.push('Row ' + (i + 1) + ' skipped (no name).'); continue; }
    out.push({ name, group: normalizeGroup(m.group >= 0 ? r[m.group] || '' : '') });
  }
  return { students: out, warnings };
}

function renderRosterImport() {
  const p = state.importParsed;
  let preview = '';
  if (p) {
    const rows = p.students.slice(0, 50).map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${esc(s.group || '')}</td></tr>`).join('');
    preview = `<div class="section-h">Preview <span>${p.students.length} student${p.students.length === 1 ? '' : 's'}</span></div>
      ${p.warnings.length ? `<div class="err" style="display:block;background:#fff6e6;color:#7a5200">${p.warnings.slice(0, 6).map(esc).join('<br>')}${p.warnings.length > 6 ? '<br>…and ' + (p.warnings.length - 6) + ' more' : ''}</div>` : ''}
      ${p.students.length ? `<div class="tablewrap"><table class="ptable"><thead><tr><th>#</th><th>Name</th><th>Group</th></tr></thead><tbody>${rows}</tbody></table>${p.students.length > 50 ? `<p class="hint">Showing first 50 of ${p.students.length}.</p>` : ''}</div>
      <div class="edit-actions"><button class="btn ghost" onclick="state.importParsed=null;renderRosterImport()">Clear</button>
      <button class="btn save" onclick="commitImport()">Add ${p.students.length} student${p.students.length === 1 ? '' : 's'}</button></div>` : ''}`;
  }

  app.innerHTML = `<div class="fade">
    <p class="screen-sub" style="margin-bottom:14px"><button class="linkbtn" onclick="go('roster')">‹ Roster</button></p>
    <h1 class="screen-title">Import roster (CSV)</h1>
    <p class="screen-sub">Upload or paste a CSV. It should have a <b>Student Name</b> column (or <b>First Name</b> + <b>Last Name</b>), and <b>Group</b>.
      <button class="linkbtn" onclick="downloadTemplate()">Download a template</button></p>
    <div class="drop"><input type="file" id="csvFile" accept=".csv,text/csv" onchange="fileImport(this)">
      <label for="csvFile" class="drop-lbl">Choose a CSV file…</label></div>
    <div class="or">or paste CSV text</div>
    <textarea class="in" id="csvPaste" rows="5" placeholder="Student Name,Group&#10;Jordan Lee,Room 102" style="resize:vertical;font-family:monospace;font-size:13px"></textarea>
    <button class="btn ghost" style="margin-top:10px" onclick="pasteImport()">Preview pasted CSV</button>
    ${preview}</div>`;
  savebar.innerHTML = '';
}

window.fileImport = inp => {
  const f = inp.files && inp.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { state.importParsed = parseRoster(String(rd.result)); renderRosterImport(); };
  rd.readAsText(f);
};
window.pasteImport = () => {
  const t = document.getElementById('csvPaste').value || '';
  if (!t.trim()) return;
  state.importParsed = parseRoster(t);
  renderRosterImport();
};
window.commitImport = async () => {
  const p = state.importParsed;
  if (!p || !p.students.length) return;
  
  const btn = document.querySelector('button[onclick="commitImport()"]');
  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.style.cursor = 'not-allowed';
  
  let added = 0, dupes = 0;
  
  try {
    for (const s of p.students) {
    const dup = ROSTER.find(x => (x.name.toLowerCase() === s.name.toLowerCase() && normalizeGroup(x.group) === normalizeGroup(s.group)));
    if (dup) { dupes++; continue; }
    
    try {
      // Add to backend
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addStudent',
          name: s.name,
          group: normalizeGroup(s.group)
        })
      });
      added++;
    } catch (err) {
      console.error('Failed to add student:', err);
    }
    }
  
  // Reload roster from backend
  const resp = await fetch(API_URL + '?action=getStudents');
  const data = await resp.json();
  LIB.students = data.students || [];
  initializeRoster();
  
  state.importParsed = null;
    state.importResult = { added, dupes };
    go('roster');
  } catch (err) {
    console.error('Import failed:', err);
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
};
window.downloadTemplate = () => {
  const csv = 'Student Name,Group\nJordan Lee,Room 102\nSam Rivera,Room 106\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roster_template.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
