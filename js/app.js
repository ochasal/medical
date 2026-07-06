// ===== AUTH CON SUPABASE =====

var currentUser = null;

async function login(email, password) {
  var { data, error } = await db.auth.signInWithPassword({ email: email, password: password });
  if (error) {
    var errorMessages = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Debes confirmar tu email primero',
      'User not found': 'Usuario no encontrado',
      'Too many requests': 'Demasiados intentos, espera un momento'
    };
    return { error: errorMessages[error.message] || error.message };
  }
  currentUser = data.user;
  localStorage.setItem('currentUser', JSON.stringify({ email: data.user.email, name: data.user.user_metadata.name || email.split('@')[0], id: data.user.id }));
  showApp();
  initApp();
  return { success: true };
}

async function register(name, email, password) {
  var { data, error } = await db.auth.signUp({
    email: email,
    password: password,
    options: { data: { name: name } }
  });
  if (error) {
    var errorMessages = {
      'User already registered': 'Este email ya está registrado',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Unable to validate email address: invalid format': 'Formato de email inválido'
    };
    return { error: errorMessages[error.message] || error.message };
  }
  return { success: true, message: 'Cuenta creada. Revisa tu email para confirmar.' };
}

async function logout() {
  await db.auth.signOut();
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('loginScreen').style.display = 'flex';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.main-layout').style.display = 'none';
}

async function checkAuth() {
  var { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    localStorage.setItem('currentUser', JSON.stringify({ email: session.user.email, name: session.user.user_metadata.name || session.user.email.split('@')[0], id: session.user.id }));
    showApp();
    initApp();
  }
}

function showApp() {
  var user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  document.getElementById('loginScreen').style.display = 'none';
  document.querySelector('.header').style.display = 'block';
  document.querySelector('.main-layout').style.display = 'flex';
  document.getElementById('headerUserName').textContent = user.name || 'Doctor';
  document.getElementById('dropdownUserName').textContent = user.name || 'Doctor';
  document.getElementById('dropdownUserEmail').textContent = user.email || '';
}

function getUserId() {
  if (currentUser) return currentUser.id;
  var stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return stored.id || null;
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
  else if (viewName === 'dashboard') refreshDashboard();
  else if (viewName === 'appointments') loadAppointments();
  else if (viewName === 'prescriptions') refreshPrescriptions();
  else if (viewName === 'orders') refreshOrders();
  else if (viewName === 'rest') refreshRest();
  else if (viewName === 'referrals') refreshReferrals();
  else if (viewName === 'treatment-plans') refreshTreatmentPlans();
  else if (viewName === 'vital-signs') refreshVitalSigns();
  else if (viewName === 'recurring-appointments') refreshRecurringAppointments();
  else if (viewName === 'waiting-list') refreshWaitingList();
  else if (viewName === 'medical-reports') refreshMedicalReports();
  else if (viewName === 'medical-records') loadAllMedicalRecords();
  else if (viewName === 'offices') loadOffices();
  else if (viewName === 'user-profile') { loadUserProfile(); if (typeof loadCalendarProfileSettings === 'function') loadCalendarProfileSettings(); }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('show');
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
  var dropdown = document.getElementById('userDropdown');
  var userMenu = document.getElementById('userMenu');
  if (dropdown && userMenu && !userMenu.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var viewName = this.getAttribute('data-view');
      if (viewName) showView(viewName);
      if (window.innerWidth < 1024) toggleSidebar();
    });
  });
}

// ===== DASHBOARD =====

var _chartAppointments = null;
var _chartStatus = null;

async function refreshDashboard() {
  var { data: patients }     = await db.from('patients').select('id');
  var { data: appointments } = await db.from('appointments').select('id, date, status');
  var { data: prescriptions} = await db.from('prescriptions').select('id, status');

  // --- Contadores ---
  document.getElementById('totalPatients').textContent = patients ? patients.length : 0;

  var today = new Date().toISOString().split('T')[0];
  var apts  = appointments || [];
  var todayCount = apts.filter(function(a) { return a.date === today; }).length;
  document.getElementById('todayAppointments').textContent = todayCount;

  var activeRx = (prescriptions || []).filter(function(p) { return p.status === 'active'; }).length;
  document.getElementById('activePrescriptions').textContent = activeRx;

  // --- Gráfica 1: Citas por Día (últimos 14 días) ---
  var dayLabels = [], dayCounts = [];
  var shortDays = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  for (var i = 13; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var iso  = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var lbl  = shortDays[d.getDay()] + ' ' + d.getDate();
    dayLabels.push(lbl);
    dayCounts.push(apts.filter(function(a) { return a.date === iso; }).length);
  }

  var ctxA = document.getElementById('appointmentsChart');
  if (ctxA) {
    if (_chartAppointments) { _chartAppointments.destroy(); _chartAppointments = null; }
    _chartAppointments = new Chart(ctxA, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: 'Citas',
          data: dayCounts,
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderColor: 'rgba(99,102,241,1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // --- Gráfica 2: Estado de Citas ---
  var statusMap = { scheduled: 0, completed: 0, cancelled: 0, 'no-show': 0 };
  apts.forEach(function(a) {
    if (statusMap[a.status] !== undefined) statusMap[a.status]++;
    else statusMap.scheduled++;
  });

  var ctxS = document.getElementById('healthTrendsChart');
  if (ctxS) {
    if (_chartStatus) { _chartStatus.destroy(); _chartStatus = null; }
    _chartStatus = new Chart(ctxS, {
      type: 'doughnut',
      data: {
        labels: ['Programada', 'Completada', 'Cancelada', 'No asistió'],
        datasets: [{
          data: [statusMap.scheduled, statusMap.completed, statusMap.cancelled, statusMap['no-show']],
          backgroundColor: ['#6366f1','#22c55e','#ef4444','#f59e0b'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } }
        }
      }
    });
  }
}

// ===== BACKUP (Legacy - data in Supabase) =====
async function exportAllData() {
  showToast('info', 'Info', 'Los datos están seguros en Supabase. No es necesario hacer backup manual.');
}

// ===== INIT =====
function initApp() {
  setupNavigation();
  showView('dashboard');
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
  // Hide app until auth check
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.main-layout').style.display = 'none';

  checkAuth();

  // Login form
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value;
      var password = document.getElementById('loginPassword').value;
      var err = document.getElementById('loginError');
      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
      err.style.display = 'none';
      var result = await login(email, password);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
      if (result.error) {
        err.textContent = result.error;
        err.style.display = 'block';
      }
    });
  }

  // Register form
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var name = document.getElementById('registerName').value;
      var email = document.getElementById('registerEmail').value;
      var password = document.getElementById('registerPassword').value;
      var errEl = document.getElementById('registerError');
      var successEl = document.getElementById('registerSuccess');
      var btn = registerForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
      errEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';
      var result = await register(name, email, password);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear Cuenta';
      if (result.error) {
        errEl.textContent = result.error;
        errEl.style.display = 'block';
      } else {
        if (successEl) {
          successEl.textContent = result.message;
          successEl.style.display = 'block';
        } else {
          showToast('success', 'Cuenta creada', result.message);
        }
        registerForm.reset();
      }
    });
  }

  // Close modals on outside click
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
  });
});

function toggleAuthForm() {
  var loginSection = document.getElementById('loginSection');
  var registerSection = document.getElementById('registerSection');
  if (loginSection.style.display === 'none') {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
  } else {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
  }
}
