import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import {
  Button,
  FormInput,
  StatusBadge,
  SearchAndFilterBar,
  Modal,
  Pagination,
} from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../styles/tokens';

/**
 * 1. Resort Management List Page (Page 7 of Admin.pdf)
 */
export function AdminResortsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resorts, setResorts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const loadResorts = () => {
    setLoading(true);
    api
      .get('/admin/resorts', { params: { search, filter, page } })
      .then((res) => {
        setResorts(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResorts();
  }, [search, filter, page]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await api.delete(`/admin/resorts/${archiveTarget.id}`);
      showToast(res.data.message);
      setArchiveTarget(null);
      loadResorts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
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
            onClick={() => navigate('/admin/resorts/new')}
            style={{ backgroundColor: '#1E6E62' }}
          >
            + Add Resort
          </Button>
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading resorts...
          </div>
        ) : resorts.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            No resort records found.
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
                  <th style={{ padding: '12px 8px' }}>Resort name</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Rooms</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Last updated</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resorts.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '16px 8px' }}>
                      Cordova,
                      <br />
                      Cebu
                    </td>
                    <td style={{ padding: '16px 8px' }}>{r.rooms_count}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '16px 8px' }}>{r.last_updated}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span
                        onClick={() => navigate(`/admin/resorts/${r.id}/edit`)}
                        style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                      >
                        Edit
                      </span>
                      {' · '}
                      <span
                        onClick={() => setArchiveTarget(r)}
                        title={r.is_archived ? 'Restore resort' : 'Archive resort'}
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
        title={archiveTarget?.is_archived ? 'Restore Resort' : 'Archive Resort'}
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
 * 2. Add / Edit Resort Form Page (Page 6 of Admin.pdf)
 */
