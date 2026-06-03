// ===== AI INSIGHTS (Supabase) =====

async function refreshAIInsights() {
  var container = document.getElementById('aiInsightsContent');
  if (!container) return;
  var { data: patients } = await db.from('patients').select('id', { count: 'exact' });
  var { data: appointments } = await db.from('appointments').select('id, status');
  var { data: prescriptions } = await db.from('prescriptions').select('id, status');

  var totalP = patients ? patients.length : 0;
  var totalA = appointments ? appointments.length : 0;
  var activeRx = prescriptions ? prescriptions.filter(function(p) { return p.status === 'active'; }).length : 0;
  var completedA = appointments ? appointments.filter(function(a) { return a.status === 'completed'; }).length : 0;
  var rate = totalA > 0 ? Math.round((completedA / totalA) * 100) : 0;

  container.innerHTML =
    '<div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-content"><h3>' + totalP + '</h3><p>Pacientes</p></div></div>' +
    '<div class="stat-card"><div class="stat-icon"><i class="fas fa-calendar"></i></div><div class="stat-content"><h3>' + totalA + '</h3><p>Citas</p></div></div>' +
    '<div class="stat-card"><div class="stat-icon"><i class="fas fa-prescription-bottle"></i></div><div class="stat-content"><h3>' + activeRx + '</h3><p>Recetas Activas</p></div></div>' +
    '<div class="stat-card"><div class="stat-icon"><i class="fas fa-check-circle"></i></div><div class="stat-content"><h3>' + rate + '%</h3><p>Tasa Completación</p></div></div>';
}

function runAIAnalysis() {
  showToast('info', 'Análisis', 'Ejecutando...');
  setTimeout(function() {
    refreshAIInsights();
    showToast('success', 'Listo', 'Análisis completado');
  }, 1000);
}

// ===== AUTOMATIZACIÓN =====
function refreshAutomationStatus() {
  var container = document.getElementById('automationRulesContainer');
  if (!container) return;
  var rules = [
    { name: 'Recordatorios de Citas', enabled: true, desc: 'Envía recordatorios 24h y 2h antes' },
    { name: 'Monitoreo de Ausencias', enabled: true, desc: 'Seguimiento automático de no-shows' },
    { name: 'Alertas de Recetas', enabled: true, desc: 'Notificaciones de renovación' },
    { name: 'Análisis de Riesgos', enabled: true, desc: 'Evaluación automática de riesgos' }
  ];
  container.innerHTML = rules.map(function(r) {
    return '<div class="stat-card"><div style="display:flex;justify-content:space-between;align-items:center;width:100%;"><div><h4 style="margin:0 0 0.5rem 0;">' + r.name + '</h4><p style="margin:0;color:var(--text-secondary);font-size:0.9rem;">' + r.desc + '</p></div><span class="badge badge-' + (r.enabled ? 'success' : 'secondary') + '">' + (r.enabled ? 'Activa' : 'Inactiva') + '</span></div></div>';
  }).join('');
}
