-- =========================================
-- EXTENSION
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. hostels
-- =========================================
CREATE TABLE IF NOT EXISTS hostels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. roomCategories
-- =========================================
CREATE TABLE IF NOT EXISTS "roomCategories" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  beds_capacity INTEGER NOT NULL DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for roomCategories
DO $$
BEGIN
  -- baseprice/basePrice -> price
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roomCategories' AND column_name='baseprice') THEN
    ALTER TABLE "roomCategories" RENAME COLUMN baseprice TO price;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roomCategories' AND column_name='basePrice') THEN
    ALTER TABLE "roomCategories" RENAME COLUMN "basePrice" TO price;
  END IF;

  -- capacity -> beds_capacity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roomCategories' AND column_name='capacity') THEN
    ALTER TABLE "roomCategories" RENAME COLUMN capacity TO beds_capacity;
  END IF;

  -- createdat -> createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roomCategories' AND column_name='createdat') THEN
    ALTER TABLE "roomCategories" RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 3. blocks
-- =========================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "hostelId" UUID REFERENCES hostels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for blocks: Fix hostelId case sensitivity
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='hostelid') THEN
    ALTER TABLE blocks RENAME COLUMN hostelid TO "hostelId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='createdat') THEN
    ALTER TABLE blocks RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 4. rooms
-- =========================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "blockId" UUID REFERENCES blocks(id) ON DELETE CASCADE,
  "roomNumber" TEXT NOT NULL,
  "categoryId" UUID REFERENCES "roomCategories"(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'repair')) DEFAULT 'available',
  floor TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for rooms
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='blockid') THEN
    ALTER TABLE rooms RENAME COLUMN blockid TO "blockId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='roomnumber') THEN
    ALTER TABLE rooms RENAME COLUMN roomnumber TO "roomNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='categoryid') THEN
    ALTER TABLE rooms RENAME COLUMN categoryid TO "categoryId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='createdat') THEN
    ALTER TABLE rooms RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 5. beds
-- =========================================
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "roomId" UUID REFERENCES rooms(id) ON DELETE CASCADE,
  "bedNumber" TEXT NOT NULL,
  "residentId" UUID,
  status TEXT CHECK (status IN ('available', 'occupied', 'repair')) DEFAULT 'available',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for beds
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beds' AND column_name='roomid') THEN
    ALTER TABLE beds RENAME COLUMN roomid TO "roomId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beds' AND column_name='bednumber') THEN
    ALTER TABLE beds RENAME COLUMN bednumber TO "bedNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beds' AND column_name='residentid') THEN
    ALTER TABLE beds RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beds' AND column_name='createdat') THEN
    ALTER TABLE beds RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 6. residents
-- =========================================
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName" TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT,
  pincode TEXT,
  state TEXT,
  city TEXT,
  occupation TEXT DEFAULT 'Student',
  "idNumber" TEXT,
  "documentType" TEXT DEFAULT 'Aadhar Card',
  "bloodGroup" TEXT DEFAULT 'O+',
  allergy TEXT,
  "fatherName" TEXT,
  "fatherPhone" TEXT,
  "motherName" TEXT,
  "motherPhone" TEXT,
  "emergencyNumber" TEXT,
  "companyName" TEXT,
  "companyAddress" TEXT,
  "fatherOccupation" TEXT,
  "motherOccupation" TEXT,
  "homeAddress" TEXT,
  "hostelId" UUID REFERENCES hostels(id) ON DELETE SET NULL,
  "blockId" UUID REFERENCES blocks(id) ON DELETE SET NULL,
  "roomId" UUID REFERENCES rooms(id) ON DELETE SET NULL,
  "bedId" UUID REFERENCES beds(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in',
  "monthlyRent" NUMERIC,
  "photoUrl" TEXT,
  "documentUrl" TEXT,
  "idCardCollected" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for residents: Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='address') THEN
    ALTER TABLE residents ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='city') THEN
    ALTER TABLE residents ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='state') THEN
    ALTER TABLE residents ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='occupation') THEN
    ALTER TABLE residents ADD COLUMN occupation TEXT DEFAULT 'Student';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='pincode') THEN
    ALTER TABLE residents ADD COLUMN pincode TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='idNumber') THEN
    ALTER TABLE residents ADD COLUMN "idNumber" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='documentType') THEN
    ALTER TABLE residents ADD COLUMN "documentType" TEXT DEFAULT 'Aadhar Card';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='bloodGroup') THEN
    ALTER TABLE residents ADD COLUMN "bloodGroup" TEXT DEFAULT 'O+';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='allergy') THEN
    ALTER TABLE residents ADD COLUMN allergy TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='fatherName') THEN
    ALTER TABLE residents ADD COLUMN "fatherName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='fatherPhone') THEN
    ALTER TABLE residents ADD COLUMN "fatherPhone" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='motherName') THEN
    ALTER TABLE residents ADD COLUMN "motherName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='motherPhone') THEN
    ALTER TABLE residents ADD COLUMN "motherPhone" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='emergencyNumber') THEN
    ALTER TABLE residents ADD COLUMN "emergencyNumber" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='companyName') THEN
    ALTER TABLE residents ADD COLUMN "companyName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='companyAddress') THEN
    ALTER TABLE residents ADD COLUMN "companyAddress" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='fatherOccupation') THEN
    ALTER TABLE residents ADD COLUMN "fatherOccupation" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='motherOccupation') THEN
    ALTER TABLE residents ADD COLUMN "motherOccupation" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='homeAddress') THEN
    ALTER TABLE residents ADD COLUMN "homeAddress" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='hostelId') THEN
    ALTER TABLE residents ADD COLUMN "hostelId" UUID REFERENCES hostels(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='blockId') THEN
    ALTER TABLE residents ADD COLUMN "blockId" UUID REFERENCES blocks(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='roomId') THEN
    ALTER TABLE residents ADD COLUMN "roomId" UUID REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='photoUrl') THEN
    ALTER TABLE residents ADD COLUMN "photoUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='documentUrl') THEN
    ALTER TABLE residents ADD COLUMN "documentUrl" TEXT;
  END IF;
