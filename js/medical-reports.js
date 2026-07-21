// ===== INFORMES MÉDICOS =====

async function openNewMedicalReportModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname, patient_id, birth_date, gender, phone').order('name');
  var select = document.getElementById('mrPatient');
  select.innerHTML = '<option value="">Seleccionar paciente</option>';
  if (patients) patients.forEach(function(p) {
    select.innerHTML += '<option value="' + p.id + '" ' +
      'data-pid="' + (p.patient_id || '') + '" ' +
      'data-dob="' + (p.birth_date || '') + '" ' +
      'data-gender="' + (p.gender || '') + '" ' +
      'data-phone="' + (p.phone || '') + '">' +
      p.name + ' ' + p.lastname + '</option>';
  });
  document.getElementById('mrForm').reset();
  document.getElementById('mrEditId').value = '';
  document.getElementById('mrModalTitle').textContent = 'Nuevo Informe Médico';
  document.getElementById('mrDate').value = new Date().toISOString().split('T')[0];
  _mrClearPatientInfo();
  document.getElementById('mrModal').style.display = 'block';
}

function closeMedicalReportModal() { document.getElementById('mrModal').style.display = 'none'; }

function _mrClearPatientInfo() {
  ['mrPatientId','mrPatientDob','mrPatientAge','mrPatientGender','mrPatientPhone'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function mrOnPatientChange() {
  var select  = document.getElementById('mrPatient');
  var opt     = select.options[select.selectedIndex];
  if (!opt || !opt.value) { _mrClearPatientInfo(); return; }

  document.getElementById('mrPatientId').value     = opt.dataset.pid    || '';
  document.getElementById('mrPatientGender').value = opt.dataset.gender  || '';
  document.getElementById('mrPatientPhone').value  = opt.dataset.phone   || '';

  var dob = opt.dataset.dob;
  document.getElementById('mrPatientDob').value = dob ? formatDate(dob) : '';
  if (dob) {
    var today     = new Date();
    var birth     = new Date(dob + 'T00:00:00'); // forzar hora local, no UTC
    var age       = today.getFullYear() - birth.getFullYear();
    var monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    document.getElementById('mrPatientAge').value = age >= 0 ? age : '';
  } else {
    document.getElementById('mrPatientAge').value = '';
  }
}

async function refreshMedicalReports() {
  var { data: reports, error } = await db.from('medical_reports')
    .select('*, patients(name, lastname)')
    .order('emission_date', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('mrTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!reports || !reports.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem;">No hay informes registrados</td></tr>';
    return;
  }
  reports.forEach(function(r) {
    var p = r.patients || {};
    tbody.innerHTML += '<tr>' +
      '<td>' + (p.name || '') + ' ' + (p.lastname || '') + '</td>' +
      '<td>' + (r.report_number || '-') + '</td>' +
      '<td>' + formatDate(r.emission_date) + '</td>' +
      '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.consultation_reason || '-') + '</td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary"  title="Editar"      onclick="editMedicalReport(\''   + r.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-warning"  title="Exportar PDF" onclick="exportMedicalReportPDF(\'' + r.id + '\')"><i class="fas fa-file-pdf"></i></button>' +
        '<button class="btn btn-sm btn-danger"   title="Eliminar"    onclick="deleteMedicalReport(\'' + r.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  });
}

async function editMedicalReport(id) {
  var { data: r } = await db.from('medical_reports').select('*, patients(id, name, lastname, patient_id, birth_date, gender, phone)').eq('id', id).single();
  if (!r) return;
  await openNewMedicalReportModal();
  document.getElementById('mrEditId').value     = id;
  document.getElementById('mrModalTitle').textContent = 'Editar Informe Médico';
  document.getElementById('mrPatient').value    = r.patient_id || '';
  mrOnPatientChange();

  document.getElementById('mrDate').value           = r.emission_date || '';
  document.getElementById('mrReportNumber').value   = r.report_number || '';
  document.getElementById('mrPatientId').value      = r.patient_doc || '';
  document.getElementById('mrPatientDob').value     = r.patient_dob ? formatDate(r.patient_dob) : '';
  document.getElementById('mrPatientAge').value     = r.patient_age || '';
  document.getElementById('mrPatientGender').value  = r.patient_gender || '';
  document.getElementById('mrPatientPhone').value   = r.patient_phone || '';
  document.getElementById('mrReason').value         = r.consultation_reason || '';
  document.getElementById('mrMedHistory').value     = r.medical_history || '';
  document.getElementById('mrSurgHistory').value    = r.surgical_history || '';
  document.getElementById('mrAllergies').value      = r.allergies || '';
  document.getElementById('mrCurrentTreatment').value = r.current_treatment || '';
  document.getElementById('mrClinicalEvolution').value = r.clinical_evolution || '';
  document.getElementById('mrBloodPressure').value  = r.blood_pressure || '';
  document.getElementById('mrHeartRate').value      = r.heart_rate || '';
  document.getElementById('mrTemperature').value    = r.temperature || '';
  document.getElementById('mrOxygen').value         = r.oxygen_saturation || '';
  document.getElementById('mrStudies').value        = r.complementary_studies || '';
}

async function deleteMedicalReport(id) {
  showConfirm('Eliminar Informe', '¿Eliminar este informe médico? Esta acción no se puede deshacer.', async function() {
    var { error } = await db.from('medical_reports').delete().eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    refreshMedicalReports();
    showToast('success', 'Eliminado', 'Informe eliminado');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('mrForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var editId = document.getElementById('mrEditId').value;
    var data = {
      patient_id:            document.getElementById('mrPatient').value,
      emission_date:         document.getElementById('mrDate').value,
      report_number:         document.getElementById('mrReportNumber').value,
      patient_doc:           document.getElementById('mrPatientId').value,
      patient_dob:           null,
      patient_age:           parseInt(document.getElementById('mrPatientAge').value) || null,
      patient_gender:        document.getElementById('mrPatientGender').value,
      patient_phone:         document.getElementById('mrPatientPhone').value,
      consultation_reason:   document.getElementById('mrReason').value,
      medical_history:       document.getElementById('mrMedHistory').value,
      surgical_history:      document.getElementById('mrSurgHistory').value,
      allergies:             document.getElementById('mrAllergies').value,
      current_treatment:     document.getElementById('mrCurrentTreatment').value,
      clinical_evolution:    document.getElementById('mrClinicalEvolution').value,
      blood_pressure:        document.getElementById('mrBloodPressure').value,
      heart_rate:            document.getElementById('mrHeartRate').value,
      temperature:           document.getElementById('mrTemperature').value,
      oxygen_saturation:     document.getElementById('mrOxygen').value,
      complementary_studies: document.getElementById('mrStudies').value
    };

    var error;
    if (editId) {
      ({ error } = await db.from('medical_reports').update(data).eq('id', editId));
    } else {
      ({ error } = await db.from('medical_reports').insert(data));
    }
    if (error) { showToast('error', 'Error', error.message); return; }
    closeMedicalReportModal();
    refreshMedicalReports();
    showToast('success', editId ? 'Actualizado' : 'Guardado', 'Informe médico guardado');
  });
});
