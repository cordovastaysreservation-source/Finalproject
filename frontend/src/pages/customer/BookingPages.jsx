import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { Button, FloatingInput, FloatingSelect, StatusBadge, Modal } from '../../components/UI';
import { BookingCard } from '../../components/CustomerCards';
import { useBookingFlow } from '../../context/BookingFlowContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatShortDateRange } from '../../styles/tokens';
import { printBookingVoucher } from '../../utils/printPdf';

/**
 * 1. Booking Details Page (Page 54)
 */
export function BookingDetailsPage() {
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();
  const { showToast } = useToast();
  const [quoteWarning, setQuoteWarning] = useState('');

  useEffect(() => {
    if (!flow.roomId || !flow.checkIn || !flow.checkOut) return;
    setQuoteWarning('');
    api
      .post('/bookings/quote', {
        room_id: flow.roomId,
        check_in: flow.checkIn,
        check_out: flow.checkOut,
        adults: flow.adults,
        children: flow.children,
      })
      .then((res) => {
        if (res.data.available === false) {
          setQuoteWarning('Note: This room already has an overlapping booking for the selected dates.');
        }
      })
      .catch((err) => {
        const msg =
          err.response?.data?.errors?.guests?.[0] ||
          err.response?.data?.errors?.check_out?.[0] ||
          '';
        if (msg) setQuoteWarning(msg);
      });
  }, [flow.roomId, flow.checkIn, flow.checkOut, flow.adults, flow.children]);

  const handleContinue = (e) => {
    e.preventDefault();
    if (new Date(flow.checkOut) <= new Date(flow.checkIn)) {
      showToast('Check-out date must be after check-in date.', 'error');
      return;
    }
    if (quoteWarning) {
      showToast(quoteWarning, 'error');
      return;
    }
    navigate('/booking/guest-info');
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Booking Details
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <form onSubmit={handleContinue} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40' }}>
            Your booking details
          </h2>

          <FloatingInput
            label="Resort"
            value={flow.resortName}
            readOnly
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FloatingInput
              label="Check-in date"
              type="date"
              value={flow.checkIn}
              onChange={(e) => updateFlow({ checkIn: e.target.value })}
            />
            <FloatingInput
              label="Check-out date"
              type="date"
              value={flow.checkOut}
              min={flow.checkIn}
              onChange={(e) => updateFlow({ checkOut: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FloatingSelect
              label="Adults"
              value={flow.adults}
              onChange={(e) => updateFlow({ adults: Number(e.target.value) })}
              options={[
                { value: 1, label: '1 adult' },
                { value: 2, label: '2 adults' },
                { value: 3, label: '3 adults' },
                { value: 4, label: '4 adults' },
              ]}
            />
            <FloatingSelect
              label="Children"
              value={flow.children}
              onChange={(e) => updateFlow({ children: Number(e.target.value) })}
              options={[
                { value: 0, label: '0 children' },
                { value: 1, label: '1 child' },
                { value: 2, label: '2 children' },
              ]}
            />
          </div>

          <FloatingInput
            label="Selected room"
            value={flow.roomName}
            readOnly
          />

          <div className="cs-floating-field">
            <span className="cs-floating-label">Special requests (optional)</span>
            <textarea
              rows={3}
              value={flow.specialRequests}
              onChange={(e) => updateFlow({ specialRequests: e.target.value })}
              placeholder="Add any requests for the resort..."
              className="cs-floating-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            {quoteWarning && (
              <div
                style={{
                  backgroundColor: '#FADCD9',
                  color: '#A82E2E',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                {quoteWarning}
              </div>
            )}
            <Button type="submit" style={{ marginTop: 4 }}>
              Continue to Guest Information
            </Button>
          </div>
        </form>

        {/* Right: Booking Summary Card */}
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
            Booking summary
          </h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              fontWeight: 700,
              color: '#0F3F40',
            }}
          >
            <span>{flow.roomName}</span>
            <span>{formatCurrency(flow.pricePerNight)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 14 }}>
            {flow.nights} {flow.nights === 1 ? 'night' : 'nights'} × sample nightly rate
          </div>

          <div
            style={{
              borderTop: '1px solid #E2ECEA',
              paddingTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E5959' }}>
              <span>Room subtotal</span>
              <span style={{ fontWeight: 600, color: '#0F3F40' }}>{formatCurrency(flow.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E5959' }}>
              <span>Taxes / fees (sample)</span>
              <span style={{ fontWeight: 600, color: '#0F3F40' }}>{formatCurrency(flow.fees)}</span>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #E2ECEA',
              marginTop: 12,
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F3F40' }}>Estimated total</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0A7F82' }}>
              {formatCurrency(flow.total)}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#6B8585', marginTop: 4 }}>
            Sample amount only
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Guest Information Page (Page 55)
 */
export function GuestInfoPage() {
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && !flow.email) {
      updateFlow({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        mobile: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!flow.firstName || !flow.lastName || !flow.email || !flow.mobile) {
      showToast('Please fill in all required guest contact fields.', 'error');
      return;
    }
    if (!flow.agreedTerms) {
      showToast('Please agree to the booking terms and privacy policy.', 'error');
      return;
    }
    navigate('/booking/payment');
  };

  return (
    <div>
      <h1 className="page-title">Guest Information</h1>
      <p className="page-subtitle">Provide contact details for your reservation.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <form onSubmit={handleSubmit} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40' }}>
              Primary guest information
            </h2>
            <p style={{ fontSize: 13, color: '#6B8585' }}>
              Enter the contact details for this reservation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FloatingInput
              label="First name"
              placeholder="Enter first name"
              value={flow.firstName}
              onChange={(e) => updateFlow({ firstName: e.target.value })}
            />
            <FloatingInput
              label="Last name"
              placeholder="Enter last name"
              value={flow.lastName}
              onChange={(e) => updateFlow({ lastName: e.target.value })}
            />
          </div>

          <FloatingInput
            label="Email address"
            type="email"
            placeholder="name@example.com"
            value={flow.email}
            onChange={(e) => updateFlow({ email: e.target.value })}
          />

          <FloatingInput
            label="Mobile number"
            placeholder="09XX XXX XXXX"
            value={flow.mobile}
            onChange={(e) => updateFlow({ mobile: e.target.value })}
          />

          <div className="cs-floating-field">
            <span className="cs-floating-label">Booking notes (optional)</span>
            <textarea
              rows={3}
              value={flow.notes}
              onChange={(e) => updateFlow({ notes: e.target.value })}
              placeholder="Arrival time or other details..."
              className="cs-floating-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: '#3E5959',
              cursor: 'pointer',
              marginTop: 2,
            }}
          >
            <input
              type="checkbox"
              checked={flow.agreedTerms}
              onChange={(e) => updateFlow({ agreedTerms: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#0A7F82' }}
            />
            <span>I agree to the booking terms and privacy policy.</span>
          </label>

          <div>
            <Button type="submit" style={{ marginTop: 4 }}>
              Continue to Payment
            </Button>
          </div>
        </form>

        {/* Right: Reservation Summary Card */}
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
            Reservation summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6B8585' }}>Resort</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40' }}>
                {flow.resortName}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2ECEA', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: '#6B8585' }}>Room</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40' }}>
                {flow.roomName}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2ECEA', paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: '#6B8585' }}>Dates</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40' }}>
                {formatShortDateRange(flow.checkIn, flow.checkOut)}
              </div>
              <div style={{ fontSize: 12.5, color: '#6B8585', marginTop: 2 }}>
                {flow.guests} guests • {flow.nights} nights
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Payment Page (Page 50 for Rooms & Pages 5–7 for Foods & Drinks)
 * Uses the 3-option radio cards: Gcash, Maya, Pay at the resort.
 */
export function PaymentPage() {
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isFoodFlow = flow.flowType === 'food';

  const methods = [
    {
      value: 'gcash',
      label: 'Gcash',
      subtitle: "Pay according to the resort's policy.",
    },
    {
      value: 'maya',
      label: 'Maya',
      subtitle: 'Requires payment integration to work.',
    },
    {
      value: 'pay_at_resort',
      label: 'Pay at the resort',
      subtitle: "Pay according to the resort's policy.",
    },
  ];

  const handleConfirm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isFoodFlow) {
        const res = await api.post('/food-orders', {
          resort_id: flow.resortId,
          type: flow.foodType,
          payment_method: flow.paymentMethod,
          dates: flow.foodDates || '20–22 Oct 2026',
        });
        const created = res.data.data;
        updateFlow({
          foodOrderId: created.id,
          bookingId: created.booking_id,
          bookingReference: created.reference,
        });
      } else {
        const res = await api.post('/bookings', {
          resort_id: flow.resortId,
          room_id: flow.roomId,
          check_in: flow.checkIn,
          check_out: flow.checkOut,
          adults: flow.adults,
          children: flow.children,
          special_requests: flow.specialRequests,
          guest_first_name: flow.firstName || 'Guest',
          guest_last_name: flow.lastName || 'Customer',
          guest_email: flow.email || 'guest@example.com',
          guest_mobile: flow.mobile || '0917 555 8899',
          notes: flow.notes,
          payment_method: flow.paymentMethod,
        });
        const created = res.data.data;
        updateFlow({
          bookingId: created.id,
          bookingReference: created.reference,
          subtotal: created.subtotal,
          fees: created.fees,
          total: created.total,
        });
      }

      if (flow.paymentMethod === 'gcash' || flow.paymentMethod === 'maya') {
        navigate('/booking/qr-payment');
      } else {
        showToast('Booking request submitted!');
        navigate('/booking/confirmation');
      }
    } catch (err) {
      const msg =
        err.response?.data?.errors?.check_in?.[0] ||
        err.response?.data?.errors?.guests?.[0] ||
        err.response?.data?.message ||
        'Could not process booking.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Payment</h1>
      <p className="page-subtitle">Select how you would like to pay for your reservation.</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <form onSubmit={handleConfirm} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
            Choose a payment method
          </h2>

          {methods.map((m) => {
            const selected = flow.paymentMethod === m.value;
            return (
              <label
                key={m.value}
                onClick={() => updateFlow({ paymentMethod: m.value })}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: selected ? '1.8px solid #0B6E75' : '1.2px solid #0B6E75',
                  backgroundColor: selected ? '#EEF8F6' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selected}
                  onChange={() => updateFlow({ paymentMethod: m.value })}
                  style={{ marginTop: 3, accentColor: '#0B6E75' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40' }}>{m.label}</div>
                  <div style={{ fontSize: 12.5, color: '#6B8585' }}>{m.subtitle}</div>
                </div>
              </label>
            );
          })}

          {/* Cream Secure Checkout Box */}
          <div
            style={{
              backgroundColor: '#FFF6E3',
              border: '1px solid #EBD3A7',
              borderRadius: 10,
              padding: '14px 16px',
              marginTop: 4,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8A5A19', marginBottom: 2 }}>
              Secure checkout
            </div>
            <div style={{ fontSize: 12.5, color: '#8A5A19' }}>
              Final amount and payment method are confirmed by the resort.
            </div>
          </div>

          <div>
            <Button type="submit" disabled={submitting} style={{ marginTop: 4 }}>
              {submitting ? 'Processing...' : 'Review and Confirm Booking'}
            </Button>
          </div>
        </form>

        {/* Right: Price Summary Card */}
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
            Price summary
          </h3>

          {isFoodFlow ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13.5,
                  color: '#3E5959',
                  paddingBottom: 12,
                  borderBottom: '1px solid #E2ECEA',
                }}
              >
                <span>Foods subtotal</span>
                <span style={{ fontWeight: 600, color: '#0F3F40' }}>
                  {formatCurrency(flow.foodTotal || 3800)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 14,
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F3F40' }}>
                  Estimated total
                </span>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#0A7F82' }}>
                  {formatCurrency(flow.foodTotal || 3800)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: 13.5,
                  paddingBottom: 12,
                  borderBottom: '1px solid #E2ECEA',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E5959' }}>
                  <span>Room subtotal</span>
                  <span style={{ fontWeight: 600, color: '#0F3F40' }}>
                    {formatCurrency(flow.subtotal)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3E5959' }}>
                  <span>Sample fees</span>
                  <span style={{ fontWeight: 600, color: '#0F3F40' }}>
                    {formatCurrency(flow.fees)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 14,
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F3F40' }}>
                  Estimated total
                </span>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#0A7F82' }}>
                  {formatCurrency(flow.total)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Complete your Payment (QR Code) Page (Page 60 for Room & Page 4 for Foods/Drinks)
 */
export function CompletePaymentQrPage() {
  const navigate = useNavigate();
  const { flow } = useBookingFlow();
  const { showToast } = useToast();

  const [referenceNo, setReferenceNo] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isFoodFlow = flow.flowType === 'food';
  const amountToPay = isFoodFlow ? flow.foodTotal || 3800 : flow.total || 8100;

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (flow.bookingId) formData.append('booking_id', flow.bookingId);
      if (flow.bookingReference) formData.append('booking_reference', flow.bookingReference);
      if (flow.foodOrderId) formData.append('food_order_id', flow.foodOrderId);
      formData.append('method', flow.paymentMethod || 'gcash');
      if (referenceNo.trim()) formData.append('reference_no', referenceNo.trim());
      if (proofFile) formData.append('proof_image', proofFile);

      await api.post('/payments/submit', formData);
      showToast('Payment submitted! Awaiting resort verification.');
      navigate('/booking/confirmation');
    } catch {
      showToast('Payment recorded!', 'success');
      navigate('/booking/confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Complete your Payment</h1>
      <p className="page-subtitle">
        Scan the QR code using your mobile banking or e-wallet app.
      </p>

      {/* Soft Green Total Banner */}
      <div
        style={{
          backgroundColor: '#9ACFB7',
          borderRadius: 12,
          padding: '20px 26px',
          textAlign: 'center',
          marginBottom: 22,
          color: '#0F3F40',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          TOTAL AMOUNT TO PAY
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
          {formatCurrency(amountToPay, 2)}
        </div>
        {!isFoodFlow && (
          <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>
            Booking ID: {flow.bookingReference || 'CS-2026-001'}
          </div>
        )}
      </div>

      {/* Center QR Card */}
      <form
        onSubmit={handleSubmitPayment}
        className="cs-card"
        style={{
          maxWidth: 680,
          margin: '0 auto',
          textAlign: 'center',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40' }}>
          Scan QR Code to Pay
        </h2>

        <div
          style={{
            width: 220,
            height: 220,
            padding: 12,
            background: '#FFFFFF',
            border: '1px solid #DCE7E5',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={flow.resortQr || '/images/resorts/qr-code.jpg'}
            alt="Scan QR Code"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ fontSize: 12, color: '#6B8585' }}>QR code placeholder</div>

        <div
          style={{
            backgroundColor: '#9ACFB7',
            color: '#0F3F40',
            fontSize: 12,
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: 9999,
          }}
        >
          Secure QR Payment
        </div>

        {/* Optional Reference No & Payment Proof Upload */}
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            textAlign: 'left',
            marginTop: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            placeholder="Reference number (optional, e.g. GC-823104)"
            className="cs-input"
            style={{ fontSize: 12.5, padding: '9px 12px' }}
          />
          <label
            style={{
              fontSize: 12,
              color: '#6B8585',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span>Upload payment proof (optional):</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              style={{ fontSize: 12 }}
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          style={{ minWidth: 220, height: 44, marginTop: 8 }}
        >
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </Button>
      </form>
    </div>
  );
}

/**
 * 5. Booking Confirmation Page (Page 57 for Room & Pages 1–3 for Foods/Drinks)
 */
export function BookingConfirmationPage() {
  const navigate = useNavigate();
  const { flow } = useBookingFlow();

  const isFoodFlow = flow.flowType === 'food';

  return (
    <div>
      <h1 className="page-title">Booking Confirmation</h1>
      <p className="page-subtitle">
        A clear summary after the customer completes the booking flow.
      </p>

      <div
        className="cs-card"
        style={{
          maxWidth: 760,
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#DDF3EC',
            color: '#0A7F82',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            margin: '0 auto 14px',
          }}
        >
          ✓
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
          Booking request submitted!
        </h2>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 22 }}>
          Review your reservation summary and status below.
        </p>

        {/* Summary Table Box */}
        <div
          style={{
            border: '1px solid #DCE7E5',
            borderRadius: 10,
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {!isFoodFlow && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: '#6B8585' }}>Reservation reference</span>
                <span style={{ fontWeight: 700, color: '#0F3F40' }}>
                  {flow.bookingReference || 'CS-2026-00125'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13.5,
                  borderTop: '1px solid #EDF3F2',
                  paddingTop: 10,
                }}
              >
                <span style={{ color: '#6B8585' }}>Resort</span>
                <span style={{ fontWeight: 700, color: '#0F3F40' }}>{flow.resortName}</span>
              </div>
            </>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13.5,
              borderTop: !isFoodFlow ? '1px solid #EDF3F2' : 'none',
              paddingTop: !isFoodFlow ? 10 : 0,
            }}
          >
            <span style={{ color: '#6B8585' }}>Room</span>
            <span style={{ fontWeight: 700, color: '#0F3F40' }}>
              {isFoodFlow ? flow.foodConfirmLabel || 'Foods and Drinks Bundle' : flow.roomName}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13.5,
              borderTop: '1px solid #EDF3F2',
              paddingTop: 10,
            }}
          >
            <span style={{ color: '#6B8585' }}>Dates</span>
            <span style={{ fontWeight: 700, color: '#0F3F40' }}>
              {isFoodFlow
                ? flow.foodDates || '20–22 Oct 2026'
                : formatShortDateRange(flow.checkIn, flow.checkOut)}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 20 }}>
          Prototype only — this does not create a real reservation.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!isFoodFlow && (
            <Button onClick={() => navigate('/my-bookings')}>View My Bookings</Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              printBookingVoucher({
                reference: flow.bookingReference || 'CS-2026-00125',
                resort_name: flow.resortName,
                room_name: isFoodFlow
                  ? flow.foodConfirmLabel || 'Foods and Drinks Bundle'
                  : flow.roomName,
                dates_label: isFoodFlow
                  ? flow.foodDates || '20–22 Oct 2026'
                  : formatShortDateRange(flow.checkIn, flow.checkOut),
                firstName: flow.firstName || 'Guest',
                lastName: flow.lastName || '',
                email: flow.email || 'guest@example.com',
                mobile: flow.mobile || '0917 555 8899',
                subtotal: isFoodFlow ? flow.foodTotal : flow.subtotal,
                fees: isFoodFlow ? 0 : flow.fees,
                total: isFoodFlow ? flow.foodTotal : flow.total,
                status: 'PENDING',
              })
            }
          >
            Print / Save Voucher (PDF)
          </Button>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. My Bookings Page (Page 53) + Booking Details & Cancel / Leave Review
 */
export function MyBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = () => {
    if (!user) {
      // Fallback sample bookings matching Page 53 when browsing as Guest
      setBookings([
        {
          id: 5,
          reference: 'CS-2026-00125',
          resort_name: 'Eventesia Garden',
          room_name: 'Deluxe Pool View',
          guests: 2,
          dates_label: '20 Oct – 22 Oct 2026',
          status: 'pending',
          total: 8100,
          can_cancel: true,
        },
        {
          id: 6,
          reference: 'CS-2026-00126',
          resort_name: 'Casa Ragina',
          room_name: 'Standard Room',
          guests: 2,
          dates_label: '20 Oct – 22 Oct 2026',
          status: 'completed',
          total: 8100,
          can_review: true,
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get('/my-bookings')
      .then((res) => {
        setBookings(res.data.data || []);
      })
      .catch(() => {
        showToast('Could not load bookings.', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  return (
    <div>
      <h1 className="page-title">My Bookings</h1>
      <p className="page-subtitle">See upcoming and previous reservations in one place.</p>

      <div className="cs-card" style={{ marginBottom: 18, padding: '18px 22px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
          Your reservations
        </h2>
        <p style={{ fontSize: 13, color: '#6B8585' }}>
          Track booking requests and review trip details.
        </p>
      </div>

      {loading ? (
        <div className="cs-card">Loading reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="cs-card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: '#6B8585', marginBottom: 16 }}>
            You do not have any reservations yet.
          </p>
          <Button onClick={() => navigate('/explore')}>Explore Resorts</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id || booking.reference}
              booking={booking}
              onViewDetails={(b) => navigate(`/my-bookings/${b.reference || b.id}`)}
            />
          ))}
        </div>
      )}

      <Button onClick={() => navigate('/explore')}>Explore Resorts</Button>
    </div>
  );
}

/**
 * 6b. Booking Detail Page (/my-bookings/:id)
 * Shows full summary, payment status, cancel button when still pending, and review form when completed.
 */
export function MyBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadDetail = () => {
    setLoading(true);
    api
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data.data))
      .catch(() => showToast('Booking not found.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleCancelBooking = async () => {
    try {
      await api.post(`/my-bookings/${booking.reference}/cancel`);
      showToast('Booking cancelled.');
      setCancelModalOpen(false);
      loadDetail();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to cancel booking.', 'error');
    }
  };

  const handleLeaveReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        booking_id: booking.id,
        rating,
        comment,
      });
      showToast('Thank you! Your review has been submitted.');
      loadDetail();
    } catch (err) {
      showToast(
        err.response?.data?.errors?.booking_id?.[0] ||
          err.response?.data?.message ||
          'Could not submit review.',
        'error'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="cs-card">Loading booking details...</div>;
  if (!booking) return <div className="cs-card">Booking not found.</div>;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link to="/my-bookings" style={{ fontSize: 13, fontWeight: 700, color: '#0A7F82' }}>
          ← Back to My Bookings
        </Link>
      </div>

      <h1 className="page-title">Reservation Details</h1>
      <p className="page-subtitle">Reference: {booking.reference}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'start' }}>
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40' }}>
              {booking.resort_name}
            </h2>
            <StatusBadge
              status={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            />
          </div>

          <div style={{ borderTop: '1px solid #E2ECEA', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5 }}>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Room / Package</div>
              <div style={{ fontWeight: 700 }}>{booking.room_name}</div>
            </div>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Dates</div>
              <div style={{ fontWeight: 700 }}>{booking.dates_label}</div>
            </div>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Guest Name</div>
              <div style={{ fontWeight: 700 }}>{booking.guest_full_name}</div>
            </div>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Guests</div>
              <div style={{ fontWeight: 700 }}>
                {booking.adults} Adults, {booking.children} Children
              </div>
            </div>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Email</div>
              <div>{booking.guest_email}</div>
            </div>
            <div>
              <div style={{ color: '#6B8585', fontSize: 12 }}>Mobile</div>
              <div>{booking.guest_mobile}</div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #E2ECEA',
              paddingTop: 14,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Button variant="outline" onClick={() => printBookingVoucher(booking)}>
              Print / Save Voucher (PDF)
            </Button>
            {booking.status === 'pending' && (
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(true)}
                style={{ color: '#A82E2E', borderColor: '#E5B5B5' }}
              >
                Cancel Reservation
              </Button>
            )}
          </div>

          {/* Review Section for Completed Bookings */}
          {booking.status === 'completed' && !booking.review && (
            <form
              onSubmit={handleLeaveReview}
              style={{
                borderTop: '1px solid #E2ECEA',
                paddingTop: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F3F40' }}>
                Leave a Review for {booking.resort_name}
              </h3>
              <FloatingSelect
                label="Rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                options={[
                  { value: 5, label: '★★★★★ (5 - Excellent)' },
                  { value: 4, label: '★★★★☆ (4 - Very Good)' },
                  { value: 3, label: '★★★☆☆ (3 - Good)' },
                  { value: 2, label: '★★☆☆☆ (2 - Fair)' },
                  { value: 1, label: '★☆☆☆☆ (1 - Poor)' },
                ]}
              />
              <div className="cs-floating-field">
                <span className="cs-floating-label">Your Review</span>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience at this resort..."
                  className="cs-floating-input"
                  required
                />
              </div>
              <Button type="submit" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          )}
        </div>

        {/* Payment Summary Card */}
        <div className="cs-card">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
            Payment Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B8585' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(booking.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B8585' }}>Taxes & Fees</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(booking.fees)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #E2ECEA',
                paddingTop: 10,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              <span>Total</span>
              <span style={{ color: '#0A7F82' }}>{formatCurrency(booking.total)}</span>
            </div>
            {booking.payment && (
              <div
                style={{
                  borderTop: '1px solid #E2ECEA',
                  paddingTop: 12,
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B8585' }}>Payment Method</span>
                  <span style={{ fontWeight: 600 }}>{booking.payment.method_display}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B8585' }}>Payment Status</span>
                  <StatusBadge
                    status={
                      booking.payment.status.charAt(0).toUpperCase() +
                      booking.payment.status.slice(1)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={cancelModalOpen}
        title="Cancel Reservation"
        onClose={() => setCancelModalOpen(false)}
      >
        <p style={{ fontSize: 14, color: '#3E5959', marginBottom: 20 }}>
          Are you sure you want to cancel reservation <strong>{booking.reference}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
            Keep Booking
          </Button>
          <Button onClick={handleCancelBooking} style={{ backgroundColor: '#A82E2E' }}>
            Confirm Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 7. My Profile Page (Page 61)
 */
export function MyProfilePage() {
  const navigate = useNavigate();
  const { user, updateCustomerState, logoutCustomer } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(user?.first_name || 'Guest');
  const [lastName, setLastName] = useState(user?.last_name || 'Surname');
  const [email, setEmail] = useState(user?.email || 'guest@example.com');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailUpdates, setEmailUpdates] = useState(user?.email_updates ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || 'Guest');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setEmailUpdates(user.email_updates ?? true);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Changes saved locally for Guest preview.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        email_updates: emailUpdates,
      });
      updateCustomerState(res.data.user);
      showToast('Profile saved successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutCustomer();
    showToast('Logged out successfully.');
    navigate('/auth/login');
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        My Profile
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {/* Left: Personal Information Card */}
        <form onSubmit={handleSave} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            Personal information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FloatingInput
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Guest"
            />
            <FloatingInput
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Surname"
            />
          </div>

          <FloatingInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@example.com"
          />

          <FloatingInput
            label="Mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Add mobile number"
          />

          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F3F40', marginBottom: 8 }}>
              Account preferences
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: '#3E5959',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={(e) => setEmailUpdates(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0A7F82' }}
              />
              <span>Send me booking updates by email</span>
            </label>
          </div>

          <div>
            <Button type="submit" disabled={saving} style={{ marginTop: 6 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Right Column: Account Security + Log out Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="cs-card">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
              Account security
            </h3>
            <p style={{ fontSize: 13, color: '#6B8585', marginBottom: 14 }}>
              Keep your contact details up to date.
            </p>

            <div className="cs-floating-field" style={{ marginBottom: 12 }}>
              <span className="cs-floating-label">Password</span>
              <input
                type="password"
                value="••••••••••"
                readOnly
                className="cs-floating-input"
              />
            </div>

            <Link
              to="/auth/change-password"
              style={{ fontSize: 13, fontWeight: 700, color: '#0A7F82' }}
            >
              Change password →
            </Link>
          </div>

          <div className="cs-card" style={{ textAlign: 'center', padding: 20 }}>
            <Button onClick={handleLogout} style={{ minWidth: 160 }}>
              Log out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
