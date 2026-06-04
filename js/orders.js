// ===== ÓRDENES MÉDICAS (Supabase) =====

async function openNewOrderModal() {
  var { data: patients } = await db.from('patients').select('id, name, lastname').order('name');
  var select = document.getElementById('orderPatient');
  select.innerHTML = '<option value="">Seleccionar</option>';
  if (patients) patients.forEach(function(p) { select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>'; });
  document.getElementById('orderForm').reset();
  document.getElementById('orderEditId').value = '';
  document.getElementById('orderModalTitle').textContent = 'Nueva Orden Médica';
  document.getElementById('orderDate').valueAsDate = new Date();
  document.getElementById('orderModal').style.display = 'block';
}
function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; }

async function refreshOrders() {
  var { data: orders, error } = await db.from('orders').select('*, patients(name, lastname)').order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  var tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  var typeLabels = { lab: 'Laboratorio', imaging: 'Imagenología', procedure: 'Procedimiento', other: 'Otro' };
  (orders || []).forEach(function(o) {
    var patient = o.patients || {};
    var row = '<tr><td>' + (patient.name || '') + ' ' + (patient.lastname || '') + '</td>' +
      '<td>' + (typeLabels[o.type] || o.type) + '</td>' +
      '<td>' + (o.description || '').substring(0, 50) + '</td>' +
      '<td>' + formatDate(o.date) + '</td>' +
      '<td><span class="badge badge-info">' + (o.status === 'pendiente' ? 'Pendiente' : o.status === 'completada' ? 'Completada' : o.status) + '</span></td>' +
      '<td><div class="action-buttons">' +
        '<button class="btn btn-sm btn-primary" onclick="editOrder(\'' + o.id + '\')"><i class="fas fa-edit"></i></button>' +
        '<button class="btn btn-sm btn-info" onclick="viewOrder(\'' + o.id + '\')"><i class="fas fa-eye"></i></button>' +
        '<button class="btn btn-sm btn-warning" onclick="exportOrderPDF(\'' + o.id + '\')"><i class="fas fa-file-pdf"></i></button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteOrder(\'' + o.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
    tbody.innerHTML += row;
  });
}

async function editOrder(id) {
  var { data: order } = await db.from('orders').select('*').eq('id', id).single();
  if (!order) return;
  await openNewOrderModal();
  document.getElementById('orderEditId').value = id;
  document.getElementById('orderModalTitle').textContent = 'Editar Orden';
  document.getElementById('orderPatient').value = order.patient_id;
  document.getElementById('orderType').value = order.type || '';
  document.getElementById('orderDescription').value = order.description || '';
  document.getElementById('orderDate').value = order.date || '';
  document.getElementById('orderNotes').value = order.notes || '';
}

async function viewOrder(id) {
  var { data: o } = await db.from('orders').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!o) return;
  var patient = o.patients || {};
  var typeLabels = { lab: 'Laboratorio', imaging: 'Imagenología', procedure: 'Procedimiento', other: 'Otro' };
  var html = '<div style="background:var(--bg-secondary);padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(o.date) + '</p>';
  html += '<p><strong>Tipo:</strong> ' + (typeLabels[o.type] || o.type) + '</p>';
  html += '</div>';
  html += '<h4 style="margin-bottom:0.5rem;">Descripción:</h4>';
  html += '<p style="white-space:pre-line;">' + (o.description || '-') + '</p>';
  if (o.notes) html += '<p style="margin-top:1rem;"><strong>Indicaciones:</strong> ' + o.notes + '</p>';
  showDetailModal('Detalle de Orden', html);
}

async function deleteOrder(id) {
  showConfirm('Eliminar Orden', '¿Está seguro?', async function() {
    await db.from('orders').delete().eq('id', id);
    refreshOrders();
    showToast('success', 'Eliminada', 'Orden eliminada');
  });
}

function searchOrders() {
  var query = document.getElementById('orderSearchField').value.toLowerCase();
  document.querySelectorAll('#ordersTableBody tr').forEach(function(row) { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}
function filterOrders() { refreshOrders(); }

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var editId = document.getElementById('orderEditId').value;
      var data = {
        patient_id: document.getElementById('orderPatient').value,
        type: document.getElementById('orderType').value,
        description: document.getElementById('orderDescription').value,
        date: document.getElementById('orderDate').value || null,
        notes: document.getElementById('orderNotes').value,
        status: 'pendiente'
      };
      var error;
      if (editId) { ({ error } = await db.from('orders').update(data).eq('id', editId)); }
      else { ({ error } = await db.from('orders').insert(data)); }
      if (error) { showToast('error', 'Error', error.message); return; }
      closeOrderModal();
      refreshOrders();
      showToast('success', 'Guardada', editId ? 'Orden actualizada' : 'Orden creada');
    });
  }
});
