// ===== UTILIDADES GENERALES =====

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
  var patients = JSON.parse(localStorage.getItem('patients') || '{}');
  var select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar paciente</option>';
  Object.values(patients).forEach(function(p) {
    select.innerHTML += '<option value="' + p.id + '">' + p.name + ' ' + p.lastname + '</option>';
  });
}