END $$;

-- Migration for residents: Fix case sensitivity
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='fullname') THEN
    ALTER TABLE residents RENAME COLUMN fullname TO "fullName";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='bedid') THEN
    ALTER TABLE residents RENAME COLUMN bedid TO "bedId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='monthlyrent') THEN
    ALTER TABLE residents RENAME COLUMN monthlyrent TO "monthlyRent";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='residents' AND column_name='createdat') THEN
    ALTER TABLE residents RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- STORAGE BUCKETS
-- =========================================
-- Note: This requires the storage schema to exist.
-- Supabase usually handles this, but we can try to create them if possible.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('residents', 'residents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to residents bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'residents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'residents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'residents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'residents');
  END IF;
END $$;

-- FK constraint for beds -> residents
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resident') THEN
    ALTER TABLE beds ADD CONSTRAINT fk_resident FOREIGN KEY ("residentId") REFERENCES residents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================
-- 7. payments
-- =========================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for payments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='residentid') THEN
    ALTER TABLE payments RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='createdat') THEN
    ALTER TABLE payments RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 8. parcels
-- =========================================
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  "courierService" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "receivedDate" TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('received', 'delivered')) DEFAULT 'received',
  "deliveredDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for parcels
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='residentid') THEN
    ALTER TABLE parcels RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='courierservice') THEN
    ALTER TABLE parcels RENAME COLUMN courierservice TO "courierService";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='trackingnumber') THEN
    ALTER TABLE parcels RENAME COLUMN trackingnumber TO "trackingNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='receiveddate') THEN
    ALTER TABLE parcels RENAME COLUMN receiveddate TO "receivedDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='delivereddate') THEN
    ALTER TABLE parcels RENAME COLUMN delivereddate TO "deliveredDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parcels' AND column_name='createdat') THEN
    ALTER TABLE parcels RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 9. visitors
-- =========================================
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  purpose TEXT,
  "checkInTime" TIMESTAMPTZ DEFAULT NOW(),
  "checkOutTime" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for visitors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitors' AND column_name='residentid') THEN
    ALTER TABLE visitors RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitors' AND column_name='checkintime') THEN
    ALTER TABLE visitors RENAME COLUMN checkintime TO "checkInTime";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitors' AND column_name='checkouttime') THEN
    ALTER TABLE visitors RENAME COLUMN checkouttime TO "checkOutTime";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitors' AND column_name='createdat') THEN
    ALTER TABLE visitors RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 10. leaves
-- =========================================
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  reason TEXT,
  destination TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  "appliedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for leaves
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='residentid') THEN
    ALTER TABLE leaves RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='startdate') THEN
    ALTER TABLE leaves RENAME COLUMN startdate TO "startDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='enddate') THEN
    ALTER TABLE leaves RENAME COLUMN enddate TO "endDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='appliedat') THEN
    ALTER TABLE leaves RENAME COLUMN appliedat TO "appliedAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leaves' AND column_name='createdat') THEN
    ALTER TABLE leaves RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 11. transactions
