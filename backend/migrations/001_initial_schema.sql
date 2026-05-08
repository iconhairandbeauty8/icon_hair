-- =============================================
-- LUXESALON NZ - COMPLETE DATABASE SCHEMA
-- PostgreSQL 15+
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- ROLES & USERS
-- =============================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL, -- admin, manager, staff, customer
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"all": true}'),
  ('manager', '{"branches": ["read","write"], "staff": ["read","write"], "bookings": ["read","write","delete"], "reports": ["read"], "inventory": ["read","write"]}'),
  ('staff', '{"bookings": ["read","write"], "schedule": ["read","write"]}'),
  ('customer', '{"bookings": ["read","create"], "profile": ["read","write"]}');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  stripe_customer_id VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- =============================================
-- BRANCHES
-- =============================================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  address TEXT NOT NULL,
  suburb VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  postcode VARCHAR(10),
  phone VARCHAR(30),
  email VARCHAR(255),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{
    "monday":    {"open":"09:00","close":"18:00","closed":false},
    "tuesday":   {"open":"09:00","close":"18:00","closed":false},
    "wednesday": {"open":"09:00","close":"18:00","closed":false},
    "thursday":  {"open":"09:00","close":"20:00","closed":false},
    "friday":    {"open":"09:00","close":"18:00","closed":false},
    "saturday":  {"open":"09:00","close":"17:00","closed":false},
    "sunday":    {"open":"10:00","close":"16:00","closed":false}
  }',
  image_url TEXT,
  gallery JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  parking_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_city ON branches(city);
CREATE INDEX idx_branches_active ON branches(is_active);

-- =============================================
-- SERVICES
-- =============================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL, -- Hair, Beauty, Nails, Skincare, etc.
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);

-- Service <-> Branch mapping
CREATE TABLE branch_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2), -- override service price per branch
  UNIQUE(branch_id, service_id)
);

-- =============================================
-- EMPLOYEES
-- =============================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  role VARCHAR(100) NOT NULL, -- Hairdresser, Barber, Beautician, Nail Tech, etc.
  bio TEXT,
  image_url TEXT,
  experience_years INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  schedule JSONB DEFAULT '{}', -- weekly availability schedule
  is_active BOOLEAN DEFAULT TRUE,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_employees_active ON employees(is_active);

-- Employee <-> Service mapping
CREATE TABLE employee_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(employee_id, service_id)
);

