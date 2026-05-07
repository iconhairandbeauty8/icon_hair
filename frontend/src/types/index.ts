// Core types for LuxeSalon SaaS

export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role_id: string;
  role_name: UserRole;
  stripe_customer_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url?: string;
  is_active: boolean;
  avg_rating?: number;
  review_count?: number;
  booking_count?: number;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: string;
  bio?: string;
  image_url?: string;
  experience_years: number;
  avg_rating: number;
  review_count?: number;
  schedule: Record<string, unknown>;
  services?: string[];
  total_bookings?: number;
  is_active: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  reference: string;
  customer_id: string;
  employee_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  price: number;
  status: BookingStatus;
  notes?: string;
  // Joined fields
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  staff_name?: string;
  staff_image?: string;
  service_name?: string;
  duration_minutes?: number;
  payment_status?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_type: 'full' | 'deposit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  paid_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  unit: string;
  cost_price: number;
  retail_price: number;
  reorder_point: number;
  supplier_id?: string;
  supplier_name?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'daily_special' | 'weekly_deal' | 'monthly_campaign' | 'discount_code' | 'package';
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  code?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Review {
  id: string;
  customer_id: string;
  customer_name: string;
  avatar_url?: string;
  employee_id?: string;
  staff_name?: string;
  service_id?: string;
  service_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SocialPost {
  id: string;
  author_id: string;
  author_name: string;
  title?: string;
  content: string;
  image_urls: string[];
  type: 'post' | 'offer' | 'service_highlight' | 'before_after';
  like_count: number;
  comments?: { id: string; text: string; author: string }[];
  created_at: string;
}

export interface DashboardStats {
  stats: {
    today_bookings: { count: number; revenue: number };
    upcoming_today: number;
    month: { revenue: number; bookings: number };
    total_customers: number;
    low_stock_alerts: number;
  };
  recent_bookings: Booking[];
  top_services: { name: string; bookings: number; revenue: number }[];
  staff_on_duty: Employee[];
}

export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  remaining_amount: number;
  recipient_name: string;
  recipient_email: string;
  message?: string;
  is_redeemed: boolean;
  expires_at: string;
}

export interface LoyaltyProfile {
  membership_tier: 'standard' | 'silver' | 'gold' | 'vip' | 'platinum';
  total_points: number;
  is_loyalty_member: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingStep {
  step: number;
  label: string;
  complete: boolean;
  active: boolean;
}
