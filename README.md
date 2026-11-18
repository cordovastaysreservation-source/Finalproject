# Cordova Stays – Resort Reservation System

> **Tagline:** *"Better Stays, Bigger Memories"*  
> Full-Stack Resort Reservation System built with **Laravel 12 REST API + Sanctum** (`/backend`), **React + Vite + React Router** (`/frontend`), and **Neon Serverless PostgreSQL** database.

---

## 1. System Overview

**Cordova Stays** is a web-based resort booking and reservation management platform designed for resorts in Cordova, Cebu, Philippines. The application features unified role-based authentication, real-time booking calculations, room and food catalog browsing, and an administrative dashboard for resort operations.

### Key Features
- **Unified Role-Based Authentication:** Single login portal (`/auth/login`) with automatic role-based routing (Admin, Manager, Receptionist, Housekeeping, and Customer).
- **Two-Factor Email OTP Verification:** Secure 6-digit email verification code via Gmail SMTP for new customer registration and password resets.
- **Resort & Room Discovery:** Browse resorts across Cordova with available room types, pricing, amenities, and image galleries.
- **Reservation & Booking Flow:** Date picker, guest counters, automated price calculation, and payment proof submission.
- **Food & Beverage Ordering:** In-stay food and drinks catalog ordering per resort.
- **Comprehensive Admin Dashboard:** Real-time statistics, reservation management, room status tracking, guest reviews, and exportable reports.

---

## 2. Technology Stack

- **Backend:** Laravel 12 (PHP 8.2+), Laravel Sanctum (Token-based API Authentication)
- **Frontend:** React 19, Vite, React Router v7, Axios, Recharts, Lucide Icons
- **Database:** PostgreSQL (Neon Serverless PostgreSQL)
- **Styling:** Custom Modular CSS with unified resort brand tokens
- **Mailing:** Gmail SMTP (Secure TLS Transport)

---

## 3. Prerequisites

Before running the application, ensure the following are installed on your environment:
- **PHP >= 8.2** *(Required Extensions: `pdo_pgsql`, `pgsql`, `openssl`, `mbstring`, `curl`, `fileinfo`)*
- **Composer** (PHP Dependency Manager)
- **Node.js >= 18.0.0** and **npm**

---

## 4. How to Run the Project

### Option A: One-Click Launcher (Recommended)
Double-click the launcher script in the root directory:
```text
start-all.bat
```
This automatically launches both services in separate terminal windows:
- **Backend API:** `http://localhost:8000`
- **Frontend Web Application:** `http://localhost:5173`

---

### Option B: Manual Terminal Execution

#### 1. Start the Backend API
Open a terminal in the project directory:
```powershell
cd backend
php artisan serve --port=8000
```
> The API server will be available at `http://localhost:8000/api/v1`.

#### 2. Start the Frontend Application
Open a second terminal window:
```powershell
cd frontend
npm run dev
```
> The web application will be available at `http://localhost:5173`.

---

## 5. Initial Configuration (.env)

If setting up on a new environment, ensure your `.env` files are configured:

### Backend (`/backend/.env`)
```dotenv
APP_NAME="Cordova Stays"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=ep-gentle-scene-b3h35aaq.c-4.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=your_database_password
DB_SSLMODE=require

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=cordovastaysreservation@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="cordovastaysreservation@gmail.com"
MAIL_FROM_NAME="Cordova Stays"
```

Database initialization commands (if needed):
```powershell
cd backend
php artisan key:generate
php artisan storage:link
php artisan migrate:fresh --seed
```

### Frontend (`/frontend/.env`)
```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_BACKEND_URL=http://localhost:8000
```

---

## 6. Official Accounts & Demo Credentials

Users can sign in at **`http://localhost:5173/auth/login`**. The system automatically redirects users to their appropriate dashboard based on their assigned role:

| Role | Name | Email | Password | Access Level |
|---|---|---|---|---|
| **Admin** | Jeaspm Dinoy | `cordovastaysreservation@gmail.com` | `admin12345` | Full administrative control (Overview, Resorts, Rooms, Reservations, Customers, Payments, Reviews, Staff, Reports) |
| **Manager** | Platform Manager | `manager@example.com` | `password` | Management of Resorts, Rooms, Reservations, Payments, Reviews |
| **Receptionist** | Front Desk | `receptionist@example.com` | `password` | Front desk operations (Reservations, Guest verification, Check-ins) |
| **Housekeeping** | Room Housekeeping | `housekeeping@example.com` | `password` | Room status tracking & maintenance view |
| **Customer** | Maria Santos | `maria@example.com` | `password` | Public booking, reservation tracking, reviews |
| **Customer** | John Reyes | `john@example.com` | `password` | Public booking, reservation tracking, reviews |

> **Self-Registration:** New customers can register an account at **`/auth/register`** with live 6-digit OTP email verification sent to their Gmail.

---

## 7. Seeded Cordova Resorts (Cordova, Cebu)

The system comes pre-seeded with 9 local resorts in Cordova, Cebu, each with 3 room categories (Standard Room, Deluxe Pool View, Family Room):

1. **Eventesia Garden** — *Garden escape with relaxing poolside spaces.*
2. **Casa Ragina** — *A peaceful stay for couples and families.*
3. **Cordova Home Village** — *Comfortable village-style family getaway.*
4. **Cordova Reef Village** — *A tropical retreat near the coast.*
5. **Villa Asela** — *A quiet and cozy resort stay.*
6. **Flores Villa** — *Leisure spaces for a refreshing break.*
7. **Alta Resort** — *A modern resort experience in Cordova.*
8. **Solea Resort** — *A seaside-inspired destination for your getaway.*
9. **Gitika Resort** — *A welcoming place to relax and recharge.*

---

## 8. Project Structure

```text
Finalproject/
├── backend/                  # Laravel 12 REST API + Sanctum + Neon PostgreSQL
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
├── frontend/                 # React (Vite) + React Router + Axios
│   ├── public/images/resorts/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   └── pages/
│   │       ├── auth/
│   │       ├── customer/
│   │       └── admin/
│   └── .env.example
├── start-all.bat             # Application launcher
└── README.md
```

---
*Cordova Stays – Resort Reservation System • Cordova, Cebu, Philippines*
