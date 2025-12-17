window.openTransportModal = function(id) {
  // Hide all transport modals
  document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');
  
  const modal = document.getElementById(id);
  if(modal) modal.style.display = 'flex';
};

window.closeTransportModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) modal.style.display = 'none';
};

// Close modal if clicking outside content
window.addEventListener('click', function(e) {
  if(e.target.classList.contains('transport-modal')) {
    e.target.style.display = 'none';
  }
});