-- =========================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  "taxAmount" NUMERIC DEFAULT 0,
  "totalAmount" NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('rent', 'fine', 'other')) DEFAULT 'rent',
  method TEXT CHECK (method IN ('cash', 'upi', 'card')) DEFAULT 'cash',
  date TIMESTAMPTZ DEFAULT NOW(),
  "receiptNumber" TEXT NOT NULL,
  "transactionId" TEXT,
  "billPhotoUrl" TEXT,
  "taxDetails" TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for transactions
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='taxAmount') THEN
    ALTER TABLE transactions ADD COLUMN "taxAmount" NUMERIC DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='totalAmount') THEN
    ALTER TABLE transactions ADD COLUMN "totalAmount" NUMERIC;
    -- Update existing rows to have totalAmount = amount if it was null
    UPDATE transactions SET "totalAmount" = amount WHERE "totalAmount" IS NULL;
    ALTER TABLE transactions ALTER COLUMN "totalAmount" SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='taxDetails') THEN
    ALTER TABLE transactions ADD COLUMN "taxDetails" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='billPhotoUrl') THEN
    ALTER TABLE transactions ADD COLUMN "billPhotoUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='updatedAt') THEN
    ALTER TABLE transactions ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Rename existing columns if they have old names
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='residentid') THEN
    ALTER TABLE transactions RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='taxamount') THEN
    ALTER TABLE transactions RENAME COLUMN taxamount TO "taxAmount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='totalamount') THEN
    ALTER TABLE transactions RENAME COLUMN totalamount TO "totalAmount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='receiptnumber') THEN
    ALTER TABLE transactions RENAME COLUMN receiptnumber TO "receiptNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='transactionid') THEN
    ALTER TABLE transactions RENAME COLUMN transactionid TO "transactionId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='billphotourl') THEN
    ALTER TABLE transactions RENAME COLUMN billphotourl TO "billPhotoUrl";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='taxdetails') THEN
    ALTER TABLE transactions RENAME COLUMN taxdetails TO "taxDetails";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='createdat') THEN
    ALTER TABLE transactions RENAME COLUMN createdat TO "createdAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='updatedat') THEN
    ALTER TABLE transactions RENAME COLUMN updatedat TO "updatedAt";
  END IF;
END $$;

-- =========================================
-- 12. settings
-- =========================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "lateTime" TEXT DEFAULT '21:00',
  "checkInTime" TEXT DEFAULT '09:00',
  logo TEXT,
  phone TEXT,
  address TEXT,
  "gstNumber" TEXT,
  taxes JSONB DEFAULT '[]',
  "loginBackground" TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for settings
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='logo') THEN
    ALTER TABLE settings ADD COLUMN logo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='phone') THEN
    ALTER TABLE settings ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='address') THEN
    ALTER TABLE settings ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='gstNumber') THEN
    ALTER TABLE settings ADD COLUMN "gstNumber" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='taxes') THEN
    ALTER TABLE settings ADD COLUMN taxes JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='loginBackground') THEN
    ALTER TABLE settings ADD COLUMN "loginBackground" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='updatedAt') THEN
    ALTER TABLE settings ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Rename existing columns if they have old names
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='latetime') THEN
    ALTER TABLE settings RENAME COLUMN latetime TO "lateTime";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='checkintime') THEN
    ALTER TABLE settings RENAME COLUMN checkintime TO "checkInTime";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='gstnumber') THEN
    ALTER TABLE settings RENAME COLUMN gstnumber TO "gstNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='loginbackground') THEN
    ALTER TABLE settings RENAME COLUMN loginbackground TO "loginBackground";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='createdat') THEN
    ALTER TABLE settings RENAME COLUMN createdat TO "createdAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='updatedat') THEN
    ALTER TABLE settings RENAME COLUMN updatedat TO "updatedAt";
  END IF;
END $$;

-- =========================================
-- 13. wardens
-- =========================================
CREATE TABLE IF NOT EXISTS wardens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  "wardenId" TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for wardens
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wardens' AND column_name='wardenid') THEN
    ALTER TABLE wardens RENAME COLUMN wardenid TO "wardenId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wardens' AND column_name='createdat') THEN
    ALTER TABLE wardens RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- 14. attendance
-- =========================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "residentId" UUID REFERENCES residents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type TEXT DEFAULT 'check-in',
  status TEXT DEFAULT 'present',
  "isForced" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for attendance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='residentid') THEN
    ALTER TABLE attendance RENAME COLUMN residentid TO "residentId";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='createdat') THEN
    ALTER TABLE attendance RENAME COLUMN createdat TO "createdAt";
  END IF;
END $$;

-- =========================================
-- ENABLE RLS
-- =========================================
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roomCategories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- =========================================
-- OPEN ACCESS POLICY (DEV)
-- =========================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "open_access" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "open_access" ON %I
       FOR ALL TO public
       USING (true)
       WITH CHECK (true)', t
    );
  END LOOP;
END $$;

-- =========================================
-- ENABLE REAL-TIME
-- =========================================
DO $$
DECLARE t text;
BEGIN
  -- Check if publication exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- Table might already be in publication, ignore
    END;
  END LOOP;
END $$;

-- =========================================
-- REFRESH CACHE
-- =========================================
NOTIFY pgrst, 'reload schema';
