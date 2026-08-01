import { EmailVo } from './email.vo';

describe('EmailVo', () => {
  describe('create()', () => {
    it('should return EmailVo for a valid email', () => {
      const email = EmailVo.create('John@Example.COM');

      expect(email.value).toBe('john@example.com');
    });

    it('should lowercase the email', () => {
      const email = EmailVo.create('User@Domain.IO');

      expect(email.value).toBe('user@domain.io');
    });

    it('should throw for invalid email without @ sign', () => {
      expect(() => EmailVo.create('no-at-sign')).toThrow('Invalid email format');
    });

    it('should throw for empty string', () => {
      expect(() => EmailVo.create('')).toThrow('Invalid email format');
    });

    it('should throw for email missing domain', () => {
      expect(() => EmailVo.create('user@')).toThrow('Invalid email format');
    });

    it('should throw for email missing TLD', () => {
      expect(() => EmailVo.create('user@domain')).toThrow('Invalid email format');
    });
  });

  describe('equals()', () => {
    it('should return true for same email value', () => {
      const a = EmailVo.create('test@example.com');
      const b = EmailVo.create('test@example.com');

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different email values', () => {
      const a = EmailVo.create('alice@example.com');
      const b = EmailVo.create('bob@example.com');

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when comparing to undefined', () => {
      const a = EmailVo.create('test@example.com');

      expect(a.equals(undefined)).toBe(false);
    });

    it('should return false when comparing to null', () => {
      const a = EmailVo.create('test@example.com');

      expect(a.equals(null as unknown as EmailVo)).toBe(false);
    });
  });
});
