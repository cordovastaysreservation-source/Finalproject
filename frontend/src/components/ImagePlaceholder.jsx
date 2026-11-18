import React, { useState } from 'react';
import { resolveImageUrl } from '../api/client';

// Built-in smart image mapping so every room, gallery slot, and food/drink tile shows a real photo
const DEFAULT_LABEL_PHOTOS = {
  'STANDARD ROOM': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=700&q=80',
  'DELUXE POOL VIEW': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80',
  'POOL VIEW': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80',
  'FAMILY ROOM': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=700&q=80',
  'PHOTO 2': '/images/resorts/solea-resort.jpg',
  'PHOTO 3': '/images/resorts/casa-ragina.jpg',
  'PHOTO 4': '/images/resorts/alta-resort.jpg',
  'PHOTO 5': '/images/resorts/flores-villa.jpg',
  'RESORT PHOTO': '/images/resorts/eventesia-garden.jpg',
  'BUNDLE FOODS AND DRINKS': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
  'FOODS': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80',
  'DRINKS': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80',
};

export default function ImagePlaceholder({
  src,
  label = 'PHOTO',
  height = '180px',
  width = '100%',
  borderRadius = '12px',
  variant = 'scenic',
  showCaptionOverlay = false,
  onClick,
  style = {},
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const upperLabel = String(label || '').toUpperCase().trim();
  const fallbackPhoto = DEFAULT_LABEL_PHOTOS[upperLabel] || null;
  const resolvedSrc = resolveImageUrl(src) || fallbackPhoto;

  if (resolvedSrc && !imgError) {
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          width,
          height,
          borderRadius,
          overflow: 'hidden',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          backgroundColor: '#CBECE5',
          ...style,
        }}
      >
        <img
          src={resolvedSrc}
          alt={label}
          decoding="async"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.25s ease',
          }}
        />
        {showCaptionOverlay && label && (
          <div
            style={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              background: 'linear-gradient(to top, rgba(15, 63, 64, 0.82), rgba(15, 63, 64, 0))',
              color: '#FFFFFF',
              padding: '22px 14px 10px',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: variant === 'flat' ? '#CBECE5' : '#B5E3DA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {variant === 'scenic' && (
        <svg
          viewBox="0 0 400 220"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <circle cx="325" cy="52" r="24" fill="#FDF0B6" opacity="0.95" />
          <path
            d="M0,145 Q105,78 220,140 T400,118 L400,220 L0,220 Z"
            fill="#67B7A8"
            opacity="0.88"
          />
          <path
            d="M0,172 Q150,120 290,165 T400,150 L400,220 L0,220 Z"
            fill="#57A899"
            opacity="0.55"
          />
        </svg>
      )}

      <span
        style={{
          position: 'relative',
          zIndex: 2,
          color: '#0F3F40',
          fontWeight: 700,
          fontSize: variant === 'scenic' ? '13px' : '12px',
          letterSpacing: '0.03em',
          textAlign: 'center',
          padding: '6px 12px',
          marginTop: variant === 'scenic' ? '44px' : '0',
        }}
      >
        {label}
      </span>
    </div>
  );
}
