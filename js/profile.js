// ===== PERFIL Y TEMAS =====

var currentDoctorProfile = null;

var _COUNTRIES = [
  'Venezuela','Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh',
  'Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea',
  'Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
  'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti',
  'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos',
  'Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco',
  'Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua',
  'Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
  'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia',
  'Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain',
  'Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia',
  'Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Vietnam','Yemen',
  'Zambia','Zimbabwe'
];

function _updateProfileHeader() {
  var first = (document.getElementById('doctorFirstName') || {}).value || '';
  var last  = (document.getElementById('doctorLastName')  || {}).value || '';
  var full  = [first, last].filter(Boolean).join(' ');
  var el = document.getElementById('userProfileName');
  if (el) el.textContent = full ? 'Dr ' + full : '-';
}

function _countryOptions(selected) {
  var val = selected || 'Venezuela';
  return _COUNTRIES.map(function(c) {
    return '<option value="' + c + '"' + (c === val ? ' selected' : '') + '>' + c + '</option>';
  }).join('');
}

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
    var fullName = [doctor.first_name, doctor.last_name].filter(Boolean).join(' ');
    if (nameEl && fullName) nameEl.textContent = 'Dr ' + fullName;
    displayDoctorProfile(doctor);
    _sfLoadJson(doctor.schedule || null);
  } else {
    displayDoctorProfile(null);
  }
  renderScheduleSection();
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
        '<input type="text" id="doctorFirstName" value="' + (doctor.first_name || '') + '" placeholder="Nombre" oninput="_updateProfileHeader()" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Apellido *</label>' +
        '<input type="text" id="doctorLastName" value="' + (doctor.last_name || '') + '" placeholder="Apellido" oninput="_updateProfileHeader()" />' +
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
        '<select id="doctorCountry">' + _countryOptions(doctor.country) + '</select>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:1rem;display:flex;justify-content:flex-end;">' +
      '<button class="btn btn-primary" onclick="saveDoctorProfile()">' +
        '<i class="fas fa-save"></i> Guardar' +
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
  
  var nameEl = document.getElementById('userProfileName');
  if (nameEl && profileData.first_name) {
    nameEl.textContent = 'Dr ' + profileData.first_name + ' ' + (profileData.last_name || '');
  }
  showToast('success', 'Guardado', 'Perfil profesional actualizado');
  loadUserProfile();
}

// ===== HORARIOS DE ATENCIÓN =====

var _schedState = {
  consultDuration: 30,
  days: [
    { key: 'monday',    name: 'Lunes',     on: false, blocks: [] },
    { key: 'tuesday',   name: 'Martes',    on: false, blocks: [] },
    { key: 'wednesday', name: 'Miércoles', on: false, blocks: [] },
    { key: 'thursday',  name: 'Jueves',    on: false, blocks: [] },
    { key: 'friday',    name: 'Viernes',   on: false, blocks: [] },
    { key: 'saturday',  name: 'Sábado',    on: false, blocks: [] },
    { key: 'sunday',    name: 'Domingo',   on: false, blocks: [] }
  ]
};

function _sf12(min) {
  var h24 = Math.floor(min / 60) % 24, m = min % 60;
  var p = h24 >= 12 ? 'PM' : 'AM';
  var h = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + p;
}

function _sfHours(min) {
  var h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return min + ' min';
  if (m === 0) return h + (h === 1 ? ' hora' : ' horas');
  return h + 'h ' + m + 'min';
}

function _sfInOther(min, blocks, excl) {
  return blocks.some(function(b, bi) { return bi !== excl && min >= b.s && min < b.e; });
}

function _sfStep() {
  return _schedState.consultDuration || 15;
}

function _sfStartOpts(sel, blocks, excl) {
  var step = _sfStep();
  var html = '';
  for (var m = 300; m <= 1350; m += step) {
    if (!_sfInOther(m, blocks, excl))
      html += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + _sf12(m) + '</option>';
  }
  return html;
}

function _sfEndOpts(sel, startMin, blocks, excl) {
  var step = _sfStep();
  var ceil = 1440;
  blocks.forEach(function(b, bi) { if (bi !== excl && b.s > startMin && b.s < ceil) ceil = b.s; });
  var html = '';
  for (var m = 300 + step; m <= 1380; m += step) {
    if (m <= startMin || m > ceil) continue;
    html += '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + _sf12(m) + '</option>';
  }
  return html;
}

