// ===== PERFIL Y TEMAS =====

function loadUserProfile() {
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) return;
  var nameEl = document.getElementById('userProfileName');
  var emailEl = document.getElementById('userProfileEmail');
  var roleEl = document.getElementById('userProfileRole');
  if (nameEl) nameEl.textContent = user.name || '-';
  if (emailEl) emailEl.textContent = user.email || '-';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : user.role === 'doctor' ? 'Doctor' : user.role;
}

function selectTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('selectedTheme', theme);
  // Highlight selected theme
  document.querySelectorAll('.theme-option').forEach(function(el) {
    el.style.borderColor = 'transparent';
  });
  event.currentTarget.style.borderColor = 'var(--accent-color)';
  showToast('success', 'Tema', 'Tema cambiado correctamente');
}

function loadTheme() {
  var saved = localStorage.getItem('selectedTheme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

// Load theme on page load
document.addEventListener('DOMContentLoaded', function() {
  loadTheme();
});
