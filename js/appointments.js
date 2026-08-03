// ===== TIPOS DE CONSULTA =====

var DEFAULT_CONSULTATION_TYPES = [
  { value: 'consultation',     label: 'Consulta General' },
  { value: 'followup',         label: 'Seguimiento' },
  { value: 'emergency',        label: 'Emergencia' },
  { value: 'routine',          label: 'Control' },
  { value: 'pediatrics',       label: 'Pediatría' },
  { value: 'cardiology',       label: 'Cardiología' },
  { value: 'dermatology',      label: 'Dermatología' },
  { value: 'gynecology',       label: 'Ginecología' },
  { value: 'traumatology',     label: 'Traumatología' },
  { value: 'ophthalmology',    label: 'Oftalmología' },
  { value: 'neurology',        label: 'Neurología' },
  { value: 'urology',          label: 'Urología' },
  { value: 'psychiatry',       label: 'Psiquiatría' },
  { value: 'endocrinology',    label: 'Endocrinología' },
  { value: 'gastroenterology', label: 'Gastroenterología' },
  { value: 'pulmonology',      label: 'Neumología' },
  { value: 'otolaryngology',   label: 'Otorrinolaringología' }
];

function _typesKey() {
  var uid = getUserId();
  return uid ? 'appointmentTypes_' + uid : 'appointmentTypes';
}

function getConsultationTypes() {
  var stored = localStorage.getItem(_typesKey());
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  saveConsultationTypes(DEFAULT_CONSULTATION_TYPES);
  return DEFAULT_CONSULTATION_TYPES.slice();
}

function saveConsultationTypes(types) {
  localStorage.setItem(_typesKey(), JSON.stringify(types));
}

function getTypeLabels() {
  var labels = { follow_up: 'Seguimiento', checkup: 'Chequeo', procedure: 'Procedimiento' };
  getConsultationTypes().forEach(function(t) { labels[t.value] = t.label; });
  return labels;
}

function populateScheduleTypeSelect(keepValue) {
  var select = document.getElementById('scheduleType');
  if (!select) return;
  var prev = keepValue || select.value;
  var types = getConsultationTypes();
  select.innerHTML = types.map(function(t) {
    return '<option value="' + t.value + '"' + (prev === t.value ? ' selected' : '') + '>' + t.label + '</option>';
  }).join('');
}

function openManageTypesModal() {
  // z-index mayor que scheduleModal (2000) para que aparezca encima
  document.getElementById('manageTypesModal').style.zIndex = '3000';
  document.getElementById('newTypeLabel').value = '';
  renderTypesList();
  document.getElementById('manageTypesModal').style.display = 'block';
}

function closeManageTypesModal() {
  document.getElementById('manageTypesModal').style.display = 'none';
  populateScheduleTypeSelect();
}

function renderTypesList() {
  var container = document.getElementById('typesList');
  if (!container) return;
  var types = getConsultationTypes();
  if (!types.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:1rem;">Sin tipos registrados</p>';
    return;
  }
  container.innerHTML = types.map(function(t, i) {
    return '<div id="typeRow_' + i + '" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:var(--bg-secondary);border-radius:var(--radius-md);">' +
      '<span class="type-lbl" style="flex:1;font-size:0.9rem;">' + t.label + '</span>' +
      '<input class="type-inp" type="text" value="' + t.label + '" style="flex:1;padding:0.4rem 0.6rem;border:1px solid var(--accent-color);border-radius:6px;font-size:0.9rem;background:var(--bg-primary);color:var(--text-primary);display:none;" />' +
      '<button onclick="toggleTypeEdit(' + i + ')" id="editTypeBtn_' + i + '" class="btn btn-sm btn-info" style="min-width:34px;" title="Editar"><i class="fas fa-edit"></i></button>' +
      '<button onclick="saveTypeEdit(' + i + ')" id="saveTypeBtn_' + i + '" class="btn btn-sm btn-success" style="min-width:34px;display:none;" title="Guardar"><i class="fas fa-check"></i></button>' +
      '<button onclick="deleteConsultationType(' + i + ')" class="btn btn-sm btn-danger" style="min-width:34px;" title="Eliminar"><i class="fas fa-trash"></i></button>' +
    '</div>';
  }).join('');
}

function toggleTypeEdit(i) {
  var row = document.getElementById('typeRow_' + i);
  row.querySelector('.type-lbl').style.display = 'none';
  var inp = row.querySelector('.type-inp');
  inp.style.display = '';
  inp.focus(); inp.select();
  document.getElementById('editTypeBtn_' + i).style.display = 'none';
  document.getElementById('saveTypeBtn_' + i).style.display = '';
  inp.onkeydown = function(e) { if (e.key === 'Enter') saveTypeEdit(i); if (e.key === 'Escape') renderTypesList(); };
}

