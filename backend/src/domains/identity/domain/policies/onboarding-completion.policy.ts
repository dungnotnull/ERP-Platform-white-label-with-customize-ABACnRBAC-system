export function canCompleteOnboarding(user: { name: string; email: string }): boolean {
  return !!user.name && !!user.email;
}
