// ===== CITAS RECURRENTES (Supabase) =====

async function openNewRecurringAppointmentModal() {
  var { data: patients } = await supabase.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('recurringPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('recurringAppointmentForm').reset();
  document.getElementById('recurringAppointmentModal').style.display = 'block';
}
function closeRecurringAppointmentModal() { document.getElementById('recurringAppointmentModal').style.display = 'none'; }

async function refreshRecurringAppointments() {
  var { data: recurring, error } = await supabase.from('recurring_appointments').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('recurringAppointmentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (recurring || []).forEach(function(r) {
    var patient = r.patients || {};
    var patternText = r.pattern === 'daily' ? 'Diaria' : r.pattern === 'weekly' ? 'Semanal' : 'Mensual';
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (r.template_id || '') + '</td><td>' + patternText + '</td>' +
      '<td>' + (r.start_date || '') + '</td><td>' + (r.end_date || '') + '</td>' +
      '<td><span class="badge badge-' + (r.is_active ? 'success' : 'secondary') + '">' + (r.is_active ? 'Activa' : 'Inactiva') + '</span></td>' +
      '<td><button class="btn btn-sm btn-warning" onclick="toggleRecurring(\'' + r.id + '\',' + r.is_active + ')"><i class="fas fa-' + (r.is_active ? 'pause' : 'play') + '"></i></button> ' +
      '<button class="btn btn-sm btn-danger" onclick="deleteRecurring(\'' + r.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    tbody.innerHTML += row;
  });
}

async function toggleRecurring(id, currentState) {
  var { error } = await supabase.from('recurring_appointments').update({ is_active: !currentState }).eq('id', id);
  if (!error) refreshRecurringAppointments();
}

async function deleteRecurring(id) {
  if (confirm('¿Eliminar esta cita recurrente?')) {
    await supabase.from('recurring_appointments').delete().eq('id', id);
    refreshRecurringAppointments();
  }
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('recurringAppointmentForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var daysOfWeek = [];
      document.querySelectorAll('.recurringDay:checked').forEach(function(cb) { daysOfWeek.push(parseInt(cb.value)); });
      var data = {
        patient_id: document.getElementById('recurringPatient').value,
        template_id: document.getElementById('recurringTemplate').value,
        start_date: document.getElementById('recurringStartDate').value,
        end_date: document.getElementById('recurringEndDate').value,
        time: document.getElementById('recurringTime').value,
        pattern: document.getElementById('recurringPattern').value,
        days_of_week: daysOfWeek,
        is_active: true
      };
      var { error } = await supabase.from('recurring_appointments').insert(data);
      if (error) { showToast('error', 'Error', error.message); return; }
      closeRecurringAppointmentModal();
      refreshRecurringAppointments();
      showToast('success', 'Creada', 'Cita recurrente creada');
    });
  }
});
