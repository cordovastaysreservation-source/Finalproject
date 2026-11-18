import React from 'react';
import ImagePlaceholder from './ImagePlaceholder';
import { Button, StatusBadge } from './UI';
import { formatCurrency } from '../styles/tokens';

/**
 * Resort card used on Home (Popular resorts), Explore Resorts, and Foods and Drinks main page.
 */
export function ResortCard({ resort, showViewLink = true, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #DCE7E5',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ImagePlaceholder
        src={resort.cover_image}
        label={resort.name?.toUpperCase()}
        height="148px"
        borderRadius="0px"
      />
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            {resort.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B8585', lineHeight: 1.3 }}>
            Cordova,
            <br />
            Cebu
          </div>
          {resort.description && (
            <div style={{ fontSize: 12, color: '#5A7175', marginTop: 4 }}>
              {resort.description}
            </div>
          )}
        </div>
        {showViewLink && (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: '#0A7F82',
              whiteSpace: 'nowrap',
            }}
          >
            View →
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Room card used on Available Rooms page.
 */
export function RoomCard({ room, onChoose, scenicPlaceholder = false }) {
  return (
    <div
      className="cs-card cs-room-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '18px 22px',
        flexWrap: 'wrap',
      }}
    >
      <div className="cs-room-card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: '1 1 320px' }}>
        <ImagePlaceholder
          src={room.image}
          label={room.placeholder_label || room.name?.toUpperCase()}
          width="185px"
          height="120px"
          borderRadius="10px"
          variant={scenicPlaceholder ? 'scenic' : 'flat'}
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
            {room.name}
          </h3>
          <div style={{ fontSize: 13, color: '#6B8585', marginBottom: 6 }}>
            {room.bed_configuration} • Up to {room.capacity} guests
          </div>
          <div style={{ fontSize: 13, color: '#6B8585', marginBottom: 8 }}>{room.description}</div>
          {room.amenities && room.amenities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {room.amenities.slice(0, 4).map((am) => (
                <span
                  key={am}
                  style={{
                    fontSize: 11,
                    background: '#EEF8F6',
                    color: '#0A7F82',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  ✓ {am}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cs-room-card-price" style={{ textAlign: 'right', minWidth: 185 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F3F40' }}>
          {formatCurrency(room.price_per_night)} / night
        </div>
        <div style={{ fontSize: 11.5, color: '#6B8585', marginBottom: 10 }}>
          Sample price — confirm with resort
        </div>
        <Button onClick={() => onChoose(room)} style={{ width: '100%' }}>
          Choose Room
        </Button>
      </div>
    </div>
  );
}

/**
 * Booking card used on My Bookings page.
 */
export function BookingCard({ booking, onViewDetails }) {
  return (
    <div
      className="cs-card cs-booking-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '18px 22px',
        flexWrap: 'wrap',
      }}
    >
      <div className="cs-booking-card-body" style={{ display: 'flex', alignItems: 'center', gap: 18, flex: '1 1 280px' }}>
        <ImagePlaceholder
          src={booking.resort_cover || '/images/resorts/eventesia-garden.jpg'}
          label="RESORT PHOTO"
          width="124px"
          height="94px"
          borderRadius="10px"
          variant="flat"
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0A7F82', marginBottom: 2 }}>
            Ref: {booking.reference || 'CS-2026-00125'}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 2 }}>
            {booking.resort_name}
          </h3>
          <div style={{ fontSize: 13, color: '#6B8585', marginBottom: 2 }}>
            {booking.room_name} • {booking.guests || 2} guests
          </div>
          <div style={{ fontSize: 12.5, color: '#6B8585', marginBottom: 8 }}>
            {booking.dates_label || '20 Oct – 22 Oct 2026'}
          </div>
          <StatusBadge status={booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'} />
        </div>
      </div>

      <div className="cs-booking-card-price" style={{ textAlign: 'right', minWidth: 140 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F3F40' }}>
          {formatCurrency(booking.total)}
        </div>
        <div style={{ fontSize: 11.5, color: '#6B8585', marginBottom: 10 }}>Sample total</div>
        <Button onClick={() => onViewDetails(booking)} style={{ padding: '9px 18px', fontSize: 13, width: '100%' }}>
          View Details
        </Button>
      </div>
    </div>
  );
}
