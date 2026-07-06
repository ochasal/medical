// ===== EXPORTACIÓN A PDF =====

function generatePDF(htmlContent, filename) {
  var printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>​</title>');
  printWindow.document.write('<style>');
  printWindow.document.write('* { box-sizing: border-box; }');
  printWindow.document.write('body { font-family: Arial, sans-serif; padding: 2cm; margin: 0; color: #333; }');
  printWindow.document.write('.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1.5rem; }');
  printWindow.document.write('.header h1 { margin: 0; font-size: 1.5rem; }');
  printWindow.document.write('.header p { margin: 0.25rem 0; color: #666; font-size: 0.9rem; }');
  printWindow.document.write('.patient-info { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }');
  printWindow.document.write('.patient-info strong { display: inline-block; width: 120px; }');
  printWindow.document.write('.content { margin-bottom: 1.5rem; }');
  printWindow.document.write('.med-item { border: 1px solid #ddd; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; }');
  printWindow.document.write('.med-item strong { color: #2196f3; }');
  printWindow.document.write('.footer { margin-top: 3rem; border-top: 1px solid #ddd; padding-top: 1rem; display: flex; justify-content: space-between; }');
  printWindow.document.write('.signature { text-align: center; margin-top: 3rem; }');
  printWindow.document.write('.signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 0.5rem; }');
  printWindow.document.write('.date-emission { text-align: right; color: #666; font-size: 0.85rem; margin-top: 0.75rem; }');
  printWindow.document.write('@page { size: letter; margin: 0; }');
  printWindow.document.write('@media print { body { padding: 2cm; } }');
  printWindow.document.write('</style></head><body>');
  printWindow.document.write(htmlContent);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  setTimeout(function() { printWindow.print(); }, 500);
}

// ===== RÉCIPE PDF =====
async function exportPrescriptionPDF(id) {
  var { data: rx } = await db.from('prescriptions').select('*, patients(name, lastname, patient_id, birth_date, phone)').eq('id', id).single();
  if (!rx) return;
  var patient = rx.patients || {};
  var medications = rx.medications || [];
  var doctorSig = await getDoctorSignature();

  var html = '<div class="header"><h1>RÉCIPE MÉDICO</h1></div><p class="date-emission">Fecha de emisión: ' + formatDateLong(new Date().toISOString().split('T')[0]) + '</p>';
  html += '<div class="patient-info">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(rx.date) + '</p>';
  html += '</div>';

  html += '<div class="content"><h3>Medicamentos:</h3>';
  medications.forEach(function(m, i) {
    html += '<div class="med-item">';
    html += '<strong>' + (i + 1) + '. ' + m.name + '</strong>';
    if (m.presentation) html += ' (' + m.presentation + ')';
    html += '<br>Dosis: ' + (m.dosage || '-') + ' | Frecuencia: ' + (m.frequency || '-');
    if (m.duration) html += ' | Duración: ' + m.duration;
    if (m.quantity) html += ' | Cantidad: ' + m.quantity;
    if (m.instructions) html += '<br><em>Indicaciones: ' + m.instructions + '</em>';
    html += '</div>';
  });
  html += '</div>';

  if (rx.notes) html += '<p><strong>Notas:</strong> ' + rx.notes + '</p>';

  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'recipe-' + patient.lastname + '-' + (rx.date || ''));
}

// ===== ORDEN PDF =====
async function exportOrderPDF(id) {
  var { data: order } = await db.from('orders').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!order) return;
  var patient = order.patients || {};
  var doctorSig = await getDoctorSignature();
  var typeLabels = { lab: 'Laboratorio', imaging: 'Imagenología', procedure: 'Procedimiento', other: 'Otro' };

  var html = '<div class="header"><h1>ORDEN MÉDICA</h1></div><p class="date-emission">Fecha de emisión: ' + formatDateLong(new Date().toISOString().split('T')[0]) + '</p>';
  html += '<div class="patient-info">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(order.date) + '</p>';
  html += '</div>';
  html += '<div class="content"><h3>Exámenes / Procedimientos:</h3>';
  html += '<p style="white-space:pre-line;">' + (order.description || '') + '</p>';
  if (order.notes) html += '<p><strong>Indicaciones:</strong> ' + order.notes + '</p>';
  html += '</div>';
  
  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'orden-' + patient.lastname + '-' + (order.date || ''));
}

