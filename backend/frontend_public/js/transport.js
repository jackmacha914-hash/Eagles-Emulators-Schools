// transport.js

// 1️⃣ Add this function at the top of the file or anywhere outside DOMContentLoaded
async function loadBusesDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://eagles-emulators-schools.onrender.com/api/transport/buses');
        const buses = await res.json();

        select.innerHTML = ''; // clear old options
        buses.forEach(bus => {
            const option = document.createElement('option');
            option.value = bus._id;
            option.text = `${bus.number} (${bus.plate})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading buses:', err);
    }
}

async function loadRoutesDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://eagles-emulators-schools.onrender.com/api/transport/routes');
        const routes = await res.json();

        select.innerHTML = ''; // clear old options
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route._id;
            option.text = route.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading routes:', err);
    }
}
async function loadStudentsDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    try {
        const res = await fetch('https://eagles-emulators-schools.onrender.com/api/students'); // adjust route if needed
        const students = await res.json();

        select.innerHTML = ''; // clear old options
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student._id;
            option.text = student.name; // use full name
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading students:', err);
    }
}



// transport.js
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://eagles-emulators-schools.onrender.com/api/transport";

    // ---------------------------
// MODAL HANDLING
// ---------------------------
window.openTransportModal = function(id) {
    // Close all modals first
    document.querySelectorAll('.transport-modal').forEach(m => m.style.display = 'none');

    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';

    // Populate dropdowns depending on modal
    if (id === 'routeModal') loadBusesDropdown('route-bus');
    if (id === 'driverModal') loadBusesDropdown('driver-bus');
    if (id === 'studentTransportModal') {
        loadBusesDropdown('student-bus');
        loadRoutesDropdown('student-route');
        loadStudentsDropdown('student-id');
    }
    if (id === 'feesModal') loadRoutesDropdown('fees-route');
    if (id === 'paymentsModal') {
    loadStudentsDropdown('payment-student');
    loadRoutesDropdown('payment-route');
    loadTransportPayments();
}
};

// Close modal function
window.closeTransportModal = function(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = 'none';
};

// Close modal if clicked outside content
window.addEventListener('click', e => {
    if(e.target.classList.contains('transport-modal')) e.target.style.display = 'none';
});


    // ---------------------------
    // BUS FUNCTIONS
    // ---------------------------
    const busTableBody = document.querySelector('#bus-table tbody');

    async function loadBuses() {
        try {
            const res = await fetch(`${API_BASE}/buses`);
            const buses = await res.json();
            if(busTableBody) {
                busTableBody.innerHTML = buses.map(bus => `
                    <tr>
                        <td>${bus.number}</td>
                        <td>${bus.plate}</td>
                        <td>${bus.capacity}</td>
                        <td>${bus.status}</td>
                        <td>
                            <button onclick="editBus('${bus._id}')">Edit</button>
                            <button onclick="deleteBus('${bus._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error("Error loading buses:", err);
        }
    }

    window.saveBus = async function() {
        const number = document.querySelector('#bus-number').value;
        const plate = document.querySelector('#bus-plate').value;
        const capacity = document.querySelector('#bus-capacity').value;
        const status = document.querySelector('#bus-status').value;

        try {
            await fetch(`${API_BASE}/buses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, plate, capacity, status })
            });
            closeTransportModal('busModal');
            loadBuses();
        } catch (err) {
            console.error("Error saving bus:", err);
        }
    };

    window.deleteBus = async function(id) {
        if(!confirm('Are you sure you want to delete this bus?')) return;
        try {
            await fetch(`${API_BASE}/buses/${id}`, { method: 'DELETE' });
            loadBuses();
        } catch (err) {
            console.error("Error deleting bus:", err);
        }
    };

    window.editBus = async function(id) {
        const res = await fetch(`${API_BASE}/buses`);
        const buses = await res.json();
        const bus = buses.find(b => b._id === id);
        if(bus) {
            document.querySelector('#bus-number').value = bus.number;
            document.querySelector('#bus-plate').value = bus.plate;
            document.querySelector('#bus-capacity').value = bus.capacity;
            document.querySelector('#bus-status').value = bus.status;
            openTransportModal('busModal');
        }
    };

    // ---------------------------
    // ROUTES FUNCTIONS
    // ---------------------------
    async function loadRoutes() {
        try {
            const res = await fetch(`${API_BASE}/routes`);
            const routes = await res.json();
            const tbody = document.querySelector('#route-table tbody');
            if(tbody) {
                tbody.innerHTML = routes.map(r => `
                    <tr>
                        <td>${r.name}</td>
                        <td>${r.busId ? r.busId.number : '-'}</td>
                        <td>
                            <button onclick="editRoute('${r._id}')">Edit</button>
                            <button onclick="deleteRoute('${r._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) {
            console.error("Error loading routes:", err);
        }
    }

    window.saveRoute = async function() {
        const name = document.querySelector('#route-name').value;
        const busId = document.querySelector('#route-bus').value;
        try {
            await fetch(`${API_BASE}/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, busId })
            });
            closeTransportModal('routeModal');
            loadRoutes();
        } catch(err) { console.error(err); }
    };

    window.deleteRoute = async function(id) {
        if(!confirm('Delete this route?')) return;
        await fetch(`${API_BASE}/routes/${id}`, { method: 'DELETE' });
        loadRoutes();
    };

   async function loadTransportPayments() {
    const tbody = document.querySelector('#payment-table tbody');
    if (!tbody) return;

    try {
        const res = await fetch('https://eagles-emulators-schools.onrender.com/api/transport/payments');
        const payments = await res.json();

        if (!Array.isArray(payments)) {
            console.error('Payments is not an array:', payments);
            return;
        }

        tbody.innerHTML = payments.map(p => `
            <tr>
                <td>${p.studentId?.name || '-'}</td>
                <td>${p.routeId?.name || '-'}</td>
                <td>${p.amountPaid}</td>
                <td>${p.method}</td>
                <td>${p.term} / ${p.year}</td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading payments:', err);
    }
}


    window.deleteTransportPayment = async function(id) {
    if (!confirm('Delete this payment?')) return;

    try {
        await fetch(`https://eagles-emulators-schools.onrender.com/api/transport/payments/${id}`, {
            method: 'DELETE'
        });
        loadTransportPayments(); // refresh the table
    } catch (err) {
        console.error('Error deleting payment:', err);
    }
};


    // ---------------------------
    // DRIVER FUNCTIONS
    // ---------------------------
    async function loadDrivers() {
        try {
            const res = await fetch(`${API_BASE}/drivers`);
            const drivers = await res.json();
            const tbody = document.querySelector('#driver-table tbody');
            if(tbody) {
                tbody.innerHTML = drivers.map(d => `
                    <tr>
                        <td>${d.name}</td>
                        <td>${d.license}</td>
                        <td>${d.busId ? d.busId.number : '-'}</td>
                        <td>
                            <button onclick="editDriver('${d._id}')">Edit</button>
                            <button onclick="deleteDriver('${d._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) { console.error(err); }
    }

    window.saveDriver = async function() {
        const name = document.querySelector('#driver-name').value;
        const license = document.querySelector('#driver-license').value;
        const busId = document.querySelector('#driver-bus').value;
        try {
            await fetch(`${API_BASE}/drivers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, license, busId })
            });
            closeTransportModal('driverModal');
            loadDrivers();
        } catch(err) { console.error(err); }
    };

    window.deleteDriver = async function(id) {
        if(!confirm('Delete this driver?')) return;
        await fetch(`${API_BASE}/drivers/${id}`, { method: 'DELETE' });
        loadDrivers();
    }

    // ---------------------------
    // STUDENT TRANSPORT ASSIGNMENTS
    // ---------------------------
    async function loadStudentAssignments() {
        try {
            const res = await fetch(`${API_BASE}/assignments`);
            const assignments = await res.json();
            const tbody = document.querySelector('#student-transport-table tbody');
            if(tbody) {
                tbody.innerHTML = assignments.map(a => `
                    <tr>
                        <td>${a.studentId}</td>
                        <td>${a.busId ? a.busId.number : '-'}</td>
                        <td>${a.routeId ? a.routeId.name : '-'}</td>
                        <td>
                            <button onclick="deleteStudentAssignment('${a._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch(err) { console.error(err); }
    }

    window.saveStudentAssignment = async function() {
        const studentId = document.querySelector('#student-id').value;
        const busId = document.querySelector('#student-bus').value;
        const routeId = document.querySelector('#student-route').value;

        try {
            await fetch(`${API_BASE}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, busId, routeId })
            });
            closeTransportModal('studentTransportModal');
            loadStudentAssignments();
        } catch(err) { console.error(err); }
    }

    window.deleteStudentAssignment = async function(id) {
        if(!confirm('Delete this assignment?')) return;
        await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
        loadStudentAssignments();
    }
    // ---------------------------
