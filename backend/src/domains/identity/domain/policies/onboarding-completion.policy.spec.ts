import { canCompleteOnboarding } from './onboarding-completion.policy';

describe('canCompleteOnboarding', () => {
  it('should return true when name and email are filled', () => {
    expect(canCompleteOnboarding({ name: 'John', email: 'john@example.com' })).toBe(true);
  });

  it('should return false when name is empty', () => {
    expect(canCompleteOnboarding({ name: '', email: 'john@example.com' })).toBe(false);
  });

  it('should return false when name is null', () => {
    expect(canCompleteOnboarding({ name: null as unknown as string, email: 'john@example.com' })).toBe(false);
  });

  it('should return false when email is empty', () => {
    expect(canCompleteOnboarding({ name: 'John', email: '' })).toBe(false);
  });

  it('should return false when email is null', () => {
    expect(canCompleteOnboarding({ name: 'John', email: null as unknown as string })).toBe(false);
  });

  it('should return false when both name and email are empty', () => {
    expect(canCompleteOnboarding({ name: '', email: '' })).toBe(false);
  });
});
