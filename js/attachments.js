// ===== SISTEMA DE ARCHIVOS ADJUNTOS =====
// Guarda metadata en JSONB (patients.attachments / consultations.attachments)
// Guarda archivos en Supabase Storage bucket "patient_documents"

// ===== PATIENT DOCUMENTS =====

async function uploadDocFromDetail() {
  var fileInput = document.getElementById('detailPatientFileInput');
  var file = fileInput.files[0];
  if (!file || !currentDetailPatientId) {
    showToast('error', 'Error', 'Selecciona un archivo primero');
    return;
  }

  showToast('info', 'Subiendo', 'Cargando archivo...');

  try {
    var userId = getUserId();
    var fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    var filePath = userId + '/patients/' + currentDetailPatientId + '/' + fileName;

    // 1. Upload to storage
    var { data: uploadData, error: uploadError } = await db.storage
      .from('patient_documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      showToast('error', 'Error al subir', uploadError.message);
      return;
    }

    // 2. Save metadata in patients.attachments (JSONB)
    var { data: patient } = await db.from('patients')
      .select('attachments')
      .eq('id', currentDetailPatientId)
      .single();

    var attachments = (patient && patient.attachments) ? patient.attachments : [];
    attachments.push({
      id: Date.now(),
      fileName: file.name,
      filePath: filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    });

    var { error: updateError } = await db.from('patients')
      .update({ attachments: attachments })
      .eq('id', currentDetailPatientId);

    if (updateError) {
      console.error('Update error:', updateError);
      showToast('error', 'Error al guardar', updateError.message);
      return;
    }

    showToast('success', 'Listo', 'Documento agregado');
    displayPatientAttachments(currentDetailPatientId, 'detailPatientDocuments');
    fileInput.value = '';

  } catch (err) {
    console.error('Error general:', err);
    showToast('error', 'Error', err.message);
  }
}

