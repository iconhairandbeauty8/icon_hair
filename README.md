# 💈 LuxeSalon NZ — Multi-Branch Salon Management SaaS

> New Zealand's premier salon management platform. Built as a production-ready SaaS with multi-branch support, online booking, Stripe payments, staff management, inventory, analytics, and a luxury parallax website.

---

## 🚀 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS + Vite     |
| Backend    | Node.js + Express + JWT Auth                    |
| Database   | PostgreSQL 15                                   |
| Payments   | Stripe (NZD, full/deposit, refunds, webhooks)  |
| Maps       | Google Maps Embed API                           |
| Auth       | JWT + RBAC (Admin, Manager, Staff, Customer)    |
| State      | Zustand + TanStack Query                        |
| Animations | Framer Motion                                   |
| Charts     | Recharts                                        |
| Realtime   | WhatsApp Business API + QR code                 |
| DevOps     | Docker Compose                                  |

---

## 📁 Project Structure

```
salon-saas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # PostgreSQL pool config
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT + RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # Login, register, refresh
│   │   │   ├── branches.js          # Multi-branch CRUD
│   │   │   ├── bookings.js          # Booking + availability engine
│   │   │   ├── payments.js          # Stripe integration
│   │   │   ├── staff.js             # Employee management
│   │   │   ├── services.js          # Services CRUD
│   │   │   ├── inventory.js         # Stock management
│   │   │   ├── reports.js           # Analytics & reporting
│   │   │   ├── promotions.js        # Promo codes & deals
│   │   │   ├── reviews.js           # Review system
│   │   │   ├── loyalty.js           # Loyalty & membership
│   │   │   ├── vouchers.js          # Gift vouchers
│   │   │   ├── social.js            # Social feed
│   │   │   ├── whatsapp.js          # WhatsApp marketing
│   │   │   ├── customers.js         # Customer management
│   │   │   └── dashboard.js         # Dashboard stats
│   │   └── index.js                 # Express app entry
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full PostgreSQL schema
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── PublicLayout.tsx  # Navbar + footer
│   │   │       └── AdminLayout.tsx   # Admin sidebar
│   │   ├── pages/
│   │   │   ├── public/              # Website pages (parallax)
│   │   │   │   ├── HomePage.tsx     # Hero + parallax + sections
│   │   │   │   ├── ServicesPage.tsx
│   │   │   │   ├── StaffPage.tsx
│   │   │   │   ├── BranchesPage.tsx # Google Maps integration
│   │   │   │   ├── GalleryPage.tsx  # Masonry + lightbox
│   │   │   │   ├── ContactPage.tsx
│   │   │   │   └── SocialFeedPage.tsx
│   │   │   ├── booking/
│   │   │   │   ├── BookingPage.tsx  # 5-step booking wizard
│   │   │   │   ├── BookingConfirmPage.tsx # Stripe payment
│   │   │   │   └── BookingSuccessPage.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboard.tsx
│   │   │   │   └── CustomerBookings.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx  # Charts + stats
│   │   │       ├── AdminBookings.tsx   # Calendar + list view
│   │   │       ├── AdminReports.tsx    # Advanced analytics
│   │   │       ├── AdminStaff.tsx
│   │   │       ├── AdminServices.tsx
│   │   │       ├── AdminBranches.tsx
│   │   │       ├── AdminInventory.tsx  # Low stock alerts
│   │   │       ├── AdminPromotions.tsx
│   │   │       ├── AdminCustomers.tsx
│   │   │       ├── AdminSocial.tsx
│   │   │       └── AdminLoyalty.tsx    # Loyalty + WhatsApp QR
│   │   ├── services/
│   │   │   └── api.ts               # Full API client layer
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand auth store
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx                  # Routing
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml               # Full stack Docker setup
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
#git clone https://github.com/yourrepo/luxesalon-nz.git
#cd luxesalon-nz

# Copy and configure env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your credentials
# Then start everything:
docker-compose up -d

# App available at:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:5000
# Postgres:  localhost:5432
```