export function AdminResortFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [status, setStatus] = useState('Active');
  const [location, setLocation] = useState('Cordova, Cebu');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('Pool, Wi-Fi, Parking, Family-friendly options');
  const [coverFile, setCoverFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/resorts/${id}`).then((res) => {
        const d = res.data.data;
        setName(d.name || '');
        setStatus(d.raw_status === 'draft' ? 'Draft' : 'Active');
        setLocation(d.location || 'Cordova, Cebu');
        setAddress(d.address || '');
        setContactNumber(d.contact_number || '');
        setEmail(d.email || '');
        setDescription(d.description || '');
        setAmenities(d.amenities_text || 'Pool, Wi-Fi, Parking, Family-friendly options');
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('status', status);
      formData.append('location', location);
      formData.append('address', address);
      formData.append('contact_number', contactNumber);
      formData.append('email', email);
      formData.append('description', description);
      formData.append('amenities', amenities);
      if (coverFile) formData.append('cover_image', coverFile);

      if (isEdit) {
        await api.post(`/admin/resorts/${id}`, formData);
        showToast('Resort updated successfully.');
      } else {
        await api.post('/admin/resorts', formData);
        showToast('Resort created successfully.');
      }
      navigate('/admin/resorts');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Please check required fields.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 14 }}>
        Resorts /{' '}
        <span style={{ color: '#1E6E62', fontWeight: 700 }}>
          {isEdit ? 'Edit resort' : 'Add resort'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="cs-card" style={{ padding: '28px 30px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
          Resort information
        </h2>
        <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 20 }}>
          Fields marked with * are required.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
          <FormInput
            label="Resort name"
            required
            placeholder="Enter resort name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name?.[0]}
          />

          <div className="cs-form-group">
            <label className="cs-label">Resort status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cs-input"
            >
              <option value="Active">Active</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <FormInput
            label="Province / City"
            required
            placeholder="Enter city or municipality"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            error={errors.location?.[0]}
          />

          <FormInput
            label="Full address"
            required
            placeholder="Street, barangay, and address details"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={errors.address?.[0]}
          />

          <FormInput
            label="Contact number"
            placeholder="e.g. +63 9XX XXX XXXX"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />

          <FormInput
            label="Email address"
            type="email"
            placeholder="resort@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="cs-form-group" style={{ marginBottom: 16 }}>
          <label className="cs-label">Resort description</label>
          <textarea
            rows={4}
            placeholder="Describe the resort, its facilities, and what makes it special..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="cs-input"
            style={{ resize: 'vertical' }}
          />
        </div>

        <FormInput
          label="Amenities"
          placeholder="e.g. Swimming pool, Wi-Fi, restaurant, beach access"
          value={amenities}
          onChange={(e) => setAmenities(e.target.value)}
          style={{ marginBottom: 18 }}
        />

        <div className="cs-form-group" style={{ marginBottom: 24 }}>
          <label className="cs-label">Resort cover image</label>
          <label
            style={{
              border: '1.5px dashed #B8D4D0',
              borderRadius: 10,
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: '#DDF3EC',
                color: '#0A7F82',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              ↑
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F3F40' }}>
                {coverFile ? coverFile.name : 'Upload resort photo'}
              </div>
              <div style={{ fontSize: 12, color: '#6B8585' }}>
                PNG or JPG · Recommended: 1200 × 800 px
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button variant="outline" onClick={() => navigate('/admin/resorts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} style={{ backgroundColor: '#1E6E62' }}>
            {saving ? 'Saving...' : 'Save Resort'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * 3. Room Management List Page (Page 4 of Admin.pdf)
 */
export function AdminRoomsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { adminUser } = useAuth();
  const isReadOnly = adminUser?.role === 'housekeeping';

  const [rooms, setRooms] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const loadRooms = () => {
    setLoading(true);
    api
      .get('/admin/rooms', { params: { search, filter, page } })
      .then((res) => {
        setRooms(res.data.data || []);
        setMeta(res.data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
  }, [search, filter, page]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await api.delete(`/admin/rooms/${archiveTarget.id}`);
      showToast(res.data.message);
      setArchiveTarget(null);
      loadRooms();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
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
          !isReadOnly ? (
            <Button
              onClick={() => navigate('/admin/rooms/new')}
              style={{ backgroundColor: '#1E6E62' }}
            >
              + Add Room
            </Button>
          ) : null
        }
      />

      <div className="cs-card" style={{ padding: '16px 22px' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#6B8585' }}>
            No room records found.
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
                  <th style={{ padding: '12px 8px' }}>Room type</th>
                  <th style={{ padding: '12px 8px' }}>Resort</th>
                  <th style={{ padding: '12px 8px' }}>Capacity</th>
                  <th style={{ padding: '12px 8px' }}>Rate / night</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((rm) => (
                  <tr key={rm.id} style={{ borderBottom: '1px solid #F0F5F4' }}>
                    <td style={{ padding: '15px 8px', fontWeight: 500 }}>{rm.name}</td>
                    <td style={{ padding: '15px 8px' }}>{rm.resort_name}</td>
                    <td style={{ padding: '15px 8px' }}>{rm.capacity} guests</td>
                    <td style={{ padding: '15px 8px', fontWeight: 600 }}>
                      {formatCurrency(rm.price_per_night)}
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      <StatusBadge status={rm.status} />
                    </td>
                    <td style={{ padding: '15px 8px' }}>
                      {isReadOnly ? (
                        <span style={{ color: '#6B8585', fontSize: 12.5 }}>Read-only</span>
                      ) : (
                        <>
                          <span
                            onClick={() => navigate(`/admin/rooms/${rm.id}/edit`)}
                            style={{ cursor: 'pointer', fontWeight: 600, color: '#0F3F40' }}
                          >
                            Edit
                          </span>
                          {' · '}
                          <span
                            onClick={() => setArchiveTarget(rm)}
                            title={rm.is_archived ? 'Restore room' : 'Archive room'}
                            style={{ cursor: 'pointer', fontWeight: 700, color: '#6B8585' }}
                          >
                            …
                          </span>
                        </>
                      )}
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
        title={archiveTarget?.is_archived ? 'Restore Room' : 'Archive Room'}
        onClose={() => setArchiveTarget(null)}
      >
        <p style={{ fontSize: 14, color: '#3E5959', marginBottom: 20 }}>
          Are you sure you want to {archiveTarget?.is_archived ? 'restore' : 'archive'}{' '}
          <strong>
            {archiveTarget?.name} ({archiveTarget?.room_code})
          </strong>
          ?
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
 * 4. Add New Room Form Page (Page 3 of Admin.pdf)
 */
export function AdminAddRoomPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resorts, setResorts] = useState([]);
  const [resortId, setResortId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Standard Room');
  const [roomNumber, setRoomNumber] = useState('');
  const [status, setStatus] = useState('Available');
  const [bedConfig, setBedConfig] = useState('1 Queen Bed');
  const [capacity, setCapacity] = useState(2);
  const [pricePerNight, setPricePerNight] = useState('');
  const [sizeSqm, setSizeSqm] = useState(32);
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState(['Wi-Fi', 'Air conditioning', 'TV', 'Private bathroom']);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const amenityOptions = [
    'Wi-Fi',
    'Air conditioning',
    'TV',
    'Private bathroom',
    'Balcony',
    'Mini bar',
    'Ocean view',
    'Breakfast included',
  ];

  useEffect(() => {
    api.get('/admin/resorts', { params: { per_page: 50 } }).then((res) => {
      const list = res.data.data || [];
      setResorts(list);
      if (list[0]) setResortId(String(list[0].id));
    });
  }, []);

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('resort_id', resortId);
      formData.append('name', name);
      formData.append('type', type);
      formData.append('room_number', roomNumber);
      formData.append('status', status);
      formData.append('bed_configuration', bedConfig);
      formData.append('capacity', capacity);
      formData.append('price_per_night', pricePerNight);
      formData.append('size_sqm', sizeSqm);
      formData.append('floor', floor);
      formData.append('description', description);
      formData.append('amenities', JSON.stringify(selectedAmenities));
      photoFiles.forEach((f) => formData.append('photos[]', f));

      await api.post('/admin/rooms', formData);
      showToast('Room created successfully.');
      navigate('/admin/rooms');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Please check required room fields.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cs-card" style={{ padding: '28px 30px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Room information
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 20 }}>
        Fill in the details guests will see when booking this room.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="cs-form-group">
            <label className="cs-label">Resort *</label>
            <select
              value={resortId}
              onChange={(e) => setResortId(e.target.value)}
              className="cs-input"
              required
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
            label="Room name"
            required
            placeholder="e.g. Deluxe Ocean View"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name?.[0]}
          />

          <div className="cs-form-group">
            <label className="cs-label">Room type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="cs-input"
            >
              <option value="Standard Room">Standard Room</option>
              <option value="Deluxe Pool View">Deluxe Pool View</option>
              <option value="Family Room">Family Room</option>
              <option value="Deluxe Room">Deluxe Room</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput
              label="Room number / code"
              required
              placeholder="e.g. A-101"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              error={errors.room_number?.[0]}
            />
            <div className="cs-form-group">
              <label className="cs-label">Availability status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="cs-input"
              >
                <option value="Available">Available</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="cs-form-group">
              <label className="cs-label">Bed configuration</label>
              <select
                value={bedConfig}
                onChange={(e) => setBedConfig(e.target.value)}
                className="cs-input"
              >
                <option value="1 Queen Bed">1 Queen Bed</option>
                <option value="1 King Bed">1 King Bed</option>
                <option value="2 Beds">2 Beds</option>
              </select>
            </div>
            <FormInput
              label="Guest capacity"
              required
              type="number"
              placeholder="Number of guests"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              error={errors.capacity?.[0]}
            />
          </div>

          <div className="cs-form-group">
            <label className="cs-label">Room description</label>
            <textarea
              rows={4}
              placeholder="Describe the room, view, and included features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="cs-input"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormInput
            label="Price per night (₱)"
            required
            type="number"
            placeholder="0.00"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            error={errors.price_per_night?.[0]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput
              label="Room size (sqm)"
              type="number"
              placeholder="e.g. 32"
              value={sizeSqm}
              onChange={(e) => setSizeSqm(e.target.value)}
            />
            <FormInput
              label="Floor / building"
              placeholder="Optional"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>

          <div className="cs-form-group">
            <label className="cs-label">Amenities</label>
            <div
              style={{
                border: '1px solid #CFE0DD',
                borderRadius: 8,
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px 8px',
              }}
            >
              {amenityOptions.map((item) => (
                <label
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    color: '#0F3F40',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                    style={{ accentColor: '#1E6E62' }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="cs-form-group">
            <label className="cs-label">Room photos</label>
            <label
              style={{
                border: '1.5px dashed #B8D4D0',
                borderRadius: 10,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 24, color: '#1E6E62' }}>🖼</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E6E62' }}>
                {photoFiles.length > 0
                  ? `${photoFiles.length} photo(s) selected`
                  : 'Upload room photos'}
              </div>
              <div style={{ fontSize: 12, color: '#6B8585' }}>
                PNG or JPG · Multiple images supported
              </div>
              <div style={{ fontSize: 11.5, color: '#6B8585' }}>
                Recommended: landscape photos
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #EDF3F2',
          marginTop: 24,
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
        }}
      >
        <Button variant="outline" onClick={() => navigate('/admin/rooms')}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} style={{ backgroundColor: '#1E6E62' }}>
          {saving ? 'Saving...' : 'Save Room'}
        </Button>
      </div>
    </form>
  );
}

/**
 * 5. Edit Room Form Page (Page 1 of Admin.pdf)
 */
export function AdminEditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [resorts, setResorts] = useState([]);
  const [roomCode, setRoomCode] = useState('ROOM-001');
  const [name, setName] = useState('Deluxe Room');
  const [resortId, setResortId] = useState('');
  const [roomNumber, setRoomNumber] = useState('D-101');
  const [capacity, setCapacity] = useState(2);
  const [bedConfig, setBedConfig] = useState('1 King Bed');
  const [pricePerNight, setPricePerNight] = useState(3500);
  const [sizeSqm, setSizeSqm] = useState(32);
  const [status, setStatus] = useState('Active / Available');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState(['Wi-Fi', 'Air Conditioning', 'TV', 'Private Bathroom']);
  const [lastUpdated, setLastUpdated] = useState('Oct 18, 2026');
  const [saving, setSaving] = useState(false);

  const editAmenityList = ['Wi-Fi', 'Air Conditioning', 'TV', 'Private Bathroom', 'Mini Fridge'];

  useEffect(() => {
    api.get('/admin/resorts', { params: { per_page: 50 } }).then((res) => {
      setResorts(res.data.data || []);
    });
    api.get(`/admin/rooms/${id}`).then((res) => {
      const d = res.data.data;
      setRoomCode(d.room_code || 'ROOM-001');
      setName(d.name || 'Deluxe Room');
      setResortId(String(d.resort_id));
      setRoomNumber(d.room_number || 'D-101');
      setCapacity(d.capacity || 2);
      setBedConfig(d.bed_configuration || '1 King Bed');
      setPricePerNight(d.price_per_night || 3500);
      setSizeSqm(d.size_sqm || 32);
      setStatus(d.raw_status === 'active' ? 'Active / Available' : 'Inactive');
      setDescription(d.description || '');
      if (d.amenities?.length) setAmenities(d.amenities);
      setLastUpdated(d.last_updated || 'Oct 18, 2026');
    });
  }, [id]);

  const toggleAmenity = (item) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/rooms/${id}`, {
        resort_id: resortId,
        name,
        type: name,
        room_number: roomNumber,
        capacity,
        bed_configuration: bedConfig,
        price_per_night: pricePerNight,
        size_sqm: sizeSqm,
        status,
        description,
        amenities,
      });
      showToast('Room updated successfully.');
      navigate('/admin/rooms');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update room.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Room Details
      </h2>
      <p style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 18 }}>
        Edit the selected room record. Fields marked * are required.
      </p>

      <form onSubmit={handleUpdate} className="cs-card" style={{ padding: '26px 28px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 18 }}>
          Basic Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          <FormInput
            label="Room ID"
            value={`${roomCode} (read-only)`}
            readOnly
          />

          <FormInput
            label="Room Type / Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="cs-form-group">
            <label className="cs-label">Resort *</label>
            <select
              value={resortId}
              onChange={(e) => setResortId(e.target.value)}
              className="cs-input"
            >
              {resorts.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Room Number / Code"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />

          <div className="cs-form-group">
            <label className="cs-label">Maximum Guest Capacity *</label>
            <select
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="cs-input"
            >
              <option value={2}>2 guests</option>
              <option value={4}>4 guests</option>
              <option value={6}>6 guests</option>
            </select>
          </div>

          <div className="cs-form-group">
            <label className="cs-label">Bed Configuration *</label>
            <select
              value={bedConfig}
              onChange={(e) => setBedConfig(e.target.value)}
              className="cs-input"
            >
              <option value="1 King Bed">1 King Bed</option>
              <option value="1 Queen Bed">1 Queen Bed</option>
              <option value="2 Beds">2 Beds</option>
            </select>
          </div>

          <FormInput
            label="Price per Night (₱)"
            required
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
          />

          <FormInput
            label="Room Size (m²)"
            type="number"
            value={sizeSqm}
            onChange={(e) => setSizeSqm(e.target.value)}
          />

          <div className="cs-form-group">
            <label className="cs-label">Availability Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="cs-input"
            >
              <option value="Active / Available">Active / Available</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="cs-form-group">
            <label className="cs-label">Room Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="cs-input"
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F3F40', marginBottom: 12 }}>
          Amenities
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginBottom: 18 }}>
          {editAmenityList.map((item) => (
            <label
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#0F3F40',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={amenities.some((a) => a.toLowerCase() === item.toLowerCase())}
                onChange={() => toggleAmenity(item)}
                style={{ width: 16, height: 16, accentColor: '#1E6E62' }}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#6B8585', marginBottom: 18 }}>
          Last updated: {lastUpdated} · Sample record
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button variant="outline" onClick={() => navigate('/admin/rooms')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} style={{ backgroundColor: '#1E6E62' }}>
            {saving ? 'Updating...' : 'Save / Update Room'}
          </Button>
        </div>
      </form>
    </div>
  );
}
