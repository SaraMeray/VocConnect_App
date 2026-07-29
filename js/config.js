// API Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwgFTMz-3lUTy2RFI-jG8_KzeKUguKWSOOCtk4tJGQTpzjLT-2mEIFvwrjdsWSGM4l35A/exec";

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
