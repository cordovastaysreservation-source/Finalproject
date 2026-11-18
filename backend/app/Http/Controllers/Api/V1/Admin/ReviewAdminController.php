<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReviewAdminController extends Controller
{
    /**
     * List reviews with search, filter chips, rating & status filters.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = Review::with(['resort', 'user', 'booking']);

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->where('status', 'published');
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('review_code', 'ilike', "%{$search}%")
                    ->orWhere('guest_name', 'ilike', "%{$search}%")
                    ->orWhere('comment', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%")
                    ->orWhereHas('resort', fn ($rq) => $rq->where('name', 'ilike', "%{$search}%"));
            });
        }

        if ($request->filled('rating') && strtolower($request->string('rating')) !== 'all') {
            $query->where('rating', (int) $request->input('rating'));
        }

        if ($request->filled('status') && strtolower($request->string('status')) !== 'all') {
            $st = strtolower($request->string('status'));
            if ($st === 'pending' || $st === 'needs_review') {
                $query->where('status', 'needs_review');
            } else {
                $query->where('status', $st);
            }
        }

        if ($request->filled('from_date')) {
            $query->whereDate('reviewed_date', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('reviewed_date', '<=', $request->input('to_date'));
        }

        $paginated = $query->orderBy('id')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => collect($paginated->items())->map(fn (Review $r) => $this->formatReview($r)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Moderate a review (publish, needs_review, hidden).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:published,needs_review,hidden'],
            'comment' => ['nullable', 'string'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $review->update([
            'status' => $validated['status'],
            'comment' => $validated['comment'] ?? $review->comment,
            'rating' => $validated['rating'] ?? $review->rating,
        ]);

        return response()->json([
            'message' => 'Review updated successfully.',
            'data' => $this->formatReview($review->fresh(['resort', 'user'])),
        ]);
    }

    /**
     * Archive or restore a review.
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::withTrashed()->findOrFail($id);

        if ($review->trashed()) {
            $review->restore();

            return response()->json(['message' => 'Review restored successfully.']);
        }

        $review->delete();

        return response()->json(['message' => 'Review archived successfully.']);
    }

    /**
     * Export Review Report as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Review::with('resort');

        if ($request->filled('search')) {
            $s = trim($request->string('search'));
            $query->where(function ($q) use ($s) {
                $q->where('review_code', 'ilike', "%{$s}%")
                    ->orWhere('guest_name', 'ilike', "%{$s}%")
                    ->orWhereHas('resort', fn ($rq) => $rq->where('name', 'ilike', "%{$s}%"));
            });
        }
        if ($request->filled('rating') && strtolower($request->string('rating')) !== 'all') {
            $query->where('rating', (int) $request->input('rating'));
        }
        if ($request->filled('status') && strtolower($request->string('status')) !== 'all') {
            $st = strtolower($request->string('status'));
            $st === 'pending' ? $query->where('status', 'needs_review') : $query->where('status', $st);
        }

        $reviews = $query->orderBy('id')->get();

        return response()->streamDownload(function () use ($reviews) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, ['Review ID', 'Customer', 'Resort', 'Rating', 'Comment', 'Date', 'Status']);

            foreach ($reviews as $r) {
                fputcsv($out, [
                    $r->review_code,
                    $r->guest_name ?? 'Guest',
                    $r->resort?->name ?? 'Eventesia Garden',
                    $r->rating.' / 5',
                    $r->comment,
                    $r->reviewed_date?->format('M d, Y') ?? 'Oct 22, 2026',
                    $r->status === 'needs_review' ? 'Needs review' : ucfirst($r->status),
                ]);
            }
            fclose($out);
        }, 'cordova-stays-reviews-export-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    protected function formatReview(Review $r): array
    {
        return [
            'id' => $r->id,
            'review_code' => $r->review_code,
            'guest' => $r->guest_name ?: ($r->user?->name ?? 'Maria Santos'),
            'resort_id' => $r->resort_id,
            'resort' => $r->resort?->name ?? 'Eventesia Garden',
            'rating' => $r->rating,
            'comment' => $r->comment,
            'date' => $r->reviewed_date?->format('M d') ?? 'Oct 05',
            'full_date' => $r->reviewed_date?->format('M d, Y') ?? 'Oct 22, 2026',
            'status' => $r->status === 'needs_review' ? 'Needs review' : ucfirst($r->status),
            'export_status' => $r->status === 'needs_review' ? 'Pending' : ucfirst($r->status),
            'raw_status' => $r->status,
            'is_archived' => $r->trashed(),
        ];
    }
}
