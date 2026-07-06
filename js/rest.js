// ===== REPOSO MÉDICO (Supabase) =====

async function openNewRestModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('restPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('restForm').reset();
  document.getElementById('restEditId').value = '';
  document.getElementById('restModalTitle').textContent = 'Nuevo Reposo Médico';
  document.getElementById('restStartDate').valueAsDate = new Date();
  document.getElementById('restModal').style.display = 'block';
}
function closeRestModal() { document.getElementById('restModal').style.display = 'none'; }

// ===== LÓGICA DE FECHAS Y DÍAS =====

function _parseLocalDate(str) {
  var p = str.split('-');
  return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
}

function _formatDate(d) {
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function _clearRestDateError() {
  var el = document.getElementById('restDateError');
  if (el) el.textContent = '';
}

function _setRestDateError(msg) {
  var el = document.getElementById('restDateError');
  if (el) el.textContent = msg;
}

function _calcRestEndDate() {
  _clearRestDateError();
  var days = parseInt(document.getElementById('restDays').value);
  var startVal = document.getElementById('restStartDate').value;
  if (!days || days < 1 || !startVal) return;
  var start = _parseLocalDate(startVal);
  var end = new Date(start);
  end.setDate(end.getDate() + days);
  document.getElementById('restEndDate').value = _formatDate(end);
}

function _calcRestDays() {
  _clearRestDateError();
  var startVal = document.getElementById('restStartDate').value;
  var endVal = document.getElementById('restEndDate').value;
  if (!startVal || !endVal) return;
  var start = _parseLocalDate(startVal);
  var end = _parseLocalDate(endVal);
  var diff = Math.round((end - start) / 86400000);
  if (diff < 1) {
    _setRestDateError('La fecha final debe ser posterior a la fecha inicial.');
    document.getElementById('restDays').value = '';
    return;
  }
  document.getElementById('restDays').value = diff;
}

document.addEventListener('DOMContentLoaded', function() {
  var daysInput  = document.getElementById('restDays');
  var startInput = document.getElementById('restStartDate');
  var endInput   = document.getElementById('restEndDate');
  if (daysInput && startInput && endInput) {
    daysInput.addEventListener('input',  _calcRestEndDate);
    startInput.addEventListener('change', _calcRestEndDate);
    endInput.addEventListener('change', _calcRestDays);
  }
});

async function refreshRest() {
  var { data: rests, error } = await db.from('rest_records').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('restTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (rests || []).forEach(function(r) {
    var patient = r.patients || {};
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (r.diagnosis || '') + '</td>' +
      '<td>' + (r.days || '') + ' días</td>' +
      '<td>' + formatDate(r.start_date) + '</td>' +
      '<td>' + formatDate(r.end_date) + '</td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editRest(\'' + r.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-info" onclick="viewRest(\'' + r.id + '\')"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm btn-warning" onclick="exportRestPDF(\'' + r.id + '\')"><i class="fas fa-file-pdf"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteRest(\'' + r.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
}

async function editRest(id) {
  var { data: rest } = await db.from('rest_records').select('*').eq('id', id).single();
  if (!rest) return;
  await openNewRestModal();
  document.getElementById('restEditId').value = id;
  document.getElementById('restModalTitle').textContent = 'Editar Reposo';
  document.getElementById('restPatient').value = rest.patient_id;
  document.getElementById('restDays').value = rest.days || '';
  document.getElementById('restStartDate').value = rest.start_date || '';
  document.getElementById('restEndDate').value = rest.end_date || '';
  document.getElementById('restDiagnosis').value = rest.diagnosis || '';
  document.getElementById('restNotes').value = rest.notes || '';
}

async function viewRest(id) {
  var { data: r } = await db.from('rest_records').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!r) return;
  var patient = r.patients || {};
  var html = '<div style="background:var(--bg-secondary);padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">';
  html += '<p><strong>Días:</strong> ' + r.days + '</p>';
  html += '<p><strong>Desde:</strong> ' + formatDate(r.start_date) + '</p>';
  html += '<p><strong>Hasta:</strong> ' + formatDate(r.end_date) + '</p>';
  html += '</div>';
  html += '<p style="margin-top:1rem;"><strong>Diagnóstico:</strong> ' + (r.diagnosis || '-') + '</p>';
  if (r.notes) html += '<p><strong>Observaciones:</strong> ' + r.notes + '</p>';
  showDetailModal('Detalle de Reposo', html);
}

async function deleteRest(id) {
  showConfirm('Eliminar Reposo', '¿Está seguro?', async function() {
    await db.from('rest_records').delete().eq('id', id);
    refreshRest();
    showToast('success', 'Eliminado', 'Reposo eliminado');
  });
}

function searchRest() {
  var query = document.getElementById('restSearchField').value.toLowerCase();
  document.querySelectorAll('#restTableBody tr').forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('restForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      _clearRestDateError();

      var days     = parseInt(document.getElementById('restDays').value);
      var startVal = document.getElementById('restStartDate').value;
      var endVal   = document.getElementById('restEndDate').value;

      // Validar coherencia entre días y fechas
      if (startVal && endVal) {
        var start = _parseLocalDate(startVal);
        var end   = _parseLocalDate(endVal);
        if (end <= start) {
          _setRestDateError('La fecha final debe ser posterior a la fecha inicial.');
          return;
        }
        var expectedDays = Math.round((end - start) / 86400000);
        if (days && days !== expectedDays) {
          _setRestDateError(
            'Los días (' + days + ') no coinciden con las fechas (' + expectedDays + ' días entre ' +
            startVal + ' y ' + endVal + '). Corrija uno de los dos.'
          );
          return;
        }
        // Si no hay días pero sí fechas, se calcula automáticamente
        if (!days) days = expectedDays;
      } else if (startVal && days) {
        // Si no hay fecha final, la calculamos antes de guardar
        var s = _parseLocalDate(startVal);
        s.setDate(s.getDate() + days);
        endVal = _formatDate(s);
        document.getElementById('restEndDate').value = endVal;
      }

      var editId = document.getElementById('restEditId').value;
      var data = {
        patient_id: document.getElementById('restPatient').value,
        days: days,
        start_date: startVal,
        end_date: endVal || null,
        diagnosis: document.getElementById('restDiagnosis').value,
        notes: document.getElementById('restNotes').value
      };
      var error;
      if (editId) { ({ error } = await db.from('rest_records').update(data).eq('id', editId)); }
      else { { var result = await dbInsert('rest_records', data); error = result.error; } }
      if (error) { 
        var errorMsg = error.message || 'Error al guardar el reposo médico';
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closeRestModal();
      refreshRest();
      showToast('success', 'Guardado', editId ? 'Reposo actualizado' : 'Reposo creado');
    });
  }
});
