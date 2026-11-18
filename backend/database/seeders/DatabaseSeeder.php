<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\ResortImage;
use App\Models\Review;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = 'password';

        // 1. Official Admin Account (cordovastaysreservation@gmail.com)
        User::withTrashed()
            ->where('email', 'admin@example.com')
            ->orWhere('staff_id', 'CST-001')
            ->where('email', '!=', 'cordovastaysreservation@gmail.com')
            ->forceDelete();

        $admin = User::updateOrCreate(
            ['email' => 'cordovastaysreservation@gmail.com'],
            [
                'name' => 'Jeaspm Dinoy',
                'first_name' => 'Jeaspm',
                'last_name' => 'Dinoy',
                'phone' => '0917 100 0001',
                'password' => 'admin12345',
                'role' => 'admin',
                'role_title' => 'Administrator',
                'status' => 'active',
                'last_active_at' => now(),
                'last_active_label' => 'Today',
                'staff_id' => 'CST-001',
                'username' => 'admin',
                'employment_status' => 'Active',
                'start_date' => '2026-01-15',
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Christopher Lopez Jr',
                'first_name' => 'Christopher',
                'last_name' => 'Lopez Jr',
                'phone' => '0917 100 0002',
                'password' => $password,
                'role' => 'manager',
                'role_title' => 'Reservations',
                'status' => 'active',
                'last_active_at' => now()->subDay(),
                'last_active_label' => 'Yesterday',
                'staff_id' => 'CST-002',
                'username' => 'christopher',
                'employment_status' => 'Active',
                'start_date' => '2026-02-01',
            ]
        );

        User::updateOrCreate(
            ['email' => 'reports@example.com'],
            [
                'name' => 'Reman Macan',
                'first_name' => 'Reman',
                'last_name' => 'Macan',
                'phone' => '0917 100 0003',
                'password' => $password,
                'role' => 'receptionist',
                'role_title' => 'Reports',
                'status' => 'inactive',
                'last_active_at' => now()->subDays(12),
                'last_active_label' => 'Oct 06',
                'staff_id' => 'CST-003',
                'username' => 'reman',
                'employment_status' => 'Inactive',
                'start_date' => '2026-03-10',
            ]
        );

        // Additional standard role accounts for easy testing
        User::updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Platform Manager',
                'first_name' => 'Platform',
                'last_name' => 'Manager',
                'phone' => '0917 100 0004',
                'password' => $password,
                'role' => 'manager',
                'role_title' => 'Manager',
                'status' => 'active',
                'last_active_at' => now(),
                'last_active_label' => 'Today',
                'staff_id' => 'CST-004',
                'username' => 'manager',
                'employment_status' => 'Active',
                'start_date' => '2026-02-15',
            ]
        );

        User::updateOrCreate(
            ['email' => 'receptionist@example.com'],
            [
                'name' => 'Front Desk Receptionist',
                'first_name' => 'Front Desk',
                'last_name' => 'Receptionist',
                'phone' => '0917 100 0005',
                'password' => $password,
                'role' => 'receptionist',
                'role_title' => 'Receptionist',
                'status' => 'active',
                'last_active_at' => now(),
                'last_active_label' => 'Today',
                'staff_id' => 'CST-005',
                'username' => 'receptionist',
                'employment_status' => 'Active',
                'start_date' => '2026-03-01',
            ]
        );

        User::updateOrCreate(
            ['email' => 'housekeeping@example.com'],
            [
                'name' => 'Room Housekeeping',
                'first_name' => 'Room',
                'last_name' => 'Housekeeping',
                'phone' => '0917 100 0006',
                'password' => $password,
                'role' => 'housekeeping',
                'role_title' => 'Housekeeping',
                'status' => 'active',
                'last_active_at' => now(),
                'last_active_label' => 'Today',
                'staff_id' => 'CST-006',
                'username' => 'housekeeping',
                'employment_status' => 'Active',
                'start_date' => '2026-03-15',
            ]
        );

        // 2. Sample Customers
        $maria = User::updateOrCreate(
            ['email' => 'maria@example.com'],
            [
                'name' => 'Maria Santos',
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'phone' => '0917 123 1024',
                'password' => $password,
                'role' => 'customer',
                'status' => 'active',
                'address' => 'Poblacion, Cordova',
                'city' => 'Cordova',
                'province' => 'Cebu',
                'country' => 'Philippines',
                'account_type' => 'Registered customer',
                'email_updates' => true,
            ]
        );

        $john = User::updateOrCreate(
            ['email' => 'john@example.com'],
            [
                'name' => 'John Reyes',
                'first_name' => 'John',
                'last_name' => 'Reyes',
                'phone' => '0917 234 2055',
                'password' => $password,
                'role' => 'customer',
                'status' => 'active',
                'address' => 'Catarman, Cordova',
                'city' => 'Cordova',
                'province' => 'Cebu',
                'country' => 'Philippines',
                'account_type' => 'Registered customer',
                'email_updates' => true,
            ]
        );

        $ana = User::updateOrCreate(
            ['email' => 'ana@example.com'],
            [
                'name' => 'Ana Dela Cruz',
                'first_name' => 'Ana',
                'last_name' => 'Dela Cruz',
                'phone' => '0917 345 3188',
                'password' => $password,
                'role' => 'customer',
                'status' => 'active',
                'address' => 'Alegria, Cordova',
                'city' => 'Cordova',
                'province' => 'Cebu',
                'country' => 'Philippines',
                'account_type' => 'Registered customer',
                'email_updates' => true,
            ]
        );

        $mark = User::updateOrCreate(
            ['email' => 'mark@example.com'],
            [
                'name' => 'Mark Lim',
                'first_name' => 'Mark',
                'last_name' => 'Lim',
                'phone' => '0917 456 4471',
                'password' => $password,
                'role' => 'customer',
                'status' => 'inactive',
                'address' => 'Day-as, Cordova',
                'city' => 'Cordova',
                'province' => 'Cebu',
                'country' => 'Philippines',
                'account_type' => 'Registered customer',
                'email_updates' => false,
            ]
        );

        User::updateOrCreate(
            ['email' => 'guest@example.com'],
            [
                'name' => 'Guest Surname',
                'first_name' => 'Guest',
                'last_name' => 'Surname',
                'phone' => '0917 555 8899',
                'password' => $password,
                'role' => 'customer',
                'status' => 'active',
                'address' => 'Poblacion, Cordova',
                'city' => 'Cordova',
                'province' => 'Cebu',
                'country' => 'Philippines',
                'account_type' => 'Registered customer',
                'email_updates' => true,
            ]
        );

        // 3. Amenities
        $resortAmenityNames = ['Pool', 'Wi-Fi', 'Parking', 'Family-friendly options'];
        $resortAmenityIds = [];
        foreach ($resortAmenityNames as $name) {
            $a = Amenity::firstOrCreate(['name' => $name], ['category' => 'both']);
            $resortAmenityIds[] = $a->id;
        }

        $roomAmenityNames = [
            'Wi-Fi',
            'Air conditioning',
            'TV',
            'Private bathroom',
            'Balcony',
            'Mini bar',
            'Ocean view',
            'Breakfast included',
            'Mini Fridge',
        ];
        $roomAmenityIds = [];
        foreach ($roomAmenityNames as $name) {
            $a = Amenity::firstOrCreate(['name' => $name], ['category' => 'room']);
            $roomAmenityIds[] = $a->id;
        }

        // 4. The 9 Resorts (Cordova, Cebu)
        $resortsData = [
            [
                'name' => 'Eventesia Garden',
                'description' => 'Garden escape with relaxing poolside spaces.',
                'cover_image' => '/images/resorts/eventesia-garden.jpg',
                'is_popular' => true,
                'display_rooms_count' => 18,
                'status' => 'published',
                'sort_order' => 1,
            ],
            [
                'name' => 'Casa Ragina',
                'description' => 'A peaceful stay for couples and families.',
                'cover_image' => '/images/resorts/casa-ragina.jpg',
                'is_popular' => true,
                'display_rooms_count' => 12,
                'status' => 'published',
                'sort_order' => 2,
            ],
            [
                'name' => 'Cordova Home Village',
                'description' => 'Comfortable village-style family getaway.',
                'cover_image' => '/images/resorts/cordova-home-village.jpg',
                'is_popular' => true,
                'display_rooms_count' => 14,
                'status' => 'published',
                'sort_order' => 3,
            ],
            [
                'name' => 'Cordova Reef Village',
                'description' => 'A tropical retreat near the coast.',
                'cover_image' => '/images/resorts/cordova-reef-village.jpg',
                'is_popular' => false,
                'display_rooms_count' => 9,
                'status' => 'published',
                'sort_order' => 4,
            ],
            [
                'name' => 'Villa Asela',
                'description' => 'A quiet and cozy resort stay.',
                'cover_image' => '/images/resorts/villa-asela.jpg',
                'is_popular' => false,
                'display_rooms_count' => 10,
                'status' => 'published',
                'sort_order' => 5,
            ],
            [
                'name' => 'Flores Villa',
                'description' => 'Leisure spaces for a refreshing break.',
                'cover_image' => '/images/resorts/flores-villa.jpg',
                'is_popular' => false,
                'display_rooms_count' => 8,
                'status' => 'published',
                'sort_order' => 6,
            ],
            [
                'name' => 'Alta Resort',
                'description' => 'A modern resort experience in Cordova.',
                'cover_image' => '/images/resorts/alta-resort.jpg',
                'is_popular' => false,
                'display_rooms_count' => 16,
                'status' => 'published',
                'sort_order' => 7,
            ],
            [
                'name' => 'Solea Resort',
                'description' => 'A seaside-inspired destination for your getaway.',
                'cover_image' => '/images/resorts/solea-resort.jpg',
                'is_popular' => false,
                'display_rooms_count' => 24,
                'status' => 'published',
                'sort_order' => 8,
            ],
            [
                'name' => 'Gitika Resort',
                'description' => 'A welcoming place to relax and recharge.',
                'cover_image' => '/images/resorts/gitika-resort.jpg',
                'is_popular' => false,
                'display_rooms_count' => 22,
                'status' => 'published',
                'sort_order' => 9,
            ],
        ];

        $defaultRoomTypes = [
            [
                'name' => 'Standard Room',
                'type' => 'Standard Room',
                'bed_configuration' => '1 queen bed',
                'capacity' => 2,
                'price_per_night' => 2500.00,
                'size_sqm' => 28,
                'floor' => '1st Floor',
                'description' => 'Comfortable room with essential amenities',
                'placeholder_label' => 'STANDARD ROOM',
                'code_prefix' => 'S',
            ],
            [
                'name' => 'Deluxe Pool View',
                'type' => 'Deluxe Pool View',
                'bed_configuration' => '1 king bed',
                'capacity' => 2,
                'price_per_night' => 3800.00,
                'size_sqm' => 32,
                'floor' => '2nd Floor',
                'description' => 'Relaxing view and extra comfort',
                'placeholder_label' => 'DELUXE POOL VIEW',
                'code_prefix' => 'D',
            ],
            [
                'name' => 'Family Room',
                'type' => 'Family Room',
                'bed_configuration' => '2 beds',
                'capacity' => 4,
                'price_per_night' => 5200.00,
                'size_sqm' => 45,
                'floor' => '1st Floor',
                'description' => 'Extra space for families or friends',
                'placeholder_label' => 'FAMILY ROOM',
                'code_prefix' => 'F',
            ],
        ];

        $resorts = [];
        $roomCounter = 1;

        foreach ($resortsData as $rData) {
            $slug = Str::slug($rData['name']);
            $resort = Resort::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $rData['name'],
                    'location' => 'Cordova, Cebu',
                    'address' => $rData['name'].', Poblacion, Cordova, Cebu',
                    'contact_number' => '+63 917 800 000'.$rData['sort_order'],
                    'email' => $slug.'@cordovastays.com',
                    'description' => $rData['description'],
                    'status' => $rData['status'],
                    'cover_image' => $rData['cover_image'],
                    'qr_image' => '/images/resorts/qr-code.jpg',
                    'display_rooms_count' => $rData['display_rooms_count'],
                    'is_popular' => $rData['is_popular'],
                    'sort_order' => $rData['sort_order'],
                ]
            );

            $resort->amenities()->sync($resortAmenityIds);

            // Seed PHOTO 2..5 placeholder gallery records
            for ($i = 2; $i <= 5; $i++) {
                ResortImage::updateOrCreate(
                    ['resort_id' => $resort->id, 'sort_order' => $i],
                    [
                        'image_path' => null,
                        'label' => 'PHOTO '.$i,
                    ]
                );
            }

            // Seed 3 rooms per resort
            foreach ($defaultRoomTypes as $idx => $rt) {
                $roomCode = sprintf('ROOM-%03d', $roomCounter);
                $roomNumber = sprintf('%s-%d0%d', $rt['code_prefix'], $rData['sort_order'], $idx + 1);
                $room = Room::updateOrCreate(
                    ['room_code' => $roomCode],
                    [
                        'resort_id' => $resort->id,
                        'room_number' => $roomNumber,
                        'name' => $rt['name'],
                        'type' => $rt['type'],
                        'bed_configuration' => $rt['bed_configuration'],
                        'capacity' => $rt['capacity'],
                        'price_per_night' => $rt['price_per_night'],
                        'size_sqm' => $rt['size_sqm'],
                        'floor' => $rt['floor'],
                        'description' => $rt['description'],
                        'placeholder_label' => $rt['placeholder_label'],
                        'status' => ($rData['sort_order'] === 3 && $idx === 0) ? 'inactive' : 'active',
                    ]
                );
                $room->amenities()->sync(array_slice($roomAmenityIds, 0, 5));
                $roomCounter++;
            }

            $resorts[$rData['name']] = $resort;
        }

        // Assign admin to Eventesia Garden
        $admin->update(['assigned_resort_id' => $resorts['Eventesia Garden']->id]);

        // 5. Sample Bookings & Payments (matching Customer Portal & Admin Screenshots)
        $eventesia = $resorts['Eventesia Garden'];
        $casaRagina = $resorts['Casa Ragina'];
        $cordovaHome = $resorts['Cordova Home Village'];
        $cordovaReef = $resorts['Cordova Reef Village'];

        $eventesiaDeluxe = $eventesia->rooms()->where('name', 'Deluxe Pool View')->first();
        $casaStandard = $casaRagina->rooms()->where('name', 'Standard Room')->first();
        $reefDeluxe = $cordovaReef->rooms()->where('name', 'Deluxe Pool View')->first();
        $homeFamily = $cordovaHome->rooms()->where('name', 'Family Room')->first();

        // Booking 1: CR-1024 (Maria Santos - Confirmed - ₱8,100 / ₱7,500)
        $b1 = Booking::updateOrCreate(
            ['reference' => 'CR-1024'],
            [
                'user_id' => $maria->id,
                'resort_id' => $eventesia->id,
                'room_id' => $eventesiaDeluxe->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-18',
                'check_out' => '2026-10-20',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'Maria',
                'guest_last_name' => 'Santos',
                'guest_email' => 'maria@example.com',
                'guest_mobile' => '0917 123 1024',
                'subtotal' => 7000.00,
                'fees' => 500.00,
                'total' => 7500.00,
                'status' => 'confirmed',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1001'],
            [
                'booking_id' => $b1->id,
                'user_id' => $maria->id,
                'guest_name' => 'Maria Santos',
                'booking_reference' => 'CR-1024',
                'method' => 'gcash',
                'method_display' => 'E-wallet',
                'status' => 'paid',
                'amount' => 7500.00,
                'reference_no' => 'GC-823104',
                'paid_at' => '2026-10-21 10:15:00',
            ]
        );

        // Booking 2: CR-1023 (John Reyes - Pending - ₱4,200)
        $b2 = Booking::updateOrCreate(
            ['reference' => 'CR-1023'],
            [
                'user_id' => $john->id,
                'resort_id' => $casaRagina->id,
                'room_id' => $casaStandard->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-19',
                'check_out' => '2026-10-21',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'John',
                'guest_last_name' => 'Reyes',
                'guest_email' => 'john@example.com',
                'guest_mobile' => '0917 234 2055',
                'subtotal' => 3700.00,
                'fees' => 500.00,
                'total' => 4200.00,
                'status' => 'pending',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1002'],
            [
                'booking_id' => $b2->id,
                'user_id' => $john->id,
                'guest_name' => 'John Reyes',
                'booking_reference' => 'CR-1023',
                'method' => 'card',
                'method_display' => 'Card',
                'status' => 'pending',
                'amount' => 4200.00,
                'reference_no' => 'CC-442813',
                'paid_at' => '2026-10-20 14:30:00',
            ]
        );

        // Booking 3: CR-1022 (Ana Dela Cruz - Confirmed - ₱6,800)
        $b3 = Booking::updateOrCreate(
            ['reference' => 'CR-1022'],
            [
                'user_id' => $ana->id,
                'resort_id' => $cordovaReef->id,
                'room_id' => $reefDeluxe->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-20',
                'check_out' => '2026-10-22',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'Ana',
                'guest_last_name' => 'Dela Cruz',
                'guest_email' => 'ana@example.com',
                'guest_mobile' => '0917 345 3188',
                'subtotal' => 6300.00,
                'fees' => 500.00,
                'total' => 6800.00,
                'status' => 'confirmed',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1003'],
            [
                'booking_id' => $b3->id,
                'user_id' => $ana->id,
                'guest_name' => 'Ana Dela Cruz',
                'booking_reference' => 'CR-1022',
                'method' => 'bank',
                'method_display' => 'Bank',
                'status' => 'paid',
                'amount' => 6800.00,
                'reference_no' => 'BT-663901',
                'paid_at' => '2026-10-20 09:00:00',
            ]
        );

        // Booking 4: CR-1021 (Mark Lim - Cancelled / Refunded - ₱3,900)
        $b4 = Booking::updateOrCreate(
            ['reference' => 'CR-1021'],
            [
                'user_id' => $mark->id,
                'resort_id' => $cordovaHome->id,
                'room_id' => $homeFamily->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-21',
                'check_out' => '2026-10-23',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'Mark',
                'guest_last_name' => 'Lim',
                'guest_email' => 'mark@example.com',
                'guest_mobile' => '0917 456 4471',
                'subtotal' => 3400.00,
                'fees' => 500.00,
                'total' => 3900.00,
                'status' => 'cancelled',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1004'],
            [
                'booking_id' => $b4->id,
                'user_id' => $mark->id,
                'guest_name' => 'Mark Lim',
                'booking_reference' => 'CR-1021',
                'method' => 'gcash',
                'method_display' => 'E-wallet',
                'status' => 'refunded',
                'amount' => 3900.00,
                'reference_no' => 'GC-823001',
                'paid_at' => '2026-10-19 16:45:00',
            ]
        );

        // Booking 5 & 6 for Customer Portal "My Bookings" (Page 53: Eventesia Garden Pending ₱8,100 & Casa Ragina Completed ₱8,100)
        $b5 = Booking::updateOrCreate(
            ['reference' => 'CS-2026-00125'],
            [
                'user_id' => $maria->id,
                'resort_id' => $eventesia->id,
                'room_id' => $eventesiaDeluxe->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-25',
                'check_out' => '2026-10-27',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'Maria',
                'guest_last_name' => 'Santos',
                'guest_email' => 'maria@example.com',
                'guest_mobile' => '0917 123 1024',
                'subtotal' => 7600.00,
                'fees' => 500.00,
                'total' => 8100.00,
                'status' => 'pending',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1020'],
            [
                'booking_id' => $b5->id,
                'user_id' => $maria->id,
                'guest_name' => 'Maria Santos',
                'booking_reference' => 'CS-2026-00125',
                'method' => 'pay_at_resort',
                'method_display' => 'Cash',
                'status' => 'pending',
                'amount' => 8100.00,
                'reference_no' => 'CSH-112904',
                'paid_at' => '2026-10-18 11:20:00',
            ]
        );

        $b6 = Booking::updateOrCreate(
            ['reference' => 'CS-2026-00126'],
            [
                'user_id' => $maria->id,
                'resort_id' => $casaRagina->id,
                'room_id' => $casaStandard->id,
                'booking_type' => 'room',
                'check_in' => '2026-10-10',
                'check_out' => '2026-10-12',
                'nights' => 2,
                'adults' => 2,
                'children' => 0,
                'guest_first_name' => 'Maria',
                'guest_last_name' => 'Santos',
                'guest_email' => 'maria@example.com',
                'guest_mobile' => '0917 123 1024',
                'subtotal' => 7600.00,
                'fees' => 500.00,
                'total' => 8100.00,
                'status' => 'completed',
            ]
        );

        Payment::updateOrCreate(
            ['payment_code' => 'PAY-1019'],
            [
                'booking_id' => $b6->id,
                'user_id' => $maria->id,
                'guest_name' => 'Maria Santos',
                'booking_reference' => 'CS-2026-00126',
                'method' => 'gcash',
                'method_display' => 'GCash',
                'status' => 'paid',
                'amount' => 8100.00,
                'reference_no' => 'GC-822947',
                'paid_at' => '2026-10-17 15:10:00',
            ]
        );

        // 6. Sample Reviews (matching Admin Reviews Page 10 & Export Reviews Page 11)
        Review::updateOrCreate(
            ['review_code' => 'REV-2041'],
            [
                'user_id' => $maria->id,
                'guest_name' => 'Maria Santos',
                'resort_id' => $eventesia->id,
                'booking_id' => $b6->id,
                'rating' => 5,
                'comment' => 'Great stay and friendly staff...',
                'status' => 'published',
                'reviewed_date' => '2026-10-05',
            ]
        );

        Review::updateOrCreate(
            ['review_code' => 'REV-2040'],
            [
                'user_id' => $john->id,
                'guest_name' => 'John Reyes',
                'resort_id' => $casaRagina->id,
                'booking_id' => $b2->id,
                'rating' => 4,
                'comment' => 'Clean room and nice view...',
                'status' => 'needs_review',
                'reviewed_date' => '2026-10-04',
            ]
        );

        Review::updateOrCreate(
            ['review_code' => 'REV-2039'],
            [
                'user_id' => $ana->id,
                'guest_name' => 'Ana Dela Cruz',
                'resort_id' => $cordovaReef->id,
                'booking_id' => $b3->id,
                'rating' => 5,
                'comment' => 'Good location, could improve...',
                'status' => 'published',
                'reviewed_date' => '2026-10-02',
            ]
        );

        Review::updateOrCreate(
            ['review_code' => 'REV-2038'],
            [
                'user_id' => $mark->id,
                'guest_name' => 'Mark Lim',
                'resort_id' => $cordovaHome->id,
                'booking_id' => $b4->id,
                'rating' => 3,
                'comment' => 'Peaceful atmosphere and helpful staff.',
                'status' => 'published',
                'reviewed_date' => '2026-09-29',
            ]
        );

        // 7. Sample Food Order
        FoodOrder::updateOrCreate(
            ['reference' => 'CS-2026-00201'],
            [
                'user_id' => $maria->id,
                'resort_id' => $eventesia->id,
                'type' => 'bundle',
                'title' => 'Foods and Drinks Bundle',
                'items' => [
                    'Grilled Seafood Platter',
                    'Cordova Native Lechon Belly',
                    'Fresh Tropical Fruit Shake Pitcher',
                    'Steamed Garlic Rice Basket',
                ],
                'amount' => 3800.00,
                'status' => 'completed',
                'dates' => '20–22 Oct 2026',
            ]
        );
    }
}
