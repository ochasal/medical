// ===== RÉCIPES (Supabase) =====

function _medRowHtml(m, showRemove) {
  m = m || {};
  return (showRemove ? '<button type="button" onclick="this.parentElement.remove()" style="position:absolute;top:0.5rem;right:0.5rem;background:var(--danger-color);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.8rem;">&times;</button>' : '') +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0.5rem;">' +
      '<div class="form-group" style="grid-column:1/3"><label>Medicamento *</label><input type="text" class="med-name" required placeholder="Ej: Amoxicilina" value="' + (m.name || '') + '" /></div>' +
      '<div class="form-group" style="grid-column:3/5"><label>Presentación</label><input type="text" class="med-presentation" placeholder="Ej: 500mg cápsulas" value="' + (m.presentation || '') + '" /></div>' +
      '<div class="form-group"><label>Dosis *</label><input type="text" class="med-dosage" required placeholder="Ej: 500mg" value="' + (m.dosage || '') + '" /></div>' +
      '<div class="form-group"><label>Frecuencia *</label><input type="text" class="med-frequency" required placeholder="Ej: Cada 8 horas" value="' + (m.frequency || '') + '" /></div>' +
      '<div class="form-group"><label>Duración</label><input type="text" class="med-duration" placeholder="Ej: 7 días" value="' + (m.duration || '') + '" /></div>' +
      '<div class="form-group"><label>Cantidad</label><input type="text" class="med-quantity" placeholder="Ej: 21 cápsulas" value="' + (m.quantity || '') + '" /></div>' +
      '<div class="form-group" style="grid-column:1/-1"><label>Indicaciones</label><input type="text" class="med-instructions" placeholder="Ej: Tomar con alimentos" value="' + (m.instructions || '') + '" /></div>' +
    '</div>';
}

