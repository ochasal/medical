-- ===== SCHEMA PARA SISTEMA MÉDICO =====

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  lastname TEXT NOT NULL,
  patient_id TEXT UNIQUE,
  birth_date DATE,
  gender TEXT,
  blood_type TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  allergies TEXT,
  medications TEXT,
  medical_history TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT DEFAULT 'consultation',
  status TEXT DEFAULT 'scheduled',
  office TEXT,
  notes TEXT,
  consultation_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de consultas (SOAP)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT,
  blood_pressure TEXT,
  heart_rate TEXT,
  temperature TEXT,
  weight TEXT,
  physical_exam TEXT,
  diagnosis TEXT,
  secondary_diagnosis TEXT,
  treatment TEXT,
  follow_up TEXT,
  template_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de recetas
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de planes de tratamiento
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  objective TEXT NOT NULL,
  duration INTEGER,
  start_date DATE,
  status TEXT DEFAULT 'active',
  diet TEXT,
  exercise TEXT,
  restrictions TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de signos vitales
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  systolic INTEGER,
  diastolic INTEGER,
  heart_rate INTEGER,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,1),
  height DECIMAL(5,1),
  oxygen_saturation INTEGER,
  pain_scale INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de citas recurrentes
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  template_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  time TIME NOT NULL,
  pattern TEXT NOT NULL,
  days_of_week INTEGER[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de lista de espera
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT,
  preferred_date DATE,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de consultorios
CREATE TABLE IF NOT EXISTS offices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  start_time TIME,
  end_time TIME,
  days TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo para anon por ahora, luego se restringe)
CREATE POLICY "Allow all for anon" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON consultations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON treatment_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vital_signs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON recurring_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON waiting_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON offices FOR ALL USING (true) WITH CHECK (true);
