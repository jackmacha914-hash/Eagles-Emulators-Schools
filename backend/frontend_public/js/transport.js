document.addEventListener('DOMContentLoaded', function() {
  
  window.openTransportModal = function(id) {
    // hide all transport modals first
    document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');

    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'flex'; // must match CSS flex
  };

  window.closeTransportModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
  };

  // close modal if clicking outside content
  window.addEventListener('click', function(e) {
    if(e.target.classList.contains('transport-modal')) {
      e.target.style.display = 'none';
    }
  });

});
