// ===== CONSULTORIOS (Supabase) =====

function openNewOfficeModal() {
  document.getElementById('officeForm').reset();
  document.getElementById('officeEditId').value = '';
  document.getElementById('officeModalTitle').textContent = 'Nuevo Consultorio';
  document.getElementById('officeModal').style.display = 'block';
}
function closeOfficeModal() { document.getElementById('officeModal').style.display = 'none'; }

async function loadOffices() {
  var { data: offices, error } = await db.from('offices').select('*').order('created_at', { ascending: false });
  if (error) { return; }
  var container = document.getElementById('officesContent');
  if (!container) return;
  if (!offices || offices.length === 0) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">No hay consultorios registrados.</p>';
    return;
  }
  container.innerHTML = offices.map(function(o) {
    return '<div class="stat-card" style="margin-bottom:1rem;flex-direction:column;align-items:flex-start;">' +
      '<h4 style="margin:0 0 0.5rem 0;">' + o.name + '</h4>' +
      '<p style="margin:0;color:var(--text-secondary);">' + (o.address || '') + '</p>' +
      '<p style="margin:0.25rem 0;color:var(--text-secondary);">Tel: ' + (o.phone || 'N/A') + '</p>' +
      '<p style="margin:0;color:var(--text-secondary);">Horario: ' + (o.start_time || '').substring(0,5) + ' - ' + (o.end_time || '').substring(0,5) + '</p>' +
      '<div style="margin-top:0.75rem;display:flex;gap:0.5rem;">' +
        '<button onclick="editOffice(\'' + o.id + '\')" style="background:var(--info-color);color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-edit"></i> Editar</button>' +
        '<button onclick="deleteOffice(\'' + o.id + '\')" style="background:var(--danger-color);color:white;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-trash"></i> Eliminar</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

async function editOffice(id) {
  var { data: office } = await db.from('offices').select('*').eq('id', id).single();
  if (!office) return;
  document.getElementById('officeForm').reset();
  document.getElementById('officeEditId').value = id;
  document.getElementById('officeModalTitle').textContent = 'Editar Consultorio';
  document.getElementById('officeName').value = office.name || '';
  document.getElementById('officePhone').value = office.phone || '';
  document.getElementById('officeAddress').value = office.address || '';
  document.getElementById('officeStartTime').value = office.start_time || '08:00';
  document.getElementById('officeEndTime').value = office.end_time || '17:00';
  // Set days checkboxes
  document.querySelectorAll('.officeDay').forEach(function(cb) {
    cb.checked = (office.days || []).includes(cb.value);
  });
  document.getElementById('officeModal').style.display = 'block';
}

async function deleteOffice(id) {
  showConfirm('Eliminar Consultorio', '¿Está seguro?', async function() {
    await db.from('offices').delete().eq('id', id);
    loadOffices();
    showToast('success', 'Eliminado', 'Consultorio eliminado');
  });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('officeForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('officeEditId').value;
      var days = [];
      document.querySelectorAll('.officeDay:checked').forEach(function(cb) { days.push(cb.value); });
      var data = {
        name: document.getElementById('officeName').value,
        phone: document.getElementById('officePhone').value,
        address: document.getElementById('officeAddress').value,
        start_time: document.getElementById('officeStartTime').value,
        end_time: document.getElementById('officeEndTime').value,
        days: days
      };
      var error;
      if (editId) { ({ error } = await db.from('offices').update(data).eq('id', editId)); }
      else { { var result = await dbInsert('offices', data); error = result.error; } }
      if (error) { 
        var errorMsg = error.message || 'Error al guardar el consultorio';
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closeOfficeModal();
      loadOffices();
      showToast('success', 'Guardado', 'Consultorio guardado');
    });
  }
});
