# Cordova Stays – Resort Reservation System

> **Tagline:** *"Better Stays, Bigger Memories"*

Full-stack Resort Reservation System built with **Laravel 12 REST API + Sanctum** (`/backend`), **React + Vite + React Router** (`/frontend`), and **Neon Serverless PostgreSQL** database.

---

## 1. Project Structure

```text
Finalproject/
├── backend/                  # Laravel 12 REST API (/api/v1) + Sanctum + Neon PostgreSQL
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   ├── Http/Middleware/EnsureRole.php
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/api.php
│   └── .env.example
├── frontend/                 # React (Vite) + React Router + Axios + Recharts
│   ├── public/images/resorts/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/       # ImagePlaceholder, UI, CustomerCards
│   │   ├── context/          # AuthContext, BookingFlowContext, ToastContext
│   │   ├── layouts/          # CustomerLayout, AuthSplitLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── auth/         # Login, Register, Forgot/Reset/Change Password
│   │   │   ├── customer/     # Home, Explore, Resort Details, Rooms, Booking, Foods & Drinks, Profile
│   │   │   └── admin/        # Overview, Resorts, Rooms, Reservations, Customers, Payments, Reviews, Reports, Staff
│   │   └── styles/           # Design tokens & global styles matching Figma
│   └── .env.example
└── start-all.bat             # One-click launcher for Backend (8000) & Frontend (5173)
```

---

## 2. Setup & Run Instructions

### Option 1: One-Click Launcher (Fastest)
Double-click `start-all.bat` in the root directory to run both Backend and Frontend simultaneously.

### Option 2: Manual Run

#### Backend (`/backend` - Laravel + Neon PostgreSQL)
```powershell
cd backend
composer install
php artisan key:generate
php artisan storage:link
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
- Backend API runs at: `http://localhost:8000/api/v1`

#### Frontend (`/frontend` - React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- Application (Unified Role-Based Login): `http://localhost:5173/auth/login`

---

## 3. Unified Role-Based Authentication (`/auth/login`)

Both **Admin** and **Customer** accounts sign in through the single login page at **`/auth/login`**:
- **Admin (`role: admin`)** → Automatically redirects to the **Admin Dashboard (`/admin/overview`)**.
- **Customer (`role: customer`)** → Automatically redirects to the **Customer Portal (`/`)**.

### Official Admin Account
| Role | Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | Jeaspm Dinoy | `cordovastaysreservation@gmail.com` | `admin12345` | Full access (Overview, Resorts, Rooms, Reservations, Customers, Payments, Reviews, Reports, Staff) |

### Customer Portal (`/auth/register` & `/auth/login`)
- Customers can create their own account at **`/auth/register`** and sign in at **`/auth/login`**.
- **Password Policy:** At least 8 characters, including at least 1 uppercase letter (`A–Z`), 1 number (`0–9`), and no spaces.
- **Forgot Password:** Supports a 6-digit verification code sent via Gmail (`/auth/forgot-password`).

---

## 4. Seeded Cordova Resorts (Cordova, Cebu)

1. **Eventesia Garden** — *"Garden escape with relaxing poolside spaces."*
2. **Casa Ragina** — *"A peaceful stay for couples and families."*
3. **Cordova Home Village** — *"Comfortable village-style family getaway."*
4. **Cordova Reef Village** — *"A tropical retreat near the coast."*
5. **Villa Asela** — *"A quiet and cozy resort stay."*
6. **Flores Villa** — *"Leisure spaces for a refreshing break."*
7. **Alta Resort** — *"A modern resort experience in Cordova."*
8. **Solea Resort** — *"A seaside-inspired destination for your getaway."*
9. **Gitika Resort** — *"A welcoming place to relax and recharge."*

Each resort includes 3 room types:
- **Standard Room** (`1 queen bed`, up to 2 guests, `₱2,500 / night`)
- **Deluxe Pool View** (`1 king bed`, up to 2 guests, `₱3,800 / night`)
- **Family Room** (`2 beds`, up to 4 guests, `₱5,200 / night`)