function saveTypeEdit(i) {
  var inp = document.getElementById('typeRow_' + i).querySelector('.type-inp');
  var label = inp.value.trim();
  if (!label) { showToast('error', 'Error', 'El nombre no puede estar vacío'); return; }
  var types = getConsultationTypes();
  types[i].label = label;
  saveConsultationTypes(types);
  renderTypesList();
}

function deleteConsultationType(i) {
  var types = getConsultationTypes();
  var name = types[i].label;
  showConfirm('Eliminar tipo', '¿Eliminar "' + name + '"?', function() {
    types.splice(i, 1);
    saveConsultationTypes(types);
    renderTypesList();
  });
}

function addConsultationType() {
  var input = document.getElementById('newTypeLabel');
  var label = input.value.trim();
  if (!label) { showToast('error', 'Error', 'Ingresa el nombre del tipo'); input.focus(); return; }
  var types = getConsultationTypes();
  var base = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  var value = base; var n = 1;
  while (types.some(function(t) { return t.value === value; })) { value = base + '_' + n++; }
  types.push({ value: value, label: label });
  saveConsultationTypes(types);
  input.value = '';
  renderTypesList();
  showToast('success', 'Agregado', '"' + label + '" agregado correctamente');
}

// ===== CITAS (Supabase) =====

