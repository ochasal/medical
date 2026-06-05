// ===== LISTA DE ESPERA (Supabase) =====

async function openNewWaitingListModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('waitingListPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('waitingListForm').reset();
  document.getElementById('waitingListModal').style.display = 'block';
}
function closeWaitingListModal() { document.getElementById('waitingListModal').style.display = 'none'; }

async function refreshWaitingList() {
  var { data: list, error } = await db.from('waiting_list').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('waitingListTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (list || []).forEach(function(entry) {
    var patient = entry.patients || {};
    var priorityLabels = { urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baja' };
    var statusLabels = { waiting: 'En espera', scheduled: 'Programada', cancelled: 'Cancelada' };
    var typeLabels = { general: 'Consulta General', followup: 'Seguimiento', specialist: 'Especialista', control: 'Control' };
    var priorityClass = entry.priority === 'urgent' ? 'danger' : entry.priority === 'high' ? 'warning' : 'info';
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td><span class="badge badge-' + priorityClass + '">' + (priorityLabels[entry.priority] || entry.priority) + '</span></td>' +
      '<td>' + (entry.preferred_date ? formatDate(entry.preferred_date) : 'Flexible') + '</td><td>' + (typeLabels[entry.type] || entry.type) + '</td>' +
      '<td><span class="badge badge-info">' + (statusLabels[entry.status] || entry.status) + '</span></td>' +
      '<td><button class="btn btn-sm btn-danger" onclick="removeFromWaitingList(\'' + entry.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    tbody.innerHTML += row;
  });
}

async function removeFromWaitingList(id) {
  showConfirm('Eliminar', '¿Eliminar de la lista de espera?', async function() {
    var { error } = await db.from('waiting_list').delete().eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    refreshWaitingList();
    showToast('success', 'Eliminado', 'Removido de la lista de espera');
  });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('waitingListForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var data = {
        patient_id: document.getElementById('waitingListPatient').value,
        type: document.getElementById('waitingListType').value,
        preferred_date: document.getElementById('waitingListPreferredDate').value || null,
        priority: document.getElementById('waitingListPriority').value,
        status: 'waiting'
      };
      { var result = await dbInsert('waiting_list', data); var error = result.error; }
      if (error) { 
        var errorMsg = error.message || 'Error al agregar a la lista de espera';
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closeWaitingListModal();
      refreshWaitingList();
      showToast('success', 'Agregado', 'Paciente en lista de espera');
    });
  }
});
