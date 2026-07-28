// API Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwE6yngTS8EVpyeToJ4FsTLnbd4JSASwmY-nP7LlC6A07ijqbUdQm0QAUFe4DVa4oNdXA/exec";

// Scoring scale configuration
const SCALE_GROUP = {
  0: 'g0',
  1: 'g1',
  2: 'g2',
  3: 'g3',
  4: 'g4',
  5: 'g5'
};

const LVL = [
  { p: 'Not Displayed', s: '' },
  { p: 'Full Physical', s: '' },
  { p: 'Model/Partial', s: 'Physical' },
  { p: 'Verbal', s: '' },
  { p: 'Gestural/Visual', s: '' },
  { p: 'Independent', s: '' }
];

// DOM shortcut
const $ = s => document.querySelector(s);
const app = $('#app');
const savebar = $('#savebar');
