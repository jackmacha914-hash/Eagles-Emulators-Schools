/* ====================================
   TRANSPORT MODALS CONTROL
==================================== */
function openTransportModal(id) {
    document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'block';
}

function closeTransportModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
}

// Close modal when clicking overlay
window.addEventListener('click', e => {
    if(e.target.classList.contains('transport-modal')){
        e.target.style.display = 'none';
    }
});


