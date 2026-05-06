// ─── Express augmentation ─────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────
export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: string;
  role_name: string;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Branch ───────────────────────────────────────────────────────────────────
export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  suburb: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: OpeningHours;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Employee ─────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  branch_id: string;
  bio: string | null;
  image_url: string | null;
  experience_years: number;
  schedule: Record<string, unknown>;
  avg_rating: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  customer_id: string;
  branch_id: string;
  employee_id: string;
  service_id: string;
  start_time: Date;
  end_time: Date;
  price: number;
  status: BookingStatus;
  notes: string | null;
  voucher_id: string | null;
  is_new_customer: boolean;
  created_at: Date;
  updated_at: Date;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'full' | 'deposit';

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  paid_at: Date | null;
  refunded_at: Date | null;
  created_at: Date;
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  unit: string;
  cost_price: number | null;
  retail_price: number | null;
  reorder_point: number;
  supplier_id: string | null;
  branch_id: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  employee_id: string | null;
  service_id: string | null;
  branch_id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: Date;
}

// ─── Gift Voucher ─────────────────────────────────────────────────────────────
export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  purchaser_id: string;
  recipient_name: string | null;
  recipient_email: string | null;
  message: string | null;
  stripe_payment_intent_id: string | null;
  is_redeemed: boolean;
  expires_at: Date | null;
  created_at: Date;
}

// ─── Promotion ────────────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  type: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: Date | null;
  end_date: Date | null;
  code: string | null;
  image_url: string | null;
  branch_id: string | null;
  applicable_services: string[];
  is_active: boolean;
  created_at: Date;
}

// ─── Image ────────────────────────────────────────────────────────────────────
export interface ImageRecord {
  id: string;
  data: Buffer;
  mime_type: string;
  filename: string;
  file_size: number;
  folder: string;
  uploaded_by: string | null;
  created_at: Date;
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export type MembershipTier = 'standard' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyProfile {
  id: string;
  customer_id: string;
  membership_tier: MembershipTier;
  created_at: Date;
}
