<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('customer')->index(); // customer, admin, manager, receptionist, housekeeping
            $table->string('role_title')->nullable(); // e.g., Administrator, Platform manager, Reservations, Reports
            $table->string('status')->default('active')->index(); // active, inactive, archived
            $table->timestamp('last_active_at')->nullable();
            $table->string('last_active_label')->nullable(); // e.g., Today, Yesterday, Oct 06

            // Staff fields
            $table->string('staff_id')->nullable()->unique();
            $table->string('username')->nullable()->unique();
            $table->unsignedBigInteger('assigned_resort_id')->nullable();
            $table->date('start_date')->nullable();
            $table->string('employment_status')->nullable(); // Active, Inactive

            // Customer fields
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('country')->default('Philippines');
            $table->string('account_type')->nullable()->default('Registered customer');
            $table->text('notes')->nullable();
            $table->boolean('email_updates')->default(true);

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('password_reset_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('code', 6);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_codes');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
