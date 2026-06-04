// ===== REFERENCIAS MÉDICAS (Supabase) =====

async function openNewReferralModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('referralPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('referralForm').reset();
  document.getElementById('referralEditId').value = '';
  document.getElementById('referralModalTitle').textContent = 'Nueva Referencia Médica';
  document.getElementById('referralDate').valueAsDate = new Date();
  document.getElementById('referralModal').style.display = 'block';
}
function closeReferralModal() { document.getElementById('referralModal').style.display = 'none'; }

async function refreshReferrals() {
  var { data: referrals, error } = await db.from('referrals').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('referralsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (referrals || []).forEach(function(r) {
    var patient = r.patients || {};
    var priorityClass = r.priority === 'urgent' ? 'danger' : 'info';
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (r.specialty || '').charAt(0).toUpperCase() + (r.specialty || '').slice(1) + '</td>' +
      '<td>' + (r.reason || '').substring(0, 50) + '</td>' +
      '<td>' + formatDate(r.date) + '</td>' +
      '<td><span class="badge badge-' + priorityClass + '">' + (r.priority || 'normal') + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editReferral(\'' + r.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-info" onclick="viewReferral(\'' + r.id + '\')"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm btn-warning" onclick="exportReferralPDF(\'' + r.id + '\')"><i class="fas fa-file-pdf"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteReferral(\'' + r.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
}

async function editReferral(id) {
  var { data: ref } = await db.from('referrals').select('*').eq('id', id).single();
  if (!ref) return;
  await openNewReferralModal();
  document.getElementById('referralEditId').value = id;
  document.getElementById('referralModalTitle').textContent = 'Editar Referencia';
  document.getElementById('referralPatient').value = ref.patient_id;
  document.getElementById('referralSpecialty').value = ref.specialty || '';
  document.getElementById('referralReason').value = ref.reason || '';
  document.getElementById('referralDate').value = ref.date || '';
  document.getElementById('referralPriority').value = ref.priority || 'normal';
  document.getElementById('referralNotes').value = ref.notes || '';
}

async function viewReferral(id) {
  var { data: r } = await db.from('referrals').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!r) return;
  var patient = r.patients || {};
  var html = '<div style="background:var(--bg-secondary);padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(r.date) + '</p>';
  html += '</div>';
  html += '<p><strong>Especialidad:</strong> ' + (r.specialty || '').charAt(0).toUpperCase() + (r.specialty || '').slice(1) + '</p>';
  if (r.priority === 'urgent') html += '<p style="color:var(--danger-color);font-weight:bold;">URGENTE</p>';
  html += '<p style="margin-top:0.75rem;"><strong>Motivo:</strong></p>';
  html += '<p style="white-space:pre-line;">' + (r.reason || '-') + '</p>';
  if (r.notes) html += '<p style="margin-top:0.75rem;"><strong>Notas:</strong> ' + r.notes + '</p>';
  showDetailModal('Detalle de Referencia', html);
}

async function deleteReferral(id) {
  showConfirm('Eliminar Referencia', '¿Está seguro?', async function() {
    await db.from('referrals').delete().eq('id', id);
    refreshReferrals();
    showToast('success', 'Eliminada', 'Referencia eliminada');
  });
}

function searchReferrals() {
  var query = document.getElementById('referralSearchField').value.toLowerCase();
  document.querySelectorAll('#referralsTableBody tr').forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('referralForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('referralEditId').value;
      var data = {
        patient_id: document.getElementById('referralPatient').value,
        specialty: document.getElementById('referralSpecialty').value,
        reason: document.getElementById('referralReason').value,
        date: document.getElementById('referralDate').value || null,
        priority: document.getElementById('referralPriority').value,
        notes: document.getElementById('referralNotes').value,
        status: 'pendiente'
      };
      var error;
      if (editId) { ({ error } = await db.from('referrals').update(data).eq('id', editId)); }
      else { ({ error } = await db.from('referrals').insert(data)); }
      if (error) { showToast('error', 'Error', error.message); return; }
      closeReferralModal();
      refreshReferrals();
      showToast('success', 'Guardada', editId ? 'Referencia actualizada' : 'Referencia creada');
    });
  }
});
