document.addEventListener('DOMContentLoaded', function() {

    // Open transport modal
    window.openTransportModal = function(id) {
        // Hide all transport modals
        document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');
        const modal = document.getElementById(id);
        if(modal) modal.style.display = 'block';
    };

    // Close transport modal
    window.closeTransportModal = function(id) {
        const modal = document.getElementById(id);
        if(modal) modal.style.display = 'none';
    };

    // Close modal when clicking overlay
    window.addEventListener('click', function(e) {
        if(e.target.classList.contains('transport-modal')) {
            e.target.style.display = 'none';
        }
    });

});