async function displayPatientAttachments(patientId, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  try {
    var { data: patient } = await db.from('patients')
      .select('attachments')
      .eq('id', patientId)
      .single();

    var attachments = (patient && patient.attachments) ? patient.attachments : [];

    if (attachments.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Sin documentos</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < attachments.length; i++) {
      var att = attachments[i];
      var icon = getFileIconByName(att.fileName);
      var date = new Date(att.uploadedAt).toLocaleDateString('es-ES');
      var isImage = att.fileType && att.fileType.startsWith('image/');
      var isPdf = att.fileType && att.fileType === 'application/pdf';

      // Get signed URL for preview
      var previewUrl = '';
      if (isImage || isPdf) {
        var { data: urlData } = await db.storage
          .from('patient_documents')
          .createSignedUrl(att.filePath, 3600);
        if (urlData) previewUrl = urlData.signedUrl;
      }

      html += '<div style="border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden;">';
      
      // Preview area
      if (isImage && previewUrl) {
        html += '<div style="cursor: pointer;" onclick="openPreviewModal(\'' + previewUrl + '\', \'image\')">' +
          '<img src="' + previewUrl + '" style="width: 100%; max-height: 150px; object-fit: cover; display: block;" />' +
          '</div>';
      } else if (isPdf && previewUrl) {
        html += '<div style="background: #f5f5f5; padding: 1rem; text-align: center; cursor: pointer;" onclick="openPreviewModal(\'' + previewUrl + '\', \'pdf\')">' +
          '<i class="fas fa-file-pdf" style="font-size: 2rem; color: #e74c3c;"></i>' +
          '<p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: var(--text-secondary);">Click para ver PDF</p>' +
          '</div>';
      }

      // File info bar
      html += '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;">' +
        '<span style="font-size: 1.1rem; color: var(--accent-color);">' + icon + '</span>' +
        '<div style="flex: 1; min-width: 0;">' +
          '<p style="margin: 0; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + att.fileName + '</p>' +
          '<p style="margin: 0; font-size: 0.7rem; color: var(--text-muted);">' + date + '</p>' +
        '</div>' +
        '<button onclick="downloadPatientDoc(\'' + att.filePath + '\', \'' + att.fileName.replace(/'/g, "\\'") + '\')" style="background: var(--accent-color); color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer;" title="Descargar"><i class="fas fa-download"></i></button>' +
        '<button onclick="deletePatientDoc(\'' + patientId + '\', ' + att.id + ', \'' + att.filePath + '\')" style="background: var(--danger-color); color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer;" title="Eliminar"><i class="fas fa-trash"></i></button>' +
        '</div>';
      
      html += '</div>';
    }
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loading attachments:', err);
    container.innerHTML = '<p style="color: var(--text-secondary);">Error cargando documentos</p>';
  }
}

function openPreviewModal(url, type) {
  var existing = document.getElementById('previewModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'previewModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

  var content = '';
  if (type === 'image') {
    content = '<img src="' + url + '" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5);" />';
  } else if (type === 'pdf') {
    content = '<iframe src="' + url + '" style="width:80vw;height:85vh;border:none;border-radius:8px;"></iframe>';
  }

  content += '<button onclick="this.parentElement.remove()" style="position:absolute;top:1rem;right:1rem;background:white;border:none;width:40px;height:40px;border-radius:50%;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>';

  modal.innerHTML = content;
  document.body.appendChild(modal);
}

async function downloadPatientDoc(filePath, fileName) {
  try {
    var { data, error } = await db.storage
      .from('patient_documents')
      .download(filePath);

    if (error) throw error;

    var url = URL.createObjectURL(data);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading:', err);
    showToast('error', 'Error', 'No se pudo descargar');
  }
}

async function deletePatientDoc(patientId, attachmentId, filePath) {
  if (!confirm('¿Eliminar este documento?')) return;

  try {
    // Remove from storage
    await db.storage.from('patient_documents').remove([filePath]);

    // Remove from patient JSONB
    var { data: patient } = await db.from('patients')
      .select('attachments')
      .eq('id', patientId)
      .single();

    var attachments = (patient && patient.attachments) ? patient.attachments : [];
    attachments = attachments.filter(function(a) { return a.id !== attachmentId; });

    await db.from('patients')
      .update({ attachments: attachments })
      .eq('id', patientId);

    showToast('success', 'Eliminado', 'Documento eliminado');
    displayPatientAttachments(patientId, 'detailPatientDocuments');
  } catch (err) {
    console.error('Error deleting:', err);
    showToast('error', 'Error', err.message);
  }
}

function getFileIconByName(fileName) {
  var ext = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '<i class="fas fa-image"></i>';
  if (ext === 'pdf') return '<i class="fas fa-file-pdf"></i>';
  if (['doc', 'docx'].includes(ext)) return '<i class="fas fa-file-word"></i>';
  if (['xls', 'xlsx'].includes(ext)) return '<i class="fas fa-file-excel"></i>';
  return '<i class="fas fa-file"></i>';
}

// ===== CONSULTATION ATTACHMENTS =====
// Los adjuntos se guardan temporalmente hasta que se guarda la consulta

window.pendingConsultationAttachments = [];

async function uploadConsultationAttachment() {
  var fileInput = document.getElementById('consultationFileInput');
  var file = fileInput.files[0];
  if (!file) {
    showToast('error', 'Error', 'Selecciona un archivo primero');
    return;
  }

  showToast('info', 'Subiendo', 'Cargando archivo...');

  try {
    var userId = getUserId();
    var appointmentId = document.getElementById('consultViewAppointmentKey').value;
    var fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    var filePath = userId + '/consultations/' + appointmentId + '/' + fileName;

    var { data: uploadData, error: uploadError } = await db.storage
      .from('patient_documents')
      .upload(filePath, file);

    if (uploadError) {
      showToast('error', 'Error al subir', uploadError.message);
      return;
    }

    // Add to pending list
    window.pendingConsultationAttachments.push({
      id: Date.now(),
      fileName: file.name,
      filePath: filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    });

    showToast('success', 'Listo', 'Adjunto agregado');
    displayPendingConsultationAttachments();
    fileInput.value = '';

  } catch (err) {
    console.error('Error:', err);
    showToast('error', 'Error', err.message);
  }
}

function displayPendingConsultationAttachments() {
  var container = document.getElementById('consultationAttachmentsContainer');
  if (!container) return;

  var attachments = window.pendingConsultationAttachments || [];

  if (attachments.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Sin adjuntos</p>';
    return;
  }

  var html = '';
  attachments.forEach(function(att, index) {
    var icon = getFileIconByName(att.fileName);
    html += '<div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 0.5rem;">' +
      '<span style="font-size: 1rem; color: var(--accent-color);">' + icon + '</span>' +
      '<span style="flex: 1; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + att.fileName + '</span>' +
      '<button onclick="removePendingAttachment(' + index + ')" style="background: var(--danger-color); color: white; border: none; padding: 0.3rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"><i class="fas fa-times"></i></button>' +
      '</div>';
  });
  container.innerHTML = html;
}

function removePendingAttachment(index) {
  var removed = window.pendingConsultationAttachments.splice(index, 1)[0];
  // Also delete from storage
  if (removed && removed.filePath) {
    db.storage.from('patient_documents').remove([removed.filePath]);
  }
  displayPendingConsultationAttachments();
}
