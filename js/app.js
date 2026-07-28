// Application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation buttons
  $('#navManage').onclick = () => go('admin');
  $('#navReports').onclick = () => go('reports');
  $('#navRecent').onclick = () => go('recent');

  // Set brand to home
  document.querySelector('.brand').onclick = () => go('home');

  // Load data and start app
  promptForEvaluatorName();
  loadDataFromBackend();
});

// Fallback: initialize if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {});
} else {
  document.querySelector('.brand').onclick = () => go('home');
  $('#navManage').onclick = () => go('manage');
  $('#navReports').onclick = () => go('reports');
  $('#navRecent').onclick = () => go('recent');
  promptForEvaluatorName();
  loadDataFromBackend();
}
