// ===== PACIENTES (Supabase) =====

function _initBirthDateSelects() {
  var dayEl  = document.getElementById('patientBirthDay');
  var yearEl = document.getElementById('patientBirthYear');
  if (!dayEl || !yearEl) return;
  if (dayEl.options.length > 1) return; // ya inicializado
  for (var d = 1; d <= 31; d++) {
    var o = document.createElement('option');
    o.value = String(d).padStart(2, '0');
    o.textContent = d;
    dayEl.appendChild(o);
  }
  var currentYear = new Date().getFullYear();
  for (var y = currentYear; y >= 1920; y--) {
    var o2 = document.createElement('option');
    o2.value = y;
    o2.textContent = y;
    yearEl.appendChild(o2);
  }
}

function _getBirthDate() {
  var y = document.getElementById('patientBirthYear').value;
  var m = document.getElementById('patientBirthMonth').value;
  var d = document.getElementById('patientBirthDay').value;
  return (y && m && d) ? y + '-' + m + '-' + d : null;
}

function _setBirthDate(dateStr) {
  var y = document.getElementById('patientBirthYear');
  var m = document.getElementById('patientBirthMonth');
  var d = document.getElementById('patientBirthDay');
  if (!dateStr) { if(y) y.value=''; if(m) m.value=''; if(d) d.value=''; return; }
  var parts = dateStr.split('-');
  if (y) y.value = parts[0] || '';
  if (m) m.value = parts[1] || '';
  if (d) d.value = parts[2] || '';
}

