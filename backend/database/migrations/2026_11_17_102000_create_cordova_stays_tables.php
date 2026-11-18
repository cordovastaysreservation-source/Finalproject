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
        Schema::create('resorts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('location')->default('Cordova, Cebu');
            $table->string('address')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('published')->index(); // draft, published, archived, active, inactive
            $table->string('cover_image')->nullable();
            $table->string('qr_image')->nullable();
            $table->integer('display_rooms_count')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->integer('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('resort_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->string('image_path')->nullable();
            $table->string('label')->nullable(); // PHOTO 2, PHOTO 3, PHOTO 4, PHOTO 5
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('amenities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->default('both'); // resort, room, both
            $table->timestamps();
        });

        Schema::create('amenity_resort', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->foreignId('amenity_id')->constrained('amenities')->cascadeOnDelete();
            $table->unique(['resort_id', 'amenity_id']);
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->string('room_code')->unique(); // e.g., ROOM-001
            $table->string('room_number')->nullable(); // e.g., D-101, A-101
            $table->string('name'); // e.g., Standard Room, Deluxe Pool View, Family Room
            $table->string('type'); // Standard Room, Deluxe Pool View, Family Room
            $table->string('bed_configuration')->nullable(); // 1 queen bed, 1 king bed, 2 beds
            $table->integer('capacity')->default(2);
            $table->decimal('price_per_night', 10, 2)->default(2500.00);
            $table->integer('size_sqm')->nullable()->default(32);
            $table->string('floor')->nullable();
            $table->text('description')->nullable();
            $table->string('placeholder_label')->nullable(); // STANDARD ROOM, DELUXE POOL VIEW, FAMILY ROOM
            $table->string('status')->default('active')->index(); // active, inactive, archived
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('room_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('image_path');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('amenity_room', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('amenity_id')->constrained('amenities')->cascadeOnDelete();
            $table->unique(['room_id', 'amenity_id']);
        });

        Schema::create('food_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // e.g., CS-2026-00201
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->string('type'); // foods, drinks, bundle
            $table->string('title'); // Foods, Drinks, Foods and Drinks Bundle
            $table->json('items')->nullable();
            $table->decimal('amount', 10, 2)->default(3800.00);
            $table->string('status')->default('pending')->index(); // pending, confirmed, completed, cancelled
            $table->string('dates')->default('20–22 Oct 2026');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // e.g., CS-2026-00125 or CR-1024
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('food_order_id')->nullable()->constrained('food_orders')->nullOnDelete();
            $table->string('booking_type')->default('room'); // room, food
            $table->date('check_in');
            $table->date('check_out');
            $table->integer('nights')->default(2);
            $table->integer('adults')->default(2);
            $table->integer('children')->default(0);
            $table->text('special_requests')->nullable();
            $table->string('guest_first_name');
            $table->string('guest_last_name');
            $table->string('guest_email');
            $table->string('guest_mobile');
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('fees', 10, 2)->default(500.00);
            $table->decimal('total', 10, 2)->default(0.00);
            $table->string('status')->default('pending')->index(); // pending, confirmed, cancelled, completed
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_code')->unique(); // e.g., PAY-1001, PAY-1024
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('food_order_id')->nullable()->constrained('food_orders')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->string('booking_reference')->nullable();
            $table->string('method')->default('gcash'); // gcash, maya, pay_at_resort, card, bank, cash, e-wallet
            $table->string('method_display')->nullable(); // E-wallet, GCash, Credit Card, Bank Transfer, Cash
            $table->string('status')->default('pending')->index(); // pending, completed, paid, refunded
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->string('reference_no')->nullable();
            $table->string('proof_image')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('review_code')->unique(); // e.g., REV-2041
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('comment');
            $table->string('status')->default('published')->index(); // published, needs_review, hidden
            $table->date('reviewed_date')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('food_orders');
        Schema::dropIfExists('amenity_room');
        Schema::dropIfExists('room_images');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('amenity_resort');
        Schema::dropIfExists('amenities');
        Schema::dropIfExists('resort_images');
        Schema::dropIfExists('resorts');
    }
};
