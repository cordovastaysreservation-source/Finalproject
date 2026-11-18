import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { cachedGet } from '../../api/client';
import { Button, FloatingInput, FloatingSelect } from '../../components/UI';
import { ResortCard, RoomCard } from '../../components/CustomerCards';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import { useBookingFlow } from '../../context/BookingFlowContext';
import { formatSingleDate, formatCurrency } from '../../styles/tokens';

/**
 * 1. Customer Home Page (Page 49)
 */
export function HomePage() {
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();

  const [destination, setDestination] = useState('Cordova, Cebu');
  const [checkIn, setCheckIn] = useState(flow.checkIn || '');
  const [checkOut, setCheckOut] = useState(flow.checkOut || '');
  const [guests, setGuests] = useState(flow.guests || 2);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cachedGet('/resorts')
      .then((data) => {
        setResorts(data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const popularResorts = resorts.slice(0, 3);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFlow({
      checkIn: checkIn || '2026-10-20',
      checkOut: checkOut || '2026-10-22',
      guests: Number(guests),
      adults: Number(guests),
    });
    const params = new URLSearchParams();
    if (destination && destination.toLowerCase() !== 'cordova, cebu') {
      params.set('search', destination);
    }
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (guests) params.set('guests', String(guests));
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div>
      <h1 className="page-title">Home</h1>
      <p className="page-subtitle">Discover stays and plan your next getaway.</p>

      {/* Teal Hero Card */}
      <div
        style={{
          backgroundColor: '#0B6E75',
          borderRadius: 16,
          padding: '36px 36px 28px',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 32,
        }}
      >
        {/* Decorative Translucent Circle */}
        <div
          style={{
            position: 'absolute',
            top: -45,
            right: -35,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520, marginBottom: 26 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: 8,
            }}
          >
            YOUR NEXT GETAWAY STARTS HERE
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
            Find your perfect
            <br />
            Cordova resort.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' }}>
            Browse stays, compare rooms, and book with confidence.
          </p>
        </div>

        {/* Floating Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            position: 'relative',
            zIndex: 2,
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <FloatingInput
            label="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Cordova, Cebu"
          />
          <FloatingInput
            label="Check-in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <FloatingInput
            label="Check-out"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <FloatingSelect
            label="Guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            options={[
              { value: 1, label: '1 guest' },
              { value: 2, label: '2 guests' },
              { value: 3, label: '3 guests' },
              { value: 4, label: '4 guests' },
            ]}
          />
          <Button type="submit" style={{ height: 48 }}>
            Enjoy!
          </Button>
        </form>
      </div>

      {/* Popular Resorts Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40' }}>Popular resorts</h2>
        <Link
          to="/explore"
          style={{ fontSize: 13.5, fontWeight: 700, color: '#0A7F82' }}
        >
          View all resorts →
        </Link>
      </div>

      {loading ? (
        <div className="cs-card" style={{ textAlign: 'center', color: '#6B8585' }}>
          Loading resorts...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 20,
            marginBottom: 28,
          }}
        >
          {popularResorts.map((resort) => (
            <ResortCard
              key={resort.id}
              resort={resort}
              showViewLink={true}
              onClick={() => navigate(`/resorts/${resort.slug}`)}
            />
          ))}
        </div>
      )}

      {/* Why Book With Cordova Stays Feature Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A7F82', marginBottom: 4 }}>
            ✓ Verified Cordova Resorts
          </div>
          <p style={{ fontSize: 12.5, color: '#6B8585' }}>
            Compare 9 coastal and garden stays across Cordova, Cebu with transparent room rates.
          </p>
        </div>
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A7F82', marginBottom: 4 }}>
            ✓ Instant QR & Resort Checkout
          </div>
          <p style={{ fontSize: 12.5, color: '#6B8585' }}>
            Pay conveniently via GCash, Maya QR, or directly at the resort front desk upon arrival.
          </p>
        </div>
        <div className="cs-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A7F82', marginBottom: 4 }}>
            ✓ Bundle Foods & Drinks
          </div>
          <p style={{ fontSize: 12.5, color: '#6B8585' }}>
            Pre-order coastal seafood platters, native delicacies, and tropical refreshments for your trip.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Explore Resorts Page (Page 47)
 */
export function ExploreResortsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { flow, updateFlow } = useBookingFlow();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests') || flow.guests || 2));
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResorts = (paramsObj = {}) => {
    setLoading(true);
    cachedGet('/resorts', { params: paramsObj })
      .then((data) => {
        setResorts(data.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResorts({
      search: searchParams.get('search') || undefined,
      check_in: searchParams.get('check_in') || undefined,
      check_out: searchParams.get('check_out') || undefined,
      guests: searchParams.get('guests') || undefined,
    });
  }, [searchParams]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (checkIn) next.check_in = checkIn;
    if (checkOut) next.check_out = checkOut;
    if (guests) next.guests = String(guests);
    setSearchParams(next);
    updateFlow({
      checkIn: checkIn || flow.checkIn,
      checkOut: checkOut || flow.checkOut,
      guests: Number(guests),
      adults: Number(guests),
    });
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Explore Resorts
      </h1>

      {/* Search & Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="cs-card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <FloatingInput
          label="Search resorts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or location"
        />
        <FloatingInput
          label="Check-in"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <FloatingInput
          label="Check-out"
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
        />
        <FloatingSelect
          label="Guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          options={[
            { value: 1, label: '1 guest' },
            { value: 2, label: '2 guests' },
            { value: 3, label: '3 guests' },
            { value: 4, label: '4 guests' },
          ]}
        />
        <Button type="submit" style={{ height: 48, padding: '0 26px' }}>
          Enjoy!
        </Button>
      </form>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
        {resorts.length} {resorts.length === 1 ? 'resort' : 'resorts'} to explore
      </h2>

      {loading ? (
        <div className="cs-card" style={{ textAlign: 'center', color: '#6B8585' }}>
          Loading resorts...
        </div>
      ) : resorts.length === 0 ? (
        <div className="cs-card" style={{ textAlign: 'center', color: '#6B8585' }}>
          No resorts matched your search criteria.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 20,
          }}
        >
          {resorts.map((resort) => (
            <ResortCard
              key={resort.id}
              resort={resort}
              showViewLink={true}
              onClick={() => navigate(`/resorts/${resort.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 3. Resort Details Page (Pages 52, 59, 65, 68, 72, 75, 78, 81, 84)
 */
export function ResortDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();

  const [resort, setResort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(flow.checkIn || '2026-10-20');
  const [checkOut, setCheckOut] = useState(flow.checkOut || '2026-10-22');
  const [guests, setGuests] = useState(flow.guests || 2);

  useEffect(() => {
    setLoading(true);
    cachedGet(`/resorts/${slug}`)
      .then((data) => {
        setResort(data.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="cs-card">Loading resort details...</div>;
  }

  if (!resort) {
    return <div className="cs-card">Resort not found.</div>;
  }

  const galleryFallbackPhotos = {
    2: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    3: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    4: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    5: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
  };

  const handleViewRooms = (e) => {
    e.preventDefault();
    updateFlow({
      flowType: 'room',
      resortId: resort.id,
      resortSlug: resort.slug,
      resortName: resort.name,
      resortQr: resort.qr_image || '/images/resorts/qr-code.jpg',
      checkIn,
      checkOut,
      guests: Number(guests),
      adults: Number(guests),
    });
    navigate(`/resorts/${resort.slug}/rooms?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  const handleQuickBookRoom = (room) => {
    updateFlow({
      flowType: 'room',
      resortId: resort.id,
      resortSlug: resort.slug,
      resortName: resort.name,
      resortQr: resort.qr_image || '/images/resorts/qr-code.jpg',
      roomId: room.id,
      roomName: room.name,
      pricePerNight: room.price_per_night,
      checkIn,
      checkOut,
      guests: Number(guests),
      adults: Number(guests),
    });
    navigate('/booking/details');
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        {resort.name}
      </h1>

      {/* 5-Photo Gallery with Real Resort & Room Photos */}
      <div
        className="cs-card"
        style={{
          padding: 16,
          marginBottom: 22,
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 12,
        }}
      >
        <ImagePlaceholder
          src={resort.cover_image}
          label={resort.name.toUpperCase()}
          height="256px"
          borderRadius="10px"
          showCaptionOverlay
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 12,
          }}
        >
          {[2, 3, 4, 5].map((num) => {
            const galleryItem = resort.gallery?.find((g) => g.sort_order === num);
            return (
              <ImagePlaceholder
                key={num}
                src={galleryItem?.image_path || galleryFallbackPhotos[num]}
                label={`PHOTO ${num}`}
                height="122px"
                borderRadius="10px"
              />
            );
          })}
        </div>
      </div>

      {/* Main Content + Right "Plan your stay" Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div className="cs-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            {resort.name}
          </h2>
          <div style={{ fontSize: 13, color: '#6B8585', marginBottom: 14 }}>
            {resort.location} • Resort stay
            {resort.contact_number && ` • ${resort.contact_number}`}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
            About this resort
          </h3>
          <p style={{ fontSize: 13.5, color: '#3E5959', marginBottom: 6 }}>
            {resort.description}
          </p>
          <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 20 }}>
            Review room options, amenities, and policies before booking.
          </p>

          <div
            style={{
              border: '1px solid #E2ECEA',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F3F40', marginBottom: 12 }}>
              Amenities
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 16px',
              }}
            >
              {(resort.amenities?.length
                ? resort.amenities
                : ['Pool', 'Wi-Fi', 'Parking', 'Family-friendly options']
              ).map((amenity) => (
                <div
                  key={amenity}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#0F3F40',
                  }}
                >
                  <span style={{ color: '#0A7F82', fontWeight: 700 }}>✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Plan your stay card */}
        <form onSubmit={handleViewRooms} className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
            Plan your stay
          </h3>

          <FloatingInput
            label="Check-in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <FloatingInput
            label="Check-out"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <FloatingSelect
            label="Guests"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            options={[
              { value: 1, label: '1 guest' },
              { value: 2, label: '2 guests' },
              { value: 3, label: '3 guests' },
              { value: 4, label: '4 guests' },
            ]}
          />

          <Button type="submit" fullWidth style={{ marginTop: 6, height: 44 }}>
            View Available Rooms
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate(`/foods-drinks/${resort.slug}`)}
          >
            Order Resort Foods & Drinks
          </Button>
        </form>
      </div>

      {/* Room Types Preview Section */}
      {resort.rooms && resort.rooms.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
            Room Options at {resort.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
            {resort.rooms.map((rm) => (
              <div key={rm.id} className="cs-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ImagePlaceholder
                  src={rm.image}
                  label={rm.placeholder_label || rm.name.toUpperCase()}
                  height="135px"
                  borderRadius="10px"
                />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F3F40' }}>{rm.name}</div>
                <div style={{ fontSize: 12.5, color: '#6B8585' }}>
                  {rm.bed_configuration} • Up to {rm.capacity} guests
                </div>
                <div style={{ fontSize: 12.5, color: '#3E5959', flex: 1 }}>{rm.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0A7F82' }}>
                    {formatCurrency(rm.price_per_night)} <small style={{ fontWeight: 500, color: '#6B8585' }}>/ night</small>
                  </span>
                  <Button onClick={() => handleQuickBookRoom(rm)} style={{ padding: '8px 14px', fontSize: 12.5 }}>
                    Book Room
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Guest Reviews Section */}
      {resort.reviews && resort.reviews.length > 0 && (
        <div className="cs-card" style={{ marginTop: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
            Guest Reviews ({resort.reviews.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {resort.reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  border: '1px solid #E2ECEA',
                  borderRadius: 10,
                  padding: '14px 16px',
                  background: '#F9FCFB',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0F3F40' }}>
                    {rev.guest_name}
                  </span>
                  <span style={{ color: '#0A7F82', fontSize: 13, letterSpacing: 1 }}>
                    {'★'.repeat(rev.rating || 5)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#3E5959', marginBottom: 6 }}>“{rev.comment}”</p>
                {rev.date && <div style={{ fontSize: 11.5, color: '#6B8585' }}>{rev.date}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. Available Rooms Page (Pages 51, 58, 64, 67, 71, 74, 77, 80, 83)
 */
export function AvailableRoomsPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();

  const checkIn = searchParams.get('check_in') || flow.checkIn || '2026-10-20';
  const checkOut = searchParams.get('check_out') || flow.checkOut || '2026-10-22';
  const guests = Number(searchParams.get('guests') || flow.guests || 2);

  const [resort, setResort] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cachedGet(`/resorts/${slug}/available-rooms`, {
      params: { check_in: checkIn, check_out: checkOut, guests },
    })
      .then((data) => {
        setResort(data.resort);
        setRooms(data.data || []);
      })
      .finally(() => setLoading(false));
  }, [slug, checkIn, checkOut, guests]);

  const handleChooseRoom = (room) => {
    updateFlow({
      flowType: 'room',
      resortId: resort.id,
      resortSlug: resort.slug,
      resortName: resort.name,
      resortQr: resort.qr_image || '/images/resorts/qr-code.jpg',
      roomId: room.id,
      roomName: room.name,
      pricePerNight: room.price_per_night,
      checkIn,
      checkOut,
      guests,
      adults: guests,
      children: 0,
    });
    navigate('/booking/details');
  };

  if (loading) {
    return <div className="cs-card">Loading available rooms...</div>;
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 18 }}>
        Available Rooms
      </h1>

      {/* Top Resort & Dates Summary Bar */}
      <div
        className="cs-card"
        style={{
          padding: '16px 22px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40' }}>
            {resort?.name}
          </div>
          <div style={{ fontSize: 13, color: '#6B8585' }}>
            Check-in: {formatSingleDate(checkIn)} &nbsp; Check-out: {formatSingleDate(checkOut)} • {guests}{' '}
            {guests === 1 ? 'guest' : 'guests'}
          </div>
        </div>

        <Link
          to={`/resorts/${slug}`}
          style={{ fontSize: 13, fontWeight: 700, color: '#0A7F82' }}
        >
          Change search →
        </Link>
      </div>

      {/* Room Cards List */}
      {rooms.length === 0 ? (
        <div className="cs-card" style={{ textAlign: 'center', color: '#6B8585' }}>
          No rooms are available for the selected dates and guest count. Try changing your search dates.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              scenicPlaceholder={['eventesia-garden', 'villa-asela'].includes(resort?.slug)}
              onChoose={handleChooseRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
