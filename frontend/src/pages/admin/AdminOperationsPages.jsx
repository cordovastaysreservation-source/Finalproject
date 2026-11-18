import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE_URL, resolveImageUrl } from '../../api/client';
import {
  Button,
  FormInput,
  StatusBadge,
  SearchAndFilterBar,
  Modal,
  Pagination,
} from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../styles/tokens';
import { printAdminReport } from '../../utils/printPdf';

/**
 * 1. Reservations Management Page (Page 5 of Admin.pdf)
 */
export function AdminReservationsPage() {
  const { showToast } = useToast();

  const [reservations, setReservations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const loadReservations = () => {
    setLoading(true);
    api
      .get('/admin/reservations', { params: { search, filter, page } })
      .then((res) => {
        setReservations(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, [search, filter, page]);

  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await api.put(`/admin/reservations/${selectedBooking.id}`, {
        status: selectedBooking.raw_status,
        check_in: selectedBooking.check_in,
        check_out: selectedBooking.check_out,
        guest_first_name: selectedBooking.guest_first_name,
        guest_last_name: selectedBooking.guest_last_name,
        guest_email: selectedBooking.guest_email,
        guest_mobile: selectedBooking.guest_mobile,
      });
      showToast('Reservation updated successfully.');
      setSelectedBooking(null);
      loadReservations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update reservation.', 'error');
    }
  };

  const handleQuickStatus = async (booking, newStatus) => {
    try {
      await api.put(`/admin/reservations/${booking.id}`, { status: newStatus });
      showToast(`Reservation marked ${newStatus}.`);
      setSelectedBooking(null);
      loadReservations();
    } catch {
      showToast('Could not update status.', 'error');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await api.delete(`/admin/reservations/${archiveTarget.id}`);
      showToast(res.data.message);
      setArchiveTarget(null);
      loadReservations();
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        All records
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 16 }}>
        Use search and actions to manage platform data.
      </p>

      <SearchAndFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading reservations...
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            No reservations found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #E2ECEA',
                    textAlign: 'left',
                    color: '#6B8585',
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: '12px 8px' }}>Booking ID</th>
                  <th style={{ padding: '12px 8px' }}>Guest</th>
                  <th style={{ padding: '12px 8px' }}>Resort</th>
                  <th style={{ padding: '12px 8px' }}>Check-in</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Amount</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 600 }}>{r.reference}</td>
                    <td style={{ padding: '15px 8px' }}>{r.guest}</td>
                    <td style={{ padding: '15px 8px' }}>{r.resort}</td>
                    <td style={{ padding: '15px 8px' }}>{r.check_in_short}</td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '15px 8px', fontWeight: 600 }}>
                      {formatCurrency(r.amount)}
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <span
                        onClick={() => setSelectedBooking({ ...r })}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        Edit
                      </span>
                      {' · '}
                      <span
                        onClick={() => setArchiveTarget(r)}
                        style={{ cursor: 'pointer', fontWeight: 700, color: '#6B8585' }}
                      >
                        …
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Edit & Status Modal */}
      <Modal
        open={!!selectedBooking}
        title={`Manage Reservation (${selectedBooking?.reference})`}
        onClose={() => setSelectedBooking(null)}
        maxWidth={560}
      >
        {selectedBooking && (
          <form onSubmit={handleUpdateReservation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <Button
                variant="outline"
                onClick={() => handleQuickStatus(selectedBooking, 'confirmed')}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStatus(selectedBooking, 'completed')}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                Mark Completed
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStatus(selectedBooking, 'cancelled')}
                style={{ padding: '6px 12px', fontSize: 12, color: '#A82E2E' }}
              >
                Cancel Booking
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormInput
                label="First Name"
                value={selectedBooking.guest_first_name}
                onChange={(e) =>
                  setSelectedBooking({ ...selectedBooking, guest_first_name: e.target.value })
                }
              />
              <FormInput
                label="Last Name"
                value={selectedBooking.guest_last_name}
                onChange={(e) =>
                  setSelectedBooking({ ...selectedBooking, guest_last_name: e.target.value })
                }
              />
              <FormInput
                label="Check-in Date"
                type="date"
                value={selectedBooking.check_in}
                onChange={(e) =>
                  setSelectedBooking({ ...selectedBooking, check_in: e.target.value })
                }
              />
              <FormInput
                label="Check-out Date"
                type="date"
                value={selectedBooking.check_out}
                onChange={(e) =>
                  setSelectedBooking({ ...selectedBooking, check_out: e.target.value })
                }
              />
            </div>

            <div className="cs-form-group">
              <label className="cs-label">Reservation Status</label>
              <select
                value={selectedBooking.raw_status}
                onChange={(e) =>
                  setSelectedBooking({ ...selectedBooking, raw_status: e.target.value })
                }
                className="cs-input"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
              <Button type="submit" style={{ backgroundColor: '#1E6E62' }}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!archiveTarget}
        title={archiveTarget?.is_archived ? 'Restore Reservation' : 'Archive Reservation'}
        onClose={() => setArchiveTarget(null)}
      >
        <p style={{ fontSize: 14, color: '#3E5959', marginBottom: 20 }}>
          Are you sure you want to {archiveTarget?.is_archived ? 'restore' : 'archive'}{' '}
          reservation <strong>{archiveTarget?.reference}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmArchive} style={{ backgroundColor: '#1E6E62' }}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 2. Customer Management List Page (Page 12 of Admin.pdf)
 */
