-- Boresha-Mama: Initial Database Schema
-- PostgreSQL migration for maternal healthcare system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('mother', 'chv', 'facility_staff', 'county_admin');
CREATE TYPE IF NOT EXISTS pregnancy_status AS ENUM ('active', 'delivered', 'lost', 'transferred');
CREATE TYPE IF NOT EXISTS risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE IF NOT EXISTS referral_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'missed');
CREATE TYPE IF NOT EXISTS visit_type AS ENUM ('antenatal', 'postnatal', 'follow_up', 'emergency');

-- ============================================
-- USERS TABLE (base for all roles)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  national_id VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  preferred_language VARCHAR(5) DEFAULT 'en', -- 'en' or 'sw'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);

-- ============================================
-- MOTHERS PROFILE
-- ============================================
CREATE TABLE IF NOT EXISTS mothers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  village VARCHAR(200),
  sub_location VARCHAR(200),
  ward VARCHAR(200),
  constituency VARCHAR(200) DEFAULT 'Kiminini',
  county VARCHAR(100) DEFAULT 'Trans-Nzoia',
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(15),
  alternate_phone VARCHAR(15),
  chv_id UUID REFERENCES users(id),
  is_high_risk BOOLEAN DEFAULT false,
  risk_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mothers_chv ON mothers(chv_id);
CREATE INDEX IF NOT EXISTS idx_mothers_ward ON mothers(ward);

-- ============================================
-- CHV PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS chv_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID, -- FK added after facilities table
  area_of_coverage VARCHAR(500),
  years_of_experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HEALTH FACILITIES
-- ============================================
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'dispensary', 'health_center', 'sub_county_hospital', 'county_hospital'
  ward VARCHAR(200),
  constituency VARCHAR(200) DEFAULT 'Kiminini',
  county VARCHAR(100) DEFAULT 'Trans-Nzoia',
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  phone VARCHAR(15),
  email VARCHAR(255),
  level VARCHAR(50), -- 'Level 2', 'Level 3', 'Level 4', 'Level 5'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from chv_profiles to facilities
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_chv_facility') THEN
    ALTER TABLE chv_profiles
      ADD CONSTRAINT fk_chv_facility
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- FACILITY STAFF PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS facility_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  job_title VARCHAR(100) NOT NULL, -- 'nurse', 'midwife', 'clinical_officer', 'doctor', 'admin'
  license_number VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_staff_facility ON facility_staff(facility_id);

-- ============================================
-- PREGNANCIES
-- ============================================
CREATE TABLE IF NOT EXISTS pregnancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mother_id UUID NOT NULL REFERENCES mothers(id) ON DELETE CASCADE,
  registered_by UUID NOT NULL REFERENCES users(id), -- CHV who registered
  facility_id UUID REFERENCES facilities(id), -- preferred facility
  lmp_date DATE NOT NULL, -- Last Menstrual Period
  edd_date DATE NOT NULL, -- Estimated Delivery Date
  gravida INTEGER DEFAULT 1, -- number of pregnancies
  parity INTEGER DEFAULT 0, -- number of previous births
  status pregnancy_status DEFAULT 'active',
  risk_level risk_level DEFAULT 'low',
  risk_factors TEXT[], -- array of risk factors
  notes TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pregnancies_mother ON pregnancies(mother_id);
