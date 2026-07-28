// Load all data from Google Sheets backend on startup
async function loadDataFromBackend() {
  // Show loading overlay (branded)
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loadingOverlay';
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 20, 91, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: 'Lato', Arial, sans-serif;
  `;
  loadingOverlay.innerHTML = `
    <div style="background: white; padding: 40px 60px; border-radius: 12px; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.2); max-width: 300px;">
      <div style="font-family: 'Bebas Neue', Arial, sans-serif; font-size: 24px; color: #00145B; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">Loading</div>
      <div style="font-size: 14px; color: #666; line-height: 1.5;">Fetching your data from Google Sheets...</div>
      <div style="margin-top: 20px; height: 3px; background: linear-gradient(90deg, #002D74, #80BC00); border-radius: 2px; overflow: hidden;">
        <div style="height: 100%; background: #80BC00; animation: pulse 1.5s infinite;"></div>
      </div>
    </div>
    <style>
      @keyframes pulse {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
      }
    </style>
  `;
  document.body.appendChild(loadingOverlay);

  try {
    // Fetch rubrics (which includes skills)
    const rubRes = await fetch(API_URL + "?action=getRubrics");
    const rubData = await rubRes.json();
    LIB.rubrics = rubData.rubrics || [];

    // Fetch boxes
    const boxRes = await fetch(API_URL + "?action=getBoxes");
    const boxData = await boxRes.json();
    LIB.physicalBoxes = boxData.boxes || [];

    // Fetch students
    const stuRes = await fetch(API_URL + "?action=getStudents");
    const stuData = await stuRes.json();
    LIB.students = stuData.students || [];

    // Fetch sessions
    const sesRes = await fetch(API_URL + "?action=getSessions");
    const sesData = await sesRes.json();
    LIB.sessions = sesData.sessions || [];

    console.log("✓ Data loaded from Google Sheets");
    initializeRoster();
    render();
    document.getElementById('loadingOverlay')?.remove();
  } catch (err) {
    document.getElementById('loadingOverlay')?.remove();
    console.error("Failed to load data:", err);
    alert("Could not connect to backend. Check your API URL.");
  }
}

// Prompt for evaluator name on first load
function promptForEvaluatorName() {
  const saved = localStorage.getItem('evaluatorName');
  if (saved) {
    console.log('✓ Evaluator: ' + saved);
    return;
  }

  const name = prompt('What is your name? (This is saved for future sessions)');
  if (name && name.trim()) {
    localStorage.setItem('evaluatorName', name.trim());
    console.log('✓ Name saved: ' + name);
  }
}

// Reload sessions from backend after saving
async function reloadSessions() {
  try {
    const resp = await fetch(API_URL + '?action=getSessions');
    const data = await resp.json();
    LIB.sessions = data.sessions || [];
  } catch (err) {
    console.error('Failed to reload sessions:', err);
  }
}

// Submit session to backend
async function submitSessionToBackend(sessionData) {
  try {
    const evaluatorName = localStorage.getItem('evaluatorName') || 'Unknown';
    const resp = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'submitSession',
        sessionId: sessionData.sessionId,
        studentId: sessionData.studentId,
        rubricId: sessionData.rubricId,
        evaluatorName: evaluatorName,
        notes: sessionData.notes,
        scores: sessionData.scores
      })
    });

    const result = await resp.json();
    console.log('✓ Session saved to Google Sheets');
    
    // Reload sessions to show the new one
    await reloadSessions();
    return result;
  } catch (err) {
    console.error('Failed to save to backend:', err);
    throw err;
  }
}
