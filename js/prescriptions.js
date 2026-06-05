// ===== RÉCIPES (Supabase) =====

function addMedicationRow() {
  var container = document.getElementById('medicationsContainer');
  var row = document.createElement('div');
  row.className = 'medication-row';
  row.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; position: relative;';
  row.innerHTML = '<button type="button" onclick="this.parentElement.remove()" style="position:absolute;top:0.5rem;right:0.5rem;background:var(--danger-color);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.8rem;">&times;</button>' +
    '<div class="form-grid">' +
      '<div class="form-group"><label>Medicamento *</label><input type="text" class="med-name" required placeholder="Ej: Amoxicilina" /></div>' +
      '<div class="form-group"><label>Presentación</label><input type="text" class="med-presentation" placeholder="Ej: 500mg cápsulas" /></div>' +
      '<div class="form-group"><label>Dosis *</label><input type="text" class="med-dosage" required placeholder="Ej: 500mg" /></div>' +
      '<div class="form-group"><label>Frecuencia *</label><input type="text" class="med-frequency" required placeholder="Ej: Cada 8 horas" /></div>' +
      '<div class="form-group"><label>Duración</label><input type="text" class="med-duration" placeholder="Ej: 7 días" /></div>' +
      '<div class="form-group"><label>Cantidad</label><input type="text" class="med-quantity" placeholder="Ej: 21 cápsulas" /></div>' +
    '</div>' +
    '<div class="form-group"><label>Indicaciones</label><input type="text" class="med-instructions" placeholder="Ej: Tomar con alimentos" /></div>';
  container.appendChild(row);
}

function getMedicationsFromForm() {
  var rows = document.querySelectorAll('#medicationsContainer .medication-row');
  var medications = [];
  rows.forEach(function(row) {
    var name = row.querySelector('.med-name').value;
    if (name) {
      medications.push({
        name: name,
        presentation: row.querySelector('.med-presentation').value,
        dosage: row.querySelector('.med-dosage').value,
        frequency: row.querySelector('.med-frequency').value,
        duration: row.querySelector('.med-duration').value,
        quantity: row.querySelector('.med-quantity').value,
        instructions: row.querySelector('.med-instructions').value
      });
    }
  });
  return medications;
}

async function openNewPrescriptionModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('prescriptionPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('prescriptionForm').reset();
  document.getElementById('prescriptionEditId').value = '';
  document.getElementById('prescriptionModalTitle').textContent = 'Nuevo Récipe';
  document.getElementById('prescriptionDate').valueAsDate = new Date();
  // Reset medications to one empty row
  document.getElementById('medicationsContainer').innerHTML = '<div class="medication-row" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;"><div class="form-grid"><div class="form-group"><label>Medicamento *</label><input type="text" class="med-name" required placeholder="Ej: Amoxicilina" /></div><div class="form-group"><label>Presentación</label><input type="text" class="med-presentation" placeholder="Ej: 500mg cápsulas" /></div><div class="form-group"><label>Dosis *</label><input type="text" class="med-dosage" required placeholder="Ej: 500mg" /></div><div class="form-group"><label>Frecuencia *</label><input type="text" class="med-frequency" required placeholder="Ej: Cada 8 horas" /></div><div class="form-group"><label>Duración</label><input type="text" class="med-duration" placeholder="Ej: 7 días" /></div><div class="form-group"><label>Cantidad</label><input type="text" class="med-quantity" placeholder="Ej: 21 cápsulas" /></div></div><div class="form-group"><label>Indicaciones</label><input type="text" class="med-instructions" placeholder="Ej: Tomar con alimentos" /></div></div>';
  document.getElementById('prescriptionModal').style.display = 'block';
}
function closePrescriptionModal() { document.getElementById('prescriptionModal').style.display = 'none'; }

