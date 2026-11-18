<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomAdminController extends Controller
{
    /**
     * List rooms with search, filter chips (all / active / archived), and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = Room::with(['resort', 'amenities', 'images']);

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->where('status', 'active');
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('type', 'ilike', "%{$search}%")
                    ->orWhere('room_code', 'ilike', "%{$search}%")
                    ->orWhere('room_number', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%")
                    ->orWhereHas('resort', fn ($rq) => $rq->where('name', 'ilike', "%{$search}%"));
            });
        }

        if ($request->filled('resort_id')) {
            $query->where('resort_id', (int) $request->input('resort_id'));
        }

        $paginated = $query->orderBy('id')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => collect($paginated->items())->map(fn (Room $room) => $this->formatRoom($room)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Get single room for Edit Room screen.
     */
    public function show(int $id): JsonResponse
    {
        $room = Room::withTrashed()->with(['resort', 'amenities', 'images'])->findOrFail($id);

        return response()->json([
            'data' => $this->formatRoom($room),
        ]);
    }

    /**
     * Create a new room (+ multiple room photos upload).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'resort_id' => ['required', 'integer', 'exists:resorts,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'bed_configuration' => ['nullable', 'string', 'max:120'],
            'capacity' => ['required', 'integer', 'min:1'],
            'price_per_night' => ['required', 'numeric', 'min:0'],
            'size_sqm' => ['nullable', 'integer', 'min:1'],
            'floor' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable'],
            'photos.*' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $nextNum = (int) Room::withTrashed()->max('id') + 1;
        $roomCode = sprintf('ROOM-%03d', $nextNum);

        $statusNormalized = in_array(strtolower($validated['status'] ?? 'active'), ['active', 'available', 'active / available'], true)
            ? 'active'
            : 'inactive';

        $room = Room::create([
            'resort_id' => $validated['resort_id'],
            'room_code' => $roomCode,
            'room_number' => $validated['room_number'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'bed_configuration' => $validated['bed_configuration'] ?? '1 King Bed',
            'capacity' => $validated['capacity'],
            'price_per_night' => $validated['price_per_night'],
            'size_sqm' => $validated['size_sqm'] ?? 32,
            'floor' => $validated['floor'] ?? null,
            'description' => $validated['description'] ?? 'Comfortable room with essential amenities',
            'placeholder_label' => strtoupper($validated['name']),
            'status' => $statusNormalized,
        ]);

        $this->syncAmenities($room, $request->input('amenities'));
        $this->handlePhotosUpload($room, $request);

        return response()->json([
            'message' => 'Room created successfully.',
            'data' => $this->formatRoom($room->load(['resort', 'amenities', 'images'])),
        ], 201);
    }

    /**
     * Update an existing room.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $room = Room::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'resort_id' => ['required', 'integer', 'exists:resorts,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'bed_configuration' => ['nullable', 'string', 'max:120'],
            'capacity' => ['required', 'integer', 'min:1'],
            'price_per_night' => ['required', 'numeric', 'min:0'],
            'size_sqm' => ['nullable', 'integer', 'min:1'],
            'floor' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable'],
            'photos.*' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $statusNormalized = in_array(strtolower($validated['status'] ?? 'active'), ['active', 'available', 'active / available'], true)
            ? 'active'
            : 'inactive';

        $room->update([
            'resort_id' => $validated['resort_id'],
            'name' => $validated['name'],
            'type' => $validated['type'] ?? $validated['name'],
            'room_number' => $validated['room_number'],
            'bed_configuration' => $validated['bed_configuration'] ?? $room->bed_configuration,
            'capacity' => $validated['capacity'],
            'price_per_night' => $validated['price_per_night'],
            'size_sqm' => $validated['size_sqm'] ?? $room->size_sqm,
            'floor' => $validated['floor'] ?? $room->floor,
            'description' => $validated['description'] ?? $room->description,
            'status' => $statusNormalized,
        ]);

        if ($request->has('amenities')) {
            $this->syncAmenities($room, $request->input('amenities'));
        }
        $this->handlePhotosUpload($room, $request);

        return response()->json([
            'message' => 'Room updated successfully.',
            'data' => $this->formatRoom($room->fresh(['resort', 'amenities', 'images'])),
        ]);
    }

    /**
     * Archive or restore a room.
     */
    public function destroy(int $id): JsonResponse
    {
        $room = Room::withTrashed()->findOrFail($id);

        if ($room->trashed()) {
            $room->restore();

            return response()->json(['message' => 'Room restored successfully.']);
        }

        $room->delete();

        return response()->json(['message' => 'Room archived successfully.']);
    }

    protected function syncAmenities(Room $room, mixed $rawAmenities): void
    {
        if (is_string($rawAmenities)) {
            $decoded = json_decode($rawAmenities, true);
            $names = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $rawAmenities)));
        } elseif (is_array($rawAmenities)) {
            $names = $rawAmenities;
        } else {
            $names = ['Wi-Fi', 'Air conditioning', 'TV', 'Private bathroom'];
        }

        $ids = [];
        foreach ($names as $name) {
            if (! $name) {
                continue;
            }
            $a = Amenity::firstOrCreate(['name' => $name], ['category' => 'room']);
            $ids[] = $a->id;
        }

        $room->amenities()->sync($ids);
    }

    protected function handlePhotosUpload(Room $room, Request $request): void
    {
        if (! $request->hasFile('photos')) {
            return;
        }

        $files = $request->file('photos');
        if (! is_array($files)) {
            $files = [$files];
        }

        $order = (int) $room->images()->max('sort_order') + 1;
        foreach ($files as $file) {
            $filename = 'room_'.$room->id.'_'.time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('uploads/rooms'), $filename);
            RoomImage::create([
                'room_id' => $room->id,
                'image_path' => '/uploads/rooms/'.$filename,
                'sort_order' => $order++,
            ]);
        }
    }

    protected function formatRoom(Room $room): array
    {
        return [
            'id' => $room->id,
            'room_code' => $room->room_code,
            'room_number' => $room->room_number ?: 'D-101',
            'resort_id' => $room->resort_id,
            'resort_name' => $room->resort?->name ?? 'Eventesia Garden',
            'name' => $room->name,
            'type' => $room->type,
            'bed_configuration' => $room->bed_configuration,
            'capacity' => $room->capacity,
            'price_per_night' => (float) $room->price_per_night,
            'size_sqm' => $room->size_sqm ?: 32,
            'floor' => $room->floor,
            'description' => $room->description,
            'status' => $room->trashed() ? 'Archived' : ($room->status === 'active' ? 'Active' : 'Inactive'),
            'raw_status' => $room->status,
            'amenities' => $room->amenities->pluck('name')->values(),
            'images' => $room->images->pluck('image_path')->values(),
            'last_updated' => $room->updated_at?->format('M d, Y') ?? 'Oct 18, 2026',
            'is_archived' => $room->trashed(),
        ];
    }
}
