// ===== CITAS (Supabase) =====

async function loadAppointments() {
  var tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>';

  var { data: appointments, error } = await db.from('appointments').select('*, patients(name, lastname, patient_id, phone)').order('date', { ascending: false });
  if (error) { console.error('Error loading appointments:', error); return; }

  tbody.innerHTML = '';
  var today = new Date().toISOString().split('T')[0];
  var todayCount = 0;

  appointments.forEach(function(apt) {
    var patient = apt.patients || {};
    var patientName = (patient.name || '') + ' ' + (patient.lastname || '');
    if (apt.date === today) todayCount++;
    var statusLabels = { scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada', 'no-show': 'No asistió' };
    var statusClass = { scheduled: 'info', completed: 'success', cancelled: 'danger', 'no-show': 'warning' };
    var row = '<tr>' +
      '<td>' + patientName + '</td>' +
      '<td>' + (apt.date || '') + '</td>' +
      '<td>' + (apt.time || '') + '</td>' +
      '<td>' + (apt.type || '') + '</td>' +
      '<td><span class="badge badge-' + (statusClass[apt.status] || 'info') + '">' + (statusLabels[apt.status] || apt.status) + '</span></td>' +
      '<td>' + (apt.office || '-') + '</td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-success" onclick="openConsultation(\'' + apt.id + '\')"><i class="fas fa-stethoscope"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="cancelAppointment(\'' + apt.id + '\')"><i class="fas fa-times"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
  if (document.getElementById('todayAppointments')) document.getElementById('todayAppointments').textContent = todayCount;
}

async function openScheduleModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('schedulePatient');
  select.innerHTML = '<option value="">Seleccionar paciente</option>';
  if (patients) patients.forEach(function(p) {
    select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>';
  });
  document.getElementById('scheduleForm').reset();
  document.getElementById('scheduleModal').style.display = 'block';
}

function closeScheduleModal() { document.getElementById('scheduleModal').style.display = 'none'; }

async function cancelAppointment(id) {
  showConfirm('Cancelar Cita', '¿Desea cancelar esta cita?', async function() {
    var { error } = await db.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    loadAppointments();
    showToast('success', 'Cancelada', 'Cita cancelada');
  });
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

  var { error } = await db.from('consultations').insert(consultationData);
  if (error) { showToast('error', 'Error', error.message); return; }

  // Mark appointment as completed
  await db.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);

  showToast('success', 'Guardada', 'Consulta registrada correctamente');
  showView('appointments');
}

function changeConsultationTemplate(template) { /* Template logic */ }
function refreshAppointments() { loadAppointments(); }
function filterAppointments() { loadAppointments(); }
function searchAppointments() {
  var query = document.getElementById('appointmentSearchField').value.toLowerCase();
  var rows = document.querySelectorAll('#appointmentsTableBody tr');
  rows.forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

// Schedule form submission
document.addEventListener('DOMContentLoaded', function() {
  var scheduleForm = document.getElementById('scheduleForm');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var appointmentData = {
        patient_id: document.getElementById('schedulePatient').value,
        date: document.getElementById('scheduleDate').value,
        time: document.getElementById('scheduleTime').value,
        type: document.getElementById('scheduleType').value,
        office: document.getElementById('scheduleOffice').value,
        notes: document.getElementById('scheduleNotes').value,
        status: 'scheduled'
      };
      var { error } = await db.from('appointments').insert(appointmentData);
      if (error) { showToast('error', 'Error', error.message); return; }
      closeScheduleModal();
      loadAppointments();
      showToast('success', 'Programada', 'Cita creada correctamente');
    });
  }
});
