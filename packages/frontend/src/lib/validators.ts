// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 강도 검사
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('최소 8자 이상이어야 합니다');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('소문자를 포함해야 합니다');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('대문자를 포함해야 합니다');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('숫자를 포함해야 합니다');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('특수문자를 포함해야 합니다');
  }

  return { score, feedback };
};

// URL 유효성 검사
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 프로젝트 이름 유효성 검사
export const isValidProjectName = (name: string): boolean => {
  // 1-50자, 영문, 숫자, 하이픈, 언더스코어만 허용
  const projectNameRegex = /^[a-zA-Z0-9가-힣\s_-]{1,50}$/;
  return projectNameRegex.test(name);
};

// 사용자명 유효성 검사
export const isValidUsername = (username: string): boolean => {
  // 3-20자, 영문, 숫자, 언더스코어만 허용
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// 파일 타입 검사
export const isValidImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
};

export const isValidFileSize = (file: File, maxSizeInMB: number = 5): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

// JSON 유효성 검사
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// 도메인 이름 유효성 검사
export const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(domain);
};

// 태그 유효성 검사
export const isValidTag = (tag: string): boolean => {
  // 1-20자, 영문, 숫자, 하이픈만 허용
  const tagRegex = /^[a-zA-Z0-9가-힣-]{1,20}$/;
  return tagRegex.test(tag);
};

// 색상 코드 유효성 검사
export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

// 전화번호 유효성 검사 (한국)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

// 사업자등록번호 유효성 검사 (한국)
export const isValidBusinessNumber = (number: string): boolean => {
  const businessNumberRegex = /^\d{3}-?\d{2}-?\d{5}$/;
  return businessNumberRegex.test(number);
};