<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAdminController extends Controller
{
    /**
     * List staff accounts with search, filter chips (all / active / archived), and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $filter = strtolower($request->input('filter', 'all'));
        $query = User::whereIn('role', ['admin', 'manager', 'receptionist', 'housekeeping'])->with('assignedResort');

        if ($filter === 'archived') {
            $query->onlyTrashed();
        } elseif ($filter === 'active') {
            $query->where('status', 'active');
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('role', 'ilike', "%{$search}%")
                    ->orWhere('role_title', 'ilike', "%{$search}%")
                    ->orWhere('staff_id', 'ilike', "%{$search}%")
                    ->orWhere('status', 'ilike', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('id')->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => collect($paginated->items())->map(fn (User $u) => $this->formatStaff($u)),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Get single staff member.
     */
    public function show(int $id): JsonResponse
    {
        $staff = User::withTrashed()
            ->whereIn('role', ['admin', 'manager', 'receptionist', 'housekeeping'])
            ->with('assignedResort')
            ->findOrFail($id);

        return response()->json([
            'data' => $this->formatStaff($staff),
        ]);
    }

    /**
     * Create a new staff member (+ Add New Staff Member form).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'role' => ['required', 'string'],
            'employment_status' => ['nullable', 'string'],
            'staff_id' => ['nullable', 'string', 'max:50'],
            'assigned_resort_id' => ['nullable', 'integer', 'exists:resorts,id'],
            'start_date' => ['nullable', 'date'],
            'password' => ['required', 'string', 'min:6'],
            'notes' => ['nullable', 'string'],
        ]);

        $roleNorm = strtolower($validated['role']);
        if (! in_array($roleNorm, ['admin', 'manager', 'receptionist', 'housekeeping'], true)) {
            $roleNorm = 'receptionist';
        }

        $statusNorm = strtolower($validated['employment_status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';
        $parts = explode(' ', trim($validated['name']), 2);

        $nextStaffNum = (int) User::withTrashed()->whereNotNull('staff_id')->count() + 1;
        $staffId = $validated['staff_id'] ?: sprintf('CST-%03d', $nextStaffNum);

        $staff = User::create([
            'name' => $validated['name'],
            'first_name' => $parts[0] ?? $validated['name'],
            'last_name' => $parts[1] ?? '',
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'],
            'username' => $validated['username'],
            'role' => $roleNorm,
            'role_title' => ucfirst($validated['role']),
            'status' => $statusNorm,
            'employment_status' => ucfirst($statusNorm),
            'staff_id' => $staffId,
            'assigned_resort_id' => $validated['assigned_resort_id'] ?? null,
            'start_date' => $validated['start_date'] ?? now()->toDateString(),
            'password' => $validated['password'],
            'notes' => $validated['notes'] ?? null,
            'last_active_at' => now(),
            'last_active_label' => 'Today',
        ]);

        return response()->json([
            'message' => 'Staff member created successfully.',
            'data' => $this->formatStaff($staff->load('assignedResort')),
        ], 201);
    }

    /**
     * Update an existing staff member.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $staff = User::withTrashed()
            ->whereIn('role', ['admin', 'manager', 'receptionist', 'housekeeping'])
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$staff->id],
            'phone' => ['required', 'string', 'max:30'],
            'username' => ['nullable', 'string', 'max:100', 'unique:users,username,'.$staff->id],
            'role' => ['required', 'string'],
            'employment_status' => ['nullable', 'string'],
            'staff_id' => ['nullable', 'string', 'max:50'],
            'assigned_resort_id' => ['nullable', 'integer', 'exists:resorts,id'],
            'start_date' => ['nullable', 'date'],
            'password' => ['nullable', 'string', 'min:6'],
            'notes' => ['nullable', 'string'],
        ]);

        $roleNorm = strtolower($validated['role']);
        if (! in_array($roleNorm, ['admin', 'manager', 'receptionist', 'housekeeping'], true)) {
            $roleNorm = $staff->role;
        }

        $statusNorm = strtolower($validated['employment_status'] ?? $staff->status) === 'inactive' ? 'inactive' : 'active';
        $parts = explode(' ', trim($validated['name']), 2);

        $updateData = [
            'name' => $validated['name'],
            'first_name' => $parts[0] ?? $validated['name'],
            'last_name' => $parts[1] ?? '',
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'],
            'username' => $validated['username'] ?? $staff->username,
            'role' => $roleNorm,
            'role_title' => ucfirst($validated['role']),
            'status' => $statusNorm,
            'employment_status' => ucfirst($statusNorm),
            'staff_id' => $validated['staff_id'] ?? $staff->staff_id,
            'assigned_resort_id' => $validated['assigned_resort_id'] ?? $staff->assigned_resort_id,
            'start_date' => $validated['start_date'] ?? $staff->start_date,
            'notes' => $validated['notes'] ?? $staff->notes,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = $validated['password'];
        }

        $staff->update($updateData);

        return response()->json([
            'message' => 'Staff member updated successfully.',
            'data' => $this->formatStaff($staff->fresh('assignedResort')),
        ]);
    }

    /**
     * Archive or restore a staff member.
     */
    public function destroy(int $id): JsonResponse
    {
        $staff = User::withTrashed()
            ->whereIn('role', ['admin', 'manager', 'receptionist', 'housekeeping'])
            ->findOrFail($id);

        if ($staff->trashed()) {
            $staff->restore();

            return response()->json(['message' => 'Staff member restored successfully.']);
        }

        $staff->delete();

        return response()->json(['message' => 'Staff member archived successfully.']);
    }

    protected function formatStaff(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'username' => $u->username,
            'staff_id' => $u->staff_id ?: 'CST-001',
            'role' => $u->role,
            'role_display' => $u->role_title ?: ucfirst($u->role),
            'assigned_resort_id' => $u->assigned_resort_id,
            'assigned_resort' => $u->assignedResort?->name,
            'start_date' => $u->start_date?->format('Y-m-d'),
            'last_active' => $u->last_active_label ?: ($u->last_active_at?->diffForHumans() ?? 'Today'),
            'status' => $u->trashed() ? 'Archived' : ucfirst($u->status),
            'raw_status' => $u->status,
            'employment_status' => $u->employment_status ?: ucfirst($u->status),
            'notes' => $u->notes,
            'is_archived' => $u->trashed(),
        ];
    }
}