-- Employee leave / time off
CREATE TABLE employee_leave (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason VARCHAR(200),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKINGS
-- =============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(20) UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
  customer_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  service_id UUID NOT NULL REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
  notes TEXT,
  internal_notes TEXT,
  is_new_customer BOOLEAN DEFAULT FALSE,
  voucher_id UUID,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_employee ON bookings(employee_id);
CREATE INDEX idx_bookings_branch ON bookings(branch_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id VARCHAR(200) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NZD',
  payment_type VARCHAR(20) DEFAULT 'full', -- full, deposit
  payment_method VARCHAR(50), -- card, apple_pay, google_pay
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- =============================================
-- INVENTORY
-- =============================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(30),
  website TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'unit', -- unit, ml, g, kg, L
  cost_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  reorder_point DECIMAL(10,3) DEFAULT 5,
  max_stock DECIMAL(10,3),
  supplier_id UUID REFERENCES suppliers(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_branch ON inventory_items(branch_id);
CREATE INDEX idx_inventory_low_stock ON inventory_items(quantity, reorder_point);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  adjustment DECIMAL(10,3) NOT NULL,
  reason VARCHAR(200),
  booking_id UUID REFERENCES bookings(id),
  adjusted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service inventory requirements
CREATE TABLE inventory_service_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity_used DECIMAL(10,3) NOT NULL,
  UNIQUE(service_id, inventory_item_id)
);

-- =============================================
-- PROMOTIONS & MARKETING
-- =============================================

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- daily_special, weekly_deal, monthly_campaign, discount_code, package
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(10,2) NOT NULL,
  code VARCHAR(50) UNIQUE,
  min_spend DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  branch_id UUID REFERENCES branches(id), -- NULL = all branches
  applicable_services JSONB DEFAULT '[]', -- empty = all services
  applicable_dates JSONB DEFAULT '[]',    -- empty = no date restriction
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active, end_date);

-- =============================================
-- REVIEWS
-- =============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  employee_id UUID REFERENCES employees(id),
  service_id UUID REFERENCES services(id),
  branch_id UUID REFERENCES branches(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT, -- staff reply
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX idx_reviews_employee ON reviews(employee_id);
CREATE INDEX idx_reviews_branch ON reviews(branch_id);

-- =============================================
-- LOYALTY & MEMBERSHIP
-- =============================================

CREATE TABLE loyalty_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES users(id),
  membership_tier VARCHAR(50) DEFAULT 'standard', -- standard, silver, gold, vip, platinum
  is_loyalty_member BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL,
  description VARCHAR(200),
  booking_id UUID REFERENCES bookings(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_points_customer ON loyalty_points(customer_id);

CREATE TABLE membership_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  benefits JSONB DEFAULT '[]',
  discount_percentage INTEGER DEFAULT 0,
  priority_booking BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GIFT VOUCHERS
-- =============================================

CREATE TABLE gift_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2),
  purchaser_id UUID REFERENCES users(id),
  recipient_name VARCHAR(200),
  recipient_email VARCHAR(255),
  message TEXT,
  stripe_payment_intent_id VARCHAR(200),
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 months'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vouchers_code ON gift_vouchers(code);

-- =============================================
-- SOCIAL FEED
-- =============================================

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  title VARCHAR(300),
  content TEXT NOT NULL,
  image_urls JSONB DEFAULT '[]',
  type VARCHAR(50) DEFAULT 'post', -- post, offer, service_highlight, before_after
  linked_service_id UUID REFERENCES services(id),
  linked_promotion_id UUID REFERENCES promotions(id),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Sample NZ Services
INSERT INTO services (name, category, description, price, duration_minutes) VALUES
  ('Women''s Haircut & Style', 'Hair', 'Full cut, wash, blow-dry and style', 89.00, 75),
  ('Men''s Haircut', 'Hair', 'Classic or modern cut with wash', 55.00, 45),
  ('Full Colour', 'Hair Colour', 'All-over colour with conditioning treatment', 149.00, 120),
  ('Highlights - Full Head', 'Hair Colour', 'Full head highlights with toner', 220.00, 150),
  ('Balayage', 'Hair Colour', 'Hand-painted colour for natural sun-kissed look', 280.00, 180),
  ('Keratin Treatment', 'Hair Treatment', 'Smoothing treatment for frizz-free hair', 350.00, 180),
  ('Classic Facial', 'Skincare', 'Deep cleanse, exfoliation and hydration', 95.00, 60),
  ('Deluxe Facial', 'Skincare', 'Premium treatment with mask and massage', 145.00, 90),
  ('Gel Manicure', 'Nails', 'Long-lasting gel polish on natural nails', 65.00, 60),
  ('Acrylic Full Set', 'Nails', 'Full set of acrylic nail extensions', 95.00, 90),
  ('Pedicure', 'Nails', 'Foot soak, exfoliation, cuticle care and polish', 75.00, 60),
  ('Eyebrow Shaping & Tint', 'Beauty', 'Wax/thread shaping plus tint', 45.00, 30),
  ('Eyelash Extensions - Classic', 'Beauty', 'Classic individual lash extensions', 130.00, 90),
  ('Body Massage - 60min', 'Wellness', 'Relaxing Swedish full body massage', 110.00, 60),
  ('Hot Stone Massage', 'Wellness', 'Therapeutic hot stone massage', 140.00, 75);

COMMENT ON DATABASE salon_saas IS 'LuxeSalon NZ - Multi-branch Salon Management SaaS';
