<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    /**
     * Leave a review for a Completed booking (1 review per booking).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $booking = Booking::with('review')->findOrFail($validated['booking_id']);
        $user = $request->user();

        if ($booking->user_id && $booking->user_id !== $user->id && $booking->guest_email !== $user->email && ! $user->isStaff()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($booking->status !== 'completed') {
            throw ValidationException::withMessages([
                'booking_id' => ['Only Completed bookings can be reviewed.'],
            ]);
        }

        if ($booking->review) {
            throw ValidationException::withMessages([
                'booking_id' => ['You have already submitted a review for this booking.'],
            ]);
        }

        $nextNum = (int) Review::withTrashed()->max('id') + 2042;
        $reviewCode = 'REV-'.$nextNum;

        $review = Review::create([
            'review_code' => $reviewCode,
            'user_id' => $user->id,
            'guest_name' => $user->name,
            'resort_id' => $booking->resort_id,
            'booking_id' => $booking->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'status' => 'needs_review',
            'reviewed_date' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Review submitted and is pending moderation.',
            'data' => $review,
        ], 201);
    }
}
