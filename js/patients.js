// ===== PACIENTES (Supabase) =====

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
        '<button class="btn btn-sm btn-danger" onclick="deletePatient(\'' + patient.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
}

function openNewPatientModal() {
  document.getElementById('patientModalTitle').textContent = 'Nuevo Paciente';
  document.getElementById('patientForm').reset();
  document.getElementById('editPatientId').value = '';
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
  document.getElementById('patientBirthDate').value = patient.birth_date || '';
  document.getElementById('patientGender').value = patient.gender || '';
  document.getElementById('patientPhone').value = patient.phone || '';
  document.getElementById('patientEmail').value = patient.email || '';
  document.getElementById('patientAddress').value = patient.address || '';
  document.getElementById('patientAllergies').value = patient.allergies || '';
  document.getElementById('patientMedications').value = patient.medications || '';
  document.getElementById('patientMedicalHistory').value = patient.medical_history || '';
  document.getElementById('patientModal').style.display = 'block';
  
  // Cargar documentos del paciente
  setTimeout(function() {
    displayPatientAttachments(patientId, 'patientAttachmentsContainer');
  }, 100);
}

async function deletePatient(patientId) {
  showConfirm('Eliminar Paciente', 'Esta acción no se puede deshacer.', async function() {
    var { error } = await db.from('patients').delete().eq('id', patientId);
    if (error) { 
      var errorMsg = error.message || 'No se pudo eliminar';
      showToast('error', 'Error', errorMsg); 
      return; 
    }
    loadAllPatients();
    showToast('success', 'Eliminado', 'Paciente eliminado correctamente');
  });
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
  
  // Hide list, show detail
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
  var patientForm = document.getElementById('patientForm');
  if (patientForm) {
    patientForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('editPatientId').value;
      var patientData = {
        name: document.getElementById('patientName').value,
        lastname: document.getElementById('patientLastname').value,
        patient_id: document.getElementById('patientIdInput').value,
        birth_date: document.getElementById('patientBirthDate').value || null,
        gender: document.getElementById('patientGender').value,
        blood_type: document.getElementById('patientBloodType').value,
        phone: document.getElementById('patientPhone').value,
        email: document.getElementById('patientEmail').value,
        address: document.getElementById('patientAddress').value,
        allergies: document.getElementById('patientAllergies').value,
        medications: document.getElementById('patientMedications').value,
        medical_history: document.getElementById('patientMedicalHistory').value
      };

      var error;
      if (editId) {
        ({ error } = await db.from('patients').update(patientData).eq('id', editId));
      } else {
        patientData.user_id = getUserId();
        var result = await db.from('patients').insert(patientData);
        error = result.error;
      }

      if (error) {
        var errorMsg = 'Error al guardar el paciente';
        
        // Manejo de errores específicos - comprueba múltiples propiedades
        if (error.code === '23505' || error.status === 409) {
          errorMsg = 'Ya existe un paciente con esa cédula/ID. Por favor usa una diferente.';
        } else if (error.message) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            errorMsg = 'Ya existe un paciente con esa cédula/ID. Por favor usa una diferente.';
          } else if (error.message.includes('not-jwt-token')) {
            errorMsg = 'Sesión expirada. Por favor inicia sesión de nuevo.';
          } else if (error.message.includes('invalid')) {
            errorMsg = 'Datos inválidos. Por favor verifica los campos.';
          } else {
            errorMsg = error.message;
          }
        }
        
        showToast('error', 'Error', errorMsg);
        return;
      }
      closePatientModal();
      loadAllPatients();
      showToast('success', 'Guardado', editId ? 'Paciente actualizado' : 'Paciente creado');
    });
  }
});


// ===== HISTORIAS MÉDICAS CON DOCUMENTOS =====
async function searchMedicalRecords() {
  var query = document.getElementById('medicalRecordsSearch').value.toLowerCase();
  if (!query) {
    document.getElementById('medicalRecordsContent').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">Seleccione un paciente para ver su historial médico.</p>';
    document.getElementById('patientDocumentsSection').style.display = 'none';
    return;
  }

  var { data: patients } = await db.from('patients').select('*').order('name');
  if (!patients) return;

  var filtered = patients.filter(function(p) {
    return (p.name + ' ' + p.lastname).toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    document.getElementById('medicalRecordsContent').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--text-secondary);">No se encontraron pacientes.</p>';
    document.getElementById('patientDocumentsSection').style.display = 'none';
    return;
  }

  var html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">';
  filtered.forEach(function(patient) {
    html += '<div class="stat-card" style="cursor: pointer; transition: all 0.3s ease;" onclick="viewPatientMedicalRecords(\'' + patient.id + '\', \'' + patient.name + ' ' + patient.lastname + '\');">' +
      '<div class="profile-avatar"><i class="fas fa-user-circle"></i></div>' +
      '<div><h4 style="margin: 0.5rem 0;">' + patient.name + ' ' + patient.lastname + '</h4>' +
      '<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">' + (patient.patient_id || 'Sin ID') + '</p>' +
      '<p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: var(--accent-color);"><i class="fas fa-arrow-right"></i> Click para ver historial</p>' +
      '</div></div>';
  });
  html += '</div>';
  document.getElementById('medicalRecordsContent').innerHTML = html;
}

async function viewPatientMedicalRecords(patientId, patientName) {
  window.currentPatientId = patientId;
  
  // Cargar historial de consultas
  var { data: consultations } = await db.from('consultations').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  
  var html = '<div style="padding: 1.5rem;"><h3>' + patientName + '</h3>';
  html += '<h4 style="margin-top: 1.5rem;"><i class="fas fa-history"></i> Consultas Registradas</h4>';
  
  if (!consultations || consultations.length === 0) {
    html += '<p style="color: var(--text-secondary); padding: 1rem;">Sin consultas registradas</p>';
  } else {
    html += '<div style="display: grid; gap: 1rem;">';
    consultations.forEach(function(cons) {
      var date = new Date(cons.created_at).toLocaleDateString('es-ES');
      html += '<div class="stat-card" style="padding: 1rem; border-radius: 8px; background: #fafafa; cursor: pointer;" onclick="viewConsultationDetail(\'' + cons.id + '\')">' +
        '<p style="margin: 0 0 0.5rem 0; font-weight: 500;"><i class="fas fa-stethoscope"></i> ' + date + '</p>' +
        '<p style="margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #666;"><strong>Diagnóstico:</strong> ' + (cons.diagnosis || 'N/A') + '</p>' +
        (cons.symptoms ? '<p style="margin: 0; font-size: 0.9rem; color: #666;"><strong>Motivo:</strong> ' + cons.symptoms + '</p>' : '') +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  
  document.getElementById('medicalRecordsContent').innerHTML = html;
}