async function loadAppointments() {
  var tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>';

  var { data: appointments, error } = await db.from('appointments').select('*, patients(name, lastname, patient_id, phone)').neq('status', 'deleted').order('date', { ascending: false });
  if (error) { console.error('Error loading appointments:', error); return; }

  tbody.innerHTML = '';
  var today = new Date().toISOString().split('T')[0];
  var todayCount = 0;

  appointments.forEach(function(apt) {
    var patient = apt.patients || {};
    var patientName = (patient.name || '') + ' ' + (patient.lastname || '');
    if (apt.date === today) todayCount++;
    var statusLabels = { scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada', 'no-show': 'No asistió' };
    var statusClass  = { scheduled: 'info', completed: 'success', cancelled: 'danger', 'no-show': 'warning' };
    var typeLabels   = getTypeLabels();
    var row = '<tr data-id="' + apt.id + '">' +
      '<td>' + patientName + '</td>' +
      '<td>' + formatDate(apt.date) + '</td>' +
      '<td>' + formatTime(apt.time) + '</td>' +
      '<td>' + (typeLabels[apt.type] || apt.type || 'Consulta') + '</td>' +
      '<td><span class="badge badge-' + (statusClass[apt.status] || 'info') + '">' + (statusLabels[apt.status] || apt.status) + '</span></td>' +
      '<td>' + (apt.office || '-') + '</td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-success" title="Abrir consulta" onclick="openConsultation(\'' + apt.id + '\')"><i class="fas fa-stethoscope"></i></button>' +
        '<button class="btn btn-sm btn-info" title="Editar cita" onclick="editAppointment(\'' + apt.id + '\')"><i class="fas fa-edit"></i></button>' +
        (apt.status === 'scheduled' ? '<button class="btn btn-sm btn-warning" title="Cancelar cita" onclick="cancelAppointment(\'' + apt.id + '\')" style="color:#fff;"><i class="fas fa-ban"></i></button>' : '') +
        '<button class="btn btn-sm btn-danger" title="Eliminar cita" onclick="deleteAppointment(\'' + apt.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
  if (document.getElementById('todayAppointments')) document.getElementById('todayAppointments').textContent = todayCount;
}

function toggleAllAppointments(source) {}
function updateBulkBar() {}
async function deleteSelectedAppointments() {}

async function deleteAppointment(id) {
  showConfirm('Eliminar cita', '¿Eliminar esta cita permanentemente? Esta acción no se puede deshacer.', async function() {
    var { error } = await db.from('appointments').update({ status: 'deleted' }).eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    if (typeof publishCalendar === 'function') publishCalendar();
    loadAppointments();
    showToast('success', 'Eliminada', 'Cita eliminada');
  });
}

function _todayISO() {
  var n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
}

function _nowHHMM() {
  var n = new Date();
  return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
}

function _scheduleTimeError(msg) {
  var el = document.getElementById('scheduleTimeError');
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

function _populateTimeSelect() {
  var sel = document.getElementById('scheduleTime');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecciona una fecha</option>';
  sel.disabled = true;
}

// ---- Slots dinámicos basados en horario del Dr. ----

function _apptFmt12(min) {
  var h24 = Math.floor(min / 60) % 24, m = min % 60;
  var p = h24 >= 12 ? 'PM' : 'AM';
  var h = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + p;
}

var _APPT_DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function _generateDaySlots(schedule, dateStr) {
  if (!schedule || !schedule.days) return null;
  var date = new Date(dateStr + 'T12:00:00');
  var dayKey = _APPT_DAY_KEYS[date.getDay()];
  var dayConfig = schedule.days[dayKey];
  if (!dayConfig || !dayConfig.active || !dayConfig.blocks || !dayConfig.blocks.length) return [];
  var consultMin = parseInt(schedule.consultDuration) || 30;
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var isToday = dateStr === todayStr;
  var slots = [];
  dayConfig.blocks.forEach(function(block) {
    var t = block.s;
    while (t + consultMin <= block.e) {
      if (isToday) {
        var sd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(t/60), t%60, 0);
        if (sd <= now) { t += consultMin; continue; }
      }
      var h24 = Math.floor(t/60), m = t%60;
      slots.push({ time: String(h24).padStart(2,'0') + ':' + String(m).padStart(2,'0'), label: _apptFmt12(t) });
      t += consultMin;
    }
  });
  return slots;
}

function _generateFallbackSlots(dateStr) {
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var isToday = dateStr === todayStr;
  var slots = [];
  for (var t = 360; t <= 1260; t += 30) {
    if (isToday) {
      var sd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(t/60), t%60, 0);
      if (sd <= now) continue;
    }
    var h24 = Math.floor(t/60), m = t%60;
    slots.push({ time: String(h24).padStart(2,'0') + ':' + String(m).padStart(2,'0'), label: _apptFmt12(t) });
  }
  return slots;
}

async function _getBookedTimesForDate(dateStr) {
  var editId = (document.getElementById('scheduleEditId') || {}).value || '';
  var query = db.from('appointments').select('time').eq('date', dateStr)
    .neq('status','deleted').neq('status','cancelled');
  if (editId) query = query.neq('id', editId);
  var { data } = await query;
  if (!data) return [];
  return data.map(function(a) { return a.time ? a.time.substring(0,5) : ''; }).filter(Boolean);
}

async function _populateScheduleSlots() {
  var dateEl = document.getElementById('scheduleDate');
  var timeEl = document.getElementById('scheduleTime');
  if (!dateEl || !timeEl) return;
  var dateStr = dateEl.value;
  if (!dateStr) {
    timeEl.innerHTML = '<option value="">Selecciona una fecha</option>';
    timeEl.disabled = true;
    return;
  }
  _scheduleConflictWarning('');
  timeEl.innerHTML = '<option value="">Cargando horarios...</option>';
  timeEl.disabled = true;

  var schedule = null;
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (user) {
    var { data: doc } = await db.from('doctors').select('schedule').eq('user_id', user.id).single();
    schedule = doc && doc.schedule ? doc.schedule : null;
  }

  var slots;
  if (schedule) {
    slots = _generateDaySlots(schedule, dateStr);
    if (!slots || slots.length === 0) {
      _scheduleConflictWarning('<i class="fas fa-info-circle"></i> No tienes horario de atención configurado para este día de la semana.');
      slots = [];
    }
  } else {
    slots = _generateFallbackSlots(dateStr);
  }

  if (!slots.length) {
    timeEl.innerHTML = '<option value="">Sin horarios disponibles este día</option>';
    timeEl.disabled = true;
    return;
  }

  var booked = await _getBookedTimesForDate(dateStr);
  var html = '<option value="">Seleccionar hora</option>';
  var available = 0;
  slots.forEach(function(slot) {
    if (booked.indexOf(slot.time) !== -1) {
      html += '<option disabled>' + slot.label + ' — Ocupado</option>';
    } else {
      html += '<option value="' + slot.time + '">' + slot.label + '</option>';
      available++;
    }
  });

  if (available === 0) {
    timeEl.innerHTML = '<option value="">Todos los horarios están ocupados</option>';
    timeEl.disabled = true;
  } else {
    timeEl.innerHTML = html;
    timeEl.disabled = false;
  }
}

function _scheduleConflictWarning(msg) {
  var el = document.getElementById('scheduleConflictWarn');
  if (!el) return;
  el.innerHTML = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

async function _checkScheduleConflict() {
  var dateEl   = document.getElementById('scheduleDate');
  var timeEl   = document.getElementById('scheduleTime');
  var editId   = document.getElementById('scheduleEditId').value;
  if (!dateEl || !timeEl || !dateEl.value || !timeEl.value) {
    _scheduleConflictWarning(''); return;
  }
  var timeVal = timeEl.value.substring(0, 5);
  var query = db.from('appointments')
    .select('id, patients(name, lastname)')
    .eq('date', dateEl.value)
    .like('time', timeVal + '%')
    .neq('status', 'deleted')
    .neq('status', 'cancelled');
  if (editId) query = query.neq('id', editId);
  var { data } = await query;
  if (data && data.length > 0) {
    var names = data.map(function(a) {
      var p = a.patients || {};
      return '<strong>' + (p.name || '') + ' ' + (p.lastname || '') + '</strong>';
    }).join(', ');
    _scheduleConflictWarning(
      '<i class="fas fa-exclamation-triangle"></i> Ya existe' + (data.length > 1 ? 'n ' + data.length + ' citas' : ' una cita') +
      ' a esta hora con: ' + names + '. Puedes continuar o elegir otra hora.'
    );
  } else {
    _scheduleConflictWarning('');
  }
}

function _updateScheduleTimeMin() { _populateScheduleSlots(); }

function _validateScheduleTime() {
  _checkScheduleConflict();
  var dateEl = document.getElementById('scheduleDate');
  var timeEl = document.getElementById('scheduleTime');
  if (!dateEl || !timeEl || !dateEl.value || !timeEl.value) {
    _scheduleTimeError(''); return true;
  }
  var parts     = dateEl.value.split('-');
  var timeParts = timeEl.value.split(':');
  var selected  = new Date(
    parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
    parseInt(timeParts[0]), parseInt(timeParts[1]), 0
  );
  if (selected < new Date()) {
    _scheduleTimeError('La hora seleccionada ya pasó. Elige una hora futura.');
    return false;
  }
  _scheduleTimeError('');
  return true;
}

async function editAppointment(id) {
  await openScheduleModal();
  var { data: apt } = await db.from('appointments').select('*').eq('id', id).single();
  if (!apt) return;
  // Set editId FIRST so slot population excludes this appointment from booked list
  document.getElementById('scheduleEditId').value = id;
  document.getElementById('scheduleModalTitle').textContent = 'Editar Cita';
  document.getElementById('scheduleSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
  _apptSelectPatient(apt.patient_id || '');
  document.getElementById('scheduleDate').value = apt.date || '';
  document.getElementById('scheduleDate').min = '';
  document.getElementById('scheduleType').value = apt.type || '';
  document.getElementById('scheduleOffice').value = apt.office || '';
  document.getElementById('scheduleNotes').value = apt.notes || '';
  _scheduleTimeError('');
  // Populate slots for the appointment's date, then restore its time
  if (apt.date) {
    await _populateScheduleSlots();
    var timeEl = document.getElementById('scheduleTime');
    var timeVal = apt.time ? apt.time.substring(0,5) : '';
    timeEl.value = timeVal;
    // If slot not found in options (e.g. schedule changed), add it
    if (timeVal && !timeEl.value) {
      var h = parseInt(timeVal.split(':')[0]), m = parseInt(timeVal.split(':')[1]);
      var opt = document.createElement('option');
      opt.value = timeVal;
      opt.textContent = _apptFmt12(h * 60 + m) + ' (fuera de horario)';
      timeEl.appendChild(opt);
      timeEl.value = timeVal;
    }
  }
}

/* ─── PATIENT SEARCH PANEL ─── */
var _apptAllPatients = [];
var _PT_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#6366F1','#0EA5E9','#F97316','#14B8A6'];
function _apptPtColor(id) { return _PT_COLORS[Math.abs(parseInt(String(id).replace(/\D/g,'').slice(-4)||0)) % _PT_COLORS.length]; }
function _apptPtInitials(p) { return ((p.name||'')[0]||'').toUpperCase() + ((p.lastname||'')[0]||'').toUpperCase(); }
function _apptPtFullName(p) { return (p.name||'') + ' ' + (p.lastname||''); }
function _apptPtHighlight(text, q) {
  if (!q) return text;
  var esc = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return text.replace(new RegExp('(' + esc + ')', 'gi'), '<mark style="background:#FEF08A;color:inherit;border-radius:2px;padding:0 1px;">$1</mark>');
}
function _apptPtFilter(q) {
  var t = q.toLowerCase();
  return _apptAllPatients.filter(function(p) {
    var full = _apptPtFullName(p).toLowerCase();
    var ci   = (p.patient_id||'').replace(/\./g,'');
    return full.includes(t) || ci.includes(t.replace(/\./g,''));
  });
}
function _apptPtGetRecent() {
  var ids = JSON.parse(localStorage.getItem('_apptRecentPts') || '[]');
  return ids.map(function(id) { return _apptAllPatients.find(function(p) { return p.id === id; }); }).filter(Boolean);
}
function _apptPtSaveRecent(id) {
  var ids = JSON.parse(localStorage.getItem('_apptRecentPts') || '[]');
  ids = [id].concat(ids.filter(function(x) { return x !== id; })).slice(0,3);
  localStorage.setItem('_apptRecentPts', JSON.stringify(ids));
}
function _apptPtRowHtml(p, q) {
  var col = _apptPtColor(p.id);
  return '<div onclick="_apptSelectPatient(\'' + p.id + '\')" style="display:flex;align-items:center;gap:0.6rem;padding:0.48rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border-color);" onmouseover="this.style.background=\'var(--hover-bg,rgba(0,0,0,.04))\'" onmouseout="this.style.background=\'\'">' +
    '<div style="width:28px;height:28px;border-radius:50%;background:' + col + ';display:flex;align-items:center;justify-content:center;font-size:0.67rem;font-weight:700;color:#fff;flex-shrink:0;">' + _apptPtInitials(p) + '</div>' +
    '<div style="min-width:0;flex:1;">' +
      '<div style="font-size:0.82rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _apptPtHighlight(_apptPtFullName(p), q) + '</div>' +
      '<div style="font-size:0.71rem;color:var(--text-secondary);">' + _apptPtHighlight('C.I. ' + (p.patient_id||'—'), q) + '</div>' +
    '</div>' +
  '</div>';
}
function _apptRenderPtPanel(q) {
  var el = document.getElementById('ptPanelContent');
  if (!el) return;
  var label = '<div style="padding:0.32rem 0.85rem 0.12rem;font-size:0.67rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">';
  if (q) {
    var res = _apptPtFilter(q);
    el.innerHTML = res.length
      ? label + res.length + ' resultado' + (res.length!==1?'s':'') + '</div>' + res.map(function(p){return _apptPtRowHtml(p,q);}).join('')
      : '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">Sin resultados para "<strong>' + q + '</strong>"</div>';
  } else {
    var rec    = _apptPtGetRecent();
    var recIds = rec.map(function(p){return p.id;});
    var rest   = _apptAllPatients.filter(function(p){return !recIds.includes(p.id);});
    var html   = '';
    if (rec.length)  html += label + 'Recientes</div>'             + rec.map(function(p){return _apptPtRowHtml(p,'');}).join('');
    if (rest.length) html += label + 'Todos los pacientes</div>'   + rest.map(function(p){return _apptPtRowHtml(p,'');}).join('');
    if (!html)       html  = '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">No hay pacientes registrados aún</div>';
    el.innerHTML = html;
  }
}
function _apptOpenPtPanel() {
  _apptRenderPtPanel(document.getElementById('ptInput').value.trim());
  document.getElementById('ptPanel').style.display = 'block';
}
function _apptOnPtInput() {
  _apptRenderPtPanel(document.getElementById('ptInput').value.trim());
  document.getElementById('ptPanel').style.display = 'block';
}
function _apptSelectPatient(id) {
  var p = _apptAllPatients.find(function(x){ return String(x.id) === String(id); });
  if (!p) return;
  _apptPtSaveRecent(p.id);
  document.getElementById('schedulePatient').value = p.id;
  document.getElementById('ptTrigger').style.display  = 'none';
  document.getElementById('ptSelected').style.display = 'flex';
  document.getElementById('ptPanel').style.display    = 'none';
  document.getElementById('ptInput').value = '';
  var col = _apptPtColor(p.id);
  document.getElementById('ptSelAv').style.background = col;
  document.getElementById('ptSelAv').textContent      = _apptPtInitials(p);
  document.getElementById('ptSelName').textContent    = _apptPtFullName(p);
  document.getElementById('ptSelMeta').textContent    = 'C.I. ' + (p.patient_id||'—');
}
function _apptClearPatient() {
  document.getElementById('schedulePatient').value    = '';
  document.getElementById('ptTrigger').style.display  = '';
  document.getElementById('ptSelected').style.display = 'none';
  document.getElementById('ptPanel').style.display    = 'none';
  document.getElementById('ptInput').value            = '';
}
/* ─── END PATIENT SEARCH PANEL ─── */

async function openScheduleModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname, patient_id').order('name');
  _apptAllPatients = patients || [];
  _apptClearPatient();

  // Cargar offices
  var { data: offices } = await db.from('offices').select('id, name').order('name');
  var officeSelect = document.getElementById('scheduleOffice');
  officeSelect.innerHTML = '<option value="">Seleccionar consultorio</option>';
  if (offices) offices.forEach(function(o) {
    officeSelect.innerHTML += '<option value="' + o.name + '">' + o.name + '</option>';
  });

  document.getElementById('scheduleForm').reset();
  document.getElementById('scheduleEditId').value = '';
  document.getElementById('scheduleModalTitle').textContent = 'Programar Cita';
  document.getElementById('scheduleSubmitBtn').innerHTML = '<i class="fas fa-calendar-plus"></i> Programar';
  populateScheduleTypeSelect();
  _populateTimeSelect();

  document.getElementById('scheduleDate').min = _todayISO();
  _scheduleTimeError('');


  document.getElementById('scheduleModal').style.display = 'block';
}

function openQuickPatientModal() {
  ['qpName','qpLastname','qpPhone','qpId'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('quickPatientModal').style.display = 'block';
  document.getElementById('qpName').focus();
}

function closeQuickPatientModal() {
  document.getElementById('quickPatientModal').style.display = 'none';
}

async function saveQuickPatient() {
  var name     = (document.getElementById('qpName').value || '').trim();
  var lastname = (document.getElementById('qpLastname').value || '').trim();
  var phone    = (document.getElementById('qpPhone').value || '').trim();
  var patId    = (document.getElementById('qpId').value || '').trim();

  if (!name || !lastname) {
    showToast('error', 'Error', 'Nombre y Apellido son requeridos');
    return;
  }

  var data = { name: name, lastname: lastname, user_id: getUserId() };
  if (phone)  data.phone      = phone;
  if (patId)  data.patient_id = patId;

  var { data: inserted, error } = await db.from('patients').insert(data).select('id, name, lastname').single();
  if (error) {
    showToast('error', 'Error', error.message || 'No se pudo registrar el paciente');
    return;
  }

  // Agregar al listado y seleccionar en el panel de búsqueda
  _apptAllPatients.push(inserted);
  _apptAllPatients.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
  _apptSelectPatient(inserted.id);

  closeQuickPatientModal();
  showToast('success', 'Registrado', name + ' ' + lastname + ' agregado correctamente');
}

function closeScheduleModal() {
  document.getElementById('scheduleModal').style.display = 'none';
  var typesModal = document.getElementById('manageTypesModal');
  if (typesModal) typesModal.style.display = 'none';
}

async function cancelAppointment(id) {
  showConfirm('Cancelar Cita', '¿Desea cancelar esta cita?', async function() {
    var { error } = await db.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      var errorMsg = error.message || 'Error al cancelar la cita';
      showToast('error', 'Error', errorMsg);
      return;
    }
    if (typeof publishCalendar === 'function') publishCalendar();
    loadAppointments();
    showToast('success', 'Cancelada', 'Cita cancelada');
    _sendAppointmentNotification('cancelled', id);
  });
}

// ── Notificaciones WhatsApp ───────────────────────────────────────────────────

function _fmtDateWA(d) {
  if (!d) return '-';
  var p = d.split('-');
  var m = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return parseInt(p[2]) + ' de ' + m[parseInt(p[1]) - 1] + ' de ' + p[0];
}

function _fmtTimeWA(t) {
  if (!t) return '-';
  var hm = t.substring(0, 5).split(':');
  var h = parseInt(hm[0]);
  return (h % 12 || 12) + ':' + hm[1] + ' ' + (h < 12 ? 'AM' : 'PM');
}

async function _sendAppointmentNotification(eventType, aptId, oldDate, oldTime) {
  try {
    console.log('[WA] sendNotification called:', eventType, aptId);
    var { data: apt, error: aptErr } = await db.from('appointments')
      .select('date, time, office, status, patients(name, lastname, phone)')
      .eq('id', aptId).single();
    console.log('[WA] apt:', JSON.stringify(apt), 'err:', JSON.stringify(aptErr));
    if (!apt) return;

    var patient = apt.patients || {};
    var phone = patient.phone;
    console.log('[WA] phone:', phone);
    if (!phone) return;

    var uid = getUserId();
    var doctorName = 'tu médico';
    var officeName = 'el consultorio';

    var results = await Promise.all([
      db.from('doctors').select('first_name, last_name, specialty').eq('user_id', uid).single(),
      apt.office ? db.from('offices').select('name').eq('id', apt.office).single() : Promise.resolve({ data: null })
    ]);
    var doctor = results[0].data;
    var office = results[1].data;

    if (doctor) doctorName = 'Dr. ' + (doctor.first_name || '') + ' ' + (doctor.last_name || '');
    if (office) officeName = office.name;

    var patientName = ((patient.name || '') + ' ' + (patient.lastname || '')).trim();
    var saludo = patientName ? 'Hola *' + patientName + '*! ' : '';
    var msg = '';

    if (eventType === 'created') {
      msg = '🏥 *Nueva cita programada*\n\n' + saludo + 'Tu cita ha sido programada:\n\n' +
        '📅 Fecha: ' + _fmtDateWA(apt.date) + '\n' +
        '🕘 Hora: ' + _fmtTimeWA(apt.time) + '\n' +
        '👨‍⚕️ Doctor: ' + doctorName + '\n' +
        '🏢 Consultorio: ' + officeName + '\n' +
        '📌 Estado: Programada';
    } else if (eventType === 'cancelled') {
      msg = '⚠️ *Cita cancelada*\n\n' + saludo +
        'Tu cita del *' + _fmtDateWA(apt.date) + '* a las *' + _fmtTimeWA(apt.time) + '* con ' + doctorName + ' ha sido *cancelada*.\n\n' +
        'Por favor contacta a tu doctor para reprogramar. 📞';
    } else if (eventType === 'rescheduled') {
      msg = '🔄 *Cita reprogramada*\n\n' + saludo + 'Tu cita ha sido actualizada:\n\n' +
        '📅 Nueva fecha: ' + _fmtDateWA(apt.date) + '\n' +
        '🕘 Nueva hora: ' + _fmtTimeWA(apt.time) + '\n' +
        '👨‍⚕️ Doctor: ' + doctorName + '\n' +
        '🏢 Consultorio: ' + officeName;
      if (oldDate || oldTime) {
        msg += '\n\n_Fecha anterior: ' + _fmtDateWA(oldDate) + ' ' + _fmtTimeWA(oldTime) + '_';
      }
    }

    console.log('[WA] msg:', msg ? 'ok' : 'empty', '| eventType:', eventType);
    if (!msg) return;
    console.log('[WA] calling wa-notify for phone:', phone);
    var invokeResult = await db.functions.invoke('wa-notify', { body: { phone: phone, message: msg } });
    console.log('[WA] invoke result:', JSON.stringify(invokeResult));
  } catch (e) {
    console.warn('[WA] notification error:', e);
  }
}

async function openConsultation(id) {
  var { data: apt } = await db.from('appointments').select('*, patients(name, lastname, patient_id, phone)').eq('id', id).single();
  if (!apt) return;
  var patient = apt.patients || {};
  document.getElementById('consultViewPatientName').textContent = (patient.name || '') + ' ' + (patient.lastname || '');
  document.getElementById('consultViewPatientDetails').textContent = 'ID: ' + (patient.patient_id || '') + ' | Tel: ' + (patient.phone || 'N/A');
  document.getElementById('consultViewAppointmentKey').value = id;
  if (apt.consultation_template) document.getElementById('consultViewTemplate').value = apt.consultation_template;
  showView('consultation');
}

function closeConsultationView() { showView('appointments'); }

async function saveConsultation() {
  var appointmentId = document.getElementById('consultViewAppointmentKey').value;
  var consultationData = {
    appointment_id: appointmentId,
    symptoms: document.getElementById('cvSymptoms').value,
    blood_pressure: document.getElementById('cvPA').value,
    heart_rate: document.getElementById('cvFC').value,
    temperature: document.getElementById('cvTemp').value,
    weight: document.getElementById('cvPeso').value,
    physical_exam: document.getElementById('cvExamFisico').value,
    diagnosis: document.getElementById('cvDiagnostico').value,
    secondary_diagnosis: document.getElementById('cvDiagSecundario').value,
    treatment: document.getElementById('cvTratamiento').value,
    follow_up: document.getElementById('cvSeguimiento').value,
    template_type: document.getElementById('consultViewTemplate').value
  };

  // Get patient_id from appointment
  var { data: apt } = await db.from('appointments').select('patient_id').eq('id', appointmentId).single();
  if (apt) consultationData.patient_id = apt.patient_id;

  var _uid = getUserId();
  if (_uid) consultationData.user_id = _uid;

  // Include pending attachments
  if (window.pendingConsultationAttachments && window.pendingConsultationAttachments.length > 0) {
    consultationData.attachments = window.pendingConsultationAttachments;
  }

  var { error } = await db.from('consultations').insert(consultationData);
  if (error) { 
    var errorMsg = error.message || 'Error al guardar la consulta';
    showToast('error', 'Error', errorMsg); 
    return; 
  }

  // Clear pending attachments
  window.pendingConsultationAttachments = [];

  // Mark appointment as completed
  await db.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);

  showToast('success', 'Guardada', 'Consulta registrada correctamente');
  showView('appointments');
}

function changeConsultationTemplate(template) { /* Template logic */ }
function refreshAppointments() { loadAppointments(); }
function filterAppointments() {
  var status = document.getElementById('appointmentStatusFilter') ? document.getElementById('appointmentStatusFilter').value : '';
  var rows = document.querySelectorAll('#appointmentsTableBody tr');
  rows.forEach(function(row) {
    if (!status) { row.style.display = ''; return; }
    row.style.display = row.textContent.toLowerCase().includes(status.toLowerCase()) ? '' : 'none';
  });
}
function searchAppointments() {
  var query = document.getElementById('appointmentSearchField').value.toLowerCase();
  var rows = document.querySelectorAll('#appointmentsTableBody tr');
  rows.forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

// Close patient panel when clicking outside
document.addEventListener('click', function(e) {
  var wrap = document.getElementById('ptSearchWrap');
  var panel = document.getElementById('ptPanel');
  if (wrap && panel && !wrap.contains(e.target)) panel.style.display = 'none';
});

// Schedule form submission
document.addEventListener('DOMContentLoaded', function() {
  populateScheduleTypeSelect();

  var newTypeInput = document.getElementById('newTypeLabel');
  if (newTypeInput) {
    newTypeInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); addConsultationType(); } });
  }

  var scheduleForm = document.getElementById('scheduleForm');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      var editId  = document.getElementById('scheduleEditId').value;
      var dateVal = document.getElementById('scheduleDate').value;
      var timeVal = document.getElementById('scheduleTime').value;

      // Validar hora pasada solo para citas nuevas
      if (!editId && !_validateScheduleTime()) {
        showToast('error', 'Hora inválida', 'La hora seleccionada ya pasó. Elige una hora futura.');
        return;
      }

      if (!document.getElementById('schedulePatient').value) {
        showToast('error', 'Error', 'Selecciona un paciente antes de programar la cita');
        return;
      }

      var appointmentData = {
        patient_id: document.getElementById('schedulePatient').value,
        date: dateVal,
        time: timeVal,
        type: document.getElementById('scheduleType').value,
        office: document.getElementById('scheduleOffice').value,
        notes: document.getElementById('scheduleNotes').value
      };

      var error;
      if (editId) {
        var oldApt = null;
        var { data: oldFetch } = await db.from('appointments').select('date, time').eq('id', editId).single();
        oldApt = oldFetch;
        ({ error } = await db.from('appointments').update(appointmentData).eq('id', editId));
        if (error) { showToast('error', 'Error', error.message); return; }
        closeScheduleModal();
        loadAppointments();
        if (typeof publishCalendar === 'function') publishCalendar();
        showToast('success', 'Actualizada', 'Cita actualizada correctamente');
        console.log('[WA] oldApt:', JSON.stringify(oldApt), '| newDate:', dateVal, '| newTime:', timeVal);
        if (oldApt && (oldApt.date !== dateVal || oldApt.time !== timeVal)) {
          _sendAppointmentNotification('rescheduled', editId, oldApt.date, oldApt.time);
        }
      } else {
        appointmentData.status = 'scheduled';
        var inserted;
        ({ data: inserted, error } = await db.from('appointments').insert(appointmentData).select('*, patients(name, lastname)'));
        if (error) {
          var errorMsg = 'Error al programar la cita';
          if (error.code === '23505' || error.message.includes('duplicate')) errorMsg = 'Ya existe una cita en esa fecha y hora';
          else if (error.message) errorMsg = error.message;
          showToast('error', 'Error', errorMsg);
          return;
        }
        closeScheduleModal();
        loadAppointments();
        showToast('success', 'Programada', 'Cita creada correctamente');
        if (inserted && inserted[0]) {
          _sendAppointmentNotification('created', inserted[0].id);
          if (typeof syncAppointmentToCalendar === 'function') {
            var newApt = inserted[0];
            var p = newApt.patients || {};
            syncAppointmentToCalendar(newApt, (p.name || '') + ' ' + (p.lastname || ''));
          }
        }
      }
    });
  }
});
