-- ===== SCHEMA PARA SISTEMA MÉDICO =====

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lastname TEXT NOT NULL,
  patient_id TEXT,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, patient_id)
);

-- Tabla de doctores/profesionales
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  signature_image TEXT,
  professional_title TEXT,
  institution TEXT,
  years_experience INTEGER,
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
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
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
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  start_time TIME,
  end_time TIME,
  days TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de órdenes médicas
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reposo médico
CREATE TABLE IF NOT EXISTS rest_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de referencias médicas
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  reason TEXT NOT NULL,
  date DATE,
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de documentos del paciente (resultados de exámenes, etc.)
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT DEFAULT 'general',
  description TEXT,
  uploaded_by TEXT DEFAULT 'doctor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de archivos adjuntos a consultas
CREATE TABLE IF NOT EXISTS consultation_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_attachments ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PATIENTS
CREATE POLICY "Users can view their own patients" ON patients 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create patients" ON patients 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patients" ON patients 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patients" ON patients 
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS DOCTORS
CREATE POLICY "Users can view their own doctor profile" ON doctors 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their doctor profile" ON doctors 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own doctor profile" ON doctors 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS APPOINTMENTS
CREATE POLICY "Users can view their own appointments" ON appointments 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create appointments" ON appointments 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own appointments" ON appointments 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own appointments" ON appointments 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS CONSULTATIONS
CREATE POLICY "Users can view their own consultations" ON consultations 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create consultations" ON consultations 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own consultations" ON consultations 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own consultations" ON consultations 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS PRESCRIPTIONS
CREATE POLICY "Users can view their own prescriptions" ON prescriptions 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create prescriptions" ON prescriptions 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own prescriptions" ON prescriptions 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own prescriptions" ON prescriptions 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS TREATMENT_PLANS
CREATE POLICY "Users can view their own treatment_plans" ON treatment_plans 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create treatment_plans" ON treatment_plans 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own treatment_plans" ON treatment_plans 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own treatment_plans" ON treatment_plans 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS VITAL_SIGNS
CREATE POLICY "Users can view their own vital_signs" ON vital_signs 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create vital_signs" ON vital_signs 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own vital_signs" ON vital_signs 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own vital_signs" ON vital_signs 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS RECURRING_APPOINTMENTS
CREATE POLICY "Users can view their own recurring_appointments" ON recurring_appointments 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create recurring_appointments" ON recurring_appointments 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own recurring_appointments" ON recurring_appointments 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own recurring_appointments" ON recurring_appointments 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS WAITING_LIST
CREATE POLICY "Users can view their own waiting_list" ON waiting_list 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create waiting_list" ON waiting_list 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own waiting_list" ON waiting_list 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own waiting_list" ON waiting_list 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS OFFICES
CREATE POLICY "Users can view their own offices" ON offices 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create offices" ON offices 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own offices" ON offices 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own offices" ON offices 
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS ORDERS
CREATE POLICY "Users can view their own orders" ON orders 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create orders" ON orders 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own orders" ON orders 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own orders" ON orders 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS REST_RECORDS
CREATE POLICY "Users can view their own rest_records" ON rest_records 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create rest_records" ON rest_records 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own rest_records" ON rest_records 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own rest_records" ON rest_records 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS REFERRALS
CREATE POLICY "Users can view their own referrals" ON referrals 
  FOR SELECT USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can create referrals" ON referrals 
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own referrals" ON referrals 
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())) WITH CHECK (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own referrals" ON referrals 
  FOR DELETE USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- POLÍTICAS PATIENT_DOCUMENTS
CREATE POLICY "Users can view their own patient documents" ON patient_documents 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create patient documents" ON patient_documents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patient documents" ON patient_documents 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patient documents" ON patient_documents 
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS CONSULTATION_ATTACHMENTS
CREATE POLICY "Users can view their own consultation attachments" ON consultation_attachments 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create consultation attachments" ON consultation_attachments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consultation attachments" ON consultation_attachments 
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consultation attachments" ON consultation_attachments 
  FOR DELETE USING (auth.uid() = user_id);
