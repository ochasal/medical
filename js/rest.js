// ===== REPOSO MÉDICO (Supabase) =====

/* ─── PATIENT SEARCH PANEL (Rest Modal) ─── */
var _restAllPatients = [];
var _restRecentPtIds = [];

function _restPtRowHtml(p, q) {
  var col = _apptPtColor(p.id);
  var ts  = p.last_visit ? _apptFmtLastVisit(p.last_visit) : '';
  return '<div onclick="_restSelectPatient(\'' + p.id + '\')" style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border-color);" onmouseover="this.style.background=\'var(--hover-bg,rgba(0,0,0,.04))\'" onmouseout="this.style.background=\'\'">' +
    '<div style="width:32px;height:32px;border-radius:50%;background:' + col + ';display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:#fff;flex-shrink:0;">' + _apptPtInitials(p) + '</div>' +
    '<div style="min-width:0;flex:1;">' +
      '<div style="font-size:0.83rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _apptPtHighlight(_apptPtFullName(p), q) + '</div>' +
      '<div style="font-size:0.72rem;color:var(--text-secondary);margin-top:1px;">' + _apptPtHighlight('C.I. ' + (p.patient_id||'—'), q) + '</div>' +
    '</div>' +
    (ts ? '<div style="font-size:0.71rem;color:var(--text-secondary);white-space:nowrap;flex-shrink:0;padding-left:0.4rem;">' + ts + '</div>' : '') +
  '</div>';
}

function _restRenderPtPanel(q) {
  var el = document.getElementById('restPtPanelContent');
  if (!el) return;
  var label = '<div style="padding:0.32rem 0.85rem 0.12rem;font-size:0.67rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">';
  if (q) {
    var t = q.toLowerCase();
    var res = _restAllPatients.filter(function(p) {
      var full = _apptPtFullName(p).toLowerCase();
      var ci   = (p.patient_id||'').replace(/\./g,'');
      return full.includes(t) || ci.includes(t.replace(/\./g,''));
    });
    el.innerHTML = res.length
      ? label + res.length + ' resultado' + (res.length !== 1 ? 's' : '') + '</div>' + res.map(function(p) { return _restPtRowHtml(p, q); }).join('')
      : '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">Sin resultados para "<strong>' + q + '</strong>"</div>';
  } else {
    var rec    = _restRecentPtIds.map(function(id) { return _restAllPatients.find(function(p) { return p.id === id; }); }).filter(Boolean);
    var recIds = rec.map(function(p) { return p.id; });
    var rest   = _restAllPatients.filter(function(p) { return !recIds.includes(p.id); });
    var html   = '';
    if (rec.length)  html += label + 'Recientes</div>'           + rec.map(function(p) { return _restPtRowHtml(p, ''); }).join('');
    if (rest.length) html += label + 'Todos los pacientes</div>' + rest.map(function(p) { return _restPtRowHtml(p, ''); }).join('');
    if (!html)       html  = '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">No hay pacientes registrados aún</div>';
    el.innerHTML = html;
  }
}

function _restOpenPtPanel() {
  _restRenderPtPanel(document.getElementById('restPtInput').value.trim());
  document.getElementById('restPtPanel').style.display = 'block';
}

function _restOnPtInput() {
  _restRenderPtPanel(document.getElementById('restPtInput').value.trim());
  document.getElementById('restPtPanel').style.display = 'block';
}

function _restSelectPatient(id) {
  var p = _restAllPatients.find(function(x) { return String(x.id) === String(id); });
  if (!p) return;
  _restRecentPtIds = [p.id].concat(_restRecentPtIds.filter(function(x) { return x !== p.id; })).slice(0, 3);
  document.getElementById('restPatient').value             = p.id;
  document.getElementById('restPtPanel').style.display     = 'none';
  document.getElementById('restPtTrigger').style.display   = 'none';
  var sel = document.getElementById('restPtSelected');
  sel.style.display = 'flex';
  document.getElementById('restPtSelAv').style.background  = _apptPtColor(p.id);
  document.getElementById('restPtSelAv').textContent       = _apptPtInitials(p);
  document.getElementById('restPtSelName').textContent     = _apptPtFullName(p);
  document.getElementById('restPtSelMeta').textContent     = 'C.I. ' + (p.patient_id || '—');
}

function _restClearPatient() {
  document.getElementById('restPatient').value             = '';
  document.getElementById('restPtTrigger').style.display   = '';
  document.getElementById('restPtSelected').style.display  = 'none';
  document.getElementById('restPtInput').value             = '';
  document.getElementById('restPtPanel').style.display     = 'none';
}

async function openNewRestModal() {
  var [ptRes, visitRes] = await Promise.all([
    db.from('patients').select('id, name, lastname, patient_id').order('name'),
    db.from('rest_records').select('patient_id, start_date').order('start_date', { ascending: false })
  ]);
  var lastVisitMap = {};
  var recentIds = [];
  (visitRes.data || []).forEach(function(v) {
    if (!lastVisitMap[v.patient_id]) {
      lastVisitMap[v.patient_id] = v.start_date || null;
      if (recentIds.length < 3) recentIds.push(v.patient_id);
    }
  });
  _restRecentPtIds = recentIds;
  _restAllPatients = (ptRes.data || []).map(function(p) {
    return Object.assign({}, p, { last_visit: lastVisitMap[p.id] || null });
  });
  document.getElementById('restForm').reset();
  document.getElementById('restEditId').value = '';
  document.getElementById('restModalTitle').textContent = 'Nuevo Reposo Médico';
  document.getElementById('restStartDate').valueAsDate = new Date();
  _restClearPatient();
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
  _restSelectPatient(rest.patient_id);
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
  // Close patient panel when clicking outside
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('restPtSearchWrap');
    var panel = document.getElementById('restPtPanel');
    if (wrap && panel && !wrap.contains(e.target)) panel.style.display = 'none';
  });

  var form = document.getElementById('restForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!document.getElementById('restPatient').value) {
        showToast('error', 'Error', 'Selecciona un paciente');
        return;
      }
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
