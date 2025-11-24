import * as crypto from 'crypto';

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, passwordHash };
};

export const verifyPassword = (password: string, passwordHash: string, salt: string): boolean => {
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return passwordHash === hashToVerify;
};