export function AdminCustomersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const loadCustomers = () => {
    setLoading(true);
    api
      .get('/admin/customers', { params: { search, filter, page } })
      .then((res) => {
        setCustomers(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [search, filter, page]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await api.delete(`/admin/customers/${archiveTarget.id}`);
      showToast(res.data.message);
      setArchiveTarget(null);
      loadCustomers();
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        All records
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 16 }}>
        Use search and actions to manage platform data.
      </p>

      <SearchAndFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        actionButton={
          <Button
            onClick={() => navigate('/admin/customers/new')}
            style={{ backgroundColor: '#1E6E62' }}
          >
            + Add Customer
          </Button>
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading customers...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #E2ECEA',
                    textAlign: 'left',
                    color: '#6B8585',
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: '12px 8px' }}>Guest name</th>
                  <th style={{ padding: '12px 8px' }}>Email</th>
                  <th style={{ padding: '12px 8px' }}>Phone</th>
                  <th style={{ padding: '12px 8px' }}>Bookings</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '15px 8px' }}>{c.email}</td>
                    <td style={{ padding: '15px 8px' }}>{c.masked_phone}</td>
                    <td style={{ padding: '15px 8px' }}>{c.bookings_count}</td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <span
                        onClick={() => navigate(`/admin/customers/${c.id}/edit`)}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        View
                      </span>
                      {' · '}
                      <span
                        onClick={() => setArchiveTarget(c)}
                        style={{ cursor: 'pointer', fontWeight: 700, color: '#6B8585' }}
                      >
                        …
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        open={!!archiveTarget}
        title={archiveTarget?.is_archived ? 'Restore Customer' : 'Archive Customer'}
        onClose={() => setArchiveTarget(null)}
      >
        <p style={{ fontSize: 14, color: '#3E5959', marginBottom: 20 }}>
          Are you sure you want to {archiveTarget?.is_archived ? 'restore' : 'archive'}{' '}
          <strong>{archiveTarget?.name}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmArchive} style={{ backgroundColor: '#1E6E62' }}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 3. Add / Edit Customer Form Page (Page 13 of Admin.pdf)
 */
