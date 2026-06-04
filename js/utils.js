// ===== UTILIDADES GENERALES =====

// Formato de fecha estándar del sistema: dd/mm/yyyy
function formatDate(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  var day = String(d.getDate()).padStart(2, '0');
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var year = d.getFullYear();
  return day + '/' + month + '/' + year;
}

// Formato largo: 04 de junio de 2026
function formatDateLong(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) d = new Date();
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function showToast(type, title, message) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<strong>' + title + '</strong><br>' + message + '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 4000);
}

function showConfirm(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').style.display = 'block';
  document.getElementById('confirmBtnOk').onclick = function() {
    closeConfirm();
    if (callback) callback();
  };
}

function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
}

// Populate a select with patients
function populatePatientSelect(selectId) {
  db.from('patients').select('id, name, lastname').order('name').then(function(result) {
    var patients = result.data || [];
    var select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Seleccionar paciente</option>';
    patients.forEach(function(p) {
      select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>';
    });
  });
}

// Placeholder functions
function searchMedicalRecords() { /* placeholder */ }

// Detail Modal
function showDetailModal(title, htmlContent) {
  document.getElementById('detailModalTitle').textContent = title;
  document.getElementById('detailModalContent').innerHTML = htmlContent;
  document.getElementById('detailModal').style.display = 'block';
}
function closeDetailModal() { document.getElementById('detailModal').style.display = 'none'; }
