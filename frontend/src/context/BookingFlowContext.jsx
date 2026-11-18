import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingFlowContext = createContext(null);

const STORAGE_KEY = 'cs_booking_flow_state_v1';

const defaultBookingState = {
  flowType: 'room', // 'room' | 'food'
  resortId: 1,
  resortSlug: 'eventesia-garden',
  resortName: 'Eventesia Garden',
  resortQr: '/images/resorts/qr-code.jpg',
  roomId: 2,
  roomName: 'Deluxe Pool View',
  pricePerNight: 3800,
  checkIn: '2026-10-20',
  checkOut: '2026-10-22',
  nights: 2,
  adults: 2,
  children: 0,
  guests: 2,
  specialRequests: '',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  notes: '',
  agreedTerms: false,
  paymentMethod: 'gcash', // 'gcash' | 'maya' | 'pay_at_resort'
  subtotal: 7600,
  fees: 500,
  total: 8100,
  bookingId: null,
  bookingReference: 'CS-2026-00125',
  // Foods & Drinks flow fields
  foodType: 'bundle', // 'bundle' | 'foods' | 'drinks'
  foodLabel: 'Bundle Foods and Drinks',
  foodPriceLabel: 'Bundle Foods',
  foodConfirmLabel: 'Foods and Drinks Bundle',
  foodTotal: 3800,
  foodDates: '20–22 Oct 2026',
  foodOrderId: null,
};

export const BookingFlowProvider = ({ children }) => {
  const [flow, setFlow] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultBookingState, ...JSON.parse(saved) } : defaultBookingState;
    } catch {
      return defaultBookingState;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
    } catch {
      // ignore storage quota errors
    }
  }, [flow]);

  const updateFlow = (partial) => {
    setFlow((prev) => {
      const next = { ...prev, ...partial };
      // Recompute nights & totals if room dates or rate changed
      if (next.flowType === 'room') {
        const d1 = new Date(next.checkIn);
        const d2 = new Date(next.checkOut);
        const diffDays = !isNaN(d1) && !isNaN(d2) && d2 > d1
          ? Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
          : 2;
        next.nights = diffDays;
        next.guests = Number(next.adults || 1) + Number(next.children || 0);
        next.subtotal = diffDays * Number(next.pricePerNight || 3800);
        next.fees = 500;
        next.total = next.subtotal + next.fees;
      }
      return next;
    });
  };

  const resetFlow = () => {
    setFlow(defaultBookingState);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <BookingFlowContext.Provider value={{ flow, updateFlow, resetFlow }}>
      {children}
    </BookingFlowContext.Provider>
  );
};

export const useBookingFlow = () => useContext(BookingFlowContext);