async function refreshPrescriptions() {
  var { data: prescriptions, error } = await db.from('prescriptions').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { 
    var errorMsg = error.message || 'Error al cargar los récipes';
    showToast('error', 'Error', errorMsg); 
    return; 
  }
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
    var medications = rx.medications || [];
    var medSummary = medications.map(function(m) { return m.name; }).join(', ') || rx.medication || '';
    var statusLabels = { active: 'Activo', completed: 'Completado', cancelled: 'Cancelado' };
    var statusClass = { active: 'success', completed: 'info', cancelled: 'danger' };
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + medSummary + '</td>' +
      '<td>' + medications.length + ' med.</td>' +
      '<td>' + formatDate(rx.date || rx.start_date) + '</td>' +
      '<td><span class="badge badge-' + (statusClass[rx.status] || 'info') + '">' + (statusLabels[rx.status] || rx.status) + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editPrescription(\'' + rx.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-info" onclick="viewPrescription(\'' + rx.id + '\')"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm btn-warning" onclick="exportPrescriptionPDF(\'' + rx.id + '\')"><i class="fas fa-file-pdf"></i></button>' +
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
  document.getElementById('prescriptionModalTitle').textContent = 'Editar Récipe';
  document.getElementById('prescriptionPatient').value = rx.patient_id;
  document.getElementById('prescriptionDate').value = rx.date || '';
  document.getElementById('prescriptionNotes').value = rx.notes || '';
  // Load medications into form
  var container = document.getElementById('medicationsContainer');
  var medications = rx.medications || [];
  if (medications.length > 0) {
    container.innerHTML = '';
    medications.forEach(function(m, i) {
      var row = document.createElement('div');
      row.className = 'medication-row';
      row.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; position: relative;';
      row.innerHTML = (i > 0 ? '<button type="button" onclick="this.parentElement.remove()" style="position:absolute;top:0.5rem;right:0.5rem;background:var(--danger-color);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.8rem;">&times;</button>' : '') +
        '<div class="form-grid">' +
          '<div class="form-group"><label>Medicamento *</label><input type="text" class="med-name" required value="' + (m.name || '') + '" /></div>' +
          '<div class="form-group"><label>Presentación</label><input type="text" class="med-presentation" value="' + (m.presentation || '') + '" /></div>' +
          '<div class="form-group"><label>Dosis *</label><input type="text" class="med-dosage" required value="' + (m.dosage || '') + '" /></div>' +
          '<div class="form-group"><label>Frecuencia *</label><input type="text" class="med-frequency" required value="' + (m.frequency || '') + '" /></div>' +
          '<div class="form-group"><label>Duración</label><input type="text" class="med-duration" value="' + (m.duration || '') + '" /></div>' +
          '<div class="form-group"><label>Cantidad</label><input type="text" class="med-quantity" value="' + (m.quantity || '') + '" /></div>' +
        '</div>' +
        '<div class="form-group"><label>Indicaciones</label><input type="text" class="med-instructions" value="' + (m.instructions || '') + '" /></div>';
      container.appendChild(row);
    });
  }
}

async function viewPrescription(id) {
  var { data: rx } = await db.from('prescriptions').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!rx) return;
  var patient = rx.patients || {};
  var medications = rx.medications || [];

  var html = '<div style="background:var(--bg-secondary);padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(rx.date) + '</p>';
  html += '</div>';
  html += '<h4 style="margin-bottom:0.75rem;">Medicamentos:</h4>';
  medications.forEach(function(m, i) {
    html += '<div style="border:1px solid var(--border-color);padding:0.75rem;border-radius:8px;margin-bottom:0.5rem;">';
    html += '<strong style="color:var(--accent-color);">' + (i + 1) + '. ' + m.name + '</strong>';
    if (m.presentation) html += ' <small>(' + m.presentation + ')</small>';
    html += '<br><span>Dosis: ' + (m.dosage || '-') + ' | Frecuencia: ' + (m.frequency || '-') + '</span>';
    if (m.duration) html += '<br><span>Duración: ' + m.duration + '</span>';
    if (m.quantity) html += ' | <span>Cantidad: ' + m.quantity + '</span>';
    if (m.instructions) html += '<br><em style="color:var(--text-secondary);">Indicaciones: ' + m.instructions + '</em>';
    html += '</div>';
  });
  if (rx.notes) html += '<p style="margin-top:1rem;"><strong>Notas:</strong> ' + rx.notes + '</p>';
  showDetailModal('Detalle de Récipe', html);
}

async function deletePrescription(id) {
  showConfirm('Eliminar Récipe', '¿Está seguro?', async function() {
    var { error } = await db.from('prescriptions').delete().eq('id', id);
    if (error) { 
      var errorMsg = error.message || 'Error al eliminar el récipe';
      showToast('error', 'Error', errorMsg); 
      return; 
    }
    refreshPrescriptions();
    showToast('success', 'Eliminado', 'Récipe eliminado');
  });
}

function searchPrescriptions() {
  var query = document.getElementById('prescriptionSearchField').value.toLowerCase();
  document.querySelectorAll('#prescriptionsTableBody tr').forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}
function filterPrescriptions() {
  var status = document.getElementById('prescriptionStatusFilter') ? document.getElementById('prescriptionStatusFilter').value : '';
  var rows = document.querySelectorAll('#prescriptionsTableBody tr');
  rows.forEach(function(row) {
    if (!status) { row.style.display = ''; return; }
    row.style.display = row.textContent.toLowerCase().includes(status.toLowerCase()) ? '' : 'none';
  });
}
function exportPrescriptionsPDF() {
  var rows = document.querySelectorAll('#prescriptionsTableBody tr');
  if (rows.length === 0) { showToast('info', 'Info', 'No hay récipes para exportar'); return; }
  showToast('info', 'Info', 'Usa el botón PDF en cada récipe individual');
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('prescriptionForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var medications = getMedicationsFromForm();
      if (medications.length === 0) { showToast('error', 'Error', 'Agregue al menos un medicamento'); return; }
      var editId = document.getElementById('prescriptionEditId').value;
      var data = {
        patient_id: document.getElementById('prescriptionPatient').value,
        date: document.getElementById('prescriptionDate').value || null,
        medications: medications,
        medication: medications.map(function(m) { return m.name; }).join(', '),
        dosage: medications[0].dosage,
        frequency: medications[0].frequency,
        notes: document.getElementById('prescriptionNotes').value,
        status: 'active'
      };
      var error;
      if (editId) { ({ error } = await db.from('prescriptions').update(data).eq('id', editId)); }
      else { { var result = await dbInsert('prescriptions', data); error = result.error; } }
      if (error) { 
        var errorMsg = 'Error al guardar el récipe';
        if (error.message) {
          errorMsg = error.message;
        }
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closePrescriptionModal();
      refreshPrescriptions();
      showToast('success', 'Guardado', editId ? 'Récipe actualizado' : 'Récipe creado');
    });
  }
});