// ===== REPOSO PDF =====
async function exportRestPDF(id) {
  var { data: rest } = await db.from('rest_records').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!rest) return;
  var patient = rest.patients || {};
  var doctorSig = await getDoctorSignature();

  var html = '<div class="header"><h1>CONSTANCIA DE REPOSO MÉDICO</h1></div><p class="date-emission">Fecha de emisión: ' + formatDateLong(new Date().toISOString().split('T')[0]) + '</p>';
  html += '<div class="patient-info">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '</div>';
  html += '<div class="content">';
  html += '<p>Se hace constar que el/la paciente mencionado/a requiere <strong>' + rest.days + ' días</strong> de reposo médico.</p>';
  html += '<p><strong>Desde:</strong> ' + formatDate(rest.start_date) + '</p>';
  html += '<p><strong>Hasta:</strong> ' + formatDate(rest.end_date) + '</p>';
  html += '<p><strong>Diagnóstico:</strong> ' + (rest.diagnosis || '') + '</p>';
  if (rest.notes) html += '<p><strong>Observaciones:</strong> ' + rest.notes + '</p>';
  html += '</div>';
  
  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'reposo-' + patient.lastname + '-' + (rest.start_date || ''));
}

// ===== REFERENCIA PDF =====
async function exportReferralPDF(id) {
  var { data: ref } = await db.from('referrals').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!ref) return;
  var patient = ref.patients || {};
  var doctorSig = await getDoctorSignature();

  var html = '<div class="header"><h1>REFERENCIA MÉDICA</h1></div><p class="date-emission">Fecha de emisión: ' + formatDateLong(new Date().toISOString().split('T')[0]) + '</p>';
  html += '<div class="patient-info">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha:</strong> ' + formatDate(ref.date) + '</p>';
  html += '</div>';
  html += '<div class="content">';
  html += '<p><strong>Referido a:</strong> ' + ((ref.specialty || '').charAt(0).toUpperCase() + (ref.specialty || '').slice(1)) + '</p>';
  if (ref.priority === 'urgent') html += '<p style="color:red;font-weight:bold;">URGENTE</p>';
  html += '<p><strong>Motivo:</strong></p>';
  html += '<p style="white-space:pre-line;">' + (ref.reason || '') + '</p>';
  if (ref.notes) html += '<p><strong>Notas:</strong> ' + ref.notes + '</p>';
  html += '</div>';
  
  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'referencia-' + patient.lastname + '-' + (ref.date || ''));
}


// ===== PLAN DE TRATAMIENTO PDF =====
async function exportTreatmentPlanPDF(id) {
  var { data: tp } = await db.from('treatment_plans').select('*, patients(name, lastname, patient_id)').eq('id', id).single();
  if (!tp) return;
  var patient = tp.patients || {};
  var doctorSig = await getDoctorSignature();

  var html = '<div class="header"><h1>PLAN DE TRATAMIENTO</h1></div>';
  html += '<p class="date-emission">Fecha de emisión: ' + formatDateLong(new Date().toISOString().split('T')[0]) + '</p>';
  html += '<div class="patient-info">';
  html += '<p><strong>Paciente:</strong> ' + patient.name + ' ' + patient.lastname + '</p>';
  html += '<p><strong>Cédula:</strong> ' + (patient.patient_id || 'N/A') + '</p>';
  html += '<p><strong>Fecha inicio:</strong> ' + formatDate(tp.start_date) + '</p>';
  html += '<p><strong>Duración:</strong> ' + (tp.duration || '-') + ' días</p>';
  html += '</div>';

  html += '<div class="content">';
  html += '<h3>Objetivo:</h3><p>' + (tp.objective || '-') + '</p>';
  if (tp.diet) html += '<h3>Dieta:</h3><p>' + tp.diet + '</p>';
  if (tp.exercise) html += '<h3>Actividad Física:</h3><p>' + tp.exercise + '</p>';
  if (tp.restrictions) html += '<h3>Restricciones:</h3><p>' + tp.restrictions + '</p>';
  if (tp.follow_up) html += '<h3>Seguimiento:</h3><p>' + tp.follow_up + '</p>';
  html += '</div>';

  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'plan-tratamiento-' + patient.lastname);
}

