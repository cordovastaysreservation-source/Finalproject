# Cordova Stays – Resort Reservation System

> **Tagline:** *"Better Stays, Bigger Memories"*

Full-stack Resort Reservation System built with **Laravel 12 REST API + Sanctum** (`/backend`), **React + Vite + React Router** (`/frontend`), and **Neon Serverless PostgreSQL** database.

---

## 1. Project Structure

```text
C:\Jeason Final\
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
│   └── .env / .env.example
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
│   └── .env / .env.example
└── start-all.bat             # One-click launcher for Backend (8000) & Frontend (5173)
```

---

## 2. Setup & Run Instructions

### Backend (`/backend` - Laravel + Neon PostgreSQL)
```powershell
cd "C:\Jeason Final\backend"
composer install
# Configure .env with your Neon PostgreSQL credentials (already configured)
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
- Backend API runs at: `http://localhost:8000/api/v1`

### Frontend (`/frontend` - React + Vite)
```powershell
cd "C:\Jeason Final\frontend"
npm install
npm run dev
```
- Customer Portal runs at: `http://localhost:5173/`
- Admin Dashboard runs at: `http://localhost:5173/admin/login`

---

## 3. Accounts (Seeded in Neon PostgreSQL)

### Official Admin Account (`/admin/login`)
| Role | Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | Jeaspm Dinoy | `cordovastaysreservation@gmail.com` | `admin12345` | Full access (Overview, Resorts, Rooms, Reservations, Customers, Payments, Reviews, Reports, Staff) |

### Customer / User Accounts (`/auth/login`)
*(Password for all sample customers is **`password`**, or register your own account at `/auth/register`)*
| Name | Email | Password | Phone |
|---|---|---|---|
| **Maria Santos** | `maria@example.com` | `password` | `0917 123 1024` |
| **John Reyes** | `john@example.com` | `password` | `0917 234 2055` |
| **Ana Dela Cruz** | `ana@example.com` | `password` | `0917 345 3188` |
| **Mark Lim** | `mark@example.com` | `password` | `0917 456 4471` |
| **Guest Surname** | `guest@example.com` | `password` | `0917 555 8899` |

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
