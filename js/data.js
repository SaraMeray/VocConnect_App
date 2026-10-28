// Global data object - populated from backend
const LIB = {
  students: [],
  physicalBoxes: [],
  rubrics: [],
  sessions: []
};

// Roster array - derived from LIB.students
let ROSTER = [];

// Application state
const state = {
  screen: 'home',
  student: null,
  box: null,
  rubric: null,
  scores: {},
  sessionNotes: '',
  reportStudentName: '',
  reportGroupName: '',
  viewingSession: null,
  studentGroup: 'All'
};

// In-memory store for local sessions
const Store = (() => {
  const sessions = [];
  return {
    save(s) {
      // Use the sessionId passed in, or generate one if not provided
      if (!s.id) {
        s.id = 's' + (sessions.length + 1);
      }
      s.savedAt = new Date();
      sessions.unshift(s);
      return s;
    },
    recent() {
      return sessions;
    }
  };
})();
