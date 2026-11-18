<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\Resort;
use App\Services\BookingService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodOrderController extends Controller
{
    public function __construct(
        protected BookingService $bookingService,
        protected PaymentService $paymentService
    ) {}

    /**
     * Get the Foods and Drinks catalog for a resort (Bundle Foods and Drinks, Foods, Drinks at ₱3,800 sample).
     */
    public function showCatalog(string $slugOrId): JsonResponse
    {
        $resort = Resort::where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int) $slugOrId : 0)
            ->firstOrFail();

        return response()->json([
            'resort' => [
                'id' => $resort->id,
                'name' => $resort->name,
                'slug' => $resort->slug,
                'location' => $resort->location,
                'cover_image' => $resort->cover_image,
            ],
            'subtitle' => 'Bundle Foods and Drinks order',
            'items' => [
                'bundle' => [
                    'type' => 'bundle',
                    'label' => 'Bundle Foods and Drinks',
                    'price_label' => 'Bundle Foods',
                    'confirm_label' => 'Foods and Drinks Bundle',
                    'price' => 3800.00,
                    'lines' => [
                        'Grilled Seafood & Crispy Lechon Platter',
                        'Cordova Steamed Rice & Side Dishes',
                        'Fresh Tropical Fruit Platter',
                        'Pitcher of Fresh Mango & Buko Shake',
                    ],
                ],
                'foods' => [
                    'type' => 'foods',
                    'label' => 'Foods',
                    'price_label' => 'Foods',
                    'confirm_label' => 'Foods',
                    'price' => 3800.00,
                    'lines' => [
                        'Grilled Tuna Panga & Garlic Butter Shrimp',
                        'Crispy Pork Belly & Native Chicken Inasal',
                        'Bam-i Guisado & Steamed Rice Basket',
                        'Leche Flan & Tropical Fruit Platter',
                    ],
                ],
                'drinks' => [
                    'type' => 'drinks',
                    'label' => 'Drinks',
                    'price_label' => 'Drinks',
                    'confirm_label' => 'Drinks',
                    'price' => 3800.00,
                    'lines' => [
                        'Fresh Buko Pandan & Mango Smoothies',
                        'Iced Calamansi & Lemongrass Cooler Pitchers',
                        'Assorted Chilled Sodas & Bottled Water',
                        'Craft Mocktails & Tropical Sunset Punch',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Create a Food & Drinks order + payment + booking record.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resort_id' => ['required', 'integer', 'exists:resorts,id'],
            'type' => ['required', 'string', 'in:bundle,foods,drinks'],
            'payment_method' => ['required', 'string', 'in:gcash,maya,pay_at_resort,online'],
            'dates' => ['nullable', 'string', 'max:100'],
            'reference_no' => ['nullable', 'string', 'max:100'],
        ]);

        $resort = Resort::findOrFail($validated['resort_id']);
        $user = $request->user('sanctum');

        $titleMap = [
            'bundle' => 'Foods and Drinks Bundle',
            'foods' => 'Foods',
            'drinks' => 'Drinks',
        ];
        $title = $titleMap[$validated['type']] ?? 'Foods and Drinks Bundle';
        $amount = 3800.00;
        $dates = $validated['dates'] ?? '20–22 Oct 2026';

        $ref = $this->bookingService->generateReference('CS-2026-');

        $foodOrder = FoodOrder::create([
            'reference' => $ref,
            'user_id' => $user?->id,
            'resort_id' => $resort->id,
            'type' => $validated['type'],
            'title' => $title,
            'items' => [
                'Bundle item 1',
                'Bundle item 2',
                'Bundle item 3',
                'Bundle item 4',
            ],
            'amount' => $amount,
            'status' => 'pending',
            'dates' => $dates,
        ]);

        $booking = Booking::create([
            'reference' => $ref,
            'user_id' => $user?->id,
            'resort_id' => $resort->id,
            'room_id' => null,
            'food_order_id' => $foodOrder->id,
            'booking_type' => 'food',
            'check_in' => '2026-10-20',
            'check_out' => '2026-10-22',
            'nights' => 2,
            'adults' => 2,
            'children' => 0,
            'guest_first_name' => $user?->first_name ?: 'Guest',
            'guest_last_name' => $user?->last_name ?: 'Customer',
            'guest_email' => $user?->email ?: 'guest@example.com',
            'guest_mobile' => $user?->phone ?: '0917 555 8899',
            'subtotal' => $amount,
            'fees' => 0.00,
            'total' => $amount,
            'status' => 'pending',
        ]);

        $method = $validated['payment_method'] === 'online' ? 'gcash' : $validated['payment_method'];

        $payment = $this->paymentService->processSubmission([
            'booking_id' => $booking->id,
            'food_order_id' => $foodOrder->id,
            'user_id' => $user?->id,
            'guest_name' => $booking->guest_full_name,
            'method' => $method,
            'amount' => $amount,
            'reference_no' => $validated['reference_no'] ?? null,
        ]);

        return response()->json([
            'message' => 'Food and Drinks order submitted!',
            'data' => [
                'id' => $foodOrder->id,
                'booking_id' => $booking->id,
                'reference' => $foodOrder->reference,
                'resort_name' => $resort->name,
                'room' => $title,
                'dates' => $dates,
                'amount' => $amount,
                'status' => $foodOrder->status,
                'payment' => $payment,
            ],
        ], 201);
    }
}