function addMedicationRow() {
  var container = document.getElementById('medicationsContainer');
  var row = document.createElement('div');
  row.className = 'medication-row';
  row.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 0.65rem; margin-bottom: 0.5rem; position: relative;';
  row.innerHTML = _medRowHtml(null, true);
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

/* ─── PATIENT SEARCH PANEL (Prescription Modal) ─── */
var _rxAllPatients = [];
var _rxRecentPtIds = [];

function _rxPtRowHtml(p, q) {
  var col = _apptPtColor(p.id);
  var ts  = p.last_visit ? _apptFmtLastVisit(p.last_visit) : '';
  return '<div onclick="_rxSelectPatient(\'' + p.id + '\')" style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border-color);" onmouseover="this.style.background=\'var(--hover-bg,rgba(0,0,0,.04))\'" onmouseout="this.style.background=\'\'">' +
    '<div style="width:32px;height:32px;border-radius:50%;background:' + col + ';display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:#fff;flex-shrink:0;">' + _apptPtInitials(p) + '</div>' +
    '<div style="min-width:0;flex:1;">' +
      '<div style="font-size:0.83rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _apptPtHighlight(_apptPtFullName(p), q) + '</div>' +
      '<div style="font-size:0.72rem;color:var(--text-secondary);margin-top:1px;">' + _apptPtHighlight('C.I. ' + (p.patient_id||'—'), q) + '</div>' +
    '</div>' +
    (ts ? '<div style="font-size:0.71rem;color:var(--text-secondary);white-space:nowrap;flex-shrink:0;padding-left:0.4rem;">' + ts + '</div>' : '') +
  '</div>';
}

function _rxRenderPtPanel(q) {
  var el = document.getElementById('rxPtPanelContent');
  if (!el) return;
  var label = '<div style="padding:0.32rem 0.85rem 0.12rem;font-size:0.67rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">';
  if (q) {
    var t = q.toLowerCase();
    var res = _rxAllPatients.filter(function(p) {
      var full = _apptPtFullName(p).toLowerCase();
      var ci   = (p.patient_id||'').replace(/\./g,'');
      return full.includes(t) || ci.includes(t.replace(/\./g,''));
    });
    el.innerHTML = res.length
      ? label + res.length + ' resultado' + (res.length !== 1 ? 's' : '') + '</div>' + res.map(function(p) { return _rxPtRowHtml(p, q); }).join('')
      : '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">Sin resultados para "<strong>' + q + '</strong>"</div>';
  } else {
    var rec    = _rxRecentPtIds.map(function(id) { return _rxAllPatients.find(function(p) { return p.id === id; }); }).filter(Boolean);
    var recIds = rec.map(function(p) { return p.id; });
    var rest   = _rxAllPatients.filter(function(p) { return !recIds.includes(p.id); });
    var html   = '';
    if (rec.length)  html += label + 'Recientes</div>'           + rec.map(function(p) { return _rxPtRowHtml(p, ''); }).join('');
    if (rest.length) html += label + 'Todos los pacientes</div>' + rest.map(function(p) { return _rxPtRowHtml(p, ''); }).join('');
    if (!html)       html  = '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">No hay pacientes registrados aún</div>';
    el.innerHTML = html;
  }
}

function _rxOpenPtPanel() {
  _rxRenderPtPanel(document.getElementById('rxPtInput').value.trim());
  document.getElementById('rxPtPanel').style.display = 'block';
}

function _rxOnPtInput() {
  _rxRenderPtPanel(document.getElementById('rxPtInput').value.trim());
  document.getElementById('rxPtPanel').style.display = 'block';
}

function _rxSelectPatient(id) {
  var p = _rxAllPatients.find(function(x) { return String(x.id) === String(id); });
  if (!p) return;
  _rxRecentPtIds = [p.id].concat(_rxRecentPtIds.filter(function(x) { return x !== p.id; })).slice(0, 3);
  document.getElementById('prescriptionPatient').value      = p.id;
  document.getElementById('rxPtPanel').style.display        = 'none';
  document.getElementById('rxPtTrigger').style.display      = 'none';
  var sel = document.getElementById('rxPtSelected');
  sel.style.display = 'flex';
  document.getElementById('rxPtSelAv').style.background     = _apptPtColor(p.id);
  document.getElementById('rxPtSelAv').textContent          = _apptPtInitials(p);
  document.getElementById('rxPtSelName').textContent        = _apptPtFullName(p);
  document.getElementById('rxPtSelMeta').textContent        = 'C.I. ' + (p.patient_id || '—');
}

function _rxClearPatient() {
  document.getElementById('prescriptionPatient').value      = '';
  document.getElementById('rxPtTrigger').style.display      = '';
  document.getElementById('rxPtSelected').style.display     = 'none';
  document.getElementById('rxPtInput').value                = '';
  document.getElementById('rxPtPanel').style.display        = 'none';
}

async function openNewPrescriptionModal() {
  var [ptRes, rxRes] = await Promise.all([
    db.from('patients').select('id, name, lastname, patient_id').order('name'),
    db.from('prescriptions').select('patient_id, date').order('date', { ascending: false })
  ]);
  var lastVisitMap = {};
  var recentIds = [];
  (rxRes.data || []).forEach(function(v) {
    if (!lastVisitMap[v.patient_id]) {
      lastVisitMap[v.patient_id] = v.date || null;
      if (recentIds.length < 3) recentIds.push(v.patient_id);
    }
  });
  _rxRecentPtIds = recentIds;
  _rxAllPatients = (ptRes.data || []).map(function(p) {
    return Object.assign({}, p, { last_visit: lastVisitMap[p.id] || null });
  });
  document.getElementById('prescriptionForm').reset();
  document.getElementById('prescriptionEditId').value = '';
  document.getElementById('prescriptionModalTitle').textContent = 'Nuevo Récipe';
  document.getElementById('prescriptionDate').valueAsDate = new Date();
  document.getElementById('medicationsContainer').innerHTML = '<div class="medication-row" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 0.65rem; margin-bottom: 0.5rem; position: relative;">' + _medRowHtml(null, false) + '</div>';
  _rxClearPatient();
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
  _rxSelectPatient(rx.patient_id);
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
      row.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 0.65rem; margin-bottom: 0.5rem; position: relative;';
      row.innerHTML = _medRowHtml(m, i > 0);
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
  // Close patient panel when clicking outside
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('rxPtSearchWrap');
    var panel = document.getElementById('rxPtPanel');
    if (wrap && panel && !wrap.contains(e.target)) panel.style.display = 'none';
  });

  var form = document.getElementById('prescriptionForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!document.getElementById('prescriptionPatient').value) {
        showToast('error', 'Error', 'Selecciona un paciente');
        return;
      }
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
