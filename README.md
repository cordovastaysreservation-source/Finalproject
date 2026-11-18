# 🌴 Cordova Stays – Resort Reservation System

> **Tagline:** *"Better Stays, Bigger Memories"*  
> Full-stack Resort Reservation System built with **Laravel 12 REST API + Sanctum** (`/backend`), **React + Vite + React Router** (`/frontend`), and **Neon Serverless PostgreSQL** database.

---

## 📑 Talaan sa Sulod (Table of Contents)
- [1. System Requirements](#1-system-requirements)
- [2. Quick Start (Pinakadali nga Paagi)](#2-quick-start-pinakadali-nga-paagi)
- [3. Manual Setup & Installation](#3-manual-setup--installation)
  - [Backend Setup (Laravel)](#backend-setup-laravel)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
- [4. Database & Mail (.env Configuration)](#4-database--mail-env-configuration)
  - [Neon PostgreSQL Database](#neon-postgresql-database)
  - [Gmail SMTP for Live 6-Digit OTP](#gmail-smtp-for-live-6-digit-otp)
- [5. Official Test Accounts & Credentials](#5-official-test-accounts--credentials)
- [6. Project Structure](#6-project-structure)
- [7. Git Push Helper](#7-git-push-helper)

---

## 1. System Requirements

Sa dili pa magsugod, siguroa nga naka-install kining mga tools sa imong computer:
- **PHP >= 8.2** *(Recommended: PHP 8.3)*
  - *Required Extensions:* `pdo_pgsql`, `pgsql`, `openssl`, `mbstring`, `curl`, `fileinfo`
- **Composer** (PHP Package Manager)
- **Node.js >= 18** & **npm**
- **Git**

---

## 2. Quick Start (Pinakadali nga Paagi)

Kung kompleto na ang setup sa `.env` ug dependencies, pwede na nimo ipadagan ang tibuok sistema sa **usa lang ka double-click**:

1. Ablihi ang main folder (`C:\final` o imong project directory).
2. I-double click ang file nga: **`start-all.bat`**
3. Mo-abli ang duha ka window:
   - 🟢 **Backend API:** `http://localhost:8000`
   - 🟢 **Frontend Web App:** `http://localhost:5173`
4. Ablihi ang browser sa: **`http://localhost:5173`**

---

## 3. Manual Setup & Installation

Kung bag-o pa nimong gi-clone ang repository gikan sa GitHub:

### Backend Setup (Laravel)
```powershell
# 1. Sudla ang backend folder
cd backend

# 2. Paghimo og kopya sa .env
copy .env.example .env

# 3. I-install ang tanang PHP dependencies
composer install

# 4. Pag-generate og application key
php artisan key:generate

# 5. I-link ang storage folder para sa uploads ug resort photos
php artisan storage:link

# 6. I-migrate ug i-seed ang database (Neon PostgreSQL)
php artisan migrate:fresh --seed

# 7. Padagana ang backend server
php artisan serve --port=8000
```
> Ang Backend API modagan sa: **`http://localhost:8000/api/v1`**

---

### Frontend Setup (React + Vite)
Ablihi ang **bag-ong terminal tab**:
```powershell
# 1. Sudla ang frontend folder
cd frontend

# 2. Paghimo og kopya sa .env
copy .env.example .env

# 3. I-install ang tanang npm packages
npm install

# 4. Padagana ang frontend development server
npm run dev
```
> Ang Frontend Web App modagan sa: **`http://localhost:5173`**

---

## 4. Database & Mail (.env Configuration)

Ablihi ang `backend/.env` file ug siguroa kining mga detalye:

### Neon PostgreSQL Database
```dotenv
DB_CONNECTION=pgsql
DB_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-gentle-scene-b3h35aaq.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DB_HOST=ep-gentle-scene-b3h35aaq.c-4.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=YOUR_PASSWORD
DB_SSLMODE=require
```
> 💡 **Importante:** Gamita ang direkta nga host (walay `-pooler`) para sa migrations aron malikayan ang transaction abort conflict.

### Gmail SMTP for Live 6-Digit OTP
Aron makapadala og tinuod nga verification code sa Gmail sa user inig register o inig forgot password:
```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=cordovastaysreservation@gmail.com
MAIL_PASSWORD=your_16_letter_google_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="cordovastaysreservation@gmail.com"
MAIL_FROM_NAME="Cordova Stays"
```
> *Pahinumdom: Ang `MAIL_PASSWORD` kinahanglan nga 16-letter **Google App Password** gikan sa Google Account Security, dili ang regular password.*

---

## 5. Official Test Accounts & Credentials

Ang sistema adunay **Unified Role-Based Authentication** sa **`http://localhost:5173/auth/login`**:
- **Admin Accounts** awtomatikong mo-redirect sa **Admin Dashboard (`/admin/overview`)**.
- **Customer Accounts** awtomatikong mo-redirect sa **Customer Portal (`/`)**.

| Role | Name | Email | Default Password | Permissions |
|---|---|---|---|---|
| **Admin** | Jeaspm Dinoy | `cordovastaysreservation@gmail.com` | `admin12345` | Tibuok access sa Admin Dashboard, Reports, Staff, ug Settings |
| **Manager** | Platform Manager | `manager@example.com` | `password` | CRUD sa Resorts, Rooms, Reservations, Payments, Reviews |
| **Receptionist** | Front Desk | `receptionist@example.com` | `password` | Reservations, Check-ins, Customer view |
| **Housekeeping** | Room Housekeeping | `housekeeping@example.com` | `password` | Room status view & updates |
| **Customer 1** | Maria Santos | `maria@example.com` | `password` | Customer booking portal |
| **Customer 2** | John Reyes | `john@example.com` | `password` | Customer booking portal |

---

## 6. Project Structure

```text
Finalproject/
├── backend/                  # Laravel 12 REST API + Sanctum + Neon PostgreSQL
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/ # Auth, Booking, Resorts, Rooms, Admin Controllers
│   │   ├── Http/Middleware/EnsureRole.php
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/       # Users, Tokens, Resorts, Rooms, Bookings, Payments
│   │   └── seeders/DatabaseSeeder.php # Initial admin, resorts, and rooms data
│   ├── routes/api.php        # API V1 Endpoints
│   └── .env.example
├── frontend/                 # React (Vite) + React Router + Axios
│   ├── src/
│   │   ├── api/client.js     # Axios API Client
│   │   ├── components/       # UI inputs, modals, layouts
│   │   ├── context/          # AuthContext, BookingFlowContext, ToastContext
│   │   ├── layouts/          # CustomerLayout, AdminLayout, AuthSplitLayout
│   │   └── pages/
│   │       ├── auth/         # Login, Register (with Gmail OTP), Forgot Password
│   │       ├── customer/     # Home, Explore, Details, Booking, Foods & Drinks
│   │       └── admin/        # Overview, Resorts, Rooms, Reservations, Reports
│   └── .env.example
├── start-all.bat             # 1-Click launcher alang sa Backend ug Frontend
├── push-to-github.bat        # 1-Click helper script para sa pag-push sa GitHub
└── README.md
```

---

## 7. Git Push Helper

Kung mag-push og mga updates sa GitHub, mahimo nimong gamiton ang:
1. **Pinaagi sa Web UI:** Adtoa ang **`http://localhost:5173/github`**, i-paste ang imong GitHub Personal Access Token, ug pindota ang **"I-push Na sa GitHub"**.
2. **Pinaagi sa Batch File:** I-double click ang **`push-to-github.bat`**.
3. **Pinaagi sa Terminal:**
   ```powershell
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

---
*Created for Cordova Stays Reservation System • Cordova, Cebu, Philippines* 🌊🌴
