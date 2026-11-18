import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingFlowProvider } from './context/BookingFlowContext';
import { ToastProvider } from './context/ToastContext';

import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

import {
  LoginPage,
  RegisterPage,
  AccountCreatedPage,
  ForgotPasswordStep1Page,
  ForgotPasswordStep2Page,
  CreateNewPasswordPage,
  PasswordUpdatedPage,
  ChangePasswordPage,
} from './pages/auth/AuthPages';

import {
  HomePage,
  ExploreResortsPage,
  ResortDetailsPage,
  AvailableRoomsPage,
} from './pages/customer/DiscoveryPages';

import {
  BookingDetailsPage,
  GuestInfoPage,
  PaymentPage,
  CompletePaymentQrPage,
  BookingConfirmationPage,
  MyBookingsPage,
  MyBookingDetailPage,
  MyProfilePage,
} from './pages/customer/BookingPages';

import {
  FoodsAndDrinksMainPage,
  ResortFoodsDrinksGalleryPage,
  FoodDrinkItemDetailPage,
  FoodDrinkPaymentPricePage,
} from './pages/customer/FoodsDrinksPages';

import {
  AdminLoginPage,
  AdminOverviewPage,
  AdminReportsPage,
} from './pages/admin/AdminCorePages';

import {
  AdminResortsPage,
  AdminResortFormPage,
  AdminRoomsPage,
  AdminAddRoomPage,
  AdminEditRoomPage,
} from './pages/admin/AdminCatalogPages';

import {
  AdminReservationsPage,
  AdminCustomersPage,
  AdminCustomerFormPage,
  AdminPaymentsPage,
  AdminExportPaymentsPage,
  AdminReviewsPage,
  AdminExportReviewsPage,
  AdminStaffPage,
  AdminStaffFormPage,
} from './pages/admin/AdminOperationsPages';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BookingFlowProvider>
          <BrowserRouter>
            <Routes>
              {/* Customer Auth Routes (Split Layout, No Sidebar) */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/account-created" element={<AccountCreatedPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordStep1Page />} />
              <Route path="/auth/verify-code" element={<ForgotPasswordStep2Page />} />
              <Route path="/auth/reset-password" element={<CreateNewPasswordPage />} />
              <Route path="/auth/password-updated" element={<PasswordUpdatedPage toProfile={false} />} />
              <Route path="/auth/change-password" element={<ChangePasswordPage />} />
              <Route path="/auth/profile-password-updated" element={<PasswordUpdatedPage toProfile={true} />} />

              {/* Customer Portal Routes (Top Bar + Left Sidebar) */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExploreResortsPage />} />
                <Route path="resorts/:slug" element={<ResortDetailsPage />} />
                <Route path="resorts/:slug/rooms" element={<AvailableRoomsPage />} />

                {/* Room Booking & Payment Flow */}
                <Route path="booking/details" element={<BookingDetailsPage />} />
                <Route path="booking/guest-info" element={<GuestInfoPage />} />
                <Route path="booking/payment" element={<PaymentPage />} />
                <Route path="booking/qr-payment" element={<CompletePaymentQrPage />} />
                <Route path="booking/confirmation" element={<BookingConfirmationPage />} />

                {/* My Bookings & My Profile */}
                <Route path="my-bookings" element={<MyBookingsPage />} />
                <Route path="my-bookings/:id" element={<MyBookingDetailPage />} />
                <Route path="profile" element={<MyProfilePage />} />

                {/* Foods and Drinks Flow */}
                <Route path="foods-drinks" element={<FoodsAndDrinksMainPage />} />
                <Route path="foods-drinks/:slug" element={<ResortFoodsDrinksGalleryPage />} />
                <Route path="foods-drinks/:slug/:itemType" element={<FoodDrinkItemDetailPage />} />
                <Route path="foods-drinks/:slug/:itemType/price" element={<FoodDrinkPaymentPricePage />} />
              </Route>

              {/* Unified Role-Based Login Redirect */}
              <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />

              {/* Protected Admin Dashboard Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/overview" replace />} />
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="resorts" element={<AdminResortsPage />} />
                <Route path="resorts/new" element={<AdminResortFormPage />} />
                <Route path="resorts/:id/edit" element={<AdminResortFormPage />} />
                <Route path="rooms" element={<AdminRoomsPage />} />
                <Route path="rooms/new" element={<AdminAddRoomPage />} />
                <Route path="rooms/:id/edit" element={<AdminEditRoomPage />} />
                <Route path="reservations" element={<AdminReservationsPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="customers/new" element={<AdminCustomerFormPage />} />
                <Route path="customers/:id/edit" element={<AdminCustomerFormPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="payments/export" element={<AdminExportPaymentsPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="reviews/export" element={<AdminExportReviewsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="staff/new" element={<AdminStaffFormPage />} />
                <Route path="staff/:id/edit" element={<AdminStaffFormPage />} />
              </Route>

              {/* Catch-all Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </BookingFlowProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
