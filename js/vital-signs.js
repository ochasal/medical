// ===== SIGNOS VITALES (Supabase) =====

async function openNewVitalSignsModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('vitalSignsPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('vitalSignsForm').reset();
  document.getElementById('vitalSignsDate').valueAsDate = new Date();
  document.getElementById('vitalSignsModal').style.display = 'block';
}
function closeVitalSignsModal() { document.getElementById('vitalSignsModal').style.display = 'none'; }

async function refreshVitalSigns() {
  var { data: records, error } = await db.from('vital_signs').select('*, patients(name, lastname)').order('date', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('vitalSignsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (records || []).forEach(function(r) {
    var patient = r.patients || {};
    var bmi = r.weight && r.height ? (r.weight / Math.pow(r.height / 100, 2)).toFixed(1) : 'N/A';
    var pa = r.systolic && r.diastolic ? r.systolic + '/' + r.diastolic : 'N/A';
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + formatDate(r.date) + '</td><td>' + pa + '</td><td>' + (r.heart_rate || 'N/A') + '</td>' +
      '<td>' + (r.temperature || 'N/A') + '</td><td>' + (r.weight || 'N/A') + '</td><td>' + bmi + '</td>' +
      '<td><button class="btn btn-sm btn-info" onclick="viewVitalDetails(\'' + r.id + '\')"><i class="fas fa-eye"></i></button></td></tr>';
    tbody.innerHTML += row;
  });
}

async function viewVitalDetails(id) {
  var { data: r } = await db.from('vital_signs').select('*, patients(name, lastname)').eq('id', id).single();
  if (!r) return;
  var patient = r.patients || {};
  var bmi = r.weight && r.height ? (r.weight / Math.pow(r.height / 100, 2)).toFixed(1) : 'N/A';
  var html = '<div style="background:var(--bg-secondary);padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(r.date) + '</p>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">';
  html += '<p><strong>PA:</strong> ' + (r.systolic || 'N/A') + '/' + (r.diastolic || 'N/A') + ' mmHg</p>';
  html += '<p><strong>FC:</strong> ' + (r.heart_rate || 'N/A') + ' lpm</p>';
  html += '<p><strong>Temperatura:</strong> ' + (r.temperature || 'N/A') + ' °C</p>';
  html += '<p><strong>Peso:</strong> ' + (r.weight || 'N/A') + ' kg</p>';
  html += '<p><strong>Altura:</strong> ' + (r.height || 'N/A') + ' cm</p>';
  html += '<p><strong>IMC:</strong> ' + bmi + '</p>';
  html += '</div>';
  showDetailModal('Signos Vitales', html);
}

function filterVitalSigns() {
  var rows = document.querySelectorAll('#vitalSignsTableBody tr');
  var query = document.getElementById('vitalSignsSearch') ? document.getElementById('vitalSignsSearch').value.toLowerCase() : '';
  rows.forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('vitalSignsForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var patientId = document.getElementById('vitalSignsPatient').value;
      if (!patientId) { showToast('error', 'Error', 'Seleccione un paciente'); return; }
      var data = {
        patient_id: patientId,
        date: document.getElementById('vitalSignsDate').value,
        systolic: parseInt(document.getElementById('vitalSignsSystolic').value) || null,
        diastolic: parseInt(document.getElementById('vitalSignsDiastolic').value) || null,
        heart_rate: parseInt(document.getElementById('vitalSignsHeartRate').value) || null,
        temperature: parseFloat(document.getElementById('vitalSignsTemperature').value) || null,
        weight: parseFloat(document.getElementById('vitalSignsWeight').value) || null,
        height: parseFloat(document.getElementById('vitalSignsHeight').value) || null
      };
      { var result = await dbInsert('vital_signs', data); var error = result.error; }
      if (error) { 
        var errorMsg = error.message || 'Error al guardar los signos vitales';
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closeVitalSignsModal();
      refreshVitalSigns();
      showToast('success', 'Guardado', 'Signos vitales registrados');
    });
  }
});
