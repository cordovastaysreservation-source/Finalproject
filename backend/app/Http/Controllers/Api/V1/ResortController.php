<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Resort;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResortController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * List/search resorts for Home, Explore Resorts, and Foods & Drinks directory.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Resort::with(['amenities', 'images'])
            ->where('status', 'published')
            ->orderBy('sort_order')
            ->orderBy('id');

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($request->boolean('popular')) {
            $query->where('is_popular', true);
        }

        $resorts = $query->get();

        // Filter by guest capacity and date availability if check_in & check_out provided
        $guests = max(1, (int) $request->input('guests', 0));
        $checkIn = $request->input('check_in');
        $checkOut = $request->input('check_out');

        if ($guests > 0 || ($checkIn && $checkOut)) {
            $resorts = $resorts->filter(function (Resort $resort) use ($guests, $checkIn, $checkOut) {
                $rooms = $resort->rooms()->where('status', 'active')->get();
                if ($guests > 0) {
                    $rooms = $rooms->where('capacity', '>=', $guests);
                }
                if ($checkIn && $checkOut) {
                    $rooms = $rooms->filter(fn ($room) => $this->bookingService->isRoomAvailable($room->id, $checkIn, $checkOut));
                }

                return $rooms->isNotEmpty();
            })->values();
        }

        return response()->json([
            'count' => $resorts->count(),
            'data' => $resorts->map(fn (Resort $resort) => $this->formatResort($resort)),
        ]);
    }

    /**
     * Get single resort details by slug or ID.
     */
    public function show(string $slugOrId): JsonResponse
    {
        $resort = Resort::with(['amenities', 'images', 'rooms.amenities', 'rooms.images', 'reviews' => function ($q) {
            $q->where('status', 'published')->latest('reviewed_date');
        }])
            ->where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int) $slugOrId : 0)
            ->firstOrFail();

        return response()->json([
            'data' => $this->formatResort($resort, true),
        ]);
    }

    /**
     * Get available rooms for a resort filtered by check_in, check_out, and guests.
     */
    public function availableRooms(Request $request, string $slugOrId): JsonResponse
    {
        $resort = Resort::where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int) $slugOrId : 0)
            ->firstOrFail();

        $guests = max(1, (int) $request->input('guests', 2));
        $checkIn = $request->input('check_in');
        $checkOut = $request->input('check_out');

        $rooms = $resort->rooms()
            ->with(['amenities', 'images'])
            ->where('status', 'active')
            ->where('capacity', '>=', $guests)
            ->orderBy('price_per_night')
            ->get();

        if ($checkIn && $checkOut && strtotime($checkOut) > strtotime($checkIn)) {
            $rooms = $rooms->filter(function ($room) use ($checkIn, $checkOut) {
                return $this->bookingService->isRoomAvailable($room->id, $checkIn, $checkOut);
            })->values();
        }

        return response()->json([
            'resort' => $this->formatResort($resort),
            'filters' => [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guests' => $guests,
            ],
            'data' => $rooms->map(fn ($room) => [
                'id' => $room->id,
                'resort_id' => $room->resort_id,
                'room_code' => $room->room_code,
                'room_number' => $room->room_number,
                'name' => $room->name,
                'type' => $room->type,
                'bed_configuration' => $room->bed_configuration,
                'capacity' => $room->capacity,
                'price_per_night' => (float) $room->price_per_night,
                'size_sqm' => $room->size_sqm,
                'floor' => $room->floor,
                'description' => $room->description,
                'placeholder_label' => $room->placeholder_label ?: strtoupper($room->name),
                'status' => $room->status,
                'image' => $room->images->first()?->image_path,
                'images' => $room->images->pluck('image_path'),
                'amenities' => $room->amenities->pluck('name'),
            ]),
        ]);
    }

    protected function formatResort(Resort $resort, bool $withDetails = false): array
    {
        $base = [
            'id' => $resort->id,
            'name' => $resort->name,
            'slug' => $resort->slug,
            'location' => $resort->location,
            'address' => $resort->address,
            'contact_number' => $resort->contact_number,
            'email' => $resort->email,
            'description' => $resort->description,
            'second_line' => 'Review room options, amenities, and policies before booking.',
            'status' => $resort->status,
            'cover_image' => $resort->cover_image,
            'qr_image' => $resort->qr_image ?: '/images/resorts/qr-code.jpg',
            'is_popular' => $resort->is_popular,
            'amenities' => $resort->amenities->pluck('name')->values(),
            'gallery' => $resort->images->map(fn ($img) => [
                'id' => $img->id,
                'image_path' => $img->image_path,
                'label' => $img->label,
                'sort_order' => $img->sort_order,
            ])->values(),
        ];

        if ($withDetails) {
            $base['rooms'] = $resort->rooms->where('status', 'active')->values()->map(fn ($room) => [
                'id' => $room->id,
                'room_code' => $room->room_code,
                'room_number' => $room->room_number,
                'name' => $room->name,
                'type' => $room->type,
                'bed_configuration' => $room->bed_configuration,
                'capacity' => $room->capacity,
                'price_per_night' => (float) $room->price_per_night,
                'size_sqm' => $room->size_sqm,
                'description' => $room->description,
                'placeholder_label' => $room->placeholder_label ?: strtoupper($room->name),
                'image' => $room->images->first()?->image_path,
                'amenities' => $room->amenities->pluck('name'),
            ]);
            $base['reviews'] = $resort->reviews->map(fn ($rev) => [
                'id' => $rev->id,
                'review_code' => $rev->review_code,
                'guest_name' => $rev->guest_name,
                'rating' => $rev->rating,
                'comment' => $rev->comment,
                'date' => $rev->reviewed_date?->format('M d, Y'),
            ]);
        }

        return $base;
    }
}
