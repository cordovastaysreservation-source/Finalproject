<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Resort;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ResortAdminController extends Controller
{
    /**
     * List resorts with search, filter chips (all / active / archived), and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = Resort::withCount('rooms')->with('amenities');

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->whereIn('status', ['published', 'active']);
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('location', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('sort_order')->orderBy('id')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => collect($paginated->items())->map(fn (Resort $r) => $this->formatResort($r)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Get single resort for Edit form.
     */
    public function show(int $id): JsonResponse
    {
        $resort = Resort::withTrashed()->with(['amenities', 'images'])->withCount('rooms')->findOrFail($id);

        return response()->json([
            'data' => $this->formatResort($resort),
        ]);
    }

    /**
     * Store a new resort (+ optional cover image upload).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable'], // comma-separated string or array
            'cover_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $filename = 'resort_'.time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('uploads/resorts'), $filename);
            $coverPath = '/uploads/resorts/'.$filename;
        }

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (Resort::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $statusNormalized = strtolower($validated['status']) === 'active' ? 'published' : strtolower($validated['status']);

        $resort = Resort::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'location' => $validated['location'],
            'address' => $validated['address'],
            'contact_number' => $validated['contact_number'] ?? null,
            'email' => $validated['email'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $statusNormalized,
            'cover_image' => $coverPath,
            'qr_image' => '/images/resorts/qr-code.jpg',
            'display_rooms_count' => 3,
            'sort_order' => (int) Resort::max('sort_order') + 1,
        ]);

        $this->syncAmenities($resort, $request->input('amenities'));

        return response()->json([
            'message' => 'Resort created successfully.',
            'data' => $this->formatResort($resort->load('amenities')->loadCount('rooms')),
        ], 201);
    }

    /**
     * Update an existing resort.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $resort = Resort::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable'],
            'cover_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('cover_image')) {
            $file = $request->file('cover_image');
            $filename = 'resort_'.time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('uploads/resorts'), $filename);
            $resort->cover_image = '/uploads/resorts/'.$filename;
        }

        $statusNormalized = strtolower($validated['status']) === 'active' ? 'published' : strtolower($validated['status']);

        $resort->update([
            'name' => $validated['name'],
            'location' => $validated['location'],
            'address' => $validated['address'],
            'contact_number' => $validated['contact_number'] ?? $resort->contact_number,
            'email' => $validated['email'] ?? $resort->email,
            'description' => $validated['description'] ?? $resort->description,
            'status' => $statusNormalized,
            'cover_image' => $resort->cover_image,
        ]);

        if ($request->has('amenities')) {
            $this->syncAmenities($resort, $request->input('amenities'));
        }

        return response()->json([
            'message' => 'Resort updated successfully.',
            'data' => $this->formatResort($resort->fresh(['amenities'])->loadCount('rooms')),
        ]);
    }

    /**
     * Archive (soft delete) or restore a resort.
     */
    public function destroy(int $id): JsonResponse
    {
        $resort = Resort::withTrashed()->findOrFail($id);

        if ($resort->trashed()) {
            $resort->restore();

            return response()->json(['message' => 'Resort restored successfully.']);
        }

        $resort->delete();

        return response()->json(['message' => 'Resort archived successfully.']);
    }

    protected function syncAmenities(Resort $resort, mixed $rawAmenities): void
    {
        if (empty($rawAmenities)) {
            $defaultNames = ['Pool', 'Wi-Fi', 'Parking', 'Family-friendly options'];
        } elseif (is_string($rawAmenities)) {
            $defaultNames = array_filter(array_map('trim', explode(',', $rawAmenities)));
        } elseif (is_array($rawAmenities)) {
            $defaultNames = array_filter(array_map('trim', $rawAmenities));
        } else {
            $defaultNames = ['Pool', 'Wi-Fi', 'Parking', 'Family-friendly options'];
        }

        $ids = [];
        foreach ($defaultNames as $name) {
            $a = Amenity::firstOrCreate(['name' => $name], ['category' => 'both']);
            $ids[] = $a->id;
        }

        $resort->amenities()->sync($ids);
    }

    protected function formatResort(Resort $r): array
    {
        return [
            'id' => $r->id,
            'name' => $r->name,
            'slug' => $r->slug,
            'location' => $r->location,
            'address' => $r->address,
            'contact_number' => $r->contact_number,
            'email' => $r->email,
            'description' => $r->description,
            'status' => $r->trashed() ? 'Archived' : ($r->status === 'draft' ? 'Draft' : 'Published'),
            'raw_status' => $r->status,
            'rooms_count' => $r->display_rooms_count ?: ($r->rooms_count ?? 3),
            'cover_image' => $r->cover_image,
            'amenities' => $r->amenities->pluck('name')->values(),
            'amenities_text' => $r->amenities->pluck('name')->implode(', '),
            'last_updated' => $r->updated_at?->format('M d') ?? 'Oct 05',
            'is_archived' => $r->trashed(),
        ];
    }
}
