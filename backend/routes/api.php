<?php

use App\Http\Controllers\Api\V1\Admin\CustomerAdminController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\PaymentAdminController;
use App\Http\Controllers\Api\V1\Admin\ReservationAdminController;
use App\Http\Controllers\Api\V1\Admin\ResortAdminController;
use App\Http\Controllers\Api\V1\Admin\ReviewAdminController;
use App\Http\Controllers\Api\V1\Admin\RoomAdminController;
use App\Http\Controllers\Api\V1\Admin\StaffAdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\FoodOrderController;
use App\Http\Controllers\Api\V1\ResortController;
use App\Http\Controllers\Api\V1\ReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // 1. Authentication (Public)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/admin/login', [AuthController::class, 'adminLogin']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/verify-code', [AuthController::class, 'verifyCode']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
        });
    });

    // 2. Public / Customer Resort & Room Discovery
    Route::get('/resorts', [ResortController::class, 'index']);
    Route::get('/resorts/{slugOrId}', [ResortController::class, 'show']);
    Route::get('/resorts/{slugOrId}/available-rooms', [ResortController::class, 'availableRooms']);
    Route::get('/resorts/{slugOrId}/foods-drinks', [FoodOrderController::class, 'showCatalog']);

    // 3. Booking, Quote, Payment & Food Orders
    Route::post('/bookings/quote', [BookingController::class, 'quote']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{idOrRef}', [BookingController::class, 'show']);
    Route::post('/payments/submit', [BookingController::class, 'submitPayment']);
    Route::post('/food-orders', [FoodOrderController::class, 'store']);

    // 4. Protected Customer Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/my-bookings', [BookingController::class, 'myBookings']);
        Route::get('/my-bookings/{idOrRef}', [BookingController::class, 'show']);
        Route::post('/my-bookings/{idOrRef}/cancel', [BookingController::class, 'cancel']);
        Route::post('/reviews', [ReviewController::class, 'store']);
    });

    // 5. Protected Admin & Staff Routes (Role-based access control)
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin,manager,receptionist,housekeeping'])->group(function () {
        // Overview & Reports
        Route::get('/overview', [DashboardController::class, 'overview']);
        Route::get('/reports', [DashboardController::class, 'reports']);
        Route::get('/reports/download/{type}', [DashboardController::class, 'downloadReport']);

        // Rooms: Housekeeping has read-only access; Admin & Manager have full CRUD
        Route::get('/rooms', [RoomAdminController::class, 'index']);
        Route::get('/rooms/{id}', [RoomAdminController::class, 'show']);
        Route::middleware('role:admin,manager')->group(function () {
            Route::post('/rooms', [RoomAdminController::class, 'store']);
            Route::post('/rooms/{id}', [RoomAdminController::class, 'update']); // supports multipart/form-data
            Route::put('/rooms/{id}', [RoomAdminController::class, 'update']);
            Route::delete('/rooms/{id}', [RoomAdminController::class, 'destroy']);
        });

        // Resorts: Read for all staff (for dropdowns), Write for Admin & Manager
        Route::get('/resorts', [ResortAdminController::class, 'index']);
        Route::get('/resorts/{id}', [ResortAdminController::class, 'show']);
        Route::middleware('role:admin,manager')->group(function () {
            Route::post('/resorts', [ResortAdminController::class, 'store']);
            Route::post('/resorts/{id}', [ResortAdminController::class, 'update']); // supports multipart/form-data
            Route::put('/resorts/{id}', [ResortAdminController::class, 'update']);
            Route::delete('/resorts/{id}', [ResortAdminController::class, 'destroy']);
        });

        // Reservations, Customers, Payments: Admin, Manager, Receptionist
        Route::middleware('role:admin,manager,receptionist')->group(function () {
            Route::get('/reservations', [ReservationAdminController::class, 'index']);
            Route::get('/reservations/{id}', [ReservationAdminController::class, 'show']);
            Route::put('/reservations/{id}', [ReservationAdminController::class, 'update']);
            Route::delete('/reservations/{id}', [ReservationAdminController::class, 'destroy']);

            Route::get('/customers', [CustomerAdminController::class, 'index']);
            Route::get('/customers/{id}', [CustomerAdminController::class, 'show']);
            Route::post('/customers', [CustomerAdminController::class, 'store']);
            Route::put('/customers/{id}', [CustomerAdminController::class, 'update']);
            Route::delete('/customers/{id}', [CustomerAdminController::class, 'destroy']);

            Route::get('/payments/export', [PaymentAdminController::class, 'export']);
            Route::get('/payments', [PaymentAdminController::class, 'index']);
            Route::put('/payments/{id}', [PaymentAdminController::class, 'update']);
            Route::delete('/payments/{id}', [PaymentAdminController::class, 'destroy']);
        });

        // Reviews: Admin & Manager
        Route::middleware('role:admin,manager')->group(function () {
            Route::get('/reviews/export', [ReviewAdminController::class, 'export']);
            Route::get('/reviews', [ReviewAdminController::class, 'index']);
            Route::put('/reviews/{id}', [ReviewAdminController::class, 'update']);
            Route::delete('/reviews/{id}', [ReviewAdminController::class, 'destroy']);
        });

        // Staff Management: Admin only
        Route::middleware('role:admin')->group(function () {
            Route::get('/staff', [StaffAdminController::class, 'index']);
            Route::get('/staff/{id}', [StaffAdminController::class, 'show']);
            Route::post('/staff', [StaffAdminController::class, 'store']);
            Route::put('/staff/{id}', [StaffAdminController::class, 'update']);
            Route::delete('/staff/{id}', [StaffAdminController::class, 'destroy']);
        });
    });
});