function _sfRenderDays() {
  var el = document.getElementById('schedDaysList');
  if (!el) return;
  var last = _schedState.days.length - 1;
  el.innerHTML = _schedState.days.map(function(day, di) {
    var totalMin = day.blocks.reduce(function(a, b) { return a + Math.max(0, b.e - b.s); }, 0);
    var summary = day.blocks.length
      ? day.blocks.length + (day.blocks.length === 1 ? ' bloque' : ' bloques') + ' · ' + _sfHours(totalMin) : '';
    var borderBottom = di < last ? 'border-bottom:1px solid var(--border-color);' : '';

    var cards = '';
    if (day.on) {
      cards = day.blocks.map(function(b, bi) {
        return '<div style="display:flex;align-items:flex-end;gap:0.55rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:0.55rem 0.75rem;flex-wrap:wrap;margin-bottom:0.4rem;">' +
          '<div style="display:flex;flex-direction:column;gap:0.1rem;">' +
            '<span style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-secondary);">Desde</span>' +
            '<select style="padding:0.3rem 0.45rem;border:1.5px solid var(--border-color);border-radius:6px;font-size:0.78rem;color:var(--text-primary);background:var(--bg-primary);font-variant-numeric:tabular-nums;cursor:pointer;" onchange="_sfUpdStart(' + di + ',' + bi + ',this.value)">' +
              _sfStartOpts(b.s, day.blocks, bi) +
            '</select></div>' +
          '<span style="color:var(--text-secondary);font-size:0.8rem;padding-bottom:0.35rem;flex-shrink:0;">→</span>' +
          '<div style="display:flex;flex-direction:column;gap:0.1rem;">' +
            '<span style="font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-secondary);">Hasta</span>' +
            '<select style="padding:0.3rem 0.45rem;border:1.5px solid var(--border-color);border-radius:6px;font-size:0.78rem;color:var(--text-primary);background:var(--bg-primary);font-variant-numeric:tabular-nums;cursor:pointer;" onchange="_sfUpdEnd(' + di + ',' + bi + ',this.value)">' +
              _sfEndOpts(b.e, b.s, day.blocks, bi) +
            '</select></div>' +
          '<button type="button" onclick="_sfDelBlock(' + di + ',' + bi + ')" title="Quitar bloque" style="margin-left:auto;align-self:center;width:24px;height:24px;border-radius:50%;background:none;border:1.5px solid var(--border-color);color:var(--text-secondary);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">×</button>' +
        '</div>';
      }).join('');

      if (day.blocks.length < 6) {
        cards += '<button type="button" onclick="_sfAddBlock(' + di + ')" style="display:inline-flex;align-items:center;gap:0.3rem;background:none;border:1.5px dashed var(--border-color);border-radius:var(--radius-md);padding:0.32rem 0.65rem;font-size:0.75rem;color:var(--text-secondary);cursor:pointer;">+ Agregar bloque</button>';
      }
    }

    return '<div style="' + borderBottom + '">' +
      '<div onclick="_sfToggle(' + di + ')" style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;padding:0.65rem 1rem;user-select:none;">' +
        '<div style="width:34px;height:19px;border-radius:10px;background:' + (day.on ? 'var(--accent-color)' : 'var(--border-color)') + ';position:relative;transition:background 0.18s;flex-shrink:0;">' +
          '<div style="width:15px;height:15px;border-radius:50%;background:#fff;position:absolute;top:2px;left:' + (day.on ? '17px' : '2px') + ';transition:left 0.18s;box-shadow:0 1px 3px rgba(0,0,0,0.22);"></div>' +
        '</div>' +
        '<span style="font-size:0.88rem;font-weight:700;color:' + (day.on ? 'var(--text-primary)' : 'var(--text-secondary)') + ';flex:1;">' + day.name + '</span>' +
        (day.on && summary ? '<span style="font-size:0.7rem;color:var(--text-secondary);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:20px;padding:0.12rem 0.5rem;">' + summary + '</span>' : '') +
      '</div>' +
      (day.on ? '<div style="padding:0 1rem 0.75rem 3.5rem;">' + cards + '</div>' : '') +
    '</div>';
  }).join('');
}

function _sfToggle(di) {
  _schedState.days[di].on = !_schedState.days[di].on;
  if (_schedState.days[di].on && !_schedState.days[di].blocks.length)
    _schedState.days[di].blocks = [{s: 480, e: 600}];
  _sfRenderDays();
}

function _sfAddBlock(di) {
  var day = _schedState.days[di];
  if (day.blocks.length >= 6) return;
  var sorted = day.blocks.slice().sort(function(a, b) { return a.s - b.s; });
  var cand = sorted.length ? sorted[sorted.length - 1].e + 30 : 480;
  if (cand > 1260) cand = 480;
  while (_sfInOther(cand, day.blocks, -1) && cand <= 1350) cand += 30;
  var newEnd = cand + 120;
  day.blocks.forEach(function(b) { if (b.s > cand && b.s < newEnd) newEnd = b.s; });
  day.blocks.push({s: cand, e: Math.min(newEnd, 1380)});
  _sfRenderDays();
}

