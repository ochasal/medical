// ===== RECETAS (Supabase) =====

async function openNewPrescriptionModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('prescriptionPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('prescriptionForm').reset();
  document.getElementById('prescriptionEditId').value = '';
  document.getElementById('prescriptionModalTitle').textContent = 'Nueva Receta';
  document.getElementById('prescriptionModal').style.display = 'block';
}
function closePrescriptionModal() { document.getElementById('prescriptionModal').style.display = 'none'; }

async function refreshPrescriptions() {
  var { data: prescriptions, error } = await db.from('prescriptions').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('prescriptionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var total = 0, active = 0, completed = 0, cancelled = 0;
  (prescriptions || []).forEach(function(rx) {
    total++;
    if (rx.status === 'active') active++;
    else if (rx.status === 'completed') completed++;
    else if (rx.status === 'cancelled') cancelled++;
    var patient = rx.patients || {};
    var statusLabels = { active: 'Activa', completed: 'Completada', cancelled: 'Cancelada' };
    var statusClass = { active: 'success', completed: 'info', cancelled: 'danger' };
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (rx.medication || '') + '</td><td>' + (rx.dosage || '') + '</td><td>' + (rx.frequency || '') + '</td>' +
      '<td>' + (rx.start_date || '') + ' - ' + (rx.end_date || '') + '</td>' +
      '<td><span class="badge badge-' + (statusClass[rx.status] || 'info') + '">' + (statusLabels[rx.status] || rx.status) + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editPrescription(\'' + rx.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="deletePrescription(\'' + rx.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
  if (document.getElementById('totalPrescriptionsCount')) document.getElementById('totalPrescriptionsCount').textContent = total;
  if (document.getElementById('activePrescriptionsCount')) document.getElementById('activePrescriptionsCount').textContent = active;
  if (document.getElementById('completedPrescriptionsCount')) document.getElementById('completedPrescriptionsCount').textContent = completed;
  if (document.getElementById('cancelledPrescriptionsCount')) document.getElementById('cancelledPrescriptionsCount').textContent = cancelled;
  if (document.getElementById('activePrescriptions')) document.getElementById('activePrescriptions').textContent = active;
}

async function editPrescription(id) {
  var { data: rx } = await db.from('prescriptions').select('*').eq('id', id).single();
  if (!rx) return;
  await openNewPrescriptionModal();
  document.getElementById('prescriptionEditId').value = id;
  document.getElementById('prescriptionModalTitle').textContent = 'Editar Receta';
  document.getElementById('prescriptionPatient').value = rx.patient_id;
  document.getElementById('prescriptionMedication').value = rx.medication || '';
  document.getElementById('prescriptionDosage').value = rx.dosage || '';
  document.getElementById('prescriptionFrequency').value = rx.frequency || '';
  document.getElementById('prescriptionStartDate').value = rx.start_date || '';
  document.getElementById('prescriptionEndDate').value = rx.end_date || '';
  document.getElementById('prescriptionStatus').value = rx.status || 'active';
  document.getElementById('prescriptionNotes').value = rx.notes || '';
}

async function deletePrescription(id) {
  showConfirm('Eliminar Receta', '¿Está seguro?', async function() {
    var { error } = await db.from('prescriptions').delete().eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    refreshPrescriptions();
    showToast('success', 'Eliminada', 'Receta eliminada');
  });
}

function searchPrescriptions() {
  var query = document.getElementById('prescriptionSearchField').value.toLowerCase();
  var rows = document.querySelectorAll('#prescriptionsTableBody tr');
  rows.forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}
function filterPrescriptions() { refreshPrescriptions(); }
function exportPrescriptionsPDF() { showToast('info', 'Exportando', 'Generando PDF...'); }

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('prescriptionForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('prescriptionEditId').value;
      var data = {
        patient_id: document.getElementById('prescriptionPatient').value,
        medication: document.getElementById('prescriptionMedication').value,
        dosage: document.getElementById('prescriptionDosage').value,
        frequency: document.getElementById('prescriptionFrequency').value,
        start_date: document.getElementById('prescriptionStartDate').value || null,
        end_date: document.getElementById('prescriptionEndDate').value || null,
        status: document.getElementById('prescriptionStatus').value,
        notes: document.getElementById('prescriptionNotes').value
      };
      var error;
      if (editId) { ({ error } = await db.from('prescriptions').update(data).eq('id', editId)); }
      else { ({ error } = await db.from('prescriptions').insert(data)); }
      if (error) { showToast('error', 'Error', error.message); return; }
      closePrescriptionModal();
      refreshPrescriptions();
      showToast('success', 'Guardada', editId ? 'Receta actualizada' : 'Receta creada');
    });
  }
});
