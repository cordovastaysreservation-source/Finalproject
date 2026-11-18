<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\Payment;
use Illuminate\Http\UploadedFile;

class PaymentService
{
    /**
     * Create or update a payment record for a booking or food order.
     * Structured so an external gateway adapter can be injected later.
     */
    public function processSubmission(array $data, ?UploadedFile $proofFile = null): Payment
    {
        $booking = isset($data['booking_id']) ? Booking::find($data['booking_id']) : null;
        if (! $booking && ! empty($data['booking_reference'])) {
            $booking = Booking::where('reference', $data['booking_reference'])->first();
        }

        $foodOrder = isset($data['food_order_id']) ? FoodOrder::find($data['food_order_id']) : null;

        $amount = $booking ? (float) $booking->total : ($foodOrder ? (float) $foodOrder->amount : (float) ($data['amount'] ?? 0));
        $method = strtolower($data['method'] ?? 'gcash');

        $methodDisplayMap = [
            'gcash' => 'GCash',
            'maya' => 'Maya',
            'pay_at_resort' => 'Pay at the resort',
            'card' => 'Credit Card',
            'bank' => 'Bank Transfer',
            'cash' => 'Cash',
            'e-wallet' => 'E-wallet',
        ];

        $proofPath = null;
        if ($proofFile) {
            $filename = 'proof_'.time().'_'. uniqid().'.'.$proofFile->getClientOriginalExtension();
            $proofFile->move(public_path('uploads/payments'), $filename);
            $proofPath = '/uploads/payments/'.$filename;
        }

        $existing = null;
        if ($booking) {
            $existing = Payment::where('booking_id', $booking->id)->first();
        } elseif ($foodOrder) {
            $existing = Payment::where('food_order_id', $foodOrder->id)->first();
        }

        $referenceNo = $data['reference_no'] ?? ($existing?->reference_no) ?? $this->generateReferenceNumber($method);

        if ($existing) {
            $existing->update([
                'method' => $method,
                'method_display' => $methodDisplayMap[$method] ?? ucfirst($method),
                'amount' => $amount,
                'reference_no' => $referenceNo,
                'proof_image' => $proofPath ?? $existing->proof_image,
                'status' => 'pending', // Manual verification by Admin/Staff
            ]);

            return $existing->fresh();
        }

        return Payment::create([
            'payment_code' => $this->generatePaymentCode(),
            'booking_id' => $booking?->id,
            'food_order_id' => $foodOrder?->id,
            'user_id' => $data['user_id'] ?? $booking?->user_id ?? $foodOrder?->user_id,
            'guest_name' => $data['guest_name'] ?? ($booking ? $booking->guest_full_name : 'Guest'),
            'booking_reference' => $booking?->reference ?? $foodOrder?->reference,
            'method' => $method,
            'method_display' => $methodDisplayMap[$method] ?? ucfirst($method),
            'status' => 'pending',
            'amount' => $amount,
            'reference_no' => $referenceNo,
            'proof_image' => $proofPath,
            'paid_at' => now(),
        ]);
    }

    /**
     * Admin approves a payment (e.g. QR payment proof) and marks it Paid.
     */
    public function markPaid(Payment $payment): Payment
    {
        $payment->update([
            'status' => 'paid',
            'paid_at' => $payment->paid_at ?? now(),
        ]);

        if ($payment->booking && $payment->booking->status === 'pending') {
            $payment->booking->update(['status' => 'confirmed']);
        }

        if ($payment->foodOrder && $payment->foodOrder->status === 'pending') {
            $payment->foodOrder->update(['status' => 'confirmed']);
        }

        return $payment->fresh(['booking', 'foodOrder', 'user']);
    }

    public function generatePaymentCode(): string
    {
        $next = (int) Payment::withTrashed()->max('id') + 1025;
        do {
            $code = 'PAY-'.$next;
            $next++;
        } while (Payment::withTrashed()->where('payment_code', $code)->exists());

        return $code;
    }

    protected function generateReferenceNumber(string $method): string
    {
        $prefix = match ($method) {
            'gcash' => 'GC',
            'maya' => 'MY',
            'card' => 'CC',
            'bank' => 'BT',
            default => 'CSH',
        };

        return $prefix.'-'.random_int(100000, 999999);
    }
}