CREATE INDEX IF NOT EXISTS idx_pregnancies_status ON pregnancies(status);
CREATE INDEX IF NOT EXISTS idx_pregnancies_risk ON pregnancies(risk_level);
CREATE INDEX IF NOT EXISTS idx_pregnancies_facility ON pregnancies(facility_id);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  mother_id UUID NOT NULL REFERENCES mothers(id),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  scheduled_by UUID NOT NULL REFERENCES users(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  visit_type visit_type NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_pregnancy ON appointments(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON appointments(facility_id);

-- ============================================
-- CHV HOME VISITS
-- ============================================
CREATE TABLE IF NOT EXISTS home_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  mother_id UUID NOT NULL REFERENCES mothers(id),
  chv_id UUID NOT NULL REFERENCES users(id),
  visit_date DATE NOT NULL,
  visit_type visit_type NOT NULL,
  weight_kg DECIMAL(5, 2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  temperature_c DECIMAL(4, 1),
  pulse_rate INTEGER,
  hemoglobin DECIMAL(4, 1),
  fundal_height_cm DECIMAL(4, 1),
  fetal_heart_rate INTEGER,
  danger_signs TEXT[],
  risk_level risk_level,
  referral_id UUID, -- FK added after referrals
  notes TEXT,
  is_synced BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_visits_pregnancy ON home_visits(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_home_visits_chv ON home_visits(chv_id);
CREATE INDEX IF NOT EXISTS idx_home_visits_date ON home_visits(visit_date);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  mother_id UUID NOT NULL REFERENCES mothers(id),
  from_chv_id UUID NOT NULL REFERENCES users(id),
  from_facility_id UUID REFERENCES facilities(id), -- NULL if CHV direct referral
  to_facility_id UUID NOT NULL REFERENCES facilities(id),
  referral_reason TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- 'normal', 'urgent', 'emergency'
  status referral_status DEFAULT 'pending',
  notes TEXT,
  outcome TEXT,
  outcome_updated_by UUID REFERENCES users(id),
  outcome_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_home_visit_referral') THEN
    ALTER TABLE home_visits
      ADD CONSTRAINT fk_home_visit_referral
      FOREIGN KEY (referral_id) REFERENCES referrals(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_pregnancy ON referrals(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_to_facility ON referrals(to_facility_id);

-- ============================================
-- SELF-MONITORING (mother entered data)
-- ============================================
CREATE TABLE IF NOT EXISTS self_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mother_id UUID NOT NULL REFERENCES mothers(id),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg DECIMAL(5, 2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  blood_sugar DECIMAL(4, 1),
  symptoms TEXT[], -- e.g., {'headache', 'swelling', 'bleeding'}
  fetal_movements VARCHAR(50), -- 'normal', 'reduced', 'none'
  notes TEXT,
  danger_alert_triggered BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_self_monitoring_mother ON self_monitoring(mother_id);
CREATE INDEX IF NOT EXISTS idx_self_monitoring_date ON self_monitoring(recorded_at);

-- ============================================
-- HEALTH TIPS & NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS health_tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_sw TEXT NOT NULL,
  trimester INTEGER, -- 1, 2, 3, or NULL for all
  week_start INTEGER,
  week_end INTEGER,
  category VARCHAR(50), -- 'nutrition', 'exercise', 'danger_signs', 'general'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'appointment', 'tip', 'alert', 'referral', 'reminder'
  channel VARCHAR(20) DEFAULT 'push', -- 'push', 'sms', 'both'
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- SYNC LOG (for offline tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  conflict_resolved BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sync_log_user ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced_at);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Additional performance indexes (must be after all tables)
CREATE INDEX IF NOT EXISTS idx_appointments_mother ON appointments(mother_id);
CREATE INDEX IF NOT EXISTS idx_home_visits_mother ON home_visits(mother_id);
CREATE INDEX IF NOT EXISTS idx_self_monitoring_pregnancy ON self_monitoring(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_referrals_chv ON referrals(from_chv_id);
CREATE INDEX IF NOT EXISTS idx_referrals_facility ON referrals(from_facility_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_facilities_ward ON facilities(ward);
CREATE INDEX IF NOT EXISTS idx_facilities_constituency ON facilities(constituency);
CREATE INDEX IF NOT EXISTS idx_health_tips_trimester ON health_tips(trimester);

-- ============================================
-- INSERT DEFAULT HEALTH TIPS
-- ============================================
INSERT INTO health_tips (title, content_en, content_sw, trimester, week_start, week_end, category)
SELECT * FROM (VALUES
('Stay Hydrated', 'Drink at least 8 glasses of water daily to stay hydrated during pregnancy.', 'Kunywa angalau glasi 8 za maji kila siku ili kukaa na maji mwilini wakati wa ujauzito.', 1, 1, 12, 'nutrition'),
('Prenatal Vitamins', 'Take your daily prenatal vitamins containing folic acid to prevent birth defects.', 'Kula vitamini vya ujauzito kila siku vyenye asidi ya folic kuzuia kasoro za kuzaliwa.', 1, 1, 12, 'nutrition'),
('Balanced Diet', 'Eat a balanced diet rich in fruits, vegetables, proteins, and whole grains.', 'Kula chakula bora chenye matunda, mboga, protini, na nafaka nzima.', NULL, 1, 40, 'nutrition'),
('Warning Signs', 'Contact your CHV or clinic immediately if you experience severe headache, blurred vision, or vaginal bleeding.', 'Wasiliana na CHV wako au kliniki mara moja ikiwa una maumivu makali ya kichwa, kuona vibaya, au kutokwa damu.', NULL, 1, 40, 'danger_signs'),
('Gentle Exercise', 'Gentle exercises like walking help maintain fitness during pregnancy. Avoid heavy lifting.', 'Mazoezi mepesi kama kutembea husaidia kudumisha afya wakati wa ujauzito. Epuka kubeba vitu vizito.', NULL, 1, 40, 'exercise'),
('Fetal Movements', 'From week 28, monitor your baby''s movements. You should feel at least 10 movements in 2 hours.', 'Kuanzia wiki ya 28, angalia mienendo ya mtoto wako. Unapaswa kuhisi angalau mienendo 10 kwa muda wa masaa 2.', 3, 28, 40, 'general'),
('Sleep Position', 'Sleep on your left side from the second trimester to improve blood flow to your baby.', 'Lala upande wa kushoto kuanzia trimester ya pili ili kuboresha mtiririko wa damu kwa mtoto wako.', 2, 13, 27, 'general'))
AS tmp(title, content_en, content_sw, trimester, week_start, week_end, category)
WHERE NOT EXISTS (SELECT 1 FROM health_tips WHERE title = tmp.title);
