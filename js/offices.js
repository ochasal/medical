// ===== CONSULTORIOS (Supabase) =====

function openNewOfficeModal() {
  document.getElementById('officeForm').reset();
  document.getElementById('officeEditId').value = '';
  document.getElementById('officeModalTitle').textContent = 'Nuevo Consultorio';
  document.getElementById('officeModal').style.display = 'block';
}
function closeOfficeModal() { document.getElementById('officeModal').style.display = 'none'; }

async function loadOffices() {
  var { data: offices, error } = await supabase.from('offices').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
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
      '<p style="margin:0;color:var(--text-secondary);">Horario: ' + (o.start_time || '') + ' - ' + (o.end_time || '') + '</p>' +
      '<div style="margin-top:0.5rem;"><button class="btn btn-sm btn-danger" onclick="deleteOffice(\'' + o.id + '\')"><i class="fas fa-trash"></i> Eliminar</button></div>' +
      '</div>';
  }).join('');
}

async function deleteOffice(id) {
  showConfirm('Eliminar Consultorio', '¿Está seguro?', async function() {
    await supabase.from('offices').delete().eq('id', id);
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
      if (editId) { ({ error } = await supabase.from('offices').update(data).eq('id', editId)); }
      else { ({ error } = await supabase.from('offices').insert(data)); }
      if (error) { showToast('error', 'Error', error.message); return; }
      closeOfficeModal();
      loadOffices();
      showToast('success', 'Guardado', 'Consultorio guardado');
    });
  }
});