export function AdminCustomerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [accountType, setAccountType] = useState('');
  const [notes, setNotes] = useState('');
  const [customerBookings, setCustomerBookings] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/customers/${id}`).then((res) => {
        const d = res.data.data;
        setName(d.name || '');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setStatus(d.raw_status === 'inactive' ? 'Inactive' : 'Active');
        setAddress(d.address || '');
        setCity(d.city || '');
        setProvince(d.province || '');
        setCountry(d.country || 'Philippines');
        setAccountType(d.account_type || '');
        setNotes(d.notes || '');
        setCustomerBookings(d.bookings || []);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        name,
        email,
        phone,
        status,
        address,
        city,
        province,
        country,
        account_type: accountType,
        notes,
      };
      if (isEdit) {
        await api.put(`/admin/customers/${id}`, payload);
        showToast('Customer updated successfully.');
      } else {
        await api.post('/admin/customers', payload);
        showToast('Customer created successfully.');
      }
      navigate('/admin/customers');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Please check required customer fields.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cs-card" style={{ padding: '28px 30px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Customer information
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 20 }}>
        Enter the customer details for reservations and account management.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
        <FormInput
          label="Full name"
          required
          placeholder="e.g. Juan Dela Cruz"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name?.[0]}
        />

        <FormInput
          label="Email address"
          required
          type="email"
          placeholder="e.g. juan@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email?.[0]}
        />

        <FormInput
          label="Phone number"
          required
          placeholder="e.g. +63 912 345 6789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone?.[0]}
        />

        <FormInput
          label="Customer status"
          placeholder="Active"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />

        <FormInput
          label="Address"
          placeholder="House number, street, barangay"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <FormInput
          label="City / Municipality"
          placeholder="e.g. Cordova"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <FormInput
          label="Province"
          placeholder="e.g. Cebu"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        />

        <FormInput
          label="Country"
          placeholder="Philippines"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      <FormInput
        label="Account type"
        placeholder="Guest / Registered customer"
        value={accountType}
        onChange={(e) => setAccountType(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      <FormInput
        label="Notes"
        placeholder="Optional customer notes or special requests"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ marginBottom: 24 }}
      />

      <div
        style={{
          borderTop: '1px solid #EDF3F2',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Button variant="outline" onClick={() => navigate('/admin/customers')}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} style={{ backgroundColor: '#1E6E62' }}>
          {saving ? 'Saving...' : 'Save Customer'}
        </Button>
      </div>

      {isEdit && customerBookings.length > 0 && (
        <div style={{ borderTop: '1px solid #EDF3F2', marginTop: 24, paddingTop: 20 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#0F3F40', marginBottom: 12 }}>
            Customer Booking History ({customerBookings.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2ECEA', textAlign: 'left', color: '#6B8585', fontSize: 12 }}>
                <th style={{ padding: '8px' }}>Booking ID</th>
                <th style={{ padding: '8px' }}>Resort</th>
                <th style={{ padding: '8px' }}>Room</th>
                <th style={{ padding: '8px' }}>Check-in</th>
                <th style={{ padding: '8px' }}>Status</th>
                <th style={{ padding: '8px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {customerBookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{b.reference}</td>
                  <td style={{ padding: '10px 8px' }}>{b.resort}</td>
                  <td style={{ padding: '10px 8px' }}>{b.room}</td>
                  <td style={{ padding: '10px 8px' }}>{b.check_in}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{formatCurrency(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}

/**
 * 4. Payment Management Page (Page 16 of Admin.pdf)
 * Includes QR payment proof verification & approval modal.
 */
export function AdminPaymentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = () => {
    setLoading(true);
    api
      .get('/admin/payments', { params: { search, filter, page } })
      .then((res) => {
        setPayments(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, [search, filter, page]);

  const handleUpdatePaymentStatus = async (status) => {
    if (!selectedPayment) return;
    try {
      await api.put(`/admin/payments/${selectedPayment.id}`, {
        status,
        reference_no: selectedPayment.reference_no,
      });
      showToast(`Payment ${selectedPayment.payment_code} marked ${status.toUpperCase()}.`);
      setSelectedPayment(null);
      loadPayments();
    } catch {
      showToast('Failed to update payment.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        All records
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 16 }}>
        Use search and actions to manage platform data.
      </p>

      <SearchAndFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        actionButton={
          <Button
            onClick={() => navigate('/admin/payments/export')}
            style={{ backgroundColor: '#1E6E62' }}
          >
            Export Payments
          </Button>
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading payments...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #E2ECEA',
                    textAlign: 'left',
                    color: '#6B8585',
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: '12px 8px' }}>Payment ID</th>
                  <th style={{ padding: '12px 8px' }}>Booking ID</th>
                  <th style={{ padding: '12px 8px' }}>Guest</th>
                  <th style={{ padding: '12px 8px' }}>Method</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Amount</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 600 }}>{p.payment_code}</td>
                    <td style={{ padding: '15px 8px' }}>{p.booking_reference}</td>
                    <td style={{ padding: '15px 8px' }}>{p.guest}</td>
                    <td style={{ padding: '15px 8px' }}>{p.method}</td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: '15px 8px', fontWeight: 600 }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <span
                        onClick={() => setSelectedPayment({ ...p })}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        Edit · …
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Approve QR Proof / Update Payment Modal */}
      <Modal
        open={!!selectedPayment}
        title={`Verify & Manage Payment (${selectedPayment?.payment_code})`}
        onClose={() => setSelectedPayment(null)}
      >
        {selectedPayment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ color: '#6B8585', fontSize: 12 }}>Guest</div>
                <div style={{ fontWeight: 700 }}>{selectedPayment.guest}</div>
              </div>
              <div>
                <div style={{ color: '#6B8585', fontSize: 12 }}>Booking Reference</div>
                <div style={{ fontWeight: 700 }}>{selectedPayment.booking_reference}</div>
              </div>
              <div>
                <div style={{ color: '#6B8585', fontSize: 12 }}>Method</div>
                <div style={{ fontWeight: 700 }}>{selectedPayment.method}</div>
              </div>
              <div>
                <div style={{ color: '#6B8585', fontSize: 12 }}>Amount</div>
                <div style={{ fontWeight: 700 }}>{formatCurrency(selectedPayment.amount, 2)}</div>
              </div>
            </div>

            <FormInput
              label="Reference No."
              value={selectedPayment.reference_no || ''}
              onChange={(e) =>
                setSelectedPayment({ ...selectedPayment, reference_no: e.target.value })
              }
            />

            {selectedPayment.proof_image && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Uploaded QR Payment Proof:
                </div>
                <img
                  src={resolveImageUrl(selectedPayment.proof_image)}
                  alt="Payment Proof"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 220,
                    borderRadius: 8,
                    border: '1px solid #DCE7E5',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button
                variant="outline"
                onClick={() => handleUpdatePaymentStatus('refunded')}
                style={{ color: '#A82E2E' }}
              >
                Mark Refunded
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdatePaymentStatus('pending')}
              >
                Mark Pending
              </Button>
              <Button
                onClick={() => handleUpdatePaymentStatus('paid')}
                style={{ backgroundColor: '#1E6E62' }}
              >
                Approve & Mark Paid
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/**
 * 5. Export Payments Page (Page 17 of Admin.pdf)
 */
export function AdminExportPaymentsPage() {
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    total_payments: 248650,
    completed_transactions: 186,
    pending_payments: 12,
    refunded_amount: 8400,
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-21');
  const [columns, setColumns] = useState([
    'payment_id',
    'booking_id',
    'customer',
    'date',
    'method',
    'amount',
    'status',
  ]);

  const loadExportPreview = () => {
    api
      .get('/admin/payments', {
        params: { search, status, method, from_date: fromDate, to_date: toDate, per_page: 20 },
      })
      .then((res) => {
        setPayments(res.data.data || []);
        if (res.data.summary) setSummary(res.data.summary);
      });
  };

  useEffect(() => {
    loadExportPreview();
  }, []);

  const toggleColumn = (col) => {
    setColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const applyPreset = (preset) => {
    const today = new Date('2026-10-21');
    if (preset === '7d') {
      setFromDate('2026-10-14');
      setToDate('2026-10-21');
    } else if (preset === '30d') {
      setFromDate('2026-09-21');
      setToDate('2026-10-21');
    } else if (preset === 'month') {
      setFromDate('2026-10-01');
      setToDate('2026-10-31');
    }
    showToast(`Applied ${preset} date range preset.`);
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('cs_admin_token');
      const params = new URLSearchParams({
        search,
        status,
        method,
        columns: columns.join(','),
      });
      const res = await fetch(`${API_BASE_URL}/admin/payments/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cordova-stays-payments-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Payment report exported successfully.');
    } catch {
      showToast('Failed to export payment report.', 'error');
    }
  };

  const exportCols = [
    { key: 'payment_id', label: 'Payment ID' },
    { key: 'booking_id', label: 'Booking ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'method', label: 'Method' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 6 }}>Total Payments</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F3F40', marginBottom: 4 }}>
            {formatCurrency(summary.total_payments, 2)}
          </div>
          <div style={{ fontSize: 11.5, color: '#1E6E62', fontWeight: 600 }}>
            ↑ 12.8% <span style={{ color: '#6B8585', fontWeight: 400 }}>vs. previous period</span>
          </div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 6 }}>
            Completed Transactions
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F3F40', marginBottom: 4 }}>
            {summary.completed_transactions}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B8585' }}>Successfully paid</div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 6 }}>Pending Payments</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F3F40', marginBottom: 4 }}>
            {summary.pending_payments}
          </div>
          <div style={{ fontSize: 11.5, color: '#D97706', fontWeight: 600 }}>Needs follow-up</div>
        </div>

        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 6 }}>Refunded Amount</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F3F40', marginBottom: 4 }}>
            {formatCurrency(summary.refunded_amount, 2)}
          </div>
          <div style={{ fontSize: 11.5, color: '#6B8585' }}>Across transactions</div>
        </div>
      </div>

      {/* Payment Filters Card */}
      <div className="cs-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
          Payment Filters
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <FormInput
            label="Search"
            placeholder="Search payment ID, guest, or booking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cs-form-group">
            <label className="cs-label">Payment Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cs-input"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="cs-form-group">
            <label className="cs-label">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="cs-input"
            >
              <option value="all">All methods</option>
              <option value="gcash">GCash</option>
              <option value="card">Credit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <FormInput
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <FormInput
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Button
            onClick={loadExportPreview}
            style={{ backgroundColor: '#0E6F64', height: 42 }}
          >
            Apply Filters
          </Button>
        </div>

        <div style={{ fontSize: 12, color: '#6B8585', marginTop: 12 }}>
          Date range presets:{' '}
          <span
            onClick={() => applyPreset('7d')}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            Last 7 days
          </span>{' '}
          •{' '}
          <span
            onClick={() => applyPreset('30d')}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            Last 30 days
          </span>{' '}
          •{' '}
          <span
            onClick={() => applyPreset('month')}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            This month
          </span>{' '}
          • Custom range
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="cs-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40' }}>Payment Records</h3>
            <div style={{ fontSize: 12, color: '#6B8585' }}>
              Showing {payments.length} recent transactions
            </div>
          </div>
          <Button onClick={handleDownload} style={{ backgroundColor: '#0E6F64' }}>
            ↓ Export Payments
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#EFF6F5',
                  textAlign: 'left',
                  color: '#3E5959',
                  fontSize: 11.5,
                }}
              >
                <th style={{ padding: '10px 10px' }}>PAYMENT ID</th>
                <th style={{ padding: '10px 10px' }}>BOOKING ID</th>
                <th style={{ padding: '10px 10px' }}>CUSTOMER</th>
                <th style={{ padding: '10px 10px' }}>PAYMENT DATE</th>
                <th style={{ padding: '10px 10px' }}>METHOD</th>
                <th style={{ padding: '10px 10px' }}>AMOUNT</th>
                <th style={{ padding: '10px 10px' }}>STATUS</th>
                <th style={{ padding: '10px 10px' }}>REFERENCE NO.</th>
                <th style={{ padding: '10px 10px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                  <td style={{ padding: '14px 10px', fontWeight: 600 }}>{p.payment_code}</td>
                  <td style={{ padding: '14px 10px' }}>{p.booking_reference}</td>
                  <td style={{ padding: '14px 10px' }}>{p.guest}</td>
                  <td style={{ padding: '14px 10px' }}>{p.payment_date}</td>
                  <td style={{ padding: '14px 10px' }}>{p.method}</td>
                  <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                    {formatCurrency(p.amount, 2)}
                  </td>
                  <td style={{ padding: '14px 10px' }}>
                    <StatusBadge status={p.export_status} />
                  </td>
                  <td style={{ padding: '14px 10px' }}>{p.reference_no}</td>
                  <td style={{ padding: '14px 10px', fontWeight: 700, color: '#0E6F64' }}>•••</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Settings Card */}
      <div className="cs-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
          Export Settings
        </h3>
        <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 12 }}>
          Include in report
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {exportCols.map((c) => (
              <label
                key={c.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={columns.includes(c.key)}
                  onChange={() => toggleColumn(c.key)}
                  style={{ accentColor: '#0E6F64' }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="outline"
              onClick={() =>
                printAdminReport(
                  'Payment Transactions Report',
                  `Showing ${payments.length} payment records`,
                  ['Payment ID', 'Booking ID', 'Customer', 'Date', 'Method', 'Amount', 'Status', 'Reference No.'],
                  payments.map((p) => [
                    p.payment_code,
                    p.booking_reference,
                    p.guest,
                    p.payment_date,
                    p.method,
                    formatCurrency(p.amount, 2),
                    p.export_status,
                    p.reference_no,
                  ])
                )
              }
            >
              Print / Save PDF
            </Button>
            <Button onClick={handleDownload} style={{ backgroundColor: '#0E6F64' }}>
              ↓ Export Payment Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Reviews & Feedback List Page (Page 10 of Admin.pdf)
 */
export function AdminReviewsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  const loadReviews = () => {
    setLoading(true);
    api
      .get('/admin/reviews', { params: { search, filter, page } })
      .then((res) => {
        setReviews(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [search, filter, page]);

  const handleModerate = async (status) => {
    if (!selectedReview) return;
    try {
      await api.put(`/admin/reviews/${selectedReview.id}`, { status });
      showToast(`Review status updated to ${status}.`);
      setSelectedReview(null);
      loadReviews();
    } catch {
      showToast('Failed to update review.', 'error');
    }
  };

  const renderStars = (rating) => {
    const r = Number(rating || 5);
    return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        All records
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 16 }}>
        Use search and actions to manage platform data.
      </p>

      <SearchAndFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        actionButton={
          <Button
            onClick={() => navigate('/admin/reviews/export')}
            style={{ backgroundColor: '#1E6E62' }}
          >
            Export Reviews
          </Button>
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading reviews...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #E2ECEA',
                    textAlign: 'left',
                    color: '#6B8585',
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: '12px 8px' }}>Guest</th>
                  <th style={{ padding: '12px 8px' }}>Resort</th>
                  <th style={{ padding: '12px 8px' }}>Rating</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 500 }}>{r.guest}</td>
                    <td style={{ padding: '15px 8px' }}>{r.resort}</td>
                    <td style={{ padding: '15px 8px', letterSpacing: 1 }}>
                      {renderStars(r.rating)}
                    </td>
                    <td style={{ padding: '15px 8px' }}>{r.date}</td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <span
                        onClick={() => setSelectedReview(r)}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        {r.raw_status === 'needs_review' ? 'Review' : 'View · …'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Moderate Review Modal */}
      <Modal
        open={!!selectedReview}
        title={`Moderate Review (${selectedReview?.review_code})`}
        onClose={() => setSelectedReview(null)}
      >
        {selectedReview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13.5 }}>
              <strong>{selectedReview.guest}</strong> on{' '}
              <strong>{selectedReview.resort}</strong> ({renderStars(selectedReview.rating)})
            </div>
            <div
              style={{
                background: '#F4F8F7',
                padding: 14,
                borderRadius: 8,
                fontSize: 13.5,
                fontStyle: 'italic',
              }}
            >
              “{selectedReview.comment}”
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button
                variant="outline"
                onClick={() => handleModerate('hidden')}
                style={{ color: '#A82E2E' }}
              >
                Hide Review
              </Button>
              <Button
                variant="outline"
                onClick={() => handleModerate('needs_review')}
              >
                Mark Needs Review
              </Button>
              <Button
                onClick={() => handleModerate('published')}
                style={{ backgroundColor: '#1E6E62' }}
              >
                Publish Review
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/**
 * 7. Export Reviews Page (Page 11 of Admin.pdf)
 */
export function AdminExportReviewsPage() {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-23');

  const loadPreview = () => {
    api
      .get('/admin/reviews', { params: { search, rating, status, per_page: 25 } })
      .then((res) => setReviews(res.data.data || []));
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('cs_admin_token');
      const params = new URLSearchParams({ search, rating, status });
      const res = await fetch(`${API_BASE_URL}/admin/reviews/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cordova-stays-reviews-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Review report exported successfully.');
    } catch {
      showToast('Failed to export reviews.', 'error');
    }
  };

  const renderStars = (r) => '★'.repeat(Number(r || 5)) + '☆'.repeat(Math.max(0, 5 - Number(r || 5)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="cs-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
          Review Export Settings
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <FormInput
            label="Search"
            placeholder="Customer, resort, or review ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cs-form-group">
            <label className="cs-label">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="cs-input"
            >
              <option value="all">All ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
            </select>
          </div>
          <div className="cs-form-group">
            <label className="cs-label">Review Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cs-input"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="needs_review">Needs review</option>
            </select>
          </div>
          <FormInput
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <FormInput
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Button onClick={loadPreview} style={{ backgroundColor: '#1E6E62', height: 42 }}>
            Apply
          </Button>
        </div>
      </div>

      <div className="cs-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
          Review Export Preview
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#EFF6F5',
                  textAlign: 'left',
                  color: '#3E5959',
                  fontSize: 11.5,
                }}
              >
                <th style={{ padding: '12px 10px' }}>REVIEW ID</th>
                <th style={{ padding: '12px 10px' }}>CUSTOMER</th>
                <th style={{ padding: '12px 10px' }}>RESORT</th>
                <th style={{ padding: '12px 10px' }}>RATING</th>
                <th style={{ padding: '12px 10px' }}>COMMENT</th>
                <th style={{ padding: '12px 10px' }}>DATE</th>
                <th style={{ padding: '12px 10px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                  <td style={{ padding: '15px 10px', fontWeight: 600 }}>{r.review_code}</td>
                  <td style={{ padding: '15px 10px' }}>{r.guest}</td>
                  <td style={{ padding: '15px 10px' }}>{r.resort}</td>
                  <td style={{ padding: '15px 10px', letterSpacing: 1 }}>
                    {renderStars(r.rating)}
                  </td>
                  <td style={{ padding: '15px 10px', color: '#3E5959' }}>“{r.comment}”</td>
                  <td style={{ padding: '15px 10px' }}>{r.full_date}</td>
                  <td style={{ padding: '15px 10px' }}>{r.export_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button
          variant="outline"
          onClick={() =>
            printAdminReport(
              'Customer Reviews & Feedback Report',
              `Showing ${reviews.length} review records`,
              ['Review ID', 'Customer', 'Resort', 'Rating', 'Comment', 'Date', 'Status'],
              reviews.map((r) => [
                r.review_code,
                r.guest,
                r.resort,
                `${r.rating} / 5`,
                r.comment,
                r.full_date,
                r.export_status,
              ])
            )
          }
        >
          Print / Save PDF
        </Button>
        <Button onClick={handleExport} style={{ backgroundColor: '#1E6E62' }}>
          ↓ Export Review Report
        </Button>
      </div>
    </div>
  );
}

/**
 * 8. Staff & Roles List Page (Page 15 of Admin.pdf)
 */
export function AdminStaffPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const loadStaff = () => {
    setLoading(true);
    api
      .get('/admin/staff', { params: { search, filter, page } })
      .then((res) => {
        setStaff(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, [search, filter, page]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await api.delete(`/admin/staff/${archiveTarget.id}`);
      showToast(res.data.message);
      setArchiveTarget(null);
      loadStaff();
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        All records
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 16 }}>
        Use search and actions to manage platform data.
      </p>

      <SearchAndFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        actionButton={
          <Button
            onClick={() => navigate('/admin/staff/new')}
            style={{ backgroundColor: '#1E6E62' }}
          >
            + Add Staff
          </Button>
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading staff...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #E2ECEA',
                    textAlign: 'left',
                    color: '#6B8585',
                    fontSize: 12,
                  }}
                >
                  <th style={{ padding: '12px 8px' }}>Staff name</th>
                  <th style={{ padding: '12px 8px' }}>Email</th>
                  <th style={{ padding: '12px 8px' }}>Role</th>
                  <th style={{ padding: '12px 8px' }}>Last active</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: '15px 8px' }}>{s.email}</td>
                    <td style={{ padding: '15px 8px' }}>{s.role_display}</td>
                    <td style={{ padding: '15px 8px' }}>{s.last_active}</td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <span
                        onClick={() => navigate(`/admin/staff/${s.id}/edit`)}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        Edit
                      </span>
                      {' · '}
                      <span
                        onClick={() => setArchiveTarget(s)}
                        style={{ cursor: 'pointer', fontWeight: 700, color: '#6B8585' }}
                      >
                        …
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal
        open={!!archiveTarget}
        title={archiveTarget?.is_archived ? 'Restore Staff Member' : 'Archive Staff Member'}
        onClose={() => setArchiveTarget(null)}
      >
        <p style={{ fontSize: 14, color: '#3E5959', marginBottom: 20 }}>
          Are you sure you want to {archiveTarget?.is_archived ? 'restore' : 'archive'}{' '}
          <strong>{archiveTarget?.name}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="outline" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmArchive} style={{ backgroundColor: '#1E6E62' }}>
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 9. Add / Edit Staff Member Form Page (Page 14 of Admin.pdf)
 */
export function AdminStaffFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resorts, setResorts] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState('Receptionist');
  const [assignedResortId, setAssignedResortId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/resorts', { params: { per_page: 50 } }).then((res) => {
      setResorts(res.data.data || []);
    });
    if (isEdit) {
      api.get(`/admin/staff/${id}`).then((res) => {
        const d = res.data.data;
        setName(d.name || '');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setStaffId(d.staff_id || '');
        setRole(d.role ? d.role.charAt(0).toUpperCase() + d.role.slice(1) : 'Receptionist');
        setAssignedResortId(d.assigned_resort_id ? String(d.assigned_resort_id) : '');
        setEmploymentStatus(d.employment_status || 'Active');
        setStartDate(d.start_date || '');
        setUsername(d.username || '');
        setNotes(d.notes || '');
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        name,
        email,
        phone,
        staff_id: staffId,
        role: role.toLowerCase(),
        assigned_resort_id: assignedResortId ? Number(assignedResortId) : null,
        employment_status: employmentStatus,
        start_date: startDate || null,
        username,
        password: password || undefined,
        notes,
      };
      if (isEdit) {
        await api.put(`/admin/staff/${id}`, payload);
        showToast('Staff member updated successfully.');
      } else {
        await api.post('/admin/staff', payload);
        showToast('Staff member created successfully.');
      }
      navigate('/admin/staff');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Please check required staff fields.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cs-card" style={{ padding: '28px 30px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Staff information
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 20 }}>
        Enter staff details and choose the role they need in the admin system.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
        <FormInput
          label="Full name"
          required
          placeholder="e.g. Maria Santos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name?.[0]}
        />

        <FormInput
          label="Email address"
          required
          type="email"
          placeholder="e.g. maria@cordovastays.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email?.[0]}
        />

        <FormInput
          label="Phone number"
          required
          placeholder="e.g. +63 912 345 6789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone?.[0]}
        />

        <FormInput
          label="Staff ID"
          placeholder="e.g. CST-001"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        />

        <div className="cs-form-group">
          <label className="cs-label">Role *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="cs-input"
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Housekeeping">Housekeeping</option>
          </select>
        </div>

        <div className="cs-form-group">
          <label className="cs-label">Assigned resort</label>
          <select
            value={assignedResortId}
            onChange={(e) => setAssignedResortId(e.target.value)}
            className="cs-input"
          >
            <option value="">Select resort</option>
            {resorts.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="Employment status"
          placeholder="Active / Inactive"
          value={employmentStatus}
          onChange={(e) => setEmploymentStatus(e.target.value)}
        />

        <FormInput
          label="Start date"
          type="date"
          placeholder="MM/DD/YYYY"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <FormInput
          label="Username"
          required
          placeholder="Create a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username?.[0]}
        />

        <FormInput
          label="Temporary password"
          required={!isEdit}
          type="password"
          placeholder="Set initial password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password?.[0]}
        />
      </div>

      <FormInput
        label="Notes"
        placeholder="Optional responsibilities or internal notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ marginBottom: 24 }}
      />

      <div
        style={{
          borderTop: '1px solid #EDF3F2',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Button variant="outline" onClick={() => navigate('/admin/staff')}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} style={{ backgroundColor: '#1E6E62' }}>
          {saving ? 'Saving...' : 'Save Staff'}
        </Button>
      </div>
    </form>
  );
}
