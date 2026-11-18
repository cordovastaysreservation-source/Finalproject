import React, { useState } from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'outline'
  pill = false,
  type = 'button',
  disabled = false,
  fullWidth = false,
  onClick,
  style = {},
}) {
  const cls = [
    'cs-btn',
    variant === 'outline' ? 'cs-btn-outline' : 'cs-btn-primary',
    pill ? 'cs-btn-pill' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cls}
      style={{
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Input with floating small label inside top of border (used in Search bars & Booking Details).
 */
export function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  min,
  readOnly = false,
  error,
  style = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, ...style }}>
      <div className="cs-floating-field" style={readOnly ? { backgroundColor: '#F8FAFA' } : {}}>
        {label && <span className="cs-floating-label">{label}</span>}
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          readOnly={readOnly}
          className="cs-floating-input"
        />
      </div>
      {error && <span className="cs-field-error">{error}</span>}
    </div>
  );
}

export function FloatingSelect({ label, value, onChange, options = [], error, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, ...style }}>
      <div className="cs-floating-field">
        {label && <span className="cs-floating-label">{label}</span>}
        <select
          value={value ?? ''}
          onChange={onChange}
          className="cs-floating-input"
          style={{ cursor: 'pointer' }}
        >
          {options.map((opt) =>
            typeof opt === 'object' ? (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
      </div>
      {error && <span className="cs-field-error">{error}</span>}
    </div>
  );
}

/**
 * Standard form input with label above and optional Password "Show" toggle.
 */
export function FormInput({
  label,
  required = false,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly = false,
  showToggle = false,
  leftIcon = null,
  error,
  style = {},
  ...rest
}) {
  const [revealed, setRevealed] = useState(false);
  const actualType = showToggle ? (revealed ? 'text' : 'password') : type;

  return (
    <div className="cs-form-group" style={style}>
      {label && (
        <label className="cs-label">
          {label} {required && <span style={{ color: '#0F3F40' }}>*</span>}
        </label>
      )}
      <div className="cs-input-wrap">
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              color: '#8DA3A3',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {leftIcon}
          </span>
        )}
        <input
          type={actualType}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="cs-input"
          style={{
            paddingLeft: leftIcon ? 36 : 14,
            paddingRight: showToggle ? 56 : 14,
          }}
          {...rest}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            style={{
              position: 'absolute',
              right: 12,
              background: 'none',
              border: 'none',
              color: '#6B8585',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <span className="cs-field-error">{error}</span>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || 'Pending').toLowerCase();
  let cls = 'cs-badge cs-badge-warning';

  if (['confirmed', 'completed', 'paid', 'active', 'published'].includes(s)) {
    cls = 'cs-badge cs-badge-success';
  } else if (['cancelled', 'refunded', 'inactive', 'archived', 'hidden'].includes(s)) {
    cls = 'cs-badge cs-badge-danger';
  }

  return <span className={cls}>{status}</span>;
}

export function SearchAndFilterBar({
  search,
  onSearchChange,
  filter = 'all',
  onFilterChange,
  placeholder = 'Search by name, ID, or status',
  actionButton = null,
}) {
  const chips = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 380px',
            maxWidth: 640,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B8585',
              fontSize: 14,
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="cs-input"
            style={{ paddingLeft: 36, height: 44, borderRadius: 10 }}
          />
        </div>
        {actionButton}
      </div>

      {onFilterChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {chips.map((c) => {
            const isActive = filter === c.key;
            let bg = '#EFEFEF';
            let color = '#334155';
            if (c.key === 'all' && isActive) {
              bg = '#DDF3EC';
              color = '#0A7F82';
            } else if (c.key === 'active' && isActive) {
              bg = '#DCEBFA';
              color = '#1D5B9E';
            } else if (c.key === 'archived' && isActive) {
              bg = '#E5E3DF';
              color = '#334155';
            } else if (c.key === 'all') {
              bg = '#E6F5F0';
              color = '#0F6E75';
            } else if (c.key === 'active') {
              bg = '#EBF2FA';
              color = '#1E4E8C';
            } else {
              bg = '#EFECE8';
              color = '#475569';
            }

            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onFilterChange(c.key)}
                style={{
                  border: isActive ? '1.5px solid #0A7F82' : '1px solid transparent',
                  background: bg,
                  color,
                  padding: '6px 18px',
                  borderRadius: 9999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Modal({ open, title, onClose, children, maxWidth = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 63, 64, 0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="cs-card"
        style={{ width: '100%', maxWidth, position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F3F40' }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#6B8585',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        paddingTop: 14,
        borderTop: '1px solid #EDF3F2',
        fontSize: 13,
        color: '#6B8585',
      }}
    >
      <span>
        Page {meta.current_page} of {meta.last_page} ({meta.total} records)
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="outline"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          style={{ padding: '6px 14px', fontSize: 12.5 }}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
          style={{ padding: '6px 14px', fontSize: 12.5 }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
