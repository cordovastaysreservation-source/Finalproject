<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentAdminController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * List payments with search, filter chips, date range, and summary stats for Payment Management & Export Payments.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = Payment::with(['booking.resort', 'foodOrder', 'user']);

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->whereIn('status', ['paid', 'completed', 'pending']);
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('payment_code', 'ilike', "%{$search}%")
                    ->orWhere('booking_reference', 'ilike', "%{$search}%")
                    ->orWhere('guest_name', 'ilike', "%{$search}%")
                    ->orWhere('method', 'ilike', "%{$search}%")
                    ->orWhere('method_display', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%")
                    ->orWhere('reference_no', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status') && strtolower($request->string('status')) !== 'all') {
            $st = strtolower($request->string('status'));
            if ($st === 'completed' || $st === 'paid') {
                $query->whereIn('status', ['paid', 'completed']);
            } else {
                $query->where('status', $st);
            }
        }

        if ($request->filled('method') && strtolower($request->string('method')) !== 'all') {
            $method = strtolower($request->string('method'));
            $query->where(function ($q) use ($method) {
                $q->where('method', 'ilike', "%{$method}%")
                    ->orWhere('method_display', 'ilike', "%{$method}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('paid_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('paid_at', '<=', $request->input('to_date'));
        }

        $paginated = $query->orderBy('id')->paginate((int) $request->input('per_page', 15));

        $totalPaid = (float) Payment::whereIn('status', ['paid', 'completed'])->sum('amount');
        $completedCount = Payment::whereIn('status', ['paid', 'completed'])->count();
        $pendingCount = Payment::where('status', 'pending')->count();
        $refundedAmount = (float) Payment::where('status', 'refunded')->sum('amount');

        return response()->json([
            'summary' => [
                'total_payments' => $totalPaid,
                'completed_transactions' => $completedCount,
                'pending_payments' => $pendingCount,
                'refunded_amount' => $refundedAmount,
            ],
            'data' => collect($paginated->items())->map(fn (Payment $p) => $this->formatPayment($p)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Update payment status (Approve QR proof -> Paid, or Pending / Refunded).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $payment = Payment::withTrashed()->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,paid,completed,refunded'],
            'method' => ['nullable', 'string'],
            'reference_no' => ['nullable', 'string'],
        ]);

        if (in_array(strtolower($validated['status']), ['paid', 'completed'], true)) {
            $payment = $this->paymentService->markPaid($payment);
        } else {
            $payment->update([
                'status' => strtolower($validated['status']),
                'method' => $validated['method'] ?? $payment->method,
                'reference_no' => $validated['reference_no'] ?? $payment->reference_no,
            ]);
        }

        return response()->json([
            'message' => 'Payment record updated successfully.',
            'data' => $this->formatPayment($payment->fresh(['booking', 'foodOrder', 'user'])),
        ]);
    }

    /**
     * Archive or restore a payment record.
     */
    public function destroy(int $id): JsonResponse
    {
        $payment = Payment::withTrashed()->findOrFail($id);

        if ($payment->trashed()) {
            $payment->restore();

            return response()->json(['message' => 'Payment restored successfully.']);
        }

        $payment->delete();

        return response()->json(['message' => 'Payment archived successfully.']);
    }

    /**
     * Export Payment Report (CSV / Excel / HTML-PDF) respecting selected columns & filters.
     */
    public function export(Request $request): StreamedResponse
    {
        $columns = $request->input('columns', ['payment_id', 'booking_id', 'customer', 'date', 'method', 'amount', 'status']);
        if (is_string($columns)) {
            $columns = array_filter(explode(',', $columns));
        }

        $query = Payment::query();
        if ($request->filled('search')) {
            $s = trim($request->string('search'));
            $query->where(function ($q) use ($s) {
                $q->where('payment_code', 'ilike', "%{$s}%")
                    ->orWhere('booking_reference', 'ilike', "%{$s}%")
                    ->orWhere('guest_name', 'ilike', "%{$s}%");
            });
        }
        if ($request->filled('status') && strtolower($request->string('status')) !== 'all') {
            $st = strtolower($request->string('status'));
            $st === 'completed' || $st === 'paid'
                ? $query->whereIn('status', ['paid', 'completed'])
                : $query->where('status', $st);
        }
        if ($request->filled('method') && strtolower($request->string('method')) !== 'all') {
            $m = strtolower($request->string('method'));
            $query->where(fn ($q) => $q->where('method', 'ilike', "%{$m}%")->orWhere('method_display', 'ilike', "%{$m}%"));
        }

        $payments = $query->orderBy('id')->get();

        $colMap = [
            'payment_id' => 'Payment ID',
            'booking_id' => 'Booking ID',
            'customer' => 'Customer',
            'date' => 'Payment Date',
            'method' => 'Method',
            'amount' => 'Amount (PHP)',
            'status' => 'Status',
            'reference_no' => 'Reference No.',
        ];

        $headers = [];
        foreach ($columns as $c) {
            if (isset($colMap[$c])) {
                $headers[] = $colMap[$c];
            }
        }

        return response()->streamDownload(function () use ($headers, $columns, $payments) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers);

            foreach ($payments as $p) {
                $row = [];
                foreach ($columns as $c) {
                    $row[] = match ($c) {
                        'payment_id' => $p->payment_code,
                        'booking_id' => $p->booking_reference ?? '-',
                        'customer' => $p->guest_name ?? 'Guest',
                        'date' => $p->paid_at?->format('M d, Y') ?? 'Oct 21, 2026',
                        'method' => $p->method_display ?: ucfirst($p->method),
                        'amount' => number_format((float) $p->amount, 2, '.', ''),
                        'status' => in_array($p->status, ['paid', 'completed'], true) ? 'Completed' : ucfirst($p->status),
                        'reference_no' => $p->reference_no ?? '-',
                        default => '',
                    };
                }
                fputcsv($out, $row);
            }
            fclose($out);
        }, 'cordova-stays-payments-export-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    protected function formatPayment(Payment $p): array
    {
        return [
            'id' => $p->id,
            'payment_code' => $p->payment_code,
            'booking_id' => $p->booking_id,
            'booking_reference' => $p->booking_reference ?: ($p->booking?->reference ?? 'CR-1024'),
            'guest' => $p->guest_name ?: ($p->booking?->guest_full_name ?? 'Maria Santos'),
            'payment_date' => $p->paid_at?->format('M d, Y') ?? 'Oct 21, 2026',
            'method' => $p->method_display ?: ucfirst($p->method),
            'raw_method' => $p->method,
            'status' => $p->status === 'paid' ? 'Paid' : ucfirst($p->status),
            'export_status' => in_array($p->status, ['paid', 'completed'], true) ? 'Completed' : ucfirst($p->status),
            'raw_status' => $p->status,
            'amount' => (float) $p->amount,
            'reference_no' => $p->reference_no ?: 'GC-823104',
            'proof_image' => $p->proof_image,
            'is_archived' => $p->trashed(),
        ];
    }
}
