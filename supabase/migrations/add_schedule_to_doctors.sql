-- Agregar columna de horarios de atención al perfil del médico
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS schedule JSONB;