// TRANSPORT FEES
// ---------------------------
window.saveFee = async function () {
    const routeId = document.getElementById('fees-route').value;
    const amount = document.getElementById('fees-amount').value;

    if (!routeId || !amount) {
        alert('Please select a route and enter fee amount');
        return;
    }

    try {
        await fetch(`${API_BASE}/fees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ routeId, amount })
        });

        closeTransportModal('feesModal');
        alert('Transport fee saved successfully');
    } catch (err) {
        console.error('Error saving fee:', err);
        alert('Failed to save fee');
    }
};
    // ---------------------------
// TRANSPORT PAYMENTS
// ---------------------------
window.saveTransportPayment = async function () {
    const studentId = document.getElementById('payment-student').value;
    const routeId = document.getElementById('payment-route').value;
    const amountPaid = document.getElementById('payment-amount').value;
    const term = document.getElementById('payment-term').value;
    const year = document.getElementById('payment-year').value;
    const method = document.getElementById('payment-method').value;

    if (!studentId || !routeId || !amountPaid || !term || !year || !method) {
        alert('Please fill all payment fields');
        return;
    }

    try {
        await fetch('https://eagles-emulators-schools.onrender.com/api/transport/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId,
                routeId,
                amountPaid,
                term,
                year,
                method
            })
        });

        alert('Payment saved successfully');
        loadTransportPayments();
    } catch (err) {
        console.error('Error saving payment:', err);
        alert('Failed to save payment');
    }
};

    // ---------------------------
    // INITIAL LOAD
    // ---------------------------
    loadBuses();
    loadRoutes();
    loadDrivers();
    loadStudentAssignments();
    loadTransportPayments();
});
