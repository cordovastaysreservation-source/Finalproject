<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new customer account.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/\S/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^\S+$/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],
            'phone' => ['nullable', 'string', 'max:30'],
        ], [
            'name.regex' => 'Full name cannot be empty or spaces only.',
            'password.regex' => 'Password must contain at least 8 characters, 1 uppercase letter (A-Z), 1 number (0-9), and no spaces.',
            'password.min' => 'Password must be at least 8 characters long.',
        ]);

        $parts = explode(' ', trim($validated['name']), 2);
        $firstName = $parts[0] ?? $validated['name'];
        $lastName = $parts[1] ?? '';

        $user = User::create([
            'name' => $validated['name'],
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role' => 'customer',
            'status' => 'active',
            'country' => 'Philippines',
            'account_type' => 'Registered customer',
            'email_updates' => true,
        ]);

        $token = $user->createToken('customer-token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Customer / general login.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower(trim($validated['email'])))->first();
        $plainPw = trim($validated['password']);
        $pwValid = $user && (
            Hash::check($plainPw, $user->password) ||
            ($user->role === 'admin' && Hash::check(strtolower($plainPw), $user->password))
        );

        if (! $pwValid) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status === 'inactive') {
            throw ValidationException::withMessages([
                'email' => ['Your account is currently inactive. Please contact support.'],
            ]);
        }

        $user->update([
            'last_active_at' => now(),
            'last_active_label' => 'Today',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Separate Admin/Staff login endpoint that rejects customer accounts.
     */
    public function adminLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower(trim($validated['email'])))->first();
        $plainPw = trim($validated['password']);
        $pwValid = $user && (
            Hash::check($plainPw, $user->password) ||
            ($user->role === 'admin' && Hash::check(strtolower($plainPw), $user->password))
        );

        if (! $pwValid) {
            throw ValidationException::withMessages([
                'email' => ['Invalid administrator credentials.'],
            ]);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Only the Administrator account can sign in to the Admin Dashboard.',
                'errors' => [
                    'email' => ['Only the Administrator account is authorized for Admin Dashboard access.'],
                ],
            ], 403);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'message' => 'Staff account is inactive.',
                'errors' => [
                    'email' => ['Your staff account is inactive.'],
                ],
            ], 403);
        }

        $user->update([
            'last_active_at' => now(),
            'last_active_label' => 'Today',
        ]);

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Admin logged in successfully.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Log out current user token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Update customer profile (First name, Last name, Email, Mobile number, Email updates).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'province' => ['nullable', 'string', 'max:120'],
            'email_updates' => ['nullable', 'boolean'],
        ]);

        $fullName = trim($validated['first_name'].' '.($validated['last_name'] ?? ''));

        $user->update([
            'name' => $fullName,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'] ?? '',
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? $user->phone,
            'address' => $validated['address'] ?? $user->address,
            'city' => $validated['city'] ?? $user->city,
            'province' => $validated['province'] ?? $user->province,
            'email_updates' => $validated['email_updates'] ?? $user->email_updates,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    /**
     * Change password from Profile page.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^\S+$/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],
        ], [
            'password.regex' => 'Password must contain at least 8 characters, 1 uppercase letter (A-Z), 1 number (0-9), and no spaces.',
        ]);

        $user = $request->user() ?? User::where('email', strtolower($validated['email']))->first();

        if (! $user || strtolower($user->email) !== strtolower($validated['email'])) {
            throw ValidationException::withMessages([
                'email' => ['Email address does not match your account.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Your password has been changed successfully.',
        ]);
    }

    /**
     * Step 1: Forgot password - generate 6-digit code (expires in 10 minutes) & send via Mail (log driver).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $email = strtolower($validated['email']);
        $user = User::where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['We could not find an account with that email address.'],
            ]);
        }

        $code = (string) random_int(100000, 999999);

        PasswordResetCode::where('email', $email)->delete();

        PasswordResetCode::create([
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::html(
                "<div style='font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #DCE7E5;border-radius:12px;overflow:hidden;'>
                    <div style='background:#0B6E75;color:#FFFFFF;padding:20px 24px;'>
                        <h2 style='margin:0;font-size:20px;'>Cordova Stays</h2>
                        <p style='margin:4px 0 0;font-size:11px;opacity:0.85;'>RESORT RESERVATION SYSTEM • SECURITY CODE</p>
                    </div>
                    <div style='padding:24px;color:#0F3F40;'>
                        <p style='margin-top:0;'>Hello <strong>{$user->name}</strong>,</p>
                        <p>We received a request to reset your Cordova Stays account password. Use the 6-digit verification code below:</p>
                        <div style='background:#DAF3EE;color:#0B6E75;font-size:28px;font-weight:800;letter-spacing:6px;text-align:center;padding:16px;border-radius:10px;margin:20px 0;'>
                            {$code}
                        </div>
                        <p style='font-size:13px;color:#6B8585;'>This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
                    </div>
                </div>",
                function ($message) use ($email) {
                    $message->to($email)->subject('Cordova Stays - Your 6-Digit Password Reset Code');
                }
            );
        } catch (\Throwable $e) {
            Log::warning("Mail send warning for {$email}: ".$e->getMessage());
        }

        Log::info("Password reset code for {$email}: {$code}");

        return response()->json([
            'message' => 'A 6-digit verification code has been sent to your email.',
            'dev_code' => config('app.debug') ? $code : null,
        ]);
    }

    /**
     * Step 2: Verify 6-digit email code.
     */
    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = strtolower($validated['email']);
        $record = PasswordResetCode::where('email', $email)
            ->where('code', $validated['code'])
            ->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'code' => ['Invalid verification code. Please check your email and try again.'],
            ]);
        }

        if ($record->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['This verification code has expired. Please request a new one.'],
            ]);
        }

        $record->update(['verified_at' => now()]);

        return response()->json([
            'message' => 'Code verified successfully.',
            'verified' => true,
        ]);
    }

    /**
     * Step 3: Reset password using verified 6-digit code.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'string', 'size:6'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^\S+$/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],
        ], [
            'password.regex' => 'Password must contain at least 8 characters, 1 uppercase letter (A-Z), 1 number (0-9), and no spaces.',
        ]);

        $email = strtolower($validated['email']);
        $record = PasswordResetCode::where('email', $email)
            ->where('code', $validated['code'])
            ->first();

        if (! $record || $record->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired reset code.'],
            ]);
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->update([
            'password' => $validated['password'],
        ]);

        PasswordResetCode::where('email', $email)->delete();

        return response()->json([
            'message' => 'Your password has been changed successfully.',
        ]);
    }

    protected function formatUser(User $user): array
    {
        $parts = explode(' ', trim($user->name), 2);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name ?: ($parts[0] ?? 'Guest'),
            'last_name' => $user->last_name ?: ($parts[1] ?? ''),
            'email' => $user->email,
            'phone' => $user->phone,
            'masked_phone' => $user->masked_phone,
            'role' => $user->role,
            'role_title' => $user->role_title ?: ucfirst($user->role),
            'status' => $user->status,
            'email_updates' => (bool) $user->email_updates,
            'address' => $user->address,
            'city' => $user->city,
            'province' => $user->province,
            'country' => $user->country,
        ];
    }
}