async function loadAllPatients() {
  var tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>';

  var { data: patients, error } = await db.from('patients').select('*').order('created_at', { ascending: false });
  if (error) { return; }

  tbody.innerHTML = '';
  if (document.getElementById('totalPatients')) document.getElementById('totalPatients').textContent = patients.length;

  patients.forEach(function(patient) {
    var age = patient.birth_date ? Math.floor((new Date() - new Date(patient.birth_date)) / 31557600000) : 'N/A';
    var row = '<tr>' +
      '<td>' + patient.name + ' ' + patient.lastname + '</td>' +
      '<td>' + (patient.patient_id || '') + '</td>' +
      '<td>' + age + '</td>' +
      '<td>' + (patient.phone || 'N/A') + '</td>' +
      '<td>-</td><td>-</td>' +
      '<td><span class="badge badge-success">Activo</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-info" onclick="viewPatientDetail(\'' + patient.id + '\')"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm btn-primary" onclick="editPatient(\'' + patient.id + '\')"><i class="fas fa-edit"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
}

function openNewPatientModal() {
  document.getElementById('patientModalTitle').textContent = 'Nuevo Paciente';
  document.getElementById('patientForm').reset();
  document.getElementById('editPatientId').value = '';
  _initBirthDateSelects();
  _setBirthDate(null);
  var err = document.getElementById('cedulaError');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  window.pendingPatientAttachments = [];
  var container = document.getElementById('patientAttachmentsContainer');
  if (container) container.innerHTML = '';
  document.getElementById('patientModal').style.display = 'block';
}

function closePatientModal() { document.getElementById('patientModal').style.display = 'none'; }

async function editPatient(patientId) {
  var { data: patient, error } = await db.from('patients').select('*').eq('id', patientId).single();
  if (error || !patient) return;
  document.getElementById('patientModalTitle').textContent = 'Editar Paciente';
  document.getElementById('editPatientId').value = patientId;
  document.getElementById('patientName').value = patient.name || '';
  document.getElementById('patientLastname').value = patient.lastname || '';
  document.getElementById('patientIdInput').value = patient.patient_id || '';
  _initBirthDateSelects();
  _setBirthDate(patient.birth_date || null);
  document.getElementById('patientGender').value = patient.gender || '';
  document.getElementById('patientPhone').value = patient.phone || '';
  document.getElementById('patientEmail').value = patient.email || '';
  document.getElementById('patientAddress').value = patient.address || '';
  document.getElementById('patientAllergies').value = patient.allergies || '';
  document.getElementById('patientMedications').value = patient.medications || '';
  document.getElementById('patientMedicalHistory').value = patient.medical_history || '';
  var err = document.getElementById('cedulaError');
  if (err) { err.textContent = ''; err.style.display = 'none'; }
  document.getElementById('patientModal').style.display = 'block';

  // Cargar documentos del paciente
  setTimeout(function() {
    displayPatientAttachments(patientId, 'patientAttachmentsContainer');
  }, 100);
}


function searchAllPatients() {
  var query = document.getElementById('patientSearchField').value.toLowerCase();
  var rows = document.querySelectorAll('#patientsTableBody tr');
  rows.forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

function filterPatients() {
  var status = document.getElementById('patientStatusFilter').value;
  var rows = document.querySelectorAll('#patientsTableBody tr');
  rows.forEach(function(row) {
    if (!status) { row.style.display = ''; return; }
    var badge = row.querySelector('.badge');
    if (!badge) { row.style.display = ''; return; }
    var rowStatus = badge.textContent.toLowerCase();
    row.style.display = (status === 'active' && rowStatus === 'activo') || (status === 'inactive' && rowStatus === 'inactivo') ? '' : 'none';
  });
}
function refreshPatients() { loadAllPatients(); }

// ===== PATIENT DETAIL VIEW =====

var currentDetailPatientId = null;

async function viewPatientDetail(patientId) {
  currentDetailPatientId = patientId;
  var { data: patient } = await db.from('patients').select('*').eq('id', patientId).single();
  if (!patient) return;
  
  // Hide list section, show detail
  document.getElementById('patientsListSection').style.display = 'none';
  document.getElementById('patientsTableBody').parentElement.parentElement.style.display = 'none';
  document.getElementById('patientDetailView').style.display = 'block';
  
  // Populate info
  document.getElementById('detailPatientName').textContent = patient.name + ' ' + patient.lastname;
  document.getElementById('detailPatientId').textContent = patient.patient_id || '-';
  document.getElementById('detailPatientPhone').textContent = patient.phone || '-';
  document.getElementById('detailPatientEmail').textContent = patient.email || '-';
  document.getElementById('detailPatientAddress').textContent = patient.address || '-';
  document.getElementById('detailPatientBloodType').textContent = patient.blood_type || '-';
  
  // Load documents
  displayPatientAttachments(patientId, 'detailPatientDocuments');
  
  // Load stats
  var { data: citas } = await db.from('appointments').select('id').eq('patient_id', patientId);
  document.getElementById('detailCitasCount').textContent = citas ? citas.length : 0;
  
  // Load consultations
  var { data: consultasFull } = await db.from('consultations').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  document.getElementById('detailConsultasCount').textContent = consultasFull ? consultasFull.length : 0;
  
  if (consultasFull && consultasFull.length > 0) {
    var html = '';
    
    // Also collect consultation attachments to show in documents section
    var consultationDocs = [];
    
    consultasFull.forEach(function(cons) {
      var date = new Date(cons.created_at).toLocaleDateString('es-ES');
      html += '<div style="background: rgba(255,255,255,0.98); padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer;" onclick="viewConsultationDetail(\'' + cons.id + '\')">' +
        '<p style="margin: 0 0 0.5rem 0; font-weight: 600;">' + date + '</p>' +
        '<p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;"><strong>Diagnóstico:</strong> ' + (cons.diagnosis || 'N/A') + '</p>';
      
      // Show attachments inline
      if (cons.attachments && cons.attachments.length > 0) {
        html += '<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">';
        html += '<p style="margin: 0 0 0.25rem 0; font-size: 0.8rem; color: var(--text-muted);"><i class="fas fa-paperclip"></i> Adjuntos:</p>';
        cons.attachments.forEach(function(att) {
          html += '<a href="#" onclick="downloadPatientDoc(\'' + att.filePath + '\', \'' + att.fileName.replace(/'/g, "\\'") + '\'); return false;" style="font-size: 0.85rem; color: var(--accent-color); margin-right: 1rem;">' + getFileIconByName(att.fileName) + ' ' + att.fileName + '</a>';
          
          // Add to consultation docs list
          consultationDocs.push(att);
        });
        html += '</div>';
      }
      
      html += '</div>';
    });
    document.getElementById('detailConsultationsHistory').innerHTML = html;
    
    // Append consultation docs to the documents section
    if (consultationDocs.length > 0) {
      var docsContainer = document.getElementById('detailPatientDocuments');
      var currentHTML = docsContainer.innerHTML;
      
      // Add separator if patient has own docs
      if (currentHTML && !currentHTML.includes('Sin documentos')) {
        currentHTML += '<hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-color);">';
      } else {
        currentHTML = '';
      }
      
      currentHTML += '<p style="margin: 0 0 0.5rem 0; font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">De consultas:</p>';
      consultationDocs.forEach(function(att) {
        var icon = getFileIconByName(att.fileName);
        var date = new Date(att.uploadedAt).toLocaleDateString('es-ES');
        currentHTML += '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: rgba(139,159,217,0.05); border-radius: 6px; margin-bottom: 0.5rem;">' +
          '<span style="font-size: 1rem; color: var(--accent-color);">' + icon + '</span>' +
          '<div style="flex: 1; min-width: 0;">' +
            '<p style="margin: 0; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + att.fileName + '</p>' +
            '<p style="margin: 0; font-size: 0.7rem; color: var(--text-muted);">' + date + ' (consulta)</p>' +
          '</div>' +
          '<button onclick="downloadPatientDoc(\'' + att.filePath + '\', \'' + att.fileName.replace(/'/g, "\\'") + '\')" style="background: var(--accent-color); color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer;"><i class="fas fa-download"></i></button>' +
          '</div>';
      });
      docsContainer.innerHTML = currentHTML;
    }
  } else {
    document.getElementById('detailConsultationsHistory').innerHTML = '<p style="color: var(--text-secondary);">Sin consultas registradas</p>';
  }
}

function backToPatientsList() {
  document.getElementById('patientsListSection').style.display = '';
  document.getElementById('patientsTableBody').parentElement.parentElement.style.display = '';
  document.getElementById('patientDetailView').style.display = 'none';
  currentDetailPatientId = null;
}

function editPatientFromDetail() {
  if (currentDetailPatientId) {
    editPatient(currentDetailPatientId);
  }
}

async function viewConsultationDetail(consultationId) {
  var { data: cons } = await db.from('consultations').select('*').eq('id', consultationId).single();
  if (!cons) return;
  
  var date = new Date(cons.created_at).toLocaleDateString('es-ES');
  var attachments = cons.attachments || [];
  
  var html = '<div style="padding: 1.5rem;">' +
    '<h3 style="margin: 0 0 1.5rem 0;">Consulta del ' + date + '</h3>' +
    '<div style="display: grid; gap: 1rem;">';
  
  if (cons.symptoms) html += '<div><strong>Motivo:</strong> ' + cons.symptoms + '</div>';
  if (cons.blood_pressure) html += '<div><strong>PA:</strong> ' + cons.blood_pressure + '</div>';
  if (cons.heart_rate) html += '<div><strong>FC:</strong> ' + cons.heart_rate + '</div>';
  if (cons.temperature) html += '<div><strong>Temp:</strong> ' + cons.temperature + '</div>';
  if (cons.weight) html += '<div><strong>Peso:</strong> ' + cons.weight + '</div>';
  if (cons.physical_exam) html += '<div><strong>Examen Físico:</strong> ' + cons.physical_exam + '</div>';
  if (cons.diagnosis) html += '<div><strong>Diagnóstico:</strong> ' + cons.diagnosis + '</div>';
  if (cons.secondary_diagnosis) html += '<div><strong>Diagnóstico Sec.:</strong> ' + cons.secondary_diagnosis + '</div>';
  if (cons.treatment) html += '<div><strong>Tratamiento:</strong> ' + cons.treatment + '</div>';
  if (cons.follow_up) html += '<div><strong>Seguimiento:</strong> ' + cons.follow_up + '</div>';
  
  html += '</div>';
  
  // Attachments
  if (attachments.length > 0) {
    html += '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">' +
      '<h4><i class="fas fa-paperclip"></i> Adjuntos</h4>';
    attachments.forEach(function(att) {
      html += '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 0.5rem;">' +
        '<span style="color: var(--accent-color);">' + getFileIconByName(att.fileName) + '</span>' +
        '<a href="#" onclick="downloadPatientDoc(\'' + att.filePath + '\', \'' + att.fileName.replace(/'/g, "\\'") + '\'); return false;" style="flex: 1; color: var(--accent-color); text-decoration: none;">' + att.fileName + '</a>' +
        '</div>';
    });
    html += '</div>';
  }
  
  html += '<button class="btn btn-secondary" onclick="document.getElementById(\'consultationDetailModal\').style.display=\'none\'" style="margin-top: 1.5rem;">Cerrar</button></div>';
  
  // Show in modal
  var modal = document.getElementById('consultationDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'consultationDetailModal';
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content" style="max-width: 600px;">' + html + '</div>';
    document.body.appendChild(modal);
  } else {
    modal.innerHTML = '<div class="modal-content" style="max-width: 600px;">' + html + '</div>';
  }
  modal.style.display = 'block';
  modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
}

// Patient form submission
document.addEventListener('DOMContentLoaded', function() {
  var cedulaField = document.getElementById('patientIdInput');
  if (cedulaField) {
    cedulaField.addEventListener('input', function() {
      var err = document.getElementById('cedulaError');
      if (err) { err.textContent = ''; err.style.display = 'none'; }
    });
  }

  var patientForm = document.getElementById('patientForm');
  if (patientForm) {
    patientForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('editPatientId').value;
      var cedulaInput = document.getElementById('patientIdInput').value;
      
      var cedulaErrorEl = document.getElementById('cedulaError');
      function setCedulaError(msg) {
        if (cedulaErrorEl) { cedulaErrorEl.textContent = msg; cedulaErrorEl.style.display = msg ? 'block' : 'none'; }
      }
      setCedulaError('');

      // Validar que cédula solo contenga números
      if (cedulaInput && !/^\d+$/.test(cedulaInput)) {
        setCedulaError('La cédula solo puede contener números');
        showToast('error', 'Error', 'La cédula solo puede contener números');
        document.getElementById('patientIdInput').focus();
        return;
      }

      var patientData = {
        name: document.getElementById('patientName').value,
        lastname: document.getElementById('patientLastname').value,
        patient_id: cedulaInput,
        birth_date: _getBirthDate(),
        gender: document.getElementById('patientGender').value,
        blood_type: document.getElementById('patientBloodType').value,
        phone: document.getElementById('patientPhone').value,
        email: document.getElementById('patientEmail').value,
        address: document.getElementById('patientAddress').value,
        allergies: document.getElementById('patientAllergies').value,
        medications: document.getElementById('patientMedications').value,
        medical_history: document.getElementById('patientMedicalHistory').value
      };

      // Verificar duplicado antes de insertar
      if (!editId && cedulaInput) {
        var userId = getUserId();
        var { data: existing } = await db.from('patients').select('id').eq('user_id', userId).eq('patient_id', cedulaInput);
        if (existing && existing.length > 0) {
          setCedulaError('Ya existe un paciente registrado con esta cédula');
          showToast('error', 'Error', 'Ya existe un paciente con la cédula ' + cedulaInput);
          document.getElementById('patientIdInput').focus();
          return;
        }
      }

      var error, newPatientId = null;
      if (editId) {
        ({ error } = await db.from('patients').update(patientData).eq('id', editId));
      } else {
        patientData.user_id = getUserId();
        var result = await db.from('patients').insert(patientData).select();
        error = result.error;
        if (!error && result.data && result.data[0]) newPatientId = result.data[0].id;
      }

      if (error) {
        var errorMsg = 'Error al guardar el paciente';
        var isCedulaDuplicate = error.code === '23505' || (error.message && (error.message.includes('duplicate') || error.message.includes('unique')));
        if (isCedulaDuplicate) {
          errorMsg = 'Ya existe un paciente registrado con esta cédula.';
          setCedulaError('Ya existe un paciente registrado con esta cédula');
          document.getElementById('patientIdInput').focus();
        } else if (error.message) {
          errorMsg = error.message;
        }
        showToast('error', 'Error', errorMsg);
        return;
      }

      // Subir archivos encolados al crear un paciente nuevo
      var pending = window.pendingPatientAttachments || [];
      if (newPatientId && pending.length > 0) {
        var userId = getUserId();
        var uploadedAtts = [];
        for (var j = 0; j < pending.length; j++) {
          var item = pending[j];
          var safeName = (Date.now() + j) + '_' + item.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          var filePath = userId + '/patients/' + newPatientId + '/' + safeName;
          var { error: upErr } = await db.storage.from('patient_documents').upload(filePath, item.file);
          if (!upErr) {
            uploadedAtts.push({ id: Date.now() + j, fileName: item.fileName, filePath: filePath, fileType: item.fileType, fileSize: item.fileSize, uploadedAt: new Date().toISOString() });
          }
        }
        if (uploadedAtts.length > 0) {
          await db.from('patients').update({ attachments: uploadedAtts }).eq('id', newPatientId);
        }
        window.pendingPatientAttachments = [];
      }

      closePatientModal();
      loadAllPatients();
      showToast('success', 'Guardado', editId ? 'Paciente actualizado' : 'Paciente creado');
    });
  }
});


// ===== HISTORIAS MÉDICAS =====

var _allMedicalRecords = [];
var _medicalPatientsMap = {};

async function loadAllMedicalRecords() {
  var container = document.getElementById('medicalRecordsContent');
  if (!container) return;

  _allMedicalRecords = [];
  _medicalPatientsMap = {};
  container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">Cargando historias médicas...</p>';

  try {
    // Paso 1: traer pacientes
    var pResult = await db.from('patients').select('*').order('created_at', { ascending: false });

    if (pResult.error) {
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--danger-color);">Error pacientes: ' + pResult.error.message + '</p>';
      return;
    }

    var patients = pResult.data || [];

    if (patients.length === 0) {
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">No hay pacientes registrados en el sistema.</p>';
      return;
    }

    // Paso 2: traer TODAS las consultas de la tabla sin filtro
    // (RLS se encarga de devolver solo las del usuario actual)
    var cResult = await db
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });

    if (cResult.error) {
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--danger-color);">Error consultas: ' + cResult.error.message + '</p>';
      return;
    }

    var consultations = cResult.data || [];

    // Si no hay consultas, intentar filtrar por patient_id explícitamente
    if (consultations.length === 0) {
      var pMap2 = {};
      patients.forEach(function(p) { pMap2[p.id] = p; _medicalPatientsMap[p.id] = p; });
      var all2 = [];
      for (var k = 0; k < patients.length; k++) {
        var cr = await db.from('consultations').select('*').eq('patient_id', patients[k].id);
        if (cr.data && cr.data.length) {
          cr.data.forEach(function(c) { c._patient = pMap2[c.patient_id] || null; all2.push(c); });
        }
      }
      if (all2.length === 0) {
        container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">Hay ' + patients.length + ' paciente(s) pero no se encontraron consultas registradas.</p>';
        return;
      }
      all2.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      _allMedicalRecords = all2;
      renderMedicalRecordsList(_allMedicalRecords);
      return;
    }

    // Unir consultas con datos de pacientes
    var pMap = {};
    patients.forEach(function(p) {
      pMap[p.id] = p;
      _medicalPatientsMap[p.id] = p;
    });
    consultations.forEach(function(c) { c._patient = pMap[c.patient_id] || null; });

    _allMedicalRecords = consultations;

    var searchEl = document.getElementById('medicalRecordsSearch');
    if (searchEl && searchEl.value.trim()) {
      _filterAndRender(searchEl.value);
    } else {
      renderMedicalRecordsList(_allMedicalRecords);
    }

  } catch (err) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--danger-color);">Error inesperado: ' + (err.message || String(err)) + '</p>';
  }
}

