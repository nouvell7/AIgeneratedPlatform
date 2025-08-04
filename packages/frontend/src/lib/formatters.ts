// 날짜 포맷팅 유틸리티
export const formatDate = (date: string | Date, locale: string = 'ko-KR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date, locale: string = 'ko-KR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date, locale: string = 'ko-KR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else {
    return formatDate(dateObj, locale);
  }
};

// 숫자 포맷팅 유틸리티
export const formatNumber = (num: number, locale: string = 'ko-KR'): string => {
  return num.toLocaleString(locale);
};

export const formatCurrency = (
  amount: number,
  currency: string = 'KRW',
  locale: string = 'ko-KR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 텍스트 포맷팅 유틸리티
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백과 언더스코어를 하이픈으로
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
};

// URL 유틸리티
export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch (_) {
    return '';
  }
};

// 색상 유틸리티
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'text-gray-500 bg-gray-100',
    developing: 'text-blue-500 bg-blue-100',
    deployed: 'text-green-500 bg-green-100',
    archived: 'text-red-500 bg-red-100',
  };
  return colors[status] || 'text-gray-500 bg-gray-100';
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    beginner: 'text-green-600 bg-green-100',
    intermediate: 'text-yellow-600 bg-yellow-100',
    advanced: 'text-red-600 bg-red-100',
  };
  return colors[difficulty] || 'text-gray-500 bg-gray-100';
};