function _sfDelBlock(di, bi) {
  _schedState.days[di].blocks.splice(bi, 1);
  _sfRenderDays();
}

function _sfUpdStart(di, bi, v) {
  var newS = parseInt(v);
  _schedState.days[di].blocks[bi].s = newS;
  var b = _schedState.days[di].blocks[bi];
  if (b.e <= newS) {
    b.e = newS + 120;
    _schedState.days[di].blocks.forEach(function(ob, oi) {
      if (oi !== bi && ob.s > newS && ob.s < b.e) b.e = ob.s;
    });
    b.e = Math.min(b.e, 1380);
  }
  _sfRenderDays();
}

function _sfUpdEnd(di, bi, v) {
  _schedState.days[di].blocks[bi].e = parseInt(v);
  _sfRenderDays();
}

function _sfChangeDuration() {
  var sel = document.getElementById('schedConsultDuration');
  if (sel) {
    _schedState.consultDuration = parseInt(sel.value) || 30;
    _sfRenderDays(); // re-render blocks so Desde/Hasta use updated step
  }
}

function _sfLoadJson(json) {
  if (!json) return;
  _schedState.consultDuration = parseInt(json.consultDuration) || 30;
  if (json.days) {
    _schedState.days.forEach(function(day) {
      var saved = json.days[day.key];
      if (saved) {
        day.on = !!saved.active;
        day.blocks = (saved.blocks || []).map(function(b) { return {s: b.s, e: b.e}; });
      } else {
        day.on = false; day.blocks = [];
      }
    });
  }
}

function _sfToJson() {
  var result = { consultDuration: _schedState.consultDuration, days: {} };
  _schedState.days.forEach(function(day) {
    result.days[day.key] = { active: day.on, blocks: day.blocks.map(function(b) { return {s: b.s, e: b.e}; }) };
  });
  return result;
}

function renderScheduleSection() {
  var container = document.getElementById('doctorScheduleContainer');
  if (!container) return;
  var cd = _schedState.consultDuration;
  var durOpts = [[15,'15 minutos'],[20,'20 minutos'],[30,'30 minutos'],[45,'45 minutos'],[60,'1 hora'],[90,'1 hora 30 min']].map(function(d) {
    return '<option value="' + d[0] + '"' + (d[0] === cd ? ' selected' : '') + '>' + d[1] + '</option>';
  }).join('');

  container.innerHTML = '<div class="profile-section">' +
    '<h3>Horarios de Atención</h3>' +
    '<p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:1rem;">Define tus bloques disponibles por día. Solo esas horas aparecerán al agendar una cita.</p>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.75rem 0;border-bottom:1px solid var(--border-color);margin-bottom:0.5rem;">' +
      '<div><strong style="font-size:0.85rem;color:var(--text-primary);">Duración por consulta</strong><br>' +
      '<span style="font-size:0.74rem;color:var(--text-secondary);">Intervalo entre citas agendadas</span></div>' +
      '<select id="schedConsultDuration" onchange="_sfChangeDuration()" style="padding:0.38rem 0.65rem;border:1.5px solid var(--border-color);border-radius:7px;font-size:0.81rem;color:var(--text-primary);background:var(--bg-primary);cursor:pointer;">' + durOpts + '</select>' +
    '</div>' +
    '<div id="schedDaysList" style="border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;margin-top:0.75rem;"></div>' +
    '<div style="display:flex;justify-content:flex-end;margin-top:1rem;">' +
      '<button type="button" class="btn btn-primary" onclick="saveSchedule()"><i class="fas fa-save"></i> Guardar horarios</button>' +
    '</div>' +
  '</div>';

  _sfRenderDays();
}

async function saveSchedule() {
  if (!currentDoctorProfile) {
    showToast('error', 'Error', 'Primero guarda tu perfil profesional antes de configurar horarios');
    return;
  }
  // Always read duration from DOM to avoid stale state
  var durSel = document.getElementById('schedConsultDuration');
  if (durSel) _schedState.consultDuration = parseInt(durSel.value) || 30;
  var schedJson = _sfToJson();
  var { error } = await db.from('doctors').update({ schedule: schedJson }).eq('id', currentDoctorProfile.id);
  if (error) { showToast('error', 'Error', error.message || 'No se pudo guardar el horario'); return; }
  currentDoctorProfile.schedule = schedJson;
  showToast('success', 'Guardado', 'Horario de atención actualizado');
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