### Option 2: Manual Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Set up PostgreSQL
createdb salon_saas
psql salon_saas < backend/migrations/001_initial_schema.sql

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files

# 4. Start development servers
npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salon_saas
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_min_32_chars
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_MAPS_KEY=AIzaSy...
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_KEY=AIzaSy...
```

---

## 🗃️ Database Schema

The PostgreSQL schema includes 20+ normalized tables:

| Table                         | Purpose                               |
|-------------------------------|---------------------------------------|
| `roles`                       | RBAC roles                            |
| `users`                       | All users (customers, staff, admin)   |
| `branches`                    | Salon locations with opening hours    |
| `employees`                   | Staff profiles + schedules            |
| `services`                    | Treatment catalog                     |
| `branch_services`             | Branch ↔ Service mapping             |
| `employee_services`           | Staff ↔ Service mapping              |
| `bookings`                    | Appointment bookings                  |
| `payments`                    | Stripe payments                       |
| `inventory_items`             | Product stock                         |
| `inventory_transactions`      | Stock movement audit log              |
| `suppliers`                   | Supplier records                      |
| `promotions`                  | Promo codes & campaigns               |
| `reviews`                     | Customer reviews                      |
| `loyalty_profiles`            | Membership tiers                      |
| `loyalty_points`              | Points ledger                         |
| `gift_vouchers`               | Purchasable vouchers                  |
| `social_posts`                | Social feed posts                     |
| `post_likes` / `post_comments`| Social engagement                    |
| `audit_logs`                  | Full audit trail                      |

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```

### Bookings
```
GET    /api/bookings/availability?branch_id&service_id&date
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id/status
PUT    /api/bookings/:id/reschedule
```

### Payments (Stripe)
```
POST   /api/payments/create-intent
POST   /api/payments/webhook
POST   /api/payments/refund
POST   /api/payments/voucher/purchase
```

### Reports
```
GET    /api/reports/revenue
GET    /api/reports/staff-performance
GET    /api/reports/services-analysis
GET    /api/reports/customer-analytics
GET    /api/reports/branch-comparison
GET    /api/reports/dashboard-summary
```

### + Branches, Staff, Services, Inventory, Promotions, Reviews, Loyalty, Vouchers, Social, WhatsApp, Customers, Dashboard

---

## 💎 Key Features

### 🌐 Public Website
- Parallax scrolling hero with video background
- Service catalog with category filtering
- Staff profiles with ratings and specialties
- Branch finder with embedded Google Maps
- Before/after gallery with masonry layout + lightbox
- Social feed with likes and comments
- Promotions and offers page

### 📅 Booking Flow (5-Step Wizard)
1. Select Branch
2. Select Service (filtered by branch)
3. Choose Stylist (with ratings)
4. Pick Date & Available Time Slot
5. Confirm + Stripe Payment (full or 20% deposit)

### 🖥️ Admin Portal
- Real-time dashboard with Recharts
- Calendar and list views for bookings
- Staff management with service assignments
- Inventory with low-stock alerts
- Advanced multi-tab reports with CSV export
- Promotion and campaign creator
- Social feed content management
- Loyalty program with WhatsApp QR marketing

### 💳 Payments
- Full or deposit payment options
- Stripe webhooks for reliable confirmation
- Gift voucher purchase and redemption
- Automatic refund processing

---

## 🏗️ Production Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy /dist folder
```

### Backend (Railway/Render/Heroku)
```bash
cd backend
# Set environment variables in your platform
# Start: node src/index.js
```

### Database (Supabase/Railway/AWS RDS)
```bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

---

## 📝 License

MIT — Build your salon empire 💈

---

*Built for the New Zealand market. Currency: NZD. Stripe NZ supported. Timezone-aware.*
