<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Services\BookingService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(
        protected BookingService $bookingService,
        protected PaymentService $paymentService
    ) {}

    /**
     * Server-side price quote calculation.
     */
    public function quote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'adults' => ['nullable', 'integer', 'min:1'],
            'children' => ['nullable', 'integer', 'min:0'],
        ]);

        $room = Room::findOrFail($validated['room_id']);
        $quote = $this->bookingService->calculateQuote(
            $room,
            $validated['check_in'],
            $validated['check_out'],
            (int) ($validated['adults'] ?? 2),
            (int) ($validated['children'] ?? 0)
        );

        $available = $this->bookingService->isRoomAvailable(
            $room->id,
            $validated['check_in'],
            $validated['check_out']
        );

        return response()->json([
            'available' => $available,
            'quote' => $quote,
        ]);
    }

    /**
     * Create a new room booking (starts as pending).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resort_id' => ['required', 'integer', 'exists:resorts,id'],
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'adults' => ['required', 'integer', 'min:1'],
            'children' => ['nullable', 'integer', 'min:0'],
            'special_requests' => ['nullable', 'string', 'max:1000'],
            'guest_first_name' => ['required', 'string', 'max:120'],
            'guest_last_name' => ['required', 'string', 'max:120'],
            'guest_email' => ['required', 'string', 'email', 'max:255'],
            'guest_mobile' => ['required', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['nullable', 'string', 'in:gcash,maya,pay_at_resort'],
        ]);

        $room = Room::findOrFail($validated['room_id']);

        if (! $this->bookingService->isRoomAvailable($room->id, $validated['check_in'], $validated['check_out'])) {
            throw ValidationException::withMessages([
                'check_in' => ['This room is already booked for the selected dates. Please choose different dates or another room.'],
            ]);
        }

        $quote = $this->bookingService->calculateQuote(
            $room,
            $validated['check_in'],
            $validated['check_out'],
            (int) $validated['adults'],
            (int) ($validated['children'] ?? 0)
        );

        $user = $request->user('sanctum');

        $booking = Booking::create([
            'reference' => $this->bookingService->generateReference(),
            'user_id' => $user?->id,
            'resort_id' => $room->resort_id,
            'room_id' => $room->id,
            'booking_type' => 'room',
            'check_in' => $quote['check_in'],
            'check_out' => $quote['check_out'],
            'nights' => $quote['nights'],
            'adults' => $quote['adults'],
            'children' => $quote['children'],
            'special_requests' => $validated['special_requests'] ?? null,
            'guest_first_name' => $validated['guest_first_name'],
            'guest_last_name' => $validated['guest_last_name'],
            'guest_email' => $validated['guest_email'],
            'guest_mobile' => $validated['guest_mobile'],
            'notes' => $validated['notes'] ?? null,
            'subtotal' => $quote['subtotal'],
            'fees' => $quote['fees'],
            'total' => $quote['total'],
            'status' => 'pending',
        ]);

        if (! empty($validated['payment_method'])) {
            $this->paymentService->processSubmission([
                'booking_id' => $booking->id,
                'user_id' => $user?->id,
                'guest_name' => $booking->guest_full_name,
                'method' => $validated['payment_method'],
                'amount' => $booking->total,
            ]);
        }

        $booking->load(['resort', 'room', 'payment', 'review']);

        try {
            $resortName = $booking->resort?->name ?? 'Cordova Stays Resort';
            $roomName = $booking->room?->name ?? 'Room';
            $totalFormatted = '₱'.number_format((float) $booking->total, 2);
            Mail::html(
                "<div style='font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #DCE7E5;border-radius:12px;overflow:hidden;'>
                    <div style='background:#0B6E75;color:#FFFFFF;padding:20px 24px;'>
                        <h2 style='margin:0;font-size:20px;'>Cordova Stays</h2>
                        <p style='margin:4px 0 0;font-size:11px;opacity:0.85;'>RESERVATION REQUEST SUBMITTED</p>
                    </div>
                    <div style='padding:24px;color:#0F3F40;'>
                        <p style='margin-top:0;'>Hello <strong>{$booking->guest_full_name}</strong>,</p>
                        <p>Thank you for booking with <strong>Cordova Stays</strong>! Here is your reservation summary:</p>
                        <div style='background:#F4F8F7;border:1px solid #DCE7E5;border-radius:10px;padding:16px;margin:18px 0;font-size:14px;line-height:1.7;'>
                            <div><strong>Reference:</strong> {$booking->reference}</div>
                            <div><strong>Resort:</strong> {$resortName}</div>
                            <div><strong>Room:</strong> {$roomName}</div>
                            <div><strong>Check-in:</strong> {$booking->check_in?->format('d M Y')}</div>
                            <div><strong>Check-out:</strong> {$booking->check_out?->format('d M Y')}</div>
                            <div><strong>Estimated Total:</strong> <span style='color:#0A7F82;font-weight:700;'>{$totalFormatted}</span></div>
                        </div>
                        <p style='font-size:13px;color:#6B8585;'>Better Stays, Bigger Memories — Cordova, Cebu</p>
                    </div>
                </div>",
                function ($message) use ($booking) {
                    $message->to($booking->guest_email)->subject("Cordova Stays - Booking Confirmation ({$booking->reference})");
                }
            );
        } catch (\Throwable $e) {
            Log::warning('Booking email warning: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Booking request submitted!',
            'data' => $this->formatBooking($booking),
        ], 201);
    }

    /**
     * Get logged-in customer's bookings.
     */
    public function myBookings(Request $request): JsonResponse
    {
        $user = $request->user();

        $bookings = Booking::with(['resort', 'room', 'foodOrder', 'payment', 'review'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('guest_email', $user->email);
            })
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $bookings->map(fn (Booking $b) => $this->formatBooking($b)),
        ]);
    }

    /**
     * Get single booking details by ID or reference.
     */
    public function show(Request $request, string $idOrRef): JsonResponse
    {
        $booking = Booking::with(['resort', 'room', 'foodOrder', 'payment', 'review'])
            ->where('reference', $idOrRef)
            ->orWhere('id', is_numeric($idOrRef) ? (int) $idOrRef : 0)
            ->firstOrFail();

        $user = $request->user('sanctum');
        if ($user && ! $user->isStaff() && $booking->user_id && $booking->user_id !== $user->id && $booking->guest_email !== $user->email) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'data' => $this->formatBooking($booking),
        ]);
    }

    /**
     * Cancel a pending booking.
     */
    public function cancel(Request $request, string $idOrRef): JsonResponse
    {
        $booking = Booking::where('reference', $idOrRef)
            ->orWhere('id', is_numeric($idOrRef) ? (int) $idOrRef : 0)
            ->firstOrFail();

        $user = $request->user();
        if (! $user->isStaff() && $booking->user_id !== $user->id && $booking->guest_email !== $user->email) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($booking->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending bookings can be cancelled by the guest.'],
            ]);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Booking has been cancelled.',
            'data' => $this->formatBooking($booking->fresh(['resort', 'room', 'payment', 'review'])),
        ]);
    }

    /**
     * Submit payment method & optional QR proof upload for a booking or food order.
     */
    public function submitPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'booking_reference' => ['nullable', 'string'],
            'food_order_id' => ['nullable', 'integer', 'exists:food_orders,id'],
            'method' => ['required', 'string', 'in:gcash,maya,pay_at_resort,card,bank,cash'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'proof_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $payment = $this->paymentService->processSubmission(
            array_merge($validated, ['user_id' => $request->user('sanctum')?->id]),
            $request->file('proof_image')
        );

        return response()->json([
            'message' => 'Payment submitted successfully.',
            'data' => $payment->load(['booking', 'foodOrder']),
        ]);
    }

    public function formatBooking(Booking $booking): array
    {
        $checkInStr = $booking->check_in?->format('d M Y') ?? '20 Oct 2026';
        $checkOutStr = $booking->check_out?->format('d M Y') ?? '22 Oct 2026';

        $sameMonth = $booking->check_in && $booking->check_out && $booking->check_in->format('M Y') === $booking->check_out->format('M Y');
        $shortDates = $sameMonth
            ? $booking->check_in->format('d').'–'.$booking->check_out->format('d M Y')
            : $booking->check_in?->format('d M').' – '.$booking->check_out?->format('d M Y');

        return [
            'id' => $booking->id,
            'reference' => $booking->reference,
            'booking_type' => $booking->booking_type,
            'resort_id' => $booking->resort_id,
            'resort_name' => $booking->resort?->name ?? 'Eventesia Garden',
            'resort_cover' => $booking->resort?->cover_image,
            'room_id' => $booking->room_id,
            'room_name' => $booking->booking_type === 'food'
                ? ($booking->foodOrder?->title ?? 'Foods and Drinks Bundle')
                : ($booking->room?->name ?? 'Deluxe Pool View'),
            'check_in' => $booking->check_in?->toDateString(),
            'check_out' => $booking->check_out?->toDateString(),
            'dates_label' => $booking->check_in?->format('d M').' – '.$booking->check_out?->format('d M Y'),
            'short_dates' => $shortDates,
            'nights' => $booking->nights,
            'adults' => $booking->adults,
            'children' => $booking->children,
            'guests' => $booking->adults + $booking->children,
            'special_requests' => $booking->special_requests,
            'guest_first_name' => $booking->guest_first_name,
            'guest_last_name' => $booking->guest_last_name,
            'guest_full_name' => $booking->guest_full_name,
            'guest_email' => $booking->guest_email,
            'guest_mobile' => $booking->guest_mobile,
            'notes' => $booking->notes,
            'subtotal' => (float) $booking->subtotal,
            'fees' => (float) $booking->fees,
            'total' => (float) $booking->total,
            'status' => $booking->status,
            'can_cancel' => $booking->status === 'pending',
            'can_review' => $booking->status === 'completed' && ! $booking->review,
            'payment' => $booking->payment ? [
                'id' => $booking->payment->id,
                'payment_code' => $booking->payment->payment_code,
                'method' => $booking->payment->method,
                'method_display' => $booking->payment->method_display,
                'status' => $booking->payment->status,
                'amount' => (float) $booking->payment->amount,
                'reference_no' => $booking->payment->reference_no,
                'proof_image' => $booking->payment->proof_image,
            ] : null,
            'review' => $booking->review ? [
                'id' => $booking->review->id,
                'rating' => $booking->review->rating,
                'comment' => $booking->review->comment,
                'status' => $booking->review->status,
            ] : null,
        ];
    }
}
