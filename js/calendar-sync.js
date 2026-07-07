// ===== SINCRONIZACIÓN DE CALENDARIO (webcal + Supabase Storage) =====

var CALENDAR_BUCKET = 'calendars';

function _calFileName() {
  return 'calendar-' + (getUserId() || 'user') + '.ics';
}

// ── Generar contenido ICS ─────────────────────────────────────
async function _generateICSContent() {
  var { data: apts } = await db.from('appointments')
    .select('*, patients(name, lastname)')
    .in('status', ['scheduled', 'completed', 'cancelled', 'deleted'])
    .order('date', { ascending: true });

  var now = new Date();
  var stamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CitasMedicas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mis Citas Médicas',
    'REFRESH-INTERVAL;VALUE=DURATION:PT5M',
    'X-PUBLISHED-TTL:PT5M'
  ];

  (apts || []).forEach(function(apt) {
    var p    = apt.patients || {};
    var name = ((p.name || '') + ' ' + (p.lastname || '')).trim() || 'Paciente';
    if (!apt.date) return;

    var dateParts = apt.date.split('-');
    var timeHHMM  = (apt.time || '08:00').substring(0, 5).split(':');
    var startDt   = new Date(
      parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]),
      parseInt(timeHHMM[0]), parseInt(timeHHMM[1]), 0
    );
    var endDt = new Date(startDt.getTime() + 60 * 60 * 1000);

    var toICS = function(d) {
      return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    };

    var desc = (apt.type ? 'Tipo: ' + apt.type : '') +
               (apt.notes ? '\\nNotas: ' + apt.notes : '');
    var status = (apt.status === 'cancelled' || apt.status === 'deleted') ? 'CANCELLED' : 'CONFIRMED';

    lines.push(
      'BEGIN:VEVENT',
      'UID:citasmedicas-' + apt.id + '@app',
      'DTSTAMP:' + stamp,
      'DTSTART:' + toICS(startDt),
      'DTEND:' + toICS(endDt),
      'SUMMARY:Cita: ' + name,
      'DESCRIPTION:' + desc,
      'STATUS:' + status,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ── Publicar ICS en Supabase Storage ─────────────────────────
async function publishCalendar() {
  var userId = getUserId();
  if (!userId) return null;
  try {
    var content  = await _generateICSContent();
    var fileName = _calFileName();
    var blob     = new Blob([content], { type: 'text/calendar;charset=utf-8' });

    // Eliminar archivo anterior para forzar subida limpia sin caché
    await db.storage.from(CALENDAR_BUCKET).remove([fileName]);

    var { error } = await db.storage
      .from(CALENDAR_BUCKET)
      .upload(fileName, blob, {
        contentType: 'text/calendar;charset=utf-8',
        cacheControl: '0'
      });

    if (error) {
      console.error('Calendar publish error:', error.message);
      showToast('error', 'Calendario', 'No se pudo actualizar: ' + error.message);
      return null;
    }

    var { data } = db.storage.from(CALENDAR_BUCKET).getPublicUrl(fileName);
    var publicUrl = data.publicUrl;
    localStorage.setItem('calendarPublicUrl_' + userId, publicUrl);
    showToast('info', 'Calendario', 'Calendario actualizado en la nube');
    return publicUrl;
  } catch(e) {
    console.error('publishCalendar:', e);
    showToast('error', 'Calendario', 'Error al actualizar el calendario');
    return null;
  }
}

// ── Obtener URL guardada ──────────────────────────────────────
function getSavedCalendarUrl() {
  var userId = getUserId();
  if (!userId) return null;
  return localStorage.getItem('calendarPublicUrl_' + userId) || null;
}

// ── Mostrar URL en Mi Perfil ──────────────────────────────────
function _showCalendarUrl(url) {
  var container   = document.getElementById('calendarUrlContainer');
  var input       = document.getElementById('calendarSubscribeUrl');
  var iphoneBtn   = document.getElementById('calendarIphoneBtn');
  var androidBtn  = document.getElementById('calendarAndroidBtn');
  var verifyBtn   = document.getElementById('calendarVerifyBtn');
  var webcalUrl   = url.replace(/^https?:\/\//, 'webcal://');
  if (container)  container.style.display = '';
  if (input)      input.value = webcalUrl;
  if (iphoneBtn)  iphoneBtn.href = webcalUrl;
  if (verifyBtn)  verifyBtn.href = url;
  // Android: guardar la URL https:// para copiarla al abrir Google Calendar
  if (androidBtn) androidBtn.dataset.httpsUrl = url;
}

// Copia la URL https:// antes de abrir Google Calendar (para Android)
function copyCalendarHttpsUrl() {
  var btn = document.getElementById('calendarAndroidBtn');
  var httpsUrl = btn ? btn.dataset.httpsUrl : '';
  if (!httpsUrl) {
    var input = document.getElementById('calendarSubscribeUrl');
    httpsUrl = input ? input.value.replace(/^webcal:\/\//, 'https://') : '';
  }
  if (!httpsUrl) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(httpsUrl).then(function() {
      showToast('info', 'Android', 'Enlace copiado — pégalo en Google Calendar');
    });
  }
}

function loadCalendarProfileSettings() {
  var url = getSavedCalendarUrl();
  if (url) _showCalendarUrl(url);
  else {
    var container = document.getElementById('calendarUrlContainer');
    if (container) container.style.display = 'none';
  }
}

// ── Configurar por primera vez ────────────────────────────────
async function setupCalendarSync() {
  var btn = document.getElementById('calendarSetupBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...'; }

  var url = await publishCalendar();

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar enlace'; }

  if (url) {
    _showCalendarUrl(url);
    showToast('success', 'Listo', 'Enlace de calendario generado. Suscríbete desde tu iPhone.');
  } else {
    showToast('error', 'Error', 'No se pudo generar el enlace. Verifica que el bucket "calendars" exista en Supabase Storage como público.');
  }
}

// ── Copiar enlace ─────────────────────────────────────────────
function copyCalendarUrl() {
  var input = document.getElementById('calendarSubscribeUrl');
  if (!input || !input.value) return;
  // input.value ya contiene webcal://
  if (navigator.clipboard) {
    navigator.clipboard.writeText(input.value).then(function() {
      showToast('success', 'Copiado', 'Enlace copiado — pégalo en Safari de tu iPhone y ábrelo');
    });
  } else {
    input.select();
    document.execCommand('copy');
    showToast('success', 'Copiado', 'Enlace copiado');
  }
}

// ── Descarga manual .ics (Apple Calendar, Outlook) ───────────
async function downloadICS() {
  var content = await _generateICSContent();
  var blob    = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  var url     = URL.createObjectURL(blob);
  var a       = document.createElement('a');
  a.href = url; a.download = 'citas-medicas.ics'; a.click();
  URL.revokeObjectURL(url);
}

// ── Stub de compatibilidad (appointments.js los llama) ────────
function syncAppointmentToCalendar() { publishCalendar(); return Promise.resolve(true); }
function deleteAppointmentFromCalendar() { publishCalendar(); }
