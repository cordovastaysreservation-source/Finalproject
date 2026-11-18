<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class BookingService
{
    /**
     * Check if a room is available for the given [check_in, check_out) range.
     * Rule: check_in < existing.check_out AND check_out > existing.check_in (ignoring cancelled bookings).
     */
    public function isRoomAvailable(int $roomId, string $checkIn, string $checkOut, ?int $ignoreBookingId = null): bool
    {
        $query = Booking::where('room_id', $roomId)
            ->where('status', '!=', 'cancelled')
            ->whereDate('check_in', '<', $checkOut)
            ->whereDate('check_out', '>', $checkIn);

        if ($ignoreBookingId) {
            $query->where('id', '!=', $ignoreBookingId);
        }

        return ! $query->exists();
    }

    /**
     * Calculate server-side price quote and validate capacity/dates.
     */
    public function calculateQuote(Room $room, string $checkIn, string $checkOut, int $adults = 2, int $children = 0): array
    {
        $start = Carbon::parse($checkIn)->startOfDay();
        $end = Carbon::parse($checkOut)->startOfDay();

        if ($end->lessThanOrEqualTo($start)) {
            throw ValidationException::withMessages([
                'check_out' => ['Check-out date must be after check-in date.'],
            ]);
        }

        $totalGuests = $adults + $children;
        if ($totalGuests > $room->capacity) {
            throw ValidationException::withMessages([
                'guests' => ["Guest count ({$totalGuests}) exceeds the room capacity of {$room->capacity} guests."],
            ]);
        }

        $nights = max(1, (int) $start->diffInDays($end));
        $rate = (float) $room->price_per_night;
        $subtotal = round($nights * $rate, 2);
        $fees = (float) env('BOOKING_SAMPLE_FEE', 500.00);
        $total = round($subtotal + $fees, 2);

        return [
            'room_id' => $room->id,
            'room_name' => $room->name,
            'price_per_night' => $rate,
            'check_in' => $start->toDateString(),
            'check_out' => $end->toDateString(),
            'nights' => $nights,
            'adults' => $adults,
            'children' => $children,
            'guests' => $totalGuests,
            'subtotal' => $subtotal,
            'fees' => $fees,
            'total' => $total,
        ];
    }

    /**
     * Generate a unique booking reference like CS-2026-00127.
     */
    public function generateReference( string $prefix = 'CS-2026-' ): string
    {
        $maxId = (int) Booking::withTrashed()->max('id') + 125;

        do {
            $ref = sprintf('%s%05d', $prefix, $maxId);
            $maxId++;
        } while (Booking::withTrashed()->where('reference', $ref)->exists());

        return $ref;
    }
}
