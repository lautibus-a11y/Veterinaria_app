
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Remove brackets if they exist in the password part of the URL
// The user provided structure might be: postgresql://postgres:[PASSWORD]@host:port/db
// We need strict parsing or just simple replacement if we trust the pattern.
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes(':[') && dbUrl.includes(']@')) {
  dbUrl = dbUrl.replace(':[', ':').replace(']@', '@');
}

console.log('Connecting to database...');

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VETERINARIAN', 'RECEPTION', 'CLIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tenant_plan AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appt_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Tables

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan tenant_plan DEFAULT 'FREE',
  phone TEXT,
  address TEXT,
  primary_color TEXT DEFAULT '#10b981',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We reference auth.users if possible, but strict foreign keys to another schema can be tricky if permissions vary. 
-- However, Supabase standard practice permits this.
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY, -- Will link to auth.users(id) manually or via FK if permissions allow
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'CLIENT',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  age FLOAT,
  weight FLOAT,
  gender TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  veterinarian_id UUID REFERENCES user_profiles(id),
  date_time TIMESTAMPTZ NOT NULL,
  status appt_status DEFAULT 'PENDING',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  veterinarian_id UUID REFERENCES user_profiles(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  diagnosis TEXT,
  treatment TEXT,
  symptoms TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public access for now to simplify debugging, or setup proper rules.
-- Since the user wants to "connect to database", usually they want the app to WORK.
-- We will start with permissive policies for authenticated users and service roles.

-- Tenants: Public read (needed for login/setup)
DROP POLICY IF EXISTS "Public tenants read" ON tenants;
CREATE POLICY "Public tenants read" ON tenants FOR SELECT USING (true);

-- Profiles: Users see their own
DROP POLICY IF EXISTS "Users see own profile" ON user_profiles;
CREATE POLICY "Users see own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

-- Function to get tenant_id safely
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- General Policies for data tables
-- For now, we will allow Authenticated users to read/write everything in their tenant.
-- If user is not assigned a tenant, they might see nothing.

DROP POLICY IF EXISTS "Tenant clients access" ON clients;
CREATE POLICY "Tenant clients access" ON clients USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant pets access" ON pets;
CREATE POLICY "Tenant pets access" ON pets USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant appointments access" ON appointments;
CREATE POLICY "Tenant appointments access" ON appointments USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Tenant records access" ON medical_records;
CREATE POLICY "Tenant records access" ON medical_records USING (tenant_id = get_current_tenant_id());

-- SERVICE ROLE ACCESS (Implicitly allowed, but explicit helps understanding)
-- Note: Service role bypasses RLS by default in Supabase client if configured, 
-- but in SQL RLS applies unless user is superuser or BYPASSRLS.
-- Postgres role 'postgres' or 'service_role' usually has BYPASSRLS.

-- Seed some initial data if empty
INSERT INTO tenants (name, slug, plan)
SELECT 'Clínica Veterinaria San Roque', 'san-roque', 'PRO'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'san-roque');

`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
