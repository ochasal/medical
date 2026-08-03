// ===== ÓRDENES MÉDICAS (Supabase) =====

/* ─── PATIENT SEARCH PANEL (Order Modal) ─── */
var _orderAllPatients = [];
var _orderRecentPtIds = [];

function _orderPtRowHtml(p, q) {
  var col = _apptPtColor(p.id);
  var ts  = p.last_visit ? _apptFmtLastVisit(p.last_visit) : '';
  return '<div onclick="_orderSelectPatient(\'' + p.id + '\')" style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.85rem;cursor:pointer;border-bottom:1px solid var(--border-color);" onmouseover="this.style.background=\'var(--hover-bg,rgba(0,0,0,.04))\'" onmouseout="this.style.background=\'\'">' +
    '<div style="width:32px;height:32px;border-radius:50%;background:' + col + ';display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:#fff;flex-shrink:0;">' + _apptPtInitials(p) + '</div>' +
    '<div style="min-width:0;flex:1;">' +
      '<div style="font-size:0.83rem;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _apptPtHighlight(_apptPtFullName(p), q) + '</div>' +
      '<div style="font-size:0.72rem;color:var(--text-secondary);margin-top:1px;">' + _apptPtHighlight('C.I. ' + (p.patient_id||'—'), q) + '</div>' +
    '</div>' +
    (ts ? '<div style="font-size:0.71rem;color:var(--text-secondary);white-space:nowrap;flex-shrink:0;padding-left:0.4rem;">' + ts + '</div>' : '') +
  '</div>';
}

function _orderRenderPtPanel(q) {
  var el = document.getElementById('orderPtPanelContent');
  if (!el) return;
  var label = '<div style="padding:0.32rem 0.85rem 0.12rem;font-size:0.67rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);">';
  if (q) {
    var t = q.toLowerCase();
    var res = _orderAllPatients.filter(function(p) {
      var full = _apptPtFullName(p).toLowerCase();
      var ci   = (p.patient_id||'').replace(/\./g,'');
      return full.includes(t) || ci.includes(t.replace(/\./g,''));
    });
    el.innerHTML = res.length
      ? label + res.length + ' resultado' + (res.length !== 1 ? 's' : '') + '</div>' + res.map(function(p) { return _orderPtRowHtml(p, q); }).join('')
      : '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">Sin resultados para "<strong>' + q + '</strong>"</div>';
  } else {
    var rec    = _orderRecentPtIds.map(function(id) { return _orderAllPatients.find(function(p) { return p.id === id; }); }).filter(Boolean);
    var recIds = rec.map(function(p) { return p.id; });
    var rest   = _orderAllPatients.filter(function(p) { return !recIds.includes(p.id); });
    var html   = '';
    if (rec.length)  html += label + 'Recientes</div>'           + rec.map(function(p) { return _orderPtRowHtml(p, ''); }).join('');
    if (rest.length) html += label + 'Todos los pacientes</div>' + rest.map(function(p) { return _orderPtRowHtml(p, ''); }).join('');
    if (!html)       html  = '<div style="padding:0.85rem;text-align:center;font-size:0.8rem;color:var(--text-secondary);">No hay pacientes registrados aún</div>';
    el.innerHTML = html;
  }
}

function _orderOpenPtPanel() {
  _orderRenderPtPanel(document.getElementById('orderPtInput').value.trim());
  document.getElementById('orderPtPanel').style.display = 'block';
}

function _orderOnPtInput() {
  _orderRenderPtPanel(document.getElementById('orderPtInput').value.trim());
  document.getElementById('orderPtPanel').style.display = 'block';
}

function _orderSelectPatient(id) {
  var p = _orderAllPatients.find(function(x) { return String(x.id) === String(id); });
  if (!p) return;
  _orderRecentPtIds = [p.id].concat(_orderRecentPtIds.filter(function(x) { return x !== p.id; })).slice(0, 3);
  document.getElementById('orderPatient').value            = p.id;
  document.getElementById('orderPtPanel').style.display    = 'none';
  document.getElementById('orderPtTrigger').style.display  = 'none';
  var sel = document.getElementById('orderPtSelected');
  sel.style.display = 'flex';
  document.getElementById('orderPtSelAv').style.background = _apptPtColor(p.id);
  document.getElementById('orderPtSelAv').textContent      = _apptPtInitials(p);
  document.getElementById('orderPtSelName').textContent    = _apptPtFullName(p);
  document.getElementById('orderPtSelMeta').textContent    = 'C.I. ' + (p.patient_id || '—');
}

function _orderClearPatient() {
  document.getElementById('orderPatient').value             = '';
  document.getElementById('orderPtTrigger').style.display   = '';
  document.getElementById('orderPtSelected').style.display  = 'none';
  document.getElementById('orderPtInput').value             = '';
  document.getElementById('orderPtPanel').style.display     = 'none';
}

async function openNewOrderModal() {
  var [ptRes, visitRes] = await Promise.all([
    db.from('patients').select('id, name, lastname, patient_id').order('name'),
    db.from('orders').select('patient_id, date').order('date', { ascending: false })
  ]);
  var lastVisitMap = {};
  var recentIds = [];
  (visitRes.data || []).forEach(function(v) {
    if (!lastVisitMap[v.patient_id]) {
      lastVisitMap[v.patient_id] = v.date || null;
      if (recentIds.length < 3) recentIds.push(v.patient_id);
    }
  });
  _orderRecentPtIds = recentIds;
  _orderAllPatients = (ptRes.data || []).map(function(p) {
    return Object.assign({}, p, { last_visit: lastVisitMap[p.id] || null });
  });
  document.getElementById('orderForm').reset();
  document.getElementById('orderEditId').value = '';
  document.getElementById('orderModalTitle').textContent = 'Nueva Orden Médica';
  document.getElementById('orderDate').valueAsDate = new Date();
  _orderClearPatient();
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
  _orderSelectPatient(order.patient_id);
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
function filterOrders() {
  var status = document.getElementById('orderStatusFilter') ? document.getElementById('orderStatusFilter').value : '';
  var rows = document.querySelectorAll('#ordersTableBody tr');
  rows.forEach(function(row) {
    if (!status) { row.style.display = ''; return; }
    row.style.display = row.textContent.toLowerCase().includes(status.toLowerCase()) ? '' : 'none';
  });
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
  // Close patient panel when clicking outside
  document.addEventListener('click', function(e) {
    var wrap = document.getElementById('orderPtSearchWrap');
    var panel = document.getElementById('orderPtPanel');
    if (wrap && panel && !wrap.contains(e.target)) panel.style.display = 'none';
  });

  var form = document.getElementById('orderForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!document.getElementById('orderPatient').value) {
        showToast('error', 'Error', 'Selecciona un paciente');
        return;
      }
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
      else { { var result = await dbInsert('orders', data); error = result.error; } }
      if (error) { 
        var errorMsg = error.message || 'Error al guardar la orden';
        showToast('error', 'Error', errorMsg); 
        return; 
      }
      closeOrderModal();
      refreshOrders();
      showToast('success', 'Guardada', editId ? 'Orden actualizada' : 'Orden creada');
    });
  }
});
