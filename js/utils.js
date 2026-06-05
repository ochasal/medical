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
  if (!container) {
    console.error('Toast container not found');
    return;
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  
  // Crear la estructura esperada por el CSS
  var icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = 
    '<div class="toast-icon">' + (icons[type] || '•') + '</div>' +
    '<div class="toast-body">' +
      '<div class="toast-title">' + title + '</div>' +
      '<div class="toast-message">' + message + '</div>' +
    '</div>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
  
  container.appendChild(toast);
  
  // Agregar la clase show para que se muestre con la animación
  setTimeout(function() { toast.classList.add('show'); }, 10);
  
  // Remover después de 4 segundos
  setTimeout(function() { 
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
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

// Placeholder functions removed - real implementations in their respective modules

// Detail Modal
function showDetailModal(title, htmlContent) {
  document.getElementById('detailModalTitle').textContent = title;
  document.getElementById('detailModalContent').innerHTML = htmlContent;
  document.getElementById('detailModal').style.display = 'block';
}
function closeDetailModal() { document.getElementById('detailModal').style.display = 'none'; }

// Helper: obtener datos del doctor actual
async function getDoctorSignature() {
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) return null;
  
  var { data: doctor } = await db.from('doctors').select('*').eq('user_id', user.id).single();
  if (!doctor) return null;
  
  // Construir nombre con título
  var fullName = doctor.first_name + ' ' + doctor.last_name;
  if (doctor.professional_title) {
    fullName = doctor.professional_title + ' ' + fullName;
  }
  
  return {
    name: fullName,
    specialty: doctor.specialty || '',
    license: doctor.license_number || '',
    institution: doctor.institution || ''
  };
}
async function dbInsert(table, data) {
  data.user_id = getUserId();
  var result = await db.from(table).insert(data);
  if (result.error) {
    var msg = result.error.message;
    if (result.error.code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
      msg = 'Ya existe un registro con esos datos';
    } else if (result.error.code === '42501' || msg.includes('policy')) {
      msg = 'No tienes permiso para esta acción';
    }
    result.error.message = msg;
  }
  return result;
}

// Helper: update
async function dbUpdate(table, data, id) {
  return await db.from(table).update(data).eq('id', id);
}
