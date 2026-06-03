// ===== PACIENTES (Supabase) =====

async function loadAllPatients() {
  var tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando...</td></tr>';

  var { data: patients, error } = await db.from('patients').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error loading patients:', error); return; }

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
}

async function deletePatient(patientId) {
  showConfirm('Eliminar Paciente', 'Esta acción no se puede deshacer.', async function() {
    var { error } = await db.from('patients').delete().eq('id', patientId);
    if (error) { showToast('error', 'Error', 'No se pudo eliminar'); return; }
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

function filterPatients() { loadAllPatients(); }
function refreshPatients() { loadAllPatients(); }

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
        ({ error } = await db.from('patients').insert(patientData));
      }

      if (error) { showToast('error', 'Error', error.message); return; }
      closePatientModal();
      loadAllPatients();
      showToast('success', 'Guardado', editId ? 'Paciente actualizado' : 'Paciente creado');
    });
  }
});
