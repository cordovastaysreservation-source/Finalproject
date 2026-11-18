<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ReservationAdminController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * List reservations with search, filter chips (all / active / archived), and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = Booking::with(['resort', 'room', 'payment', 'user']);

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->whereIn('status', ['confirmed', 'pending', 'completed']);
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                    ->orWhere('guest_first_name', 'ilike', "%{$search}%")
                    ->orWhere('guest_last_name', 'ilike', "%{$search}%")
                    ->orWhere('guest_email', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%")
                    ->orWhereHas('resort', fn ($rq) => $rq->where('name', 'ilike', "%{$search}%"));
            });
        }

        $paginated = $query->orderBy('id')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => collect($paginated->items())->map(fn (Booking $b) => $this->formatReservation($b)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Show reservation details.
     */
    public function show(int $id): JsonResponse
    {
        $booking = Booking::withTrashed()->with(['resort', 'room', 'payment', 'user'])->findOrFail($id);

        return response()->json([
            'data' => $this->formatReservation($booking),
        ]);
    }

    /**
     * Update a reservation (status: pending/confirmed/cancelled/completed, dates, guest details, room).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $booking = Booking::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:pending,confirmed,cancelled,completed'],
            'resort_id' => ['nullable', 'integer', 'exists:resorts,id'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'check_in' => ['nullable', 'date'],
            'check_out' => ['nullable', 'date'],
            'adults' => ['nullable', 'integer', 'min:1'],
            'children' => ['nullable', 'integer', 'min:0'],
            'guest_first_name' => ['nullable', 'string', 'max:120'],
            'guest_last_name' => ['nullable', 'string', 'max:120'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'guest_mobile' => ['nullable', 'string', 'max:30'],
            'special_requests' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($validated['room_id']) && ! empty($validated['check_in']) && ! empty($validated['check_out'])) {
            $room = Room::findOrFail($validated['room_id']);
            $quote = $this->bookingService->calculateQuote(
                $room,
                $validated['check_in'],
                $validated['check_out'],
                (int) ($validated['adults'] ?? $booking->adults),
                (int) ($validated['children'] ?? $booking->children)
            );
            $booking->subtotal = $quote['subtotal'];
            $booking->fees = $quote['fees'];
            $booking->total = $quote['total'];
            $booking->nights = $quote['nights'];
        }

        $previousStatus = $booking->status;
        $booking->fill(array_filter($validated, fn ($v) => ! is_null($v)));
        $booking->save();
        $booking->load(['resort', 'room', 'payment', 'user']);

        if ($booking->status !== $previousStatus && $booking->guest_email) {
            try {
                $statusLabel = strtoupper($booking->status);
                $resortName = $booking->resort?->name ?? 'Cordova Stays Resort';
                Mail::html(
                    "<div style='font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #DCE7E5;border-radius:12px;overflow:hidden;'>
                        <div style='background:#0B6E75;color:#FFFFFF;padding:20px 24px;'>
                            <h2 style='margin:0;font-size:20px;'>Cordova Stays</h2>
                            <p style='margin:4px 0 0;font-size:11px;opacity:0.85;'>RESERVATION STATUS UPDATE</p>
                        </div>
                        <div style='padding:24px;color:#0F3F40;'>
                            <p style='margin-top:0;'>Hello <strong>{$booking->guest_full_name}</strong>,</p>
                            <p>Your reservation <strong>{$booking->reference}</strong> at <strong>{$resortName}</strong> has been updated to: <strong>{$statusLabel}</strong>.</p>
                            <p style='font-size:13px;color:#6B8585;'>Thank you for choosing Cordova Stays!</p>
                        </div>
                    </div>",
                    function ($message) use ($booking, $statusLabel) {
                        $message->to($booking->guest_email)->subject("Cordova Stays - Reservation {$booking->reference} is {$statusLabel}");
                    }
                );
            } catch (\Throwable $e) {
                Log::warning('Status update email warning: '.$e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Reservation updated successfully.',
            'data' => $this->formatReservation($booking),
        ]);
    }

    /**
     * Archive or restore a reservation.
     */
    public function destroy(int $id): JsonResponse
    {
        $booking = Booking::withTrashed()->findOrFail($id);

        if ($booking->trashed()) {
            $booking->restore();

            return response()->json(['message' => 'Reservation restored successfully.']);
        }

        $booking->delete();

        return response()->json(['message' => 'Reservation archived successfully.']);
    }

    protected function formatReservation(Booking $b): array
    {
        return [
            'id' => $b->id,
            'reference' => $b->reference,
            'guest' => $b->guest_full_name,
            'guest_first_name' => $b->guest_first_name,
            'guest_last_name' => $b->guest_last_name,
            'guest_email' => $b->guest_email,
            'guest_mobile' => $b->guest_mobile,
            'resort_id' => $b->resort_id,
            'resort' => $b->resort?->name ?? 'Eventesia Garden',
            'room_id' => $b->room_id,
            'room' => $b->room?->name ?? 'Deluxe Pool View',
            'check_in' => $b->check_in?->toDateString(),
            'check_out' => $b->check_out?->toDateString(),
            'check_in_short' => $b->check_in?->format('d M') ?? '18 Oct',
            'check_in_full' => $b->check_in?->format('d M Y') ?? '18 Oct 2026',
            'nights' => $b->nights,
            'adults' => $b->adults,
            'children' => $b->children,
            'special_requests' => $b->special_requests,
            'notes' => $b->notes,
            'status' => ucfirst($b->status),
            'raw_status' => $b->status,
            'subtotal' => (float) $b->subtotal,
            'fees' => (float) $b->fees,
            'amount' => (float) $b->total,
            'payment_status' => $b->payment ? ucfirst($b->payment->status) : 'Pending',
            'is_archived' => $b->trashed(),
        ];
    }
}
