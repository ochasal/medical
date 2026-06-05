// ===== PERFIL Y TEMAS =====

var currentDoctorProfile = null;

async function loadUserProfile() {
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) return;
  
  // Mostrar info básica
  var nameEl = document.getElementById('userProfileName');
  var emailEl = document.getElementById('userProfileEmail');
  if (nameEl) nameEl.textContent = user.name || '-';
  if (emailEl) emailEl.textContent = user.email || '-';
  
  // Cargar perfil del doctor desde Supabase
  var { data: doctor, error } = await db.from('doctors').select('*').eq('user_id', user.id).single();
  
  if (!error && doctor) {
    currentDoctorProfile = doctor;
    displayDoctorProfile(doctor);
  } else {
    // Si no existe perfil, mostrar formulario vacío
    displayDoctorProfile(null);
  }
}

function displayDoctorProfile(doctor) {
  var container = document.getElementById('doctorProfileContainer');
  if (!container) return;
  
  doctor = doctor || {};
  
  var html = '<div class="profile-section">' +
    '<h3>Información Profesional</h3>' +
    '<div class="form-grid">' +
      '<div class="form-group">' +
        '<label>Nombre *</label>' +
        '<input type="text" id="doctorFirstName" value="' + (doctor.first_name || '') + '" placeholder="Nombre" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Apellido *</label>' +
        '<input type="text" id="doctorLastName" value="' + (doctor.last_name || '') + '" placeholder="Apellido" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Especialidad *</label>' +
        '<input type="text" id="doctorSpecialty" value="' + (doctor.specialty || '') + '" placeholder="Ej: Medicina General" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Título Profesional</label>' +
        '<input type="text" id="doctorTitle" value="' + (doctor.professional_title || '') + '" placeholder="Ej: MD, Licenciado" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Número de Licencia</label>' +
        '<input type="text" id="doctorLicense" value="' + (doctor.license_number || '') + '" placeholder="Número de licencia médica" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Años de Experiencia</label>' +
        '<input type="number" id="doctorYearsExp" value="' + (doctor.years_experience || '') + '" placeholder="Ej: 10" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Institución</label>' +
        '<input type="text" id="doctorInstitution" value="' + (doctor.institution || '') + '" placeholder="Hospital/Clínica" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Teléfono</label>' +
        '<input type="tel" id="doctorPhone" value="' + (doctor.phone || '') + '" placeholder="Teléfono" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Email Profesional</label>' +
        '<input type="email" id="doctorEmail" value="' + (doctor.email || '') + '" placeholder="Email" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Dirección</label>' +
        '<input type="text" id="doctorAddress" value="' + (doctor.address || '') + '" placeholder="Dirección del consultorio" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Ciudad</label>' +
        '<input type="text" id="doctorCity" value="' + (doctor.city || '') + '" placeholder="Ciudad" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>País</label>' +
        '<input type="text" id="doctorCountry" value="' + (doctor.country || '') + '" placeholder="País" />' +
      '</div>' +
    '</div>' +
    '<div style="margin-top: 1rem;">' +
      '<button class="btn btn-primary" onclick="saveDoctorProfile()" style="width: 100%;">' +
        '<i class="fas fa-save"></i> Guardar Perfil Profesional' +
      '</button>' +
    '</div>' +
  '</div>';
  
  container.innerHTML = html;
}

async function saveDoctorProfile() {
  var user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user) return;
  
  var profileData = {
    first_name: document.getElementById('doctorFirstName').value,
    last_name: document.getElementById('doctorLastName').value,
    specialty: document.getElementById('doctorSpecialty').value,
    professional_title: document.getElementById('doctorTitle').value,
    license_number: document.getElementById('doctorLicense').value,
    years_experience: parseInt(document.getElementById('doctorYearsExp').value) || null,
    institution: document.getElementById('doctorInstitution').value,
    phone: document.getElementById('doctorPhone').value,
    email: document.getElementById('doctorEmail').value,
    address: document.getElementById('doctorAddress').value,
    city: document.getElementById('doctorCity').value,
    country: document.getElementById('doctorCountry').value
  };
  
  // Validar campos requeridos
  if (!profileData.first_name || !profileData.last_name || !profileData.specialty) {
    showToast('error', 'Error', 'Por favor completa los campos requeridos (Nombre, Apellido, Especialidad)');
    return;
  }
  
  var error;
  
  if (currentDoctorProfile) {
    // Si existe, actualizar
    ({ error } = await db.from('doctors').update(profileData).eq('id', currentDoctorProfile.id));
  } else {
    // Si no existe, insertar con user_id
    profileData.user_id = user.id;
    var result = await db.from('doctors').insert(profileData);
    error = result.error;
    if (!error && result.data && result.data.length > 0) {
      currentDoctorProfile = result.data[0];
    }
  }
  
  if (error) {
    var errorMsg = 'Error al guardar el perfil';
    
    // Manejo de errores específicos
    if (error.code === '23505' || error.message.includes('duplicate')) {
      // Si el error es de duplicado, intentar actualizar
      if (!currentDoctorProfile) {
        var { data: existing } = await db.from('doctors').select('id').eq('user_id', user.id).single();
        if (existing) {
          currentDoctorProfile = existing;
          ({ error } = await db.from('doctors').update(profileData).eq('id', existing.id));
        }
      }
    }
    
    if (error) {
      errorMsg = error.message || errorMsg;
      showToast('error', 'Error', errorMsg);
      return;
    }
  }
  
  showToast('success', 'Guardado', 'Perfil profesional actualizado');
  loadUserProfile();
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
