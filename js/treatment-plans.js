// ===== PLANES DE TRATAMIENTO (Supabase) =====

async function openNewTreatmentPlanModal() {
  var { data: patients } = await supabase.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('treatmentPlanPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('treatmentPlanForm').reset();
  document.getElementById('treatmentPlanEditId').value = '';
  document.getElementById('treatmentPlanModalTitle').textContent = 'Nuevo Plan de Tratamiento';
  document.getElementById('treatmentPlanModal').style.display = 'block';
}
function closeTreatmentPlanModal() { document.getElementById('treatmentPlanModal').style.display = 'none'; }

async function refreshTreatmentPlans() {
  var { data: plans, error } = await supabase.from('treatment_plans').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('treatmentPlansTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var total = 0, active = 0, completed = 0, paused = 0;
  (plans || []).forEach(function(tp) {
    total++;
    if (tp.status === 'active') active++;
    else if (tp.status === 'completed') completed++;
    else if (tp.status === 'paused') paused++;
    var patient = tp.patients || {};
    var statusLabels = { active: 'Activo', completed: 'Completado', paused: 'Pausado' };
    var statusClass = { active: 'success', completed: 'info', paused: 'warning' };
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (tp.objective || '') + '</td><td>' + (tp.duration || '') + ' días</td>' +
      '<td>' + (tp.start_date || '') + '</td>' +
      '<td><span class="badge badge-' + (statusClass[tp.status] || 'info') + '">' + (statusLabels[tp.status] || tp.status) + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editTreatmentPlan(\'' + tp.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteTreatmentPlan(\'' + tp.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
  if (document.getElementById('totalTreatmentPlansCount')) document.getElementById('totalTreatmentPlansCount').textContent = total;
  if (document.getElementById('activeTreatmentPlansCount')) document.getElementById('activeTreatmentPlansCount').textContent = active;
  if (document.getElementById('completedTreatmentPlansCount')) document.getElementById('completedTreatmentPlansCount').textContent = completed;
  if (document.getElementById('pausedTreatmentPlansCount')) document.getElementById('pausedTreatmentPlansCount').textContent = paused;
}

async function editTreatmentPlan(id) {
  var { data: tp } = await supabase.from('treatment_plans').select('*').eq('id', id).single();
  if (!tp) return;
  await openNewTreatmentPlanModal();
  document.getElementById('treatmentPlanEditId').value = id;
  document.getElementById('treatmentPlanPatient').value = tp.patient_id;
  document.getElementById('treatmentPlanObjective').value = tp.objective || '';
  document.getElementById('treatmentPlanDuration').value = tp.duration || '';
  document.getElementById('treatmentPlanStartDate').value = tp.start_date || '';
  document.getElementById('treatmentPlanStatus').value = tp.status || 'active';
  document.getElementById('treatmentPlanDiet').value = tp.diet || '';
  document.getElementById('treatmentPlanExercise').value = tp.exercise || '';
  document.getElementById('treatmentPlanRestrictions').value = tp.restrictions || '';
  document.getElementById('treatmentPlanFollowUp').value = tp.follow_up || '';
}

async function deleteTreatmentPlan(id) {
  showConfirm('Eliminar Plan', '¿Está seguro?', async function() {
    var { error } = await supabase.from('treatment_plans').delete().eq('id', id);
    if (error) { showToast('error', 'Error', error.message); return; }
    refreshTreatmentPlans();
    showToast('success', 'Eliminado', 'Plan eliminado');
  });
}

function searchTreatmentPlans() {
  var query = document.getElementById('treatmentPlanSearchField').value.toLowerCase();
  var rows = document.querySelectorAll('#treatmentPlansTableBody tr');
  rows.forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}
function filterTreatmentPlans() { refreshTreatmentPlans(); }
function exportTreatmentPlans() { showToast('info', 'Exportando', 'Generando PDF...'); }

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('treatmentPlanForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('treatmentPlanEditId').value;
      var data = {
        patient_id: document.getElementById('treatmentPlanPatient').value,
        objective: document.getElementById('treatmentPlanObjective').value,
        duration: parseInt(document.getElementById('treatmentPlanDuration').value) || null,
        start_date: document.getElementById('treatmentPlanStartDate').value || null,
        status: document.getElementById('treatmentPlanStatus').value,
        diet: document.getElementById('treatmentPlanDiet').value,
        exercise: document.getElementById('treatmentPlanExercise').value,
        restrictions: document.getElementById('treatmentPlanRestrictions').value,
        follow_up: document.getElementById('treatmentPlanFollowUp').value
      };
      var error;
      if (editId) { ({ error } = await supabase.from('treatment_plans').update(data).eq('id', editId)); }
      else { ({ error } = await supabase.from('treatment_plans').insert(data)); }
      if (error) { showToast('error', 'Error', error.message); return; }
      closeTreatmentPlanModal();
      refreshTreatmentPlans();
      showToast('success', 'Guardado', editId ? 'Plan actualizado' : 'Plan creado');
    });
  }
});