function renderMedicalRecordsList(records) {
  var container = document.getElementById('medicalRecordsContent');
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">No hay historias médicas registradas.</p>';
    return;
  }

  var html = '<div style="display:grid;gap:0.65rem;">';
  for (var i = 0; i < records.length; i++) {
    var cons = records[i];
    var p = cons._patient || {};
    var name = ((p.name || '') + ' ' + (p.lastname || '')).trim() || 'Paciente desconocido';
    var cedula = p.patient_id ? ' &middot; ' + p.patient_id : '';
    var date = new Date(cons.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    var dx = (cons.diagnosis || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '&mdash;';
    var motivo = (cons.symptoms || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    html += '<div class="stat-card" onclick="viewConsultationDetail(\'' + cons.id + '\')" style="cursor:pointer;flex-direction:row;align-items:center;gap:1rem;padding:0.875rem 1rem;">' +
      '<div style="min-width:42px;height:42px;background:var(--accent-gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fas fa-file-medical" style="color:white;font-size:1rem;"></i>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;">' +
          '<strong style="font-size:0.95rem;">' + name + '<span style="font-weight:400;color:var(--text-secondary);font-size:0.82rem;">' + cedula + '</span></strong>' +
          '<span style="font-size:0.78rem;color:var(--text-secondary);white-space:nowrap;">' + date + '</span>' +
        '</div>' +
        '<p style="margin:0.25rem 0 0 0;font-size:0.85rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          '<strong style="color:var(--text-primary);">Dx:</strong> ' + dx +
          (motivo ? ' &nbsp;&middot;&nbsp; <strong style="color:var(--text-primary);">Motivo:</strong> ' + motivo : '') +
        '</p>' +
      '</div>' +
    '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function _filterAndRender(query) {
  var q = (query || '').toLowerCase().trim();
  if (!q) { renderMedicalRecordsList(_allMedicalRecords); return; }
  var filtered = [];
  for (var i = 0; i < _allMedicalRecords.length; i++) {
    var c = _allMedicalRecords[i];
    var p = c._patient || _medicalPatientsMap[c.patient_id] || {};
    var haystack = [
      p.name || '', p.lastname || '', p.patient_id || '',
      c.diagnosis || '', c.secondary_diagnosis || '',
      c.symptoms || '', c.treatment || '',
      c.physical_exam || '', c.follow_up || ''
    ].join(' ').toLowerCase();
    if (haystack.indexOf(q) !== -1) filtered.push(c);
  }
  if (filtered.length === 0 && _allMedicalRecords.length > 0) {
    var container = document.getElementById('medicalRecordsContent');
    if (container) container.innerHTML = '<p style="padding:2rem;text-align:center;color:var(--text-secondary);">Sin resultados para "<strong>' + query + '</strong>".</p>';
    return;
  }
  renderMedicalRecordsList(filtered);
}

function searchMedicalRecords() {
  var input = document.getElementById('medicalRecordsSearch');
  _filterAndRender(input ? input.value : '');
}