// ===== INFORME MÉDICO PDF =====
async function exportMedicalReportPDF(id) {
  var { data: r } = await db.from('medical_reports').select('*, patients(name, lastname, patient_id, birth_date, gender, phone)').eq('id', id).single();
  if (!r) return;
  var p = r.patients || {};
  var doctorSig = await getDoctorSignature();

  var sec = function(num, title, icon) {
    return '<h3 style="margin:1.2rem 0 0.5rem;padding-top:1rem;border-top:1px solid #ddd;font-size:1rem;color:#333;">' + num + '. ' + title + '</h3>';
  };
  var row = function(label, value) {
    return value ? '<p style="margin:0.2rem 0;"><strong>' + label + ':</strong> ' + value + '</p>' : '';
  };

  var age = '';
  var dob = r.patient_dob || p.birth_date;
  if (dob) { age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25*24*60*60*1000)) + ' años'; }

  var html = '<div class="header"><h1>INFORME MÉDICO</h1></div>';
  html += '<p class="date-emission">Fecha de Emisión: ' + formatDateLong(r.emission_date || new Date().toISOString().split('T')[0]) + '</p>';
  if (r.report_number) html += '<p><strong>N° Expediente / Historia Clínica:</strong> ' + r.report_number + '</p>';

  html += sec(1, 'DATOS DEL PACIENTE');
  html += '<div class="patient-info">';
  html += row('Nombre Completo', (p.name || '') + ' ' + (p.lastname || ''));
  html += row('Documento de Identidad', r.patient_doc || p.patient_id);
  if (dob) html += '<p style="margin:0.2rem 0;"><strong>Fecha de Nacimiento:</strong> ' + formatDate(dob) + (age ? ' | <strong>Edad:</strong> ' + age : '') + '</p>';
  html += row('Género', r.patient_gender || p.gender);
  html += row('Teléfono', r.patient_phone || p.phone);
  html += '</div>';

  if (r.consultation_reason) {
    html += sec(2, 'MOTIVO DE LA CONSULTA / INGRESO');
    html += '<p style="white-space:pre-line;">' + r.consultation_reason + '</p>';
  }

  html += sec(3, 'ANTECEDENTES RELEVANTES');
  html += row('Antecedentes Médicos / Patológicos', r.medical_history);
  html += row('Antecedentes Quirúrgicos', r.surgical_history);
  html += row('Alergias', r.allergies);
  html += row('Tratamiento Habitual', r.current_treatment);

  html += sec(4, 'RESUMEN CLÍNICO Y EXAMEN FÍSICO');
  if (r.clinical_evolution) html += '<p style="white-space:pre-line;">' + r.clinical_evolution + '</p>';
  if (r.blood_pressure || r.heart_rate || r.temperature || r.oxygen_saturation) {
    html += '<p style="margin-top:0.5rem;"><strong>Signos Vitales:</strong></p>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.2rem 1rem;">';
    html += row('Presión Arterial', r.blood_pressure);
    html += row('Frecuencia Cardíaca', r.heart_rate);
    html += row('Temperatura', r.temperature);
    html += row('Saturación de Oxígeno', r.oxygen_saturation);
    html += '</div>';
  }

  if (r.complementary_studies) {
    html += sec(5, 'ESTUDIOS COMPLEMENTARIOS');
    html += '<p style="white-space:pre-line;">' + r.complementary_studies + '</p>';
  }

  html += '<div class="signature"><div class="signature-line"></div>';
  if (doctorSig) {
    html += '<p style="margin:0.5rem 0 0;"><strong>' + doctorSig.name + '</strong></p>';
    html += '<p style="margin:0;">' + doctorSig.specialty + '</p>';
    if (doctorSig.license) html += '<p style="margin:0;font-size:0.8rem;">Lic: ' + doctorSig.license + '</p>';
  } else {
    html += '<p style="margin:0.5rem 0 0;"><strong>Doctor</strong></p>';
  }
  html += '</div>';

  generatePDF(html, 'informe-' + (p.lastname || 'medico') + '-' + (r.emission_date || ''));
}
