<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'phone',
        'password',
        'role',
        'role_title',
        'status',
        'last_active_at',
        'last_active_label',
        'staff_id',
        'username',
        'assigned_resort_id',
        'start_date',
        'employment_status',
        'address',
        'city',
        'province',
        'country',
        'account_type',
        'notes',
        'email_updates',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at' => 'datetime',
            'start_date' => 'date',
            'password' => 'hashed',
            'email_updates' => 'boolean',
        ];
    }

    public function assignedResort(): BelongsTo
    {
        return $this->belongsTo(Resort::class, 'assigned_resort_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function foodOrders(): HasMany
    {
        return $this->hasMany(FoodOrder::class);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['admin', 'manager', 'receptionist', 'housekeeping'], true);
    }

    public function getMaskedPhoneAttribute(): string
    {
        if (! $this->phone) {
            return '09•• ••• 0000';
        }
        $digits = preg_replace('/\D/', '', $this->phone);
        $last4 = substr($digits, -4) ?: '1024';

        return '09•• ••• '.$last4;
    }
}
