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
  else if (viewName === 'offices') loadOffices();
  else if (viewName === 'user-profile') loadUserProfile();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
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
      if (window.innerWidth < 768) toggleSidebar();
    });
  });
}

// ===== DASHBOARD =====
async function refreshDashboard() {
  var { data: patients } = await db.from('patients').select('id');
  var { data: appointments } = await db.from('appointments').select('id, date, status');
  var { data: prescriptions } = await db.from('prescriptions').select('id, status');
  document.getElementById('totalPatients').textContent = patients ? patients.length : 0;
  var today = new Date().toISOString().split('T')[0];
  var todayCount = appointments ? appointments.filter(function(a) { return a.date === today; }).length : 0;
  document.getElementById('todayAppointments').textContent = todayCount;
  var activeRx = prescriptions ? prescriptions.filter(function(p) { return p.status === 'active'; }).length : 0;
  document.getElementById('activePrescriptions').textContent = activeRx;
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
