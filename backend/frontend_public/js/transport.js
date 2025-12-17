document.addEventListener('DOMContentLoaded', function() {

  // Modal logic
  window.openTransportModal = function(id) {
      document.querySelectorAll('.transport-modal').forEach(m => m.style.display='none');
      const modal = document.getElementById(id);
      if(modal) modal.style.display='flex';
  };

  window.closeTransportModal = function(id) {
      const modal = document.getElementById(id);
      if(modal) modal.style.display='none';
  };

  window.addEventListener('click', function(e) {
      if(e.target.classList.contains('transport-modal')) {
          e.target.style.display='none';
      }
  });

  // DATA STORAGE
  window.buses = [];
  window.routes = [];
  window.drivers = [];
  window.studentTransport = [];
  window.fees = [];

  // BUS FUNCTIONS
  window.saveBus = function() {
      const bus = {
          id: Date.now(),
          number: document.getElementById('bus-number').value,
          plate: document.getElementById('bus-plate').value,
          capacity: document.getElementById('bus-capacity').value,
          status: document.getElementById('bus-status').value
      };
      if(!bus.number || !bus.plate || !bus.capacity) { alert('Fill all fields'); return; }
      buses.push(bus); renderBusTable(); closeTransportModal('busModal'); populateBusSelect();
  };

  function renderBusTable() {
      const tbody = document.querySelector('#bus-table tbody');
      tbody.innerHTML = buses.map(b=>`
          <tr>
              <td>${b.number}</td>
              <td>${b.plate}</td>
              <td>${b.capacity}</td>
              <td>${b.status}</td>
              <td>
                  <button onclick="editBus(${b.id})">Edit</button>
                  <button onclick="deleteBus(${b.id})">Delete</button>
              </td>
          </tr>
      `).join('');
  }

  window.editBus = function(id) {
      const b = buses.find(x=>x.id===id);
      if(!b) return;
      document.getElementById('bus-number').value=b.number;
      document.getElementById('bus-plate').value=b.plate;
      document.getElementById('bus-capacity').value=b.capacity;
      document.getElementById('bus-status').value=b.status;
      buses = buses.filter(x=>x.id!==id);
      openTransportModal('busModal');
  };

  window.deleteBus = function(id) { if(confirm('Delete?')) { buses=buses.filter(x=>x.id!==id); renderBusTable(); populateBusSelect(); } };

  function populateBusSelect() {
      const busSelects = [document.getElementById('route-bus'), document.getElementById('driver-bus'), document.getElementById('student-bus')];
      busSelects.forEach(select=>{
          if(select) {
              select.innerHTML='<option>Select Bus</option>'+buses.map(b=>`<option value="${b.id}">${b.number}</option>`).join('');
          }
      });
  }

  // ROUTE FUNCTIONS
  window.saveRoute = function() {
      const route = { id: Date.now(), name: document.getElementById('route-name').value, busId: document.getElementById('route-bus').value };
      if(!route.name) { alert('Enter route name'); return; }
      routes.push(route); renderRouteTable(); closeTransportModal('routeModal'); populateRouteSelect();
  };

  function renderRouteTable() {
      const tbody=document.querySelector('#route-table tbody');
      tbody.innerHTML=routes.map(r=>{
          const bus = buses.find(b=>b.id==r.busId);
          return `<tr>
              <td>${r.name}</td>
              <td>${bus?bus.number:'N/A'}</td>
              <td>
                  <button onclick="editRoute(${r.id})">Edit</button>
                  <button onclick="deleteRoute(${r.id})">Delete</button>
              </td>
          </tr>`;
      }).join('');
  }

  window.editRoute=function(id){ const r=routes.find(x=>x.id===id); if(!r)return; document.getElementById('route-name').value=r.name; document.getElementById('route-bus').value=r.busId; routes=routes.filter(x=>x.id!==id); openTransportModal('routeModal'); };
  window.deleteRoute=function(id){ if(confirm('Delete?')){ routes=routes.filter(x=>x.id!==id); renderRouteTable(); populateRouteSelect(); } };

  function populateRouteSelect(){ const select=document.getElementById('student-route'); if(select) select.innerHTML='<option>Select Route</option>'+routes.map(r=>`<option value="${r.id}">${r.name}</option>`).join(''); }

  // DRIVER FUNCTIONS
  window.saveDriver=function(){ const d={ id:Date.now(), name:document.getElementById('driver-name').value, license:document.getElementById('driver-license').value, busId:document.getElementById('driver-bus').value }; if(!d.name || !d.license) { alert('Fill all fields'); return; } drivers.push(d); renderDriverTable(); closeTransportModal('driverModal'); };
  function renderDriverTable(){ const tbody=document.querySelector('#driver-table tbody'); tbody.innerHTML=drivers.map(d=>{ const bus=buses.find(b=>b.id==d.busId); return `<tr><td>${d.name}</td><td>${bus?bus.number:'N/A'}</td><td><button onclick="editDriver(${d.id})">Edit</button><button onclick="deleteDriver(${d.id})">Delete</button></td></tr>` }).join(''); }
  window.editDriver=function(id){ const d=drivers.find(x=>x.id===id); if(!d)return; document.getElementById('driver-name').value=d.name; document.getElementById('driver-license').value=d.license; document.getElementById('driver-bus').value=d.busId; drivers=drivers.filter(x=>x.id!==id); openTransportModal('driverModal'); };
  window.deleteDriver=function(id){ if(confirm('Delete?')){ drivers=drivers.filter(x=>x.id!==id); renderDriverTable(); }

  };

  // STUDENT TRANSPORT
  window.assignStudentTransport=function(){ const s=document.getElementById('student-select').value; const r=document.getElementById('student-route').value; const b=document.getElementById('student-bus').value; if(!s || !r || !b) { alert('Fill all fields'); return; } studentTransport.push({id:Date.now(), student:s, route:r, bus:b}); renderStudentTransportTable(); closeTransportModal('studentTransportModal'); };
  function renderStudentTransportTable(){ const tbody=document.querySelector('#student-transport-table tbody'); tbody.innerHTML=studentTransport.map(st=>{ const route=routes.find(r=>r.id==st.route); const bus=buses.find(b=>b.id==st.bus); return `<tr><td>${st.student}</td><td>${route?route.name:'N/A'}</td><td>${bus?bus.number:'N/A'}</td><td><button onclick="deleteStudentTransport(${st.id})">Delete</button></td></tr>` }).join(''); }
  window.deleteStudentTransport=function(id){ studentTransport=studentTransport.filter(x=>x.id!==id); renderStudentTransportTable(); };

});
