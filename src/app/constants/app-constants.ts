export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for HTTP access through a local network IP
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const OtpType = {
  USER_CREATION: 'USER_CREATION',
  ACCOUNT_BLOCK: 'ACCOUNT_BLOCK',
  ACCOUNT_DELETE: 'ACCOUNT_DELETE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  TWO_FACTOR_AUTHENTICATION: 'TWO_FACTOR_AUTHENTICATION'
} as const;


export const UserRoles = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  CUSTOMER_CARE: 'CUSTOMER_CARE',
  MAINTAINER: 'MAINTAINER'
} as const;