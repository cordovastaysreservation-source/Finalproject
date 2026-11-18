// Shared Design Tokens matching Cordova Stays Figma Screenshots
export const tokens = {
  colors: {
    primaryTeal: '#0A7F82',
    primaryTealDark: '#0B6E75',
    darkTeal: '#0F3F40',
    mutedText: '#6B8585',
    pageBg: '#F4F8F7',
    cardBg: '#FFFFFF',
    cardBorder: '#DCE7E5',
    activePillBg: '#DAF3EE',
    adminSidebarBg: '#153B3B',
    adminActiveBg: '#277F70',
    paymentBannerBg: '#9ACFB7',
    warningBoxBg: '#FFF6E3',
    warningBoxBorder: '#EBD3A7',
    warningBoxText: '#8A5A19',
    badgeSuccessBg: '#DDF3EC',
    badgeSuccessText: '#0F6E75',
    badgeWarningBg: '#F9E8C2',
    badgeWarningText: '#7A5214',
    badgeDangerBg: '#FADCD9',
    badgeDangerText: '#A82E2E',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    pill: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export const formatCurrency = (amount, decimals = 0) => {
  const num = Number(amount || 0);
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatShortDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '20–22 Oct 2026';
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '20–22 Oct 2026';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${d1.getDate()}–${d2.getDate()} ${months[d1.getMonth()]} ${d1.getFullYear()}`;
  }
  return `${d1.getDate()} ${months[d1.getMonth()]} – ${d2.getDate()} ${months[d2.getMonth()]} ${d2.getFullYear()}`;
};

export const formatSingleDate = (dateStr) => {
  if (!dateStr) return 'Select date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
