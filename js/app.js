// ===== INICIALIZACIÓN Y AUTH =====

var DEMO_USERS = [
  { email: 'admin@clinica.com', password: 'admin123', name: 'Dr. Admin', role: 'admin' },
  { email: 'doctor@clinica.com', password: 'doctor123', name: 'Dr. García', role: 'doctor' }
];

function login(email, password) {
  var user = DEMO_USERS.find(function(u) { return u.email === email && u.password === password; });
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('headerUserName').textContent = user.name;
    document.getElementById('dropdownUserName').textContent = user.name;
    document.getElementById('dropdownUserEmail').textContent = user.email;
    initApp();
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('currentUser');
  document.getElementById('loginScreen').style.display = 'flex';
}

function checkAuth() {
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('headerUserName').textContent = user.name;
    document.getElementById('dropdownUserName').textContent = user.name;
    document.getElementById('dropdownUserEmail').textContent = user.email;
    initApp();
  }
}

// ===== NAVEGACIÓN =====
function showView(viewName) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
  var view = document.getElementById(viewName + '-view');
  if (view) view.classList.add('active');
  var link = document.querySelector('[data-view="' + viewName + '"]');
  if (link) link.classList.add('active');
  if (viewName === 'patients') loadAllPatients();
  else if (viewName === 'appointments') loadAppointments();
  else if (viewName === 'prescriptions') refreshPrescriptions();
  else if (viewName === 'treatment-plans') refreshTreatmentPlans();
  else if (viewName === 'vital-signs') refreshVitalSigns();
  else if (viewName === 'recurring-appointments') refreshRecurringAppointments();
  else if (viewName === 'waiting-list') refreshWaitingList();
  else if (viewName === 'ai-insights') refreshAIInsights();
  else if (viewName === 'automation') refreshAutomationStatus();
  else if (viewName === 'offices') loadOffices();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('show');
}

function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var viewName = this.getAttribute('data-view');
      if (viewName) showView(viewName);
      if (window.innerWidth < 768) toggleSidebar();
    });
  });
}

// ===== DASHBOARD =====
async function refreshDashboard() {
  var { data: patients } = await supabase.from('patients').select('id');
  var { data: appointments } = await supabase.from('appointments').select('id, date, status');
  var { data: prescriptions } = await supabase.from('prescriptions').select('id, status');

  document.getElementById('totalPatients').textContent = patients ? patients.length : 0;
  var today = new Date().toISOString().split('T')[0];
  var todayCount = appointments ? appointments.filter(function(a) { return a.date === today; }).length : 0;
  document.getElementById('todayAppointments').textContent = todayCount;
  var activeRx = prescriptions ? prescriptions.filter(function(p) { return p.status === 'active'; }).length : 0;
  document.getElementById('activePrescriptions').textContent = activeRx;
}

// ===== BACKUP =====
async function exportAllData() {
  showToast('info', 'Backup', 'Descargando datos...');
  var backup = {};
  var tables = ['patients', 'appointments', 'consultations', 'prescriptions', 'treatment_plans', 'vital_signs', 'recurring_appointments', 'waiting_list', 'offices'];
  for (var i = 0; i < tables.length; i++) {
    var { data } = await supabase.from(tables[i]).select('*');
    backup[tables[i]] = data || [];
  }
  backup.timestamp = new Date().toISOString();
  var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'backup-sistema-medico-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('success', 'Backup', 'Descargado correctamente');
}

function importBackup(file) {
  if (!file) return;
  showToast('info', 'Info', 'La importación desde backup se implementará próximamente');
}

// ===== INIT =====
function initApp() {
  setupNavigation();
  refreshDashboard();
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();

  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value;
      var password = document.getElementById('loginPassword').value;
      if (!login(email, password)) {
        var err = document.getElementById('loginError');
        err.textContent = 'Email o contraseña incorrectos';
        err.style.display = 'block';
      }
    });
  }

  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
  });
});
