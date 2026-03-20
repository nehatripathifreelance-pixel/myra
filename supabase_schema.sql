-- Supabase SQL Editor Script for HostelHub Pro

-- 1. hostels Table
CREATE TABLE hostels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. roomCategories Table
CREATE TABLE "roomCategories" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  basePrice NUMERIC NOT NULL,
  capacity INTEGER NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. blocks Table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostelId UUID REFERENCES hostels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blockId UUID REFERENCES blocks(id) ON DELETE CASCADE,
  roomNumber TEXT NOT NULL,
  categoryId UUID REFERENCES "roomCategories"(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'repair')) DEFAULT 'available',
  floor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. beds Table
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roomId UUID REFERENCES rooms(id) ON DELETE CASCADE,
  bedNumber TEXT NOT NULL,
  residentId UUID, -- Will be linked to residents table later
  status TEXT CHECK (status IN ('available', 'occupied', 'repair')) DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. residents Table
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fullName TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  occupation TEXT,
  bedId UUID REFERENCES beds(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('in', 'out')) DEFAULT 'in',
  photoUrl TEXT,
  qrCode TEXT,
  monthlyRent NUMERIC,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to beds for residentId
ALTER TABLE beds ADD CONSTRAINT fk_resident FOREIGN KEY (residentId) REFERENCES residents(id) ON DELETE SET NULL;

-- 7. parcels Table
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  courierService TEXT NOT NULL,
  trackingNumber TEXT NOT NULL,
  receivedDate TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('received', 'delivered')) DEFAULT 'received',
  deliveredDate TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. visitors Table
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  purpose TEXT,
  checkInTime TIMESTAMPTZ DEFAULT NOW(),
  checkOutTime TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. leaves Table
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  reason TEXT,
  destination TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  appliedAt TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('rent', 'fine', 'other')) NOT NULL,
  method TEXT CHECK (method IN ('cash', 'upi', 'card')) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  receiptNumber TEXT NOT NULL UNIQUE,
  transactionId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. payments Table (Alias or separate table for Dashboard revenue)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. settings Table
CREATE TABLE settings (
  id TEXT PRIMARY KEY, -- e.g., 'hostel_config'
  lateTime TIME DEFAULT '22:00',
  checkInTime TIME DEFAULT '06:00',
  logo TEXT,
  phone TEXT,
  address TEXT,
  gstNumber TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. wardens Table
CREATE TABLE wardens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  wardenId TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. attendance Table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  residentId UUID REFERENCES residents(id) ON DELETE CASCADE,
  type TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roomCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now)
CREATE POLICY "Allow all access" ON hostels FOR ALL USING (true);
CREATE POLICY "Allow all access" ON "roomCategories" FOR ALL USING (true);
CREATE POLICY "Allow all access" ON blocks FOR ALL USING (true);
CREATE POLICY "Allow all access" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all access" ON beds FOR ALL USING (true);
CREATE POLICY "Allow all access" ON residents FOR ALL USING (true);
CREATE POLICY "Allow all access" ON parcels FOR ALL USING (true);
CREATE POLICY "Allow all access" ON visitors FOR ALL USING (true);
CREATE POLICY "Allow all access" ON leaves FOR ALL USING (true);
CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all access" ON settings FOR ALL USING (true);
CREATE POLICY "Allow all access" ON wardens FOR ALL USING (true);
CREATE POLICY "Allow all access" ON attendance FOR ALL USING (true);
